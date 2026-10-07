import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/editorial";
import { Button } from "@/components/ui/button";
import { CURATED_HIGHLIGHTS, type Highlight } from "@/lib/curated-highlights";

const CATEGORY_STYLES: Record<Highlight["category"], string> = {
  "MOU": "bg-primary/10 text-primary",
  "Sự kiện": "bg-secondary/10 text-secondary",
  "Đối tác": "bg-accent/10 text-accent-foreground",
  "Trách nhiệm xã hội": "bg-emerald-500/10 text-emerald-700",
  "Vinh danh": "bg-amber-500/10 text-amber-700",
};

export function CuratedHighlightsSection() {
  const items = CURATED_HIGHLIGHTS.slice(0, 6);
  return (
    <section
      aria-label="Dấu ấn Kaizen 2024 – 2026"
      className="border-y border-line bg-surface/40"
    >
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <Eyebrow>Dấu ấn 2024 – 2026</Eyebrow>
            <h2 className="serif-display text-3xl font-semibold leading-tight md:text-5xl">
              Những cột mốc hợp tác quốc tế nổi bật của Kaizen
            </h2>
            <p className="text-base text-muted-foreground md:text-lg">
              Chọn lọc từ nhật ký hoạt động — các MOU, sự kiện & đối tác chiến lược định hình hệ sinh thái du học và nhân lực quốc tế của Kaizen.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-none border-foreground self-start md:self-end"
          >
            <Link to="/ve-kaizen/hanh-trinh">
              Xem toàn bộ hành trình <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((h) => (
            <li
              key={h.id}
              className="group flex flex-col gap-4 rounded-2xl border border-line bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-brand"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${CATEGORY_STYLES[h.category]}`}
                >
                  {h.category}
                </span>
                <time
                  dateTime={h.date}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  {h.dateLabel}
                </time>
              </div>
              <h3 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary">
                {h.title}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                {h.excerpt}
              </p>
              {h.location && (
                <div className="flex items-center gap-1.5 border-t border-line pt-3 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {h.location}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
