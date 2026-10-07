import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getMyPortalImpl,
  getMyClassesImpl,
  getMyClassDetailImpl,
  markAttendanceImpl,
  upsertGradeImpl,
  type PortalCtx,
} from "./portal.impl";

async function getUserRoles(supabase: any, userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role);
}

async function buildCtx(context: any): Promise<PortalCtx> {
  const roles = await getUserRoles(context.supabase, context.userId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    admin: supabaseAdmin,
    userId: context.userId,
    email: (context.claims as any)?.email ?? null,
    roles,
  };
}

export const getMyPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getMyPortalImpl(await buildCtx(context)));

export const getMyClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getMyClassesImpl(await buildCtx(context)));

export const getMyClassDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ class_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => getMyClassDetailImpl(await buildCtx(context), data));

export const teacherMarkAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        session_id: z.string().uuid(),
        items: z.array(
          z.object({
            enrollment_id: z.string().uuid(),
            status: z.enum(["present", "late", "absent", "excused"]),
            note: z.string().max(500).optional().nullable(),
            reason: z.string().max(300).optional().nullable(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = await buildCtx(context);
    const result = await markAttendanceImpl(ctx, data);
    const { tryAutoIssueCertificateForEnrollment } = await import("@/lib/training/certificate-automation.server");
    const certResults = [];
    for (const enrollmentId of [...new Set(data.items.map((item) => item.enrollment_id))]) {
      certResults.push(await tryAutoIssueCertificateForEnrollment(ctx.admin, { enrollmentId, issuedBy: ctx.userId }));
    }
    return { ...result, certificates_issued: certResults.filter((r) => r.issued).length };
  });

export const teacherUpsertGrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        enrollment_id: z.string().uuid(),
        grade_type: z.string().min(1),
        title: z.string().max(200).optional().nullable(),
        score: z.number(),
        max_score: z.number().positive().default(10),
        weight: z.number().nonnegative().default(1),
        note: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = await buildCtx(context);
    const result = await upsertGradeImpl(ctx, data);
    const { tryAutoIssueCertificateForEnrollment } = await import("@/lib/training/certificate-automation.server");
    const certificate = await tryAutoIssueCertificateForEnrollment(ctx.admin, { enrollmentId: data.enrollment_id, issuedBy: ctx.userId });
    return { ...result, certificate };
  });
