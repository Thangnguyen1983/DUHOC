import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Số đếm mượt khi giá trị thay đổi; tự tắt khi prefers-reduced-motion. */
export function CountUp({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  const [display, setDisplay] = useState<number>(0);
  const prev = useRef(0);
  useEffect(() => {
    const target = value ?? 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      prev.current = target;
      return;
    }
    const from = prev.current;
    const start = performance.now();
    const dur = 500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    prev.current = target;
    return () => cancelAnimationFrame(raf);
  }, [value]);
  if (value == null) return <span>—</span>;
  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

type KpiTone = "red" | "green" | "amber" | "slate" | "teal";

const KPI_TONES: Record<KpiTone, string> = {
  red: "nav-tone-red",
  green: "nav-tone-green",
  amber: "nav-tone-amber",
  slate: "nav-tone-slate",
  teal: "nav-tone-teal",
};

/** Thẻ KPI với icon chip 3D theo tông màu thương hiệu + hover nhấc nhẹ. */
export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  icon?: any;
  tone?: KpiTone;
  delay?: number;
}) {
  return (
    <div
      className="card-lift rounded-2xl border bg-card p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span className={cn("nav-chip nav-chip-sm", KPI_TONES[tone])} aria-hidden>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={cn("mt-2 text-2xl font-bold tracking-tight", tone === "red" && "text-primary")}>{value}</div>
    </div>
  );
}

/** Thanh tiến độ mảnh, chạy từ 0 → giá trị. */
export function ProgressBar({ ratio, tone = "green" }: { ratio: number; tone?: "green" | "red" | "amber" }) {
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const color =
    tone === "red" ? "bg-[#C92026]" : tone === "amber" ? "bg-amber-500" : "bg-[#3F7D3A]";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Vòng tròn chuyên cần nhỏ, màu theo ngưỡng (đỏ KAIZEN <70, amber <85, xanh ≥85). */
export function AttendanceRing({ value, size = 34 }: { value: number | null; size?: number }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = value >= 85 ? "#3F7D3A" : value >= 70 ? "#D97706" : "#C92026";
  return (
    <div className="flex items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={3.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

/** Skeleton shimmer trong lúc tải. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-xl bg-muted", className)} />;
}
