import type { QueryClient } from "@tanstack/react-query";
import { listMarketPosts, listMarketFaqs } from "./market-hub.functions";

type Module = "xkld" | "du-hoc" | "ngoai-ngu" | "outsourcing" | "visa";

/**
 * SSR-prefetch tất cả dữ liệu cho MarketHubSections (news / kinh nghiệm /
 * hướng dẫn / FAQ). Gọi trong `loader` để các khối render đồng thời khi
 * trang hydrate, đồng bộ với trang chủ.
 */
export function prefetchMarketHub(
  qc: QueryClient,
  module: Module,
  market: string,
) {
  return Promise.all([
    qc.ensureQueryData({
      queryKey: ["market-news", module, market],
      queryFn: () =>
        listMarketPosts({
          data: { module, market, categorySlug: "tin-tuc", limit: 12, offset: 0 },
        }),
    }),
    qc.ensureQueryData({
      queryKey: ["market-exp", module, market],
      queryFn: () =>
        listMarketPosts({
          data: { module, market, categorySlug: "kinh-nghiem", limit: 12, offset: 0 },
        }),
    }),
    qc.ensureQueryData({
      queryKey: ["market-guide", module, market],
      queryFn: () =>
        listMarketPosts({
          data: { module, market, categorySlug: "huong-dan", limit: 12, offset: 0 },
        }),
    }),
    qc.ensureQueryData({
      queryKey: ["market-faq", module, market],
      queryFn: () => listMarketFaqs({ data: { module, market } }),
    }),
  ]);
}
