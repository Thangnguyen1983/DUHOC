import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PremiumHero } from "@/components/premium-hero";
import { listPublishedEntriesByType } from "@/lib/cms-public.functions";
import { getPageBanner } from "@/lib/page-banners.functions";
import { Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-kaizen-real.jpg.asset.json";

const storiesQuery = queryOptions({
  queryKey: ["cms", "success_story", "list"],
  queryFn: () => listPublishedEntriesByType({ data: { typeSlug: "success_story", limit: 60 } }),
});

export const Route = createFileRoute("/cau-chuyen/")({
  loader: async ({ context }) => {
    const [items, banner] = await Promise.all([
      context.queryClient.ensureQueryData(storiesQuery),
      getPageBanner({ data: { page_key: "cau-chuyen" } }),
    ]);
    return { items, banner };
  },
  head: () => ({
    meta: [
      { title: "Câu chuyện học viên KAIZEN" },
      { name: "description", content: "Những hành trình thật của học viên KAIZEN tại Đức, Hàn Quốc, Nhật Bản, Đài Loan, Canada và các thị trường du học – xuất khẩu lao động khác." },
      { property: "og:title", content: "Câu chuyện học viên KAIZEN" },
      { property: "og:description", content: "Hành trình thật của học viên KAIZEN trên toàn cầu." },
      { property: "og:url", content: "/cau-chuyen" },
    ],
    links: [{ rel: "canonical", href: "/cau-chuyen" }],
  }),
  component: StoriesList,
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">Lỗi: {error.message}</div>
    </PublicLayout>
  ),
});

function StoriesList() {
  const { data: items } = useSuspenseQuery(storiesQuery);
  const { banner } = Route.useLoaderData();
  return (
    <PublicLayout>
      <PremiumHero
        banner={banner}
        eyebrow="Câu chuyện thành công"
        eyebrowIcon={<Sparkles className="h-3 w-3" />}
        title={<>Học viên <span className="text-gradient-brand">KAIZEN</span></>}
        description="Những hành trình chân thật của học viên KAIZEN trên khắp thế giới."
        backgroundImage={(heroImg as any).url ?? (heroImg as any).src}
        overlay="dark"
        primaryCta={{ label: "Bắt đầu hành trình", href: "/lien-he" }}
        stats={[
          { label: "Câu chuyện", value: `${items.length}+` },
          { label: "Quốc gia", value: "10+" },
          { label: "Năm đồng hành", value: "15+" },
          { label: "Học viên", value: "10.000+" },
        ]}
      />

      <section className="container mx-auto px-4 py-12">
        {items.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            Chưa có câu chuyện nào được đăng.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((s: any) => (
              <Link
                key={s.id}
                to="/cau-chuyen/$slug"
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
