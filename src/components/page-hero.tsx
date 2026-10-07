import heroBg from "@/assets/hero-bg-premium.jpg";

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Premium dark hero used across sub-pages.
 * Matches the homepage hero treatment for visual consistency.
 */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background image + layered overlays */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 -z-10 bg-[#0a0a1a]/88" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0a1a]/96 via-[#0a0a1a]/85 to-[#0a0a1a]/55" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent" />

      <div className="container relative mx-auto flex min-h-[260px] flex-col justify-center px-4 py-10 md:min-h-[clamp(320px,42vw,560px)] md:py-14">
        <div className="max-w-[42rem]">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
              {eyebrow}
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-bold leading-[1.15] tracking-tight text-white md:text-4xl lg:text-5xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-5 max-w-[40rem] text-base leading-relaxed text-white/90 md:text-lg">
              {description}
            </p>
          ) : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
