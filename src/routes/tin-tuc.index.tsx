import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";
import { CmsHero } from "@/components/cms-hero";
import { listPublishedPosts } from "@/lib/posts.functions";
import { getPageBanner } from "@/lib/page-banners.functions";

const MARKETS = [
  { slug: "", label: "Tất cả" },
  { slug: "duc", label: "Đức" },
  { slug: "dai-loan", label: "Đài Loan" },
  { slug: "han-quoc", label: "Hàn Quốc" },
  { slug: "nhat-ban", label: "Nhật Bản" },
  { slug: "chau-au", label: "Châu Âu" },
  { slug: "canada", label: "Canada" },
] as const;

const CATEGORIES = [
  { slug: "", label: "Mọi chủ đề" },
  { slug: "tin-tuc", label: "Tin tức" },
  { slug: "kinh-nghiem", label: "Kinh nghiệm" },
  { slug: "huong-dan", label: "Hướng dẫn" },
  { slug: "chi-phi", label: "Chi phí" },
  { slug: "nganh-nghe", label: "Ngành nghề" },
] as const;

const MODULES = [
  { slug: "", label: "Tất cả" },
  { slug: "xkld", label: "XKLĐ" },
  { slug: "du-hoc", label: "Du học" },
  { slug: "ngoai-ngu", label: "Ngoại ngữ" },
  { slug: "outsourcing", label: "Outsourcing" },
  { slug: "visa", label: "Visa" },
] as const;

type Search = { market?: string; category?: string; module?: string };

const postsQuery = (s: Search) =>
  queryOptions({
    queryKey: ["posts", "published", s.market ?? "all", s.category ?? "all", s.module ?? "all"],
    queryFn: () => {
      const payload: any = {};
      if (s.market) payload.market = s.market;
      if (s.category) payload.categorySlug = s.category;
      if (s.module) payload.module = s.module;
      return listPublishedPosts(Object.keys(payload).length ? { data: payload } : undefined);
    },
  });

const searchSchema = z.object({
  market: z.string().optional(),
  category: z.string().optional(),
  module: z.string().optional(),
});

export const Route = createFileRoute("/tin-tuc/")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => ({ market: search.market, category: search.category, module: search.module }),
  loader: async ({ context, deps }) => {
    const [, banner] = await Promise.all([
      context.queryClient.ensureQueryData(postsQuery(deps)),
      getPageBanner({ data: { page_key: "tin-tuc" } }),
    ]);
    return { banner };
  },
  head: () => ({
    meta: [
      { title: "Tin tức — KAIZEN" },
      { name: "description", content: "Cập nhật tin tức về du học, xuất khẩu lao động, học bổng và đời sống tại Nhật, Hàn, Đài Loan, Châu Âu." },
      { property: "og:title", content: "Tin tức KAIZEN" },
      { property: "og:url", content: "/tin-tuc" },
    ],
    links: [{ rel: "canonical", href: "/tin-tuc" }],
  }),
  component: PostList,
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">Lỗi: {error.message}</div>
    </PublicLayout>
  ),
});

function PostList() {
  const search = Route.useSearch();
  const { banner } = Route.useLoaderData();
  const { data } = useSuspenseQuery(postsQuery(search));
  const activeMarket = MARKETS.find((m) => m.slug === (search.market ?? ""))?.label ?? "Tất cả";
  const activeCat = CATEGORIES.find((c) => c.slug === (search.category ?? ""))?.label ?? "Mọi chủ đề";

  const makeSearch = (patch: Partial<Search>): Search => {
    const next = { ...search, ...patch };
    // Remove empty values so URL stays clean
    (Object.keys(next) as (keyof Search)[]).forEach((k) => { if (!next[k]) delete next[k]; });
    return next;
  };

  return (
    <PublicLayout>
      <CmsHero
        banner={banner}
        fallback={
          <PageHero
            eyebrow="Tin tức & Sự kiện"
            title="Tin tức & Bài viết"
            description="Kiến thức, kinh nghiệm, học bổng và đời sống du học - lao động."
          />
        }
      />
      <section className="container mx-auto px-4 py-12">
        <FilterRow label="Module">
          {MODULES.map((m) => {
            const active = (search.module ?? "") === m.slug;
            return (
              <Link
                key={m.slug || "all-mod"}
                to="/tin-tuc"
                search={makeSearch({ module: m.slug || undefined })}
                className={pill(active)}
              >
                {m.label}
              </Link>
            );
          })}
        </FilterRow>

        <FilterRow label="Thị trường">
          {MARKETS.map((m) => {
            const active = (search.market ?? "") === m.slug;
            return (
              <Link
                key={m.slug || "all-mk"}
                to="/tin-tuc"
                search={makeSearch({ market: m.slug || undefined })}
                className={pill(active)}
              >
                {m.label}
              </Link>
            );
          })}
        </FilterRow>

        <FilterRow label="Chủ đề">
          {CATEGORIES.map((c) => {
            const active = (search.category ?? "") === c.slug;
            return (
              <Link
                key={c.slug || "all-cat"}
                to="/tin-tuc"
                search={makeSearch({ category: c.slug || undefined })}
                className={pill(active)}
              >
                {c.label}
              </Link>
            );
          })}
        </FilterRow>

        <div className="mt-4 text-sm text-muted-foreground">
          Đang xem: <span className="font-semibold text-foreground">{activeMarket}</span>
          {" • "}
          <span className="font-semibold text-foreground">{activeCat}</span>
          {" — "}{data.items.length} bài viết
        </div>

        {data.items.length === 0 ? (
          <div className="mt-10 rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            Chưa có bài viết phù hợp bộ lọc này. Hãy thử điều chỉnh lại.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p: any) => (
              <Link
                key={p.id}
                to="/tin-tuc/$slug"
                params={{ slug: p.slug }}
                className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-brand"
              >
                {p.cover_image && (
                  <img src={p.cover_image} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                )}
                <div className="p-5">
                  {p.category && <div className="text-xs font-bold uppercase text-secondary">{p.category}</div>}
                  <h2 className="mt-1 line-clamp-2 text-lg font-bold group-hover:text-primary">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(p.created_at).toLocaleDateString("vi-VN")}</span>
                    {p.module && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold">
                        {p.module}
                      </span>
                    )}
                    {p.market && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {p.market}
                      </span>
                    )}
                    {(p.tags ?? []).slice(0, 2).map((t: any) => (
                      <span key={t.slug} className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                        {t.name}
                      </span>
                    ))}
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

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="mr-1 w-20 shrink-0 text-xs font-semibold uppercase text-muted-foreground">{label}:</span>
      {children}
    </div>
  );
}

function pill(active: boolean) {
  return `rounded-full border px-3 py-1 text-sm transition ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "hover:border-primary/50 hover:text-primary"
  }`;
}

