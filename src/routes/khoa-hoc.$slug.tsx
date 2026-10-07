import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPublicCourseBySlug } from "@/lib/courses/courses-public.functions";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  Star,
  PlayCircle,
  CheckCircle2,
  Target,
  BookOpen,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { BuyCourseButton } from "@/components/courses/buy-course-button";

const SITE = "https://kaizenmanpower.com";

export const Route = createFileRoute("/khoa-hoc/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData({
      queryKey: ["public-course", params.slug],
      queryFn: () => getPublicCourseBySlug({ data: { slug: params.slug } }),
    });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const url = `${SITE}/khoa-hoc/${params.slug}`;
    if (!loaderData) {
      return {
        meta: [
          { title: "Khoá học không tồn tại — Kaizen" },
          { name: "robots", content: "noindex" },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const c = loaderData.course as any;
    const title = `${c.title} — Kaizen E-learning`;
    const description = (c.subtitle || c.description || "").slice(0, 160);
    const image = c.cover_url || undefined;
    const price = c.is_free ? 0 : c.sale_price_vnd || c.price_vnd || 0;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: c.title,
            description,
            provider: {
              "@type": "Organization",
              name: "Kaizen",
              sameAs: SITE,
            },
            inLanguage: c.language || "vi-VN",
            ...(image ? { image } : {}),
            ...(loaderData.instructor
              ? {
                  instructor: {
                    "@type": "Person",
                    name: (loaderData.instructor as any).full_name,
                  },
                }
              : {}),
            offers: {
              "@type": "Offer",
              price,
              priceCurrency: "VND",
              availability: "https://schema.org/InStock",
              url,
            },
            ...(c.rating_avg > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: Number(c.rating_avg).toFixed(1),
                    reviewCount: Math.max(1, c.students_count || 1),
                  },
                }
              : {}),
          }),
        },
      ],
    };
  },
  component: CourseDetail,
});

function fmtVnd(n?: number | null) {
  return (n ?? 0).toLocaleString("vi-VN") + "₫";
}
function fmtDur(sec: number) {
  const m = Math.round((sec || 0) / 60);
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}p` : `${h}h`;
}

function CourseDetail() {
  const params = Route.useParams();
  const fetchFn = useServerFn(getPublicCourseBySlug);
  const { data } = useSuspenseQuery({
    queryKey: ["public-course", params.slug],
    queryFn: () => fetchFn({ data: { slug: params.slug } }),
  });
  const c = (data as any).course;
  const modules = (data as any).modules as any[];
  const lessons = (data as any).lessons as any[];
  const instructor = (data as any).instructor;

  const lessonsByModule = new Map<string, any[]>();
  for (const l of lessons) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push(l);
    lessonsByModule.set(l.module_id, arr);
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0a1a] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="container relative mx-auto grid gap-8 px-4 py-12 md:grid-cols-3 md:py-16">
          <div className="md:col-span-2">
            <Link to="/khoa-hoc" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Tất cả khoá học
            </Link>
            {c.category && (
              <span className="mt-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {c.category}
              </span>
            )}
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">{c.title}</h1>
            {c.subtitle && <p className="mt-4 text-lg text-white/80">{c.subtitle}</p>}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> {c.total_lessons} bài học
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {c.total_minutes} phút
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {c.students_count} học viên
              </span>
              {c.rating_avg > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {Number(c.rating_avg).toFixed(1)}
                </span>
              )}
            </div>
            {instructor && (
              <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4">
                {instructor.avatar_url && (
                  <img
                    src={instructor.avatar_url}
                    alt={instructor.full_name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <span className="text-sm">
                  Giảng viên: <b>{instructor.full_name}</b>
                </span>
              </div>
            )}
          </div>

          {/* Purchase card */}
          <aside className="md:col-span-1">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-white/10 bg-white text-foreground shadow-xl">
              <div className="relative aspect-video bg-muted">
                {c.cover_url ? (
                  <img src={c.cover_url} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                    <PlayCircle className="h-14 w-14 text-primary/70" />
                  </div>
                )}
              </div>
              <div className="space-y-4 p-5">
                <div>
                  {c.is_free ? (
                    <div className="text-2xl font-bold text-emerald-600">Miễn phí</div>
                  ) : c.sale_price_vnd ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">{fmtVnd(c.sale_price_vnd)}</span>
                      <span className="text-sm line-through text-muted-foreground">{fmtVnd(c.price_vnd)}</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">{fmtVnd(c.price_vnd)}</div>
                  )}
                </div>
                <BuyCourseButton courseId={c.id} isFree={c.is_free} />
                <p className="text-xs text-muted-foreground">
                  * Thanh toán an toàn qua PAY2S / MoMo / ZaloPay / VietQR. Kích hoạt tự động sau khi thanh toán.
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Học trọn đời
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Chứng chỉ hoàn thành
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Hỗ trợ Q&amp;A cùng giảng viên
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Body */}
      <section className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-3">
        <div className="space-y-10 md:col-span-2">
          {c.outcomes?.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-bold">Bạn sẽ đạt được</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {c.outcomes.map((o: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.description && (
            <div>
              <h2 className="mb-4 text-xl font-bold">Giới thiệu</h2>
              <div className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                {c.description}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-xl font-bold">Chương trình học</h2>
            <div className="space-y-3">
              {modules.map((m) => {
                const items = lessonsByModule.get(m.id) ?? [];
                return (
                  <div key={m.id} className="overflow-hidden rounded-xl border">
                    <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
                      <div>
                        <div className="font-semibold">{m.title}</div>
                        {m.summary && <div className="text-xs text-muted-foreground">{m.summary}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground">{items.length} bài</div>
                    </div>
                    <ul className="divide-y">
                      {items.map((l) => (
                        <li key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="flex items-center gap-2">
                            {l.is_preview ? (
                              <PlayCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            {l.title}
                            {l.is_preview && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                Học thử
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{fmtDur(l.duration_seconds)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {modules.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Chương trình học đang được cập nhật.
                </div>
              )}
            </div>
          </div>

          {c.requirements?.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-bold">Yêu cầu</h2>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                {c.requirements.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {c.target_audience?.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-bold">Dành cho ai</h2>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                {c.target_audience.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="md:col-span-1">
          {instructor && (
            <div className="rounded-2xl border p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Giảng viên
              </h3>
              <div className="flex items-center gap-3">
                {instructor.avatar_url && (
                  <img
                    src={instructor.avatar_url}
                    alt={instructor.full_name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold">{instructor.full_name}</div>
                  {instructor.specialization && (
                    <div className="text-xs text-muted-foreground">{instructor.specialization}</div>
                  )}
                </div>
              </div>
              {instructor.bio && (
                <p className="mt-3 text-sm text-muted-foreground">{instructor.bio}</p>
              )}
            </div>
          )}
        </aside>
      </section>
    </PublicLayout>
  );
}
