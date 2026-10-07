import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

/** Các vai trò được phép nhận bàn giao hồ sơ (danh sách nghiệp vụ, không dùng để kiểm quyền). */
const ASSIGNABLE_ROLES = [
  "admin",
  "training_manager",
  "consultant",
  "cskh",
  "visa_officer",
  "departure_coordinator",
  "teacher",
  "market_head",
] as const;


async function assertStaff(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "students.view", "audit.view");
}

export const ACTION_LABEL: Record<string, string> = {
  profile_create: "Tạo hồ sơ",
  profile_update: "Cập nhật hồ sơ",
  profile_assign: "Bàn giao phụ trách",
  placement_update: "Cập nhật nơi làm việc / hợp đồng",
  ocr_apply: "Lưu kết quả quét giấy tờ",
  care_log: "Ghi nhận chăm sóc",
  document_add: "Tải lên giấy tờ",
  document_verify: "Duyệt giấy tờ",
  checklist_update: "Cập nhật checklist",
  checklist_add: "Thêm mục checklist",
  checklist_remove: "Xoá mục checklist",
  workflow_advance: "Chuyển bước quy trình",
  enrollment_add: "Ghi danh lớp học",
  archive_store: "Nhập kho hồ sơ giấy",
  archive_move: "Di chuyển / mượn trả hồ sơ giấy",
  export_360: "Xuất hồ sơ 360°",
};

async function attachActorNames(supabaseAdmin: any, rows: any[]) {
  const ids = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  let names: Record<string, string> = {};
  let roles: Record<string, string[]> = {};
  if (ids.length) {
    const [{ data: profs }, { data: ur }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);
    names = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name]));
    (ur ?? []).forEach((r: any) => {
      (roles[r.user_id] ??= []).push(r.role);
    });
  }
  return rows.map((r) => ({
    ...r,
    actor_name: r.actor_id
      ? (names[r.actor_id] ?? r.actor_email ?? "Người dùng nội bộ")
      : "Hệ thống (tự động)",
    actor_role_list: r.actor_id ? (roles[r.actor_id] ?? r.actor_roles ?? []) : [],
    action_label: ACTION_LABEL[r.action] ?? r.action,
  }));
}

/** Dòng thời gian trách nhiệm của 1 hồ sơ (gộp nhật ký + đổi trạng thái + workflow). */
export const getStudentActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        student_profile_id: z.string().uuid(),
        actor_id: z.string().uuid().optional(),
        action: z.string().max(64).optional(),
        from: z.string().max(30).optional(),
        to: z.string().max(30).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { assertStudentDepartment } = await import("@/lib/students/department-access.server");
    await assertStudentDepartment(context, data.student_profile_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("student_activity_logs")
      .select("*")
      .eq("student_profile_id", data.student_profile_id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.actor_id) q = q.eq("actor_id", data.actor_id);
    if (data.action) q = q.eq("action", data.action);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);

    const [{ data: logs, error }, { data: history }, { data: steps }] = await Promise.all([
      q,
      supabaseAdmin
        .from("student_status_history")
        .select("id, from_status, to_status, actor_id, note, created_at")
        .eq("student_profile_id", data.student_profile_id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("workflow_step_logs")
        .select("id, step_key, from_status, to_status, actor_id, note, occurred_at")
        .eq("student_profile_id", data.student_profile_id)
        .order("occurred_at", { ascending: false })
        .limit(200),
    ]);
    if (error) throw new Error(error.message);

    const merged = [
      ...(logs ?? []).map((l: any) => ({ ...l, kind: "log" })),
      ...(history ?? []).map((h: any) => ({
        id: `h-${h.id}`,
        kind: "status",
        student_profile_id: data.student_profile_id,
        actor_id: h.actor_id,
        action: "profile_update",
        field: "Trạng thái hồ sơ",
        old_value: h.from_status,
        new_value: h.to_status,
        note: h.note,
        created_at: h.created_at,
      })),
      ...(steps ?? []).map((s: any) => ({
        id: `w-${s.id}`,
        kind: "workflow",
        student_profile_id: data.student_profile_id,
        actor_id: s.actor_id,
        action: "workflow_advance",
        field: "Bước quy trình",
        old_value: s.from_status,
        new_value: s.to_status ?? s.step_key,
        note: s.note,
        created_at: s.occurred_at,
      })),
    ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    const items = await attachActorNames(supabaseAdmin, merged);
    const actors = [
      ...new Map(
        items.filter((i) => i.actor_id).map((i) => [i.actor_id, { id: i.actor_id, name: i.actor_name }]),
      ).values(),
    ];
    return { items, actors };
  });

/** Tra soát nhật ký toàn hệ thống (dành cho quản lý). */
export const auditActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        q: z.string().max(120).optional(),
        actor_id: z.string().uuid().optional(),
        action: z.string().max(64).optional(),
        from: z.string().max(30).optional(),
        to: z.string().max(30).optional(),
        limit: z.number().int().min(1).max(500).default(200),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { studentDepartmentAccess, limitToDepartments } = await import("@/lib/students/department-access.server");
    const scope = await studentDepartmentAccess(context);
    const { data: allowed, error: allowedError } = await limitToDepartments(
      supabaseAdmin.from("student_profiles").select("id").limit(10000), scope);
    if (allowedError) throw new Error(allowedError.message);
    const allowedIds = (allowed ?? []).map((p) => p.id);
    if (!allowedIds.length) return { items: [], byActor: [] };

    let q = supabaseAdmin
      .from("student_activity_logs")
      .select("*, student_profiles(id, student_code, full_name)")
      .in("student_profile_id", allowedIds)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.actor_id) q = q.eq("actor_id", data.actor_id);
    if (data.action) q = q.eq("action", data.action);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let list = rows ?? [];
    const term = (data.q ?? "").trim().toLowerCase();
    if (term) {
      list = list.filter((r: any) => {
        const sp = r.student_profiles;
        return (
          (sp?.full_name ?? "").toLowerCase().includes(term) ||
          (sp?.student_code ?? "").toLowerCase().includes(term)
        );
      });
    }
    const items = await attachActorNames(supabaseAdmin, list);

    // tổng hợp theo nhân sự
    const byActor: Record<string, { name: string; count: number }> = {};
    items.forEach((i: any) => {
      const key = i.actor_id ?? "system";
      byActor[key] ??= { name: i.actor_name, count: 0 };
      byActor[key].count++;
    });

    return {
      items,
      byActor: Object.entries(byActor)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.count - a.count),
    };
  });

/** Danh sách nhân sự có thể nhận bàn giao hồ sơ. */
export const listAssignableStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ur } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ASSIGNABLE_ROLES as unknown as any[]);
    const ids = [...new Set((ur ?? []).map((r: any) => r.user_id))];
    if (!ids.length) return { items: [] };
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids);
    const rolesOf: Record<string, string[]> = {};
    (ur ?? []).forEach((r: any) => (rolesOf[r.user_id] ??= []).push(r.role));
    return {
      items: (profs ?? []).map((p: any) => ({
        id: p.id,
        name: p.full_name ?? p.id.slice(0, 8),
        roles: rolesOf[p.id] ?? [],
      })),
    };
  });

/** Bàn giao người phụ trách hồ sơ, có ghi vết đầy đủ. */
export const reassignStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        student_profile_id: z.string().uuid(),
        to_user_id: z.string().uuid(),
        reason: z.string().trim().min(3).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logStudentActivity } = await import("@/lib/students/activity.server");

    const { data: profile } = await supabaseAdmin
      .from("student_profiles")
      .select("id, full_name, student_code, assigned_to, current_status")
      .eq("id", data.student_profile_id)
      .maybeSingle();
    if (!profile) throw new Error("Không tìm thấy hồ sơ");

    const { error } = await supabaseAdmin
      .from("student_profiles")
      .update({ assigned_to: data.to_user_id, updated_by: context.userId } as never)
      .eq("id", data.student_profile_id);
    if (error) throw new Error(error.message);

    const names = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", [data.to_user_id, profile.assigned_to].filter(Boolean) as string[]);
    const nameOf = Object.fromEntries((names.data ?? []).map((p: any) => [p.id, p.full_name]));

    await logStudentActivity({
      student_profile_id: data.student_profile_id,
      action: "profile_assign",
      actor_id: context.userId,
      actor_email: (context as any).claims?.email ?? null,
      actor_roles: roles,
      stage: profile.current_status ?? null,
      field: "Người phụ trách",
      old_value: profile.assigned_to ? (nameOf[profile.assigned_to] ?? profile.assigned_to) : null,
      new_value: nameOf[data.to_user_id] ?? data.to_user_id,
      note: data.reason,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: data.to_user_id,
      type: "student_assign",
      title: "Bạn được bàn giao hồ sơ học viên",
      body: `${profile.student_code ?? ""} ${profile.full_name ?? ""} — ${data.reason}`.trim(),
      link: `/admin/students/${data.student_profile_id}`,
      meta: { student_profile_id: data.student_profile_id },
    } as never);

    return { ok: true };
  });
