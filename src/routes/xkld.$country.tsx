import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { MARKETS } from "@/lib/markets";
import { fetchPublicMarket } from "@/lib/markets.catalog";
import { MarketHubSections } from "@/components/market-hub/market-hub-sections";
import { prefetchMarketHub } from "@/lib/market-hub-prefetch";
import { getXkldContent } from "@/lib/xkld-market-content";
import { getPageBanner } from "@/lib/page-banners.functions";
import { CmsHero } from "@/components/cms-hero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Wallet,
  ClipboardList,
  Award,
} from "lucide-react";

export const Route = createFileRoute("/xkld/$country")({
  loader: async ({ params, context }) => {
    const market = (await fetchPublicMarket(params.country)) ?? MARKETS[params.country];
    if (!market) throw notFound();
    const [banner] = await Promise.all([
      getPageBanner({ data: { page_key: `xkld:${params.country}` } }),
      prefetchMarketHub(context.queryClient, "xkld", market.slug),
    ]);
    return { market, banner };
  },
  head: ({ loaderData, params }) => {
    const m = loaderData?.market;
    const c = m ? getXkldContent(m.slug) : null;
    const title = m ? `XKLĐ ${m.name} 2026 — Đơn hàng, chi phí, quy trình | KAIZEN` : "Xuất khẩu lao động";
    const desc = m ? `Xuất khẩu lao động ${m.name}: ${m.tagline}. ${m.description}` : "";
    const url = `https://kaizenmanpower.com/xkld/${params.country}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        ...(c?.heroImage ? [{ property: "og:image", content: c.heroImage } as const] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: m && c
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Service",
                serviceType: `Xuất khẩu lao động ${m.name}`,
                name: `XKLĐ ${m.name}`,
                description: desc,
                areaServed: m.name,
                provider: {
                  "@type": "Organization",
                  name: "KAIZEN",
                  url: "https://kaizenmanpower.com",
                },
                url,
              }),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: c.faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            },
          ]
        : [],
    };
  },
  component: XkldCountry,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Không tìm thấy thị trường</h1>
        <Link to="/xkld" className="mt-4 inline-block text-primary">← Về danh sách XKLĐ</Link>
      </div>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">
        Lỗi: {error.message}
      </div>
    </PublicLayout>
  ),
});

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: React.ReactNode; desc?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-muted-foreground">{desc}</p>}
    </div>
  );
}

function XkldCountry() {
  const { market, banner } = Route.useLoaderData();
  const c = getXkldContent(market.slug);

  return (
    <PublicLayout>
      {/* HERO */}
      <CmsHero
        banner={banner}
        fallback={
          <section className="relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${c.heroImage})` }}
              aria-hidden
            />
            <div className={`absolute inset-0 ${c.overlay}`} aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" aria-hidden />

            <div className="relative container mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-40">
              <Link
                to="/xkld"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.18em] text-white/85 hover:text-white"
              >
                ← Nhân lực quốc tế
              </Link>
              <div className="mt-5 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 text-4xl shadow-2xl">
                  {market.flag}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                  <Sparkles className="h-3 w-3" /> Xuất khẩu lao động 2026
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight text-white md:text-6xl">
                XKLĐ <span style={{ color: c.accent }}>{market.name}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">{market.tagline}</p>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-white/75">{market.description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#tu-van"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#e23a40] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
                >
                  Đăng ký tư vấn miễn phí <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#quy-trinh"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-lg hover:bg-white/95"
                >
                  Xem quy trình
                </a>
              </div>
            </div>
          </section>
        }
      />

      {/* FLOATING STATS CARD */}
      <section className="relative z-10 mt-6 md:mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border/50 bg-border/60 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_70px_-24px_rgba(15,23,42,0.45)] sm:grid-cols-2 md:grid-cols-4">
            {[
              { label: "Năm kinh nghiệm", value: "15+", sub: "Đồng hành lao động Việt từ 2010" },
              { label: "Giấy phép", value: "Bộ LĐTBXH", sub: "Hoạt động XKLĐ hợp pháp" },
              { label: "Lao động đã đi", value: "3.000+", sub: "Xuất cảnh thành công" },
              { label: "Chi phí", value: "100% Minh bạch", sub: "Hợp đồng công khai" },
            ].map((s) => (
              <div key={s.label} className="bg-white p-6 md:p-7">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{s.label}</div>
                <div className="mt-2 text-2xl md:text-3xl font-extrabold text-gradient-brand leading-tight">{s.value}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKET HUB (news/kinh-nghiem/huong-dan/faq) */}
      <MarketHubSections module="xkld" market={market.slug} marketName={market.name} />


      {/* INTRO + STATS */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Giới thiệu
            </span>
            <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
              Vì sao chọn Kaizen cho hành trình <span className="text-gradient-brand">{market.name}</span>?
            </h2>
            <p className="mt-4 text-muted-foreground">{market.description}</p>
            <ul className="mt-6 space-y-3">
              {[
                "Giấy phép hoạt động XKLĐ do Bộ LĐTBXH cấp.",
                "Đối tác trực tiếp với nghiệp đoàn/chủ sử dụng — không qua trung gian.",
                "Chi phí công khai theo hợp đồng, hoàn phí minh bạch nếu không xuất cảnh.",
                "Đội ngũ 15+ năm kinh nghiệm, cán bộ đại diện tại nước sở tại.",
                "Đào tạo ngoại ngữ + kỹ năng nghề trước xuất cảnh.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F7D3A]" />
                  <span className="text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4 content-start">
            {c.stats.map((s) => (
              <div key={s.l} className="rounded-2xl border border-border/60 bg-white p-6 text-center shadow-[0_2px_18px_-12px_rgba(15,23,42,0.18)]">
                <div className="text-3xl font-extrabold text-gradient-brand md:text-4xl">{s.n}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS / BENEFITS */}
      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Quyền lợi" title={`Vì sao đi ${market.name}?`} />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            {market.highlights.map((h: string) => (
              <div key={h} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </span>
                <p className="text-sm text-foreground/85">{h}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOBS */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <SectionHeader
          eyebrow="Ngành nghề"
          title="Đơn hàng tiêu biểu"
          desc="Nhóm ngành có nhu cầu tuyển dụng cao và mức thu nhập ổn định."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {c.jobs.map((j) => (
            <div key={j.name} className="group rounded-2xl border border-border/60 bg-white p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#e23a40] text-white">
                  <Briefcase className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold">{j.name}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{j.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REQUIREMENTS + COSTS */}
      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-white p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              <ClipboardList className="h-3 w-3" /> Điều kiện
            </span>
            <h3 className="mt-3 text-xl font-bold">Điều kiện tham gia</h3>
            <ul className="mt-5 space-y-2.5">
              {c.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F7D3A]" />
                  <span className="text-foreground/85">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              <Wallet className="h-3 w-3" /> Chi phí
            </span>
            <h3 className="mt-3 text-xl font-bold">Bảng chi phí tham khảo</h3>
            <ul className="mt-5 divide-y">
              {c.costs.map((k) => (
                <li key={k.label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">{k.label}</span>
                  <span className="font-semibold text-foreground">{k.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              * Chi phí thực tế theo từng đơn hàng — Kaizen ký hợp đồng minh bạch, không phát sinh phí ngoài.
            </p>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="quy-trinh" className="container mx-auto px-4 py-16 md:py-20">
        <SectionHeader eyebrow="Quy trình" title="6 bước xuất cảnh cùng Kaizen" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.steps.map((s) => (
            <div key={s.no} className="rounded-2xl border border-border/60 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="text-3xl font-extrabold text-gradient-brand">{s.no}</div>
              <h3 className="mt-2 text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Hỏi đáp" title={`Câu hỏi thường gặp — XKLĐ ${market.name}`} />
          <Accordion type="single" collapsible className="mx-auto mt-10 max-w-3xl">
            {c.faqs.map((f, i) => (
              <AccordionItem key={i} value={`i${i}`} className="rounded-2xl border border-border/60 bg-white px-5 mb-3">
                <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CONSULTATION */}
      <section id="tu-van" className="container mx-auto px-4 py-16 md:py-20">
        <ConsultationForm defaultProgram="xkld" defaultMarket={market.slug} />
      </section>
    </PublicLayout>
  );
}
