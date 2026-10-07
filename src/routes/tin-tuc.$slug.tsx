import { createFileRoute, notFound, Link } from "@tanstack/react-router";
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
import { getPostBySlug } from "@/lib/posts.functions";
import {
  isMarkdown,
  demoteH1,
  extractToc,
  extractFaq,
  readingTimeMinutes,
  wordCount,
  slugify,
  absoluteUrl,
  SITE_URL,
} from "@/lib/blog-seo";
import { normalizeMarkdown, looksUnnormalized } from "@/lib/cms/normalize-markdown";
import { Clock, Calendar, User, ChevronRight, ListOrdered } from "lucide-react";


const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["post", slug],
    queryFn: () => getPostBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/tin-tuc/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!data.post) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const post: any = loaderData?.post;
    if (!post) {
      return {
        meta: [{ title: "Bài viết — KAIZEN" }],
        links: [{ rel: "canonical", href: `${SITE_URL}/tin-tuc/${params.slug}` }],
      };
    }
    const seo = (post.seo ?? {}) as any;
    const rawTitle = seo.title || `${post.title} — KAIZEN`;
    const title = rawTitle.length > 65 ? rawTitle.slice(0, 62) + "…" : rawTitle;
    const rawDesc = seo.description || post.excerpt || `${post.title} — cẩm nang KAIZEN.`;
    const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "…" : rawDesc;
    const canonical = `${SITE_URL}/tin-tuc/${params.slug}`;
    const image = post.cover_image ? absoluteUrl(post.cover_image) : undefined;
    const faq = post.faq && post.faq.length > 0 ? post.faq : extractFaq(post.content ?? "");

    const blogSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      headline: post.title,
      description,
      inLanguage: "vi-VN",
      datePublished: post.created_at,
      dateModified: post.updated_at ?? post.created_at,
      author: { "@type": "Organization", name: "KAIZEN", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "KAIZEN",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
      },
      wordCount: wordCount(post.content ?? ""),
      ...(image ? { image: [image] } : {}),
      ...(post.category ? { articleSection: post.category } : {}),
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Tin tức", item: `${SITE_URL}/tin-tuc` },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical },
      ],
    };

    const scripts: any[] = [
      { type: "application/ld+json", children: JSON.stringify(blogSchema) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema) },
    ];
    if (faq && faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f: any) => ({
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
        ...(image ? [{ property: "og:image:alt", content: post.title }] : []),
        { property: "article:published_time", content: new Date(post.created_at).toISOString() },
        { property: "article:modified_time", content: new Date(post.updated_at ?? post.created_at).toISOString() },
        ...(post.category ? [{ property: "article:section", content: post.category }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts,
    };
  },
  component: PostDetail,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Bài viết không tồn tại</h1>
        <Link to="/tin-tuc" className="mt-4 inline-block text-primary">← Về danh sách</Link>
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

function PostDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(slug));
  const post = data.post!;

  const rawContent: string = post.content ?? "";
  const contentNormalized = useMemo(() => {
    const pre = looksUnnormalized(rawContent) ? normalizeMarkdown(rawContent) : rawContent;
    return demoteH1(pre);
  }, [rawContent]);
  const toc = useMemo(() => extractToc(contentNormalized), [contentNormalized]);
  const rtMin = useMemo(() => readingTimeMinutes(rawContent), [rawContent]);
  const contentIsMd = useMemo(() => isMarkdown(contentNormalized), [contentNormalized]);
  const articleBody = useMemo(
    () => prepareArticleBody(contentNormalized, contentIsMd),
    [contentNormalized, contentIsMd],
  );
  const publishedIso = post.created_at;
  const updatedIso = (post as any).updated_at ?? post.created_at;
  const showUpdated =
    updatedIso &&
    Math.abs(new Date(updatedIso).getTime() - new Date(publishedIso).getTime()) > 24 * 3600 * 1000;

  return (
    <PublicLayout>
      <main className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Trang chủ</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link to="/tin-tuc" className="hover:text-primary">Tin tức</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li aria-current="page" className="line-clamp-1 text-foreground">{post.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article itemScope itemType="https://schema.org/BlogPosting" className="min-w-0">
            <link itemProp="mainEntityOfPage" href={`${SITE_URL}/tin-tuc/${slug}`} />
            <meta itemProp="inLanguage" content="vi-VN" />

            <header className="mb-8">
              {post.category && (
                <div className="text-xs font-bold uppercase tracking-wider text-secondary" itemProp="articleSection">
                  {post.category}
                </div>
              )}
              <h1 itemProp="headline" className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-4 text-lg text-muted-foreground" itemProp="description">
                  {post.excerpt}
                </p>
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
                {showUpdated && (
                  <span className="inline-flex items-center gap-1.5">
                    Cập nhật:{" "}
                    <time itemProp="dateModified" dateTime={new Date(updatedIso).toISOString()}>
                      {formatDate(updatedIso)}
                    </time>
                  </span>
                )}
                {!showUpdated && (
                  <meta itemProp="dateModified" content={new Date(updatedIso).toISOString()} />
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {rtMin} phút đọc
                </span>
              </div>
            </header>

            {post.cover_image && (
              <figure className="mx-auto mb-8 aspect-[16/9] max-h-[520px] w-full overflow-hidden rounded-2xl bg-muted">
                <img
                  src={post.cover_image}
                  alt={post.title}
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

            {/* Mobile TOC */}
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
              title={post.title}
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
                Bài viết được xuất bản bởi <strong>KAIZEN</strong> — trung tâm du học và xuất khẩu lao động uy tín tại Nghệ An.
                Cập nhật lần cuối {formatDate(updatedIso)}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/tin-tuc" className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
                  ← Tất cả bài viết
                </Link>
                <Link to="/lien-he" className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                  Đăng ký tư vấn miễn phí
                </Link>
              </div>
            </footer>
          </article>

          {/* Desktop TOC */}
          {toc.length > 1 && (
            <aside className="hidden lg:block">
              <nav aria-label="Mục lục bài viết" className="sticky top-24 rounded-2xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <ListOrdered className="h-4 w-4" /> Mục lục
                </div>
                <ol className="space-y-1.5 text-sm">
                  {toc.map((t) => (
                    <li key={t.id} className={t.level === 3 ? "ml-4" : ""}>
                      <a
                        href={`#${t.id}`}
                        className="line-clamp-2 text-muted-foreground hover:text-primary"
                      >
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

// Ensure slugify import is retained even if tree-shaking gets aggressive
void slugify;
