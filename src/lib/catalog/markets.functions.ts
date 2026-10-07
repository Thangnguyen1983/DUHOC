import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

/** Danh mục Thị trường — quản trị nội dung thị trường dùng chung cho các trang công khai. */


async function assertManage(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "catalog.manage");
}

export const listMarkets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("catalog_markets")
      .select("*")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const marketSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  flag: z.string().max(16).nullable().optional(),
  region: z.enum(["asia", "europe"]).default("asia"),
  tagline: z.string().max(300).nullable().optional(),
  description: z.string().max(3000).nullable().optional(),
  highlights: z.array(z.string().max(300)).default([]),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

export const upsertMarket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => marketSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertManage(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const q = id
      ? supabaseAdmin.from("catalog_markets").update(rest).eq("id", id)
      : supabaseAdmin.from("catalog_markets").insert(rest);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMarket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertManage(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("catalog_markets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
