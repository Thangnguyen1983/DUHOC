import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import { PublicLayout } from "@/components/public-layout";
import { ArticleMedia, articleMarkdownComponents } from "@/components/content/article-media";
import { prepareArticleBody } from "@/lib/article-content";
import { getPublishedEntryBySlug } from "@/lib/cms-public.functions";
import {
  isMarkdown,
  demoteH1,
  extractToc,
  extractFaq,
  readingTimeMinutes,
  wordCount,
  absoluteUrl,
  SITE_URL,
} from "@/lib/blog-seo";
import { normalizeMarkdown, looksUnnormalized } from "@/lib/cms/normalize-markdown";
import { Calendar, ChevronRight, Clock, ListOrdered, User } from "lucide-react";


const storyQuery = (slug: string) =>
  queryOptions({
    queryKey: ["cms", "success_story", slug],
    queryFn: () => getPublishedEntryBySlug({ data: { typeSlug: "success_story", slug } }),
  });

export const Route = createFileRoute("/cau-chuyen/$slug")({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(storyQuery(params.slug));
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    const e = loaderData?.entry as any;
    const canonical = `${SITE_URL}/cau-chuyen/${params.slug}`;
    if (!e) {
      return {
        meta: [{ title: "Câu chuyện học viên — KAIZEN" }],
        links: [{ rel: "canonical", href: canonical }],
      };
    }
    const rawTitle = `${e.title} — KAIZEN`;
    const title = rawTitle.length > 65 ? rawTitle.slice(0, 62) + "…" : rawTitle;
    const rawDesc = e.excerpt || `Câu chuyện học viên KAIZEN: ${e.title}.`;
    const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "…" : rawDesc;
    const image = e.cover_image ? absoluteUrl(e.cover_image) : undefined;
    const publishedIso = e.published_at ?? e.created_at;
    const updatedIso = e.updated_at ?? publishedIso;
    const body = (e.data?.body as string) || "";
    const faq = extractFaq(body);

    const blogSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Article",
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      headline: e.title,
      description,
      inLanguage: "vi-VN",
      datePublished: new Date(publishedIso).toISOString(),
      dateModified: new Date(updatedIso).toISOString(),
      author: { "@type": "Organization", name: "KAIZEN", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "KAIZEN",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
      },
      wordCount: wordCount(body),
      ...(image ? { image: [image] } : {}),
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Câu chuyện", item: `${SITE_URL}/cau-chuyen` },
        { "@type": "ListItem", position: 3, name: e.title, item: canonical },
      ],
    };

    const scripts: any[] = [
      { type: "application/ld+json", children: JSON.stringify(blogSchema) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema) },
    ];
    if (faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }),
      });
    }

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "author", content: "KAIZEN" },
        { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "KAIZEN" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:locale", content: "vi_VN" },
        ...(image ? [{ property: "og:image", content: image }] : []),
        ...(image ? [{ property: "og:image:alt", content: e.title }] : []),
        { property: "article:published_time", content: new Date(publishedIso).toISOString() },
        { property: "article:modified_time", content: new Date(updatedIso).toISOString() },
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts,
    };
  },
  component: StoryDetail,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Câu chuyện không tồn tại</h1>
        <Link to="/cau-chuyen" className="mt-4 inline-block text-primary">← Về danh sách</Link>
      </div>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">Lỗi: {error.message}</div>
    </PublicLayout>
  ),
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
}

function isExternalHref(href?: string) {
  if (!href) return false;
  if (href.startsWith("/") || href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  try {
    const u = new URL(href, SITE_URL);
    return u.hostname !== new URL(SITE_URL).hostname;
  } catch {
    return false;
  }
}

function StoryDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(storyQuery(slug));
  const e = data!.entry as any;
  const rawBody: string = (e.data?.body as string) || "";
  const bodyNormalized = useMemo(() => {
    const pre = looksUnnormalized(rawBody) ? normalizeMarkdown(rawBody) : rawBody;
    return demoteH1(pre);
  }, [rawBody]);
  const toc = useMemo(() => extractToc(bodyNormalized), [bodyNormalized]);
  const rtMin = useMemo(() => readingTimeMinutes(rawBody), [rawBody]);
  const contentIsMd = useMemo(() => isMarkdown(bodyNormalized), [bodyNormalized]);
  const articleBody = useMemo(
    () => prepareArticleBody(bodyNormalized, contentIsMd),
    [bodyNormalized, contentIsMd],
  );
  const publishedIso = e.published_at ?? e.created_at;
  const updatedIso = e.updated_at ?? publishedIso;
  const showUpdated =
    updatedIso &&
    Math.abs(new Date(updatedIso).getTime() - new Date(publishedIso).getTime()) > 24 * 3600 * 1000;

  return (
    <PublicLayout>
      <main className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Trang chủ</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link to="/cau-chuyen" className="hover:text-primary">Câu chuyện</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li aria-current="page" className="line-clamp-1 text-foreground">{e.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article itemScope itemType="https://schema.org/Article" className="min-w-0">
            <link itemProp="mainEntityOfPage" href={`${SITE_URL}/cau-chuyen/${slug}`} />
            <meta itemProp="inLanguage" content="vi-VN" />

            <header className="mb-8">
              <div className="text-xs font-bold uppercase tracking-wider text-secondary">Câu chuyện học viên</div>
              <h1 itemProp="headline" className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">
                {e.title}
              </h1>
              {e.excerpt && (
                <p className="mt-4 text-lg text-muted-foreground" itemProp="description">{e.excerpt}</p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5" itemProp="author" itemScope itemType="https://schema.org/Organization">
                  <User className="h-3.5 w-3.5" />
                  <span itemProp="name">KAIZEN</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <time itemProp="datePublished" dateTime={new Date(publishedIso).toISOString()}>
                    {formatDate(publishedIso)}
                  </time>
                </span>
                {showUpdated ? (
                  <span className="inline-flex items-center gap-1.5">
                    Cập nhật:{" "}
                    <time itemProp="dateModified" dateTime={new Date(updatedIso).toISOString()}>
                      {formatDate(updatedIso)}
                    </time>
                  </span>
                ) : (
                  <meta itemProp="dateModified" content={new Date(updatedIso).toISOString()} />
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {rtMin} phút đọc
                </span>
              </div>
            </header>

            {e.cover_image && (
              <figure className="mx-auto mb-8 aspect-[16/9] max-h-[520px] w-full overflow-hidden rounded-2xl bg-muted">
                <img
                  src={e.cover_image}
                  alt={e.title}
                  width={1600}
                  height={900}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  itemProp="image"
                  className="h-full w-full object-cover"
                />
              </figure>
            )}

            {toc.length > 1 && (
              <details className="mb-8 rounded-2xl border bg-card p-4 lg:hidden">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <ListOrdered className="h-4 w-4" /> Mục lục
                </summary>
                <ol className="mt-3 space-y-1.5 text-sm">
                  {toc.map((t) => (
                    <li key={t.id} className={t.level === 3 ? "ml-4" : ""}>
                      <a href={`#${t.id}`} className="text-muted-foreground hover:text-primary">{t.text}</a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <ArticleMedia
              title={e.title}
              itemProp="articleBody"
              className="prose prose-lg prose-neutral max-w-none leading-relaxed prose-headings:scroll-mt-24 prose-a:text-primary"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={{
                  ...articleMarkdownComponents,
                  a: ({ href, children, ...p }: any) =>
                    isExternalHref(href) ? (
                      <a href={href} {...p} target="_blank" rel="noopener noreferrer nofollow">{children}</a>
                    ) : (
                      <a href={href} {...p}>{children}</a>
                    ),
                }}
              >
                {articleBody}
              </ReactMarkdown>
            </ArticleMedia>

            <footer className="mt-12 rounded-2xl border bg-muted/30 p-6">
              <p className="text-sm text-muted-foreground">
                Câu chuyện được KAIZEN — trung tâm du học và xuất khẩu lao động tại Nghệ An — chia sẻ.
                Cập nhật lần cuối {formatDate(updatedIso)}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/cau-chuyen" className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
                  ← Xem thêm câu chuyện
                </Link>
                <Link to="/dang-ky" className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                  Đăng ký tư vấn miễn phí
                </Link>
              </div>
            </footer>
          </article>

          {toc.length > 1 && (
            <aside className="hidden lg:block">
              <nav aria-label="Mục lục" className="sticky top-24 rounded-2xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <ListOrdered className="h-4 w-4" /> Mục lục
                </div>
                <ol className="space-y-1.5 text-sm">
                  {toc.map((t) => (
                    <li key={t.id} className={t.level === 3 ? "ml-4" : ""}>
                      <a href={`#${t.id}`} className="line-clamp-2 text-muted-foreground hover:text-primary">
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          )}
        </div>
      </main>
    </PublicLayout>
  );
}
