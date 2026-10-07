import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MARKETS,
  MARKET_LIST,
  ASIA_MARKETS,
  EUROPE_MARKETS,
  FEATURED_MARKETS,
  type Market,
} from "@/lib/markets";

/**
 * Đọc danh mục Thị trường (catalog_markets) cho các trang công khai.
 * Nếu danh mục chưa có dữ liệu hoặc lỗi kết nối → dùng nội dung gốc trong src/lib/markets.ts.
 */

export type CatalogMarket = Market & { is_featured: boolean; sort_order: number };

function toMarket(row: any): CatalogMarket {
  return {
    slug: row.slug,
    name: row.name,
    flag: row.flag ?? "",
    region: row.region === "europe" ? "europe" : "asia",
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    is_featured: !!row.is_featured,
    sort_order: row.sort_order ?? 0,
  };
}

export async function fetchPublicMarkets(): Promise<CatalogMarket[]> {
  const { data, error } = await supabase
    .from("catalog_markets")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error || !data?.length) return [];
  return data.map(toMarket);
}

export async function fetchPublicMarket(slug: string): Promise<Market | null> {
  try {
    const { data } = await supabase
      .from("catalog_markets")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (data) return toMarket(data);
  } catch {
    /* dùng dữ liệu gốc bên dưới */
  }
  return MARKETS[slug] ?? null;
}

/** Danh sách thị trường cho UI, luôn có dữ liệu (fallback nội dung gốc). */
export function useMarkets() {
  const q = useQuery({
    queryKey: ["public-markets"],
    queryFn: fetchPublicMarkets,
    staleTime: 5 * 60_000,
  });
  const rows = q.data?.length ? q.data : null;
  const all: Market[] = rows ?? MARKET_LIST;
  return {
    all,
    asia: rows ? rows.filter((m) => m.region === "asia") : ASIA_MARKETS,
    europe: rows ? rows.filter((m) => m.region === "europe") : EUROPE_MARKETS,
    featured: rows
      ? (rows.filter((m) => m.is_featured).length ? rows.filter((m) => m.is_featured) : rows.slice(0, 4))
      : FEATURED_MARKETS,
  };
}
