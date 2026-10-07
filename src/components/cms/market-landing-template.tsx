import { CheckCircle2, ArrowRight, Sparkles, Award, Flame } from "lucide-react";
import { ConsultationForm } from "@/components/consultation-form";

type Block = Record<string, any>;

interface MarketLandingData {
  hero?: Block;
  stats?: Block[];
  industries?: Block[];
  roadmap?: Block[];
  highlights?: Block[];
  faq?: Block[];
}

interface Props {
  slug: string;
  title: string;
  cover?: string | null;
  data: MarketLandingData;
}

function toLines(txt?: string) {
  if (!txt) return [] as string[];
  return String(txt).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

export function MarketLandingTemplate({ slug, title, cover, data }: Props) {
  const hero = data.hero ?? {};
  const stats = Array.isArray(data.stats) ? data.stats : [];
  const industries = Array.isArray(data.industries) ? data.industries : [];
  const roadmap = Array.isArray(data.roadmap) ? data.roadmap : [];
  const highlights = Array.isArray(data.highlights) ? data.highlights : [];
  const faq = Array.isArray(data.faq) ? data.faq : [];

  const heroImage = hero.image || cover || "";
  const headline = hero.headline || title;
  const subheadline = hero.subheadline || "";
  const eyebrow = hero.eyebrow || "KAIZEN — Du học & Nhân lực quốc tế";

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {heroImage && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" aria-hidden />

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            <Sparkles className="h-3 w-3" /> {eyebrow}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-6xl">
            {headline}
          </h1>
          {subheadline && (
            <p className="mt-4 max-w-3xl text-lg text-white/90 md:text-xl">{subheadline}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={hero.cta_primary_href || "#tu-van"}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-lg hover:bg-white/95"
            >
              {hero.cta_primary_label || "Đăng ký tư vấn"} <ArrowRight className="h-4 w-4" />
            </a>
            {hero.cta_secondary_label && (
              <a
                href={hero.cta_secondary_href || "#chuong-trinh"}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
              >
                {hero.cta_secondary_label}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* STATS */}
      {stats.length > 0 && (
        <section className="relative mt-6 md:mt-8">
          <div className="container mx-auto px-4">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border/50 bg-border/50 shadow-xl md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="bg-white p-5">
                  <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 text-lg font-bold text-foreground">{s.value}</div>
                  {s.note && <div className="mt-1 text-xs text-muted-foreground">{s.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HIGHLIGHTS */}
      {highlights.length > 0 && (
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Vì sao chọn thị trường này
            </span>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">Điểm mạnh nổi bật</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-bold text-foreground">{h.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{h.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* INDUSTRIES */}
      {industries.length > 0 && (
        <section id="chuong-trinh" className="bg-muted/40 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
                Ngành / Chương trình
              </span>
              <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">Chương trình mũi nhọn</h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((p, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  {p.image && (
                    <div
                      className="h-40 bg-cover bg-center"
                      style={{ backgroundImage: `url(${p.image})` }}
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[16.5px] font-bold text-foreground">{p.name}</h3>
                      {p.hot && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                          <Flame className="h-3 w-3" /> Hot
                        </span>
                      )}
                    </div>
                    {(p.duration || p.salary) && (
                      <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                        {p.duration && (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
                            ⏱ {p.duration}
                          </span>
                        )}
                        {p.salary && (
                          <span className="rounded-full bg-[#3F7D3A]/10 px-2 py-0.5 font-semibold text-[#3F7D3A]">
                            💰 {p.salary}
                          </span>
                        )}
                      </div>
                    )}
                    {p.desc && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                    )}
                    {toLines(p.bullets).length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {toLines(p.bullets).map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-[13px]">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3F7D3A]" />
                            <span className="text-foreground/85">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ROADMAP */}
      {roadmap.length > 0 && (
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Lộ trình
            </span>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">Từng bước cùng KAIZEN</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {roadmap.map((r, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-border/60 bg-white p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {r.step || i + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-base font-bold text-foreground">{r.title}</h3>
                    {r.duration && (
                      <span className="text-xs font-semibold text-muted-foreground">
                        • {r.duration}
                      </span>
                    )}
                  </div>
                  {r.desc && <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="bg-muted/40 py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
                <Award className="h-3 w-3" /> FAQ
              </span>
              <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">Câu hỏi thường gặp</h2>
            </div>
            <div className="mt-8 space-y-3">
              {faq.map((f, i) => (
                <details key={i} className="group rounded-xl border border-border/60 bg-white p-5">
                  <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">
                    <span className="mr-2 text-primary">Q{i + 1}.</span>
                    {f.q}
                  </summary>
                  <div className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONSULTATION FORM */}
      <section id="tu-van" className="bg-gradient-to-br from-primary/[0.04] via-background to-[#3F7D3A]/[0.04] py-20">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
              Tư vấn miễn phí
            </span>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
              Bắt đầu hành trình <span className="text-gradient-brand">{title}</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Để lại thông tin, chuyên gia KAIZEN sẽ liên hệ trong 24h để tư vấn chi tiết lộ trình,
              chi phí, học bổng phù hợp với bạn.
            </p>
          </div>
          <div className="lg:col-span-3">
            <ConsultationForm defaultProgram="du_hoc" defaultMarket={slug} />
          </div>
        </div>
      </section>
    </>
  );
}
