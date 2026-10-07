import type { ReactNode } from "react";
import { PremiumHero } from "@/components/premium-hero";
import type { PageBanner } from "@/lib/page-banners.functions";

/**
 * Nếu có banner CMS đang active → render PremiumHero theo dữ liệu CMS.
 * Ngược lại render `fallback` (hero code cứng của trang).
 * getPageBanner() chỉ trả banner khi is_active = true, nên chỉ cần check null.
 */
export function CmsHero({
  banner,
  fallback,
}: {
  banner: PageBanner | null | undefined;
  fallback: ReactNode;
}) {
  if (!banner) return <>{fallback}</>;
  return (
    <PremiumHero
      banner={banner}
      eyebrow={banner.eyebrow ?? ""}
      title={banner.title ?? ""}
    />
  );
}
