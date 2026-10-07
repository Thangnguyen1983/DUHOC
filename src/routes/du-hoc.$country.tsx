import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { STUDY_COUNTRIES, STUDY_COUNTRY_LIST } from "@/lib/study-countries";
import { getPublishedEntryBySlug } from "@/lib/cms-public.functions";
import { MarketLandingTemplate } from "@/components/cms/market-landing-template";
import { MarketHubSections } from "@/components/market-hub/market-hub-sections";
import { prefetchMarketHub } from "@/lib/market-hub-prefetch";
import { getPageBanner } from "@/lib/page-banners.functions";
import { CmsHero } from "@/components/cms-hero";
import { breadcrumbScript } from "@/lib/seo/breadcrumb";
import {
  CheckCircle2,
  GraduationCap,
  Wallet,
  Award,
  Stamp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/du-hoc/$country")({
  loader: async ({ params, context }) => {
    const country = STUDY_COUNTRIES[params.country];
    if (!country) throw notFound();
    // Ưu tiên nội dung CMS (loại market_landing) — fallback dữ liệu tĩnh
    let cms: Awaited<ReturnType<typeof getPublishedEntryBySlug>> = null;
    try {
      cms = await getPublishedEntryBySlug({
        data: { typeSlug: "market_landing", slug: params.country },
      });
    } catch {
      cms = null;
    }
    const [banner] = await Promise.all([
      getPageBanner({ data: { page_key: `du-hoc:${params.country}` } }),
      prefetchMarketHub(context.queryClient, "du-hoc", country.slug),
    ]);
    return { country, cms, banner };
  },
  head: ({ loaderData, params }) => {
    const c = loaderData?.country;
    const cms = loaderData?.cms;
    const cmsEntry = cms?.entry as any;
    const title =
      cmsEntry?.seo?.title || (c ? `Du học ${c.name} 2026 — Chi phí, học bổng | Kaizen` : "Du học | Kaizen");
    const rawDesc =
      cmsEntry?.seo?.description ||
      cmsEntry?.excerpt ||
      (c ? `${c.tagline}. ${c.description}` : "Du học cùng Kaizen.");
    // Giữ mô tả < 160 ký tự và luôn có CTA
    const CTA = " Đăng ký tư vấn miễn phí.";
    const desc =
      (rawDesc.length > 160 - CTA.length
        ? `${rawDesc.slice(0, 160 - CTA.length - 1).trimEnd()}…`
        : rawDesc) + CTA;
    const url = `https://kaizenmanpower.com/du-hoc/${params.country}`;
    const image = cmsEntry?.cover_image || c?.heroImage || "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: c
        ? [
            breadcrumbScript([
              { name: "Trang chủ", path: "/" },
              { name: "Du học", path: "/du-hoc" },
              { name: `Du học ${c.name}`, path: `/du-hoc/${params.country}` },
            ]),
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Service",
                serviceType: `Tư vấn du học ${c.name}`,
                name: `Du học ${c.name}`,
                description: desc,
                areaServed: c.name,
                provider: {
                  "@type": "Organization",
                  name: "KAIZEN",
                  url: "https://kaizenmanpower.com",
                },
                url,
              }),
            },
          ]
        : [],
    };
  },
  component: DuHocCountry,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Không tìm thấy chương trình du học</h1>
        <Link to="/du-hoc" className="mt-4 inline-block text-primary">
          ← Về danh sách du học
        </Link>
      </div>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">
        Lỗi tải trang: {error.message}
      </div>
    </PublicLayout>
  ),
});

function DuHocCountry() {
  const data = Route.useLoaderData() as {
    country: (typeof STUDY_COUNTRY_LIST)[number];
    cms: { entry: any; type: any } | null;
    banner: import("@/lib/page-banners.functions").PageBanner | null;
  };
  const { country, cms, banner } = data;
  const otherCountries = STUDY_COUNTRY_LIST.filter((c) => c.slug !== country.slug).slice(0, 6);

  // Nếu có nội dung CMS (loại "Trang thị trường") — dùng template CMS thay dữ liệu tĩnh
  if (cms?.entry) {
    const entry = cms.entry as any;
    return (
      <PublicLayout>
        <MarketLandingTemplate
          slug={country.slug}
          title={entry.title || `Du học ${country.name}`}
          cover={entry.cover_image || country.heroImage}
          data={entry.data ?? {}}
        />
        <MarketHubSections module="du-hoc" market={country.slug} marketName={country.name} />
        {/* OTHER COUNTRIES */}
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Khám phá thêm
            </span>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">Các quốc gia du học khác</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherCountries.map((c) => (
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

  return (
    <PublicLayout>
      {/* HERO */}
      <CmsHero
        banner={banner}
        fallback={
          <section className="relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${country.heroImage})` }}
              aria-hidden
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${country.accent}`} aria-hidden />
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
                  {country.flag}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                  <Sparkles className="h-3 w-3" /> Du học cùng KAIZEN
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-6xl">
                Du học <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text">{country.name}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">{country.tagline}</p>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-white/75">{country.description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#chuong-trinh"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-lg hover:bg-white/95"
                >
                  Xem chương trình <ArrowRight className="h-4 w-4" />
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
            {country.costs.map((cost) => (
              <div key={cost.label} className="bg-white p-5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {cost.label}
                </div>
                <div className="mt-1 text-lg font-bold text-foreground">{cost.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketHubSections module="du-hoc" market={country.slug} marketName={country.name} />


      {/* PROGRAMS */}
      <section id="chuong-trinh" className="container mx-auto px-4 py-20">
        <SectionHeader
          eyebrow="Chương trình"
          title={`Các hệ du học ${country.shortName}`}
          desc="Chọn chương trình phù hợp với mục tiêu học tập, ngân sách và lộ trình nghề nghiệp của bạn."
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {country.programs.map((p, i) => (
            <a
              key={p.slug}
              id={p.slug}
              href="#tu-van"
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[#e23a40] to-[#3F7D3A] opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-[#3F7D3A]/10 text-sm font-bold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[16.5px] font-bold text-foreground">{p.name}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                Tư vấn ngay <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* COSTS + REQUIREMENTS */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2">
          <InfoPanel
            icon={<Wallet className="h-5 w-5" />}
            eyebrow="Chi phí"
            title="Chi phí du học minh bạch"
          >
            <ul className="divide-y divide-border/60">
              {country.costs.map((c) => (
                <li key={c.label} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-semibold text-foreground">{c.value}</span>
                </li>
              ))}
            </ul>
          </InfoPanel>

          <InfoPanel
            icon={<CheckCircle2 className="h-5 w-5" />}
            eyebrow="Yêu cầu"
            title="Điều kiện hồ sơ"
          >
            <ul className="space-y-3">
              {country.requirements.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F7D3A]" />
                  <span className="text-foreground/85">{r}</span>
                </li>
              ))}
            </ul>
          </InfoPanel>
        </div>
      </section>

      {/* SCHOLARSHIPS + VISA */}
      <section className="container mx-auto grid gap-10 px-4 py-20 lg:grid-cols-2">
        <InfoPanel
          icon={<Award className="h-5 w-5" />}
          eyebrow="Học bổng"
          title={`Học bổng ${country.shortName}`}
          accent="green"
        >
          <ul className="space-y-3">
            {country.scholarships.map((s) => (
              <li key={s} className="flex items-start gap-3 rounded-xl bg-[#3F7D3A]/[0.06] p-3 text-sm">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-[#3F7D3A]" />
                <span className="text-foreground/90">{s}</span>
              </li>
            ))}
          </ul>
        </InfoPanel>

        <InfoPanel
          icon={<Stamp className="h-5 w-5" />}
          eyebrow="Visa"
          title={`Hướng dẫn visa du học ${country.shortName}`}
        >
          <ol className="space-y-4">
            {country.visa.map((v, i) => (
              <li key={v.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
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
      </section>

      {/* INQUIRY FORM */}
      <section id="tu-van" className="bg-gradient-to-br from-primary/[0.04] via-background to-[#3F7D3A]/[0.04] py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Tư vấn miễn phí
            </span>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
              Bắt đầu hành trình du học <span className="text-gradient-brand">{country.shortName}</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Để lại thông tin, chuyên gia KAIZEN sẽ liên hệ trong vòng 24h để tư vấn lộ trình, chi phí và học bổng phù hợp nhất với bạn.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Tư vấn 1-1 với chuyên gia 10+ năm kinh nghiệm",
                "Đánh giá hồ sơ & cơ hội học bổng miễn phí",
                "Hỗ trợ trọn gói từ chọn trường đến visa",
                "Đồng hành sau khi sang nước sở tại",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3F7D3A]" />
                  <span className="text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <ConsultationForm defaultProgram="du_hoc" defaultMarket={country.slug} />
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
          {otherCountries.map((c) => (
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
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
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
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  accent?: "green";
}) {
  const ring =
    accent === "green"
      ? "bg-[#3F7D3A]/10 text-[#3F7D3A]"
      : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border/60 bg-white p-7 shadow-[0_2px_18px_-12px_rgba(15,23,42,0.18)]">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ring}`}>{icon}</span>
        <div>
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}
