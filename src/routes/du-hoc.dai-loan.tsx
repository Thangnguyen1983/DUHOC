import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { MarketHubSections } from "@/components/market-hub/market-hub-sections";
import { prefetchMarketHub } from "@/lib/market-hub-prefetch";
import { STUDY_COUNTRY_LIST } from "@/lib/study-countries";
import { getPageBanner } from "@/lib/page-banners.functions";
import { CmsHero } from "@/components/cms-hero";
import { breadcrumbScript } from "@/lib/seo/breadcrumb";
import {
  TW_IMG,
  TW_STATS,
  TW_WHY,
  TW_PROGRAMS,
  TW_TIMELINE,
  TW_REQUIREMENTS,
  TW_VISA,
  TW_LIFE,
  TW_FAQS,
} from "@/lib/du-hoc-dai-loan";
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

export const Route = createFileRoute("/du-hoc/dai-loan")({
  loader: async ({ context }) => {
    const [banner] = await Promise.all([
      getPageBanner({ data: { page_key: "du-hoc:dai-loan" } }),
      prefetchMarketHub(context.queryClient, "du-hoc", "dai-loan"),
    ]);
    return { banner };
  },
  head: () => {
    const title = "Du học Đài Loan 2026 — Học bổng 100%, Vừa học Vừa làm | Kaizen";
    const desc =
      "Du học Đài Loan với học bổng MOE/ICDF tới 100%, hệ Vừa học Vừa làm lương 22.000–30.000 NTĐ/tháng, top trường NTU/NCKU. Tư vấn miễn phí cùng Kaizen.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: TW_IMG.hero },
        { property: "og:url", content: "https://kaizenmanpower.com/du-hoc/dai-loan" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: TW_IMG.hero },
      ],
      links: [{ rel: "canonical", href: "https://kaizenmanpower.com/du-hoc/dai-loan" }],
      scripts: [
        breadcrumbScript([
          { name: "Trang chủ", path: "/" },
          { name: "Du học", path: "/du-hoc" },
          { name: "Du học Đài Loan", path: "/du-hoc/dai-loan" },
        ]),
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Du học Đài Loan",
            provider: { "@type": "Organization", name: "Kaizen" },
            areaServed: "Vietnam",
            serviceType: "Tư vấn du học",
            description: desc,
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: "1500",
              description: "Học phí từ 1.500 USD/năm, học bổng tới 100%",
            },
          }),
        },
      ],
    };
  },
  component: DuHocDaiLoan,
});

function DuHocDaiLoan() {
  const { banner } = Route.useLoaderData();
  const other = STUDY_COUNTRY_LIST.filter((c) => c.slug !== "dai-loan").slice(0, 6);

  return (
    <PublicLayout>
      {/* HERO */}
      <CmsHero
        banner={banner}
        fallback={
          <section className="relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${TW_IMG.hero})` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f3d]/85 via-[#1e3a6f]/55 to-[#dc2626]/30" aria-hidden />
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
                  🇹🇼
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                  <Sparkles className="h-3 w-3" /> Tuyển sinh kỳ Xuân & Thu 2026
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-6xl">
                Du học <span className="text-[#FFCC00]">Đài Loan</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
                Học bổng tới 100% · Vừa học Vừa làm 22–30 triệu/tháng · Top trường châu Á
              </p>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-white/75">
                Đài Loan là điểm đến du học chi phí thấp – chất lượng cao bậc nhất châu Á. Với 5 trường lọt Top 100 châu Á, học bổng MOE/ICDF hào phóng, mô hình vừa học vừa làm độc đáo và cộng đồng người Việt hơn 250.000 người — đây là lựa chọn tối ưu cho bạn trẻ Việt Nam muốn có tấm bằng quốc tế mà không gánh nặng tài chính.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#chuong-trinh"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-lg hover:bg-white/95"
                >
                  Xem 8 ngành học <ArrowRight className="h-4 w-4" />
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
            {TW_STATS.map((s) => (
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

      <MarketHubSections module="du-hoc" market="dai-loan" marketName="Đài Loan" />


      {/* WHY TAIWAN */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          eyebrow="Vì sao chọn Đài Loan"
          title="6 lý do du học Đài Loan trở thành xu hướng 2026"
          desc="Chi phí thấp – Học bổng nhiều – Vừa học vừa làm – Định cư rõ ràng. Đài Loan là 'điểm vàng' cho bạn trẻ Việt Nam mong muốn trải nghiệm giáo dục quốc tế."
          icon={<Heart className="h-4 w-4" />}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TW_WHY.map((w, i) => (
            <div
              key={w.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0a1f3d] via-[#dc2626] to-[#FFCC00] opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0a1f3d]/10 to-[#dc2626]/10 text-sm font-bold text-[#0a1f3d]">
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
            title="8 ngành du học Đài Loan hot nhất 2026"
            desc="Từ bán dẫn – CNTT đến hệ Vừa học Vừa làm — Kaizen tổng hợp 8 nhóm ngành có học bổng cao và cơ hội việc làm tốt nhất."
            icon={<GraduationCap className="h-4 w-4" />}
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TW_PROGRAMS.map((p) => (
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
                  {p.hot && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white shadow-md">
                      <Flame className="h-3 w-3" /> Hot
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-[15.5px] font-bold leading-snug text-foreground">{p.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                    <span>⏱ {p.duration}</span>
                    <span>💰 {p.salary}</span>
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
          title="6 bước đặt chân tới Đài Loan cùng Kaizen"
          desc="Lộ trình chuẩn 10–12 tháng. Kaizen đồng hành sát sao từng bước — bạn không phải lo bất kỳ thủ tục phức tạp nào."
          icon={<MapPin className="h-4 w-4" />}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TW_TIMELINE.map((t) => (
            <div
              key={t.step}
              className="relative rounded-2xl border border-border/60 bg-white p-6 shadow-[0_2px_18px_-12px_rgba(15,23,42,0.18)]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0a1f3d] to-[#dc2626] text-base font-extrabold text-white shadow-md">
                  {t.step}
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#dc2626]">{t.months}</div>
                  <div className="text-base font-bold text-foreground">{t.title}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="bg-gradient-to-br from-[#0a1f3d]/[0.04] via-background to-[#dc2626]/[0.04] py-20">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Yêu cầu hồ sơ"
            title="Điều kiện du học Đài Loan"
            desc="Hồ sơ chuẩn 4 nhóm — Kaizen rà soát 3 vòng trước khi nộp, đảm bảo tỷ lệ đậu visa 98%+."
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {TW_REQUIREMENTS.map((r) => (
              <div key={r.group} className="rounded-2xl border border-border/60 bg-white p-7 shadow-[0_2px_18px_-12px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0a1f3d]/10 to-[#dc2626]/10 text-2xl">
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
          title="6 đầu mục cần chuẩn bị cho visa Đài Loan"
          image={TW_IMG.visa}
        >
          <ol className="space-y-4">
            {TW_VISA.map((v, i) => (
              <li key={v.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0a1f3d]/10 text-xs font-bold text-[#0a1f3d]">
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
          title="Hỗ trợ tài chính lên tới 100%"
          accent="green"
          image={TW_IMG.truong}
        >
          <ul className="space-y-3">
            {[
              { label: "Học bổng MOE Taiwan", value: "Tới 40.000 NTĐ/tháng" },
              { label: "Học bổng ICDF (toàn phần)", value: "Học phí + sinh hoạt" },
              { label: "Học bổng Huayu (tiếng Hoa)", value: "25.000 NTĐ/tháng" },
              { label: "Học bổng trường (50–100%)", value: "Tự động xét hồ sơ" },
              { label: "Lương làm thêm tối thiểu", value: "190 NTĐ/giờ" },
              { label: "Sinh hoạt phí/tháng", value: "6.000 – 9.000 NTĐ" },
            ].map((c) => (
              <li key={c.label} className="flex items-center justify-between rounded-xl bg-[#3F7D3A]/[0.06] px-4 py-3 text-sm">
                <span className="text-foreground/85">{c.label}</span>
                <span className="font-bold text-[#3F7D3A]">{c.value}</span>
              </li>
            ))}
          </ul>
        </InfoPanel>
      </section>

      {/* LIFE IN TAIWAN */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Đời sống & định cư"
              title="Cuộc sống du học sinh Việt tại Đài Loan"
              desc="Không chỉ học và làm — Đài Loan còn là nơi để bạn trải nghiệm văn hoá á Đông phong phú, an toàn và hiện đại."
              align="left"
              icon={<Wallet className="h-4 w-4" />}
            />
            <div className="mt-8 space-y-5">
              {TW_LIFE.map((l) => (
                <div key={l.topic} className="rounded-2xl border border-border/60 bg-white p-5">
                  <h3 className="text-base font-bold text-foreground">{l.topic}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.content}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <img
              src={TW_IMG.vanhoa}
              alt="Chợ đêm Đài Loan"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
            />
            <div className="grid grid-cols-2 gap-5">
              <img
                src={TW_IMG.tienghoa}
                alt="Lớp tiếng Hoa Kaizen"
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover shadow-md"
              />
              <img
                src={TW_IMG.sinhvien}
                alt="Sinh viên Việt Nam tốt nghiệp Đài Loan"
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          eyebrow="Câu hỏi thường gặp"
          title="Giải đáp 12 thắc mắc phổ biến về du học Đài Loan"
          desc="Tổng hợp từ hàng nghìn cuộc tư vấn của Kaizen — nếu bạn còn câu hỏi khác, để lại thông tin ở form bên dưới."
          icon={<HelpCircle className="h-4 w-4" />}
        />
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {TW_FAQS.map((f, i) => (
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
      </section>

      {/* INQUIRY FORM */}
      <section id="tu-van" className="bg-gradient-to-br from-primary/[0.04] via-background to-[#3F7D3A]/[0.04] py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Tư vấn miễn phí
            </span>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
              Bắt đầu hành trình <span className="text-gradient-brand">du học Đài Loan</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Để lại thông tin, chuyên gia Kaizen sẽ liên hệ trong vòng 24h để tư vấn ngành học, trường phù hợp, lộ trình tiếng Hoa và cơ hội học bổng tốt nhất cho bạn.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Tư vấn 1-1 với chuyên gia 10+ năm thị trường Đài Loan",
                "Apply 2–3 trường song song tăng tỷ lệ học bổng",
                "Đào tạo tiếng Hoa từ 0 → TOCFL A2/B1 cam kết đầu ra",
                "Đồng hành 24/7 sau khi sang Đài Loan",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F7D3A]" />
                  <span className="text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <ConsultationForm defaultProgram="du_hoc" defaultMarket="dai-loan" />
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
  accent?: "green";
  image?: string;
}) {
  const ring =
    accent === "green" ? "bg-[#3F7D3A]/10 text-[#3F7D3A]" : "bg-[#0a1f3d]/10 text-[#0a1f3d]";
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
