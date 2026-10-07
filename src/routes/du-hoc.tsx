import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PremiumHero } from "@/components/premium-hero";
import { STUDY_COUNTRY_LIST } from "@/lib/study-countries";
import { ConsultationForm } from "@/components/consultation-form";
import { type PageBanner } from "@/lib/page-banners.functions";
import { ArrowRight, GraduationCap } from "lucide-react";
import duHocHero from "@/assets/hero-kaizen-global.jpg.asset.json";

export const Route = createFileRoute("/du-hoc")({
  component: DuHocLayout,
});

function DuHocLayout() {
  return <Outlet />;
}

export function DuHocOverview({ banner }: { banner?: PageBanner | null } = {}) {
  return (
    <PublicLayout>
      <PremiumHero
        banner={banner}
        eyebrow="Du học quốc tế"
        eyebrowIcon={<GraduationCap className="h-3 w-3" />}
        title={<>Chọn quốc gia <span className="text-gradient-brand">du học</span></>}
        description="KAIZEN tư vấn du học chính thống tại 8 quốc gia hàng đầu — Hàn Quốc, Đài Loan, Nhật Bản, CHLB Đức, Canada, Úc, Anh Quốc và Mỹ."
        backgroundImage={(duHocHero as any).url ?? (duHocHero as any).src}
        overlay="dark"
        primaryCta={{ label: "Đăng ký tư vấn", href: "#tu-van" }}
        secondaryCta={{ label: "Xem quốc gia", href: "#quoc-gia" }}
        stats={[
          { label: "Quốc gia", value: `${STUDY_COUNTRY_LIST.length}` },
          { label: "Học bổng", value: "Đến 100%" },
          { label: "Học viên đã xuất cảnh", value: "5.000+" },
          { label: "Tỷ lệ visa", value: "98%" },
        ]}
      />


      <section id="quoc-gia" className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">Các quốc gia du học Kaizen tư vấn</h2>
          <p className="mt-3 text-muted-foreground">
            Chi phí minh bạch, học bổng tới 100% và lộ trình hồ sơ – visa rõ ràng cho từng thị trường.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STUDY_COUNTRY_LIST.map((c) => (
            <Link
              key={c.slug}
              to="/du-hoc/$country"
              params={{ country: c.slug }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.28)]"
            >
              <div className="relative h-40 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${c.heroImage})` }}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${c.accent}`} />
                <span className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-2xl shadow-lg">
                  {c.flag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-foreground">Du học {c.shortName}</h3>
                <p className="mt-1 text-[12.5px] font-medium text-primary">{c.tagline}</p>
                <p className="mt-3 flex-1 text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                  Tìm hiểu du học {c.shortName} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <ConsultationForm defaultProgram="du_hoc" />
        </div>
      </section>
    </PublicLayout>
  );
}
