import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/rbac/guard";

/** Cổng cộng tác viên: CTV chỉ thấy dữ liệu gắn với mã KZ-CTV của chính mình. */

async function myAgent(ctx: { supabase: any; userId: string }) {
  await assertPermission(ctx, "ctv.portal");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data } = await db.from("sales_agents").select("id, display_name, collaborator_code, markets, is_active")
    .eq("user_id", ctx.userId).not("collaborator_code", "is", null).maybeSingle();
  return { db, agent: data as null | { id: string; display_name: string | null; collaborator_code: string; markets: string[]; is_active: boolean } };
}

export const getMyCollaborator = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, agent } = await myAgent(context);
    if (!agent) return { agent: null, leads: [], students: [], commissions: [] };
    const [{ data: leads }, { data: students }, { data: commissions }] = await Promise.all([
      db.from("consultations").select("id, full_name, phone, market, program, status, created_at")
        .eq("source", "ctv").eq("campaign_code", agent.collaborator_code).order("created_at", { ascending: false }).limit(200),
      db.from("student_profiles").select("id, full_name, student_code, status, market, created_at")
        .eq("collaborator_id", agent.id).order("created_at", { ascending: false }).limit(200),
      db.from("collaborator_commissions").select("id, order_title, order_revenue, commission_amount, status, paid_at, created_at, student_profile_id")
        .eq("collaborator_id", agent.id).order("created_at", { ascending: false }).limit(200),
    ]);
    // Che bớt số điện thoại học viên: CTV chỉ cần theo dõi tiến độ.
    const mask = (p: string | null) => (p ? p.replace(/\d(?=\d{3})/g, "•") : "");
    return {
      agent,
      leads: (leads ?? []).map((l: any) => ({ ...l, phone: mask(l.phone) })),
      students: (students ?? []).map((s: any) => ({ id: s.id, full_name: s.full_name, student_code: s.student_code, status: s.status, market: s.market, created_at: s.created_at })),
      commissions: commissions ?? [],
    };
  });

export const submitReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    full_name: z.string().trim().min(2, "Nhập họ tên").max(120),
    phone: z.string().trim().regex(/^[0-9+ .-]{9,15}$/, "Số điện thoại không hợp lệ"),
    market: z.string().trim().min(1, "Chọn thị trường").max(60),
    program: z.enum(["du_hoc", "xkld"]),
    note: z.string().trim().max(1000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { db, agent } = await myAgent(context);
    if (!agent) throw new Error("Tài khoản chưa được cấp mã cộng tác viên");
    if (!agent.is_active) throw new Error("Mã cộng tác viên đang tạm ngừng");
    const { error } = await db.from("consultations").insert({
      full_name: data.full_name, phone: data.phone, market: data.market,
      program: data.program === "du_hoc" ? "Du học" : "Xuất khẩu lao động",
      message: data.note || null, source: "ctv", campaign_code: agent.collaborator_code, status: "new",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
