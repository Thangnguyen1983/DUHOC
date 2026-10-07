import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";


async function assertStaff(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "materials.manage", "lessons.manage", "courses.manage");
}

export type FreeResource = { title: string; url: string; note?: string | null };

const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url().max(1000),
  note: z.string().max(400).nullable().optional(),
});

/** Lưu danh sách nguồn học liệu miễn phí cho bài học (yêu cầu tối thiểu 1 liên kết). */
export const saveLessonResources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        scope: z.enum(["lesson", "course_lesson"]),
        lesson_id: z.string().uuid(),
        resources: z.array(resourceSchema).min(1, "Cần tối thiểu 1 nguồn học liệu miễn phí"),
        min_watch_seconds: z.number().int().min(0).max(86400).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.scope === "lesson" ? "lessons" : "course_lessons";
    const payload: any = { free_resources: data.resources };
    if (data.scope === "course_lesson" && data.min_watch_seconds != null)
      payload.min_watch_seconds = data.min_watch_seconds;
    const { error } = await supabaseAdmin.from(table as any).update(payload).eq("id", data.lesson_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLessonResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ scope: z.enum(["lesson", "course_lesson"]), lesson_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.scope === "lesson" ? "lessons" : "course_lessons";
    const { data: row } = await supabaseAdmin
      .from(table as any)
      .select("id, title, free_resources" + (data.scope === "course_lesson" ? ", min_watch_seconds" : ""))
      .eq("id", data.lesson_id)
      .maybeSingle();
    return {
      title: (row as any)?.title ?? "",
      resources: ((row as any)?.free_resources ?? []) as FreeResource[],
      min_watch_seconds: (row as any)?.min_watch_seconds ?? 0,
    };
  });

/** AI gợi ý nguồn học liệu miễn phí cho bài học; giáo viên duyệt/sửa trước khi lưu. */
export const suggestLessonResources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(300),
        language: z.string().max(80).optional(),
        level: z.string().max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const apiKey = "kaizen-external-ai";
    if (!apiKey) throw new Error("Chưa cấu hình AI");

    const prompt = `Bạn là chuyên gia học liệu ngoại ngữ. Gợi ý 4 nguồn học liệu MIỄN PHÍ, uy tín, còn hoạt động cho bài học sau.
Bài học: "${data.title}"${data.language ? `\nNgôn ngữ: ${data.language}` : ""}${data.level ? `\nTrình độ: ${data.level}` : ""}
Ưu tiên: kênh chính thống (NHK, Deutsche Welle, EBS, Duolingo, YouTube kênh giáo dục lớn), trang chính phủ/đại học.
Trả về DUY NHẤT JSON dạng: {"resources":[{"title":"...","url":"https://...","note":"mô tả ngắn tiếng Việt"}]}`;

    const res = await (await import("@/lib/ai/external-ai.server")).aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error("AI gợi ý thất bại, vui lòng thử lại.");
    const json: any = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { resources: [] as FreeResource[] };
    try {
      const parsed = JSON.parse(match[0]);
      const list = Array.isArray(parsed?.resources) ? parsed.resources : [];
      return {
        resources: list
          .filter((r: any) => r?.title && r?.url)
          .slice(0, 6)
          .map((r: any) => ({ title: String(r.title), url: String(r.url), note: r.note ? String(r.note) : null })),
      };
    } catch {
      return { resources: [] as FreeResource[] };
    }
  });

/**
 * Chấm mức độ hoàn thành bài học online: 60% thời lượng xem + 40% điểm quiz của khoá.
 */
export const scoreLessonCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ course_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lessons } = await supabaseAdmin
      .from("course_lessons")
      .select("id, duration_seconds, min_watch_seconds")
      .eq("course_id", data.course_id);
    const lessonMap: Record<string, { need: number }> = {};
    (lessons ?? []).forEach((l: any) => {
      const need = l.min_watch_seconds || Math.round((l.duration_seconds ?? 0) * 0.8);
      lessonMap[l.id] = { need };
    });

    const { data: progress } = await supabaseAdmin
      .from("course_lesson_progress")
      .select("id, lesson_id, watched_seconds, completed_at")
      .eq("course_id", data.course_id);

    let updated = 0;
    for (const p of progress ?? []) {
      const need = lessonMap[(p as any).lesson_id]?.need ?? 0;
      const watched = (p as any).watched_seconds ?? 0;
      const watchRatio = need > 0 ? Math.min(1, watched / need) : (p as any).completed_at ? 1 : 0;
      const score = Number((watchRatio * 100).toFixed(2));
      const note =
        score >= 80
          ? "Đạt yêu cầu thời lượng học"
          : score >= 40
            ? "Học chưa đủ thời lượng, cần xem lại"
            : "Mới bắt đầu hoặc bỏ dở";
      await supabaseAdmin
        .from("course_lesson_progress")
        .update({ completion_score: score, completion_note: note })
        .eq("id", (p as any).id);
      updated++;
    }
    return { updated };
  });
