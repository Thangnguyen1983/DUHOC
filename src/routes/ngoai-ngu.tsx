import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PremiumHero } from "@/components/premium-hero";
import { LANGUAGE_LIST } from "@/lib/languages";
import { ConsultationForm } from "@/components/consultation-form";
import { getPageBanner, type PageBanner } from "@/lib/page-banners.functions";
import { ArrowRight, Languages } from "lucide-react";
import langHero from "@/assets/duc/duc-lopduc.jpg.asset.json";

export const Route = createFileRoute("/ngoai-ngu")({
  head: () => ({
    meta: [
      { title: "Đào tạo Ngoại ngữ — KAIZEN | Nhật, Hàn, Trung, Anh, Đức" },
      { name: "description", content: "Trung tâm ngoại ngữ KAIZEN: tiếng Nhật JLPT, tiếng Hàn TOPIK, tiếng Trung HSK, IELTS/TOEIC, tiếng Đức Goethe — giáo viên giàu kinh nghiệm, cam kết đầu ra." },
      { property: "og:title", content: "Đào tạo Ngoại ngữ cùng KAIZEN" },
      { property: "og:url", content: "/ngoai-ngu" },
    ],
  }),
  component: () => <Outlet />,
});

export function NgoaiNguOverview({ banner }: { banner?: PageBanner | null } = {}) {
  return (
    <PublicLayout>
      <PremiumHero
        banner={banner}
        eyebrow="Đào tạo ngoại ngữ"
        eyebrowIcon={<Languages className="h-3 w-3" />}
        title={<>Chọn <span className="text-gradient-brand">ngoại ngữ</span> phù hợp với bạn</>}
        description="5 thứ tiếng — luyện thi chứng chỉ quốc tế & giao tiếp thực chiến, đồng hành cùng học viên du học và XKLĐ."
        backgroundImage={(langHero as any).url ?? (langHero as any).src ?? undefined}
        overlay="dark"
        primaryCta={{ label: "Đăng ký học thử", href: "#tu-van" }}
        secondaryCta={{ label: "Xem khoá học", href: "#khoa-hoc" }}
        stats={[
          { label: "Ngôn ngữ", value: `${LANGUAGE_LIST.length}` },
          { label: "Giáo viên bản ngữ", value: "20+" },
          { label: "Cam kết đầu ra", value: "JLPT/TOPIK/HSK" },
          { label: "Học phí trọn gói", value: "Minh bạch" },
        ]}
      />

      <section id="khoa-hoc" className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LANGUAGE_LIST.map((l) => (
            <Link
              key={l.slug}
              to="/ngoai-ngu/$lang"
              params={{ lang: l.slug }}
              className="group flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-brand"
            >
              <div className="flex items-center gap-3">
                <div className="text-4xl">{l.flag}</div>
                <div>
                  <h2 className="text-xl font-bold">{l.name}</h2>
                  <p className="text-sm text-muted-foreground">{l.tagline}</p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm text-muted-foreground">{l.description}</p>
              <div className="mt-4 flex items-center gap-1 font-semibold text-primary">
                Xem khóa học <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        <div id="tu-van" className="mt-16">
          <ConsultationForm defaultProgram="du_hoc" />
        </div>
      </section>
    </PublicLayout>
  );
}



