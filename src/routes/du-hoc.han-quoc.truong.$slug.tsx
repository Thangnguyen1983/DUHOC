import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { HAN_QUOC_PARTNERS, getPartner, type Partner } from "@/lib/han-quoc/partners";
import { ArrowLeft, ArrowRight, Award, Calendar, MapPin, GraduationCap, Wallet, Building2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/du-hoc/han-quoc/truong/$slug")({
  loader: ({ params }) => {
    const partner = getPartner(params.slug);
    if (!partner) throw notFound();
    return { partner };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.partner;
    const url = `https://kaizenmanpower.com/du-hoc/han-quoc/truong/${params.slug}`;
    if (!p) return { meta: [{ title: "Trường đối tác — Kaizen" }], links: [{ rel: "canonical", href: url }] };
    const rawTitle = `Du học ${p.shortName} (${p.city}) — Kaizen`;
    const title = rawTitle.length > 65 ? rawTitle.slice(0, 62) + "…" : rawTitle;
    const rawDesc = `${p.tagline}. Học phí ${p.tuition}, ${p.scholarship}. Tư vấn miễn phí du học Hàn Quốc cùng Kaizen.`;
    const desc = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "…" : rawDesc;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "author", content: "Kaizen" },
        { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: p.heroImage },
        { property: "og:image:alt", content: p.name },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Kaizen" },
        { property: "og:locale", content: "vi_VN" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: p.heroImage },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollegeOrUniversity",
            name: p.name,
            url,
            image: p.heroImage,
            foundingDate: String(p.established),
            address: { "@type": "PostalAddress", addressLocality: p.city, addressCountry: "KR" },
            description: p.summary,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: "https://kaizenmanpower.com" },
              { "@type": "ListItem", position: 2, name: "Du học Hàn Quốc", item: "https://kaizenmanpower.com/du-hoc/han-quoc" },
              { "@type": "ListItem", position: 3, name: "Trường đối tác", item: "https://kaizenmanpower.com/du-hoc/han-quoc" },
              { "@type": "ListItem", position: 4, name: p.name, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Không tìm thấy trường</h1>
        <Link to="/du-hoc/han-quoc" className="mt-4 inline-block text-primary">
          ← Về Du học Hàn Quốc
        </Link>
      </div>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-destructive">{error.message}</div>
    </PublicLayout>
  ),
  component: PartnerDetail,
});

function PartnerDetail() {
  const { partner: p } = Route.useLoaderData() as { partner: Partner };
  const others = HAN_QUOC_PARTNERS.filter((x) => x.slug !== p.slug);

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${p.heroImage})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/60 to-[#0f172a]/30" aria-hidden />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <Link
            to="/du-hoc/han-quoc"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.18em] text-white/85 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Trường đối tác Hàn Quốc
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <MapPin className="mr-1 inline h-3 w-3" /> {p.city}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Calendar className="mr-1 inline h-3 w-3" /> Thành lập {p.established}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {p.type}
            </span>
            {p.ranking && (
              <span className="rounded-full bg-[#3F7D3A] px-3 py-1 text-xs font-bold text-white">{p.ranking}</span>
            )}
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
            {p.name}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/90">{p.tagline}</p>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="container mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 shadow-md md:grid-cols-4">
          {[
            { i: Wallet, l: "Học phí", v: p.tuition },
            { i: Building2, l: "Ký túc xá", v: p.dorm },
            { i: Award, l: "Học bổng", v: p.scholarship },
            { i: GraduationCap, l: "Visa", v: p.visaType },
          ].map((c) => (
            <div key={c.l} className="bg-white p-5">
              <c.i className="h-4 w-4 text-primary" />
              <div className="mt-2 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">{c.l}</div>
              <div className="mt-1 text-sm font-bold">{c.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Giới thiệu {p.shortName}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{p.summary}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">Thế mạnh nổi bật</h2>
              <ul className="mt-3 space-y-2.5">
                {p.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-[15px]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#3F7D3A]" />
                    <span className="text-foreground/85">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold">Ngành đào tạo</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.majors.map((m) => (
                  <span key={m} className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-border/60 bg-muted/30 p-6">
            <h3 className="font-bold">Đăng ký xét tuyển {p.shortName}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Để lại thông tin, Kaizen sẽ liên hệ tư vấn ngành học, học bổng và hồ sơ apply trong 24h.
            </p>
            <Link
              to="/dang-ky"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#e23a40] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95"
            >
              Đăng ký tư vấn <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      {/* OTHER PARTNERS */}
      <section className="bg-muted/40 py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold">Các trường đối tác khác tại Hàn Quốc</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <Link
                key={o.slug}
                to="/du-hoc/han-quoc/truong/$slug"
                params={{ slug: o.slug }}
                className="group rounded-2xl border border-border/60 bg-white p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <div className="text-sm font-bold">{o.shortName}</div>
                <div className="mt-1 text-xs text-muted-foreground">{o.city}</div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Xem chi tiết <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="container mx-auto max-w-3xl px-4 py-16">
        <ConsultationForm defaultProgram="du_hoc" defaultMarket="han-quoc" />
      </section>
    </PublicLayout>
  );
}
