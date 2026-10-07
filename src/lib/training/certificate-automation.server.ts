type CertificateResult = {
  eligible: boolean;
  issued: boolean;
  reason: string;
  certificate?: {
    id?: string;
    certificate_number?: string;
    verify_code?: string;
    pdf_path?: string | null;
  };
  checks?: Record<string, string | number | boolean | null>;
};

const ATTENDANCE_PASS_STATUSES = new Set(["present", "late", "excused"]);

function genCertNumber() {
  const y = new Date().getFullYear();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KZN-${y}-${r}`;
}

function genVerifyCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getCertificateRules(classMeta: unknown) {
  const meta = asObject(classMeta);
  const rules = asObject(meta.certificate ?? meta.certificate_rules);
  return {
    requireClassComplete: rules.require_class_complete ?? rules.requireClassComplete ?? true,
    requireQuiz: rules.require_quiz ?? rules.requireQuiz ?? true,
    requireAllPublishedQuizzes: rules.require_all_published_quizzes ?? rules.requireAllPublishedQuizzes ?? true,
    requireFinalGrade: rules.require_final_grade ?? rules.requireFinalGrade ?? false,
    minFinalGrade: toNumberOrNull(rules.min_final_grade ?? rules.minFinalGrade),
    minAttendanceRate: toNumberOrNull(rules.min_attendance_rate ?? rules.minAttendanceRate) ?? 80,
    title: typeof rules.title === "string" && rules.title.trim() ? rules.title.trim() : null,
  };
}

export async function createCertificateRecord(
  supabaseAdmin: any,
  input: {
    student_profile_id: string;
    recipient_name: string;
    title: string;
    program_id?: string | null;
    class_id?: string | null;
    expires_at?: string | null;
    issued_by?: string | null;
    meta?: Record<string, unknown>;
  },
) {
  const certificate_number = genCertNumber();
  const verify_code = genVerifyCode();

  const { data: row, error } = await supabaseAdmin
    .from("certificates")
    .insert({
      certificate_number,
      verify_code,
      student_profile_id: input.student_profile_id,
      program_id: input.program_id ?? null,
      class_id: input.class_id ?? null,
      title: input.title,
      recipient_name: input.recipient_name,
      expires_at: input.expires_at ?? null,
      pdf_path: null,
      issued_by: input.issued_by ?? null,
      meta: input.meta ?? {},
    })
    .select("id, certificate_number, issued_at")
    .single();
  if (error) throw new Error(error.message);
  const finalNumber = row.certificate_number;
  const pdfPath = `${finalNumber}.pdf`;
  try {
    const { generateCertificatePdf } = await import("./certificate-pdf.server");
    const pdfBytes = await generateCertificatePdf({
      recipientName: input.recipient_name,
      title: input.title,
      certificateNumber: finalNumber,
      verifyCode: verify_code,
      issuedAt: new Date(row.issued_at),
    });
    const { error: uploadError } = await supabaseAdmin.storage.from("certificates").upload(pdfPath, pdfBytes, {
      contentType: "application/pdf", upsert: true,
    });
    if (uploadError) throw uploadError;
    const { error: updateError } = await supabaseAdmin.from("certificates").update({ pdf_path: pdfPath }).eq("id", row.id);
    if (updateError) throw updateError;
  } catch (e) {
    // Keep the issued record for reconciliation instead of silently losing a certificate number.
    throw new Error(`Chứng chỉ ${finalNumber} đã được ghi sổ nhưng chưa tạo được PDF: ${e instanceof Error ? e.message : String(e)}`);
  }
  return { id: row.id, certificate_number: finalNumber, verify_code, pdf_path: pdfPath };
}

async function getRequiredPublishedQuizzes(supabaseAdmin: any, classId: string, programId: string | null) {
  const { data: classQuizzes } = await supabaseAdmin
    .from("quizzes")
    .select("id, title")
    .eq("status", "published")
    .eq("class_id", classId);

  const programQuizzes = programId
    ? await supabaseAdmin
        .from("quizzes")
        .select("id, title")
        .eq("status", "published")
        .eq("program_id", programId)
        .is("class_id", null)
    : { data: [] };

  const byId = new Map<string, any>();
  for (const quiz of [...(classQuizzes ?? []), ...(programQuizzes.data ?? [])]) byId.set(quiz.id, quiz);
  return [...byId.values()];
}

export async function tryAutoIssueCertificateForEnrollment(
  supabaseAdmin: any,
  input: { enrollmentId: string; issuedBy?: string | null },
): Promise<CertificateResult> {
  const { data: enrollment, error } = await supabaseAdmin
    .from("training_enrollments")
    .select(
      "*, student_profiles(id, full_name, email), training_classes(id, name, status, program_id, meta, training_programs(id, name, code))",
    )
    .eq("id", input.enrollmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!enrollment) return { eligible: false, issued: false, reason: "enrollment_not_found" };
  if (["dropped", "suspended"].includes(enrollment.status)) {
    return { eligible: false, issued: false, reason: "enrollment_inactive" };
  }

  const cls = enrollment.training_classes;
  const student = enrollment.student_profiles;
  if (!cls || !student) return { eligible: false, issued: false, reason: "missing_class_or_student" };

  const { data: existing } = await supabaseAdmin
    .from("certificates")
    .select("id, certificate_number, verify_code, pdf_path")
    .eq("student_profile_id", enrollment.student_profile_id)
    .eq("class_id", enrollment.class_id)
    .eq("status", "issued")
    .maybeSingle();
  if (existing) {
    return { eligible: true, issued: false, reason: "already_issued", certificate: existing };
  }

  const rules = getCertificateRules(cls.meta);
  const checks: Record<string, string | number | boolean | null> = {};

  const classComplete = !rules.requireClassComplete || enrollment.status === "completed" || cls.status === "finished";
  checks.classComplete = classComplete;
  if (!classComplete) return { eligible: false, issued: false, reason: "class_not_completed", checks };

  const { data: sessions } = await supabaseAdmin
    .from("training_sessions")
    .select("id")
    .eq("class_id", enrollment.class_id)
    .neq("status", "cancelled");
  const sessionIds = (sessions ?? []).map((s: any) => s.id);
  let attendanceRate = 100;
  if (sessionIds.length > 0) {
    const { data: marks } = await supabaseAdmin
      .from("training_attendance")
      .select("session_id, status")
      .eq("enrollment_id", enrollment.id)
      .in("session_id", sessionIds);
    const passedCount = new Set((marks ?? []).filter((m: any) => ATTENDANCE_PASS_STATUSES.has(m.status)).map((m: any) => m.session_id)).size;
    attendanceRate = Math.round((passedCount / sessionIds.length) * 100);
  }
  checks.attendanceRate = attendanceRate;
  checks.minAttendanceRate = rules.minAttendanceRate;
  if (attendanceRate < rules.minAttendanceRate) return { eligible: false, issued: false, reason: "attendance_not_met", checks };

  const finalGrade = toNumberOrNull(enrollment.final_grade);
  const minFinalGrade = rules.minFinalGrade;
  checks.finalGrade = finalGrade;
  checks.minFinalGrade = minFinalGrade;
  if ((rules.requireFinalGrade || minFinalGrade !== null) && (finalGrade === null || finalGrade < (minFinalGrade ?? 0))) {
    return { eligible: false, issued: false, reason: "final_grade_not_met", checks };
  }

  if (rules.requireQuiz) {
    const requiredQuizzes = await getRequiredPublishedQuizzes(supabaseAdmin, enrollment.class_id, cls.program_id ?? null);
    checks.requiredQuizCount = requiredQuizzes.length;
    if (requiredQuizzes.length === 0) return { eligible: false, issued: false, reason: "no_published_quiz", checks };

    const requiredIds = requiredQuizzes.map((q: any) => q.id);
    const { data: passedAttempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select("quiz_id")
      .eq("student_profile_id", enrollment.student_profile_id)
      .eq("passed", true)
      .in("quiz_id", requiredIds);
    const passedIds = new Set((passedAttempts ?? []).map((a: any) => a.quiz_id));
    checks.passedQuizCount = passedIds.size;
    const quizEligible = rules.requireAllPublishedQuizzes ? requiredIds.every((id: string) => passedIds.has(id)) : passedIds.size > 0;
    if (!quizEligible) return { eligible: false, issued: false, reason: "quiz_not_met", checks };
  }

  const program = Array.isArray(cls.training_programs) ? cls.training_programs[0] : cls.training_programs;
  const title = rules.title ?? `Hoàn thành ${program?.name ?? cls.name}`;
  const cert = await createCertificateRecord(supabaseAdmin, {
    student_profile_id: enrollment.student_profile_id,
    recipient_name: student.full_name,
    title,
    program_id: cls.program_id ?? null,
    class_id: enrollment.class_id,
    issued_by: input.issuedBy ?? null,
    meta: {
      auto_issued: true,
      enrollment_id: enrollment.id,
      checks,
    },
  });

  await supabaseAdmin
    .from("training_enrollments")
    .update({ certificate_url: cert.pdf_path })
    .eq("id", enrollment.id);

  return { eligible: true, issued: true, reason: "issued", certificate: cert, checks };
}

export async function tryAutoIssueCertificateForPassedQuiz(
  supabaseAdmin: any,
  input: { studentProfileId: string; quizId: string; issuedBy?: string | null },
): Promise<CertificateResult> {
  const { data: quiz } = await supabaseAdmin
    .from("quizzes")
    .select("id, class_id, program_id")
    .eq("id", input.quizId)
    .maybeSingle();
  if (!quiz) return { eligible: false, issued: false, reason: "quiz_not_found" };

  let enrollmentIds: string[] = [];
  if (quiz.class_id) {
    const { data: enrollment } = await supabaseAdmin
      .from("training_enrollments")
      .select("id")
      .eq("class_id", quiz.class_id)
      .eq("student_profile_id", input.studentProfileId)
      .maybeSingle();
    if (enrollment) enrollmentIds = [enrollment.id];
  } else if (quiz.program_id) {
    const { data: classes } = await supabaseAdmin.from("training_classes").select("id").eq("program_id", quiz.program_id);
    const classIds = (classes ?? []).map((c: any) => c.id);
    if (classIds.length > 0) {
      const { data: enrollments } = await supabaseAdmin
        .from("training_enrollments")
        .select("id, status")
        .eq("student_profile_id", input.studentProfileId)
        .in("class_id", classIds);
      enrollmentIds = (enrollments ?? [])
        .filter((e: any) => !["dropped", "suspended"].includes(e.status))
        .map((e: any) => e.id);
    }
  }

  if (enrollmentIds.length === 0) return { eligible: false, issued: false, reason: "no_matching_enrollment" };

  let last: CertificateResult = { eligible: false, issued: false, reason: "not_checked" };
  for (const enrollmentId of enrollmentIds) {
    last = await tryAutoIssueCertificateForEnrollment(supabaseAdmin, { enrollmentId, issuedBy: input.issuedBy ?? null });
    if (last.issued || last.reason === "already_issued") return last;
  }
  return last;
}

export async function tryAutoIssueCertificatesForClass(
  supabaseAdmin: any,
  input: { classId: string; issuedBy?: string | null },
) {
  const { data: enrollments } = await supabaseAdmin
    .from("training_enrollments")
    .select("id, status")
    .eq("class_id", input.classId);
  const results: CertificateResult[] = [];
  for (const enrollment of enrollments ?? []) {
    if (["dropped", "suspended"].includes((enrollment as any).status)) continue;
    results.push(
      await tryAutoIssueCertificateForEnrollment(supabaseAdmin, {
        enrollmentId: (enrollment as any).id,
        issuedBy: input.issuedBy ?? null,
      }),
    );
  }
  return {
    checked: results.length,
    issued: results.filter((r) => r.issued).length,
    results,
  };
}