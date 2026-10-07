import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";
import { CmsHero } from "@/components/cms-hero";
import { ConsultationForm } from "@/components/consultation-form";
import { InternationalPartnerSection } from "@/components/international-partner-section";
import { getPageBanner } from "@/lib/page-banners.functions";

export const Route = createFileRoute("/doi-tac/")({
  loader: () => getPageBanner({ data: { page_key: "doi-tac" } }),
  head: () => ({
    meta: [
      { title: "Đối tác quốc tế — Đức, Nhật, Hàn, Đài, Canada, Châu Âu | KAIZEN" },
      {
        name: "description",
        content:
          "Mạng lưới đối tác quốc tế của KAIZEN tại 6 thị trường: CHLB Đức, Nhật Bản, Hàn Quốc, Đài Loan, Canada và Châu Âu — những câu chuyện hợp tác thật, không phải stock.",
      },
      { property: "og:title", content: "Đối tác quốc tế — KAIZEN" },
      { property: "og:url", content: "/doi-tac" },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const banner = Route.useLoaderData();
  return (
    <PublicLayout>
      <CmsHero
        banner={banner}
        fallback={
          <PageHero
            eyebrow="Đối tác quốc tế"
            title={
              <>
                Mạng lưới <span className="text-gradient-brand">hợp tác</span> tại 6 thị trường
              </>
            }
            description="Từ nghiệp đoàn Đức, doanh nghiệp Nhật, đại học Hàn đến cao đẳng Canada — mỗi đối tác là một hành trình đã được Kaizen ký kết và đồng hành nhiều năm."
          />
        }
      />

      <section className="container mx-auto px-4 py-12 md:py-16">
        <InternationalPartnerSection />

        <div className="mt-20">
          <ConsultationForm defaultProgram="khac" />
        </div>
      </section>
    </PublicLayout>
  );
}
