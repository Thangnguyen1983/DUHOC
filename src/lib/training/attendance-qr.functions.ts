import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ctx(context: any) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { admin: supabaseAdmin, roles: (data ?? []).map((r: any) => r.role as string), userId: context.userId as string };
}

export const openQrSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        session_id: z.string().uuid(),
        late_after_minutes: z.number().int().min(0).max(240).default(15),
        require_approval: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const c = await ctx(context);
    const { openQrSessionImpl } = await import("./attendance-qr.impl");
    return openQrSessionImpl(c.admin, c.userId, c.roles, data);
  });

export const closeQrSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ session_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const c = await ctx(context);
    const { closeQrSessionImpl } = await import("./attendance-qr.impl");
    return closeQrSessionImpl(c.admin, c.userId, c.roles, data);
  });

export const getQrSessionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ session_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const c = await ctx(context);
    const { getQrSessionStateImpl } = await import("./attendance-qr.impl");
    return getQrSessionStateImpl(c.admin, c.userId, c.roles, data);
  });

export const studentCheckIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(10).max(200),
        device_info: z.record(z.any()).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { studentCheckInImpl } = await import("./attendance-qr.impl");
    return studentCheckInImpl(supabaseAdmin, context.userId, data);
  });
