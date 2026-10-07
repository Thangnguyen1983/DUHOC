/**
 * Logic cho cổng giáo viên, lịch học và báo cáo đào tạo.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPortalStaff } from "@/lib/rbac/catalog";

type Admin = SupabaseClient<any, any, any>;

export function isStaff(roles: string[]) {
  return isPortalStaff(roles);
}

export async function assertTeacherOrStaff(roles: string[]) {
  if (!roles.includes("teacher") && !isStaff(roles)) throw new Error("Forbidden");
}

/** Tổng quan cho giáo viên: lớp đang dạy, buổi hôm nay, việc cần làm. */
export async function getTeachingOverviewImpl(admin: Admin, userId: string, roles: string[]) {
  await assertTeacherOrStaff(roles);
  const staff = isStaff(roles);

  let q = admin
    .from("training_classes")
    .select("*, training_programs(code, name, language, level)")
    .order("created_at", { ascending: false });
  if (!staff) q = q.eq("teacher_id", userId);
  const { data: classes } = await q;
  const classIds = (classes ?? []).map((c: any) => c.id);

  if (classIds.length === 0) {
    return { classes: [], today: [], upcoming: [], missingAttendance: [], isStaff: staff };
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: sessions } = await admin
    .from("training_sessions")
    .select("*, training_classes(id, code, name, room)")
    .in("class_id", classIds)
    .order("session_date")
    .order("start_time");

  const { data: attendance } = await admin
    .from("training_attendance")
    .select("session_id")
    .in("session_id", (sessions ?? []).map((s: any) => s.id).slice(0, 1000));
  const marked = new Set((attendance ?? []).map((a: any) => a.session_id));

  const { data: enrollCounts } = await admin
    .from("training_enrollments")
    .select("id, class_id")
    .in("class_id", classIds);
  const perClass = new Map<string, number>();
  for (const e of enrollCounts ?? []) {
    perClass.set((e as any).class_id, (perClass.get((e as any).class_id) ?? 0) + 1);
  }

  return {
    isStaff: staff,
    classes: (classes ?? []).map((c: any) => ({ ...c, student_count: perClass.get(c.id) ?? 0 })),
    today: (sessions ?? []).filter((s: any) => s.session_date === today),
    upcoming: (sessions ?? []).filter((s: any) => s.session_date > today).slice(0, 8),
    missingAttendance: (sessions ?? [])
      .filter((s: any) => s.session_date <= today && !marked.has(s.id))
      .slice(-10)
      .reverse(),
  };
}

/** Sinh hàng loạt buổi học theo lịch lặp hằng tuần. */
export async function generateSessionsImpl(
  admin: Admin,
  userId: string,
  roles: string[],
  input: {
    class_id: string;
    weekdays: number[]; // 0=CN..6=T7
    start_date: string;
    end_date?: string | null;
    count?: number | null;
    start_time: string;
    end_time?: string | null;
    title_prefix?: string | null;
    skip_existing: boolean;
  },
) {
  await assertTeacherOrStaff(roles);
  const { data: cls } = await admin
    .from("training_classes")
    .select("id, teacher_id, name")
    .eq("id", input.class_id)
    .maybeSingle();
  if (!cls) throw new Error("Lớp không tồn tại");
  if (!isStaff(roles) && (cls as any).teacher_id !== userId) throw new Error("Bạn không phụ trách lớp này");

  const { data: existing } = await admin
    .from("training_sessions")
    .select("id, session_no, session_date")
    .eq("class_id", input.class_id);
  const existingDates = new Set((existing ?? []).map((s: any) => s.session_date));
  let nextNo = Math.max(0, ...(existing ?? []).map((s: any) => Number(s.session_no) || 0)) + 1;

  const dates: string[] = [];
  const cursor = new Date(`${input.start_date}T00:00:00`);
  const limitDate = input.end_date ? new Date(`${input.end_date}T00:00:00`) : null;
  const maxCount = input.count ?? 200;
  let guard = 0;
  while (dates.length < maxCount && guard < 730) {
    guard++;
    if (limitDate && cursor > limitDate) break;
    if (input.weekdays.includes(cursor.getDay())) {
      const iso = cursor.toISOString().slice(0, 10);
      if (!(input.skip_existing && existingDates.has(iso))) dates.push(iso);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (dates.length === 0) return { created: 0, dates: [] as string[] };

  const rows = dates.map((d) => ({
    class_id: input.class_id,
    session_no: nextNo++,
    session_date: d,
    start_time: input.start_time,
    end_time: input.end_time ?? null,
    title: input.title_prefix ? `${input.title_prefix} ${d}` : null,
    status: "planned",
    teacher_id: (cls as any).teacher_id ?? null,
  }));
  const { error } = await admin.from("training_sessions").insert(rows);
  if (error) throw new Error(error.message);

  await admin
    .from("training_classes")
    .update({
      meta: {
        recurrence: {
          weekdays: input.weekdays,
          start_time: input.start_time,
          end_time: input.end_time ?? null,
        },
      },
    })
    .eq("id", input.class_id);

  return { created: rows.length, dates };
}

/** Lịch dạy trong khoảng thời gian + cảnh báo trùng phòng / trùng giáo viên. */
export async function getScheduleImpl(
  admin: Admin,
  userId: string,
  roles: string[],
  input: { from: string; to: string; mine: boolean },
) {
  await assertTeacherOrStaff(roles);
  const staff = isStaff(roles);
  let q = admin
    .from("training_sessions")
    .select("*, training_classes(id, code, name, room, teacher_id)")
    .gte("session_date", input.from)
    .lte("session_date", input.to)
    .order("session_date")
    .order("start_time");
  const { data } = await q;
  let rows = (data ?? []) as any[];
  if (!staff || input.mine) rows = rows.filter((r) => r.training_classes?.teacher_id === userId);

  const conflicts: { a: string; b: string; kind: "room" | "teacher"; date: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      if (a.session_date !== b.session_date) continue;
      if (!overlaps(a, b)) continue;
      const room = a.training_classes?.room;
      if (room && room === b.training_classes?.room) {
        conflicts.push({ a: a.id, b: b.id, kind: "room", date: a.session_date });
      }
      const t = a.training_classes?.teacher_id;
      if (t && t === b.training_classes?.teacher_id) {
        conflicts.push({ a: a.id, b: b.id, kind: "teacher", date: a.session_date });
      }
    }
  }
  return { sessions: rows, conflicts };
}

function overlaps(a: any, b: any) {
  const as = a.start_time ?? "00:00";
  const ae = a.end_time ?? "23:59";
  const bs = b.start_time ?? "00:00";
  const be = b.end_time ?? "23:59";
  return as < be && bs < ae;
}

/** Học bạ hợp nhất của một học viên: lớp, chuyên cần, điểm, chứng chỉ, khoá online, đơn hàng. */
export async function getStudentTranscriptImpl(admin: Admin, roles: string[], studentProfileId: string, teacherClassIds?: string[]) {
  if (!isStaff(roles) && !roles.some((r) => ["teacher", "consultant", "cskh", "sales"].includes(r))) {
    throw new Error("Forbidden");
  }
  const { data: fullProfile } = await admin
    .from("student_profiles")
    .select("*")
    .eq("id", studentProfileId)
    .maybeSingle();
  if (!fullProfile) throw new Error("Không tìm thấy hồ sơ học viên");
  const profile = teacherClassIds ? { full_name: fullProfile.full_name, student_code: fullProfile.student_code } : fullProfile;

  let enrollmentQuery = admin
    .from("training_enrollments")
    .select("*, training_classes(id, code, name, room, schedule, status, training_programs(name, code))")
    .eq("student_profile_id", studentProfileId);
  if (teacherClassIds) enrollmentQuery = enrollmentQuery.in("class_id", teacherClassIds);
  const { data: enrollments } = await enrollmentQuery;

  const enrollmentIds = (enrollments ?? []).map((e: any) => e.id);
  const classIds = (enrollments ?? []).map((e: any) => e.training_classes?.id).filter(Boolean);

  const [{ data: attendance }, { data: grades }, { data: sessions }, { data: certificates }] = await Promise.all([
    enrollmentIds.length
      ? admin.from("training_attendance").select("*").in("enrollment_id", enrollmentIds)
      : Promise.resolve({ data: [] as any[] }),
    enrollmentIds.length
      ? admin.from("training_grades").select("*").in("enrollment_id", enrollmentIds)
      : Promise.resolve({ data: [] as any[] }),
    classIds.length
      ? admin.from("training_sessions").select("id, class_id, session_date").in("class_id", classIds)
      : Promise.resolve({ data: [] as any[] }),
    teacherClassIds ? Promise.resolve({ data: [] as any[] }) : admin.from("certificates").select("*").eq("student_profile_id", studentProfileId),
  ]);

  const sessionsByClass = new Map<string, string[]>();
  for (const s of sessions ?? []) {
    const arr = sessionsByClass.get((s as any).class_id) ?? [];
    arr.push((s as any).id);
    sessionsByClass.set((s as any).class_id, arr);
  }

  const classes = (enrollments ?? []).map((e: any) => {
    const total = sessionsByClass.get(e.training_classes?.id)?.length ?? 0;
    const marks = (attendance ?? []).filter((a: any) => a.enrollment_id === e.id);
    const present = marks.filter((a: any) => ["present", "late"].includes(a.status)).length;
    return {
      enrollment_id: e.id,
      status: e.status,
      final_grade: e.final_grade,
      cls: e.training_classes,
      attendance: { total, present, absent: marks.filter((a: any) => a.status === "absent").length,
        rate: total > 0 ? Math.round((present / total) * 100) : null },
      grades: (grades ?? []).filter((g: any) => g.enrollment_id === e.id),
      marks,
    };
  });

  // Khoá học online + đơn hàng nối theo user_id của hồ sơ
  let courses: any[] = [];
  let orders: any[] = [];
  if ((profile as any).user_id) {
    const [{ data: ce }, { data: co }] = await Promise.all([
      admin
        .from("course_enrollments")
        .select("*, courses(title, slug)")
        .eq("user_id", (profile as any).user_id),
      admin.from("course_orders").select("*").eq("user_id", (profile as any).user_id),
    ]);
    courses = ce ?? [];
    orders = co ?? [];
  }

  const { data: careLogs } = teacherClassIds ? { data: [] as any[] } : await admin
    .from("student_care_logs")
    .select("*")
    .eq("student_profile_id", studentProfileId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: accountLinks } = teacherClassIds ? { data: [] as any[] } : await admin
    .from("student_account_links")
    .select("*")
    .eq("student_profile_id", studentProfileId)
    .order("created_at", { ascending: false });

  return { profile, classes, certificates: certificates ?? [], courses, orders, careLogs: careLogs ?? [], accountLinks: accountLinks ?? [] };
}

/** Báo cáo chuyên cần + điểm theo lớp (dùng cho bảng và xuất Excel). */
export async function getClassReportImpl(admin: Admin, roles: string[], input: { class_id: string; from?: string | null; to?: string | null; absent_threshold: number }, allowedStudentIds: string[] | null = null) {
  await assertTeacherOrStaff(roles);
  const { data: cls } = await admin
    .from("training_classes")
    .select("*, training_programs(name)")
    .eq("id", input.class_id)
    .maybeSingle();
  if (!cls) throw new Error("Lớp không tồn tại");

  let sq = admin.from("training_sessions").select("id, session_no, session_date").eq("class_id", input.class_id);
  if (input.from) sq = sq.gte("session_date", input.from);
  if (input.to) sq = sq.lte("session_date", input.to);
  const { data: sessions } = await sq.order("session_date");

  let enrollmentQuery = admin
    .from("training_enrollments")
    .select("id, final_grade, status, student_profiles(id, full_name, student_code, phone)")
    .eq("class_id", input.class_id);
  if (allowedStudentIds !== null) enrollmentQuery = enrollmentQuery.in("student_profile_id", allowedStudentIds.length ? allowedStudentIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: enrolls } = await enrollmentQuery;

  const sessionIds = (sessions ?? []).map((s: any) => s.id);
  const enrollmentIds = (enrolls ?? []).map((e: any) => e.id);
  const { data: marks } = sessionIds.length && enrollmentIds.length
    ? await admin.from("training_attendance").select("*").in("session_id", sessionIds).in("enrollment_id", enrollmentIds)
    : { data: [] as any[] };
  const { data: grades } = (enrolls ?? []).length
    ? await admin.from("training_grades").select("*").in("enrollment_id", (enrolls ?? []).map((e: any) => e.id))
    : { data: [] as any[] };

  const rows = (enrolls ?? []).map((e: any) => {
    const mine = (marks ?? []).filter((m: any) => m.enrollment_id === e.id);
    const present = mine.filter((m: any) => m.status === "present").length;
    const late = mine.filter((m: any) => m.status === "late").length;
    const absent = mine.filter((m: any) => m.status === "absent").length;
    const excused = mine.filter((m: any) => m.status === "excused").length;
    const total = sessionIds.length;
    return {
      enrollment_id: e.id,
      student_code: e.student_profiles?.student_code ?? "",
      full_name: e.student_profiles?.full_name ?? "",
      phone: e.student_profiles?.phone ?? "",
      total,
      present,
      late,
      absent,
      excused,
      rate: total > 0 ? Math.round(((present + late) / total) * 100) : null,
      final_grade: e.final_grade,
      grades: (grades ?? []).filter((g: any) => g.enrollment_id === e.id),
      warning: absent >= input.absent_threshold,
    };
  });

  return { cls, sessions: sessions ?? [], rows };
}

/** Tạo/sửa một buổi học lẻ (giáo viên phụ trách hoặc giáo vụ). */
export async function upsertSessionImpl(
  admin: Admin,
  userId: string,
  roles: string[],
  input: {
    id?: string | null;
    class_id: string;
    session_date: string;
    start_time?: string | null;
    end_time?: string | null;
    title?: string | null;
    topic?: string | null;
    session_no?: number | null;
  },
) {
  await assertTeacherOrStaff(roles);
  const { data: cls } = await admin
    .from("training_classes")
    .select("id, teacher_id")
    .eq("id", input.class_id)
    .maybeSingle();
  if (!cls) throw new Error("Lớp không tồn tại");
  if (!isStaff(roles) && (cls as any).teacher_id !== userId) throw new Error("Bạn không phụ trách lớp này");

  const payload: any = {
    class_id: input.class_id,
    session_date: input.session_date,
    start_time: input.start_time || null,
    end_time: input.end_time || null,
    title: input.title || null,
    topic: input.topic || null,
  };

  if (input.id) {
    const { error } = await admin.from("training_sessions").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { ok: true, id: input.id };
  }

  const { data: existing } = await admin
    .from("training_sessions")
    .select("session_no")
    .eq("class_id", input.class_id);
  payload.session_no =
    input.session_no ?? Math.max(0, ...(existing ?? []).map((s: any) => Number(s.session_no) || 0)) + 1;
  payload.status = "planned";
  payload.teacher_id = (cls as any).teacher_id ?? null;
  const { data, error } = await admin.from("training_sessions").insert(payload).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  return { ok: true, id: (data as any)?.id };
}

/** Xoá buổi học chưa có điểm danh. */
export async function deleteSessionImpl(admin: Admin, userId: string, roles: string[], id: string) {
  await assertTeacherOrStaff(roles);
  const { data: ses } = await admin
    .from("training_sessions")
    .select("id, class_id, training_classes(teacher_id)")
    .eq("id", id)
    .maybeSingle();
  if (!ses) throw new Error("Buổi học không tồn tại");
  if (!isStaff(roles) && (ses as any).training_classes?.teacher_id !== userId) {
    throw new Error("Bạn không phụ trách lớp này");
  }
  const { count } = await admin
    .from("training_attendance")
    .select("id", { count: "exact", head: true })
    .eq("session_id", id);
  if ((count ?? 0) > 0) throw new Error("Buổi học đã có điểm danh, không thể xoá");
  const { error } = await admin.from("training_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
