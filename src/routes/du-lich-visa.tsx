import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";
import { ConsultationForm } from "@/components/consultation-form";
import { Globe, Plane, FileCheck, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/du-lich-visa")({
  head: () => ({
    meta: [
      { title: "Du lịch & Visa — KAIZEN" },
      { name: "description", content: "Dịch vụ tư vấn visa du lịch, công tác và thăm thân tại Nhật Bản, Hàn Quốc, Đài Loan, Châu Âu. Hỗ trợ hồ sơ trọn gói, tỷ lệ đậu cao." },
      { property: "og:title", content: "Du lịch & Visa — KAIZEN" },
      { property: "og:url", content: "/du-lich-visa" },
    ],
    links: [{ rel: "canonical", href: "/du-lich-visa" }],
  }),
  component: TravelVisaPage,
});

function TravelVisaPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Du lịch & Visa"
        title={<>Visa du lịch & Công tác <span className="text-gradient-brand">toàn cầu</span></>}
        description="Hỗ trợ xin visa du lịch, thăm thân và công tác tại các quốc gia hàng đầu. Hồ sơ chuẩn, tỷ lệ đậu cao, tiết kiệm thời gian."
      />

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card icon={Plane} title="Visa du lịch" desc="Tư vấn và hỗ trợ hồ sơ visa du lịch Nhật Bản, Hàn Quốc, Đài Loan, Châu Âu." />
          <Card icon={Globe} title="Visa công tác" desc="Hỗ trợ thủ tục visa công tác ngắn hạn và dài hạn cho doanh nghiệp." />
          <Card icon={FileCheck} title="Visa thăm thân" desc="Hướng dẫn hồ sơ thăm người thân đang sinh sống và làm việc tại nước ngoài." />
          <Card icon={ShieldCheck} title="Bảo hiểm du lịch" desc="Tư vấn gói bảo hiểm du lịch quốc tế phù hợp với từng quốc gia đến." />
        </div>

        <div className="mt-16">
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
