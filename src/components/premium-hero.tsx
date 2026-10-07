import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { PageBanner, PageBannerStat } from "@/lib/page-banners.functions";
import heroBgDefault from "@/assets/hero-bg-premium.jpg";

export type PremiumHeroProps = {
  eyebrow: string;
  eyebrowIcon?: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  backgroundImage?: string;
  overlay?: "dark" | "brand" | "light";
  /** "overlay" = chữ đè lên ảnh; "image" = ảnh thuần 100% độ sáng, chữ nằm dưới ảnh. */
  layout?: "overlay" | "image";
  badge?: { icon?: React.ReactNode; label: string };
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: PageBannerStat[];
  backLink?: { label: string; to: string };
  /** Nếu có, dữ liệu từ DB sẽ ghi đè các prop trên (field nào có giá trị). */
  banner?: PageBanner | null;
};

const OVERLAYS: Record<NonNullable<PremiumHeroProps["overlay"]>, string> = {
  dark: "bg-gradient-to-r from-[#0a0a1a]/96 via-[#0a0a1a]/85 to-[#0a0a1a]/55",
  brand: "bg-gradient-to-r from-primary/95 via-primary/80 to-[#3F7D3A]/55",
  light: "bg-gradient-to-r from-white/95 via-white/85 to-white/55",
};

/** Chuyển "[g]du học[/g]" thành span gradient. */
function renderTitle(input: React.ReactNode): React.ReactNode {
  if (typeof input !== "string") return input;
  const parts = input.split(/\[g\](.+?)\[\/g\]/g);
  return parts.map((chunk, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-gradient-brand">
        {chunk}
      </span>
    ) : (
      <span key={i}>{chunk}</span>
    ),
  );
}

export function PremiumHero(props: PremiumHeroProps) {
  const b = props.banner;
  const overlay = (b?.overlay ?? props.overlay ?? "dark") as NonNullable<
    PremiumHeroProps["overlay"]
  >;
  const layout = (b?.layout ?? props.layout ?? "overlay") as NonNullable<
    PremiumHeroProps["layout"]
  >;
  const bg = b?.image_url || props.backgroundImage || heroBgDefault;
  const eyebrow = b?.eyebrow || props.eyebrow;
  const description = b?.description ?? props.description;
  const title: React.ReactNode = b?.title ? renderTitle(b.title) : props.title;
  const badge = b?.badge_label
    ? { icon: b.badge_icon, label: b.badge_label }
    : props.badge;
  const primaryCta =
    b?.cta_primary_label && b.cta_primary_href
      ? { label: b.cta_primary_label, href: b.cta_primary_href }
      : props.primaryCta;
  const secondaryCta =
    b?.cta_secondary_label && b.cta_secondary_href
      ? { label: b.cta_secondary_label, href: b.cta_secondary_href }
      : props.secondaryCta;
  const stats = b?.stats?.length ? b.stats : props.stats ?? [];

  const isImageLayout = layout === "image";
  const isLight = overlay === "light";
  // Ở chế độ ảnh thuần, chữ luôn nằm trên nền sáng của trang.
  const textColor = isImageLayout || isLight ? "text-foreground" : "text-white";
  const subColor =
    isImageLayout || isLight ? "text-foreground/75" : "text-white/90";
  const chipBg =
    isImageLayout || isLight
      ? "bg-foreground/[0.06] border-foreground/10 text-foreground/80"
      : "bg-white/15 border-white/25 text-white backdrop-blur";

  const backLinkEl = props.backLink ? (
    <Link
      to={props.backLink.to}
      className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.12em] ${subColor} hover:opacity-100`}
    >
      ← {props.backLink.label}
    </Link>
  ) : null;

  const eyebrowRow = (
    <div className="flex flex-wrap items-center gap-3">
      {badge && (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg ring-1 ring-black/5">
          {badge.icon ?? badge.label.slice(0, 2)}
        </span>
      )}
      {eyebrow && (
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${chipBg}`}
        >
          {props.eyebrowIcon ?? <Sparkles className="h-3 w-3" />}
          {eyebrow}
        </span>
      )}
    </div>
  );

  const heading = (
    <h1
      className={`max-w-[42rem] text-3xl font-bold leading-[1.15] tracking-tight md:text-4xl lg:text-5xl ${textColor}`}
    >
      {title}
    </h1>
  );

  const desc = description ? (
    <p className={`max-w-[40rem] text-base leading-relaxed md:text-lg ${subColor}`}>
      {description}
    </p>
  ) : null;

  const ctaStack = isImageLayout; // cột phải: xếp dọc trên desktop
  const ctas =
    primaryCta || secondaryCta ? (
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${
          ctaStack ? "md:flex-col md:items-stretch" : ""
        }`}
      >
        {primaryCta && (
          <a
            href={primaryCta.href}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#e23a40] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-95 sm:w-auto ${
              ctaStack ? "md:w-full" : ""
            }`}
          >
            {primaryCta.label} <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {secondaryCta && (
          <a
            href={secondaryCta.href}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition sm:w-auto ${
              ctaStack ? "md:w-full" : ""
            } ${
              isImageLayout || isLight
                ? "bg-foreground text-background hover:opacity-95"
                : "bg-white text-foreground hover:bg-white/95"
            }`}
          >
            {secondaryCta.label}
          </a>
        )}
      </div>
    ) : null;



  const statsBar =
    stats.length > 0 ? (
      <section className={isImageLayout ? "relative" : "relative mt-8"}>
        <div className="container mx-auto px-4">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 shadow-sm sm:grid-cols-2 md:grid-cols-4">
            {stats.slice(0, 4).map((s, i) => (
              <div key={`${s.label}-${i}`} className="bg-card p-5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-1 text-lg font-bold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null;

  // ---- Chế độ ẢNH THUẦN: ảnh hiển thị 100% độ sáng, không lớp phủ, chữ nằm dưới ----
  if (isImageLayout) {
    return (
      <>
        <section className="bg-muted">
          <div className="mx-auto aspect-[16/9] w-full max-w-[1920px] max-h-[620px] overflow-hidden">
            <img
              src={bg}
              alt={typeof title === "string" ? title : "Banner"}
              className="h-full w-full object-cover object-center"
              width={1920}
              height={1080}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>
        <section className="border-b bg-background">
          <div className="container mx-auto grid items-end gap-6 px-4 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10 md:py-8">
            <div className="min-w-0 space-y-4">
              {backLinkEl}
              {eyebrowRow}
              {heading}
              {desc}
            </div>
            {ctas && (
              <div className="w-full md:w-[19rem] md:justify-self-end">
                {ctas}
                <p className="mt-3 text-center text-xs text-muted-foreground md:text-right">
                  Tư vấn miễn phí 1-1 · Phản hồi trong 24h
                </p>
              </div>
            )}
          </div>
        </section>
        {statsBar && <div className="pt-6">{statsBar}</div>}

      </>
    );
  }

  // ---- Chế độ CHỮ ĐÈ ẢNH ----
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg})` }}
          aria-hidden
        />
        <div className={`absolute inset-0 -z-10 ${OVERLAYS[overlay]}`} aria-hidden />
        {!isLight && (
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-background/80 via-transparent to-transparent"
            aria-hidden
          />
        )}

        <div className="container relative mx-auto flex min-h-[260px] flex-col justify-center gap-5 px-4 py-10 md:min-h-[clamp(320px,42vw,560px)] md:py-14">
          {backLinkEl}
          {eyebrowRow}
          {heading}
          {desc}
          {ctas}
        </div>
      </section>

      {statsBar}
    </>
  );
}
