/**
 * Giám sát đào tạo cấp quản trị: nhìn xuyên suốt mọi lớp, mọi giáo viên.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isStaff } from "./teaching.impl";

type Admin = SupabaseClient<any, any, any>;

function assertStaff(roles: string[]) {
  if (!isStaff(roles)) throw new Error("Forbidden");
}

export type OversightInput = { from?: string | null; to?: string | null };

export async function getTrainingOversightImpl(
  admin: Admin,
  roles: string[],
  input: OversightInput,
  /** Giới hạn danh sách lớp cho giáo viên (null = toàn hệ thống). */
  allowedClassIds: string[] | null = null,
) {
  if (!allowedClassIds) assertStaff(roles);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: allClasses }, { data: teachers }] = await Promise.all([
    admin
      .from("training_classes")
      .select("*, training_programs(id, code, name)")
      .order("created_at", { ascending: false }),
    admin.from("teachers").select("id, full_name, email, phone, user_id, is_active").order("full_name"),
  ]);

  const allowed = allowedClassIds ? new Set(allowedClassIds) : null;
  const classes = allowed ? (allClasses ?? []).filter((c: any) => allowed.has(c.id)) : allClasses;

  const classIds = (classes ?? []).map((c: any) => c.id);
  if (classIds.length === 0) {
    return {
      today,
      classes: [],
      teachers: teachers ?? [],
      teacherStats: [],
      alerts: [] as any[],
      kpi: { totalClasses: 0, activeClasses: 0, students: 0, sessionsThisWeek: 0, unmarked: 0, avgAttendance: null, unassigned: 0 },
    };
  }

  let sq = admin.from("training_sessions").select("id, class_id, session_date, start_time, end_time, title").in("class_id", classIds);
  if (input.from) sq = sq.gte("session_date", input.from);
  if (input.to) sq = sq.lte("session_date", input.to);
  const { data: sessions } = await sq.order("session_date");

  const sessionIds = (sessions ?? []).map((s: any) => s.id);

  const [{ data: enrollments }, { data: attendance }] = await Promise.all([
    admin.from("training_enrollments").select("id, class_id, status, final_grade").in("class_id", classIds),
    sessionIds.length
      ? admin.from("training_attendance").select("session_id, enrollment_id, status").in("session_id", sessionIds.slice(0, 5000))
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const enrollmentIds = (enrollments ?? []).map((e: any) => e.id);
  const { data: grades } = enrollmentIds.length
    ? await admin.from("training_grades").select("enrollment_id").in("enrollment_id", enrollmentIds.slice(0, 5000))
    : { data: [] as any[] };

  const gradedEnrollments = new Set((grades ?? []).map((g: any) => g.enrollment_id));
  const markedSessions = new Set((attendance ?? []).map((a: any) => a.session_id));

  const sessionsByClass = new Map<string, any[]>();
  for (const s of sessions ?? []) {
    const arr = sessionsByClass.get((s as any).class_id) ?? [];
    arr.push(s);
    sessionsByClass.set((s as any).class_id, arr);
  }
  const enrollByClass = new Map<string, any[]>();
  for (const e of enrollments ?? []) {
    const arr = enrollByClass.get((e as any).class_id) ?? [];
    arr.push(e);
    enrollByClass.set((e as any).class_id, arr);
  }
  const enrollClass = new Map<string, string>();
  for (const e of enrollments ?? []) enrollClass.set((e as any).id, (e as any).class_id);

  const attByClass = new Map<string, { present: number; total: number }>();
  for (const a of attendance ?? []) {
    const cid = enrollClass.get((a as any).enrollment_id);
    if (!cid) continue;
    const cur = attByClass.get(cid) ?? { present: 0, total: 0 };
    cur.total += 1;
    if (["present", "late"].includes((a as any).status)) cur.present += 1;
    attByClass.set(cid, cur);
  }

  const teacherByUser = new Map<string, any>();
  for (const t of teachers ?? []) if ((t as any).user_id) teacherByUser.set((t as any).user_id, t);

  const weekStart = isoWeekStart();
  const weekEnd = addDays(weekStart, 6);

  const rows = (classes ?? []).map((c: any) => {
    const ss = sessionsByClass.get(c.id) ?? [];
    const past = ss.filter((s: any) => s.session_date <= today);
    const unmarked = past.filter((s: any) => !markedSessions.has(s.id));
    const es = enrollByClass.get(c.id) ?? [];
    const att = attByClass.get(c.id);
    const teacher = c.teacher_id ? teacherByUser.get(c.teacher_id) : null;
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      status: c.status,
      room: c.room,
      schedule: c.schedule,
      start_date: c.start_date,
      end_date: c.end_date,
      program: c.training_programs ?? null,
      program_id: c.program_id,
      teacher_id: c.teacher_id,
      teacher_name: teacher?.full_name ?? null,
      students: es.length,
      active_students: es.filter((e: any) => e.status === "active").length,
      sessions_total: ss.length,
      sessions_done: past.length,
      sessions_unmarked: unmarked.length,
      unmarked_dates: unmarked.slice(-5).map((s: any) => s.session_date),
      sessions_this_week: ss.filter((s: any) => s.session_date >= weekStart && s.session_date <= weekEnd).length,
      attendance_rate: att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null,
      graded_students: es.filter((e: any) => gradedEnrollments.has(e.id)).length,
    };
  });

  const teacherStats = (teachers ?? [])
    .map((t: any) => {
      const mine = rows.filter((r) => r.teacher_id && r.teacher_id === t.user_id);
      return {
        id: t.id,
        user_id: t.user_id,
        full_name: t.full_name,
        email: t.email,
        is_active: t.is_active,
        classes: mine.length,
        students: mine.reduce((s, r) => s + r.students, 0),
        sessions_this_week: mine.reduce((s, r) => s + r.sessions_this_week, 0),
        unmarked: mine.reduce((s, r) => s + r.sessions_unmarked, 0),
        ungraded: mine.reduce((s, r) => s + (r.students - r.graded_students), 0),
        attendance_rate: avg(mine.map((r) => r.attendance_rate).filter((x): x is number => x != null)),
      };
    })
    .sort((a, b) => b.classes - a.classes);

  const alerts: { kind: string; class_id: string; label: string; detail: string }[] = [];
  for (const r of rows) {
    if (r.sessions_unmarked > 0) {
      alerts.push({
        kind: "unmarked",
        class_id: r.id,
        label: `${r.code} · ${r.name}`,
        detail: `${r.sessions_unmarked} buổi quá hạn chưa điểm danh (${r.unmarked_dates.join(", ")})`,
      });
    }
    if (!r.teacher_id && r.status !== "cancelled" && r.status !== "finished") {
      alerts.push({ kind: "no_teacher", class_id: r.id, label: `${r.code} · ${r.name}`, detail: "Chưa gán giáo viên phụ trách" });
    }
    if (r.end_date && r.end_date <= addDays(today, 14) && r.students > 0 && r.graded_students < r.students) {
      alerts.push({
        kind: "ungraded",
        class_id: r.id,
        label: `${r.code} · ${r.name}`,
        detail: `Sắp kết thúc (${r.end_date}) nhưng còn ${r.students - r.graded_students} học viên chưa có điểm`,
      });
    }
  }

  return {
    today,
    classes: rows,
    teachers: teachers ?? [],
    teacherStats,
    alerts,
    kpi: {
      totalClasses: rows.length,
      activeClasses: rows.filter((r) => ["open", "in_progress"].includes(r.status)).length,
      students: rows.reduce((s, r) => s + r.students, 0),
      sessionsThisWeek: rows.reduce((s, r) => s + r.sessions_this_week, 0),
      unmarked: rows.reduce((s, r) => s + r.sessions_unmarked, 0),
      avgAttendance: avg(rows.map((r) => r.attendance_rate).filter((x): x is number => x != null)),
      unassigned: rows.filter((r) => !r.teacher_id).length,
    },
  };
}

/** Gán / đổi giáo viên phụ trách lớp (chỉ giáo vụ, quản trị). */
export async function assignClassTeacherImpl(
  admin: Admin,
  roles: string[],
  input: { class_id: string; teacher_user_id: string | null },
) {
  assertStaff(roles);
  const { error } = await admin
    .from("training_classes")
    .update({ teacher_id: input.teacher_user_id })
    .eq("id", input.class_id);
  if (error) throw new Error(error.message);

  await admin
    .from("training_sessions")
    .update({ teacher_id: input.teacher_user_id })
    .eq("class_id", input.class_id)
    .gte("session_date", new Date().toISOString().slice(0, 10));

  return { ok: true };
}

function avg(list: number[]) {
  if (list.length === 0) return null;
  return Math.round(list.reduce((s, x) => s + x, 0) / list.length);
}
function isoWeekStart(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
