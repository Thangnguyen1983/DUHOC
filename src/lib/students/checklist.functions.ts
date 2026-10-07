import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";
import { assertStudentDepartment } from "@/lib/students/department-access.server";
import { limitToDepartments, studentDepartmentAccess } from "@/lib/students/department-access.server";



async function assertStaff(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "students.view");
}

export const CHECKLIST_STATUS = ["missing", "submitted", "verified", "rejected", "na"] as const;
export type ChecklistStatus = (typeof CHECKLIST_STATUS)[number];

export const CHECKLIST_STAGES = ["dang_ky", "dao_tao", "visa", "xuat_canh", "sau_xuat_canh"] as const;
export type ChecklistStage = (typeof CHECKLIST_STAGES)[number];

export const CHECKLIST_STAGE_LABEL: Record<ChecklistStage, string> = {
  dang_ky: "Đăng ký",
  dao_tao: "Đào tạo",
  visa: "Visa",
  xuat_canh: "Xuất cảnh",
  sau_xuat_canh: "Sau xuất cảnh",
};

export const PROGRAM_TYPES = ["du_hoc", "xkld", "thuc_tap_sinh"] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];
export const PROGRAM_TYPE_LABEL: Record<ProgramType, string> = {
  du_hoc: "Du học",
  xkld: "XKLĐ",
  thuc_tap_sinh: "Thực tập sinh",
};

export const CHECKLIST_STATUS_LABEL: Record<ChecklistStatus, string> = {
  missing: "Thiếu",
  submitted: "Đã nộp",
  verified: "Đã duyệt",
  rejected: "Cần bổ sung",
  na: "Không áp dụng",
};

/** % hoàn thiện: chỉ tính giấy tờ bắt buộc & còn áp dụng. */
export function checklistProgress(items: Array<{ is_required: boolean; status: string }>) {
  const required = items.filter((i) => i.is_required && i.status !== "na");
  const done = required.filter((i) => i.status === "verified").length;
  const submitted = required.filter((i) => i.status === "submitted").length;
  const missing = required.filter((i) => i.status === "missing").length;
  const rejected = required.filter((i) => i.status === "rejected").length;
  const percent = required.length ? Math.round((done / required.length) * 100) : 0;
  return { total: required.length, done, submitted, missing, rejected, percent };
}

const idInput = z.object({ student_profile_id: z.string().uuid() });

export const getStudentChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    await assertStudentDepartment(context, data.student_profile_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items, error } = await supabaseAdmin
      .from("student_document_checklist")
      .select("*")
      .eq("student_profile_id", data.student_profile_id)
      .order("is_required", { ascending: false })
      .order("sort_order")
      .order("doc_name");
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });

/** Sinh checklist theo danh mục loại hồ sơ của thị trường (bỏ qua mục đã có). */
export const syncStudentChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    await assertStudentDepartment(context, data.student_profile_id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: added, error } = await supabaseAdmin.rpc("sync_student_checklist", {
      _student_profile_id: data.student_profile_id,
    });
    if (error) throw new Error(error.message);
    return { added: (added as number) ?? 0 };
  });

const updateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(CHECKLIST_STATUS).optional(),
  note: z.string().max(1000).nullable().optional(),
  is_required: z.boolean().optional(),
  document_id: z.string().uuid().nullable().optional(),
  stage: z.enum(CHECKLIST_STAGES).optional(),
  due_date: z.string().max(30).nullable().optional(),
  hard_copy_received: z.boolean().optional(),
});

export const updateChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateInput.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    await assertPermission(context, "students.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    const { id, ...rest } = data;
    const { data: before } = await supabaseAdmin
      .from("student_document_checklist")
      .select("id, student_profile_id, doc_name, status, stage, hard_copy_received")
      .eq("id", id)
      .maybeSingle();
    if (!before) throw new Error("Không tìm thấy mục bảng kiểm");
    await assertStudentDepartment(context, before.student_profile_id, true);
    const patch: any = { ...rest };
    if (rest.status) {
      const now = new Date().toISOString();
      patch.reviewed_by = context.userId;
      patch.reviewed_at = now;
      if (rest.status === "verified") {
        patch.verified_by = context.userId;
        patch.verified_at = now;
      } else {
        patch.verified_by = null;
        patch.verified_at = null;
      }
    }
    if (rest.due_date !== undefined) patch.due_date = rest.due_date || null;
    const { error } = await supabaseAdmin.from("student_document_checklist").update(patch).eq("id", id);

    if (error) throw new Error(error.message);

    if (before?.student_profile_id) {
      const entries: any[] = [];
      const base = {
        student_profile_id: before.student_profile_id,
        action: "checklist_update",
        actor_id: context.userId,
        actor_email: (context as any).claims?.email ?? null,
        actor_roles: roles,
        entity: "student_document_checklist",
        entity_id: id,
        stage: (rest.stage ?? before.stage) ?? null,
      };
      if (rest.status && rest.status !== before.status)
        entries.push({
          ...base,
          field: before.doc_name,
          old_value: CHECKLIST_STATUS_LABEL[before.status as ChecklistStatus] ?? before.status,
          new_value: CHECKLIST_STATUS_LABEL[rest.status] ?? rest.status,
          note: rest.note ?? null,
        });
      if (rest.hard_copy_received !== undefined && rest.hard_copy_received !== before.hard_copy_received)
        entries.push({
          ...base,
          field: `${before.doc_name} — bản cứng`,
          old_value: before.hard_copy_received ? "Đã nhận" : "Chưa nhận",
          new_value: rest.hard_copy_received ? "Đã nhận" : "Chưa nhận",
        });
      if (entries.length) await logStudentActivity(entries);
    }
    return { ok: true };
  });

export const addChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        student_profile_id: z.string().uuid(),
        doc_code: z.string().trim().min(1).max(60),
        doc_name: z.string().trim().min(1).max(160),
        is_required: z.boolean().default(true),
        stage: z.enum(CHECKLIST_STAGES).default("dang_ky"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    await assertPermission(context, "students.manage");
    await assertStudentDepartment(context, data.student_profile_id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("student_document_checklist").insert(data);
    if (error) throw new Error(error.message);
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({
      student_profile_id: data.student_profile_id,
      action: "checklist_add",
      actor_id: context.userId,
      actor_email: (context as any).claims?.email ?? null,
      actor_roles: roles,
      stage: data.stage,
      field: data.doc_name,
      new_value: data.is_required ? "Bắt buộc" : "Tuỳ chọn",
    });
    return { ok: true };
  });

export const deleteChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    await assertPermission(context, "students.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: before } = await supabaseAdmin
      .from("student_document_checklist")
      .select("student_profile_id, doc_name, stage")
      .eq("id", data.id)
      .maybeSingle();
    if (!before) throw new Error("Không tìm thấy mục bảng kiểm");
    await assertStudentDepartment(context, before.student_profile_id, true);
    const { error } = await supabaseAdmin.from("student_document_checklist").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (before?.student_profile_id) {
      const { logStudentActivity } = await import("@/lib/students/activity.server");
      await logStudentActivity({
        student_profile_id: before.student_profile_id,
        action: "checklist_remove",
        actor_id: context.userId,
        actor_email: (context as any).claims?.email ?? null,
        actor_roles: roles,
        stage: before.stage ?? null,
        field: before.doc_name,
        old_value: "Có trong checklist",
        new_value: "Đã xoá",
      });
    }
    return { ok: true };
  });


/** Học viên xem checklist hồ sơ của chính mình. */
export const getMyChecklist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("student_profiles")
      .select("id, full_name, country, visa_status")
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!profile) return { profile: null, items: [] };
    const { data: items } = await supabaseAdmin
      .from("student_document_checklist")
      .select("id, doc_code, doc_name, is_required, status, note, updated_at")
      .eq("student_profile_id", profile.id)
      .order("is_required", { ascending: false })
      .order("sort_order");
    return { profile, items: items ?? [] };
  });

/* ================= Thống kê visa ================= */
export const getVisaStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        from: z.string().max(30).optional(),
        to: z.string().max(30).optional(),
        market: z.string().max(50).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = limitToDepartments(supabaseAdmin
      .from("student_profiles")
      .select("id, full_name, country, visa_status, assigned_to, created_at, updated_at")
      .is("deleted_at", null)
      .limit(5000), await studentDepartmentAccess(context));
    if (data.market) q = q.eq("country", data.market);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    const byStatus: Record<string, number> = {};
    const byMarket: Record<string, { total: number; granted: number; rejected: number; pending: number }> = {};
    const byOfficer: Record<string, { total: number; granted: number; rejected: number }> = {};
    const byMonth: Record<string, { granted: number; rejected: number }> = {};

    for (const r of list) {
      const st = r.visa_status ?? "none";
      byStatus[st] = (byStatus[st] ?? 0) + 1;

      const mk = r.country || "Chưa rõ";
      byMarket[mk] ??= { total: 0, granted: 0, rejected: 0, pending: 0 };
      byMarket[mk].total++;
      if (st === "granted") byMarket[mk].granted++;
      else if (st === "rejected") byMarket[mk].rejected++;
      else if (st !== "none") byMarket[mk].pending++;

      if (st === "granted" || st === "rejected") {
        const off = r.assigned_to ?? "unassigned";
        byOfficer[off] ??= { total: 0, granted: 0, rejected: 0 };
        byOfficer[off].total++;
        byOfficer[off][st === "granted" ? "granted" : "rejected"]++;

        const m = (r.updated_at ?? r.created_at ?? "").slice(0, 7);
        if (m) {
          byMonth[m] ??= { granted: 0, rejected: 0 };
          byMonth[m][st === "granted" ? "granted" : "rejected"]++;
        }
      }
    }

    const officerIds = Object.keys(byOfficer).filter((k) => k !== "unassigned");
    let names: Record<string, string> = {};
    if (officerIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", officerIds);
      names = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name ?? p.id]));
    }

    return {
      total: list.length,
      byStatus,
      markets: Object.entries(byMarket)
        .map(([market, v]) => ({ market, ...v }))
        .sort((a, b) => b.total - a.total),
      officers: Object.entries(byOfficer)
        .map(([id, v]) => ({
          id,
          name: id === "unassigned" ? "Chưa phân công" : (names[id] ?? id.slice(0, 8)),
          ...v,
          rate: v.total ? Math.round((v.granted / v.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total),
      months: Object.entries(byMonth)
        .map(([month, v]) => ({ month, ...v }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  });
