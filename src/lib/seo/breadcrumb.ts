/**
 * Helper tạo JSON-LD BreadcrumbList dùng chung cho các trang public.
 */
export const SITE_URL = "https://kaizenmanpower.com";

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function breadcrumbScript(items: { name: string; path: string }[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(breadcrumbJsonLd(items)),
  };
}
