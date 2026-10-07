import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("logo_url,updated_at")
    .eq("id", true)
    .maybeSingle();
  return { logo_url: data?.logo_url ?? null, updated_at: data?.updated_at ?? null };
});

const DATA_URL_RE = /^data:(image\/png|image\/jpeg|image\/svg\+xml);base64,[A-Za-z0-9+/=]+$/;

export const updateLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        logo_url: z
          .string()
          .max(1_700_000, "Ảnh quá lớn, tối đa 1.2MB")
          .refine((v) => DATA_URL_RE.test(v), "Định dạng không hợp lệ — chỉ chấp nhận PNG, JPG hoặc SVG")
          .nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin được đổi logo");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ id: true, logo_url: data.logo_url, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });
