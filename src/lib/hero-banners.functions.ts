import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DATA_URL_RE = /^data:(image\/png|image\/jpeg|image\/webp);base64,[A-Za-z0-9+/=]+$/;

export type HeroBanner = {
  id: string;
  image_url: string;
  alt: string;
  position: number;
  active: boolean;
};

export const listActiveHeroBanners = createServerFn({ method: "GET" }).handler(
  async (): Promise<HeroBanner[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("hero_banners")
      .select("id,image_url,alt,position,active")
      .eq("active", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HeroBanner[];
  },
);

export const listAllHeroBanners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HeroBanner[]> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin được truy cập");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("hero_banners")
      .select("id,image_url,alt,position,active")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HeroBanner[];
  });

export const createHeroBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        image_url: z
          .string()
          .max(2_200_000, "Ảnh quá lớn, tối đa ~1.6MB sau mã hoá base64")
          .refine((v) => DATA_URL_RE.test(v), "Chỉ chấp nhận PNG, JPG hoặc WebP"),
        alt: z.string().trim().max(200).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin được thêm banner");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: maxRow } = await supabaseAdmin
      .from("hero_banners")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = (maxRow?.position ?? -1) + 1;
    const { error } = await supabaseAdmin.from("hero_banners").insert({
      image_url: data.image_url,
      alt: data.alt,
      position: nextPos,
      active: true,
    });
    if (error) throw error;
    return { ok: true };
  });

export const updateHeroBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        alt: z.string().trim().max(200).optional(),
        active: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin được sửa banner");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { alt?: string; active?: boolean } = {};
    if (data.alt !== undefined) patch.alt = data.alt;
    if (data.active !== undefined) patch.active = data.active;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("hero_banners").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteHeroBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin được xoá banner");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("hero_banners").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reorderHeroBanners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin được sắp xếp banner");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await Promise.all(
      data.ids.map((id, idx) =>
        supabaseAdmin.from("hero_banners").update({ position: idx }).eq("id", id),
      ),
    );
    return { ok: true };
  });
