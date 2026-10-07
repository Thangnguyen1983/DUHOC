import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

const STAFF_ROLES: Perm[] = ["workflow.view"];

async function getUserRoles(supabase: any, userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role);
}

async function assertAnyRole(ctx: { supabase: any; userId: string }, allowed: readonly string[]) {
  return assertPermission(ctx, ...(allowed as Perm[]));
}

export const listDefinitions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, STAFF_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("workflow_definitions")
      .select("*")
      .order("slug")
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getActiveDefinition = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, STAFF_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("workflow_definitions")
      .select("*")
      .eq("slug", "default_outbound")
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { definition: data };
  });

const stepSchema = z.object({
  key: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  role_required: z.array(z.string()).default([]),
  sla_hours: z.number().int().nullable().optional(),
  next_steps: z.array(z.string()).default([]),
});

export const saveDefinitionVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().default("default_outbound"),
        name: z.string().min(2).max(200),
        description: z.string().max(2000).optional().nullable(),
        steps: z.array(stepSchema).min(1),
        activate: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, ["workflow.manage"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: latest } = await supabaseAdmin
      .from("workflow_definitions")
      .select("version")
      .eq("slug", data.slug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (latest?.version ?? 0) + 1;
    if (data.activate) {
      await supabaseAdmin
        .from("workflow_definitions")
        .update({ is_active: false })
        .eq("slug", data.slug)
        .eq("is_active", true);
    }
    const { error } = await supabaseAdmin.from("workflow_definitions").insert({
      slug: data.slug,
      name: data.name,
      description: data.description ?? null,
      version: nextVersion,
      steps: data.steps,
      is_active: data.activate,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true, version: nextVersion };
  });

export const activateDefinition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, ["workflow.manage"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: def, error: e1 } = await supabaseAdmin
      .from("workflow_definitions")
      .select("slug")
      .eq("id", data.id)
      .maybeSingle();
    if (e1 || !def) throw new Error("Không tìm thấy definition");
    await supabaseAdmin
      .from("workflow_definitions")
      .update({ is_active: false })
      .eq("slug", def.slug)
      .eq("is_active", true);
    const { error } = await supabaseAdmin
      .from("workflow_definitions")
      .update({ is_active: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listInstances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, STAFF_ROLES);
    const { studentDepartmentAccess, limitToDepartments } = await import("@/lib/students/department-access.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: allowed } = await limitToDepartments(supabaseAdmin.from("student_profiles").select("id").limit(10000), await studentDepartmentAccess(context));
    const allowedIds = (allowed ?? []).map((p) => p.id);
    if (!allowedIds.length) return { items: [] };
    const { data, error } = await supabaseAdmin
      .from("workflow_instances")
      .select(
        "id, current_step, status, started_at, updated_at, student_profile_id, student_profiles(full_name, phone, program, country)",
      )
      .in("student_profile_id", allowedIds)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getInstanceByStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_profile_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, STAFF_ROLES);
    const { assertStudentDepartment } = await import("@/lib/students/department-access.server");
    await assertStudentDepartment(context, data.student_profile_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: instance }, { data: logs }] = await Promise.all([
      supabaseAdmin
        .from("workflow_instances")
        .select("*, workflow_definitions(name, version, steps)")
        .eq("student_profile_id", data.student_profile_id)
        .maybeSingle(),
      supabaseAdmin
        .from("workflow_step_logs")
        .select("*")
        .eq("student_profile_id", data.student_profile_id)
        .order("occurred_at", { ascending: false }),
    ]);
    return { instance, logs: logs ?? [] };
  });

export const advanceWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        student_profile_id: z.string().uuid(),
        to_step: z.string().min(1),
        note: z.string().max(2000).optional().nullable(),
        attachment_path: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertStudentDepartment } = await import("@/lib/students/department-access.server");
    await assertStudentDepartment(context, data.student_profile_id, true);
    const userRoles = await getUserRoles(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: instance, error: e1 } = await supabaseAdmin
      .from("workflow_instances")
      .select("*, workflow_definitions(steps)")
      .eq("student_profile_id", data.student_profile_id)
      .maybeSingle();
    if (e1 || !instance) throw new Error("Không tìm thấy workflow của hồ sơ");

    const steps = ((instance as any).workflow_definitions?.steps ?? []) as Array<any>;
    const currentDef = steps.find((s) => s.key === instance.current_step);
    const targetDef = steps.find((s) => s.key === data.to_step);
    if (!targetDef) throw new Error("Bước đích không hợp lệ");

    const allowedNext: string[] = currentDef?.next_steps ?? [];
    if (!allowedNext.includes(data.to_step) && !userRoles.includes("admin")) {
      throw new Error(`Không thể chuyển từ "${instance.current_step}" sang "${data.to_step}"`);
    }
    const required: string[] = targetDef.role_required ?? [];
    if (required.length > 0 && !required.some((r) => userRoles.includes(r))) {
      throw new Error("Bạn không có quyền thực hiện bước này");
    }

    const newStatus =
      data.to_step === "completed"
        ? "done"
        : data.to_step === "paused"
          ? "paused"
          : data.to_step === "cancelled"
            ? "cancelled"
            : "active";

    const { error: e2 } = await supabaseAdmin
      .from("workflow_instances")
      .update({
        current_step: data.to_step,
        status: newStatus,
        completed_at: newStatus === "done" ? new Date().toISOString() : null,
      })
      .eq("id", instance.id);
    if (e2) throw new Error(e2.message);

    await supabaseAdmin.from("workflow_step_logs").insert({
      instance_id: instance.id,
      student_profile_id: data.student_profile_id,
      step_key: data.to_step,
      from_status: instance.current_step,
      to_status: data.to_step,
      actor_id: context.userId,
      note: data.note ?? null,
      attachment_path: data.attachment_path ?? null,
    });

    await supabaseAdmin
      .from("student_profiles")
      .update({ current_status: data.to_step })
      .eq("id", data.student_profile_id);

    await supabaseAdmin.from("student_status_history").insert({
      student_profile_id: data.student_profile_id,
      from_status: instance.current_step,
      to_status: data.to_step,
      actor_id: context.userId,
      note: data.note ?? null,
    });

    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({
      student_profile_id: data.student_profile_id,
      action: "workflow_advance",
      actor_id: context.userId,
      actor_email: (context as any).claims?.email ?? null,
      actor_roles: userRoles,
      stage: data.to_step,
      field: "Bước quy trình",
      old_value: instance.current_step,
      new_value: data.to_step,
      note: data.note ?? null,
    });


    // Telegram notify (best-effort)
    import("@/lib/telegram.server")
      .then(({ sendTelegramMessage }) =>
        sendTelegramMessage(
          `🔁 Workflow: <b>${instance.current_step}</b> → <b>${data.to_step}</b>\nHồ sơ: <code>${data.student_profile_id}</code>${data.note ? `\nGhi chú: ${data.note}` : ""}`,
        ),
      )
      .catch(() => {});

    return { ok: true };
  });

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
