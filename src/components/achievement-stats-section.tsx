import { useEffect, useRef, useState } from "react";
import { Award, Users, Globe2, Handshake, type LucideIcon } from "lucide-react";

type Stat = {
  icon: LucideIcon;
  target: number;
  prefix?: string;
  suffix: string;
  format?: "plain" | "comma";
  label: string;
  sub: string;
};

const STATS: Stat[] = [
  {
    icon: Award,
    target: 15,
    suffix: "+",
    label: "Năm kinh nghiệm",
    sub: "Phát triển bền vững từ 2010",
  },
  {
    icon: Users,
    target: 20000,
    suffix: "+",
    format: "comma",
    label: "Học viên & Người lao động",
    sub: "Đã đồng hành xuất cảnh thành công",
  },
  {
    icon: Globe2,
    target: 8,
    suffix: "+",
    label: "Thị trường quốc tế",
    sub: "Nhật, Hàn, Đài, Đức, Úc, Canada…",
  },
  {
    icon: Handshake,
    target: 50,
    suffix: "+",
    label: "Đối tác chiến lược",
    sub: "Trường, tập đoàn, nghiệp đoàn quốc tế",
  },
];

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function useCountUp(target: number, active: boolean, durationMs = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(target * easeOutExpo(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, durationMs]);
  return value;
}

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
  const value = useCountUp(stat.target, active);
  const formatted =
    stat.format === "comma" ? value.toLocaleString("en-US") : String(value);
  const Icon = stat.icon;
  return (
    <div className="px-4 py-4 text-center md:px-6 md:py-5">
      <Icon className="mx-auto h-6 w-6 text-white/80" aria-hidden />
      <div
        className="serif-display mt-2 text-3xl font-semibold leading-none text-white md:text-4xl"
        aria-label={`${stat.target}${stat.suffix}`}
      >
        {formatted}
        <span className="text-white/85">{stat.suffix}</span>
      </div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
        {stat.label}
      </div>
      <p className="mt-0.5 text-xs leading-relaxed text-white/70">{stat.sub}</p>
    </div>
  );
}

export function AchievementStatsSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      aria-label="Thành tựu Kaizen"
      className="relative z-10 overflow-hidden bg-primary"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 40%), radial-gradient(circle at 85% 80%, rgba(0,0,0,0.25), transparent 50%)",
        }}
      />
      <div ref={ref} className="container relative mx-auto px-4 py-8 md:py-10">
        <div className="mx-auto mb-4 flex max-w-3xl flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-white/60" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">
              Thành tựu Kaizen
            </span>
            <span className="h-px w-10 bg-white/60" />
          </div>
          <h2 className="serif-display text-xl font-semibold text-white md:text-2xl">
            Những con số khẳng định hành trình
          </h2>
        </div>
        <div className="grid grid-cols-1 divide-y divide-white/15 border-y border-white/15 sm:grid-cols-2 sm:divide-y-0 md:border-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {STATS.map((s) => (
            <StatItem key={s.label} stat={s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
