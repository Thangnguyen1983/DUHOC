/**
 * Cổng kiểm quyền phía máy chủ — dùng CHUNG cho mọi server function.
 *
 * Trước đây từng module tự giữ một danh sách vai trò cố định (STAFF_ROLES,
 * MANAGE_ROLES...). Điều đó khiến bảng "Vai trò × Quyền" trên /admin/users
 * chỉ tác động tới menu/trang, còn thao tác dữ liệu vẫn theo danh sách cũ.
 *
 * Từ nay mọi kiểm tra đi qua đây: vai trò của người dùng + bản ghi đè trong
 * `role_permissions` → tập quyền hiệu lực → so với quyền yêu cầu.
 * Enforcement dữ liệu cuối cùng vẫn nằm ở RLS.
 */
import { permissionsForRoles, type Permission } from "./permissions";
export type { Permission };
import { readOverrides } from "./role-permissions.functions";

export type AccessCtx = { supabase: any; userId: string };

export type Access = {
  roles: string[];
  permissions: Permission[];
  isAdmin: boolean;
  can: (...perms: Permission[]) => boolean;
};

/** Đọc vai trò + quyền hiệu lực của người đang đăng nhập. */
export async function getAccess(ctx: AccessCtx): Promise<Access> {
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  const roles: string[] = (data ?? []).map((r: any) => r.role as string);
  const overrides = await readOverrides(ctx.supabase);
  const permissions = permissionsForRoles(roles, overrides);
  const set = new Set<string>(permissions);
  return {
    roles,
    permissions,
    isAdmin: roles.includes("admin"),
    can: (...perms: Permission[]) => perms.length === 0 || perms.some((p) => set.has(p)),
  };
}

/** Có ít nhất một trong các quyền? */
export async function hasPermission(ctx: AccessCtx, ...perms: Permission[]): Promise<boolean> {
  const a = await getAccess(ctx);
  return a.can(...perms);
}

/**
 * Yêu cầu có ít nhất một trong các quyền; trả về danh sách vai trò để
 * module tiếp tục dùng cho logic riêng (ghi log, phân nhánh...).
 */
export async function assertPermission(ctx: AccessCtx, ...perms: Permission[]): Promise<string[]> {
  const a = await getAccess(ctx);
  if (!a.can(...perms)) throw new Error("Forbidden");
  return a.roles;
}

/** Yêu cầu có TẤT CẢ các quyền. */
export async function assertAllPermissions(ctx: AccessCtx, ...perms: Permission[]): Promise<string[]> {
  const a = await getAccess(ctx);
  if (!perms.every((p) => a.can(p))) throw new Error("Forbidden");
  return a.roles;
}
