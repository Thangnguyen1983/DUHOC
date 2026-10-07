/**
 * Phase 6 — Đợt 1 + 2 ops:
 *  • SLA scan: phát hiện hồ sơ quá hạn theo bước workflow hiện tại.
 *  • Provision queue: mời tài khoản Portal cho học viên đã xếp lớp.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

async function assertAdmin(ctx: any) {
  return assertPermission(ctx, "operations.manage");
}

const ScanInput = z.object({
  notify: z.boolean().optional().default(false),
});

export type SlaOverdueRow = {
  instance_id: string;
  student_profile_id: string;
  full_name: string;
  phone: string | null;
  current_step: string;
  step_label: string;
  sla_hours: number;
  hours_elapsed: number;
  updated_at: string;
};

/** Quét toàn bộ workflow instance đang chạy, đối chiếu sla_hours của bước hiện tại. */
export const scanSlaOverdue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScanInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("workflow_instances")
      .select(
        "id, current_step, updated_at, student_profile_id, status, student_profiles!inner(full_name, phone, deleted_at), workflow_definitions!inner(steps)",
      )
      .eq("status", "running");
    if (error) throw new Error(error.message);
    const overdue: SlaOverdueRow[] = [];
    const now = Date.now();
    for (const r of rows ?? []) {
      if ((r as any).student_profiles?.deleted_at) continue;
      const steps = ((r as any).workflow_definitions?.steps ?? []) as any[];
      const def = steps.find((s) => s.key === (r as any).current_step);
      const sla = Number(def?.sla_hours ?? 0);
      if (!sla || !(r as any).updated_at) continue;
      const elapsedH = (now - new Date((r as any).updated_at).getTime()) / 3_600_000;
      if (elapsedH > sla) {
        overdue.push({
          instance_id: (r as any).id,
          student_profile_id: (r as any).student_profile_id,
          full_name: (r as any).student_profiles?.full_name ?? "—",
          phone: (r as any).student_profiles?.phone ?? null,
          current_step: (r as any).current_step,
          step_label: def?.label ?? (r as any).current_step,
          sla_hours: sla,
          hours_elapsed: Math.round(elapsedH * 10) / 10,
        updated_at: (r as any).updated_at,
        });
      }
    }
    overdue.sort((a, b) => b.hours_elapsed - a.hours_elapsed);

    if (data.notify && overdue.length > 0) {
      const { sendTelegramMessage } = await import("@/lib/telegram.server");
      const top = overdue.slice(0, 10);
      const text = [
        `⚠️ <b>SLA quá hạn — ${overdue.length} hồ sơ</b>`,
        "",
        ...top.map(
          (o) =>
            `• <b>${o.full_name}</b> · <i>${o.step_label}</i> · quá ${Math.round(o.hours_elapsed - o.sla_hours)}h (SLA ${o.sla_hours}h)`,
        ),
        overdue.length > 10 ? `\n…và ${overdue.length - 10} hồ sơ khác` : "",
      ].join("\n");
      await sendTelegramMessage(text);
    }

    return { overdue, total: overdue.length };
  });

// ----- Provisioning queue -----

export const listProvisionQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("account_provision_queue")
      .select("*, student_profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

const ProcessInput = z.object({ id: z.string().uuid().optional() });

/** Xử lý hàng đợi: mời email Supabase + gán role 'student' nếu user đã tồn tại. */
export const processProvisionQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProcessInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("account_provision_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);
    if (data.id) q = supabaseAdmin.from("account_provision_queue").select("*").eq("id", data.id);
    const { data: pending, error } = await q;
    if (error) throw new Error(error.message);

    const results: Array<{ id: string; status: string; error?: string }> = [];
    for (const row of pending ?? []) {
      try {
        await supabaseAdmin
          .from("account_provision_queue")
          .update({ status: "processing", attempts: ((row as any).attempts ?? 0) + 1 })
          .eq("id", (row as any).id);

        let userId: string | null = null;
        const list = await (supabaseAdmin.auth as any).admin.listUsers({
          page: 1,
          perPage: 200,
        });
        const existing = list.data?.users?.find(
          (u: any) => (u.email ?? "").toLowerCase() === String((row as any).email).toLowerCase(),
        );
        if (existing) {
          userId = existing.id;
        } else {
          const { OFFICIAL_SITE_URL } = await import("@/lib/site-url");
          const inv = await (supabaseAdmin.auth as any).admin.inviteUserByEmail(
            (row as any).email,
            { data: { full_name: (row as any).full_name ?? "" }, redirectTo: `${OFFICIAL_SITE_URL}/accept-invite` },
          );
          if (inv.error) throw new Error(inv.error.message);
          userId = inv.data?.user?.id ?? null;
        }

        if (userId) {
          await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: userId, role: "student" }, { onConflict: "user_id,role" });
          await supabaseAdmin
            .from("student_profiles")
            .update({ user_id: userId })
            .eq("id", (row as any).student_profile_id)
            .is("user_id", null);
        }

        await supabaseAdmin
          .from("account_provision_queue")
          .update({ status: "done", processed_at: new Date().toISOString(), error: null })
          .eq("id", (row as any).id);
        results.push({ id: (row as any).id, status: "done" });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        await supabaseAdmin
          .from("account_provision_queue")
          .update({ status: "error", error: msg })
          .eq("id", (row as any).id);
        results.push({ id: (row as any).id, status: "error", error: msg });
      }
    }
    return { processed: results.length, results };
  });

/** Tự enqueue lại học viên có email nhưng chưa có tài khoản Portal (an toàn để gọi nhiều lần). */
export const enqueueMissingAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles, error } = await supabaseAdmin
      .from("student_profiles")
      .select("id, full_name, email, user_id, current_status")
      .is("user_id", null)
      .not("email", "is", null)
      .in("current_status", [
        "class_pending",
        "training",
        "exam_pending",
        "training_passed",
        "transfer_visa",
        "visa_processing",
        "visa_granted",
        "departure_pending",
        "departed",
        "post_departure",
      ]);
    if (error) throw new Error(error.message);
    let added = 0;
    for (const p of profiles ?? []) {
      const { data: existing } = await supabaseAdmin
        .from("account_provision_queue")
        .select("id")
        .eq("student_profile_id", (p as any).id)
        .in("status", ["pending", "processing", "done"])
        .maybeSingle();
      if (existing) continue;
      await supabaseAdmin.from("account_provision_queue").insert({
        student_profile_id: (p as any).id,
        email: (p as any).email,
        full_name: (p as any).full_name,
      });
      added++;
    }
    return { added };
  });
