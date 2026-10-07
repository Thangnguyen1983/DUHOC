import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { HAN_QUOC_GUIDES, CATEGORY_LABEL, getGuide, type Guide } from "@/lib/han-quoc/guides";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/du-hoc/han-quoc/cam-nang/$slug")({
  loader: ({ params }) => {
    const guide = getGuide(params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ loaderData, params }) => {
    const g = loaderData?.guide;
    const url = `https://kaizenmanpower.com/du-hoc/han-quoc/cam-nang/${params.slug}`;
    if (!g) {
      return {
        meta: [{ title: "Cẩm nang Du học Hàn Quốc — Kaizen" }],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const rawTitle = g.title;
    const title = rawTitle.length > 65 ? rawTitle.slice(0, 62) + "…" : rawTitle;
    const rawDesc = g.metaDescription || g.summary || "";
    const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "…" : rawDesc;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: g.keyword },
        { name: "author", content: "Kaizen" },
        { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: g.heroImage },
        { property: "og:image:alt", content: g.title },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Kaizen" },
        { property: "og:locale", content: "vi_VN" },
        { property: "article:section", content: CATEGORY_LABEL[g.category] },
        { property: "article:modified_time", content: g.updatedAt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: g.heroImage },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.title,
            description,
            image: g.heroImage,
            datePublished: g.updatedAt,
            dateModified: g.updatedAt,
            inLanguage: "vi-VN",
            author: { "@type": "Organization", name: "Kaizen" },
            publisher: {
              "@type": "Organization",
              name: "Công ty Cổ phần Nhân lực Quốc tế Kaizen",
              url: "https://kaizenmanpower.com",
              logo: { "@type": "ImageObject", url: "https://kaizenmanpower.com/favicon.ico" },
            },
            mainEntityOfPage: url,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: "https://kaizenmanpower.com" },
              { "@type": "ListItem", position: 2, name: "Du học Hàn Quốc", item: "https://kaizenmanpower.com/du-hoc/han-quoc" },
              { "@type": "ListItem", position: 3, name: "Cẩm nang", item: "https://kaizenmanpower.com/du-hoc/han-quoc/cam-nang" },
              { "@type": "ListItem", position: 4, name: g.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Không tìm thấy bài viết</h1>
        <Link to="/du-hoc/han-quoc/cam-nang" className="mt-4 inline-block text-primary">
          ← Về cẩm nang
        </Link>
      </div>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">{error.message}</div>
    </PublicLayout>
  ),
  component: GuideDetail,
});

function GuideDetail() {
  const { guide } = Route.useLoaderData() as { guide: Guide };
  const related = HAN_QUOC_GUIDES.filter(
    (g) => g.slug !== guide.slug && g.category === guide.category,
  ).slice(0, 3);
  const fallbackRelated =
    related.length < 3
      ? HAN_QUOC_GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3)
      : related;

  return (
    <PublicLayout>
      <article>
        {/* Header */}
        <header className="relative overflow-hidden border-b border-border/60 bg-muted/30">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${guide.heroImage})` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white" aria-hidden />
          <div className="relative container mx-auto max-w-3xl px-4 py-12 md:py-16">
            <Link
              to="/du-hoc/han-quoc/cam-nang"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Cẩm nang Du học Hàn Quốc
            </Link>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                {CATEGORY_LABEL[guide.category]}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {guide.readingTime} phút đọc
              </span>
              <span className="text-xs text-muted-foreground">• Cập nhật {guide.updatedAt}</span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">{guide.title}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{guide.summary}</p>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="space-y-8">
            {guide.sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-xl font-bold md:text-2xl">{s.heading}</h2>
                {s.paragraphs?.map((p, j) => (
                  <p key={j} className="mt-3 text-[15px] leading-relaxed text-foreground/85">
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="mt-3 space-y-2">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-[15px] text-foreground/85">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.06] to-[#3F7D3A]/[0.04] p-7 text-center">
            <h3 className="text-xl font-bold">Cần tư vấn chi tiết về {guide.keyword}?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Chuyên viên Kaizen tại Nghệ An sẽ liên hệ trong 24h để tư vấn miễn phí.
            </p>
            <Link
              to="/dang-ky"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#e23a40] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
            >
              Đăng ký tư vấn miễn phí <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Related */}
        {fallbackRelated.length > 0 && (
          <section className="bg-muted/40 py-12">
            <div className="container mx-auto max-w-5xl px-4">
              <h2 className="text-xl font-bold">Bài viết liên quan</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {fallbackRelated.map((g) => (
                  <Link
                    key={g.slug}
                    to="/du-hoc/han-quoc/cam-nang/$slug"
                    params={{ slug: g.slug }}
                    className="group rounded-2xl border border-border/60 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {CATEGORY_LABEL[g.category]}
                    </span>
                    <h3 className="mt-3 font-bold leading-snug">{g.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{g.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Form */}
        <section className="container mx-auto max-w-3xl px-4 py-16">
          <ConsultationForm defaultProgram="du_hoc" defaultMarket="han-quoc" />
        </section>
      </article>
    </PublicLayout>
  );
}
