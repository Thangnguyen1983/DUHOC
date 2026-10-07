import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";
import { assertStudentDepartment, studentDepartmentAccess, limitToDepartments } from "@/lib/students/department-access.server";

async function enrollmentStudent(ctx: { supabase: any; userId: string }, admin: any, enrollmentId: string, write = false) {
  const { data, error } = await admin.from("training_enrollments").select("student_profile_id").eq("id", enrollmentId).maybeSingle();
  if (error || !data) throw new Error("Không tìm thấy học viên trong lớp");
  await assertStudentDepartment(ctx, data.student_profile_id, write);
}

const MANAGE_ROLES: Perm[] = ["training.manage", "classes.edit"];
const READ_ROLES: Perm[] = ["training.view", "classes.view"];

async function assertAnyRole(ctx: { supabase: any; userId: string }, allowed: readonly string[]) {
  return assertPermission(ctx, ...(allowed as Perm[]));
}

/* ============ PROGRAMS ============ */
export const listPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, READ_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("training_programs").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

const programSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
  program_type: z.string().nullable().optional(),
  total_hours: z.number().int().nonnegative().default(0),
  total_sessions: z.number().int().nonnegative().default(0),
  tuition_fee: z.number().nonnegative().default(0),
  currency: z.string().default("VND"),
  is_active: z.boolean().default(true),
});
export const upsertProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => programSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("training_programs").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await supabaseAdmin.from("training_programs").insert(rest).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
export const deleteProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("training_programs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ CLASSES ============ */
export const listClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, READ_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("training_classes")
      .select("*, training_programs(code,name,language,level), enrollments:training_enrollments(count)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getClass = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, READ_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cls, error } = await supabaseAdmin
      .from("training_classes")
      .select("*, training_programs(*)")
      .eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    const { data: enrolls } = await supabaseAdmin
      .from("training_enrollments")
      .select("*, student_profiles(id, full_name, phone, email, current_status)")
      .eq("class_id", data.id)
      .order("enrolled_at", { ascending: false });
    const { data: sessions } = await supabaseAdmin
      .from("training_sessions").select("*").eq("class_id", data.id).order("session_no");
    return { cls, enrollments: enrolls ?? [], sessions: sessions ?? [] };
  });

const classSchema = z.object({
  id: z.string().uuid().optional(),
  program_id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  teacher_id: z.string().uuid().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  schedule: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
  max_students: z.number().int().positive().default(30),
  status: z.string().default("planning"),
  cohort: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
});
export const upsertClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => classSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("training_classes").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      if (rest.status === "finished") {
        const { tryAutoIssueCertificatesForClass } = await import("./certificate-automation.server");
        await tryAutoIssueCertificatesForClass(supabaseAdmin, { classId: id, issuedBy: context.userId });
      }
      return { id };
    }
    const { data: row, error } = await supabaseAdmin.from("training_classes").insert(rest).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("training_classes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ ENROLLMENTS ============ */
export const listEnrollableStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await limitToDepartments(supabaseAdmin
      .from("student_profiles")
      .select("id, full_name, phone, email, program, country, current_status")
      .order("created_at", { ascending: false }).limit(500), scope);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const enrollStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    class_id: z.string().uuid(),
    student_profile_id: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertAnyRole(context, MANAGE_ROLES);
    await assertStudentDepartment(context, data.student_profile_id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("training_enrollments")
      .insert({ class_id: data.class_id, student_profile_id: data.student_profile_id })
      .select("id").single();
    if (error) throw new Error(error.message);
    const { data: cls } = await supabaseAdmin
      .from("training_classes")
      .select("code, name")
      .eq("id", data.class_id)
      .maybeSingle();
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({
      student_profile_id: data.student_profile_id,
      action: "enrollment_add",
      actor_id: context.userId,
      actor_email: (context as any).claims?.email ?? null,
      actor_roles: Array.isArray(roles) ? roles : [],
      stage: "dao_tao",
      entity: "training_enrollments",
      entity_id: row.id,
      field: "Lớp học",
      new_value: cls ? `${cls.code ?? ""} ${cls.name ?? ""}`.trim() : data.class_id,
    });
    return { id: row.id };
  });


export const updateEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.string().optional(),
    final_grade: z.number().nullable().optional(),
    certificate_url: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await enrollmentStudent(context, supabaseAdmin, data.id, true);
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin.from("training_enrollments").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    const { tryAutoIssueCertificateForEnrollment } = await import("./certificate-automation.server");
    const certificate = await tryAutoIssueCertificateForEnrollment(supabaseAdmin, { enrollmentId: id, issuedBy: context.userId });
    return { ok: true, certificate };
  });

export const removeEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await enrollmentStudent(context, supabaseAdmin, data.id, true);
    const { error } = await supabaseAdmin.from("training_enrollments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ SESSIONS ============ */
const sessionSchema = z.object({
  id: z.string().uuid().optional(),
  class_id: z.string().uuid(),
  session_no: z.number().int().positive(),
  title: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  session_date: z.string(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  status: z.string().default("scheduled"),
  note: z.string().nullable().optional(),
});
export const upsertSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sessionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, [...MANAGE_ROLES, "schedule.edit"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("training_sessions").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await supabaseAdmin.from("training_sessions").insert(rest).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, [...MANAGE_ROLES, "schedule.edit"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("training_sessions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ ATTENDANCE ============ */
const TEACH_ROLES: Perm[] = ["attendance.edit", "grades.edit"];

export const getSessionAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ session_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, READ_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: session, error: e1 } = await supabaseAdmin
      .from("training_sessions").select("*").eq("id", data.session_id).maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!session) throw new Error("Không tìm thấy buổi học");

    const { data: enrolls } = await supabaseAdmin
      .from("training_enrollments")
      .select("id, student_profile_id, status, student_profiles(full_name, phone, student_code)")
      .eq("class_id", session.class_id);

    const { data: marks } = await supabaseAdmin
      .from("training_attendance").select("*").eq("session_id", data.session_id);

    const byEnroll = new Map((marks ?? []).map((m: any) => [m.enrollment_id, m]));
    const rows = (enrolls ?? []).map((e: any) => ({
      enrollment_id: e.id,
      student_profile_id: e.student_profile_id,
      enrollment_status: e.status,
      student: e.student_profiles,
      mark: byEnroll.get(e.id) ?? null,
    }));
    return { session, rows };
  });

export const bulkMarkAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    session_id: z.string().uuid(),
    marks: z.array(z.object({
      enrollment_id: z.string().uuid(),
      status: z.enum(["present", "absent", "late", "excused"]),
      note: z.string().nullable().optional(),
    })),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, TEACH_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const rows = data.marks.map((m) => ({
      session_id: data.session_id,
      enrollment_id: m.enrollment_id,
      status: m.status,
      note: m.note ?? null,
      check_in_at: m.status === "present" || m.status === "late" ? now : null,
      recorded_by: context.userId,
      check_in_method: "manual",
      pending: false,
      verified_by: context.userId,
      verified_at: now,
    }));
    const { error } = await supabaseAdmin
      .from("training_attendance")
      .upsert(rows, { onConflict: "session_id,enrollment_id" });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("attendance_change_log").insert(
      data.marks.map((m) => ({
        session_id: data.session_id,
        enrollment_id: m.enrollment_id,
        to_status: m.status,
        method: "manual",
        reason: m.note ?? null,
        changed_by: context.userId,
      })),
    );
    const { tryAutoIssueCertificateForEnrollment } = await import("./certificate-automation.server");
    const results = [];
    for (const enrollmentId of [...new Set(data.marks.map((m) => m.enrollment_id))]) {
      results.push(await tryAutoIssueCertificateForEnrollment(supabaseAdmin, { enrollmentId, issuedBy: context.userId }));
    }
    return { ok: true, count: rows.length, certificates_issued: results.filter((r) => r.issued).length };
  });

/* ============ GRADES ============ */
export const listGradesByClass = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ class_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, READ_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: enrolls } = await supabaseAdmin
      .from("training_enrollments")
      .select("id, final_grade, certificate_url, student_profiles(full_name, phone)")
      .eq("class_id", data.class_id);
    const ids = (enrolls ?? []).map((e: any) => e.id);
    const { data: grades } = ids.length
      ? await supabaseAdmin.from("training_grades").select("*").in("enrollment_id", ids).order("assessed_at", { ascending: false })
      : { data: [] };
    return { enrollments: enrolls ?? [], grades: grades ?? [] };
  });

const gradeSchema = z.object({
  id: z.string().uuid().optional(),
  enrollment_id: z.string().uuid(),
  assessment_type: z.string().min(1),
  title: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  max_score: z.number().default(10),
  weight: z.number().default(1),
  assessed_at: z.string().optional(),
  comment: z.string().nullable().optional(),
});

export const upsertGrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => gradeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, TEACH_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, graded_by: context.userId };
    if (id) {
      const { error } = await supabaseAdmin.from("training_grades").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await supabaseAdmin.from("training_grades").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteGrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, TEACH_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("training_grades").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const computeFinalGrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enrollment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, TEACH_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: grades } = await supabaseAdmin
      .from("training_grades").select("score, max_score, weight")
      .eq("enrollment_id", data.enrollment_id);
    if (!grades || grades.length === 0) return { final: null };
    let totalW = 0, sum = 0;
    for (const g of grades as any[]) {
      if (g.score == null || g.max_score == null || g.max_score === 0) continue;
      const w = Number(g.weight ?? 1);
      sum += (Number(g.score) / Number(g.max_score)) * 10 * w;
      totalW += w;
    }
    const final = totalW > 0 ? Number((sum / totalW).toFixed(2)) : null;
    const { error } = await supabaseAdmin
      .from("training_enrollments").update({ final_grade: final }).eq("id", data.enrollment_id);
    if (error) throw new Error(error.message);
    const { tryAutoIssueCertificateForEnrollment } = await import("./certificate-automation.server");
    const certificate = await tryAutoIssueCertificateForEnrollment(supabaseAdmin, { enrollmentId: data.enrollment_id, issuedBy: context.userId });
    return { final, certificate };
  });
