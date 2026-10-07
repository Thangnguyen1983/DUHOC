import { getAccess, type AccessCtx } from "@/lib/rbac/guard";

/** Central boundary for privileged student reads and writes. Never rely on a hidden menu. */
export async function studentDepartmentAccess(ctx: AccessCtx) {
  const access = await getAccess(ctx);
  if (access.isAdmin) return { all: true, readable: [] as string[], writable: [] as string[] };

  const [{ data: scopes, error: scopeError }, { data: staff, error: staffError }] = await Promise.all([
    ctx.supabase.from("staff_department_scope").select("department_id, access_level").eq("user_id", ctx.userId),
    ctx.supabase.from("staff_profiles").select("department_id").eq("user_id", ctx.userId).maybeSingle(),
  ]);
  if (scopeError || staffError) throw new Error("Không thể xác minh phòng ban được phân công");
  const readable = new Set<string>();
  const writable = new Set<string>();
  for (const scope of scopes ?? []) {
    readable.add(scope.department_id);
    if (scope.access_level === "full") writable.add(scope.department_id);
  }
  if (staff?.department_id) {
    readable.add(staff.department_id);
    if (!(scopes ?? []).some((s: { department_id: string; access_level: string }) =>
      s.department_id === staff.department_id && s.access_level !== "full")) writable.add(staff.department_id);
  }
  return { all: false, readable: [...readable], writable: [...writable] };
}

export async function assertStudentDepartment(ctx: AccessCtx, id: string, write = false) {
  const access = await studentDepartmentAccess(ctx);
  if (access.all) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile, error } = await supabaseAdmin.from("student_profiles")
    .select("department_id").eq("id", id).maybeSingle();
  if (error || !profile || !profile.department_id ||
      !(write ? access.writable : access.readable).includes(profile.department_id)) {
    throw new Error("Không có quyền truy cập hồ sơ của phòng ban này");
  }
}

export function limitToDepartments<T extends { in: (column: string, values: string[]) => T }>(
  query: T, access: { all: boolean; readable: string[] },
) {
  return access.all ? query : query.in("department_id", access.readable.length ? access.readable : ["00000000-0000-0000-0000-000000000000"]);
}