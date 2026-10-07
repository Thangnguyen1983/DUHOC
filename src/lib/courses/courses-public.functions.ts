import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public (unauth) course browsing. Only published courses. */

export const listPublicCourses = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        category: z.string().optional(),
        level: z.string().optional(),
        q: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("courses")
      .select(
        "id, slug, title, subtitle, cover_url, level, category, tags, price_vnd, sale_price_vnd, is_free, total_lessons, total_minutes, students_count, rating_avg, published_at, instructor_id",
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 60);
    if (data.category) q = q.eq("category", data.category);
    if (data.level) q = q.eq("level", data.level as any);
    if (data.q) q = q.ilike("title", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const getPublicCourseBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: course, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!course) return null;

    const [{ data: modules }, { data: lessons }, instructor] = await Promise.all([
      supabaseAdmin
        .from("course_modules")
        .select("id, title, summary, order_index")
        .eq("course_id", (course as any).id)
        .order("order_index"),
      supabaseAdmin
        .from("course_lessons")
        .select("id, module_id, title, type, duration_seconds, is_preview, order_index")
        .eq("course_id", (course as any).id)
        .order("order_index"),
      (course as any).instructor_id
        ? supabaseAdmin
            .from("teachers")
            .select("id, full_name, avatar_url, specialization, bio")
            .eq("id", (course as any).instructor_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      course,
      modules: modules ?? [],
      lessons: lessons ?? [],
      instructor: (instructor as any)?.data ?? null,
    };
  });
