import { Phone, MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/markets";

/**
 * Nút liên hệ nhanh nổi ở góc dưới phải.
 * - Mobile: bottom-4 right-4 (không che form vì form có padding rộng)
 * - Z-index 40 để dưới modal/dialog (z-50)
 */
export function FloatingContact() {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2.5 md:bottom-6 md:right-6">
      <a
        href={COMPANY.social.zalo}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Zalo"
        title="Chat Zalo"
        className="group grid h-12 w-12 place-items-center rounded-full bg-[#0068FF] text-white shadow-[0_10px_28px_-8px_rgba(0,104,255,0.55)] transition-all hover:scale-110 md:h-14 md:w-14"
      >
        <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-md bg-foreground/90 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
          Chat Zalo
        </span>
      </a>
      <a
        href={`tel:${COMPANY.phoneRaw}`}
        aria-label="Gọi hotline"
        title={`Hotline ${COMPANY.phone}`}
        className="group relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-[#e23a40] text-white shadow-[0_10px_28px_-8px_rgba(201,32,38,0.6)] transition-all hover:scale-110 md:h-14 md:w-14"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
        <Phone className="relative h-5 w-5 md:h-6 md:w-6" />
      </a>
    </div>
  );
}
