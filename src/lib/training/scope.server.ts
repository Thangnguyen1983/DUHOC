/**
 * Phạm vi dữ liệu của người dùng trong cổng giáo viên.
 *
 * - Giáo vụ (admin / training_manager / training_staff): toàn hệ thống.
 * - Giáo viên (`teacher`): chỉ lớp mình phụ trách + các lớp thuộc thị trường
 *   được gán trong hồ sơ giáo viên (`teachers.markets`). Nếu chưa gán thị
 *   trường, hệ thống tự suy ra từ các lớp đang dạy để không mất quyền xem.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPortalStaff } from "@/lib/rbac/catalog";

type Admin = SupabaseClient<any, any, any>;

export type TeachingScope = {
  scopeAll: boolean;
  markets: string[];
  classIds: string[];
  programIds: string[];
  ownClassIds: string[];
};

export async function getTeachingScope(admin: Admin, userId: string, roles: string[]): Promise<TeachingScope> {
  // Chỉ vai trò "teacher" thuần tuý bị giới hạn theo thị trường.
  if (isPortalStaff(roles) || !roles.includes("teacher")) {
    return { scopeAll: true, markets: [], classIds: [], programIds: [], ownClassIds: [] };
  }

  const { data: teacher } = await admin
    .from("teachers")
    .select("id, markets")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: ownClasses } = await admin
    .from("training_classes")
    .select("id, market, program_id")
    .eq("teacher_id", userId);

  const own = ownClasses ?? [];
  const declared = ((teacher as any)?.markets ?? []).filter(Boolean) as string[];
  const markets = declared.length
    ? declared
    : ([...new Set(own.map((c: any) => c.market).filter(Boolean))] as string[]);

  let scopedClasses: any[] = own;
  if (markets.length > 0) {
    const { data: byMarket } = await admin
      .from("training_classes")
      .select("id, market, program_id")
      .in("market", markets);
    const map = new Map<string, any>();
    for (const c of [...own, ...(byMarket ?? [])]) map.set((c as any).id, c);
    scopedClasses = [...map.values()];
  }

  return {
    scopeAll: false,
    markets,
    classIds: scopedClasses.map((c: any) => c.id),
    programIds: [...new Set(scopedClasses.map((c: any) => c.program_id).filter(Boolean))] as string[],
    ownClassIds: own.map((c: any) => c.id),
  };
}

/** Bản ghi có thuộc phạm vi giáo viên không (theo lớp hoặc chương trình). */
export function inScope(scope: TeachingScope, row: { class_id?: string | null; program_id?: string | null }): boolean {
  if (scope.scopeAll) return true;
  if (row.class_id && scope.classIds.includes(row.class_id)) return true;
  if (row.program_id && scope.programIds.includes(row.program_id)) return true;
  return false;
}

export function assertInScope(scope: TeachingScope, row: { class_id?: string | null; program_id?: string | null }) {
  if (!inScope(scope, row)) throw new Error("Nội dung này thuộc thị trường khác, bạn không có quyền xem");
}
