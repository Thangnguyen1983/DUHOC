import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

/* ============================================================
 * CMS Media Library — bucket `cms-media`
 * Tables: cms_media_assets, cms_media_folders
 * ============================================================ */

const BUCKET = "cms-media";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB / file
const SIGNED_SECONDS = 60 * 60 * 24 * 365 * 10; // 10y

async function assertStaff(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "media.manage");
}

async function assertAdminOrEditor(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "cms.publish");
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function signPath(path: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_SECONDS);
  if (error || !data) throw error ?? new Error("Không tạo được link");
  return data.signedUrl;
}

/* ---------- Folders ---------- */

export const listMediaFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("cms_media_folders")
      .select("id,name,slug,parent_id,created_at")
      .order("name");
    if (error) throw error;
    return { items: data ?? [] };
  });

export const createMediaFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        parent_id: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("cms_media_folders")
      .insert({ name: data.name, slug, parent_id: data.parent_id ?? null })
      .select("id,name,slug,parent_id")
      .single();
    if (error) throw error;
    return row;
  });

/* ---------- Assets ---------- */

const ListInput = z
  .object({
    folder_id: z.string().uuid().nullable().optional(),
    q: z.string().max(200).optional().default(""),
    mime_prefix: z.string().max(40).optional().default(""),
    limit: z.number().int().min(1).max(200).default(60),
    offset: z.number().int().min(0).default(0),
  })
  .default({});

export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("cms_media_assets")
      .select(
        "id,file_name,storage_path,storage_bucket,mime_type,size_bytes,width,height,alt_text,caption,folder_id,tags,is_public,created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.folder_id !== undefined) {
      if (data.folder_id === null) q = q.is("folder_id", null);
      else q = q.eq("folder_id", data.folder_id);
    }
    if (data.q) q = q.or(`file_name.ilike.%${data.q}%,alt_text.ilike.%${data.q}%,caption.ilike.%${data.q}%`);
    if (data.mime_prefix) q = q.ilike("mime_type", `${data.mime_prefix}%`);

    const { data: rows, error, count } = await q;
    if (error) throw error;

    const items = await Promise.all(
      (rows ?? []).map(async (r: any) => ({
        ...r,
        url: await signPath(r.storage_path).catch(() => ""),
      })),
    );
    return { items, count: count ?? 0 };
  });

const UploadInput = z.object({
  files: z
    .array(
      z.object({
        file_name: z.string().min(1).max(200),
        mime: z.string().min(3).max(120),
        base64: z.string().min(1),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
      }),
    )
    .min(1)
    .max(20),
  folder_id: z.string().uuid().nullable().optional(),
});

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const results: any[] = [];
    for (const f of data.files) {
      const bytes = decodeBase64(f.base64);
      if (bytes.length > MAX_BYTES) {
        throw new Error(`${f.file_name}: vượt quá 10MB`);
      }
      const safeName = f.file_name
        .replace(/[^\w.\-]+/g, "_")
        .slice(0, 80);
      const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: f.mime, upsert: false });
      if (upErr) throw new Error(upErr.message);

      const { data: row, error: insErr } = await supabaseAdmin
        .from("cms_media_assets")
        .insert({
          file_name: f.file_name,
          storage_bucket: BUCKET,
          storage_path: path,
          mime_type: f.mime,
          size_bytes: bytes.length,
          width: f.width ?? null,
          height: f.height ?? null,
          folder_id: data.folder_id ?? null,
          uploaded_by: context.userId,
          is_public: false,
        })
        .select("id,file_name,storage_path,mime_type,size_bytes,width,height,alt_text,folder_id")
        .single();
      if (insErr) throw insErr;

      const url = await signPath(path);
      results.push({ ...row, url });
    }
    return { items: results };
  });

export const updateMediaMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        alt_text: z.string().max(300).optional(),
        caption: z.string().max(1000).optional(),
        folder_id: z.string().uuid().nullable().optional(),
        tags: z.array(z.string().max(40)).max(20).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, any> = {};
    if (data.alt_text !== undefined) patch.alt_text = data.alt_text;
    if (data.caption !== undefined) patch.caption = data.caption;
    if (data.folder_id !== undefined) patch.folder_id = data.folder_id;
    if (data.tags !== undefined) patch.tags = data.tags;
    const { error } = await (supabaseAdmin.from("cms_media_assets") as any)
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("cms_media_assets")
      .select("storage_bucket,storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row) {
      await supabaseAdmin.storage.from(row.storage_bucket).remove([row.storage_path]);
    }
    const { error } = await supabaseAdmin.from("cms_media_assets").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
