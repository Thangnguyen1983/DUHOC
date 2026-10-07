import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SitePopup = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  cta_label: string;
  cta_href: string;
  starts_at: string | null;
  ends_at: string | null;
  dismiss_hours: number;
  position: number;
  active: boolean;
};

const HREF_RE = /^(\/|https?:\/\/)[A-Za-z0-9\-_/.?=&#%:]*$/;

const writeSchema = z.object({
  title: z.string().trim().min(1, "Bắt buộc").max(120),
  description: z.string().trim().max(500).default(""),
  image_url: z
    .string()
    .trim()
    .max(4000)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  cta_label: z.string().trim().min(1).max(40),
  cta_href: z
    .string()
    .trim()
    .max(300)
    .refine((v) => HREF_RE.test(v), "Đường dẫn không hợp lệ"),
  starts_at: z.string().trim().nullable().optional().transform((v) => (v ? v : null)),
  ends_at: z.string().trim().nullable().optional().transform((v) => (v ? v : null)),
  dismiss_hours: z.number().int().min(0).max(720).default(24),
  active: z.boolean().default(true),
});

async function assertEditor(context: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
  ]);
  if (!isAdmin && !isEditor) throw new Error("Chỉ admin/editor được thao tác");
}

/** Popup đang hiệu lực, ưu tiên position nhỏ nhất. Public — không cần đăng nhập. */
export const getActivePopup = createServerFn({ method: "GET" }).handler(
  async (): Promise<SitePopup | null> => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: any, init: any) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
            h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const nowIso = new Date().toISOString();
    const { data, error } = await client
      .from("site_popups")
      .select(
        "id,title,description,image_url,cta_label,cta_href,starts_at,ends_at,dismiss_hours,position,active",
      )
      .eq("active", true)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
      .order("position", { ascending: true })
      .limit(1);
    if (error) throw error;
    return ((data ?? [])[0] as SitePopup) ?? null;
  },
);

export const listAllPopups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SitePopup[]> => {
    await assertEditor(context);
    const { data, error } = await context.supabase
      .from("site_popups")
      .select(
        "id,title,description,image_url,cta_label,cta_href,starts_at,ends_at,dismiss_hours,position,active",
      )
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as SitePopup[];
  });

export const createPopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => writeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { data: maxRow } = await context.supabase
      .from("site_popups")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = (maxRow?.position ?? -1) + 1;
    const { error } = await context.supabase
      .from("site_popups")
      .insert({ ...data, position: nextPos });
    if (error) throw error;
    return { ok: true };
  });

export const updatePopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    writeSchema.partial().extend({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("site_popups").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const deletePopup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase.from("site_popups").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reorderPopups = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await context.supabase
        .from("site_popups")
        .update({ position: i })
        .eq("id", data.ids[i]);
      if (error) throw error;
    }
    return { ok: true };
  });
