import { createFileRoute } from "@tanstack/react-router";
import { NgoaiNguOverview } from "./ngoai-ngu";
import { getPageBanner } from "@/lib/page-banners.functions";

export const Route = createFileRoute("/ngoai-ngu/")({
  loader: () => getPageBanner({ data: { page_key: "ngoai-ngu" } }),
  component: NgoaiNguIndex,
});

function NgoaiNguIndex() {
  const banner = Route.useLoaderData();
  return <NgoaiNguOverview banner={banner} />;
}
