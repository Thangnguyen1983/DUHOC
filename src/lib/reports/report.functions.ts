/**
 * Server functions cho Trung tâm báo cáo (/admin/bao-cao).
 * Dùng lại RBAC hiện có (user_roles + role_permissions) và bộ dựng Excel thương hiệu.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { permissionsForRoles } from "@/lib/rbac/permissions";
import { readOverrides } from "@/lib/rbac/role-permissions.functions";
import { REPORT_BY_KEY, REPORT_KEYS, type ReportKey } from "./catalog";

type Input = {
  key: ReportKey;
  from?: string | null;
  to?: string | null;
  group?: string | null;
  search?: string | null;
};

function parseInput(raw: any): Input {
  const key = String(raw?.key ?? "") as ReportKey;
  if (!REPORT_KEYS.includes(key)) throw new Error("Loại báo cáo không hợp lệ");
  return {
    key,
    from: raw?.from ? String(raw.from) : null,
    to: raw?.to ? String(raw.to) : null,
    group: raw?.group ? String(raw.group) : null,
    search: raw?.search ? String(raw.search) : null,
  };
}

async function assertReportAccess(context: any, key: ReportKey, needExport = false) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role as string);
  const overrides = await readOverrides(context.supabase);
  const perms = permissionsForRoles(roles, overrides);
  const need = REPORT_BY_KEY[key].permission;
  const ok =
    perms.includes("report.view") &&
    perms.includes(need) &&
    (!needExport || perms.includes("report.export"));
  if (!ok) throw new Error("Bạn không có quyền xem báo cáo này");
  return { roles, perms };
}

export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseInput)
  .handler(async ({ data, context }) => {
    await assertReportAccess(context, data.key);
    const { loadReport } = await import("./data.server");
    const payload = await loadReport(data.key, data);
    return { ...payload, rows: payload.rows.slice(0, 2000), totalRows: payload.rows.length };
  });

export const exportReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseInput)
  .handler(async ({ data, context }) => {
    await assertReportAccess(context, data.key, true);
    const { loadReport } = await import("./data.server");
    const { buildChartReportWorkbook } = await import("@/lib/operations/report.server");
    const payload = await loadReport(data.key, data);
    const bytes = await buildChartReportWorkbook({
      title: payload.title,
      exportedBy: context.claims?.email ?? context.userId,
      generatedAt: payload.generatedAt,
      summary: payload.summary,
      headers: payload.headers,
      rows: payload.rows,
    });
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    const stamp = new Date().toISOString().slice(0, 10);
    return {
      filename: `BaoCao_${data.key.replace(/\./g, "-")}_${stamp}.xlsx`,
      base64: btoa(bin),
      rows: payload.rows.length,
    };
  });

/** Danh sách báo cáo mà tài khoản hiện tại được phép xem. */
export const getAvailableReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r: any) => r.role as string);
    const overrides = await readOverrides(context.supabase);
    const perms = permissionsForRoles(roles, overrides);
    const canExport = perms.includes("report.export");
    const keys = perms.includes("report.view")
      ? REPORT_KEYS.filter((k) => perms.includes(REPORT_BY_KEY[k].permission))
      : [];
    return { keys: keys as ReportKey[], canExport };
  });
