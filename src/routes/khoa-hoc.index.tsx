import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listPublicCourses } from "@/lib/courses/courses-public.functions";
import { PublicLayout } from "@/components/public-layout";
import { CoursesHero } from "@/components/courses/courses-hero";
import { Clock, Users, Star, GraduationCap, PlayCircle } from "lucide-react";

const PAGE_URL = "https://kaizenmanpower.com/khoa-hoc";

export const Route = createFileRoute("/khoa-hoc/")({
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["public-courses"],
      queryFn: () => listPublicCourses({ data: {} }),
    }),
  head: () => ({
    meta: [
      { title: "Khoá học trực tuyến — Kaizen E-learning" },
      {
        name: "description",
        content:
          "Khoá học tiếng Hàn, tiếng Nhật, tiếng Đức, tiếng Trung online tại Kaizen. Học mọi lúc, giảng viên bản ngữ, chứng chỉ hoàn thành.",
      },
      { property: "og:title", content: "Khoá học trực tuyến — Kaizen E-learning" },
      { property: "og:description", content: "Học ngoại ngữ online cùng Kaizen — mọi lúc, mọi nơi." },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: CoursesIndex,
});

function fmtVnd(n?: number | null) {
  return (n ?? 0).toLocaleString("vi-VN") + "₫";
}

function CoursesIndex() {
  const fetchFn = useServerFn(listPublicCourses);
  const { data } = useSuspenseQuery({
    queryKey: ["public-courses"],
    queryFn: () => fetchFn({ data: {} }),
  });
  const items = data?.items ?? [];

  const lessonCount = items.reduce((n: number, c: any) => n + (c.total_lessons || 0), 0);
  const studentCount = items.reduce((n: number, c: any) => n + (c.students_count || 0), 0);

  return (
    <PublicLayout>
      <CoursesHero
        courseCount={items.length}
        lessonCount={lessonCount}
        studentCount={studentCount}
      />

      <section id="danh-sach-khoa-hoc" className="container mx-auto px-4 py-12">

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            <GraduationCap className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Chưa có khoá học nào được xuất bản. Vui lòng quay lại sau.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c: any) => (
              <Link
                key={c.id}
                to="/khoa-hoc/$slug"
                params={{ slug: c.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {c.cover_url ? (
                    <img
                      src={c.cover_url}
                      alt={c.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                      <PlayCircle className="h-12 w-12 text-primary/70" />
                    </div>
                  )}
                  {c.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {c.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="line-clamp-2 text-base font-bold leading-snug">{c.title}</h2>
                  {c.subtitle && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.subtitle}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {c.total_lessons} bài · {c.total_minutes}p
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {c.students_count}
                    </span>
                    {c.rating_avg > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{" "}
                        {Number(c.rating_avg).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto pt-4 text-sm">
                    {c.is_free ? (
                      <span className="font-bold text-emerald-600">Miễn phí</span>
                    ) : c.sale_price_vnd ? (
                      <>
                        <span className="text-lg font-bold text-primary">{fmtVnd(c.sale_price_vnd)}</span>
                        <span className="ml-2 text-xs line-through text-muted-foreground">
                          {fmtVnd(c.price_vnd)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">{fmtVnd(c.price_vnd)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
