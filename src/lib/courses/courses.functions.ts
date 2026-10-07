import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ============ COURSES ============ */

const courseInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  cover_url: z.string().max(4000).optional().nullable(),
  trailer_provider: z.enum(["youtube", "vimeo", "bunny", "upload"]).optional().nullable(),
  trailer_video_id: z.string().max(300).optional().nullable(),
  language: z.string().max(20).default("vi"),
  level: z.enum(["beginner", "elementary", "intermediate", "upper", "advanced", "all"]).default("all"),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).default([]),
  price_vnd: z.number().int().min(0).default(0),
  sale_price_vnd: z.number().int().min(0).optional().nullable(),
  is_free: z.boolean().default(false),
  is_published: z.boolean().default(false),
  instructor_id: z.string().uuid().optional().nullable(),
  requirements: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  target_audience: z.array(z.string()).default([]),
  seo: z.record(z.any()).default({}),
  meta: z.record(z.any()).default({}),
});

export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("courses")
      .select("id, slug, title, subtitle, cover_url, level, category, price_vnd, sale_price_vnd, is_free, is_published, published_at, total_lessons, total_minutes, students_count, rating_avg, instructor_id, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: course, error } = await context.supabase
      .from("courses").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!course) throw new Error("Không tìm thấy khoá học");
    const { data: modules } = await context.supabase
      .from("course_modules").select("*").eq("course_id", data.id).order("order_index");
    const { data: lessons } = await context.supabase
      .from("course_lessons").select("*").eq("course_id", data.id).order("order_index");
    return { course, modules: modules ?? [], lessons: lessons ?? [] };
  });

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => courseInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload: any = {
      ...data,
      created_by: context.userId,
      published_at: data.is_published ? new Date().toISOString() : null,
    };
    if (!data.id) delete payload.id;
    const { data: row, error } = await context.supabase
      .from("courses").upsert(payload).select("id, slug").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleCoursePublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_published: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("courses").update({
      is_published: data.is_published,
      published_at: data.is_published ? new Date().toISOString() : null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ MODULES ============ */

const moduleInput = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  summary: z.string().max(2000).optional().nullable(),
  order_index: z.number().int().default(0),
});

export const upsertModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => moduleInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload: any = { ...data };
    if (!data.id) delete payload.id;
    const { data: row, error } = await context.supabase.from("course_modules").upsert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("course_modules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ LESSONS ============ */

const lessonInput = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  module_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  type: z.enum(["video", "text", "quiz", "assignment"]).default("video"),
  video_provider: z.enum(["youtube", "vimeo", "bunny", "upload"]).optional().nullable(),
  video_id: z.string().max(300).optional().nullable(),
  video_url: z.string().max(2000).optional().nullable(),
  content_md: z.string().max(50000).optional().nullable(),
  duration_seconds: z.number().int().min(0).default(0),
  is_preview: z.boolean().default(false),
  order_index: z.number().int().default(0),
});

export const upsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => lessonInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload: any = { ...data };
    if (!data.id) delete payload.id;
    const { data: row, error } = await context.supabase.from("course_lessons").upsert(payload).select("id").single();
    if (error) throw new Error(error.message);

    // Recompute course totals
    const { data: agg } = await context.supabase
      .from("course_lessons")
      .select("duration_seconds")
      .eq("course_id", data.course_id);
    const total_lessons = agg?.length ?? 0;
    const total_minutes = Math.round((agg?.reduce((s, r) => s + (r.duration_seconds || 0), 0) ?? 0) / 60);
    await context.supabase.from("courses").update({ total_lessons, total_minutes }).eq("id", data.course_id);

    return row;
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; course_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("course_lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { data: agg } = await context.supabase
      .from("course_lessons").select("duration_seconds").eq("course_id", data.course_id);
    const total_lessons = agg?.length ?? 0;
    const total_minutes = Math.round((agg?.reduce((s, r) => s + (r.duration_seconds || 0), 0) ?? 0) / 60);
    await context.supabase.from("courses").update({ total_lessons, total_minutes }).eq("id", data.course_id);
    return { ok: true };
  });

/* ============ HELPERS ============ */

export const listOnlineInstructors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("teachers")
      .select("id, full_name, avatar_url, specialization")
      .eq("is_active", true)
      .order("full_name");
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });
