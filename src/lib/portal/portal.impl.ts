/**
 * Pure helpers behind the /hoc-vien portal server functions.
 *
 * The handlers in `portal.functions.ts` wrap these and inject the runtime
 * context (admin client, userId, email, roles). Splitting them out lets
 * integration tests exercise the real DB logic without going through
 * `createServerFn` middleware.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPortalStaff } from "@/lib/rbac/catalog";

export type PortalCtx = {
  admin: SupabaseClient<any, any, any>;
  userId: string;
  email: string | null;
  roles: string[];
};

/**
 * Tìm hồ sơ học viên gắn với tài khoản đang đăng nhập.
 *
 * Định danh được khoá chặt: một tài khoản chỉ nối đúng một hồ sơ.
 * Việc dò theo email chỉ dùng MỘT LẦN để kích hoạt (hồ sơ chưa có user_id và
 * email đó chỉ xuất hiện ở đúng một hồ sơ chưa nối). Sau khi nối, mọi lần đọc
 * sau đều tra theo user_id và ghi nhật ký vào student_account_links.
 */
export async function findStudentProfile(
  admin: SupabaseClient<any, any, any>,
  userId: string,
  email: string | null,
) {
  const byId = await admin.from("student_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (byId.data) return byId.data as any;
  if (email) {
    const { data: candidates } = await admin
      .from("student_profiles")
      .select("*")
      .eq("email", email)
      .is("user_id", null);
    // Chỉ tự nối khi duy nhất một hồ sơ khớp email — tránh ghi nhận nhầm người.
    if (candidates && candidates.length === 1) {
      const target = candidates[0] as any;
      const { error } = await admin
        .from("student_profiles")
        .update({ user_id: userId })
        .eq("id", target.id)
        .is("user_id", null);
      if (error) return null;
      await admin.from("student_account_links").insert({
        student_profile_id: target.id,
        user_id: userId,
        method: "email_match",
        note: `Tự nối lần đầu qua email ${email}`,
      });
      return { ...target, user_id: userId };
    }
  }
  return null;
}


export async function getMyPortalImpl(ctx: PortalCtx) {
  const isStudent = ctx.roles.includes("student");
  const isTeacher = ctx.roles.includes("teacher");
  let profile: any = null;
  let workflow: any = null;
  let documents: any[] = [];
  if (isStudent) {
    profile = await findStudentProfile(ctx.admin, ctx.userId, ctx.email);
    if (profile) {
      const { data: inst } = await ctx.admin
        .from("workflow_instances")
        .select("*, workflow_definitions(name, steps)")
        .eq("student_profile_id", profile.id)
        .maybeSingle();
      workflow = inst;
      const { data: docs } = await ctx.admin
        .from("student_documents")
        .select("id, doc_type, file_name, verified, created_at")
        .eq("student_profile_id", profile.id)
        .order("created_at", { ascending: false });
      documents = docs ?? [];
    }
  }
  return {
    roles: ctx.roles,
    isStudent,
    isTeacher,
    email: ctx.email,
    profile,
    workflow,
    documents,
  };
}

export async function getMyClassesImpl(ctx: PortalCtx) {
  const isTeacher = ctx.roles.includes("teacher");
  const isStudent = ctx.roles.includes("student");
  let classes: any[] = [];

  if (isTeacher) {
    const { data } = await ctx.admin
      .from("training_classes")
      .select("*, training_programs(code,name,language,level)")
      .eq("teacher_id", ctx.userId)
      .order("created_at", { ascending: false });
    classes = data ?? [];
  } else if (isStudent) {
    const profile = await findStudentProfile(ctx.admin, ctx.userId, ctx.email);
    if (profile) {
      const { data } = await ctx.admin
        .from("training_enrollments")
        .select(
          "id, status, final_grade, training_classes(id, code, name, schedule, room, status, start_date, end_date, training_programs(code, name, language, level))",
        )
        .eq("student_profile_id", profile.id);
      classes = (data ?? []).map((e: any) => ({
        enrollment_id: e.id,
        enrollment_status: e.status,
        final_grade: e.final_grade,
        ...e.training_classes,
      }));
    }
  }
  return { isTeacher, isStudent, classes };
}

function isStaffRole(roles: string[]) {
  return isPortalStaff(roles);
}

export async function getMyClassDetailImpl(ctx: PortalCtx, data: { class_id: string }) {
  const isTeacher = ctx.roles.includes("teacher");
  const isStudent = ctx.roles.includes("student");
  const staff = isStaffRole(ctx.roles);

  const { data: cls, error } = await ctx.admin
    .from("training_classes")
    .select("*, training_programs(*)")
    .eq("id", data.class_id)
    .maybeSingle();
  if (error || !cls) throw new Error("Không tìm thấy lớp học");

  if (isTeacher || staff) {
    if ((cls as any).teacher_id !== ctx.userId && !staff) {
      throw new Error("Bạn không phụ trách lớp này");
    }
  } else if (isStudent) {
    const profile = await findStudentProfile(ctx.admin, ctx.userId, ctx.email);
    if (!profile) throw new Error("Không tìm thấy hồ sơ học viên");
    const { data: enr } = await ctx.admin
      .from("training_enrollments")
      .select("id")
      .eq("class_id", data.class_id)
      .eq("student_profile_id", profile.id)
      .maybeSingle();
    if (!enr) throw new Error("Bạn không có trong lớp này");
  } else {
    throw new Error("Forbidden");
  }

  const { data: sessions } = await ctx.admin
    .from("training_sessions")
    .select("*")
    .eq("class_id", data.class_id)
    .order("session_no");
  const { data: enrollments } = await ctx.admin
    .from("training_enrollments")
    .select(
      "id, status, final_grade, student_profiles(id, full_name, phone, email, student_code)",
    )
    .eq("class_id", data.class_id);

  let myAttendance: any[] = [];
  let myGrades: any[] = [];
  // Toàn bộ bản ghi điểm danh của lớp — chỉ trả cho giáo viên/giáo vụ để
  // màn hình nạp đúng trạng thái đã lưu (kể cả lượt học viên tự quét QR).
  let sessionAttendance: any[] = [];

  if (isTeacher || staff) {
    const sessionIds = (sessions ?? []).map((s: any) => s.id);
    if (sessionIds.length > 0) {
      const { data: att } = await ctx.admin
        .from("training_attendance")
        .select(
          "id, session_id, enrollment_id, status, note, check_in_method, check_in_at, recorded_by, pending, updated_at",
        )
        .in("session_id", sessionIds);
      sessionAttendance = att ?? [];
    }
  }

  if (isStudent && !isTeacher && !staff) {
    const profile = await findStudentProfile(ctx.admin, ctx.userId, ctx.email);
    const myEnr = (enrollments ?? []).find((e: any) => e.student_profiles?.id === profile?.id);
    if (myEnr) {
      const { data: att } = await ctx.admin
        .from("training_attendance")
        .select("session_id, status, note")
        .eq("enrollment_id", myEnr.id);
      myAttendance = att ?? [];
      const { data: gr } = await ctx.admin
        .from("training_grades")
        .select("*")
        .eq("enrollment_id", myEnr.id);
      myGrades = gr ?? [];
    }
  }

  return {
    cls,
    sessions: sessions ?? [],
    enrollments: enrollments ?? [],
    myAttendance,
    myGrades,
    sessionAttendance,
    isTeacher,
    isStaff: staff,
    isStudent,
  };
}

export type AttendanceItem = {
  enrollment_id: string;
  status: "present" | "late" | "absent" | "excused";
  note?: string | null;
  reason?: string | null;
};

export async function markAttendanceImpl(
  ctx: PortalCtx,
  data: { session_id: string; items: AttendanceItem[] },
) {
  const staff = isStaffRole(ctx.roles);
  if (!ctx.roles.includes("teacher") && !staff) {
    throw new Error("Forbidden");
  }
  const { data: ses } = await ctx.admin
    .from("training_sessions")
    .select("class_id, training_classes(teacher_id)")
    .eq("id", data.session_id)
    .maybeSingle();
  if (!ses) throw new Error("Buổi học không tồn tại");
  if (!staff && (ses as any).training_classes?.teacher_id !== ctx.userId) {
    throw new Error("Bạn không phụ trách lớp này");
  }

  // Chỉ ghi những dòng thực sự thay đổi để không ghi đè lượt tự quét QR.
  const { data: existingRows } = await ctx.admin
    .from("training_attendance")
    .select("enrollment_id, status, note, check_in_method")
    .eq("session_id", data.session_id);
  const existing = new Map(
    (existingRows ?? []).map((r: any) => [r.enrollment_id, r]),
  );

  const now = new Date().toISOString();
  const changed = data.items.filter((it) => {
    const prev = existing.get(it.enrollment_id) as any;
    if (!prev) return true;
    return prev.status !== it.status || (prev.note ?? null) !== (it.note ?? null);
  });
  if (changed.length === 0) return { ok: true, count: 0, skipped: data.items.length };

  const rows = changed.map((it) => ({
    session_id: data.session_id,
    enrollment_id: it.enrollment_id,
    status: it.status,
    note: it.note ?? null,
    recorded_by: ctx.userId,
    check_in_method: "manual",
    check_in_at: now,
    pending: false,
    verified_by: ctx.userId,
    verified_at: now,
  }));
  const { error } = await ctx.admin
    .from("training_attendance")
    .upsert(rows, { onConflict: "session_id,enrollment_id" });
  if (error) throw new Error(error.message);

  await ctx.admin.from("attendance_change_log").insert(
    changed.map((it) => {
      const prev = existing.get(it.enrollment_id) as any;
      return {
        session_id: data.session_id,
        enrollment_id: it.enrollment_id,
        from_status: prev?.status ?? null,
        to_status: it.status,
        method: "manual",
        changed_by: ctx.userId,
        reason:
          it.reason ??
          (prev?.check_in_method === "qr"
            ? "Giáo viên phủ quyết lượt tự quét QR"
            : null),
      };
    }),
  );

  return { ok: true, count: rows.length, skipped: data.items.length - rows.length };
}


export type GradeInput = {
  id?: string;
  enrollment_id: string;
  grade_type: string;
  title?: string | null;
  score: number;
  max_score: number;
  weight: number;
  note?: string | null;
};

export async function upsertGradeImpl(ctx: PortalCtx, data: GradeInput) {
  if (!ctx.roles.includes("teacher") && !isStaffRole(ctx.roles)) {
    throw new Error("Forbidden");
  }
  const { data: enr } = await ctx.admin
    .from("training_enrollments")
    .select("class_id, training_classes(teacher_id)")
    .eq("id", data.enrollment_id)
    .maybeSingle();
  if (!enr) throw new Error("Ghi danh không tồn tại");
  if (
    !ctx.roles.includes("admin") &&
    (enr as any).training_classes?.teacher_id !== ctx.userId
  ) {
    throw new Error("Bạn không phụ trách lớp này");
  }
  const payload = {
    enrollment_id: data.enrollment_id,
    assessment_type: data.grade_type,
    title: data.title ?? null,
    score: data.score,
    max_score: data.max_score,
    weight: data.weight,
    comment: data.note ?? null,
    graded_by: ctx.userId,
    assessed_at: new Date().toISOString().slice(0, 10),
  };
  if (data.id) {
    const { error } = await ctx.admin.from("training_grades").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, id: data.id };
  }
  const { data: row, error } = await ctx.admin
    .from("training_grades")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { ok: true, id: (row as any).id as string };
}
