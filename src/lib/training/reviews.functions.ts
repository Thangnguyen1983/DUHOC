import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";


async function assertStaff(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "grades.view");
}

export const PERIOD_LABEL: Record<string, string> = {
  week: "Tuần",
  month: "Tháng",
  stage: "Giai đoạn",
  final: "Kết thúc khoá",
};

export const CONDUCT_LABEL: Record<string, string> = {
  reward: "Khen thưởng",
  reminder: "Nhắc nhở",
  warning: "Cảnh cáo",
};

/** Nhận xét + khen thưởng/kỷ luật của một học viên. */
export const getStudentReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_profile_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [reviews, conduct] = await Promise.all([
      supabaseAdmin
        .from("student_reviews")
        .select("*")
        .eq("student_profile_id", data.student_profile_id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("student_conduct_records")
        .select("*")
        .eq("student_profile_id", data.student_profile_id)
        .order("created_at", { ascending: false }),
    ]);
    return { reviews: reviews.data ?? [], conduct: conduct.data ?? [] };
  });

const reviewSchema = z.object({
  id: z.string().uuid().optional(),
  student_profile_id: z.string().uuid(),
  class_id: z.string().uuid().nullable().optional(),
  period_type: z.enum(["week", "month", "stage", "final"]).default("week"),
  period_label: z.string().min(1).max(120),
  period_start: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),
  attendance_score: z.number().min(0).max(10).nullable().optional(),
  attitude_score: z.number().min(0).max(10).nullable().optional(),
  progress_score: z.number().min(0).max(10).nullable().optional(),
  speaking_score: z.number().min(0).max(10).nullable().optional(),
  comment: z.string().max(4000).nullable().optional(),
  recommendation: z.string().max(2000).nullable().optional(),
});

export const upsertStudentReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const scores = [rest.attendance_score, rest.attitude_score, rest.progress_score, rest.speaking_score].filter(
      (s): s is number => typeof s === "number",
    );
    const payload: any = {
      ...rest,
      class_id: rest.class_id || null,
      period_start: rest.period_start || null,
      period_end: rest.period_end || null,
      teacher_user_id: context.userId,
      overall_score: scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null,
    };
    const q = id
      ? supabaseAdmin.from("student_reviews").update(payload).eq("id", id)
      : supabaseAdmin.from("student_reviews").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStudentReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("student_reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const conductSchema = z.object({
  student_profile_id: z.string().uuid(),
  class_id: z.string().uuid().nullable().optional(),
  record_type: z.enum(["reward", "reminder", "warning"]).default("reminder"),
  severity: z.enum(["info", "medium", "high"]).default("info"),
  title: z.string().min(1).max(200),
  detail: z.string().max(2000).nullable().optional(),
});

export const addConductRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => conductSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("student_conduct_records")
      .insert({ ...data, class_id: data.class_id || null, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteConductRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("student_conduct_records").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Quét điểm danh, tự sinh nhắc nhở/cảnh cáo khi vắng vượt ngưỡng và khen thưởng khi chuyên cần tuyệt đối. */
export const runAttendanceConductScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        class_id: z.string().uuid().optional(),
        absent_threshold: z.number().int().min(1).max(50).default(3),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let enrollQ = supabaseAdmin
      .from("training_enrollments")
      .select("id, class_id, student_profile_id")
      .eq("status", "active");
    if (data.class_id) enrollQ = enrollQ.eq("class_id", data.class_id);
    const { data: enrollments } = await enrollQ;
    if (!enrollments?.length) return { created: 0 };

    const { data: att } = await supabaseAdmin
      .from("training_attendance")
      .select("enrollment_id, status")
      .in(
        "enrollment_id",
        enrollments.map((e: any) => e.id),
      );

    const stats: Record<string, { absent: number; late: number; total: number }> = {};
    (att ?? []).forEach((a: any) => {
      const s = (stats[a.enrollment_id] ??= { absent: 0, late: 0, total: 0 });
      s.total++;
      if (a.status === "absent") s.absent++;
      if (a.status === "late") s.late++;
    });

    let created = 0;
    for (const e of enrollments as any[]) {
      const s = stats[e.id];
      if (!s || !s.total || !e.student_profile_id) continue;

      let payload: any = null;
      if (s.absent >= data.absent_threshold * 2) {
        payload = {
          record_type: "warning",
          severity: "high",
          title: `Cảnh cáo: vắng ${s.absent}/${s.total} buổi`,
          detail: "Vượt gấp đôi ngưỡng vắng cho phép, cần làm việc với học viên và gia đình.",
        };
      } else if (s.absent >= data.absent_threshold) {
        payload = {
          record_type: "reminder",
          severity: "medium",
          title: `Nhắc nhở: vắng ${s.absent}/${s.total} buổi`,
          detail: `Đã vắng ${s.absent} buổi, muộn ${s.late} buổi.`,
        };
      } else if (s.total >= 8 && s.absent === 0 && s.late === 0) {
        payload = {
          record_type: "reward",
          severity: "info",
          title: `Khen thưởng: chuyên cần tuyệt đối ${s.total}/${s.total} buổi`,
          detail: "Đi học đầy đủ, đúng giờ.",
        };
      }
      if (!payload) continue;

      const { data: dup } = await supabaseAdmin
        .from("student_conduct_records")
        .select("id")
        .eq("student_profile_id", e.student_profile_id)
        .eq("title", payload.title)
        .eq("auto_generated", true)
        .maybeSingle();
      if (dup) continue;

      await supabaseAdmin.from("student_conduct_records").insert({
        ...payload,
        student_profile_id: e.student_profile_id,
        class_id: e.class_id,
        auto_generated: true,
        created_by: context.userId,
      });
      created++;
    }
    return { created };
  });

/** Số liệu biểu đồ: theo lớp, giáo viên, chương trình. */
export const getTrainingAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [classesRes, enrollRes, attRes, gradeRes, reviewRes, conductRes] = await Promise.all([
      supabaseAdmin.from("training_classes").select("id, name, status, program_id, teacher_user_id"),
      supabaseAdmin.from("training_enrollments").select("id, class_id, status"),
      supabaseAdmin.from("training_attendance").select("enrollment_id, status"),
      supabaseAdmin.from("training_grades").select("enrollment_id, score, max_score"),
      supabaseAdmin.from("student_reviews").select("class_id, overall_score"),
      supabaseAdmin.from("student_conduct_records").select("class_id, record_type"),
    ]);

    const classes = classesRes.data ?? [];
    const enrollByClass: Record<string, string[]> = {};
    (enrollRes.data ?? []).forEach((e: any) => (enrollByClass[e.class_id] ??= []).push(e.id));
    const classOfEnroll: Record<string, string> = {};
    (enrollRes.data ?? []).forEach((e: any) => (classOfEnroll[e.id] = e.class_id));

    const attByClass: Record<string, { present: number; total: number }> = {};
    (attRes.data ?? []).forEach((a: any) => {
      const cid = classOfEnroll[a.enrollment_id];
      if (!cid) return;
      const s = (attByClass[cid] ??= { present: 0, total: 0 });
      s.total++;
      if (a.status === "present" || a.status === "late") s.present++;
    });

    const gradeByClass: Record<string, { sum: number; n: number }> = {};
    (gradeRes.data ?? []).forEach((g: any) => {
      const cid = classOfEnroll[g.enrollment_id];
      if (!cid || g.score == null) return;
      const pct = (Number(g.score) / Number(g.max_score || 10)) * 10;
      const s = (gradeByClass[cid] ??= { sum: 0, n: 0 });
      s.sum += pct;
      s.n++;
    });

    const reviewByClass: Record<string, { sum: number; n: number }> = {};
    (reviewRes.data ?? []).forEach((r: any) => {
      if (!r.class_id || r.overall_score == null) return;
      const s = (reviewByClass[r.class_id] ??= { sum: 0, n: 0 });
      s.sum += Number(r.overall_score);
      s.n++;
    });

    const conductByClass: Record<string, { reward: number; issue: number }> = {};
    (conductRes.data ?? []).forEach((c: any) => {
      if (!c.class_id) return;
      const s = (conductByClass[c.class_id] ??= { reward: 0, issue: 0 });
      if (c.record_type === "reward") s.reward++;
      else s.issue++;
    });

    const byClass = classes.map((c: any) => {
      const att = attByClass[c.id];
      const gr = gradeByClass[c.id];
      const rv = reviewByClass[c.id];
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        teacher_user_id: c.teacher_user_id,
        program_id: c.program_id,
        students: (enrollByClass[c.id] ?? []).length,
        attendanceRate: att?.total ? Math.round((att.present / att.total) * 100) : null,
        avgGrade: gr?.n ? Number((gr.sum / gr.n).toFixed(1)) : null,
        avgReview: rv?.n ? Number((rv.sum / rv.n).toFixed(1)) : null,
        rewards: conductByClass[c.id]?.reward ?? 0,
        issues: conductByClass[c.id]?.issue ?? 0,
      };
    });

    const group = (key: "teacher_user_id" | "program_id") => {
      const map: Record<string, { key: string; classes: number; students: number; att: number[]; grade: number[] }> = {};
      byClass.forEach((c) => {
        const k = (c as any)[key] ?? "unknown";
        const g = (map[k] ??= { key: k, classes: 0, students: 0, att: [], grade: [] });
        g.classes++;
        g.students += c.students;
        if (c.attendanceRate != null) g.att.push(c.attendanceRate);
        if (c.avgGrade != null) g.grade.push(c.avgGrade);
      });
      return Object.values(map).map((g) => ({
        key: g.key,
        classes: g.classes,
        students: g.students,
        attendanceRate: g.att.length ? Math.round(g.att.reduce((a, b) => a + b, 0) / g.att.length) : null,
        avgGrade: g.grade.length ? Number((g.grade.reduce((a, b) => a + b, 0) / g.grade.length).toFixed(1)) : null,
      }));
    };

    const teacherIds = [...new Set(classes.map((c: any) => c.teacher_user_id).filter(Boolean))];
    const { data: profiles } = teacherIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", teacherIds)
      : { data: [] as any[] };
    const { data: programs } = await supabaseAdmin.from("training_programs").select("id, name");

    const teacherName: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => (teacherName[p.id] = p.full_name ?? p.id));
    const programName: Record<string, string> = {};
    (programs ?? []).forEach((p: any) => (programName[p.id] = p.name));

    return {
      byClass,
      byTeacher: group("teacher_user_id").map((t) => ({ ...t, name: teacherName[t.key] ?? "Chưa phân công" })),
      byProgram: group("program_id").map((p) => ({ ...p, name: programName[p.key] ?? "Chưa gán chương trình" })),
    };
  });
