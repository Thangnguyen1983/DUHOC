import { isLeadConverted, isLeadLost } from "@/lib/leads/status";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

const MANAGER_ROLES: Perm[] = ["leads.distribute"];
const SALES_ROLES: Perm[] = ["leads.view"];

async function assertAnyRole(ctx: { supabase: any; userId: string }, allowed: readonly string[]) {
  return assertPermission(ctx, ...(allowed as Perm[]));
}

async function log(
  admin: any,
  p: { consultation_id: string; action: string; from_user?: string | null; to_user?: string | null; actor?: string | null; reason?: string | null },
) {
  await admin.from("lead_assignment_logs").insert(p);
}

/** Hàng đợi lead + nhân sự telesales. */
export const getLeadQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertAnyRole(context, SALES_ROLES);
    const isManager = await import("@/lib/rbac/guard").then((g) => g.hasPermission(context, "leads.distribute"));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [leadsRes, agentsRes, logsRes] = await Promise.all([
      supabaseAdmin
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(400),
      supabaseAdmin.from("sales_agents").select("*").order("created_at"),
      supabaseAdmin
        .from("lead_assignment_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const agents = agentsRes.data ?? [];
    const userIds = [
      ...new Set([
        ...agents.map((a: any) => a.user_id),
        ...(leadsRes.data ?? []).map((l: any) => l.assigned_to).filter(Boolean),
      ]),
    ];
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as any[] };
    const nameOf: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => (nameOf[p.id] = p.full_name ?? p.id));

    const all = leadsRes.data ?? [];
    const leads = isManager ? all : all.filter((l: any) => !l.assigned_to || l.assigned_to === context.userId);

    return {
      isManager,
      me: context.userId,
      leads: leads.map((l: any) => ({ ...l, assigned_name: l.assigned_to ? nameOf[l.assigned_to] ?? null : null })),
      agents: agents.map((a: any) => ({ ...a, user_name: nameOf[a.user_id] ?? a.display_name ?? a.user_id })),
      logs: (logsRes.data ?? []).map((g: any) => ({
        ...g,
        from_name: g.from_user ? nameOf[g.from_user] ?? null : null,
        to_name: g.to_user ? nameOf[g.to_user] ?? null : null,
      })),
    };
  });

/* ============ Nhân sự telesales ============ */
const agentSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  display_name: z.string().max(160).nullable().optional(),
  markets: z.array(z.string().max(60)).default([]),
  max_open_leads: z.number().int().min(1).max(500).default(20),
  claim_minutes: z.number().int().min(5).max(1440).default(30),
  is_active: z.boolean().default(true),
});

export const upsertSalesAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => agentSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGER_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const q = id
      ? supabaseAdmin.from("sales_agents").update(rest as any).eq("id", id)
      : supabaseAdmin.from("sales_agents").insert(rest as any);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSalesAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGER_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sales_agents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Phân phối tự động (round-robin) ============ */
async function pickAgent(admin: any, market: string | null) {
  const { data: agents } = await admin.from("sales_agents").select("*").eq("is_active", true);
  let pool = (agents ?? []) as any[];
  if (!pool.length) return null;
  if (market) {
    const scoped = pool.filter((a) => !a.markets?.length || a.markets.includes(market));
    if (scoped.length) pool = scoped;
  }
  const { data: open } = await admin
    .from("consultations")
    .select("assigned_to")
    .in("status", ["new", "contacted"])
    .not("assigned_to", "is", null);
  const load: Record<string, number> = {};
  (open ?? []).forEach((r: any) => (load[r.assigned_to] = (load[r.assigned_to] ?? 0) + 1));

  const available = pool.filter((a) => (load[a.user_id] ?? 0) < a.max_open_leads);
  if (!available.length) return null;
  available.sort((a, b) => {
    const la = load[a.user_id] ?? 0;
    const lb = load[b.user_id] ?? 0;
    if (la !== lb) return la - lb;
    return new Date(a.last_assigned_at ?? 0).getTime() - new Date(b.last_assigned_at ?? 0).getTime();
  });
  return available[0];
}

async function assignLead(admin: any, lead: any, agent: any, actor: string | null, action: string) {
  const deadline = new Date(Date.now() + (agent.claim_minutes ?? 30) * 60_000).toISOString();
  const { error } = await admin
    .from("consultations")
    .update({
      assigned_to: agent.user_id,
      assigned_at: new Date().toISOString(),
      claimed_at: null,
      claim_deadline: deadline,
      reassign_count: (lead.reassign_count ?? 0) + (action === "reassign" ? 1 : 0),
    })
    .eq("id", lead.id);
  if (error) throw new Error(error.message);
  if (agent.id) await admin.from("sales_agents").update({ last_assigned_at: new Date().toISOString() }).eq("id", agent.id);
  await log(admin, {
    consultation_id: lead.id,
    action,
    from_user: lead.assigned_to ?? null,
    to_user: agent.user_id,
    actor,
    reason: action === "reassign" ? "Quá hạn nhận khách" : null,
  });
}

/** Gán tự động toàn bộ lead chưa có người phụ trách + chuyển tiếp lead quá hạn. */
export const autoDistributeLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, MANAGER_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: unassigned } = await supabaseAdmin
      .from("consultations")
      .select("*")
      .is("assigned_to", null)
      .in("status", ["new", "contacted"])
      .order("created_at");

    let assigned = 0;
    for (const lead of unassigned ?? []) {
      const agent = await pickAgent(supabaseAdmin, (lead as any).market ?? null);
      if (!agent) break;
      await assignLead(supabaseAdmin, lead, agent, context.userId, "assign");
      assigned++;
    }

    const expired = await reassignExpired(supabaseAdmin, context.userId);
    return { assigned, reassigned: expired };
  });

async function reassignExpired(admin: any, actor: string | null) {
  const nowIso = new Date().toISOString();
  const { data: stale } = await admin
    .from("consultations")
    .select("*")
    .not("assigned_to", "is", null)
    .is("claimed_at", null)
    .lt("claim_deadline", nowIso)
    .in("status", ["new", "contacted"]);

  let count = 0;
  for (const lead of stale ?? []) {
    const agent = await pickAgent(admin, lead.market ?? null);
    if (!agent || agent.user_id === lead.assigned_to) continue;
    await assignLead(admin, lead, agent, actor, "reassign");
    count++;
  }
  return count;
}

/** Nhân viên bấm "Nhận khách" — khoá lead cho chính mình. */
export const claimLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertAnyRole(context, SALES_ROLES);
    const isManager = await import("@/lib/rbac/guard").then((g) => g.hasPermission(context, "leads.distribute"));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lead } = await supabaseAdmin.from("consultations").select("*").eq("id", data.id).maybeSingle();
    if (!lead) throw new Error("Không tìm thấy lead");
    if (lead.claimed_at && lead.assigned_to !== context.userId) throw new Error("Lead đã có người nhận");
    if (lead.assigned_to && lead.assigned_to !== context.userId && !isManager) {
      const expired = lead.claim_deadline && new Date(lead.claim_deadline) < new Date();
      if (!expired) throw new Error("Lead đang thuộc nhân viên khác");
    }

    const { error } = await supabaseAdmin
      .from("consultations")
      .update({
        assigned_to: context.userId,
        claimed_at: new Date().toISOString(),
        claim_deadline: null,
        status: lead.status === "new" ? "contacted" : lead.status,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await log(supabaseAdmin, {
      consultation_id: data.id,
      action: "claim",
      from_user: lead.assigned_to ?? null,
      to_user: context.userId,
      actor: context.userId,
    });
    return { ok: true };
  });

/** Quản lý gán tay lead cho một nhân viên. */
export const assignLeadTo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), user_id: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGER_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lead } = await supabaseAdmin.from("consultations").select("*").eq("id", data.id).maybeSingle();
    if (!lead) throw new Error("Không tìm thấy lead");

    if (!data.user_id) {
      await supabaseAdmin
        .from("consultations")
        .update({ assigned_to: null, assigned_at: null, claimed_at: null, claim_deadline: null })
        .eq("id", data.id);
      await log(supabaseAdmin, {
        consultation_id: data.id,
        action: "release",
        from_user: lead.assigned_to ?? null,
        actor: context.userId,
      });
      return { ok: true };
    }

    const { data: agent } = await supabaseAdmin
      .from("sales_agents")
      .select("*")
      .eq("user_id", data.user_id)
      .maybeSingle();
    await assignLead(
      supabaseAdmin,
      lead,
      agent ?? { id: null, user_id: data.user_id, claim_minutes: 30 },
      context.userId,
      "manual_assign",
    );
    return { ok: true };
  });

/* ================= KPI Telesales ================= */
export const getSalesKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ from: z.string().max(30).optional(), to: z.string().max(30).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGER_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("consultations")
      .select("id, status, assigned_to, assigned_at, claimed_at, reassign_count, market, created_at, student_profile_id")
      .limit(5000);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    const agg: Record<
      string,
      { assigned: number; claimed: number; converted: number; lost: number; overdue: number; responseMs: number; responded: number }
    > = {};

    for (const r of list) {
      const key = r.assigned_to ?? "unassigned";
      agg[key] ??= { assigned: 0, claimed: 0, converted: 0, lost: 0, overdue: 0, responseMs: 0, responded: 0 };
      const a = agg[key];
      a.assigned++;
      if (r.claimed_at) {
        a.claimed++;
        if (r.assigned_at) {
          const ms = new Date(r.claimed_at).getTime() - new Date(r.assigned_at).getTime();
          if (ms >= 0) {
            a.responseMs += ms;
            a.responded++;
          }
        }
      }
      if (isLeadConverted(r.status)) a.converted++;
      if (isLeadLost(r.status)) a.lost++;
      if ((r.reassign_count ?? 0) > 0) a.overdue++;
    }

    const ids = Object.keys(agg).filter((k) => k !== "unassigned");
    let names: Record<string, string> = {};
    if (ids.length) {
      const [{ data: agents }, { data: profs }] = await Promise.all([
        supabaseAdmin.from("sales_agents").select("user_id, display_name").in("user_id", ids),
        supabaseAdmin.from("profiles").select("id, full_name").in("id", ids),
      ]);
      names = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name ?? p.id]));
      for (const a of agents ?? []) {
        if (a.display_name) names[a.user_id as string] = a.display_name as string;
      }
    }

    const agents = Object.entries(agg)
      .map(([id, v]) => ({
        id,
        name: id === "unassigned" ? "Chưa phân công" : (names[id] ?? id.slice(0, 8)),
        assigned: v.assigned,
        claimed: v.claimed,
        converted: v.converted,
        lost: v.lost,
        overdue: v.overdue,
        claimRate: v.assigned ? Math.round((v.claimed / v.assigned) * 100) : 0,
        conversionRate: v.assigned ? Math.round((v.converted / v.assigned) * 100) : 0,
        avgResponseMinutes: v.responded ? Math.round(v.responseMs / v.responded / 60000) : null,
      }))
      .sort((a, b) => b.assigned - a.assigned);

    const totals = agents.reduce(
      (acc, a) => {
        acc.assigned += a.assigned;
        acc.claimed += a.claimed;
        acc.converted += a.converted;
        acc.lost += a.lost;
        acc.overdue += a.overdue;
        return acc;
      },
      { assigned: 0, claimed: 0, converted: 0, lost: 0, overdue: 0 },
    );

    return {
      agents,
      totals: {
        ...totals,
        conversionRate: totals.assigned ? Math.round((totals.converted / totals.assigned) * 100) : 0,
      },
    };
  });
