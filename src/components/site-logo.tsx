import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings } from "@/lib/settings.functions";

/**
 * SiteLogo — phần tử branding duy nhất ở header + footer.
 * - Nếu Admin đã upload logo (site_settings.logo_url) → dùng logo đó.
 * - Nếu chưa → fallback wordmark "KAIZEN" typography cao cấp (không còn ô chữ K).
 *
 * `variant="light"` dùng cho nền tối (footer): text trắng + accent đỏ.
 */
export function SiteLogo({
  size = 48,
  className = "",
  variant = "dark",
}: {
  size?: number;
  className?: string;
  variant?: "dark" | "light";
}) {
  const fetchSettings = useServerFn(getSiteSettings);
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });

  if (data?.logo_url) {
    return (
      <img
        src={data.logo_url}
        alt="KAIZEN — Du học & Xuất khẩu lao động quốc tế"
        style={{ height: size, width: "auto", maxWidth: size * 3.2 }}
        className={`object-contain ${className}`}
      />
    );
  }

  // Wordmark fallback — typography đậm, tối giản, không khung
  const wordmarkColor = variant === "light" ? "text-white" : "text-foreground";
  const accentColor = "text-primary";
  return (
    <span
      style={{ height: size, lineHeight: `${size}px` }}
      className={`inline-flex select-none items-baseline gap-0.5 font-extrabold tracking-[-0.02em] ${className}`}
    >
      <span
        className={`${wordmarkColor}`}
        style={{ fontSize: size * 0.62, lineHeight: 1 }}
      >
        KAIZEN
      </span>
      <span
        className={accentColor}
        style={{ fontSize: size * 0.62, lineHeight: 1 }}
        aria-hidden
      >
        .
      </span>
    </span>
  );
}
