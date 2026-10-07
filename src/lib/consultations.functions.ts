import { LEAD_STATUSES } from "@/lib/leads/status";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

const consultationSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[0-9+\s().-]+$/, "Số điện thoại không hợp lệ"),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  program: z.enum(["du_hoc", "xkld", "khac"]),
  market: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  campaign_code: z.string().trim().max(80).optional().or(z.literal("")),
  utm_source: z.string().trim().max(120).optional().or(z.literal("")),
  utm_medium: z.string().trim().max(120).optional().or(z.literal("")),
  utm_campaign: z.string().trim().max(150).optional().or(z.literal("")),
  utm_content: z.string().trim().max(150).optional().or(z.literal("")),
  utm_term: z.string().trim().max(150).optional().or(z.literal("")),
});

export const submitConsultation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("consultations").insert({
      full_name: data.full_name,
      phone: data.phone,
      email: data.email || null,
      program: data.program,
      market: data.market || null,
      message: data.message || null,
      campaign_code: data.campaign_code || null,
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || null,
      utm_campaign: data.utm_campaign || null,
      utm_content: data.utm_content || null,
      utm_term: data.utm_term || null,
    });
    if (error) {
      console.error("submitConsultation error", error);
      throw new Error("Không thể gửi đăng ký. Vui lòng thử lại.");
    }
    // Fire-and-forget Telegram notification
    import("./telegram.server")
      .then(({ sendTelegramMessage, formatLeadMessage }) =>
        sendTelegramMessage(formatLeadMessage({ ...data, source: "Form web" })),
      )
      .catch((err) => console.error("telegram notify failed", err));
    return { ok: true };
  });

async function assertAdmin(ctx: any) {
  return assertPermission(ctx, "leads.manage");
}

export const listConsultations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("consultations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return { items: data ?? [] };
  });

/** Ẩn / bỏ ẩn một lead khỏi danh sách chính. */
export const setConsultationHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        hidden: z.boolean(),
        reason: z.string().trim().max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("consultations")
      .update(
        data.hidden
          ? {
              is_hidden: true,
              hidden_at: new Date().toISOString(),
              hidden_by: context.userId,
              hidden_reason: data.reason || null,
            }
          : { is_hidden: false, hidden_at: null, hidden_by: null, hidden_reason: null },
      )
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Xoá hẳn một lead (chỉ khi chưa sinh hồ sơ học viên). */
export const deleteConsultation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("consultations")
      .select("student_profile_id")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.student_profile_id)
      throw new Error(
        "Lead này đã sinh hồ sơ học viên nên không thể xoá. Hãy dùng chức năng Ẩn.",
      );
    const { error } = await supabaseAdmin.from("consultations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });


export const updateConsultationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(LEAD_STATUSES),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context, "leads.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("consultations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    // Đọc lại để trả về student_profile_id nếu trigger vừa tạo hồ sơ
    const { data: row } = await supabaseAdmin
      .from("consultations")
      .select("student_profile_id")
      .eq("id", data.id)
      .maybeSingle();
    return { ok: true, student_profile_id: row?.student_profile_id ?? null };
  });
