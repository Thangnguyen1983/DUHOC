import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";


async function assertExporter(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "students.export");
}

/** Nhật ký xuất hồ sơ 360° của một học viên (phục vụ thanh tra). */
export const getExportHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_profile_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertExporter(context);
    const { assertStudentDepartment } = await import("@/lib/students/department-access.server");
    await assertStudentDepartment(context, data.student_profile_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items, error } = await supabaseAdmin
      .from("student_export_logs")
      .select("*")
      .eq("student_profile_id", data.student_profile_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });
