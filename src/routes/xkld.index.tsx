import { createFileRoute } from "@tanstack/react-router";
import { XkldOverview } from "./xkld";
import { getPageBanner } from "@/lib/page-banners.functions";

export const Route = createFileRoute("/xkld/")({
  loader: () => getPageBanner({ data: { page_key: "xkld" } }),
  component: XkldIndex,
});

function XkldIndex() {
  const banner = Route.useLoaderData();
  return <XkldOverview banner={banner} />;
}
