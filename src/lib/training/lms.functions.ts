import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MANAGE = ["admin", "training_manager", "training_staff"] as const;
const TEACH = ["admin", "training_manager", "training_staff", "teacher"] as const;
const READ = ["admin", "training_manager", "training_staff", "teacher", "cskh"] as const;

async function getRoles(supabase: any, userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role);
}
async function assertRole(ctx: { supabase: any; userId: string }, allowed: readonly string[]) {
  const roles = await getRoles(ctx.supabase, ctx.userId);
  if (!roles.some((r) => allowed.includes(r))) throw new Error("Forbidden");
  return roles;
}

/**
 * Cho phép giáo viên/giáo vụ ghi dữ liệu, nhưng giáo viên chỉ trong phạm vi
 * lớp/chương trình thuộc thị trường mình phụ trách.
 */
async function assertScopedWrite(
  context: { supabase: any; userId: string },
  admin: any,
  row: { class_id?: string | null; program_id?: string | null },
) {
  const roles = await assertRole(context, TEACH);
  const { getTeachingScope, assertInScope } = await import("./scope.server");
  const scope = await getTeachingScope(admin, context.userId, roles);
  if (scope.scopeAll) return roles;
  assertInScope(scope, row);
  return roles;
}

async function assertQuizWritable(context: { supabase: any; userId: string }, admin: any, quizId: string | null) {
  if (!quizId) return assertRole(context, TEACH);
  const { data: quiz } = await admin.from("quizzes").select("class_id, program_id").eq("id", quizId).maybeSingle();
  return assertScopedWrite(context, admin, (quiz as any) ?? {});
}

async function getStudentQuizScope(supabaseAdmin: any, userId: string) {
  const { data: sp } = await supabaseAdmin.from("student_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (!sp) return { studentProfileId: null, classIds: [] as string[], programIds: [] as string[] };
  const { data: enrollments } = await supabaseAdmin
    .from("training_enrollments")
    .select("class_id, status, training_classes(program_id)")
    .eq("student_profile_id", sp.id);
  const active = (enrollments ?? []).filter((e: any) => !["dropped", "suspended"].includes(e.status));
  const classIds = [...new Set(active.map((e: any) => e.class_id).filter(Boolean))] as string[];
  const programIds = [...new Set(active.map((e: any) => e.training_classes?.program_id).filter(Boolean))] as string[];
  return { studentProfileId: sp.id as string, classIds, programIds };
}

async function canStudentAccessQuiz(supabaseAdmin: any, userId: string, quiz: any) {
  const scope = await getStudentQuizScope(supabaseAdmin, userId);
  if (!scope.studentProfileId || quiz.status !== "published") return false;
  if (quiz.class_id && scope.classIds.includes(quiz.class_id)) return true;
  if (quiz.program_id && scope.programIds.includes(quiz.program_id)) return true;
  return false;
}

/* ============ TEACHERS ============ */
export const listTeachers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context, READ);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("teachers").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

const teacherSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().nullable().optional(),
  full_name: z.string().min(1),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});
export const upsertTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => teacherSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, MANAGE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("teachers").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await supabaseAdmin.from("teachers").insert(rest).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
export const deleteTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, MANAGE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("teachers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ LESSONS ============ */
export const listLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    program_id: z.string().uuid().optional(),
    class_id: z.string().uuid().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Học viên: chỉ thấy bài học đã xuất bản của lớp/chương trình mình đang học.
    if (!roles.some((r) => READ.includes(r as any))) {
      if (!roles.includes("student")) throw new Error("Forbidden");
      const scope = await getStudentQuizScope(supabaseAdmin, context.userId);
      if (!scope.studentProfileId) return { items: [] };
      const { data: items, error } = await supabaseAdmin
        .from("lessons")
        .select("*, lesson_attachments(*), training_programs(name), training_classes(name)")
        .eq("status", "published")
        .order("order_index");
      if (error) throw new Error(error.message);
      const mine = (items ?? []).filter((l: any) => {
        if (l.class_id) return scope.classIds.includes(l.class_id);
        if (l.program_id) return scope.programIds.includes(l.program_id);
        return true; // bài học chung, không gắn lớp/chương trình
      });
      return { items: mine };
    }

    let q = supabaseAdmin.from("lessons").select("*, lesson_attachments(*), training_programs(name), training_classes(name)").order("order_index");
    if (data.program_id) q = q.eq("program_id", data.program_id);
    if (data.class_id) q = q.eq("class_id", data.class_id);
    const { data: items, error } = await q;
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });


const lessonSchema = z.object({
  id: z.string().uuid().optional(),
  program_id: z.string().uuid().nullable().optional(),
  class_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
  order_index: z.number().int().default(0),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});
export const upsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => lessonSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, MANAGE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("lessons").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const payload = { ...rest, created_by: context.userId };
    const { data: row, error } = await supabaseAdmin.from("lessons").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, MANAGE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ LEARNING MATERIALS ============ */
export const listMaterials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    program_id: z.string().uuid().optional(),
    class_id: z.string().uuid().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const roles = await assertRole(context, READ);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("learning_materials").select("*, training_programs(name), training_classes(name)").order("created_at", { ascending: false });
    if (data.program_id) q = q.eq("program_id", data.program_id);
    if (data.class_id) q = q.eq("class_id", data.class_id);
    const { data: items, error } = await q;
    if (error) throw new Error(error.message);
    const { getTeachingScope, inScope } = await import("./scope.server");
    const scope = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
    if (scope.scopeAll) return { items: items ?? [] };
    return { items: (items ?? []).filter((m: any) => inScope(scope, m)) };
  });

const materialSchema = z.object({
  id: z.string().uuid().optional(),
  program_id: z.string().uuid().nullable().optional(),
  class_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  file_path: z.string().nullable().optional(),
  file_type: z.string().nullable().optional(),
  file_size: z.number().int().nullable().optional(),
  is_public: z.boolean().default(false),
  // Chuẩn giảng dạy
  market_code: z.string().nullable().optional(),
  material_type: z.enum(["slide", "pdf", "audio", "video", "image", "document"]).default("document"),
  lesson_no: z.number().int().min(1).max(200).nullable().optional(),
  change_note: z.string().nullable().optional(),
  pdf_companion_path: z.string().nullable().optional(),
  curriculum_slot_id: z.string().uuid().nullable().optional(),
});
export const upsertMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => materialSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const roles = await assertScopedWrite(context, supabaseAdmin, { class_id: data.class_id ?? null, program_id: data.program_id ?? null });
    const isStaff = roles.some((r) => MANAGE.includes(r as any));
    const { id, ...rest } = data;
    if (id) {
      const { data: prev } = await supabaseAdmin.from("learning_materials").select("file_path, version, approval_status, created_by").eq("id", id).maybeSingle();
      if (!prev) throw new Error("Không tìm thấy tài liệu");
      if (!isStaff && prev.created_by && prev.created_by !== context.userId) throw new Error("Chỉ người tạo mới được sửa tài liệu này");
      const fileChanged = !!rest.file_path && rest.file_path !== prev.file_path;
      const patch: any = { ...rest };
      if (fileChanged) {
        patch.version = (prev.version ?? 1) + 1;
        // Đổi file → phải duyệt lại (giáo vụ tự duyệt được ngay).
        patch.approval_status = isStaff ? "approved" : "draft";
        patch.approved_by = isStaff ? context.userId : null;
        patch.approved_at = isStaff ? new Date().toISOString() : null;
        patch.rejection_reason = null;
        await supabaseAdmin.from("material_approval_logs").insert({ material_id: id, action: "new_version", from_status: prev.approval_status, to_status: patch.approval_status, note: rest.change_note ?? null, actor_id: context.userId });
      }
      const { error } = await supabaseAdmin.from("learning_materials").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const initial = isStaff
      ? { approval_status: "approved", approved_by: context.userId, approved_at: new Date().toISOString() }
      : { approval_status: "draft" };
    const { data: row, error } = await supabaseAdmin.from("learning_materials").insert({ ...rest, ...initial, created_by: context.userId }).select("id").single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("material_approval_logs").insert({ material_id: row.id, action: "create", to_status: initial.approval_status, actor_id: context.userId });
    return { id: row.id };
  });
export const deleteMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("learning_materials").select("class_id, program_id").eq("id", data.id).maybeSingle();
    await assertScopedWrite(context, supabaseAdmin, (row as any) ?? {});
    const { error } = await supabaseAdmin.from("learning_materials").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSignedMaterialUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string(), bucket: z.enum(["lesson-materials","certificates"]).default("lesson-materials") }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const roles = await getRoles(context.supabase, context.userId);

    // Người ngoài khối đào tạo (học viên) chỉ được ký link cho tài liệu thuộc phạm vi của mình.
    if (!roles.some((r) => READ.includes(r as any))) {
      const scope = await getStudentQuizScope(supabaseAdmin, context.userId);
      if (!scope.studentProfileId) throw new Error("Forbidden");
      let allowed = false;
      if (data.bucket === "certificates") {
        const { data: cert } = await supabaseAdmin
          .from("certificates").select("id")
          .eq("pdf_path", data.path).eq("student_profile_id", scope.studentProfileId).maybeSingle();
        allowed = !!cert;
      } else {
        const { data: mat } = await supabaseAdmin
          .from("learning_materials").select("class_id, program_id, is_public, approval_status")
          .or(`file_path.eq.${data.path},pdf_companion_path.eq.${data.path}`).maybeSingle();
        if (mat) {
          // Học viên chỉ được mở tài liệu đã duyệt.
          allowed = mat.approval_status === "approved" && (!!mat.is_public
            || (!!mat.class_id && scope.classIds.includes(mat.class_id))
            || (!!mat.program_id && scope.programIds.includes(mat.program_id)));
        } else {
          const { data: att } = await supabaseAdmin
            .from("lesson_attachments").select("lessons(class_id, program_id, status)").eq("file_path", data.path).maybeSingle();
          const lesson: any = (att as any)?.lessons;
          if (lesson && lesson.status === "published") {
            allowed = lesson.class_id
              ? scope.classIds.includes(lesson.class_id)
              : lesson.program_id
                ? scope.programIds.includes(lesson.program_id)
                : true;
          }
        }
      }
      if (!allowed) throw new Error("Bạn không có quyền tải tài liệu này");
    } else if (!roles.some((r) => MANAGE.includes(r as any)) && data.bucket === "lesson-materials") {
      // Giáo viên: chỉ mở được nháp của chính mình; tài liệu người khác phải đã duyệt.
      const { data: mat } = await supabaseAdmin
        .from("learning_materials").select("approval_status, created_by")
        .or(`file_path.eq.${data.path},pdf_companion_path.eq.${data.path}`).maybeSingle();
      if (mat && mat.approval_status !== "approved" && mat.created_by !== context.userId) {
        throw new Error("Tài liệu này chưa được duyệt");
      }
    }

    const { data: signed, error } = await supabaseAdmin.storage.from(data.bucket).createSignedUrl(data.path, 3600);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });


/* ============ QUIZZES ============ */
export const listQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!roles.some((r) => READ.includes(r as any)) && roles.includes("student")) {
      const scope = await getStudentQuizScope(supabaseAdmin, context.userId);
      if (!scope.studentProfileId) return { items: [] };
      const byId = new Map<string, any>();
      if (scope.classIds.length > 0) {
        const { data: classQuizzes, error } = await supabaseAdmin
          .from("quizzes")
          .select("*, training_programs(name), training_classes(name), quiz_questions(count)")
          .eq("status", "published")
          .in("class_id", scope.classIds);
        if (error) throw new Error(error.message);
        for (const q of classQuizzes ?? []) byId.set(q.id, q);
      }
      if (scope.programIds.length > 0) {
        const { data: programQuizzes, error } = await supabaseAdmin
          .from("quizzes")
          .select("*, training_programs(name), training_classes(name), quiz_questions(count)")
          .eq("status", "published")
          .in("program_id", scope.programIds);
        if (error) throw new Error(error.message);
        for (const q of programQuizzes ?? []) byId.set(q.id, q);
      }
      return { items: [...byId.values()].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))) };
    }
    if (!roles.some((r) => READ.includes(r as any))) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("quizzes")
      .select("*, training_programs(name), training_classes(name), quiz_questions(count)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { getTeachingScope, inScope } = await import("./scope.server");
    const teachScope = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
    if (teachScope.scopeAll) return { items: data ?? [] };
    return { items: (data ?? []).filter((q: any) => inScope(teachScope, q)) };
  });

export const getQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: quiz, error } = await supabaseAdmin.from("quizzes").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!quiz) throw new Error("Không tìm thấy bài kiểm tra");
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.some((r) => READ.includes(r as any))) {
      if (!roles.includes("student") || !(await canStudentAccessQuiz(supabaseAdmin, context.userId, quiz))) throw new Error("Forbidden");
    } else {
      const { getTeachingScope, assertInScope } = await import("./scope.server");
      const scope = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
      if (!scope.scopeAll) assertInScope(scope, quiz as any);
    }
    const { data: questions } = await supabaseAdmin
      .from("quiz_questions").select("*, quiz_options(*)").eq("quiz_id", data.id).order("order_index");
    return { quiz, questions: questions ?? [] };
  });

const quizSchema = z.object({
  id: z.string().uuid().optional(),
  program_id: z.string().uuid().nullable().optional(),
  class_id: z.string().uuid().nullable().optional(),
  lesson_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  time_limit_minutes: z.number().int().nullable().optional(),
  passing_score: z.number().default(50),
  max_attempts: z.number().int().default(1),
  shuffle_questions: z.boolean().default(false),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
});
export const upsertQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => quizSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertScopedWrite(context, supabaseAdmin, { class_id: data.class_id ?? null, program_id: data.program_id ?? null });
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("quizzes").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await supabaseAdmin.from("quizzes").insert({ ...rest, created_by: context.userId }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertQuizWritable(context, supabaseAdmin, data.id);
    const { error } = await supabaseAdmin.from("quizzes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  quiz_id: z.string().uuid(),
  question_text: z.string().min(1),
  question_type: z.enum(["single_choice", "multiple_choice", "true_false", "short_answer"]).default("single_choice"),
  points: z.number().default(1),
  order_index: z.number().int().default(0),
  explanation: z.string().nullable().optional(),
  correct_answer_text: z.string().nullable().optional(),
  options: z.array(z.object({
    id: z.string().uuid().optional(),
    option_text: z.string(),
    is_correct: z.boolean(),
    order_index: z.number().int().default(0),
  })).default([]),
});
export const upsertQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => questionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertQuizWritable(context, supabaseAdmin, data.quiz_id);
    const { id, options, ...rest } = data;
    let qid = id;
    if (qid) {
      const { error } = await supabaseAdmin.from("quiz_questions").update(rest).eq("id", qid);
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("quiz_options").delete().eq("question_id", qid);
    } else {
      const { data: row, error } = await supabaseAdmin.from("quiz_questions").insert(rest).select("id").single();
      if (error) throw new Error(error.message);
      qid = row.id;
    }
    if (options.length) {
      const optRows = options.map((o, i) => ({ question_id: qid!, option_text: o.option_text, is_correct: o.is_correct, order_index: o.order_index ?? i }));
      const { error } = await supabaseAdmin.from("quiz_options").insert(optRows);
      if (error) throw new Error(error.message);
    }
    return { id: qid };
  });
export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: q } = await supabaseAdmin.from("quiz_questions").select("quiz_id").eq("id", data.id).maybeSingle();
    await assertQuizWritable(context, supabaseAdmin, (q as any)?.quiz_id ?? null);
    const { error } = await supabaseAdmin.from("quiz_questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ STUDENT QUIZ FLOW ============ */
export const startQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ quiz_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sp } = await supabaseAdmin.from("student_profiles").select("id").eq("user_id", context.userId).maybeSingle();
    if (!sp) throw new Error("Bạn chưa có hồ sơ học viên");
    const { data: quiz } = await supabaseAdmin.from("quizzes").select("*").eq("id", data.quiz_id).maybeSingle();
    if (!quiz || quiz.status !== "published") throw new Error("Bài kiểm tra không khả dụng");
    if (!(await canStudentAccessQuiz(supabaseAdmin, context.userId, quiz))) throw new Error("Bạn chưa được gán lớp/chương trình cho bài kiểm tra này");
    const { count } = await supabaseAdmin.from("quiz_attempts").select("*", { count: "exact", head: true })
      .eq("quiz_id", data.quiz_id).eq("student_profile_id", sp.id);
    if ((count ?? 0) >= quiz.max_attempts) throw new Error("Đã vượt số lần làm bài");
    const { data: row, error } = await supabaseAdmin.from("quiz_attempts").insert({
      quiz_id: data.quiz_id, student_profile_id: sp.id, attempt_number: (count ?? 0) + 1, status: "in_progress",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { attempt_id: row.id };
  });

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    attempt_id: z.string().uuid(),
    answers: z.array(z.object({
      question_id: z.string().uuid(),
      selected_option_ids: z.array(z.string().uuid()).optional(),
      answer_text: z.string().optional(),
    })),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: attempt } = await supabaseAdmin.from("quiz_attempts").select("*, student_profiles(user_id)").eq("id", data.attempt_id).maybeSingle();
    if (!attempt || (attempt as any).student_profiles?.user_id !== context.userId) throw new Error("Forbidden");
    if (attempt.status !== "in_progress") throw new Error("Bài đã nộp");

    const { data: questions } = await supabaseAdmin.from("quiz_questions").select("*, quiz_options(*)").eq("quiz_id", attempt.quiz_id);
    const { data: quiz } = await supabaseAdmin.from("quizzes").select("passing_score").eq("id", attempt.quiz_id).maybeSingle();

    let totalScore = 0, maxScore = 0;
    const answerRows: any[] = [];
    for (const q of (questions ?? []) as any[]) {
      maxScore += Number(q.points);
      const ans = data.answers.find((a) => a.question_id === q.id);
      let correct = false, earned = 0;
      if (ans) {
        if (q.question_type === "single_choice" || q.question_type === "true_false") {
          const correctOpts = q.quiz_options.filter((o: any) => o.is_correct).map((o: any) => o.id);
          correct = (ans.selected_option_ids ?? []).length === 1 && correctOpts.includes(ans.selected_option_ids![0]);
          earned = correct ? Number(q.points) : 0;
        } else if (q.question_type === "multiple_choice") {
          const correctOpts = new Set(q.quiz_options.filter((o: any) => o.is_correct).map((o: any) => o.id));
          const sel = new Set(ans.selected_option_ids ?? []);
          correct = correctOpts.size === sel.size && [...correctOpts].every((x) => sel.has(x as string));
          earned = correct ? Number(q.points) : 0;
        } else if (q.question_type === "short_answer") {
          correct = (ans.answer_text ?? "").trim().toLowerCase() === (q.correct_answer_text ?? "").trim().toLowerCase();
          earned = correct ? Number(q.points) : 0;
        }
      }
      totalScore += earned;
      answerRows.push({
        attempt_id: data.attempt_id, question_id: q.id,
        selected_option_ids: ans?.selected_option_ids ?? null,
        answer_text: ans?.answer_text ?? null,
        is_correct: correct, points_earned: earned,
      });
    }

    await supabaseAdmin.from("quiz_answers").insert(answerRows);
    const percent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percent >= Number(quiz?.passing_score ?? 50);
    await supabaseAdmin.from("quiz_attempts").update({
      score: totalScore, max_score: maxScore, passed, status: "graded",
      submitted_at: new Date().toISOString(), graded_at: new Date().toISOString(),
    }).eq("id", data.attempt_id);

    let certificate: any = { eligible: false, issued: false, reason: passed ? "not_checked" : "quiz_not_passed" };
    if (passed) {
      const { tryAutoIssueCertificateForPassedQuiz } = await import("./certificate-automation.server");
      certificate = await tryAutoIssueCertificateForPassedQuiz(supabaseAdmin, {
        studentProfileId: attempt.student_profile_id,
        quizId: attempt.quiz_id,
        issuedBy: context.userId,
      });
    }

    return { score: totalScore, max_score: maxScore, percent: Math.round(percent), passed, certificate };
  });

export const listMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sp } = await supabaseAdmin.from("student_profiles").select("id").eq("user_id", context.userId).maybeSingle();
    if (!sp) return { items: [] };
    const { data } = await supabaseAdmin.from("quiz_attempts")
      .select("*, quizzes(title, passing_score)").eq("student_profile_id", sp.id).order("started_at", { ascending: false });
    return { items: data ?? [] };
  });

/* ============ CERTIFICATES ============ */
export const listCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertRole(context, READ);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("certificates").select("*, student_profiles(full_name, phone, email), training_programs(name), training_classes(name)")
      .order("issued_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { getTeachingScope, inScope } = await import("./scope.server");
    const scope = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
    if (scope.scopeAll) return { items: data ?? [] };
    return { items: (data ?? []).filter((c: any) => inScope(scope, c)) };
  });

export const issueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    student_profile_id: z.string().uuid(),
    program_id: z.string().uuid().nullable().optional(),
    class_id: z.string().uuid().nullable().optional(),
    title: z.string().min(1),
    recipient_name: z.string().min(1),
    expires_at: z.string().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, MANAGE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createCertificateRecord } = await import("./certificate-automation.server");
    return createCertificateRecord(supabaseAdmin, {
      student_profile_id: data.student_profile_id,
      program_id: data.program_id ?? null,
      class_id: data.class_id ?? null,
      title: data.title,
      recipient_name: data.recipient_name,
      expires_at: data.expires_at ?? null,
      issued_by: context.userId,
      meta: { auto_issued: false, source: "manual_admin" },
    });
  });

export const checkAndIssueEnrollmentCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enrollment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, MANAGE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { tryAutoIssueCertificateForEnrollment } = await import("./certificate-automation.server");
    return tryAutoIssueCertificateForEnrollment(supabaseAdmin, { enrollmentId: data.enrollment_id, issuedBy: context.userId });
  });

export const checkAndIssueClassCertificates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ class_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, MANAGE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { tryAutoIssueCertificatesForClass } = await import("./certificate-automation.server");
    return tryAutoIssueCertificatesForClass(supabaseAdmin, { classId: data.class_id, issuedBy: context.userId });
  });

export const revokeCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, MANAGE);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("certificates").update({ status: "revoked" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sp } = await supabaseAdmin.from("student_profiles").select("id").eq("user_id", context.userId).maybeSingle();
    if (!sp) return { items: [] };
    const { data } = await supabaseAdmin.from("certificates")
      .select("*, training_programs(name)").eq("student_profile_id", sp.id).order("issued_at", { ascending: false });
    return { items: data ?? [] };
  });

export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ code: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cert } = await supabaseAdmin.from("certificates")
      .select("certificate_number, verify_code, title, recipient_name, issued_at, expires_at, status, training_programs(name)")
      .eq("verify_code", data.code.toUpperCase()).maybeSingle();
    return { cert };
  });
