import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Plane,
  Languages,
  Globe2,
  Handshake,
  Building2,
  Users,
  MapPin,
  ShieldCheck,
  Award,
  type LucideIcon,
} from "lucide-react";
import { listActiveHotPrograms, type HotProgramIcon } from "@/lib/hot-programs.functions";

const ICON_MAP: Record<HotProgramIcon, LucideIcon> = {
  Sparkles,
  GraduationCap,
  Briefcase,
  Plane,
  Languages,
  Globe2,
  Handshake,
  Building2,
  Users,
  MapPin,
  ShieldCheck,
  Award,
};

const DURATION_DESKTOP_S = 40;
const DURATION_MOBILE_S = 28;
const RESUME_DELAY_MS = 1500;

export function HotProgramsMarquee() {
  const fetchPrograms = useServerFn(listActiveHotPrograms);
  const { data } = useQuery({
    queryKey: ["hot-programs", "active"],
    queryFn: () => fetchPrograms(),
    staleTime: 60_000,
  });

  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstGroupRef = useRef<HTMLUListElement | null>(null);

  // Drag state
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    baseOffset: 0,
    currentOffset: 0,
    pointerId: null as number | null,
    resumeTimer: null as ReturnType<typeof setTimeout> | null,
  });

  useEffect(() => {
    // Reset any inline state in case of remount.
    const track = trackRef.current;
    if (track) {
      track.style.transform = "";
      track.style.animationPlayState = "";
      track.style.animationDelay = "";
    }
    return () => {
      if (dragRef.current.resumeTimer) clearTimeout(dragRef.current.resumeTimer);
    };
  }, [data]);

  if (!data || data.length === 0) return null;

  const getCurrentTranslateX = (el: HTMLElement): number => {
    const t = getComputedStyle(el).transform;
    if (!t || t === "none") return 0;
    // matrix(a, b, c, d, tx, ty) or matrix3d(...)
    const m = t.match(/matrix.*\((.+)\)/);
    if (!m) return 0;
    const values = m[1].split(",").map((v) => parseFloat(v));
    return values.length === 6 ? values[4] : values[12] ?? 0;
  };

  const pauseAndFreeze = () => {
    const track = trackRef.current;
    if (!track) return;
    const tx = getCurrentTranslateX(track);
    dragRef.current.baseOffset = tx;
    dragRef.current.currentOffset = tx;
    track.style.animationPlayState = "paused";
    track.style.transform = `translate3d(${tx}px, 0, 0)`;
  };

  const resumeFromOffset = () => {
    const track = trackRef.current;
    const first = firstGroupRef.current;
    if (!track || !first) return;
    const groupWidth = first.getBoundingClientRect().width;
    if (groupWidth <= 0) {
      track.style.transform = "";
      track.style.animationDelay = "";
      track.style.animationPlayState = "";
      return;
    }
    // Normalize offset to [-groupWidth, 0]
    let offset = dragRef.current.currentOffset % groupWidth;
    if (offset > 0) offset -= groupWidth;
    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    const duration = isMobile ? DURATION_MOBILE_S : DURATION_DESKTOP_S;
    // Animation goes 0 → -groupWidth over `duration`. Solve for delay so it
    // continues from current offset: progress = -offset / groupWidth.
    const progress = -offset / groupWidth;
    const delay = -progress * duration;
    track.style.transform = "";
    track.style.animationDelay = `${delay}s`;
    track.style.animationPlayState = "";
  };

  const scheduleResume = () => {
    if (dragRef.current.resumeTimer) clearTimeout(dragRef.current.resumeTimer);
    dragRef.current.resumeTimer = setTimeout(() => {
      resumeFromOffset();
    }, RESUME_DELAY_MS);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only intercept touch / pen; let mouse use hover-pause + clicks normally.
    if (e.pointerType === "mouse") return;
    if (dragRef.current.resumeTimer) {
      clearTimeout(dragRef.current.resumeTimer);
      dragRef.current.resumeTimer = null;
    }
    dragRef.current.active = true;
    dragRef.current.moved = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.pointerId = e.pointerId;
    pauseAndFreeze();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    if (!dragRef.current.moved && Math.abs(dx) > 6) {
      dragRef.current.moved = true;
      // Capture so we keep receiving events even if pointer leaves the track.
      try {
        if (dragRef.current.pointerId !== null) {
          e.currentTarget.setPointerCapture(dragRef.current.pointerId);
        }
      } catch {
        /* ignore */
      }
    }
    if (dragRef.current.moved) {
      e.preventDefault();
      dragRef.current.currentOffset = dragRef.current.baseOffset + dx;
      const track = trackRef.current;
      if (track) {
        track.style.transform = `translate3d(${dragRef.current.currentOffset}px, 0, 0)`;
      }
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const wasDrag = dragRef.current.moved;
    dragRef.current.active = false;
    dragRef.current.moved = false;
    try {
      if (dragRef.current.pointerId !== null) {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(dragRef.current.pointerId);
      }
    } catch {
      /* ignore */
    }
    dragRef.current.pointerId = null;
    if (wasDrag) {
      // Prevent the click that follows a drag from firing on an inner link.
      const blocker = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      const track = trackRef.current;
      track?.addEventListener("click", blocker, { capture: true, once: true });
      setTimeout(() => track?.removeEventListener("click", blocker, { capture: true } as any), 50);
    }
    scheduleResume();
  };

  const renderGroup = (cloned: boolean, ref?: React.Ref<HTMLUListElement>) => (
    <ul
      ref={ref}
      className="hot-programs-group flex shrink-0 items-center gap-3 pr-3 py-3 md:py-3.5"
      aria-hidden={cloned || undefined}
    >
      {data.map((p) => {
        const Icon = ICON_MAP[p.icon] ?? Sparkles;
        return (
          <li key={`${p.id}-${cloned ? "c" : "o"}`} className="shrink-0">
            <Link
              to={p.href as string}
              tabIndex={cloned ? -1 : 0}
              draggable={false}
              className="inline-flex select-none items-center gap-2 border border-line bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <span className="whitespace-nowrap">{p.title}</span>
              {p.badge && (
                <span className="ml-1 inline-flex items-center bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  {p.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav
      aria-label="Chương trình nổi bật"
      className="marquee-root relative isolate border-y border-line bg-surface"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-surface to-transparent md:w-24"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-surface to-transparent md:w-24"
        aria-hidden
      />

      <div
        className="hot-programs-viewport overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: "pan-y" }}
      >
        <div ref={trackRef} className="hot-programs-track flex w-max items-center">
          {renderGroup(false, firstGroupRef)}
          {renderGroup(true)}
        </div>
      </div>

      <style>{`
        @keyframes hot-programs-scroll {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .hot-programs-track {
          animation: hot-programs-scroll ${DURATION_DESKTOP_S}s linear infinite;
          animation-play-state: running;
          will-change: transform;
          backface-visibility: hidden;
        }
        @media (max-width: 768px) {
          .hot-programs-track {
            animation-duration: ${DURATION_MOBILE_S}s;
          }
        }
        @media (hover: hover) {
          .marquee-root:hover .hot-programs-track { animation-play-state: paused; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hot-programs-track { animation: none; }
        }
      `}</style>
    </nav>
  );
}
