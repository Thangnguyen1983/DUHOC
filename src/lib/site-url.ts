/**
 * Canonical URL của website chính thức. Được dùng cho mọi liên kết trong
 * email (reset password, invite, magic link...) để tránh trỏ về preview
 * lovable.app khi admin thao tác từ môi trường preview.
 */
export const OFFICIAL_SITE_URL = "https://kaizenmanpower.com";

const OFFICIAL_HOSTS = new Set([
  "kaizenmanpower.com",
  "www.kaizenmanpower.com",
]);

/**
 * Trả về base URL nên dùng cho link trong email.
 * - Khi đang ở domain chính thức → dùng chính origin đó.
 * - Khi đang ở preview / lovable.app / localhost → luôn dùng domain chính thức.
 */
export function getPublicSiteUrl(): string {
  if (typeof window === "undefined") return OFFICIAL_SITE_URL;
  try {
    const host = window.location.hostname;
    if (OFFICIAL_HOSTS.has(host)) return window.location.origin;
  } catch {
    // ignore
  }
  return OFFICIAL_SITE_URL;
}

export function publicUrl(path: string): string {
  const base = getPublicSiteUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base + p;
}
