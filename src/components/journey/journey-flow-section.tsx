import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  Send,
  MousePointer2,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { Milestone } from "@/lib/journey.functions";

type Props = {
  milestones: Milestone[];
};

export function JourneyFlowSection({ milestones }: Props) {
  const reducedMotion = usePrefersReducedMotion();

  const defaultIndex = useMemo(() => {
    const i = milestones.findIndex((m) => String(m.year).includes("2014"));
    return i >= 0 ? i : 0;
  }, [milestones]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    defaultIndex,
  );

  useEffect(() => {
    setSelectedIndex(defaultIndex);
  }, [defaultIndex]);

  if (!milestones.length) return null;

  const handleSelect = (i: number) => setSelectedIndex(i);
  const handleClose = () => setSelectedIndex(null);

  return (
    <section
      aria-label="Hành trình phát triển Kaizen"
      className="relative overflow-hidden bg-gradient-to-b from-white via-rose-50/40 to-white py-14 md:py-16"
    >
      <div className="container mx-auto px-4">
        {/* Header — condensed */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              Hành trình Kaizen
            </span>
            <span className="h-px w-10 bg-primary" />
          </div>
          <h2 className="serif-display mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-neutral-900 md:text-4xl lg:text-5xl">
            <span className="text-primary">15 năm</span> kiến tạo hành trình vươn xa
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-neutral-500 md:text-base">
            Từ những bước đi đầu tiên tại Nghệ An đến mạng lưới giáo dục, nhân
            lực và đối tác quốc tế trên nhiều quốc gia.
          </p>
        </div>

        {/* Desktop / Laptop curve */}
        <div className="relative mt-8 hidden px-2 pb-24 pt-20 lg:block">
          <JourneyCurveDesktop
            milestones={milestones}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Tablet horizontal scroll */}
        <div className="relative mt-10 hidden md:block lg:hidden">
          <JourneyHorizontalScroll
            milestones={milestones}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        </div>

        {/* Mobile carousel */}
        <div className="relative mt-8 md:hidden">
          <JourneyMobileCarousel
            milestones={milestones}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        </div>

        {/* Floating preview — same page, not a modal */}
        {selectedIndex !== null && milestones[selectedIndex] && (
          <FloatingPreview
            key={milestones[selectedIndex].id}
            milestone={milestones[selectedIndex]}
            onPrev={() =>
              setSelectedIndex(
                (selectedIndex - 1 + milestones.length) % milestones.length,
              )
            }
            onNext={() =>
              setSelectedIndex((selectedIndex + 1) % milestones.length)
            }
            onClose={handleClose}
          />
        )}
      </div>
    </section>
  );
}

// =================================================================
// Desktop curve
// =================================================================

// Growth curve helpers
const GROWTH_VB_W = 1400;
const GROWTH_VB_H = 480;
const GROWTH_X_LEFT = 110;
const GROWTH_X_RIGHT = GROWTH_VB_W - 200;
const GROWTH_Y_START = GROWTH_VB_H * 0.78;
const GROWTH_Y_END = GROWTH_VB_H * 0.18;

function growthPoint(t: number) {
  const x = GROWTH_X_LEFT + (GROWTH_X_RIGHT - GROWTH_X_LEFT) * t;
  const smooth = t * t * (3 - 2 * t);
  const growth = 0.55 * Math.pow(t, 1.45) + 0.45 * smooth;
  const wave = Math.sin(t * Math.PI * 1.6 + 0.4) * 6 * (1 - t);
  const y = GROWTH_Y_START + (GROWTH_Y_END - GROWTH_Y_START) * growth + wave;
  return { x, y };
}

function JourneyCurveDesktop({
  milestones,
  selectedIndex,
  onSelect,
  reducedMotion,
}: {
  milestones: Milestone[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
  reducedMotion: boolean;
}) {
  const VB_W = GROWTH_VB_W;
  const VB_H = GROWTH_VB_H;
  const n = milestones.length;

  // Dense sampling of the growth curve + a short tangent extension past t=1
  const EXTENSION_PX = 10;
  const samples = useMemo(() => {
    const N = 220;
    const arr: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) arr.push(growthPoint(i / N));
    // Append extension along tangent at the endpoint
    const last = arr[arr.length - 1];
    const prev = arr[arr.length - 2];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    arr.push({
      x: last.x + (dx / len) * EXTENSION_PX,
      y: last.y + (dy / len) * EXTENSION_PX,
    });
    return arr;
  }, []);

  const pathD = useMemo(() => {
    return samples
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
  }, [samples]);

  // Ribbon area (offset 10px along normal)
  const ribbonAreaD = useMemo(() => {
    const offset = 10;
    const top = samples;
    const bottom: { x: number; y: number }[] = [];
    for (let i = 0; i < top.length; i++) {
      const prev = top[Math.max(0, i - 1)];
      const next = top[Math.min(top.length - 1, i + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      // Normal pointing "down" (positive y)
      const nx = -dy / len;
      const ny = dx / len;
      // Ensure normal points down (positive y)
      const sign = ny < 0 ? -1 : 1;
      bottom.push({
        x: top[i].x + nx * offset * sign,
        y: top[i].y + ny * offset * sign,
      });
    }
    const topD = top
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
    const botD = bottom
      .slice()
      .reverse()
      .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
    return `${topD} ${botD} Z`;
  }, [samples]);

  // Highlight line offset -2px (up)
  const highlightD = useMemo(() => {
    const offset = 2;
    return samples
      .map((p, i) => {
        const prev = samples[Math.max(0, i - 1)];
        const next = samples[Math.min(samples.length - 1, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const sign = ny < 0 ? 1 : -1; // up
        const px = p.x + nx * offset * sign;
        const py = p.y + ny * offset * sign;
        return `${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`;
      })
      .join(" ");
  }, [samples]);

  // Milestone points on the curve
  const points = useMemo(() => {
    return milestones.map((_, i) => {
      const t = n > 1 ? i / (n - 1) : 0;
      const { x, y } = growthPoint(t);
      const above = i % 2 === 0;
      return { x, baseY: y, above };
    });
  }, [milestones, n]);

  // Tangent at endpoint → arrow position + rotation (upward direction)
  const arrow = useMemo(() => {
    const pEnd = growthPoint(1);
    const pPrev = growthPoint(0.985);
    let dx = pEnd.x - pPrev.x;
    let dy = pEnd.y - pPrev.y;
    // Ensure tangent points "upward" (negative y on screen)
    if (dy > 0) {
      dx = -dx;
      dy = -dy;
    }
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const angleDeg = (Math.atan2(uy, ux) * 180) / Math.PI;
    // Place chevron at the end of the extended curve (past the 2025 node)
    return {
      tipX: pEnd.x + ux * EXTENSION_PX,
      tipY: pEnd.y + uy * EXTENSION_PX,
      angleDeg,
    };
  }, []);

  return (
    <div className="relative mx-auto" style={{ maxWidth: 1320 }}>
      {/* Silk ribbon background */}
      <SilkRibbonBg reducedMotion={reducedMotion} />

      <svg
        viewBox={`-20 -40 ${VB_W + 40} ${VB_H + 80}`}
        className="block h-auto w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="journey-ribbon-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-red)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand-red)" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="journey-streak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand-red)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--brand-red)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--brand-red)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="journey-arrow-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5A60" />
            <stop offset="55%" stopColor="var(--brand-red)" />
            <stop offset="100%" stopColor="#9A1C20" />
          </linearGradient>
          <radialGradient id="journey-arrow-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-red)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="var(--brand-red)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--brand-red)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Glow halo */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--brand-red)"
          strokeOpacity={0.18}
          strokeWidth={18}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "blur(12px)" }}
        />

        {/* 2. Ribbon fill (area) */}
        <path d={ribbonAreaD} fill="url(#journey-ribbon-fill)" stroke="none" />

        {/* 3. Main stroke */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--brand-red)"
          strokeOpacity={0.85}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4. Highlight */}
        <path
          d={highlightD}
          fill="none"
          stroke="white"
          strokeOpacity={0.5}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Light streak animation */}
        {!reducedMotion && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#journey-streak)"
            strokeWidth={5}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 6px rgba(201,32,38,0.55))",
              strokeDasharray: "300 1900",
              animation: "journey-streak 6s ease-in-out infinite",
            }}
          />
        )}


        {/* Milestone nodes */}
        {points.map((p, i) => {
          const active = i === selectedIndex;
          return (
            <g key={i} className="journey-node">
              <circle
                cx={p.x}
                cy={p.baseY}
                r={active ? 11 : 8}
                fill="white"
                stroke="var(--brand-red)"
                strokeWidth={active ? 3 : 2}
              />
              <circle
                cx={p.x}
                cy={p.baseY}
                r={active ? 5 : 3.5}
                fill="var(--brand-red)"
              />
            </g>
          );
        })}

        {/* Endpoint — large chevron + halo, tangent-aligned, glow pulse.
            Outer <g> keeps translate+rotate as SVG attribute (CSS transform
            on the same element would override it). Inner <g> runs the
            scale pulse so the position/rotation stay intact. */}
        <g
          transform={`translate(${arrow.tipX} ${arrow.tipY}) rotate(${arrow.angleDeg + 90})`}
        >
          <g
            style={
              reducedMotion
                ? { filter: "drop-shadow(0 0 18px rgba(201,32,38,0.6))" }
                : {
                    animation: "journey-rocket-pulse 2.4s ease-in-out infinite",
                    transformOrigin: "center",
                    transformBox: "fill-box" as const,
                    filter: "drop-shadow(0 0 22px rgba(201,32,38,0.75))",
                  }
            }
          >
            {/* Halo burst */}
            <circle r={32} fill="url(#journey-arrow-halo)" />
            {/* Large chevron ^ pointing up (local -y) */}
            <path
              d="M -24 14 L 0 -24 L 24 14"
              fill="none"
              stroke="var(--brand-red)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner white highlight chevron */}
            <path
              d="M -14 8 L 0 -14 L 14 8"
              fill="none"
              stroke="white"
              strokeOpacity={0.6}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </svg>

      {/* Cards layered over SVG */}
      <div className="absolute inset-0">
        {milestones.map((m, i) => {
          const p = points[i];
          if (!p) return null;
          const xPct = (p.x / VB_W) * 100;
          const yPct = (p.baseY / VB_H) * 100;
          return (
            <MilestoneCardDesktop
              key={m.id}
              milestone={m}
              index={i}
              active={i === selectedIndex}
              hoverSide={p.above ? "bottom" : "top"}
              onClick={() => onSelect(i)}
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                transform: p.above
                  ? "translate(-50%, calc(-100% - 22px))"
                  : "translate(-50%, 22px)",
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes journey-streak {
          0% { stroke-dashoffset: 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { stroke-dashoffset: -2200; opacity: 0; }
        }
        @keyframes journey-rocket-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes journey-shimmer {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -640; }
        }
        @keyframes journey-particle-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        .journey-node { transition: transform 0.2s ease-out, filter 0.2s ease-out; transform-origin: center; transform-box: fill-box; }
        .journey-node:hover { transform: scale(1.2); filter: drop-shadow(0 0 12px rgba(201,32,38,0.7)); }
      `}</style>
    </div>
  );
}

// =================================================================
// Silk ribbon background — growth-aligned
// =================================================================

function SilkRibbonBg({ reducedMotion }: { reducedMotion: boolean }) {
  // Growth-aligned ribbons: all flow up-right
  const ribbonA = "M -50 420 C 300 380, 600 300, 900 200 S 1300 90, 1500 70";
  const ribbonB = "M -50 470 C 320 430, 640 350, 940 240 S 1320 130, 1500 110";
  const ribbonC = "M -50 360 C 280 340, 560 280, 860 200 S 1240 110, 1500 90";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1400 480"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ribbon-red" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand-red)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--brand-red)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--brand-red)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ribbon-soft" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--brand-red)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ribbon-warm" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F5A623" stopOpacity="0" />
            <stop offset="50%" stopColor="#F5A623" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ribbon-shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.95" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={ribbonA} fill="none" stroke="url(#ribbon-red)" strokeWidth={140} strokeLinecap="round" style={{ filter: "blur(16px)" }} />
        <path d={ribbonB} fill="none" stroke="url(#ribbon-soft)" strokeWidth={170} strokeLinecap="round" style={{ filter: "blur(22px)" }} />
        <path d={ribbonC} fill="none" stroke="url(#ribbon-warm)" strokeWidth={120} strokeLinecap="round" style={{ filter: "blur(18px)" }} />

        {!reducedMotion && (
          <path
            d={ribbonA}
            fill="none"
            stroke="url(#ribbon-shimmer)"
            strokeWidth={4}
            strokeLinecap="round"
            style={{
              strokeDasharray: "80 480",
              animation: "journey-shimmer 8s linear infinite",
              filter: "blur(1px)",
            }}
          />
        )}

        {!reducedMotion &&
          [
            [120, 400],
            [240, 360],
            [380, 320],
            [520, 270],
            [660, 230],
            [800, 200],
            [940, 170],
            [1080, 140],
            [1220, 110],
            [1320, 90],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={2.2}
              fill="white"
              style={{
                animation: `journey-particle-pulse ${2 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.35}s`,
                filter: "drop-shadow(0 0 6px rgba(255,255,255,0.95))",
              }}
            />
          ))}
      </svg>
    </div>
  );
}

// =================================================================
// Milestone card — desktop (with HoverCard preview)
// =================================================================

function MilestoneCardDesktop({
  milestone: m,
  index,
  active,
  hoverSide,
  onClick,
  style,
}: {
  milestone: Milestone;
  index: number;
  active: boolean;
  hoverSide: "top" | "bottom";
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  const { ref, visible } = useReveal<HTMLButtonElement>(index);

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          style={style}
          aria-label={`Mở chi tiết cột mốc ${m.year}: ${m.title}`}
          aria-pressed={active}
          className={[
            "group absolute z-10 w-[180px] rounded-2xl bg-white p-3 text-left outline-none",
            "transition-all duration-200 ease-out",
            "hover:scale-[1.04] motion-reduce:hover:scale-100",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            active
              ? "border-2 border-primary shadow-[0_20px_50px_-10px_rgba(201,32,38,0.55)]"
              : "border border-primary/40 shadow-[0_8px_24px_-8px_rgba(201,32,38,0.28)] hover:border-primary hover:shadow-[0_16px_40px_-12px_rgba(201,32,38,0.45)]",
            visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          ].join(" ")}
        >
          <div className="serif-display text-xl font-semibold leading-none text-primary">
            {m.year}
          </div>
          <div className="mt-1.5 line-clamp-2 min-h-[2.4em] text-[12.5px] font-semibold leading-snug text-neutral-900">
            {m.title}
          </div>
          {m.cover_image && (
            <div className="relative mt-2 aspect-[16/10] w-full overflow-hidden rounded-xl ring-1 ring-primary/15">
              <img
                src={m.cover_image}
                alt={m.cover_alt || m.title}
                loading="lazy"
                width={320}
                height={200}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {active && (
            <div
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-3 grid h-7 w-7 place-items-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(201,32,38,0.5)]"
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </div>
          )}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side={hoverSide}
        align="center"
        sideOffset={14}
        className="w-72 rounded-2xl border border-primary/40 bg-white/95 p-4 shadow-[0_16px_40px_-12px_rgba(201,32,38,0.35)] backdrop-blur"
      >
        {m.cover_image && (
          <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-xl ring-1 ring-primary/15">
            <img
              src={m.cover_image}
              alt={m.cover_alt || m.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <div className="serif-display text-xl font-semibold text-primary">
            {m.year}
          </div>
          <div className="text-[13px] font-bold text-neutral-900">{m.title}</div>
        </div>
        {m.short_description && (
          <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-neutral-600">
            {m.short_description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          Bấm để xem chi tiết <ChevronRight className="h-3 w-3" />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// =================================================================
// Tablet horizontal scroll
// =================================================================

function JourneyHorizontalScroll({
  milestones,
  selectedIndex,
  onSelect,
}: {
  milestones: Milestone[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6"
      style={{ scrollbarWidth: "thin" }}
    >
      {milestones.map((m, i) => {
        const active = i === selectedIndex;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={active}
            className={[
              "group relative w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white text-left transition-all",
              active
                ? "border-2 border-primary shadow-[0_20px_50px_-10px_rgba(201,32,38,0.5)]"
                : "border border-primary/40 shadow-[0_8px_24px_-8px_rgba(201,32,38,0.28)] hover:border-primary hover:shadow-[0_16px_40px_-12px_rgba(201,32,38,0.4)]",
            ].join(" ")}
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100">
              {m.cover_image && (
                <img
                  src={m.cover_image}
                  alt={m.cover_alt || m.title}
                  loading="lazy"
                  width={560}
                  height={350}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="p-4">
              <div className="serif-display text-2xl font-semibold text-primary">
                {m.year}
              </div>
              <div className="mt-1 text-sm font-bold text-neutral-900">
                {m.title}
              </div>
              <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-neutral-600">
                {m.short_description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =================================================================
// Mobile carousel
// =================================================================

function JourneyMobileCarousel({
  milestones,
  selectedIndex,
  onSelect,
}: {
  milestones: Milestone[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
}) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(selectedIndex ?? 0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      const idx = Math.round(el.scrollLeft / w);
      setActive(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      <div
        ref={scroller}
        className="-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {milestones.map((m, i) => {
          const isSelected = i === selectedIndex;
          return (
            <div
              key={m.id}
              className="w-full shrink-0 snap-center pr-3 last:pr-0"
            >
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-pressed={isSelected}
                className={[
                  "block w-full overflow-hidden rounded-2xl bg-white text-left",
                  isSelected
                    ? "border-2 border-primary shadow-[0_18px_40px_-10px_rgba(201,32,38,0.5)]"
                    : "border border-primary/40 shadow-[0_8px_24px_-8px_rgba(201,32,38,0.28)]",
                ].join(" ")}
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                  {m.cover_image && (
                    <img
                      src={m.cover_image}
                      alt={m.cover_alt || m.title}
                      loading="lazy"
                      width={640}
                      height={400}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-5">
                  <div className="serif-display text-2xl font-semibold text-primary">
                    {m.year}
                  </div>
                  <div className="mt-1 text-base font-bold text-neutral-900">
                    {m.title}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                    {m.short_description}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Xem chi tiết <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {milestones.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-6 bg-primary" : "w-1.5 bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// =================================================================
// Floating preview (in-page, not modal)
// =================================================================

function FloatingPreview({
  milestone: m,
  onPrev,
  onNext,
  onClose,
}: {
  milestone: Milestone;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="relative mx-auto mt-10 w-full max-w-[920px] animate-in fade-in slide-in-from-bottom-2"
      role="region"
      aria-label={`Tổng quan cột mốc ${m.year}`}
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-white shadow-[0_24px_60px_-12px_rgba(201,32,38,0.35)]">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng tổng quan"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-white hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Prev / Next */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Mốc trước"
          className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-white hover:text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Mốc tiếp theo"
          className="absolute right-14 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-white hover:text-primary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          {/* Left — content */}
          <div className="px-6 py-6 md:px-8 md:py-8">
            <div className="serif-display text-4xl font-semibold leading-none text-primary md:text-5xl">
              {m.year}
            </div>
            <h3 className="serif-display mt-3 text-xl font-semibold leading-tight text-neutral-900 md:text-2xl">
              {m.title}
            </h3>
            {m.short_description && (
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-neutral-600 md:text-[15px]">
                {m.short_description}
              </p>
            )}

            {m.achievements.length > 0 && (
              <ul className="mt-5 grid grid-cols-2 gap-3">
                {m.achievements.slice(0, 4).map((a, i) => (
                  <li
                    key={i}
                    className="rounded-xl bg-primary/5 px-3 py-2 text-[12px] font-medium leading-snug text-primary ring-1 ring-primary/15"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            )}

            {(m.video_url || m.documents.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {m.video_url && (
                  <a
                    href={m.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90"
                  >
                    <Play className="h-3.5 w-3.5" /> Xem video
                  </a>
                )}
                {m.documents.slice(0, 1).map((d, i) => (
                  <a
                    key={i}
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {d.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right — media */}
          <div className="bg-neutral-50 p-4 md:p-5">
            {m.cover_image ? (
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl ring-1 ring-primary/15">
                <img
                  src={m.cover_image}
                  alt={m.cover_alt || m.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[16/10] w-full rounded-2xl bg-neutral-100" />
            )}

            {m.gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {m.gallery.slice(0, 4).map((g, i) => (
                  <a
                    key={i}
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-primary/10 hover:ring-primary/40"
                  >
                    <img
                      src={g.url}
                      alt={g.alt || `${m.title} - ảnh ${i + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Helpers
// =================================================================

function useReveal<T extends HTMLElement>(index: number) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            window.setTimeout(() => setVisible(true), index * 90);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [index]);
  return { ref, visible };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function catmullRomPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const p = points;
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}
