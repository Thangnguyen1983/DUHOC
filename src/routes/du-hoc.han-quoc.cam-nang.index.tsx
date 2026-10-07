import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";
import { HAN_QUOC_GUIDES, CATEGORY_LABEL, type GuideCategory } from "@/lib/han-quoc/guides";
import { Clock, ArrowRight } from "lucide-react";

const PAGE_URL = "https://kaizenmanpower.com/du-hoc/han-quoc/cam-nang";

export const Route = createFileRoute("/du-hoc/han-quoc/cam-nang/")({
  head: () => ({
    meta: [
      { title: "Cẩm nang Du học Hàn Quốc 2026 — Kaizen" },
      {
        name: "description",
        content:
          "Cẩm nang du học Hàn Quốc 2026: hướng dẫn visa D2/D4, hồ sơ, phỏng vấn LSQ, hành lý, ngành học. Trung tâm du học Hàn Quốc uy tín.",
      },
      { property: "og:title", content: "Cẩm nang Du học Hàn Quốc 2026 — Kaizen" },
      { property: "og:description", content: "Visa, hồ sơ, phỏng vấn, hành lý, ngành học — cập nhật mới nhất 2026." },
      { property: "og:url", content: PAGE_URL },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: GuideIndex,
});

const CATEGORIES: { id: GuideCategory | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "visa", label: "Visa" },
  { id: "ho-so", label: "Hồ sơ" },
  { id: "phong-van", label: "Phỏng vấn" },
  { id: "hanh-ly", label: "Hành lý" },
  { id: "nganh-hoc", label: "Ngành học" },
];

function GuideIndex() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Cẩm nang"
        title={<>Cẩm nang <span className="text-gradient-brand">Du học Hàn Quốc</span></>}
        description="Hướng dẫn chi tiết visa, hồ sơ, phỏng vấn, hành lý và ngành học — cập nhật 2026 bởi đội ngũ chuyên gia Kaizen."
      />

      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {c.label}
            </span>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HAN_QUOC_GUIDES.map((g) => (
            <Link
              key={g.slug}
              to="/du-hoc/han-quoc/cam-nang/$slug"
              params={{ slug: g.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${g.heroImage})` }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {CATEGORY_LABEL[g.category]}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-base font-bold leading-snug">{g.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">{g.summary}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {g.readingTime} phút
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    Đọc bài <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
