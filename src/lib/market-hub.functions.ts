import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Market-Centric Content Hub — public read helpers.
 * Match bài viết theo (module + market) taxonomy, có fallback qua tag slug
 * để hỗ trợ dữ liệu cũ (chỉ tag, chưa gán cột market).
 * Chỉ trả bài published, chưa xoá.
 */

const moduleEnum = z.enum(["xkld", "du-hoc", "ngoai-ngu", "outsourcing", "visa"]);

// ---- helpers -------------------------------------------------------------

/** Lấy tập entry_id thuộc tag slug (VD "han-quoc"). */
async function entryIdsForMarketTag(admin: any, marketSlug: string): Promise<string[]> {
  const { data: tag } = await admin
    .from("cms_tags")
    .select("id")
    .eq("slug", marketSlug)
    .maybeSingle();
  if (!tag?.id) return [];
  const { data } = await admin
    .from("cms_entry_tags")
    .select("entry_id")
    .eq("tag_id", (tag as any).id);
  return (data ?? []).map((r: any) => r.entry_id as string);
}

/** Lấy tập entry_id thuộc category slug (VD "tin-tuc"). */
async function entryIdsForCategory(admin: any, slug: string): Promise<string[] | null> {
  const { data: cat } = await admin
    .from("cms_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!cat?.id) return null;
  const { data } = await admin
    .from("cms_entry_categories")
    .select("entry_id")
    .eq("category_id", (cat as any).id);
  return (data ?? []).map((r: any) => r.entry_id as string);
}

// ---- 1. Portal config của 1 thị trường (content_type 'market_hub') ----
export const getMarketHub = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ module: moduleEnum, country: z.string().min(1).max(60) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: type } = await supabaseAdmin
      .from("cms_content_types")
      .select("id")
      .eq("slug", "market_hub")
      .maybeSingle();
    if (!type) return null;

    const { data: entry } = await (supabaseAdmin.from("cms_entries") as any)
      .select("id, slug, title, excerpt, cover_image, data, seo, updated_at")
      .eq("content_type_id", (type as any).id)
      .eq("module", data.module)
      .eq("market", data.country)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    return entry ?? null;
  });

// ---- 2. Bài viết của 1 thị trường, lọc theo category (có fallback qua tag) ----
export const listMarketPosts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        module: moduleEnum,
        market: z.string().min(1).max(60),
        categorySlug: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(6),
        offset: z.number().int().min(0).default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Nếu có categorySlug: resolve entry_id
    let categoryEntryIds: string[] | null = null;
    if (data.categorySlug) {
      categoryEntryIds = await entryIdsForCategory(supabaseAdmin, data.categorySlug);
      if (categoryEntryIds === null || categoryEntryIds.length === 0) {
        return { items: [], total: 0 };
      }
    }

    // Tập bài match tag thị trường (fallback dữ liệu cũ)
    const tagEntryIds = await entryIdsForMarketTag(supabaseAdmin, data.market);

    // Build query: (market = X OR id IN tagEntryIds) AND (module = X OR module IS NULL)
    let q = (supabaseAdmin.from("cms_entries") as any)
      .select(
        "id, slug, title, excerpt, cover_image, published_at, pinned, featured, module, market",
        { count: "exact" },
      )
      .in("content_type_id",
        (await supabaseAdmin.from("cms_content_types").select("id").in("slug", ["blog", "post"])).data?.map(
          (r: any) => r.id,
        ) ?? [],
      )
      .eq("status", "published")
      .is("deleted_at", null);

    // OR market column OR trong tập tag
    if (tagEntryIds.length > 0) {
      const idsCsv = tagEntryIds.map((id) => `"${id}"`).join(",");
      q = q.or(`market.eq.${data.market},id.in.(${idsCsv})`);
    } else {
      q = q.eq("market", data.market);
    }

    // Module: khớp module hoặc bài đa thị trường (module IS NULL)
    q = q.or(`module.eq.${data.module},module.is.null`);

    if (categoryEntryIds) {
      q = q.in("id", categoryEntryIds);
    }

    const { data: rows, count, error } = await q
      .order("pinned", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (error) throw error;
    return { items: (rows ?? []) as any[], total: count ?? 0 };
  });

// ---- 3. FAQ của thị trường (category 'hoi-dap') ----
export const listMarketFaqs = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ module: moduleEnum, market: z.string().min(1).max(60) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const catIds = await entryIdsForCategory(supabaseAdmin, "hoi-dap");
    if (catIds === null || catIds.length === 0) return [];

    const tagEntryIds = await entryIdsForMarketTag(supabaseAdmin, data.market);

    let q = (supabaseAdmin.from("cms_entries") as any)
      .select("id, slug, title, excerpt, data")
      .eq("status", "published")
      .is("deleted_at", null)
      .in("id", catIds);

    if (tagEntryIds.length > 0) {
      const idsCsv = tagEntryIds.map((id) => `"${id}"`).join(",");
      q = q.or(`market.eq.${data.market},id.in.(${idsCsv})`);
    } else {
      q = q.eq("market", data.market);
    }
    q = q.or(`module.eq.${data.module},module.is.null`);

    const { data: rows } = await q
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(20);
    return (rows ?? []) as any[];
  });

// ---- 4. Bài liên quan (cùng thị trường, khác id) ----
export const getRelatedPosts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        module: moduleEnum,
        market: z.string().min(1).max(60),
        excludeId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(20).default(6),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tagEntryIds = await entryIdsForMarketTag(supabaseAdmin, data.market);

    let q = (supabaseAdmin.from("cms_entries") as any)
      .select("id, slug, title, excerpt, cover_image, published_at")
      .eq("status", "published")
      .is("deleted_at", null);

    if (tagEntryIds.length > 0) {
      const idsCsv = tagEntryIds.map((id) => `"${id}"`).join(",");
      q = q.or(`market.eq.${data.market},id.in.(${idsCsv})`);
    } else {
      q = q.eq("market", data.market);
    }
    q = q.or(`module.eq.${data.module},module.is.null`);

    if (data.excludeId) q = q.neq("id", data.excludeId);
    const { data: rows } = await q
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(data.limit);
    return (rows ?? []) as any[];
  });
