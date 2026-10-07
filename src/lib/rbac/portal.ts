/**
 * Xác định cổng mặc định của tài khoản theo vai trò cao nhất.
 *
 * - Có vai trò quản trị/nghiệp vụ (khác teacher/student) → Cổng quản trị.
 * - Chỉ là giáo viên → Cổng giáo viên.
 * - Chỉ là học viên → Cổng học viên.
 */
export type PortalKind = "admin" | "teacher" | "student";

const PORTAL_ONLY_ROLES = new Set(["teacher", "student"]);

/** Tài khoản có được phép vào khu quản trị không (ngoài quyền chi tiết)? */
export function canUseAdminConsole(roles: string[], permissionCount: number): boolean {
  if (permissionCount <= 0) return false;
  return roles.some((r) => !PORTAL_ONLY_ROLES.has(r));
}

export function defaultPortal(roles: string[], permissionCount: number): PortalKind {
  if (canUseAdminConsole(roles, permissionCount)) return "admin";
  if (roles.includes("teacher")) return "teacher";
  return "student";
}

export const PORTAL_PATH: Record<PortalKind, "/admin" | "/giang-day" | "/hoc-vien"> = {
  admin: "/admin",
  teacher: "/giang-day",
  student: "/hoc-vien",
};
