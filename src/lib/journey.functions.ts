import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GalleryItem = { url: string; alt?: string };
export type DocumentItem = { name: string; url: string };

export type Milestone = {
  id: string;
  year: string;
  sort_order: number;
  slug: string;
  title: string;
  short_description: string;
  content: string;
  cover_image: string;
  cover_alt: string;
  gallery: GalleryItem[];
  video_url: string | null;
  documents: DocumentItem[];
  achievements: string[];
  status: "published" | "draft";
};

const SELECT_PUBLIC =
  "id,year,sort_order,slug,title,short_description,content,cover_image,cover_alt,gallery,video_url,documents,achievements,status";

// ---------- Public ----------

export const listPublishedMilestones = createServerFn({ method: "GET" }).handler(
  async (): Promise<Milestone[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("journey_milestones")
      .select(SELECT_PUBLIC)
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Milestone[];
  },
);

// ---------- Admin helpers ----------

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Chỉ admin được dùng chức năng này");
}

// ---------- Admin CRUD ----------

export const listAllMilestones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Milestone[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("journey_milestones")
      .select(SELECT_PUBLIC)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Milestone[];
  });

const galleryItem = z.object({
  url: z.string().trim().min(1).max(2000),
  alt: z.string().trim().max(200).optional().default(""),
});
const documentItem = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.string().trim().min(1).max(2000),
});

const milestoneInput = z.object({
  year: z.string().trim().min(1).max(40),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số, dấu gạch ngang"),
  title: z.string().trim().min(2).max(200),
  short_description: z.string().trim().max(500).default(""),
  content: z.string().max(20000).default(""),
  cover_image: z.string().trim().max(2000).default(""),
  cover_alt: z.string().trim().max(200).default(""),
  gallery: z.array(galleryItem).max(30).default([]),
  video_url: z.string().trim().max(500).nullable().default(null),
  documents: z.array(documentItem).max(20).default([]),
  achievements: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  status: z.enum(["published", "draft"]).default("draft"),
  sort_order: z.number().int().min(0).max(100000).default(0),
});

export const createMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => milestoneInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: maxRow } = await supabaseAdmin
      .from("journey_milestones")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const next = (maxRow?.sort_order ?? 0) + 10;
    const { data: row, error } = await supabaseAdmin
      .from("journey_milestones")
      .insert({ ...data, sort_order: data.sort_order || next })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const updateMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    milestoneInput.extend({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin
      .from("journey_milestones")
      .update(rest)
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("journey_milestones")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reorderMilestones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).max(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await Promise.all(
      data.ids.map((id, idx) =>
        supabaseAdmin
          .from("journey_milestones")
          .update({ sort_order: (idx + 1) * 10 })
          .eq("id", id),
      ),
    );
    return { ok: true };
  });

// ---------- Media upload ----------

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3MB

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export const uploadJourneyImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        base64: z.string().min(1).max(5_000_000),
        mime: z.enum(["image/png", "image/jpeg", "image/jpg", "image/webp"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const bytes = decodeBase64(data.base64);
    if (bytes.length > MAX_UPLOAD_BYTES) throw new Error("Ảnh quá lớn, tối đa 3MB");
    const ext = MIME_EXT[data.mime];
    const path = `milestones/${crypto.randomUUID()}.${ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("journey-media")
      .upload(path, bytes, { contentType: data.mime, upsert: false });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage
      .from("journey-media")
      .getPublicUrl(path);
    return { url: pub.publicUrl };
  });
