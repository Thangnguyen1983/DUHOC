import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";
import { CmsHero } from "@/components/cms-hero";
import { ConsultationForm } from "@/components/consultation-form";
import { COMPANY } from "@/lib/markets";
import { getPageBanner } from "@/lib/page-banners.functions";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/lien-he")({
  loader: () => getPageBanner({ data: { page_key: "lien-he" } }),
  head: () => ({
    meta: [
      { title: "Liên hệ — KAIZEN" },
      { name: "description", content: `Liên hệ KAIZEN — Hotline ${COMPANY.phone}, Email ${COMPANY.email}.` },
      { property: "og:title", content: "Liên hệ KAIZEN" },
      { property: "og:url", content: "https://kaizenmanpower.com/lien-he" },
    ],
    links: [{ rel: "canonical", href: "https://kaizenmanpower.com/lien-he" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: COMPANY.name,
        telephone: COMPANY.phone,
        email: COMPANY.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: COMPANY.address,
          addressLocality: "Nghệ An",
          addressCountry: "VN",
        },
        url: "https://kaizenmanpower.com/lien-he",
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "08:00",
            closes: "17:30",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Sunday",
            opens: "08:30",
            closes: "11:30",
          },
        ],
      }),
    }],
  }),
  component: Contact,
});

function Contact() {
  const banner = Route.useLoaderData();
  return (
    <PublicLayout>
      <CmsHero
        banner={banner}
        fallback={
          <PageHero
            eyebrow="Liên hệ"
            title={<>Liên hệ <span className="text-gradient-brand">KAIZEN</span></>}
            description="Đội ngũ tư vấn KAIZEN luôn sẵn sàng giải đáp mọi câu hỏi của bạn. Hãy chọn cách liên hệ thuận tiện nhất."
          />
        }
      />

      <section className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-2">
        <div>

          <div className="mt-8 space-y-4">
            <ContactItem icon={Phone} title="Hotline" value={COMPANY.phone} href={`tel:${COMPANY.phoneRaw}`} accent />
            <ContactItem icon={MessageCircle} title="Zalo" value={COMPANY.phone} href={`https://zalo.me/${COMPANY.phoneRaw}`} />
            <ContactItem icon={Mail} title="Email" value={COMPANY.email} href={`mailto:${COMPANY.email}`} />
            <ContactItem icon={MapPin} title="Địa chỉ" value={COMPANY.address} />
          </div>

          <div className="mt-10 rounded-2xl border bg-accent/40 p-6">
            <h3 className="font-bold">Giờ làm việc</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              Thứ 2 — Thứ 7: 8:00 — 17:30 <br />
              Chủ nhật: 8:30 — 11:30
            </div>
          </div>
        </div>

        <ConsultationForm />
      </section>
    </PublicLayout>
  );
}

function ContactItem({ icon: Icon, title, value, href, accent }: any) {
  const inner = (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-lg ${accent ? "gradient-brand text-white" : "bg-accent text-secondary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase text-muted-foreground">{title}</div>
        <div className="mt-0.5 font-semibold">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} className="block hover:opacity-90">{inner}</a> : inner;
}
