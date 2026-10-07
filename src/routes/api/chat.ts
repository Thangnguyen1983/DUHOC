import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

type ChatRequestBody = { messages?: unknown; conversationId?: string };

// Rate limit đơn giản theo IP (in-memory, mỗi worker)
const RATE_BUCKET = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_BUCKET.get(ip);
  if (!entry || entry.resetAt < now) {
    RATE_BUCKET.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

function isValidConversationId(id: string | undefined): id is string {
  return !!id && /^[0-9a-f-]{8,}$/i.test(id);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";
        if (!checkRateLimit(ip)) {
          return new Response(JSON.stringify({ error: "rate_limited" }), {
            status: 429,
            headers: { "content-type": "application/json" },
          });
        }

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const conversationId = isValidConversationId(body.conversationId) ? body.conversationId : undefined;
        if (!Array.isArray(messages)) {
          return new Response("messages required", { status: 400 });
        }

        const key = "kaizen-external-ai";
        if (!key) {
          return new Response(JSON.stringify({ error: "no_api_key" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
        const [{ createLovableAiGatewayProvider, getLovableAiGatewayRunId }, { buildSystemPrompt, hashIp }] =
          await Promise.all([
            import("@/lib/ai-gateway.server"),
            import("@/lib/chatbot/runtime.server"),
          ]);
        const ipHashPromise = hashIp(ip);

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);
        const model = gateway("google/gemini-3-flash-preview");

        const systemPrompt = await buildSystemPrompt();

        const captureLead = tool({
          description:
            "Lưu thông tin liên hệ của khách hàng vào CRM Kaizen ngay khi khách cung cấp số điện thoại. Bắt buộc gọi khi có số điện thoại hợp lệ.",
          inputSchema: z.object({
            full_name: z.string().trim().max(120).optional().describe("Họ và tên khách"),
            phone: z
              .string()
              .trim()
              .regex(/^0\d{9,10}$/, "SĐT Việt Nam, bắt đầu bằng 0, 10-11 chữ số")
              .describe("Số điện thoại Việt Nam"),
            email: z.string().trim().email().max(200).optional(),
            program: z
              .enum([
                "du-hoc-nhat",
                "du-hoc-han",
                "du-hoc-duc",
                "du-hoc-dai-loan",
                "du-hoc-canada",
                "xkld-nhat",
                "xkld-han",
                "xkld-duc",
                "xkld-dai-loan",
                "ngoai-ngu",
                "outsourcing",
                "khac",
              ])
              .optional()
              .describe("Chương trình quan tâm"),
            market: z.string().trim().max(40).optional().describe("Thị trường (nhat/han/duc/dai-loan/canada...)"),
            note: z.string().trim().max(500).optional().describe("Ghi chú thêm từ hội thoại"),
          }),
          execute: async (args) => {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { error } = await supabaseAdmin.from("consultations").insert({
                full_name: args.full_name || "Khách chatbot",
                phone: args.phone,
                email: args.email || null,
                program: args.program || "khac",
                market: args.market || null,
                message: args.note || null,
                source: "chatbot",
                conversation_id: conversationId ?? null,
              });
              if (error) {
                console.error("[capture_lead] insert failed", error);
                return { ok: false, error: error.message };
              }
              // Fire-and-forget Telegram notification
              import("@/lib/telegram.server")
                .then(({ sendTelegramMessage, formatLeadMessage }) =>
                  sendTelegramMessage(
                    formatLeadMessage({
                      full_name: args.full_name || "Khách chatbot",
                      phone: args.phone,
                      email: args.email || null,
                      program: args.program || "khac",
                      market: args.market || null,
                      message: args.note || null,
                      source: "Chatbot",
                      conversation_id: conversationId ?? null,
                    }),
                  ),
                )
                .catch((err) => console.error("telegram notify failed", err));
              return { ok: true, message: "Đã lưu thông tin, tư vấn viên sẽ liên hệ trong 24h." };
            } catch (e) {
              console.error("[capture_lead] threw", e);
              return { ok: false, error: e instanceof Error ? e.message : "unknown" };
            }
          },
        });

        const result = streamText({
          model,
          system: systemPrompt,
          messages: await convertToModelMessages(messages as UIMessage[]),
          tools: { capture_lead: captureLead },
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          onFinish: async ({ messages: finalMessages }) => {
            if (!conversationId) return;
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const ipHash = await ipHashPromise;
              const lastCaptured = finalMessages.some((m) =>
                m.parts?.some(
                  (p: any) =>
                    (p.type === "tool-capture_lead" || p.type === "tool-call") &&
                    (p.state === "output-available" || p.output?.ok === true),
                ),
              );

              await supabaseAdmin
                .from("chat_conversations")
                .upsert(
                  {
                    id: conversationId,
                    ip_hash: ipHash,
                    user_agent: userAgent,
                    message_count: finalMessages.length,
                    last_message_at: new Date().toISOString(),
                    lead_captured: lastCaptured,
                  },
                  { onConflict: "id" },
                );

              // Lấy số tin đã lưu để chèn các tin mới
              const { data: existing } = await supabaseAdmin
                .from("chat_messages")
                .select("id", { count: "exact", head: false })
                .eq("conversation_id", conversationId);
              const existingCount = existing?.length ?? 0;
              const newOnes = finalMessages.slice(existingCount);
              if (newOnes.length > 0) {
                const rows = newOnes.map((m) => {
                  const content =
                    m.parts
                      ?.map((p: any) => {
                        if (p.type === "text") return p.text;
                        if (p.type?.startsWith?.("tool-")) return `[TOOL:${p.type}]`;
                        return "";
                      })
                      .join("")
                      .slice(0, 4000) ?? "";
                  return {
                    conversation_id: conversationId,
                    role: m.role,
                    content,
                    has_cta: /\[\[CTA:/.test(content),
                  };
                });
                await supabaseAdmin.from("chat_messages").insert(rows);
              }
            } catch (e) {
              console.error("[chat persist] failed", e);
            }
          },
        });
      },
    },
  },
});
