import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PremiumHero } from "@/components/premium-hero";
import { ConsultationForm } from "@/components/consultation-form";
import { getPageBanner } from "@/lib/page-banners.functions";
import { Users, Building2, Handshake, TrendingUp, Briefcase } from "lucide-react";
import heroImg from "@/assets/hero-kaizen-global.jpg.asset.json";

export const Route = createFileRoute("/outsourcing")({
  loader: () => getPageBanner({ data: { page_key: "outsourcing" } }),
  head: () => ({
    meta: [
      { title: "Outsourcing & Cung ứng nhân sự — KAIZEN" },
      { name: "description", content: "Giải pháp outsourcing và cung ứng nhân sự chất lượng cao cho doanh nghiệp trong và ngoài nước. Tuyển dụng nhanh, chi phí tối ưu." },
      { property: "og:title", content: "Outsourcing & Cung ứng nhân sự — KAIZEN" },
      { property: "og:url", content: "/outsourcing" },
    ],
    links: [{ rel: "canonical", href: "/outsourcing" }],
  }),
  component: OutsourcingPage,
});

function OutsourcingPage() {
  const banner = Route.useLoaderData();
  return (
    <PublicLayout>
      <PremiumHero
        banner={banner}
        eyebrow="Doanh nghiệp — Outsourcing"
        eyebrowIcon={<Briefcase className="h-3 w-3" />}
        title={<>Giải pháp nhân sự <span className="text-gradient-brand">toàn diện</span></>}
        description="Cung ứng lao động chất lượng cao, outsourcing chuyên môn và quản lý nhân sự thuê ngoài cho doanh nghiệp."
        backgroundImage={(heroImg as any).url ?? (heroImg as any).src}
        overlay="dark"
        primaryCta={{ label: "Nhận đề xuất nhân sự", href: "#tu-van" }}
        secondaryCta={{ label: "Xem dịch vụ", href: "#dich-vu" }}
        stats={[
          { label: "Doanh nghiệp đối tác", value: "500+" },
          { label: "Cung ứng", value: "24h" },
          { label: "Ngành nghề", value: "20+" },
          { label: "Tuân thủ pháp lý", value: "100%" },
        ]}
      />

      <section id="dich-vu" className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card icon={Users} title="Cung ứng lao động" desc="Cung cấp nguồn lao động có tay nghề, đáp ứng nhanh nhu cầu sản xuất của doanh nghiệp." />
          <Card icon={Building2} title="Outsourcing chuyên môn" desc="Thuê ngoài các vị trí chuyên môn: IT, kế toán, nhân sự, marketing." />
          <Card icon={Handshake} title="Quản lý nhân sự" desc="Dịch vụ quản lý nhân sự thuê ngoài: tuyển dụng, đào tạo, chấm công, lương thưởng." />
          <Card icon={TrendingUp} title="Tối ưu chi phí" desc="Giảm thiểu chi phí tuyển dụng và quản lý nội bộ, tập trung vào lõi kinh doanh." />
        </div>

        <div id="tu-van" className="mt-16">
          <ConsultationForm defaultProgram="khac" />
        </div>
      </section>
    </PublicLayout>
  );
}

function Card({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-soft">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-secondary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
