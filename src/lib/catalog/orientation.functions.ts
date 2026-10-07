import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/rbac/guard";

/** Danh mục Giáo dục định hướng: khung tiết, chuyên đề, tiêu chuẩn sát hạch, giảng viên. */

export const listOrientationCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [items, teachers] = await Promise.all([
      context.supabase.from("orientation_catalog_items").select("*").order("kind").order("sort_order"),
      context.supabase.from("teachers").select("id, full_name, phone, email").eq("is_active", true).order("full_name"),
    ]);
    if (items.error) throw new Error(items.error.message);
    return { items: items.data ?? [], teachers: teachers.data ?? [] };
  });

const schema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["framework", "module", "criterion", "trainer"]),
  market_code: z.string().max(8).nullable().optional(),
  name: z.string().trim().min(1).max(300),
  hours: z.number().int().min(0).max(1000).nullable().optional(),
  threshold: z.number().min(0).max(1000).nullable().optional(),
  unit: z.string().max(40).nullable().optional(),
  teacher_id: z.string().uuid().nullable().optional(),
  trainer_type: z.string().max(60).nullable().optional(),
  credential: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const upsertOrientationItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    await assertPermission(context, "catalog.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const q = id
      ? supabaseAdmin.from("orientation_catalog_items").update(rest).eq("id", id)
      : supabaseAdmin.from("orientation_catalog_items").insert(rest);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOrientationItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPermission(context, "catalog.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orientation_catalog_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
