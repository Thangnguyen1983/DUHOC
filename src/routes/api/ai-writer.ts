import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type PipelineInput = {
  topic: string;
  keyword: string;
  region?: string;
  contentType?: string;
  length?: string;
  tone?: string;
  notes?: string;
};

type PipelineProgress =
  | { type: "step_start"; step: number; label: string }
  | { type: "step_done"; step: number; label: string; data?: unknown }
  | { type: "warning"; message: string }
  | { type: "final"; result: unknown }
  | { type: "error"; message: string };

const ALLOWED_ROLES = ["admin", "editor", "content", "seo", "marketing"] as const;

async function authorize(request: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Chưa đăng nhập.", status: 401 };
  }
  const token = authHeader.slice("Bearer ".length);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { error: "Supabase chưa cấu hình.", status: 500 };

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return { error: "Token không hợp lệ.", status: 401 };

  // Check role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const roleSet = new Set((roles ?? []).map((r) => r.role as string));
  const hasAccess = ALLOWED_ROLES.some((r) => roleSet.has(r));
  if (!hasAccess) return { error: "Bạn không có quyền dùng AI Writer.", status: 403 };
  return { userId: userData.user.id };
}

function sseEvent(data: PipelineProgress): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export const Route = createFileRoute("/api/ai-writer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authorize(request);
        if ("error" in auth) {
          return new Response(JSON.stringify({ error: auth.error }), {
            status: auth.status,
            headers: { "content-type": "application/json" },
          });
        }

        let input: PipelineInput;
        try {
          const body = (await request.json()) as PipelineInput;
          if (!body.topic || !body.keyword) {
            return new Response(JSON.stringify({ error: "Thiếu topic hoặc keyword." }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }
          input = body;
        } catch {
          return new Response(JSON.stringify({ error: "Body không hợp lệ." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const send = (p: PipelineProgress) => {
              try {
                controller.enqueue(encoder.encode(sseEvent(p)));
              } catch {}
            };
            try {
              const { runPipeline } = await import("@/lib/ai-writer/pipeline.server");
              await runPipeline(input, send);
            } catch (e) {
              send({ type: "error", message: (e as Error).message });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});
