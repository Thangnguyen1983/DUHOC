import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Public reads đã được hợp nhất vào CMS tập trung (`cms_entries`, loại `blog`).
 * Vẫn giữ shape trả về tương thích với UI cũ (`id, slug, title, excerpt,
 * cover_image, category, content, created_at`) để không phải sửa các trang public.
 */
const POST_TYPE_SLUGS = ["blog", "post"] as const;

async function getPostTypeIds(admin: any): Promise<string[]> {
  const { data } = await admin
    .from("cms_content_types")
    .select("id,slug")
    .in("slug", POST_TYPE_SLUGS as any);
  return (data ?? []).map((r: any) => r.id);
}

export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        market: z.string().trim().min(1).max(60).optional(),
        module: z.string().trim().min(1).max(30).optional(),
        categorySlug: z.string().trim().min(1).max(60).optional(),
      })
      .optional()
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const typeIds = await getPostTypeIds(supabaseAdmin);
    if (typeIds.length === 0) return { items: [] as any[] };

    // Resolve category filter → entry ids
    let categoryEntryIds: string[] | null = null;
    if (data?.categorySlug) {
      const { data: cat } = await supabaseAdmin
        .from("cms_categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (!cat) return { items: [] };
      const { data: links } = await supabaseAdmin
        .from("cms_entry_categories")
        .select("entry_id")
        .eq("category_id", (cat as any).id);
      categoryEntryIds = (links ?? []).map((r: any) => r.entry_id);
      if (categoryEntryIds.length === 0) return { items: [] };
    }

    // Market can match either the (new) market column OR the (legacy) tag slug
    let marketEntryIds: string[] | null = null;
    if (data?.market) {
      const { data: tag } = await supabaseAdmin
        .from("cms_tags")
        .select("id")
        .eq("slug", data.market)
        .maybeSingle();
      const idsFromTag: string[] = [];
      if (tag?.id) {
        const { data: links } = await supabaseAdmin
          .from("cms_entry_tags")
          .select("entry_id")
          .eq("tag_id", (tag as any).id);
        idsFromTag.push(...(links ?? []).map((r: any) => r.entry_id));
      }
      const { data: fromCol } = await (supabaseAdmin.from("cms_entries") as any)
        .select("id")
        .eq("market", data.market)
        .in("content_type_id", typeIds);
      marketEntryIds = Array.from(new Set([
        ...idsFromTag,
        ...((fromCol ?? []).map((r: any) => r.id)),
      ]));
      if (marketEntryIds.length === 0) return { items: [] };
    }

    let q = (supabaseAdmin.from("cms_entries") as any)
      .select("id,slug,title,excerpt,cover_image,data,published_at,created_at,module,market,pinned,cms_entry_tags(cms_tags(slug,name))")
      .in("content_type_id", typeIds)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("pinned", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(100);
    if (data?.module) q = q.eq("module", data.module);

    const restrictIds: string[] = [];
    if (categoryEntryIds) restrictIds.push(...categoryEntryIds);
    if (marketEntryIds) {
      if (restrictIds.length > 0) {
        const set = new Set(marketEntryIds);
        const inter = restrictIds.filter((id) => set.has(id));
        if (inter.length === 0) return { items: [] };
        restrictIds.length = 0;
        restrictIds.push(...inter);
      } else restrictIds.push(...marketEntryIds);
    }
    if (restrictIds.length > 0) q = q.in("id", restrictIds);

    const { data: rows, error } = await q;
    if (error) throw error;
    const items = (rows ?? []).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      cover_image: r.cover_image,
      category: (r.data as any)?.category ?? null,
      module: r.module ?? null,
      market: r.market ?? null,
      pinned: !!r.pinned,
      created_at: r.published_at ?? r.created_at,
      tags: (r.cms_entry_tags ?? [])
        .map((t: any) => t.cms_tags)
        .filter(Boolean)
        .map((t: any) => ({ slug: t.slug, name: t.name })),
    }));
    return { items };
  });

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const typeIds = await getPostTypeIds(supabaseAdmin);
    if (typeIds.length === 0) return { post: null as any };
    const { data: row, error } = await (supabaseAdmin.from("cms_entries") as any)
      .select("id,slug,title,excerpt,cover_image,data,seo,published_at,updated_at,created_at,module,market")
      .in("content_type_id", typeIds)
      .eq("slug", data.slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!row) return { post: null };
    const d = (row.data as any) ?? {};
    return {
      post: {
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        cover_image: row.cover_image,
        category: d.category ?? null,
        content: d.body ?? d.content ?? "",
        faq: Array.isArray(d.faq) ? d.faq : null,
        seo: row.seo ?? null,
        module: row.module ?? null,
        market: row.market ?? null,
        created_at: row.published_at ?? row.created_at,
        updated_at: row.updated_at ?? row.published_at ?? row.created_at,
      },
    };
  });



const postInput = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  title: z.string().trim().min(2).max(200),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().max(50000).default(""),
  cover_image: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  published: z.boolean().default(false),
});

async function assertEditor(ctx: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" }),
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "editor" }),
  ]);
  if (!isAdmin && !isEditor) throw new Error("Forbidden");
}

export const listAllPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("id,slug,title,category,published,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return { items: data ?? [] };
  });

export const getPostById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return { post };
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .insert({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt || null,
        content: data.content,
        cover_image: data.cover_image || null,
        category: data.category || null,
        published: data.published,
        author_id: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: post.id };
  });

export const updatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    postInput.extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin
      .from("posts")
      .update({
        slug: rest.slug,
        title: rest.title,
        excerpt: rest.excerpt || null,
        content: rest.content,
        cover_image: rest.cover_image || null,
        category: rest.category || null,
        published: rest.published,
      })
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin được xóa bài viết");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
