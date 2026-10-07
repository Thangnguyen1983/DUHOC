import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeMarkdown, looksUnnormalized } from "@/lib/cms/normalize-markdown";

/* ============================================================
 * CMS core server functions — Pha 1
 * Bảng: cms_content_types / cms_entries / cms_entry_revisions
 *        cms_categories / cms_tags / cms_audit_logs
 * ============================================================ */

/**
 * Cờ quyền CMS — tính từ kho phân quyền (Vai trò × Quyền), không còn danh sách vai trò cố định.
 * - staff: được sửa mọi nội dung (cms.edit và không phải chỉ là cộng tác viên)
 * - editor: được xuất bản/hẹn giờ (cms.publish)
 * - contributor: chỉ sửa bài của mình
 * - admin: thao tác huỷ diệt (xoá vĩnh viễn, backfill)
 */
async function getRoles(ctx: { supabase: any; userId: string }) {
  const { getAccess } = await import("@/lib/rbac/guard");
  const a = await getAccess(ctx);
  const onlyContributor =
    a.roles.includes("contributor") && !a.roles.some((r) => r !== "contributor" && r !== "student");
  return {
    admin: a.isAdmin,
    editor: a.can("cms.publish"),
    contributor: a.roles.includes("contributor"),
    staff: a.can("cms.edit") && !onlyContributor,
  };
}

function isStaff(roles: { staff: boolean }) {
  return roles.staff;
}

async function logAudit(
  admin: any,
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string | null | undefined,
  diff: unknown = null,
) {
  await admin.from("cms_audit_logs").insert({
    actor_id: actorId,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    diff: diff as any,
  });
}

/* ---------- Content types ---------- */

export const listContentTypes = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("cms_content_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return { items: data ?? [] };
});


/* ---------- Entries ---------- */

const entryFilterInput = z.object({
  type: z.string().min(1).max(60),
  status: z.enum(["all", "draft", "pending", "scheduled", "published", "archived", "trash"]).default("all"),
  q: z.string().max(200).optional().default(""),
  limit: z.number().int().min(1).max(500).default(100),
  module: z.string().max(30).optional(),
  market: z.string().max(60).optional(),
  categorySlug: z.string().max(60).optional(),
});

export const listEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => entryFilterInput.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles) && !roles.contributor) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: type, error: tErr } = await supabaseAdmin
      .from("cms_content_types")
      .select("id,slug,name,template")
      .eq("slug", data.type)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!type) throw new Error("Content type không tồn tại");

    // Resolve category filter (if any)
    let categoryEntryIds: string[] | null = null;
    if (data.categorySlug) {
      const { data: cat } = await supabaseAdmin
        .from("cms_categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (!cat) return { type, items: [] };
      const { data: links } = await supabaseAdmin
        .from("cms_entry_categories")
        .select("entry_id")
        .eq("category_id", (cat as any).id);
      categoryEntryIds = (links ?? []).map((r: any) => r.entry_id);
      if (categoryEntryIds.length === 0) return { type, items: [] };
    }

    let q = (supabaseAdmin.from("cms_entries") as any)
      .select("id,slug,title,excerpt,cover_image,status,scheduled_at,published_at,deleted_at,author_id,updated_at,view_count,version,module,market,pinned,featured")
      .eq("content_type_id", type.id)
      .order("updated_at", { ascending: false })
      .limit(data.limit);

    if (data.status === "trash") q = q.not("deleted_at", "is", null);
    else {
      q = q.is("deleted_at", null);
      if (data.status !== "all") q = q.eq("status", data.status);
    }
    if (data.q) q = q.ilike("title", `%${data.q}%`);
    if (data.module) q = q.eq("module", data.module);
    if (data.market) q = q.eq("market", data.market);
    if (categoryEntryIds) q = q.in("id", categoryEntryIds);

    // Contributor chỉ thấy bài của mình
    if (!isStaff(roles) && roles.contributor) q = q.eq("author_id", context.userId);

    const { data: items, error } = await q;
    if (error) throw error;
    return { type, items: items ?? [] };
  });


export const getEntry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles) && !roles.contributor) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: entry, error } = await supabaseAdmin
      .from("cms_entries")
      .select("*, cms_content_types(slug,name,template,field_schema)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!entry) throw new Error("Không tìm thấy");
    if (!isStaff(roles) && roles.contributor && entry.author_id !== context.userId)
      throw new Error("Forbidden");
    const [{ data: cats }, { data: tags }] = await Promise.all([
      supabaseAdmin.from("cms_entry_categories").select("category_id").eq("entry_id", entry.id),
      supabaseAdmin.from("cms_entry_tags").select("tag_id").eq("entry_id", entry.id),
    ]);
    return {
      entry,
      category_ids: (cats ?? []).map((r: any) => r.category_id),
      tag_ids: (tags ?? []).map((r: any) => r.tag_id),
    };
  });

const seoSchema = z
  .object({
    meta_title: z.string().max(180).optional(),
    meta_description: z.string().max(320).optional(),
    meta_keywords: z.string().max(300).optional(),
    canonical: z.string().max(500).optional(),
    robots: z.string().max(80).optional(),
    og_title: z.string().max(180).optional(),
    og_description: z.string().max(320).optional(),
    og_image: z.string().max(500).optional(),
    twitter_card: z.string().max(40).optional(),
    schema_jsonld: z
      .union([z.string(), z.record(z.string(), z.any()), z.array(z.any())])
      .transform((v) => (typeof v === "string" ? v : JSON.stringify(v)))
      .pipe(z.string().max(20000))
      .optional(),
  })
  .partial()
  .default({});

const upsertInput = z.object({
  id: z.string().uuid().optional(),
  content_type_slug: z.string().min(1).max(60),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ chữ thường/số/dấu -"),
  title: z.string().trim().min(2).max(300),
  excerpt: z.string().max(600).optional().default(""),
  cover_image: z.string().max(4000).optional().default(""),
  data: z.record(z.string(), z.any()).default({}),
  seo: seoSchema,
  status: z.enum(["draft", "pending", "scheduled", "published", "archived"]).default("draft"),
  scheduled_at: z.string().datetime().nullable().optional(),
  category_ids: z.array(z.string().uuid()).optional().default([]),
  tag_ids: z.array(z.string().uuid()).optional().default([]),
  revision_note: z.string().max(300).optional().default(""),
  // Taxonomy market-centric (Vòng 1)
  module: z.enum(["xkld", "du-hoc", "ngoai-ngu", "outsourcing", "visa"]).nullable().optional(),
  market: z.string().max(60).nullable().optional(),
  pinned: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
});

export const upsertEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertInput.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles) && !roles.contributor) throw new Error("Forbidden");

    // Contributor không được đăng
    if (!isStaff(roles) && data.status === "published") {
      throw new Error("Bạn không có quyền đăng bài — hãy gửi duyệt");
    }
    // Chỉ admin/editor được publish
    if (data.status === "published" && !(roles.admin || roles.editor)) {
      throw new Error("Chỉ admin/editor được đăng");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ct, error: tErr } = await supabaseAdmin
      .from("cms_content_types")
      .select("id,slug")
      .eq("slug", data.content_type_slug)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!ct) throw new Error("Content type không tồn tại");

    const now = new Date().toISOString();

    // Không tự động chuẩn hoá markdown khi lưu — dễ ghi đè format tinh tế
    // của biên tập viên. Chức năng normalize vẫn có ở backfillCmsMarkdown
    // (chạy có chủ đích từ Admin → CMS).
    const normalizedData: any = data.data;
    const didNormalize = false;

    const payload = {
      content_type_id: ct.id,
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt || null,
      cover_image: data.cover_image || null,
      data: normalizedData as any,
      seo: data.seo as any,
      status: data.status,
      scheduled_at: data.scheduled_at ?? null,
      updated_by: context.userId,
      module: data.module ?? null,
      market: data.market ?? null,
      pinned: data.pinned ?? false,
      featured: data.featured ?? false,
      ...(data.status === "published" ? { published_at: now } : {}),
    } as Record<string, any>;

    let entryId = data.id;
    if (entryId) {
      // Lưu revision trước khi update
      const { data: prev } = await supabaseAdmin
        .from("cms_entries")
        .select("*")
        .eq("id", entryId)
        .maybeSingle();
      if (prev) {
        // Contributor chỉ sửa bài của mình
        if (!isStaff(roles) && roles.contributor && prev.author_id !== context.userId)
          throw new Error("Forbidden");
        await supabaseAdmin.from("cms_entry_revisions").insert({
          entry_id: entryId,
          version: prev.version,
          title: prev.title,
          excerpt: prev.excerpt,
          cover_image: prev.cover_image,
          data: prev.data,
          seo: prev.seo,
          status: prev.status,
          editor_id: context.userId,
          note: data.revision_note || null,
        });
        payload.version = (prev.version ?? 1) + 1;
      }
      const { error } = await (supabaseAdmin.from("cms_entries") as any)
        .update(payload)
        .eq("id", entryId);
      if (error) throw error;
      await logAudit(supabaseAdmin, context.userId, "update", "cms_entry", entryId, {
        status: data.status,
        note: data.revision_note,
      });
    } else {
      const { data: created, error } = await (supabaseAdmin.from("cms_entries") as any)
        .insert({ ...payload, author_id: context.userId })
        .select("id")
        .single();
      if (error) throw error;
      entryId = created.id;
      await logAudit(supabaseAdmin, context.userId, "create", "cms_entry", entryId, {
        status: data.status,
      });
    }

    // Đồng bộ categories + tags
    await supabaseAdmin.from("cms_entry_categories").delete().eq("entry_id", entryId!);
    if (data.category_ids.length)
      await supabaseAdmin.from("cms_entry_categories").insert(
        data.category_ids.map((cid) => ({ entry_id: entryId!, category_id: cid })),
      );
    await supabaseAdmin.from("cms_entry_tags").delete().eq("entry_id", entryId!);
    if (data.tag_ids.length)
      await supabaseAdmin.from("cms_entry_tags").insert(
        data.tag_ids.map((tid) => ({ entry_id: entryId!, tag_id: tid })),
      );

    return { id: entryId!, normalized: didNormalize };
  });

/* ---------- Backfill: auto-normalize markdown cho toàn bộ bài cũ ---------- */

export const backfillCmsMarkdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context);
    if (!roles.admin) throw new Error("Chỉ admin được chạy backfill");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("cms_entries")
      .select("id,title,data,version,excerpt,cover_image,seo,status")
      .in("status", ["published", "draft", "scheduled"])
      .limit(2000);
    if (error) throw error;

    let scanned = 0;
    let changed = 0;
    const errors: { id: string; message: string }[] = [];

    for (const row of rows ?? []) {
      scanned++;
      const d = (row as any).data as Record<string, any> | null;
      const body = d && typeof d.body === "string" ? (d.body as string) : "";
      if (!body || !looksUnnormalized(body)) continue;
      try {
        const after = normalizeMarkdown(body);
        if (after === body) continue;

        // Backup vào revisions trước khi ghi đè.
        await supabaseAdmin.from("cms_entry_revisions").insert({
          entry_id: (row as any).id,
          version: (row as any).version ?? 1,
          title: (row as any).title,
          excerpt: (row as any).excerpt,
          cover_image: (row as any).cover_image,
          data: (row as any).data,
          seo: (row as any).seo,
          status: (row as any).status,
          editor_id: context.userId,
          note: "backfill: auto-normalize markdown",
        });

        const newData = { ...(d ?? {}), body: after };
        const { error: upErr } = await (supabaseAdmin.from("cms_entries") as any)
          .update({ data: newData, version: ((row as any).version ?? 1) + 1 })
          .eq("id", (row as any).id);
        if (upErr) throw upErr;
        changed++;
      } catch (err: any) {
        errors.push({ id: (row as any).id, message: err?.message ?? String(err) });
      }
    }

    await logAudit(supabaseAdmin, context.userId, "backfill_normalize", "cms_entry", null, {
      scanned,
      changed,
      errors: errors.length,
    });
    return { scanned, changed, skipped: scanned - changed - errors.length, errors };
  });

/* ---------- Publish / schedule / soft-delete / restore / duplicate ---------- */

export const publishEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!(roles.admin || roles.editor)) throw new Error("Chỉ admin/editor được đăng");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cms_entries")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw error;
    await logAudit(supabaseAdmin, context.userId, "publish", "cms_entry", data.id);
    return { ok: true };
  });

export const scheduleEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), at: z.string().datetime() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!(roles.admin || roles.editor)) throw new Error("Chỉ admin/editor được hẹn giờ");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cms_entries")
      .update({ status: "scheduled", scheduled_at: data.at, updated_by: context.userId })
      .eq("id", data.id);
    if (error) throw error;
    await logAudit(supabaseAdmin, context.userId, "schedule", "cms_entry", data.id, { at: data.at });
    return { ok: true };
  });

export const softDeleteEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cms_entries")
      .update({ deleted_at: new Date().toISOString(), status: "archived" })
      .eq("id", data.id);
    if (error) throw error;
    await logAudit(supabaseAdmin, context.userId, "soft_delete", "cms_entry", data.id);
    return { ok: true };
  });

export const restoreEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cms_entries")
      .update({ deleted_at: null, status: "draft" })
      .eq("id", data.id);
    if (error) throw error;
    await logAudit(supabaseAdmin, context.userId, "restore", "cms_entry", data.id);
    return { ok: true };
  });

export const hardDeleteEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!roles.admin) throw new Error("Chỉ admin được xóa vĩnh viễn");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cms_entries").delete().eq("id", data.id);
    if (error) throw error;
    await logAudit(supabaseAdmin, context.userId, "hard_delete", "cms_entry", data.id);
    return { ok: true };
  });

export const duplicateEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: src, error } = await supabaseAdmin
      .from("cms_entries")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!src) throw new Error("Không tìm thấy bản gốc");
    const newSlug = `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
    const { data: created, error: e2 } = await supabaseAdmin
      .from("cms_entries")
      .insert({
        content_type_id: src.content_type_id,
        slug: newSlug,
        title: `${src.title} (bản sao)`,
        excerpt: src.excerpt,
        cover_image: src.cover_image,
        data: src.data,
        seo: src.seo,
        status: "draft",
        author_id: context.userId,
        updated_by: context.userId,
      })
      .select("id")
      .single();
    if (e2) throw e2;
    await logAudit(supabaseAdmin, context.userId, "duplicate", "cms_entry", created.id, {
      from: data.id,
    });
    return { id: created.id };
  });

/* ---------- Revisions ---------- */

export const listRevisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ entryId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles) && !roles.contributor) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("cms_entry_revisions")
      .select("id,version,title,status,editor_id,note,created_at")
      .eq("entry_id", data.entryId)
      .order("version", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { items: rows ?? [] };
  });

export const revertRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ entryId: z.string().uuid(), revisionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rev, error } = await supabaseAdmin
      .from("cms_entry_revisions")
      .select("*")
      .eq("id", data.revisionId)
      .maybeSingle();
    if (error) throw error;
    if (!rev || rev.entry_id !== data.entryId) throw new Error("Không tìm thấy phiên bản");
    const { data: cur } = await supabaseAdmin
      .from("cms_entries")
      .select("version")
      .eq("id", data.entryId)
      .maybeSingle();
    const { error: e2 } = await supabaseAdmin
      .from("cms_entries")
      .update({
        title: rev.title,
        excerpt: rev.excerpt,
        cover_image: rev.cover_image,
        data: rev.data,
        seo: rev.seo,
        status: "draft",
        updated_by: context.userId,
        version: (cur?.version ?? 1) + 1,
      })
      .eq("id", data.entryId);
    if (e2) throw e2;
    await logAudit(supabaseAdmin, context.userId, "revert", "cms_entry", data.entryId, {
      to_version: rev.version,
    });
    return { ok: true };
  });

/* ---------- Categories + Tags ---------- */

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("cms_categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return { items: data ?? [] };
});

export const listTags = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("cms_tags").select("*").order("name");
  if (error) throw error;
  return { items: data ?? [] };
});

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        parent_id: z.string().uuid().nullable().optional(),
        slug: z.string().regex(/^[a-z0-9-]+$/).max(80),
        name: z.string().min(1).max(120),
        description: z.string().max(500).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!(roles.admin || roles.editor || roles.staff))
      throw new Error("Không có quyền quản lý danh mục");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      parent_id: data.parent_id ?? null,
      slug: data.slug,
      name: data.name,
      description: data.description || null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("cms_categories")
        .update(payload)
        .eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: c, error } = await supabaseAdmin
      .from("cms_categories")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return { id: c.id };
  });

/* ---------- Audit log ---------- */

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        resource_type: z.string().optional(),
        resource_id: z.string().optional(),
        limit: z.number().int().min(1).max(500).default(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context);
    if (!roles.admin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("cms_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.resource_type) q = q.eq("resource_type", data.resource_type);
    if (data.resource_id) q = q.eq("resource_id", data.resource_id);
    const { data: items, error } = await q;
    if (error) throw error;
    return { items: items ?? [] };
  });

/* ---------- Roles snapshot cho UI CMS ---------- */

export const getCmsRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context);
    return { roles, userId: context.userId };
  });

/* ---------- Posts Hub matrix (module × market) ---------- */

export const getPostsHubMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context);
    if (!isStaff(roles) && !roles.contributor) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: type } = await supabaseAdmin
      .from("cms_content_types")
      .select("id")
      .eq("slug", "post")
      .maybeSingle();
    if (!type) return { rows: [], totals: { total: 0, published: 0, draft: 0, missingTaxonomy: 0 } };
    const { data: rows, error } = await (supabaseAdmin.from("cms_entries") as any)
      .select("id,module,market,status")
      .eq("content_type_id", (type as any).id)
      .is("deleted_at", null)
      .limit(5000);
    if (error) throw error;
    return { rows: (rows ?? []) as Array<{ id: string; module: string | null; market: string | null; status: string }> , totals: {
      total: rows?.length ?? 0,
      published: (rows ?? []).filter((r: any) => r.status === "published").length,
      draft: (rows ?? []).filter((r: any) => r.status === "draft").length,
      missingTaxonomy: (rows ?? []).filter((r: any) => !r.module || !r.market).length,
    }};
  });

