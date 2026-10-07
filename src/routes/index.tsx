import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  GraduationCap,
  Briefcase,
  Languages,
  Handshake,
  Globe2,
  Users,
  
  Phone,
  ShieldCheck,
  Headphones,
  FileCheck,
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { AchievementStatsSection } from "@/components/achievement-stats-section";
import { HeroBannerSlideshow } from "@/components/hero-banner-slideshow";
import { HotProgramsMarquee } from "@/components/hot-programs-marquee";
import { SitePopup } from "@/components/site-popup";

import { Button } from "@/components/ui/button";
import { Eyebrow, CrossLink } from "@/components/editorial";
import { FEATURED_MARKETS, COMPANY } from "@/lib/markets";
import { useMarkets } from "@/lib/markets.catalog";
import { listActiveHeroBanners } from "@/lib/hero-banners.functions";
import { getHomepageSections } from "@/lib/homepage-sections.functions";
import heroKaizenRealAsset from "@/assets/hero-kaizen-real.jpg.asset.json";

import marketJapanAsset from "@/assets/market-japan.jpg.asset.json";
import marketKoreaAsset from "@/assets/market-korea.jpg.asset.json";
import marketTaiwanAsset from "@/assets/market-taiwan.jpg.asset.json";
import marketGermanyAsset from "@/assets/market-germany.jpg.asset.json";
import newsScholarshipAsset from "@/assets/news-scholarship.jpg.asset.json";
import newsEngineerJpAsset from "@/assets/news-engineer-jp.jpg.asset.json";
import newsGermanyEventAsset from "@/assets/news-germany-event.jpg.asset.json";
import { listPublishedPosts } from "@/lib/posts.functions";

const NEWS_FALLBACK_IMAGES = [
  newsScholarshipAsset.url,
  newsEngineerJpAsset.url,
  newsGermanyEventAsset.url,
];

const MARKET_IMAGES: Record<string, string> = {
  "nhat-ban": marketJapanAsset.url,
  "han-quoc": marketKoreaAsset.url,
  "dai-loan": marketTaiwanAsset.url,
  "duc": marketGermanyAsset.url,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kaizen — Du học & Nhân lực quốc tế tại Nghệ An" },
      {
        name: "description",
        content:
          "Kaizen đồng hành cùng học sinh, người lao động và doanh nghiệp tại Nghệ An trên hành trình vươn ra thế giới — Du học, Xuất khẩu lao động, Ngoại ngữ, Đối tác.",
      },
      { property: "og:title", content: "Kaizen — Du học & Nhân lực quốc tế tại Nghệ An" },
      {
        property: "og:description",
        content:
          "Kết nối tài năng Việt Nam với cơ hội toàn cầu — Du học, Nhân lực quốc tế, Ngoại ngữ, Đối tác doanh nghiệp.",
      },
      { property: "og:url", content: "https://kaizenmanpower.com/" },
    ],
    links: [{ rel: "canonical", href: "https://kaizenmanpower.com/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <PublicLayout>
      <Hero />
      <HotProgramsMarquee />
      <AchievementStatsSection />
      <TrustBand />
      <Ecosystem />
      <Markets />
      <MarketNews />
      <News />
      <CTA />
      <SitePopup />
    </PublicLayout>

  );
}

function useHomepageSections() {
  const fetchSections = useServerFn(getHomepageSections);
  return useQuery({
    queryKey: ["homepage-sections"],
    queryFn: () => fetchSections(),
    staleTime: 5 * 60_000,
  });
}

function Hero() {
  const fetchBanners = useServerFn(listActiveHeroBanners);
  const { data } = useQuery({
    queryKey: ["hero-banners"],
    queryFn: () => fetchBanners(),
    staleTime: 60_000,
  });
  const { data: sections } = useHomepageSections();
  const hero = sections?.hero ?? null;

  const slides =
    data && data.length > 0
      ? data.map((b) => ({ id: b.id, src: b.image_url, alt: b.alt || "Banner Kaizen" }))
      : [
          {
            id: "default",
            src: heroKaizenRealAsset.url,
            alt: "Học viên, người lao động và đối tác quốc tế của Kaizen",
          },
        ];

  return (
    <section className="relative isolate w-full overflow-hidden border-b border-line min-h-[520px] md:min-h-[600px] lg:min-h-[min(100vh-120px,700px)]">
      <div className="absolute inset-0 z-0">
        <HeroBannerSlideshow slides={slides} intervalMs={9000} transitionMs={60} variant="background" />
      </div>

      <div
        className="absolute inset-0 z-10 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, #FFFFFF 0%, rgba(255,255,255,0.92) 60%, rgba(255,255,255,0.85) 100%)",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-10 hidden md:block"
        style={{
          background:
            "linear-gradient(to right, #FFFFFF 0%, #FFFFFF 30%, rgba(255,255,255,0.98) 38%, rgba(255,255,255,0.88) 46%, rgba(255,255,255,0.65) 54%, rgba(255,255,255,0.32) 62%, rgba(255,255,255,0.08) 70%, rgba(255,255,255,0) 78%)",
        }}
        aria-hidden
      />

      <div className="relative z-20">
        <div className="container mx-auto px-4 py-10 md:py-12 lg:py-14 md:mx-0 md:max-w-none md:pl-[5vw] lg:pl-[6vw] xl:pl-[7vw] md:pr-0">
          <div className="max-w-2xl space-y-8 md:max-w-[40vw] lg:max-w-[32vw] xl:max-w-[30vw] md:space-y-9">
            <div className="flex items-center gap-4">
              <span className="h-[2px] w-12 bg-primary" aria-hidden />
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                {hero?.eyebrow ?? "Vững bước tương lai — Vươn tầm thế giới"}
              </p>
            </div>

            <div className="space-y-5">
               <h1 className="text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-neutral-900 text-balance max-w-[14ch] sm:text-4xl lg:max-w-[16ch] md:text-5xl lg:text-[64px] xl:text-[72px]">
                <span className="text-primary">{hero?.headline_prefix ?? "Kaizen"}</span>
                {hero?.headline_suffix ?? " – Kết nối nhân tài Việt Nam với cơ hội toàn cầu"}
              </h1>
              <p className="max-w-xl text-lg font-normal leading-[1.6] text-neutral-600 md:text-xl lg:text-[22px]">
                {hero?.subheadline ?? "Hơn 15 năm phát triển trong lĩnh vực Du học Quốc tế, Nhân lực Quốc tế và Đào tạo Ngoại ngữ."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-none bg-primary px-10 text-sm font-semibold tracking-wide text-primary-foreground shadow-xl shadow-primary/25 transition-colors hover:bg-primary/90"
              >
                <a href={hero?.primary_cta?.to ?? "/dang-ky"}>{hero?.primary_cta?.label ?? "Đăng ký tư vấn"}</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-none border border-neutral-300 bg-transparent px-8 text-sm font-semibold tracking-wide text-neutral-800 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                <a href={hero?.secondary_cta?.to ?? "/du-hoc"}>{hero?.secondary_cta?.label ?? "Khám phá chương trình"}</a>
              </Button>
            </div>

             <div className="grid grid-cols-3 gap-2 border-t border-neutral-200/70 pt-6 sm:gap-6 md:gap-8 md:pt-8">
              {(hero?.stats && hero.stats.length > 0
                ? hero.stats
                : [
                    { value: "15+", label: "Năm kinh nghiệm" },
                    { value: "20K+", label: "Học viên thành công" },
                    { value: "50+", label: "Đối tác toàn cầu" },
                  ]
              ).map((s, i) => (
                <HeroStat key={`${s.label}-${i}`} value={s.value} label={s.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-bold tracking-[-0.02em] text-neutral-900 md:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-600">{label}</p>
    </div>
  );
}

const USP_ICONS: Record<string, any> = { ShieldCheck, FileCheck, Headphones };

function TrustBand() {
  const { data: sections } = useHomepageSections();
  const defaults = [
    { icon: "ShieldCheck", title: "Minh bạch & Pháp lý", desc: "Hợp đồng chuẩn hóa, chi phí công khai, đầy đủ giấy phép hoạt động du học và XKLĐ." },
    { icon: "FileCheck", title: "Tỷ lệ thành công cao", desc: "Hồ sơ được lọc kỹ, đào tạo bài bản và đối tác uy tín tại 20+ quốc gia trên thế giới." },
    { icon: "Headphones", title: "Đồng hành 360°", desc: "Tư vấn — đào tạo — phỏng vấn — xuất cảnh — hỗ trợ sau khi đến nước sở tại." },
  ];
  const pillars = sections?.usp?.pillars && sections.usp.pillars.length > 0 ? sections.usp.pillars : defaults;

  return (
    <section className="border-b border-line bg-surface">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((p) => {
            const Icon = USP_ICONS[p.icon] ?? ShieldCheck;
            return (
              <div
                key={p.title}
                className="group flex items-start gap-4 border border-line bg-white p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{p.title}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


function Ecosystem() {
  const personal = [
    {
      icon: GraduationCap,
      title: "Du học quốc tế",
      desc: "Tư vấn du học 8 quốc gia — chọn trường, săn học bổng, visa và đồng hành dài hạn.",
      to: "/du-hoc",
    },
    {
      icon: Briefcase,
      title: "Xuất khẩu lao động",
      desc: "Nhật Bản, Hàn Quốc, Đài Loan, Châu Âu — thu nhập hấp dẫn, hỗ trợ toàn diện.",
      to: "/xkld",
    },
    {
      icon: Languages,
      title: "Đào tạo ngoại ngữ",
      desc: "Tiếng Nhật, Hàn, Trung, Anh, Đức — luyện thi chứng chỉ quốc tế bài bản.",
      to: "/ngoai-ngu",
    },
  ];
  const corporate = [
    {
      icon: Handshake,
      title: "Đối tác chiến lược",
      desc: "Hợp tác với trường học, tập đoàn và hiệp hội nghề nghiệp quốc tế.",
      to: "/doi-tac",
    },
    {
      icon: Globe2,
      title: "Outsourcing",
      desc: "Cung ứng nhân sự và giải pháp nhân lực cho doanh nghiệp trong nước & quốc tế.",
      to: "/outsourcing",
    },
  ];

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Dịch vụ</Eyebrow>
          <h2 className="serif-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Hệ sinh thái Du học & Nhân lực quốc tế
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Năm trụ cột dịch vụ — mang đến giải pháp toàn diện cho mọi hành trình quốc tế.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Dành cho cá nhân</span>
            </div>
            <div className="grid gap-5">
              {personal.map((s) => (
                <EcosystemCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} to={s.to} />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Dành cho doanh nghiệp</span>
            </div>
            <div className="grid gap-5">
              {corporate.map((s) => (
                <EcosystemCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} to={s.to} />
              ))}
            </div>
            <div className="mt-6 border border-line bg-surface p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="serif-display text-xl font-semibold text-foreground">Du lịch & Visa</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Hỗ trợ visa du lịch, công tác, thăm thân cho gia đình học viên và doanh nghiệp.
                  </p>
                  <CrossLink to="/du-lich-visa" className="mt-3">Tìm hiểu thêm</CrossLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Markets() {
  const { featured } = useMarkets();
  return (
    <section className="border-y border-line bg-surface py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Thị trường trọng điểm</Eyebrow>
          <h2 className="serif-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Các quốc gia hợp tác chiến lược
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Thị trường được Kaizen chọn lọc — đa dạng cơ hội cho mọi định hướng.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {featured.map((m) => (
            <Link
              key={m.slug}
              to="/du-hoc/$country"
              params={{ country: m.slug }}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden border border-line bg-background text-white transition-all hover:-translate-y-1 hover:border-primary"
            >
              {MARKET_IMAGES[m.slug] && (
                <img
                  src={MARKET_IMAGES[m.slug]}
                  alt={`${m.name} — ${m.tagline}`}
                  loading="lazy"
                  width={800}
                  height={1024}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" aria-hidden />
              <div className="relative p-6">
                <div className="text-3xl drop-shadow">{m.flag}</div>
                <h3 className="serif-display mt-2 text-xl font-semibold">{m.name}</h3>
                <p className="mt-1 text-sm text-white/80">{m.tagline}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-white">
                  Xem chi tiết <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <CrossLink to="/xkld">Xem tất cả thị trường XKLĐ</CrossLink>
        </div>
      </div>
    </section>
  );
}


function News() {
  const fetchPosts = useServerFn(listPublishedPosts);
  const { data, isLoading } = useQuery({
    queryKey: ["home-latest-posts"],
    queryFn: () => fetchPosts(),
    staleTime: 60_000,
  });
  const items = (data?.items ?? []).slice(0, 3);

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Tin tức</Eyebrow>
          <h2 className="serif-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Tin tức & Sự kiện
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Cập nhật mới nhất về chính sách du học, đơn hàng lao động và hoạt động của Kaizen.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {isLoading && items.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse border border-line bg-muted/40" />
              ))
            : items.map((n: any, idx: number) => {
                const image = n.cover_image || NEWS_FALLBACK_IMAGES[idx % NEWS_FALLBACK_IMAGES.length];
                const tag = n.tags?.[0]?.name || n.category || "Tin tức";
                return (
                  <Link
                    key={n.id}
                    to="/tin-tuc/$slug"
                    params={{ slug: n.slug }}
                    className="group flex flex-col overflow-hidden border border-line bg-background transition-all hover:-translate-y-1 hover:border-primary"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={image}
                        alt={n.title}
                        loading="lazy"
                        width={1280}
                        height={800}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                        {tag}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary">
                        {n.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {n.excerpt}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
                        Đọc tiếp <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
          {!isLoading && items.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              Chưa có bài viết nào được xuất bản.
            </div>
          )}
        </div>
        <div className="mt-10 text-center">
          <CrossLink to="/tin-tuc">Xem tất cả tin tức</CrossLink>
        </div>
      </div>
    </section>
  );
}


function MarketNews() {
  const fetchPosts = useServerFn(listPublishedPosts);
  const [active, setActive] = useState<string>(FEATURED_MARKETS[0].slug);

  const queries = useQueries({
    queries: FEATURED_MARKETS.map((m) => ({
      queryKey: ["home-market-posts", m.slug],
      queryFn: () => fetchPosts({ data: { market: m.slug } }),
      staleTime: 60_000,
    })),
  });

  const activeIdx = FEATURED_MARKETS.findIndex((m) => m.slug === active);
  const activeMarket = FEATURED_MARKETS[activeIdx];
  const activeQuery = queries[activeIdx];
  const items = (activeQuery?.data?.items ?? []).slice(0, 3);
  const isLoading = activeQuery?.isLoading;

  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Tin theo thị trường</Eyebrow>
          <h2 className="serif-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Cập nhật theo từng thị trường
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Chính sách, đơn hàng và hoạt động mới nhất tại các thị trường trọng điểm của Kaizen.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {FEATURED_MARKETS.map((m) => {
            const isActive = m.slug === active;
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => setActive(m.slug)}
                className={`flex items-center gap-2 border px-5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-background text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <span className="text-base">{m.flag}</span> {m.name}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {isLoading && items.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse border border-line bg-muted/40" />
              ))
            : items.map((n: any, idx: number) => {
                const image = n.cover_image || MARKET_IMAGES[activeMarket.slug] || NEWS_FALLBACK_IMAGES[idx % NEWS_FALLBACK_IMAGES.length];
                return (
                  <Link
                    key={n.id}
                    to="/tin-tuc/$slug"
                    params={{ slug: n.slug }}
                    className="group flex flex-col overflow-hidden border border-line bg-background transition-all hover:-translate-y-1 hover:border-primary"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={image}
                        alt={n.title}
                        loading="lazy"
                        width={1280}
                        height={800}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                        {activeMarket.flag} {activeMarket.name}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary">
                        {n.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {n.excerpt}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
                        Đọc tiếp <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
          {!isLoading && items.length === 0 && (
            <div className="col-span-full border border-dashed border-line bg-background py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Đang cập nhật nội dung cho thị trường {activeMarket.name}.
              </p>
              <div className="mt-4">
                <CrossLink to="/du-hoc/$country" params={{ country: activeMarket.slug }}>
                  Xem trang thị trường {activeMarket.name}
                </CrossLink>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-10 text-center">
            <CrossLink to="/du-hoc/$country" params={{ country: activeMarket.slug }}>
              Xem tất cả nội dung {activeMarket.name}
            </CrossLink>
          </div>
        )}
      </div>
    </section>
  );
}





function CTA() {
  const { data: sections } = useHomepageSections();
  const cta = sections?.cta ?? null;
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="grid gap-10 border border-line bg-surface p-6 md:grid-cols-2 md:p-12">
        <div className="flex flex-col justify-center">
          <Eyebrow>{cta?.eyebrow ?? "Bắt đầu ngay"}</Eyebrow>
          <h2 className="serif-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            {cta?.headline ?? "Sẵn sàng bắt đầu hành trình của bạn?"}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {cta?.description ??
              "Để lại thông tin — chuyên viên Kaizen sẽ gọi tư vấn miễn phí trong 24h, giúp bạn chọn đúng thị trường và chương trình phù hợp nhất."}
          </p>
          {(cta?.show_hotline ?? true) && (
            <div className="mt-6 flex items-center gap-3 text-sm">
              <a href={`tel:${COMPANY.phoneRaw}`} className="flex items-center gap-2 font-bold text-primary">
                <Phone className="h-4 w-4" /> Hotline {COMPANY.phone}
              </a>
            </div>
          )}
        </div>
        <ConsultationForm />
      </div>
    </section>
  );
}

function EcosystemCard({
  icon: Icon,
  title,
  desc,
  to,
}: {
  icon: any;
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-5 border border-line bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-white transition-all group-hover:scale-110">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <h3 className="text-[17px] font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
        <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
          Khám phá <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
