import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { type Market } from "@/lib/markets";
import { useMarkets } from "@/lib/markets.catalog";
import { ConsultationForm } from "@/components/consultation-form";
import { type PageBanner } from "@/lib/page-banners.functions";
import { XKLD_INDEX_HERO_IMAGE, XKLD_MARKET_CONTENT } from "@/lib/xkld-market-content";
import {
  ArrowRight,
  Globe2,
  Sparkles,
  ShieldCheck,
  Wallet,
  HeartHandshake,
} from "lucide-react";

export const Route = createFileRoute("/xkld")({
  head: () => ({
    meta: [
      { title: "Xuất khẩu lao động 2026 — Nhật · Hàn · Đài · Châu Âu | KAIZEN" },
      { name: "description", content: "XKLĐ Nhật, Hàn, Đài Loan và Châu Âu (Đức, Hungary, Ba Lan, Romania, Slovakia, Latvia, Bulgaria) — đơn hàng đa dạng, chi phí minh bạch, đồng hành 15+ năm." },
      { property: "og:title", content: "Xuất khẩu lao động cùng KAIZEN" },
      { property: "og:description", content: "10 quốc gia, chi phí minh bạch, 15+ năm đồng hành cùng người lao động Việt Nam." },
      { property: "og:image", content: XKLD_INDEX_HERO_IMAGE },
      { property: "og:url", content: "https://kaizenmanpower.com/xkld" },
    ],
  }),
  component: () => <Outlet />,
});

function MarketCard({ m, compact = false }: { m: Market; compact?: boolean }) {
  const cover = XKLD_MARKET_CONTENT[m.slug]?.heroImage;
  return (
    <Link
      to="/xkld/$country"
      params={{ country: m.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:-translate-y-1 hover:shadow-brand"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={`XKLĐ ${m.name}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden />
        <span className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-2xl shadow">
          {m.flag}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold">XKLĐ {m.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{m.tagline}</p>
        {!compact && (
          <p className="mt-3 flex-1 text-sm text-foreground/70 line-clamp-3">{m.description}</p>
        )}
        <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
          Xem chi tiết <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

const KAIZEN_BENEFITS = [
  { icon: ShieldCheck, title: "Giấy phép Bộ LĐTBXH", desc: "Hoạt động XKLĐ hợp pháp, hợp đồng minh bạch, được pháp luật bảo vệ." },
  { icon: Wallet, title: "Chi phí minh bạch", desc: "Bảng chi phí công khai từng đơn hàng, hoàn phí đúng cam kết nếu không xuất cảnh." },
  { icon: HeartHandshake, title: "Hỗ trợ tận nơi", desc: "Cán bộ đại diện/đối tác tại từng nước — đón sân bay, xử lý phát sinh 24/7." },
];

export function XkldOverview({ banner }: { banner?: PageBanner | null } = {}) {
  const { asia, europe } = useMarkets();
  const eyebrow = banner?.eyebrow ?? "Nhân lực quốc tế 2026";
  const title = banner?.title ?? "Xuất khẩu lao động 10 quốc gia";
  const description =
    banner?.description ??
    "Hàng trăm đơn hàng mỗi năm — Nhật, Hàn, Đài Loan và 7 nước Châu Âu.";
  const heroImage = banner?.image_url || XKLD_INDEX_HERO_IMAGE;
  const primaryCta = {
    label: banner?.cta_primary_label ?? "Đăng ký tư vấn",
    href: banner?.cta_primary_href ?? "#tu-van",
  };
  const secondaryCta = {
    label: banner?.cta_secondary_label ?? "Xem thị trường",
    href: banner?.cta_secondary_href ?? "#thi-truong-a",
  };
  const stats =
    (banner?.stats && banner.stats.length > 0
      ? banner.stats.map((s: any) => ({ label: s.label, value: s.value, sub: s.sub ?? s.hint ?? "" }))
      : [
          { label: "Quốc gia", value: "10", sub: "Nhật · Hàn · Đài · EU" },
          { label: "Năm kinh nghiệm", value: "15+", sub: "Đồng hành từ 2010" },
          { label: "Lao động đã đi", value: "3.000+", sub: "Xuất cảnh thành công" },
          { label: "Chi phí", value: "100% Minh bạch", sub: "Hợp đồng công khai" },
        ]);

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/60 to-[#0f172a]/25" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" aria-hidden />

        <div className="relative container mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-40">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.18em] text-white/85 hover:text-white"
          >
            ← Trang chủ
          </Link>
          <div className="mt-5 flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 text-primary shadow-2xl">
              <Globe2 className="h-8 w-8" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-white backdrop-blur">
              <Sparkles className="h-3 w-3" /> {eyebrow}
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight text-white md:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {primaryCta?.href && (
              <a
                href={primaryCta.href}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#e23a40] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
              >
                {primaryCta.label} <ArrowRight className="h-4 w-4" />
              </a>
            )}
            {secondaryCta?.href && (
              <a
                href={secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-lg hover:bg-white/95"
              >
                {secondaryCta.label}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* FLOATING STATS CARD */}
      <section className="relative z-10 -mt-16 md:-mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border/50 bg-border/60 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_70px_-24px_rgba(15,23,42,0.45)] sm:grid-cols-2 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white p-6 md:p-7">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{s.label}</div>
                <div className="mt-2 text-2xl md:text-3xl font-extrabold text-gradient-brand leading-tight">{s.value}</div>
                {s.sub && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ASIA */}
      <section id="thi-truong-a" className="container mx-auto px-4 py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Thị trường Châu Á
            </span>
            <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">Nhật · Hàn · Đài Loan</h2>
          </div>
          <span className="text-sm text-muted-foreground">{asia.length} quốc gia</span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {asia.map((m) => (
            <MarketCard key={m.slug} m={m} />
          ))}
        </div>
      </section>

      {/* EUROPE */}
      <section id="chau-au" className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
                Thị trường Châu Âu
              </span>
              <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">7 quốc gia EU</h2>
            </div>
            <span className="text-sm text-muted-foreground">{europe.length} quốc gia</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {europe.map((m) => (
              <MarketCard key={m.slug} m={m} compact />
            ))}
          </div>
        </div>
      </section>

      {/* WHY KAIZEN */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
            Vì sao chọn Kaizen
          </span>
          <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
            <span className="text-gradient-brand">Đồng hành trọn gói</span> — từ đăng ký đến ổn định
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {KAIZEN_BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border/60 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONSULTATION */}
      <section id="tu-van" className="container mx-auto px-4 pb-20">
        <ConsultationForm defaultProgram="xkld" />
      </section>
    </PublicLayout>
  );
}
