/**
 * Logic điểm danh QR (tách khỏi createServerFn để test được).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeToken, parseToken, randomSecret, verifyToken } from "./attendance-qr.server";

type Admin = SupabaseClient<any, any, any>;

const TEACH_ROLES = ["admin", "training_manager", "training_staff", "teacher"];

export async function assertCanManageSession(admin: Admin, userId: string, roles: string[], sessionId: string) {
  if (!roles.some((r) => TEACH_ROLES.includes(r))) throw new Error("Forbidden");
  const { data: ses } = await admin
    .from("training_sessions")
    .select("*, training_classes(id, code, name, teacher_id, room)")
    .eq("id", sessionId)
    .maybeSingle();
  if (!ses) throw new Error("Buổi học không tồn tại");
  const isStaff = roles.some((r) => ["admin", "training_manager", "training_staff"].includes(r));
  if (!isStaff && (ses as any).training_classes?.teacher_id !== userId) {
    throw new Error("Bạn không phụ trách lớp này");
  }
  return ses as any;
}

export async function openQrSessionImpl(
  admin: Admin,
  userId: string,
  roles: string[],
  input: { session_id: string; late_after_minutes: number; require_approval: boolean },
) {
  await assertCanManageSession(admin, userId, roles, input.session_id);
  const { data: existing } = await admin
    .from("attendance_qr_sessions")
    .select("*")
    .eq("session_id", input.session_id)
    .is("closed_at", null)
    .maybeSingle();
  if (existing) {
    await admin
      .from("attendance_qr_sessions")
      .update({ late_after_minutes: input.late_after_minutes, require_approval: input.require_approval })
      .eq("id", (existing as any).id);
    return { id: (existing as any).id, reused: true };
  }
  const { data: row, error } = await admin
    .from("attendance_qr_sessions")
    .insert({
      session_id: input.session_id,
      secret: randomSecret(),
      opened_by: userId,
      late_after_minutes: input.late_after_minutes,
      require_approval: input.require_approval,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: (row as any).id as string, reused: false };
}

export async function closeQrSessionImpl(admin: Admin, userId: string, roles: string[], input: { session_id: string }) {
  await assertCanManageSession(admin, userId, roles, input.session_id);
  await admin
    .from("attendance_qr_sessions")
    .update({ closed_at: new Date().toISOString() })
    .eq("session_id", input.session_id)
    .is("closed_at", null);
  // Duyệt hết các lượt còn chờ
  const { data: pending } = await admin
    .from("training_attendance")
    .select("id")
    .eq("session_id", input.session_id)
    .eq("pending", true);
  if (pending?.length) {
    await admin
      .from("training_attendance")
      .update({ pending: false, verified_by: userId, verified_at: new Date().toISOString() })
      .in("id", pending.map((p: any) => p.id));
  }
  return { ok: true, approved: pending?.length ?? 0 };
}

/** Trạng thái phiên QR: token hiện tại + danh sách đã check-in. */
export async function getQrSessionStateImpl(admin: Admin, userId: string, roles: string[], input: { session_id: string }) {
  const ses = await assertCanManageSession(admin, userId, roles, input.session_id);
  const { data: qr } = await admin
    .from("attendance_qr_sessions")
    .select("*")
    .eq("session_id", input.session_id)
    .is("closed_at", null)
    .maybeSingle();

  const { data: enrolls } = await admin
    .from("training_enrollments")
    .select("id, status, student_profiles(id, full_name, student_code, phone)")
    .eq("class_id", ses.class_id);
  const { data: marks } = await admin
    .from("training_attendance")
    .select("*")
    .eq("session_id", input.session_id);
  const byEnroll = new Map((marks ?? []).map((m: any) => [m.enrollment_id, m]));

  const roster = (enrolls ?? []).map((e: any) => ({
    enrollment_id: e.id,
    student: e.student_profiles,
    mark: byEnroll.get(e.id) ?? null,
  }));

  return {
    session: ses,
    open: !!qr,
    qr_session_id: qr ? (qr as any).id : null,
    late_after_minutes: qr ? (qr as any).late_after_minutes : 15,
    require_approval: qr ? (qr as any).require_approval : false,
    ...(qr ? makeToken((qr as any).secret, (qr as any).id) : { token: null, expires_in: 0, window_seconds: 30 }),
    roster,
    checked_in: roster.filter((r) => r.mark && ["present", "late"].includes(r.mark.status)).length,
    total: roster.length,
  };
}

export type CheckInResult = {
  ok: boolean;
  status: "present" | "late";
  pending: boolean;
  class_name: string;
  session_title: string | null;
  student_name: string;
  student_code: string | null;
};

/** Học viên quét QR để tự điểm danh — xác thực chặt đúng đối tượng. */
export async function studentCheckInImpl(
  admin: Admin,
  userId: string,
  input: { token: string; device_info?: Record<string, unknown> | null },
): Promise<CheckInResult> {
  const parsed = parseToken(input.token);
  if (!parsed) throw new Error("Mã QR không hợp lệ.");

  const { data: qr } = await admin
    .from("attendance_qr_sessions")
    .select("*")
    .eq("id", parsed.qrSessionId)
    .maybeSingle();
  if (!qr) throw new Error("Phiên điểm danh không tồn tại.");
  if ((qr as any).closed_at) throw new Error("Phiên điểm danh đã đóng.");
  if (!verifyToken((qr as any).secret, parsed)) throw new Error("Mã QR đã hết hạn, vui lòng quét lại mã trên màn hình.");

  // Định danh: tài khoản phải đã nối đúng một hồ sơ học viên.
  const { data: profile } = await admin
    .from("student_profiles")
    .select("id, full_name, student_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) throw new Error("Tài khoản chưa được nối với hồ sơ học viên. Liên hệ giáo vụ để kích hoạt.");

  const { data: ses } = await admin
    .from("training_sessions")
    .select("id, class_id, title, session_date, start_time, training_classes(name)")
    .eq("id", (qr as any).session_id)
    .maybeSingle();
  if (!ses) throw new Error("Buổi học không tồn tại.");

  const { data: enr } = await admin
    .from("training_enrollments")
    .select("id, status")
    .eq("class_id", (ses as any).class_id)
    .eq("student_profile_id", (profile as any).id)
    .maybeSingle();
  if (!enr) throw new Error("Bạn không có tên trong lớp của buổi học này.");
  if (["dropped", "cancelled"].includes((enr as any).status)) throw new Error("Ghi danh của bạn không còn hiệu lực.");

  const { data: existing } = await admin
    .from("training_attendance")
    .select("id, status")
    .eq("session_id", (ses as any).id)
    .eq("enrollment_id", (enr as any).id)
    .maybeSingle();
  if (existing && ["present", "late"].includes((existing as any).status)) {
    throw new Error("Bạn đã điểm danh buổi này rồi.");
  }

  // Trễ nếu quá N phút kể từ giờ bắt đầu buổi học.
  let status: "present" | "late" = "present";
  const startTime = (ses as any).start_time as string | null;
  const sessionDate = (ses as any).session_date as string | null;
  if (sessionDate && startTime) {
    const start = new Date(`${sessionDate}T${startTime}`);
    const limit = start.getTime() + (qr as any).late_after_minutes * 60_000;
    if (Date.now() > limit) status = "late";
  }

  const pending = !!(qr as any).require_approval;
  const now = new Date().toISOString();
  const { error } = await admin.from("training_attendance").upsert(
    {
      session_id: (ses as any).id,
      enrollment_id: (enr as any).id,
      status,
      check_in_at: now,
      check_in_method: "qr",
      device_info: input.device_info ?? null,
      recorded_by: userId,
      pending,
    },
    { onConflict: "session_id,enrollment_id" },
  );
  if (error) throw new Error(error.message);

  await admin.from("attendance_change_log").insert({
    session_id: (ses as any).id,
    enrollment_id: (enr as any).id,
    from_status: existing ? (existing as any).status : null,
    to_status: status,
    method: "qr",
    reason: "Học viên tự quét mã QR",
    changed_by: userId,
  });

  return {
    ok: true,
    status,
    pending,
    class_name: (ses as any).training_classes?.name ?? "",
    session_title: (ses as any).title ?? null,
    student_name: (profile as any).full_name,
    student_code: (profile as any).student_code ?? null,
  };
}
