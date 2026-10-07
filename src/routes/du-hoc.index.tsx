import { createFileRoute } from "@tanstack/react-router";
import { DuHocOverview } from "./du-hoc";
import { getPageBanner } from "@/lib/page-banners.functions";
import { SITE_URL, breadcrumbScript } from "@/lib/seo/breadcrumb";
import { STUDY_COUNTRY_LIST } from "@/lib/study-countries";

const PAGE_URL = `${SITE_URL}/du-hoc`;
const TITLE = "Du học quốc tế 2026 — Hàn, Nhật, Đài, Đức | Kaizen";
const DESC =
  "Tư vấn du học 8 quốc gia: chi phí minh bạch, học bổng tới 100%, tỷ lệ visa 98%. Đăng ký tư vấn miễn phí cùng chuyên gia Kaizen.";

export const Route = createFileRoute("/du-hoc/")({
  loader: () => getPageBanner({ data: { page_key: "du-hoc" } }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      breadcrumbScript([
        { name: "Trang chủ", path: "/" },
        { name: "Du học", path: "/du-hoc" },
      ]),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Du học quốc tế cùng Kaizen",
          description: DESC,
          url: PAGE_URL,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: STUDY_COUNTRY_LIST.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `Du học ${c.name}`,
              url: `${SITE_URL}/du-hoc/${c.slug}`,
            })),
          },
        }),
      },
    ],
  }),
  component: DuHocIndex,
});

function DuHocIndex() {
  const banner = Route.useLoaderData();
  return <DuHocOverview banner={banner} />;
}
