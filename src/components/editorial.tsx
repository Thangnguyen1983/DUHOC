import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-10 bg-primary" />
      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
        {children}
      </span>
    </div>
  );
}

export function SerifTitle({
  children,
  as: As = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <As
      className={`serif-display font-semibold leading-[1.08] tracking-tight text-foreground ${className}`}
    >
      {children}
    </As>
  );
}

export function StatBlock({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="border-t border-line pt-6">
      <div className="serif-display text-5xl font-semibold text-primary md:text-6xl">
        {value}
      </div>
      <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-foreground">
        {label}
      </div>
      {sub && <div className="mt-1 text-sm text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function QuoteBlock({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role?: string;
}) {
  return (
    <figure className="mx-auto max-w-3xl text-center">
      <span className="serif-display text-7xl leading-none text-primary/30">“</span>
      <blockquote className="serif-display -mt-6 text-2xl italic leading-snug text-foreground md:text-3xl">
        {quote}
      </blockquote>
      <figcaption className="mt-6 text-sm">
        <span className="font-semibold text-foreground">{author}</span>
        {role && <span className="text-muted-foreground"> — {role}</span>}
      </figcaption>
    </figure>
  );
}

export function EditorialSection({
  surface,
  children,
  className = "",
}: {
  surface?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${surface ? "bg-surface" : "bg-background"} py-16 md:py-24 ${className}`}>
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}

export function EditorialHero({
  eyebrow,
  title,
  tagline,
  imageUrl,
  imageAlt,
}: {
  eyebrow: string;
  title: ReactNode;
  tagline?: string;
  imageUrl?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-background">
      <div className="container mx-auto grid items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="space-y-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="serif-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-[4.25rem]">
            {title}
          </h1>
          {tagline && (
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {tagline}
            </p>
          )}
        </div>
        {imageUrl && (
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={imageAlt ?? ""}
              className="h-full w-full object-cover"
              width={800}
              height={1000}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-line" />
          </div>
        )}
      </div>
    </section>
  );
}

export function CrossLink({
  to,
  params,
  children,
  className = "",
}: {
  to: string;
  params?: Record<string, string>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      params={params as never}
      className={`group inline-flex items-center gap-2 border-b border-primary pb-0.5 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/80 ${className}`}
    >
      {children}
      <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}

export function TimelineItem({
  year,
  title,
  description,
}: {
  year: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-t-2 border-primary pt-5">
      <div className="serif-display text-3xl font-semibold text-primary">{year}</div>
      <div className="mt-2 text-sm font-bold uppercase tracking-wider text-foreground">{title}</div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function CaseStudyCard({
  name,
  program,
  outcome,
  quote,
}: {
  name: string;
  program: string;
  outcome: string;
  quote: string;
}) {
  return (
    <article className="flex flex-col border border-line bg-background p-7">
      <div className="text-xs font-bold uppercase tracking-wider text-primary">{program}</div>
      <div className="serif-display mt-3 text-2xl font-semibold text-foreground">{name}</div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{outcome}</p>
      <blockquote className="mt-5 border-l-2 border-primary pl-4 text-sm italic leading-relaxed text-foreground">
        “{quote}”
      </blockquote>
    </article>
  );
}

export function LegalDocCard({
  icon: Icon,
  title,
  issuer,
  description,
  status = "Bản scan cập nhật sau",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  issuer: string;
  description: string;
  status?: string;
}) {
  return (
    <div className="border border-line bg-background p-7 transition-colors hover:border-primary">
      <Icon className="h-8 w-8 text-primary" />
      <div className="serif-display mt-4 text-xl font-semibold leading-snug text-foreground">{title}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-wider text-primary">{issuer}</div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 border border-dashed border-line bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {status}
      </div>
    </div>
  );
}

export function MediaGalleryGrid({
  images,
}: {
  images: { src: string; alt: string; aspect?: string }[];
}) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {images.map((img, i) => (
        <figure
          key={i}
          className={`mb-4 break-inside-avoid overflow-hidden border border-line ${img.aspect ?? "aspect-[4/5]"}`}
        >
          <img
            src={img.src}
            alt={img.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            width={600}
            height={800}
          />
        </figure>
      ))}
    </div>
  );
}

export function PartnerLogoStrip({
  partners,
}: {
  partners: { name: string; logo?: string; country?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 border border-line bg-surface p-6 md:grid-cols-4 lg:grid-cols-6">
      {partners.map((p) => (
        <div
          key={p.name}
          className="flex h-24 items-center justify-center border border-line bg-white px-4 py-3 transition-colors hover:border-primary/40"
        >
          {p.logo ? (
            <img src={p.logo} alt={`Logo ${p.name}`} className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">{p.name}</div>
              {p.country && <div className="text-[11px] text-muted-foreground">{p.country}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
