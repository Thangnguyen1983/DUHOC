import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/rbac/guard";
import { studentDepartmentAccess, assertStudentDepartment } from "@/lib/students/department-access.server";
import { resolveCollaborator } from "./commissions.server";

export const COMMISSION_STATUS = ["pending", "approved", "paid", "cancelled"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUS)[number];

const CODE = z.string().trim().min(6).max(40);
const MONEY = z.number().int().min(0).max(100_000_000_000);

/** Kiểm tra nhanh mã CTV khi cán bộ nhập hồ sơ. */
export const lookupCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: CODE }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPermission(context, "students.view");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const c = await resolveCollaborator(supabaseAdmin, data.code);
      return { ok: true as const, code: c.collaborator_code, name: c.display_name ?? c.collaborator_code };
    } catch (e: any) {
      return { ok: false as const, error: e.message as string };
    }
  });

const CreateInput = z.object({
  student_profile_id: z.string().uuid(),
  collaborator_code: CODE,
  order_title: z.string().trim().max(200).optional().or(z.literal("")),
  order_revenue: MONEY.default(0),
  commission_amount: MONEY.default(0),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Ghi nhận đơn hàng giới thiệu + hoa hồng (trạng thái Chờ duyệt). */
export const createCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertPermission(context, "students.manage");
    await assertStudentDepartment(context, data.student_profile_id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordCommission } = await import("./record.server");
    const id = await recordCommission(supabaseAdmin, { ...data, actor: context.userId });
    return { id };
  });

/** Hoa hồng của một học viên (hiện trong trang chi tiết). */
export const listStudentCommissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_profile_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPermission(context, "students.view");
    await assertStudentDepartment(context, data.student_profile_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("collaborator_commissions")
      .select("id, collaborator_code, order_title, order_revenue, commission_amount, status, created_at, paid_at, payment_reference, sales_agents(display_name)")
      .eq("student_profile_id", data.student_profile_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Không tải được hoa hồng");
    return { items: rows ?? [] };
  });

/** Trang đối soát: danh sách hoa hồng theo phạm vi phòng ban. */
export const listCommissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.enum(COMMISSION_STATUS).optional(), search: z.string().trim().max(80).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context, "commissions.view");
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("collaborator_commissions")
      .select("id, collaborator_id, collaborator_code, order_title, program_type, order_revenue, commission_amount, status, note, created_at, approved_at, paid_at, payment_reference, sales_agents(display_name), student_profiles!inner(id, student_code, full_name, country, department_id)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data.status) q = q.eq("status", data.status);
    if (!scope.all) q = q.in("student_profiles.department_id", scope.readable.length ? scope.readable : ["00000000-0000-0000-0000-000000000000"]);
    const { data: rows, error } = await q;
    if (error) throw new Error("Không tải được danh sách hoa hồng");
    let items = rows ?? [];
    if (data.search) {
      const s = data.search.toLowerCase();
      items = items.filter((r: any) =>
        [r.collaborator_code, r.sales_agents?.display_name, r.student_profiles?.full_name, r.student_profiles?.student_code, r.order_title]
          .some((v) => (v ?? "").toString().toLowerCase().includes(s)),
      );
    }
    return { items };
  });

/** Duyệt / xác nhận chi trả / huỷ hoa hồng. */
export const updateCommissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(COMMISSION_STATUS),
      payment_reference: z.string().trim().max(120).optional().or(z.literal("")),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context, "commissions.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin
      .from("collaborator_commissions").select("status, student_profile_id").eq("id", data.id).maybeSingle();
    if (!cur) throw new Error("Không tìm thấy khoản hoa hồng");
    await assertStudentDepartment(context, cur.student_profile_id);
    if (cur.status === "paid" && data.status !== "paid") throw new Error("Khoản đã thanh toán không thể đổi trạng thái");
    if (data.status === "paid" && !data.payment_reference) throw new Error("Vui lòng nhập số chứng từ chi trả");
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "approved") Object.assign(patch, { approved_by: context.userId, approved_at: now });
    if (data.status === "paid") Object.assign(patch, { paid_by: context.userId, paid_at: now, payment_reference: data.payment_reference });
    const { error } = await supabaseAdmin.from("collaborator_commissions").update(patch as any).eq("id", data.id);
    if (error) throw new Error("Không cập nhật được trạng thái");
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({
      student_profile_id: cur.student_profile_id, action: "profile_update", actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null, entity: "collaborator_commissions",
      field: "Trạng thái hoa hồng CTV", old_value: cur.status, new_value: data.status,
    } as any);
    return { ok: true };
  });
