import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Hồ sơ cán bộ nhân viên (CBNV) + phân công phạm vi phòng ban.
 * Theo sơ đồ "Quản lý hồ sơ xuất cảnh": mức quyền chỉ đọc / gửi báo cáo / toàn quyền theo đơn vị.
 */

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden — chỉ admin được phép thao tác");
}

const staffProfileSchema = z.object({
  user_id: z.string().uuid(),
  id_no: z.string().max(30).nullable().optional().or(z.literal("")),
  dob: z.string().nullable().optional().or(z.literal("")),
  phone: z.string().max(30).nullable().optional().or(z.literal("")),
  education_level: z.string().max(200).nullable().optional().or(z.literal("")),
  pro_certificate_du_hoc: z.string().max(500).nullable().optional().or(z.literal("")),
  pro_certificate_xkld: z.string().max(500).nullable().optional().or(z.literal("")),
  department_id: z.string().uuid().nullable().optional().or(z.literal("")),
  job_title_id: z.string().uuid().nullable().optional().or(z.literal("")),
});

export const getStaffProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("staff_profiles")
      .select("*")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertStaffProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => staffProfileSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      user_id: data.user_id,
      id_no: data.id_no || null,
      dob: data.dob || null,
      phone: data.phone || null,
      education_level: data.education_level || null,
      pro_certificate_du_hoc: data.pro_certificate_du_hoc || null,
      pro_certificate_xkld: data.pro_certificate_xkld || null,
      department_id: data.department_id || null,
      job_title_id: data.job_title_id || null,
    };
    const { error } = await supabaseAdmin
      .from("staff_profiles")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ACCESS_LEVELS = ["read", "report", "full"] as const;

export const listDepartmentScope = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("staff_department_scope")
      .select("id, department_id, access_level, catalog_departments(name, code)")
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertDepartmentScope = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      department_id: z.string().uuid(),
      access_level: z.enum(ACCESS_LEVELS),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("staff_department_scope")
      .upsert(
        { user_id: data.user_id, department_id: data.department_id, access_level: data.access_level },
        { onConflict: "user_id,department_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDepartmentScope = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("staff_department_scope").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const ACCESS_LEVEL_LABEL: Record<string, string> = {
  read: "Chỉ đọc",
  report: "Gửi báo cáo",
  full: "Toàn quyền",
};
