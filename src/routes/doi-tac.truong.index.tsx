import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";
import { CmsHero } from "@/components/cms-hero";
import { listPublishedEntriesByType } from "@/lib/cms-public.functions";
import { getPageBanner } from "@/lib/page-banners.functions";

const schoolsQuery = queryOptions({
  queryKey: ["cms", "school", "list"],
  queryFn: () => listPublishedEntriesByType({ data: { typeSlug: "school", limit: 100 } }),
});

export const Route = createFileRoute("/doi-tac/truong/")({
  loader: async ({ context }) => {
    const [, banner] = await Promise.all([
      context.queryClient.ensureQueryData(schoolsQuery),
      getPageBanner({ data: { page_key: "doi-tac.truong" } }),
    ]);
    return { banner };
  },
  head: () => ({
    meta: [
      { title: "Trường đối tác — KAIZEN" },
      { name: "description", content: "Mạng lưới trường đại học, cao đẳng, học viện đối tác của KAIZEN tại Đức, Hàn Quốc, Nhật Bản, Đài Loan, Canada và các thị trường trọng điểm." },
      { property: "og:title", content: "Trường đối tác KAIZEN" },
      { property: "og:description", content: "Mạng lưới trường đối tác toàn cầu của KAIZEN." },
      { property: "og:url", content: "/doi-tac/truong" },
    ],
    links: [{ rel: "canonical", href: "/doi-tac/truong" }],
  }),
  component: SchoolList,
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">Lỗi: {error.message}</div>
    </PublicLayout>
  ),
});

function SchoolList() {
  const { data: items } = useSuspenseQuery(schoolsQuery);
  const { banner } = Route.useLoaderData();
  return (
    <PublicLayout>
      <CmsHero
        banner={banner}
        fallback={
          <PageHero
            eyebrow="Đối tác đào tạo"
            title="Trường đối tác KAIZEN"
            description="Danh sách các trường đại học – học viện KAIZEN hợp tác trực tiếp."
          />
        }
      />
      <section className="container mx-auto px-4 py-12">
        {items.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            Chưa có trường nào được đăng.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((s: any) => (
              <Link
                key={s.id}
                to="/doi-tac/truong/$slug"
                params={{ slug: s.slug }}
                className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-brand"
              >
                {s.cover_image && (
                  <img src={s.cover_image} alt={s.title} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                )}
                <div className="p-5">
                  <h2 className="line-clamp-2 text-lg font-bold group-hover:text-primary">{s.title}</h2>
                  {s.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
