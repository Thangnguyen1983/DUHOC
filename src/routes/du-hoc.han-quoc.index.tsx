import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { MarketHubSections } from "@/components/market-hub/market-hub-sections";
import { prefetchMarketHub } from "@/lib/market-hub-prefetch";
import { STUDY_COUNTRY_LIST } from "@/lib/study-countries";
import { HAN_QUOC_PARTNERS } from "@/lib/han-quoc/partners";
import { getPageBanner } from "@/lib/page-banners.functions";
import { CmsHero } from "@/components/cms-hero";
import { breadcrumbScript } from "@/lib/seo/breadcrumb";
import {
  HAN_IMG,
  HAN_STATS,
  HAN_WHY,
  HAN_PROGRAMS,
  HAN_TIMELINE,
  HAN_REQUIREMENTS,
  HAN_VISA,
  HAN_LIFE,
  HAN_FAQS,
} from "@/lib/du-hoc-han-quoc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  GraduationCap,
  Wallet,
  Award,
  Stamp,
  ArrowRight,
  Sparkles,
  Flame,
  MapPin,
  HelpCircle,
  Heart,
} from "lucide-react";

const PAGE_URL = "https://kaizenmanpower.com/du-hoc/han-quoc";

export const Route = createFileRoute("/du-hoc/han-quoc/")({
  loader: async ({ context }) => {
    const [banner] = await Promise.all([
      getPageBanner({ data: { page_key: "du-hoc:han-quoc" } }),
      prefetchMarketHub(context.queryClient, "du-hoc", "han-quoc"),
    ]);
    return { banner };
  },
  head: () => ({
    meta: [
      { title: "Du học Hàn Quốc tại Nghệ An 2026 — Kaizen" },
      {
        name: "description",
        content:
          "Trung tâm du học Hàn Quốc uy tín tại Nghệ An. Visa D-2, D-4, học bổng GKS, chi phí minh bạch từ 120 triệu/năm. Tỷ lệ đậu visa 98%. Tư vấn miễn phí.",
      },
      { property: "og:title", content: "Du học Hàn Quốc tại Nghệ An 2026 — Kaizen" },
      {
        property: "og:description",
        content:
          "Visa D-2/D-4, học bổng GKS toàn phần, 5 trường đối tác hàng đầu. Tư vấn miễn phí cùng Kaizen.",
      },
      { property: "og:image", content: HAN_IMG.hero },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HAN_IMG.hero },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      breadcrumbScript([
        { name: "Trang chủ", path: "/" },
        { name: "Du học", path: "/du-hoc" },
        { name: "Du học Hàn Quốc", path: "/du-hoc/han-quoc" },
      ]),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Du học Hàn Quốc",
          provider: {
            "@type": "Organization",
            name: "Công ty Cổ phần Nhân lực Quốc tế Kaizen",
            url: "https://kaizenmanpower.com",
          },
          areaServed: { "@type": "Country", name: "Hàn Quốc" },
          serviceType: "Tư vấn du học",
          description:
            "Tư vấn du học Hàn Quốc trọn gói: visa D-2/D-4, học bổng GKS, 5 trường đối tác.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HAN_FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: DuHocHanQuoc,
});

function DuHocHanQuoc() {
  const { banner } = Route.useLoaderData();
  const other = STUDY_COUNTRY_LIST.filter((c) => c.slug !== "han-quoc").slice(0, 6);

  return (
    <PublicLayout>
      {/* HERO */}
      <CmsHero
        banner={banner}
        fallback={
          <section className="relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HAN_IMG.hero})` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1a2f]/85 via-[#1f4d8c]/55 to-[#ff4b4b]/30" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" aria-hidden />

            <div className="relative container mx-auto px-4 py-20 md:py-28">
              <Link
                to="/du-hoc"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.18em] text-white/85 hover:text-white"
              >
                ← Du học quốc tế
              </Link>
              <div className="mt-5 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 text-4xl shadow-2xl">
                  🇰🇷
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                  <Sparkles className="h-3 w-3" /> Trung tâm uy tín tại Nghệ An
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-6xl">
                Du học <span className="text-[#ff5a5f]">Hàn Quốc</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
                Học bổng GKS toàn phần · Làm thêm 20h/tuần · Định cư F-2/F-5 rõ ràng
              </p>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-white/75">
                Hàn Quốc là điểm đến du học châu Á hàng đầu với 5 trường trong top 100 QS World, học bổng Chính phủ GKS toàn phần và lộ trình ở lại làm việc – định cư rõ ràng. Kaizen đồng hành trọn gói từ học tiếng TOPIK đến đặt chân tới Seoul.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#chuong-trinh"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-lg hover:bg-white/95"
                >
                  Xem 4 chương trình <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#tu-van"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#e23a40] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
                >
                  Đăng ký tư vấn miễn phí
                </a>
              </div>
            </div>
          </section>
        }
      />

      {/* QUICK STATS */}
      <section className="relative mt-6 md:mt-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border/50 bg-border/50 shadow-xl md:grid-cols-4">
            {HAN_STATS.map((s) => (
              <div key={s.label} className="bg-white p-5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-1 text-lg font-bold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketHubSections module="du-hoc" market="han-quoc" marketName="Hàn Quốc" />

      {/* WHY */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          eyebrow="Vì sao chọn Hàn Quốc"
          title="6 lý do bạn trẻ Việt chọn du học Hàn"
          desc="Từ học bổng GKS toàn phần đến lộ trình định cư F-5 — Hàn Quốc mang đến gói giá trị mà ít quốc gia châu Á nào sánh kịp."
          icon={<Heart className="h-4 w-4" />}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {HAN_WHY.map((w, i) => (
            <div
              key={w.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0d1a2f] via-[#1f4d8c] to-[#ff5a5f] opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f4d8c]/10 to-[#ff5a5f]/10 text-sm font-bold text-[#1f4d8c]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-[16.5px] font-bold text-foreground">{w.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="chuong-trinh" className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Chương trình"
            title="4 hệ du học Hàn Quốc"
            desc="Chọn chương trình phù hợp với năng lực, ngân sách và lộ trình nghề nghiệp của bạn."
            icon={<GraduationCap className="h-4 w-4" />}
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HAN_PROGRAMS.map((p) => (
              <a
                key={p.slug}
                href="#tu-van"
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.image}
                    alt={`Chương trình ${p.name} — Kaizen`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow-md">
                    {p.visa}
                  </span>
                  {p.hot && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white shadow-md">
                      <Flame className="h-3 w-3" /> Hot
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-[15.5px] font-bold leading-snug text-foreground">{p.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                    <span>⏱ {p.duration}</span>
                    <span>💰 {p.cost}</span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{p.desc}</p>
                  <ul className="mt-3 space-y-1.5">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[12.5px] text-foreground/80">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3F7D3A]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary">
                    Đăng ký tư vấn <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          eyebrow="Lộ trình"
          title="6 bước đặt chân tới Hàn Quốc cùng Kaizen"
          desc="Lộ trình chuẩn 6 – 8 tháng. Kaizen đồng hành sát sao từng bước — bạn không phải lo bất cứ giấy tờ phức tạp nào."
          icon={<MapPin className="h-4 w-4" />}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {HAN_TIMELINE.map((t) => (
            <div
              key={t.step}
              className="relative rounded-2xl border border-border/60 bg-white p-6 shadow-[0_2px_18px_-12px_rgba(15,23,42,0.18)]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f4d8c] to-[#ff5a5f] text-base font-extrabold text-white shadow-md">
                  {t.step}
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1f4d8c]">{t.months}</div>
                  <div className="text-base font-bold text-foreground">{t.title}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="bg-gradient-to-br from-[#1f4d8c]/[0.04] via-background to-[#ff5a5f]/[0.04] py-20">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Yêu cầu hồ sơ"
            title="Điều kiện du học Hàn Quốc 2026"
            desc="Hồ sơ chuẩn 4 nhóm — Kaizen rà soát kỹ trước khi nộp, đảm bảo tỷ lệ đậu visa 98%."
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {HAN_REQUIREMENTS.map((r) => (
              <div key={r.group} className="rounded-2xl border border-border/60 bg-white p-7 shadow-[0_2px_18px_-12px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f4d8c]/10 to-[#ff5a5f]/10 text-2xl">
                    {r.icon}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{r.group}</h3>
                </div>
                <ul className="mt-5 space-y-3">
                  {r.items.map((it) => (
                    <li key={it} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F7D3A]" />
                      <span className="text-foreground/85">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISA & SCHOLARSHIP */}
      <section className="container mx-auto grid gap-10 px-4 py-20 lg:grid-cols-2">
        <InfoPanel
          icon={<Stamp className="h-5 w-5" />}
          eyebrow="Visa & hồ sơ"
          title="6 đầu mục cần chuẩn bị cho visa Hàn Quốc"
          image={HAN_IMG.visa}
        >
          <ol className="space-y-4">
            {HAN_VISA.map((v, i) => (
              <li key={v.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f4d8c]/10 text-xs font-bold text-[#1f4d8c]">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-bold text-foreground">{v.step}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{v.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </InfoPanel>

        <InfoPanel
          icon={<Award className="h-5 w-5" />}
          eyebrow="Học bổng & chi phí"
          title="Học bổng du học Hàn Quốc"
          accent="red"
          image={HAN_IMG.khaigiang}
        >
          <ul className="space-y-3">
            {[
              { label: "Học bổng GKS Chính phủ", value: "TOÀN PHẦN" },
              { label: "Sinh hoạt phí GKS", value: "900.000 KRW/tháng" },
              { label: "Học bổng trường visa thẳng", value: "30 – 100% học phí" },
              { label: "Học bổng địa phương Seoul", value: "50% học phí" },
              { label: "Vé máy bay 1 chiều", value: "5 – 8 triệu VNĐ" },
              { label: "Lệ phí visa", value: "1.300.000 VNĐ" },
            ].map((c) => (
              <li key={c.label} className="flex items-center justify-between rounded-xl bg-[#ff5a5f]/[0.06] px-4 py-3 text-sm">
                <span className="text-foreground/85">{c.label}</span>
                <span className="font-bold text-[#ff4b4b]">{c.value}</span>
              </li>
            ))}
          </ul>
        </InfoPanel>
      </section>

      {/* LIFE IN KOREA */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Đời sống & định cư"
              title="Cuộc sống du học sinh Việt tại Hàn Quốc"
              desc="Không chỉ học và làm — Hàn Quốc là nơi bạn xây dựng cuộc sống mới với cộng đồng người Việt đông đảo, an sinh xã hội hiện đại."
              align="left"
              icon={<Wallet className="h-4 w-4" />}
            />
            <div className="mt-8 space-y-5">
              {HAN_LIFE.map((l) => (
                <div key={l.topic} className="rounded-2xl border border-border/60 bg-white p-5">
                  <h3 className="text-base font-bold text-foreground">{l.topic}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.content}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <img
              src={HAN_IMG.seoul}
              alt="Sinh viên Việt Nam làm thêm tại Hàn Quốc"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
            />
            <div className="grid grid-cols-2 gap-5">
              <img
                src={HAN_IMG.campus}
                alt="Khuôn viên đại học Hàn Quốc"
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover shadow-md"
              />
              <img
                src={HAN_IMG.lamthem}
                alt="Sinh viên làm thêm tại Seoul"
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          eyebrow="Trường đối tác"
          title="Trường đối tác tiêu biểu tại Hàn Quốc"
          desc="5 trường đại học visa thẳng — tỷ lệ đậu visa cao, học bổng ưu đãi cho học viên Kaizen."
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {HAN_QUOC_PARTNERS.map((p) => (
            <Link
              key={p.slug}
              to="/du-hoc/han-quoc/truong/$slug"
              params={{ slug: p.slug }}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)]"
            >
              <div className="relative h-44 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${p.heroImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <MapPin className="h-3 w-3" />
                    {p.city}
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-white">{p.shortName}</h3>
                </div>
                {p.ranking && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#3F7D3A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    {p.ranking}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground line-clamp-2">{p.tagline}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{p.visaType}</span>
                  <span className="text-muted-foreground">{p.tuition}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Câu hỏi thường gặp"
            title="Giải đáp 8 thắc mắc phổ biến nhất"
            desc="Tổng hợp từ hàng nghìn cuộc tư vấn của Kaizen — nếu bạn còn câu hỏi khác, để lại thông tin ở form bên dưới."
            icon={<HelpCircle className="h-4 w-4" />}
          />
          <div className="mx-auto mt-10 max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {HAN_FAQS.map((f, i) => (
                <AccordionItem
                  key={f.q}
                  value={`q-${i}`}
                  className="rounded-xl border border-border/60 bg-white px-5"
                >
                  <AccordionTrigger className="text-left text-[15px] font-bold text-foreground hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* INQUIRY FORM */}
      <section id="tu-van" className="bg-gradient-to-br from-primary/[0.04] via-background to-[#1f4d8c]/[0.04] py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Tư vấn miễn phí
            </span>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
              Bắt đầu hành trình <span className="text-gradient-brand">du học Hàn Quốc</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Để lại thông tin, chuyên gia Kaizen tại Nghệ An sẽ liên hệ trong vòng 24h để tư vấn ngành học, lộ trình tiếng Hàn, chi phí và hồ sơ visa phù hợp nhất với bạn.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Tư vấn 1-1 với chuyên gia 10+ năm thị trường Hàn Quốc",
                "Đánh giá hồ sơ & cơ hội học bổng GKS miễn phí",
                "Đào tạo tiếng Hàn TOPIK 0 → 3 cam kết đầu ra",
                "Đồng hành sau khi sang Hàn — đón sân bay, tìm ký túc",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F7D3A]" />
                  <span className="text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <ConsultationForm defaultProgram="du_hoc" defaultMarket="han-quoc" />
          </div>
        </div>
      </section>

      {/* OTHER COUNTRIES */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          eyebrow="Khám phá thêm"
          title="Các quốc gia du học khác"
          desc="So sánh các điểm đến du học hàng đầu để chọn được hành trình phù hợp nhất."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {other.map((c) => (
            <Link
              key={c.slug}
              to="/du-hoc/$country"
              params={{ country: c.slug }}
              className="group flex min-w-0 items-center gap-4 rounded-2xl border border-border/60 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                {c.flag}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-foreground">Du học {c.shortName}</div>
                <div className="truncate text-xs text-muted-foreground">{c.tagline}</div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
  icon,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  icon?: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
        {icon}
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-muted-foreground">{desc}</p>}
    </div>
  );
}

function InfoPanel({
  icon,
  eyebrow,
  title,
  children,
  accent,
  image,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  accent?: "red";
  image?: string;
}) {
  const ring =
    accent === "red" ? "bg-[#ff4b4b]/10 text-[#ff4b4b]" : "bg-[#1f4d8c]/10 text-[#1f4d8c]";
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_2px_18px_-12px_rgba(15,23,42,0.18)]">
      {image && (
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      )}
      <div className="p-7">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ring}`}>
            {icon}
          </span>
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
