import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { WORKFLOWS } from "@/lib/help/workflows";

const files = readdirSync("src/routes/_authenticated").concat(readdirSync("src/routes"));
const routes = new Set(
  files.filter((f) => f.endsWith(".tsx")).map((f) => "/" + f.replace(/\.tsx$/, "").replace(/\.index$/, "").replace(/^index$/, "").split(".").join("/")),
);

describe("quy trình nghiệp vụ", () => {
  it("mỗi quy trình có quyền và bước", () => {
    for (const w of WORKFLOWS) {
      expect(w.permissions.length, w.slug).toBeGreaterThan(0);
      expect(w.steps.length, w.slug).toBeGreaterThan(0);
    }
  });
  it("mọi nút Làm ở đâu trỏ tới trang có thật", () => {
    for (const w of WORKFLOWS) for (const s of w.steps) if (s.link) expect(routes.has(s.link.to), `${w.slug}: ${s.link.to}`).toBe(true);
  });
});
