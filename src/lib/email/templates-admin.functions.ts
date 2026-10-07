import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId, _role: "admin" as any,
  });
  if (!isAdmin) throw new Error("Không có quyền");
}

/** Danh sách template có thể tuỳ chỉnh + override đang active. */
export const listEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { TEMPLATES, TEMPLATE_VARIABLES } = await import("@/lib/email-templates/registry");
    const names = Object.keys(TEMPLATES);
    const { data: overrides } = await context.supabase
      .from("email_template_overrides")
      .select("template_name, subject, intro_markdown, version, is_active, created_at")
      .in("template_name", names)
      .eq("is_active", true);
    return {
      templates: names.map((name) => {
        const tpl = (TEMPLATES as any)[name];
        const ov = overrides?.find((o) => o.template_name === name) ?? null;
        return {
          name,
          displayName: tpl.displayName ?? name,
          defaultSubject: typeof tpl.subject === "function" ? "(động — thay đổi theo dữ liệu)" : tpl.subject,
          variables: TEMPLATE_VARIABLES[name] ?? [],
          activeOverride: ov,
        };
      }),
    };
  });

/** Lịch sử phiên bản của một template. */
export const listTemplateVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("email_template_overrides")
      .select("id, subject, intro_markdown, version, is_active, note, created_at, created_by")
      .eq("template_name", data.name)
      .order("version", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

/** Lưu 1 version mới; tuỳ chọn activate luôn (deactivate các version khác). */
export const saveTemplateVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; subject: string; introMarkdown: string; note?: string; activate?: boolean }) =>
    z.object({
      name: z.string().min(1).max(100),
      subject: z.string().min(1).max(300),
      introMarkdown: z.string().max(10000),
      note: z.string().max(500).optional(),
      activate: z.boolean().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    if (!(TEMPLATES as any)[data.name]) throw new Error("Template không tồn tại");

    const { data: latest } = await context.supabase
      .from("email_template_overrides")
      .select("version").eq("template_name", data.name)
      .order("version", { ascending: false }).limit(1).maybeSingle();
    const nextVersion = (latest?.version ?? 0) + 1;

    if (data.activate) {
      await context.supabase.from("email_template_overrides")
        .update({ is_active: false }).eq("template_name", data.name).eq("is_active", true);
    }

    const { data: inserted, error } = await context.supabase
      .from("email_template_overrides").insert({
        template_name: data.name,
        subject: data.subject,
        intro_markdown: data.introMarkdown,
        version: nextVersion,
        is_active: !!data.activate,
        note: data.note ?? null,
        created_by: context.userId,
      }).select("id, version, is_active").single();
    if (error) throw new Error(error.message);
    return inserted;
  });

/** Kích hoạt 1 version cụ thể (deactivate các version cùng template khác). */
export const activateTemplateVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row } = await context.supabase.from("email_template_overrides")
      .select("template_name").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Không tìm thấy");
    await context.supabase.from("email_template_overrides")
      .update({ is_active: false }).eq("template_name", row.template_name).eq("is_active", true);
    const { error } = await context.supabase.from("email_template_overrides")
      .update({ is_active: true }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Tắt override — trở về template mặc định. */
export const deactivateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("email_template_overrides")
      .update({ is_active: false }).eq("template_name", data.name).eq("is_active", true);
    return { ok: true };
  });
