import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SlideItem = {
  id: string;
  src: string;
  alt: string;
};

interface Props {
  slides: SlideItem[];
  intervalMs?: number;
  transitionMs?: number;
  variant?: "card" | "background";
}

/**
 * Hero banner slideshow.
 * - variant="card": Khung 4/5 có viền trắng, dùng làm ảnh hero kiểu cũ.
 * - variant="background": phủ kín container cha (absolute inset-0), dùng cho hero full-width.
 */
export function HeroBannerSlideshow({ slides, intervalMs = 5500, transitionMs = 30, variant = "card" }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const autoplay = Autoplay({
    delay: intervalMs,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", duration: transitionMs },
    !reduceMotion && slides.length > 1 ? [autoplay] : [],
  );
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (variant === "background") {
    return (
      <div
        className="absolute inset-0 h-full w-full"
        aria-roledescription="carousel"
        aria-label="Banner Kaizen"
      >
        <div ref={emblaRef} className="h-full w-full overflow-hidden">
          <div className="flex h-full">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${slides.length}`}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  width={1920}
                  height={1080}
                  fetchPriority={i === 0 ? "high" : "low"}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding={i === 0 ? "sync" : "async"}
                  className="h-full w-full object-cover object-[75%_center]"
                />
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Chuyển đến slide ${i + 1}`}
                className={cn(
                  "pointer-events-auto h-2 rounded-full bg-white/60 ring-1 ring-black/10 transition-all",
                  selected === i ? "w-6 bg-white" : "w-2 hover:bg-white/90",
                )}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex w-full justify-center lg:justify-end">
      <div className="relative w-full max-w-[540px]">
        <div
           className="relative overflow-hidden rounded-tl-[40px] rounded-br-[40px] border-4 border-white shadow-2xl md:rounded-tl-[80px] md:rounded-br-[80px] md:border-[12px]"
          aria-roledescription="carousel"
          aria-label="Banner Kaizen"
        >
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className="relative min-w-0 shrink-0 grow-0 basis-full"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} / ${slides.length}`}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    width={896}
                    height={1120}
                    fetchPriority={i === 0 ? "high" : "low"}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding={i === 0 ? "sync" : "async"}
                    className="aspect-[4/5] h-full w-full object-cover object-center"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"
                    aria-hidden
                  />
                </div>
              ))}
            </div>
          </div>

          {slides.length > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Chuyển đến slide ${i + 1}`}
                  className={cn(
                    "pointer-events-auto h-2 rounded-full bg-white/60 transition-all",
                    selected === i ? "w-6 bg-white" : "w-2 hover:bg-white/90",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="absolute -left-6 bottom-12 hidden border-l-4 border-primary bg-white/95 p-6 shadow-2xl backdrop-blur-sm xl:block">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
              <Globe2 className="h-6 w-6 text-secondary" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Uy tín &amp; Trách nhiệm</p>
              <p className="text-xs text-muted-foreground">Đơn vị đào tạo hàng đầu Nghệ An</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
