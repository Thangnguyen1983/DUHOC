import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function rolesOf(ctx: { supabase: any; userId: string }): Promise<string[]> {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  return (data ?? []).map((r: any) => r.role);
}

export const getTrainingOversight = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ from: z.string().nullable().optional(), to: z.string().nullable().optional() })
      .default({})
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesOf(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getTrainingOversightImpl } = await import("./oversight.impl");
    const { getTeachingScope } = await import("./scope.server");
    const scope = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
    return getTrainingOversightImpl(supabaseAdmin as any, roles, data, scope.scopeAll ? null : scope.classIds);
  });

export const assignClassTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ class_id: z.string().uuid(), teacher_user_id: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesOf(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assignClassTeacherImpl } = await import("./oversight.impl");
    return assignClassTeacherImpl(supabaseAdmin as any, roles, data);
  });
