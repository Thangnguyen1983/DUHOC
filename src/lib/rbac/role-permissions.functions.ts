import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
  type RolePermissionOverrides,
} from "@/lib/rbac/permissions";
import { ROLE_KEYS, type AppRole } from "@/lib/rbac/catalog";

/** Hàng đánh dấu "vai trò này đã được tuỳ chỉnh" (kể cả khi bỏ hết quyền). */
export const CUSTOMIZED_MARKER = "__customized__";

const permissionSchema = z.enum(PERMISSIONS as unknown as [Permission, ...Permission[]]);
const roleSchema = z.enum(ROLE_KEYS as unknown as [AppRole, ...AppRole[]]);

/** Đọc toàn bộ bản ghi đè (không cần quyền admin — dùng cho tính quyền hiệu lực). */
export async function readOverrides(supabase: any): Promise<RolePermissionOverrides> {
  const { data, error } = await supabase.from("role_permissions").select("role, permission");
  if (error) return {};
  const out: RolePermissionOverrides = {};
  const customized = new Set<string>();
  (data ?? []).forEach((r: { role: string; permission: string }) => {
    if (r.permission === CUSTOMIZED_MARKER) {
      customized.add(r.role);
      return;
    }
    const list = (out[r.role as AppRole] ??= []);
    list.push(r.permission as Permission);
  });
  customized.forEach((role) => {
    out[role as AppRole] ??= [];
  });
  return out;
}

async function assertAdmin(context: any) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Bạn không có quyền chỉnh sửa phân quyền vai trò.");
}

export const getRolePermissionMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const overrides = await readOverrides(context.supabase);
    const effective: Record<string, Permission[]> = {};
    ROLE_KEYS.forEach((role) => {
      effective[role] =
        role === "admin"
          ? [...PERMISSIONS]
          : (overrides[role] ?? ROLE_PERMISSIONS[role] ?? []);
    });
    return {
      effective,
      defaults: ROLE_PERMISSIONS as Record<string, Permission[]>,
      customizedRoles: Object.keys(overrides),
    };
  });

export const setRolePermission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      role: roleSchema,
      permission: permissionSchema,
      enabled: z.boolean(),
    }).parse(d),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.role === "admin") throw new Error("Vai trò Quản trị viên luôn có toàn quyền.");

    const overrides = await readOverrides(context.supabase);
    const current = overrides[data.role] ?? ROLE_PERMISSIONS[data.role] ?? [];
    const next = new Set<Permission>(current);
    if (data.enabled) next.add(data.permission);
    else next.delete(data.permission);

    // Ghi lại trọn bộ danh sách của vai trò để trạng thái luôn nhất quán.
    const { error: delErr } = await context.supabase
      .from("role_permissions")
      .delete()
      .eq("role", data.role);
    if (delErr) throw new Error(delErr.message);

    const rows = [
      { role: data.role, permission: CUSTOMIZED_MARKER, created_by: context.userId },
      ...[...next].map((p) => ({ role: data.role, permission: p, created_by: context.userId })),
    ];
    const { error } = await context.supabase.from("role_permissions").insert(rows);
    if (error) throw new Error(error.message);

    return { role: data.role, permissions: [...next] };
  });

export const resetRolePermissions = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ role: roleSchema.optional() }).parse(d ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("role_permissions").delete();
    q = data.role ? q.eq("role", data.role) : q.neq("permission", "");
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });
