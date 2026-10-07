/**
 * Bảng điều khiển quản lý lớp học quy mô lớn:
 * lọc theo thị trường / khoá / loại chương trình, phân trang phía máy chủ,
 * số liệu tổng quan và cảnh báo. Dùng lại bảng training_* hiện có.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

const READ_ROLES: Perm[] = ["classes.view"];
const MANAGE_ROLES: Perm[] = ["classes.edit"];

async function assertRoles(ctx: { supabase: any; userId: string }, allowed: readonly string[]) {
  return assertPermission(ctx, ...(allowed as Perm[]));
}

export const classFiltersSchema = z.object({
  search: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
  cohort: z.string().nullable().optional(),
  program_type: z.string().nullable().optional(),
  program_id: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  teacher_id: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(200).default(50),
});
export type ClassFilters = z.infer<typeof classFiltersSchema>;

const CLASS_SELECT =
  "id, code, name, status, market, cohort, room, schedule, start_date, end_date, max_students, teacher_id, program_id";

function applyFilters(q: any, f: ClassFilters, innerProgram: boolean) {
  if (f.market) q = q.eq("market", f.market);
  if (f.cohort) q = q.eq("cohort", f.cohort);
  if (f.status) q = q.eq("status", f.status);
  if (f.program_id) q = q.eq("program_id", f.program_id);
  if (f.teacher_id) q = q.eq("teacher_id", f.teacher_id);
  if (f.from) q = q.gte("start_date", f.from);
  if (f.to) q = q.lte("start_date", f.to);
  if (f.search) {
    const s = f.search.replace(/[%,()]/g, " ").trim();
    if (s) q = q.or(`code.ilike.%${s}%,name.ilike.%${s}%`);
  }
  if (innerProgram) {
    if (f.program_type) q = q.eq("training_programs.program_type", f.program_type);
    if (f.level) q = q.eq("training_programs.level", f.level);
  }
  return q;
}

export const getClassesBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => classFiltersSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertRoles(context, READ_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;

    const needsProgramJoin = Boolean(data.program_type || data.level);
    const joinHint = needsProgramJoin ? "training_programs!inner" : "training_programs";
    const programCols = "(id, code, name, language, level, market, program_type)";

    // --- Trang hiện tại
    const fromIdx = (data.page - 1) * data.pageSize;
    let pageQuery = admin
      .from("training_classes")
      .select(`${CLASS_SELECT}, ${joinHint}${programCols}`, { count: "exact" })
      .order("start_date", { ascending: false, nullsFirst: false })
      .range(fromIdx, fromIdx + data.pageSize - 1);
    pageQuery = applyFilters(pageQuery, data, needsProgramJoin);
    const { data: pageRows, error, count } = await pageQuery;
    if (error) throw new Error(error.message);

    // --- Toàn bộ tập đang lọc (chỉ cột nhẹ) để tính tổng quan & nhóm
    let statQuery = admin
      .from("training_classes")
      .select(`id, status, market, cohort, max_students, teacher_id, start_date, end_date, ${joinHint}(program_type, name)`)
      .limit(5000);
    statQuery = applyFilters(statQuery, data, needsProgramJoin);
    const { data: statRows } = await statQuery;
    const stats: any[] = statRows ?? [];

    // --- Số học viên theo lớp
    const ids = stats.map((c) => c.id);
    const enrollCount = new Map<string, number>();
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { data: rows } = await admin
        .from("training_enrollments")
        .select("class_id")
        .in("class_id", chunk)
        .neq("status", "dropped")
        .limit(50000);
      for (const r of rows ?? []) enrollCount.set(r.class_id, (enrollCount.get(r.class_id) ?? 0) + 1);
    }

    // --- Giáo viên
    const { data: teachers } = await admin
      .from("teachers")
      .select("id, full_name, user_id, is_active")
      .order("full_name");
    const teacherByUser = new Map<string, any>();
    for (const t of teachers ?? []) if (t.user_id) teacherByUser.set(t.user_id, t);

    const items = (pageRows ?? []).map((c: any) => ({
      ...c,
      program: c.training_programs ?? null,
      students: enrollCount.get(c.id) ?? 0,
      teacher_name: c.teacher_id ? teacherByUser.get(c.teacher_id)?.full_name ?? null : null,
    }));

    // --- Tổng quan
    const today = new Date();
    const in30 = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    const totalStudents = stats.reduce((s, c) => s + (enrollCount.get(c.id) ?? 0), 0);
    const activeClasses = stats.filter((c) => c.status === "in_progress");
    const overview = {
      totalClasses: count ?? stats.length,
      activeClasses: activeClasses.length,
      upcoming30: stats.filter(
        (c) => c.start_date && c.start_date >= todayStr && c.start_date <= in30 && c.status !== "cancelled",
      ).length,
      totalStudents,
      activeStudents: activeClasses.reduce((s, c) => s + (enrollCount.get(c.id) ?? 0), 0),
      freeSeats: stats
        .filter((c) => c.status === "open" || c.status === "planning" || c.status === "in_progress")
        .reduce((s, c) => s + Math.max(0, (c.max_students ?? 0) - (enrollCount.get(c.id) ?? 0)), 0),
      noTeacher: stats.filter((c) => !c.teacher_id && c.status !== "cancelled" && c.status !== "finished").length,
      overCapacity: stats.filter((c) => (enrollCount.get(c.id) ?? 0) > (c.max_students ?? 0)).length,
    };

    function groupBy(fn: (c: any) => string) {
      const map = new Map<string, { label: string; classes: number; students: number }>();
      for (const c of stats) {
        const label = fn(c) || "Chưa phân loại";
        const cur = map.get(label) ?? { label, classes: 0, students: 0 };
        cur.classes += 1;
        cur.students += enrollCount.get(c.id) ?? 0;
        map.set(label, cur);
      }
      return [...map.values()].sort((a, b) => b.students - a.students);
    }

    const breakdown = {
      byMarket: groupBy((c) => c.market ?? ""),
      byCohort: groupBy((c) => c.cohort ?? ""),
      byProgramType: groupBy((c) => c.training_programs?.program_type ?? ""),
    };

    const alerts = stats
      .filter((c) => c.status !== "cancelled" && c.status !== "finished")
      .flatMap((c) => {
        const students = enrollCount.get(c.id) ?? 0;
        const out: Array<{ class_id: string; kind: string; detail: string }> = [];
        if (!c.teacher_id) out.push({ class_id: c.id, kind: "no_teacher", detail: "Chưa gán giáo viên" });
        if (students > (c.max_students ?? 0)) out.push({ class_id: c.id, kind: "over", detail: `Vượt sĩ số (${students}/${c.max_students})` });
        if (c.status === "in_progress" && students === 0) out.push({ class_id: c.id, kind: "empty", detail: "Đang học nhưng chưa có học viên" });
        return out;
      })
      .slice(0, 50);

    // --- Bộ giá trị cho bộ lọc
    const facets = {
      markets: [...new Set(stats.map((c) => c.market).filter(Boolean))].sort(),
      cohorts: [...new Set(stats.map((c) => c.cohort).filter(Boolean))].sort().reverse(),
      teachers: (teachers ?? [])
        .filter((t: any) => t.user_id)
        .map((t: any) => ({ user_id: t.user_id, name: t.full_name })),
    };

    return { items, total: count ?? items.length, page: data.page, pageSize: data.pageSize, overview, breakdown, alerts, facets };
  });

/** Thao tác hàng loạt: đổi trạng thái hoặc gán giáo viên cho nhiều lớp. */
export const bulkUpdateClasses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        status: z.string().nullable().optional(),
        teacher_id: z.string().uuid().nullable().optional(),
        cohort: z.string().nullable().optional(),
        market: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRoles(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.status) patch['status'] = data.status;
    if (data.teacher_id !== undefined) patch['teacher_id'] = data.teacher_id;
    if (data.cohort !== undefined && data.cohort !== null) patch['cohort'] = data.cohort;
    if (data.market !== undefined && data.market !== null) patch['market'] = data.market;
    if (Object.keys(patch).length === 0) return { ok: true, updated: 0 };
    const { error } = await (supabaseAdmin as any).from("training_classes").update(patch).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, updated: data.ids.length };
  });

/** Tìm hồ sơ học viên để ghi danh (tìm phía máy chủ, không tải toàn bộ kho hồ sơ). */
export const searchStudentsForEnroll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        search: z.string().nullable().optional(),
        market: z.string().nullable().optional(),
        class_id: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(30),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRoles(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;

    const { data: enrolled } = await admin
      .from("training_enrollments")
      .select("student_profile_id")
      .eq("class_id", data.class_id);
    const taken = new Set((enrolled ?? []).map((e: any) => e.student_profile_id));

    let q = admin
      .from("student_profiles")
      .select("id, full_name, phone, email, student_code, program, country, current_status")
      .order("created_at", { ascending: false })
      .limit(data.limit + taken.size);
    if (data.market) q = q.eq("country", data.market);
    if (data.search) {
      const s = data.search.replace(/[%,()]/g, " ").trim();
      if (s) q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,student_code.ilike.%${s}%,email.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: (rows ?? []).filter((r: any) => !taken.has(r.id)).slice(0, data.limit) };
  });

/** Ghi danh nhiều học viên vào một lớp trong một thao tác. */
export const bulkEnrollStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ class_id: z.string().uuid(), student_profile_ids: z.array(z.string().uuid()).min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await assertRoles(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;

    const { data: existing } = await admin
      .from("training_enrollments")
      .select("student_profile_id")
      .eq("class_id", data.class_id);
    const taken = new Set((existing ?? []).map((e: any) => e.student_profile_id));
    const toAdd = data.student_profile_ids.filter((id) => !taken.has(id));
    if (toAdd.length === 0) return { ok: true, added: 0 };

    const { data: inserted, error } = await admin
      .from("training_enrollments")
      .insert(toAdd.map((student_profile_id) => ({ class_id: data.class_id, student_profile_id })))
      .select("id, student_profile_id");
    if (error) throw new Error(error.message);

    const { data: cls } = await admin.from("training_classes").select("code, name").eq("id", data.class_id).maybeSingle();
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    for (const row of inserted ?? []) {
      await logStudentActivity({
        student_profile_id: row.student_profile_id,
        action: "enrollment_add",
        actor_id: context.userId,
        actor_email: (context as any).claims?.email ?? null,
        actor_roles: roles,
        stage: "dao_tao",
        entity: "training_enrollments",
        entity_id: row.id,
        field: "Lớp học",
        new_value: cls ? `${cls.code ?? ""} ${cls.name ?? ""}`.trim() : data.class_id,
      });
    }
    return { ok: true, added: inserted?.length ?? 0 };
  });

/** Chuyển học viên sang lớp khác (giữ nguyên hồ sơ, chỉ đổi lớp ghi danh). */
export const transferEnrollments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ enrollment_ids: z.array(z.string().uuid()).min(1).max(200), target_class_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRoles(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("training_enrollments")
      .update({ class_id: data.target_class_id })
      .in("id", data.enrollment_ids);
    if (error) throw new Error(error.message);
    return { ok: true, moved: data.enrollment_ids.length };
  });
