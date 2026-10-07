import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStudentDepartment, studentDepartmentAccess } from "@/lib/students/department-access.server";

async function rolesOf(ctx: { supabase: any; userId: string }): Promise<string[]> {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  return (data ?? []).map((r: any) => r.role);
}

export const getTeachingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await rolesOf(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getTeachingOverviewImpl } = await import("./teaching.impl");
    return getTeachingOverviewImpl(supabaseAdmin as any, context.userId, roles);
  });

export const generateSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        class_id: z.string().uuid(),
        weekdays: z.array(z.number().int().min(0).max(6)).min(1),
        start_date: z.string(),
        end_date: z.string().nullable().optional(),
        count: z.number().int().min(1).max(200).nullable().optional(),
        start_time: z.string(),
        end_time: z.string().nullable().optional(),
        title_prefix: z.string().nullable().optional(),
        skip_existing: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesOf(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { generateSessionsImpl } = await import("./teaching.impl");
    return generateSessionsImpl(supabaseAdmin as any, context.userId, roles, data);
  });

export const getSchedule = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ from: z.string(), to: z.string(), mine: z.boolean().default(false) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesOf(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getScheduleImpl } = await import("./teaching.impl");
    return getScheduleImpl(supabaseAdmin as any, context.userId, roles, data);
  });

export const getStudentTranscript = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_profile_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await rolesOf(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let teacherClassIds: string[] | undefined;
    if (roles.includes("teacher") && !roles.includes("admin")) {
      const { data: ownClasses, error: classError } = await supabaseAdmin.from("training_classes")
        .select("id").eq("teacher_id", context.userId);
      if (classError) throw new Error(classError.message);
      const classIds = (ownClasses ?? []).map((row) => row.id);
      if (!classIds.length) throw new Error("Bạn chưa phụ trách lớp của học viên này");
      const { data: enrollment, error } = await supabaseAdmin.from("training_enrollments")
        .select("id").eq("student_profile_id", data.student_profile_id).in("class_id", classIds).limit(1);
      if (error || !enrollment?.length) throw new Error("Bạn chưa phụ trách lớp của học viên này");
      teacherClassIds = classIds;
    } else {
      await assertStudentDepartment(context, data.student_profile_id);
    }
    const { getStudentTranscriptImpl } = await import("./teaching.impl");
    return getStudentTranscriptImpl(supabaseAdmin as any, roles, data.student_profile_id, teacherClassIds);
  });

export const getClassReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        class_id: z.string().uuid(),
        from: z.string().nullable().optional(),
        to: z.string().nullable().optional(),
        absent_threshold: z.number().int().min(1).default(3),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesOf(context);
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ownTeacher = roles.includes("teacher") && !scope.all;
    if (ownTeacher) {
      const { getTeachingScope } = await import("./scope.server");
      const teaching = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
      if (!teaching.ownClassIds.includes(data.class_id)) throw new Error("Chỉ xem báo cáo lớp mình phụ trách");
    }
    let allowedIds: string[] | null = null;
    if (!scope.all && !ownTeacher) {
      const { limitToDepartments } = await import("@/lib/students/department-access.server");
      const { data: profiles, error } = await limitToDepartments(supabaseAdmin.from("student_profiles").select("id").limit(10000), scope);
      if (error) throw new Error(error.message);
      allowedIds = (profiles ?? []).map((p) => p.id);
    }
    const { getClassReportImpl } = await import("./teaching.impl");
    return getClassReportImpl(supabaseAdmin as any, roles, data, allowedIds);
  });

export const upsertSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        class_id: z.string().uuid(),
        session_date: z.string(),
        start_time: z.string().nullable().optional(),
        end_time: z.string().nullable().optional(),
        title: z.string().max(200).nullable().optional(),
        topic: z.string().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesOf(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { upsertSessionImpl } = await import("./teaching.impl");
    return upsertSessionImpl(supabaseAdmin as any, context.userId, roles, data);
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await rolesOf(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deleteSessionImpl } = await import("./teaching.impl");
    return deleteSessionImpl(supabaseAdmin as any, context.userId, roles, data.id);
  });
