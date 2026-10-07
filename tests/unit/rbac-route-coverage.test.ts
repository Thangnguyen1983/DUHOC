import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROUTE_PERMISSIONS, requiredPermissionForPath } from "@/lib/rbac/permissions";

/**
 * Cổng kiểm tra tự động: mọi trang mới trong khu quản trị (/admin/*) phải được
 * khai báo quyền trong ROUTE_PERMISSIONS. Nếu thiếu, test này fail ngay khi
 * build/CI chạy — không cần nhớ thủ công mỗi lần thêm module mới.
 */

const ROUTES_DIR = path.resolve(__dirname, "../../src/routes/_authenticated");

/** Chỉ những trang tổng quan mặc định mới được phép dùng quyền nền `/admin`. */
const BASE_ALLOWED = new Set(["/admin", "/admin/huong-dan"]);

function fileToPath(file: string): string | null {
  if (!file.startsWith("admin") || !file.endsWith(".tsx")) return null;
  const base = file.replace(/\.tsx$/, "");
  const segments = base
    .split(".")
    .filter((s) => s !== "index" && s !== "route");
  return "/" + segments.map((s) => (s.startsWith("$") ? "x" : s)).join("/");
}

function adminRoutes(): string[] {
  const files = fs.readdirSync(ROUTES_DIR);
  const out = new Set<string>();
  for (const f of files) {
    const p = fileToPath(f);
    if (p) out.add(p);
  }
  return [...out].sort();
}

describe("RBAC — phủ quyền cho toàn bộ trang quản trị", () => {
  const routes = adminRoutes();

  it("có ít nhất một trang quản trị để kiểm tra", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("mọi trang /admin/* đều có quyền khai báo riêng", () => {
    const missing = routes.filter((r) => {
      if (BASE_ALLOWED.has(r) || r.startsWith("/admin/huong-dan/")) return false;
      const match = ROUTE_PERMISSIONS.filter(
        (m) => r === m.path || r.startsWith(m.path + "/"),
      ).sort((a, b) => b.path.length - a.path.length)[0];
      return !match || match.path === "/admin";
    });

    expect(
      missing,
      `Thiếu khai báo quyền trong src/lib/rbac/permissions.ts cho: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("mọi trang đều trả về một quyền hợp lệ", () => {
    for (const r of routes) {
      expect(requiredPermissionForPath(r), r).toBeTruthy();
    }
  });
});
