import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { permissionsForRoles } from "@/lib/rbac/permissions";
import { readOverrides } from "@/lib/rbac/role-permissions.functions";

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);

    const roles = (data ?? []).map((r) => r.role as string);
    const overrides = await readOverrides(context.supabase);
    const permissions = permissionsForRoles(roles, overrides);

    return {
      userId: context.userId,
      roles,
      permissions,
      isAdmin: roles.includes("admin"),
      isEditor: roles.includes("editor"),
    };
  });
