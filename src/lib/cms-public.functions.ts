import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public (unauthenticated) read helpers for CMS entries.
 * Only returns published, non-deleted entries.
 */

export const getPublishedEntryBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ typeSlug: z.string(), slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: type } = await supabaseAdmin
      .from("cms_content_types")
      .select("id, slug, template, field_schema")
      .eq("slug", data.typeSlug)
      .maybeSingle();
    if (!type) return null;

    const { data: entry, error } = await supabaseAdmin
      .from("cms_entries")
      .select("*")
      .eq("content_type_id", (type as any).id)
      .eq("slug", data.slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!entry) return null;
    return { entry, type };
  });

export const listPublishedEntriesByType = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ typeSlug: z.string(), limit: z.number().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: type } = await supabaseAdmin
      .from("cms_content_types")
      .select("id, slug")
      .eq("slug", data.typeSlug)
      .maybeSingle();
    if (!type) return [];
    const { data: rows } = await supabaseAdmin
      .from("cms_entries")
      .select("id, slug, title, excerpt, cover_image, data, published_at")
      .eq("content_type_id", (type as any).id)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 50);
    return rows ?? [];
  });
