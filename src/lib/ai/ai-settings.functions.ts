import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/rbac/guard";

const PROVIDERS = ["openai", "gemini", "anthropic"] as const;

/** Trạng thái cấu hình AI: hãng đang chọn, mẫu, hãng nào đã có khoá (không bao giờ trả khoá). */
export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPermission(context, "ai.settings");
    const { readAiConfig, providerKey, PROVIDER_INFO } = await import("./external-ai.server");
    const cfg = await readAiConfig();
    const providers = PROVIDERS.map((p) => ({
      id: p,
      label: PROVIDER_INFO[p].label,
      secret: PROVIDER_INFO[p].secret,
      hasKey: !!providerKey(p),
      defaultModel: PROVIDER_INFO[p].chat,
      defaultImageModel: PROVIDER_INFO[p].image,
    }));
    return { config: cfg, providers };
  });

export const saveAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      mode: z.enum(["lovable", "external"]),
      provider: z.enum(PROVIDERS),
      model: z.string().trim().max(80),
      image_provider: z.enum(["openai", "gemini"]),
      image_model: z.string().trim().max(80),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context, "ai.settings");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ id: true, ai_config: data, updated_at: new Date().toISOString() } as any);
    if (error) throw new Error("Không lưu được cài đặt AI");
    return { ok: true };
  });

/** Gửi một câu ngắn để kiểm tra khoá và mẫu đang chọn. */
export const testAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPermission(context, "ai.settings");
    const { aiFetch, AiConfigError } = await import("./external-ai.server");
    try {
      const res = await aiFetch("/chat/completions", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "Trả lời đúng một từ: OK" }] }),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, message: "Khoá API bị từ chối. Kiểm tra lại khoá." };
      if (res.status === 404) return { ok: false, message: "Không tìm thấy mẫu AI. Kiểm tra tên mẫu." };
      if (res.status === 429) return { ok: false, message: "Tài khoản AI đang bị giới hạn hoặc hết hạn mức." };
      if (!res.ok) return { ok: false, message: `Hãng AI báo lỗi (mã ${res.status}).` };
      const json: any = await res.json();
      return { ok: true, message: `Kết nối thành công: ${String(json?.choices?.[0]?.message?.content ?? "").slice(0, 60)}` };
    } catch (e: any) {
      return { ok: false, message: e instanceof AiConfigError ? e.message : "Không kết nối được tới hãng AI." };
    }
  });
