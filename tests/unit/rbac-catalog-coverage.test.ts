import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABEL, ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS, ROUTE_EDIT_PERMISSIONS, permissionsForRoles,
} from "@/lib/rbac/permissions";
import { ROLE_KEYS } from "@/lib/rbac/catalog";

/** Bảng Vai trò × Quyền phải hiển thị đủ mọi quyền, không bỏ sót chức năng nào. */
describe("RBAC — kho phân quyền đầy đủ và nhất quán", () => {
  it("mọi quyền đều có nhãn tiếng Việt", () => {
    expect(PERMISSIONS.filter((p) => !PERMISSION_LABEL[p])).toEqual([]);
  });

  it("mọi quyền đều xuất hiện đúng một lần trong nhóm hiển thị của bảng Vai trò × Quyền", () => {
    const all = PERMISSION_GROUPS.flatMap((g) => g.items);
    expect(PERMISSIONS.filter((p) => !all.includes(p))).toEqual([]);
    expect(all.filter((p, i) => all.indexOf(p) !== i)).toEqual([]);
    expect(all.filter((p) => !(PERMISSIONS as readonly string[]).includes(p))).toEqual([]);
  });

  it("mọi vai trò trong catalog đều có bộ quyền mặc định", () => {
    expect(ROLE_KEYS.filter((r) => !(r in ROLE_PERMISSIONS))).toEqual([]);
  });

  it("bản đồ đường dẫn chỉ dùng quyền hợp lệ", () => {
    for (const m of [...ROUTE_PERMISSIONS, ...ROUTE_EDIT_PERMISSIONS]) {
      expect(PERMISSIONS, m.path).toContain(m.permission);
    }
  });

  it("quyền Sửa bao hàm quyền Xem tương ứng", () => {
    const perms = permissionsForRoles(["teacher"]);
    expect(perms).toContain("attendance.view");
    expect(permissionsForRoles(["visa_officer"])).toContain("departure.view");
  });

  it("mọi quyền dùng trong menu quản trị đều tồn tại trong kho", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../src/routes/_authenticated/route.tsx"), "utf8",
    );
    const used = [...src.matchAll(/can(?:Any)?\(([^)]*)\)/g)]
      .flatMap((m) => [...m[1].matchAll(/"([a-z.]+)"/g)].map((x) => x[1]));
    expect(used.filter((p) => !(PERMISSIONS as readonly string[]).includes(p))).toEqual([]);
  });

  it("server function không còn tự giữ danh sách vai trò cố định", () => {
    const root = path.resolve(__dirname, "../../src/lib");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.functions\.ts$/.test(f)) continue;
        const s = fs.readFileSync(full, "utf8");
        if (/const (?!ASSIGNABLE_)[A-Z_]*ROLES\s*=\s*\[\s*"admin"/.test(s)) offenders.push(path.relative(root, full));
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
