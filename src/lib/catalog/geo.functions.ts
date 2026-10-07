import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

/**
 * Danh mục địa danh hành chính Việt Nam theo mô hình 2 cấp hiện hành:
 * Tỉnh/Thành phố → Xã/Phường/Đặc khu (không còn cấp huyện).
 */

const MANAGE_ROLES: Perm[] = ["catalog.manage"];
const SYNC_ROLES: Perm[] = ["catalog.geo.manage"];

async function assertAnyRole(ctx: { supabase: any; userId: string }, allowed: readonly string[]) {
  return assertPermission(ctx, ...(allowed as Perm[]));
}

/* ===================== Đọc danh mục ===================== */

export const listProvinces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("catalog_provinces")
      .select("*")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listWards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ provinceCode: z.string().min(1), search: z.string().max(120).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("catalog_wards")
      .select("*")
      .eq("province_code", data.provinceCode)
      .order("sort_order");
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    const { data: rows, error } = await q.limit(2000);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/* ===================== Sửa thủ công ===================== */

const provinceSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(160),
  short_name: z.string().max(160).nullable().optional(),
  division_type: z.string().max(60).nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  merged_note: z.string().max(500).nullable().optional(),
});

export const upsertProvince = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => provinceSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, source: "Chỉnh tay trong quản trị" };
    const { error } = id
      ? await supabaseAdmin.from("catalog_provinces").update(payload).eq("id", id)
      : await supabaseAdmin.from("catalog_provinces").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const wardSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(160),
  province_code: z.string().min(1).max(20),
  division_type: z.string().max(60).nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  merged_note: z.string().max(500).nullable().optional(),
});

export const upsertWard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => wardSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, source: "Chỉnh tay trong quản trị" };
    const { error } = id
      ? await supabaseAdmin.from("catalog_wards").update(payload).eq("id", id)
      : await supabaseAdmin.from("catalog_wards").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Ẩn / hiện một địa danh (không xoá để hồ sơ cũ vẫn tra cứu được). */
export const setGeoActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      kind: z.enum(["province", "ward"]),
      id: z.string().uuid(),
      is_active: z.boolean(),
      merged_note: z.string().max(500).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "province" ? "catalog_provinces" : "catalog_wards";
    const { error } = await supabaseAdmin
      .from(table)
      .update({ is_active: data.is_active, merged_note: data.merged_note ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ===================== Cập nhật danh sách chuẩn ===================== */

/**
 * Nạp lại danh sách đơn vị hành chính mới nhất (34 tỉnh/thành, mô hình 2 cấp).
 * Chỉ thêm mới hoặc cập nhật tên/loại đơn vị; không ghi đè cờ ẩn/hiện và ghi chú do người dùng đặt.
 * Logic dùng chung với lịch chạy ngầm hàng tuần (geo-sync.server.ts).
 */
export const syncStandardGeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, SYNC_ROLES);
    const { runGeoSync } = await import("@/lib/catalog/geo-sync.server");
    return runGeoSync("manual");
  });

/** Lần đồng bộ gần nhất (thành công hoặc lỗi) để hiển thị trong thẻ Địa danh. */
export const getGeoSyncStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("catalog_sync_logs")
      .select("id, trigger_source, status, started_at, finished_at, provinces_count, wards_count, error")
      .eq("kind", "geo")
      .order("started_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
