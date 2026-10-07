import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { getActivePopup, type SitePopup } from "@/lib/site-popups.functions";

const STORAGE_PREFIX = "kaizen_popup_dismissed_";

function isDismissed(popup: SitePopup) {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + popup.id);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

/** Nội dung popup — tách riêng để admin có thể xem thử. */
export function SitePopupCard({
  popup,
  onClose,
}: {
  popup: SitePopup;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isExternal = /^https?:\/\//.test(popup.cta_href);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={popup.title}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[520px] overflow-hidden rounded-t-2xl bg-card shadow-2xl animate-in fade-in zoom-in-95 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/85 text-foreground shadow hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>

        {popup.image_url && (
          <img
            src={popup.image_url}
            alt={popup.title}
            className="aspect-[16/9] w-full object-cover"
            loading="eager"
          />
        )}

        <div className="space-y-3 p-5 sm:p-6">
          <h2 className="text-xl font-bold leading-snug sm:text-2xl">{popup.title}</h2>
          {popup.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {popup.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {isExternal ? (
              <a
                href={popup.cta_href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {popup.cta_label}
              </a>
            ) : (
              <Link
                to={popup.cta_href}
                onClick={onClose}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {popup.cta_label}
              </Link>
            )}
            <button
              onClick={onClose}
              className="rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SitePopup() {
  const fetchPopup = useServerFn(getActivePopup);
  const { data: popup } = useQuery({
    queryKey: ["site-popup"],
    queryFn: () => fetchPopup(),
    staleTime: 5 * 60 * 1000,
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup) return;
    if (isDismissed(popup)) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [popup]);

  if (!popup || !open) return null;

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(
        STORAGE_PREFIX + popup.id,
        String(Date.now() + (popup.dismiss_hours || 24) * 3600_000),
      );
    } catch {
      /* ignore */
    }
  };

  return <SitePopupCard popup={popup} onClose={close} />;
}
