import { isLeadConverted } from "@/lib/leads/status";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";


async function assertMarketing(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "marketing.campaigns");
}

const campaignSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  code: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-_]+$/i, "Mã chỉ gồm chữ, số, - và _"),
  channel: z.string().trim().max(80).nullable().optional(),
  market: z.string().trim().max(80).nullable().optional(),
  landing_path: z.string().trim().max(300).nullable().optional(),
  utm_source: z.string().trim().max(120).nullable().optional(),
  utm_medium: z.string().trim().max(120).nullable().optional(),
  utm_campaign: z.string().trim().max(150).nullable().optional(),
  utm_content: z.string().trim().max(150).nullable().optional(),
  utm_term: z.string().trim().max(150).nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  lead_target: z.number().int().nonnegative().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMarketing(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => campaignSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertMarketing(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, created_by: context.userId };
    const q = id
      ? supabaseAdmin.from("marketing_campaigns").update(rest).eq("id", id)
      : supabaseAdmin.from("marketing_campaigns").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertMarketing(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("marketing_campaigns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Báo cáo hiệu quả chiến dịch: lead theo mã chiến dịch / nguồn UTM. */
export const campaignReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMarketing(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: campaigns }, { data: leads }] = await Promise.all([
      supabaseAdmin.from("marketing_campaigns").select("id, name, code, channel, market, lead_target, budget, is_active"),
      supabaseAdmin.from("consultations").select("campaign_code, utm_source, status, created_at").limit(5000),
    ]);

    const bySource: Record<string, number> = {};
    const byCampaign: Record<string, { total: number; converted: number }> = {};
    for (const l of leads ?? []) {
      const src = (l as any).utm_source || "direct";
      bySource[src] = (bySource[src] ?? 0) + 1;
      const code = (l as any).campaign_code;
      if (!code) continue;
      byCampaign[code] ??= { total: 0, converted: 0 };
      byCampaign[code].total++;
      if (isLeadConverted((l as any).status)) byCampaign[code].converted++;
    }

    return {
      campaigns: (campaigns ?? []).map((c: any) => {
        const s = byCampaign[c.code] ?? { total: 0, converted: 0 };
        return {
          ...c,
          leads: s.total,
          converted: s.converted,
          conversion_rate: s.total ? Number(((s.converted / s.total) * 100).toFixed(1)) : 0,
          target_rate: c.lead_target ? Number(((s.total / c.lead_target) * 100).toFixed(1)) : null,
          cost_per_lead: c.budget && s.total ? Math.round(Number(c.budget) / s.total) : null,
        };
      }),
      sources: Object.entries(bySource)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      total_leads: (leads ?? []).length,
    };
  });
