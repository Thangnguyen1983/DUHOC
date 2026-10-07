import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const KNOWN_KEYS = [
  "PAY2S_MERCHANT_ID", "PAY2S_API_KEY", "PAY2S_HMAC_SECRET", "PAY2S_ENDPOINT",
  "MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY", "MOMO_ENDPOINT",
  "ZALOPAY_APP_ID", "ZALOPAY_KEY1", "ZALOPAY_KEY2", "ZALOPAY_ENDPOINT",
  "BANK_BIN", "BANK_ACCOUNT_NO", "BANK_ACCOUNT_NAME", "BANK_NAME",
] as const;
const SECRET_KEYS = new Set([
  "PAY2S_MERCHANT_ID", "PAY2S_API_KEY", "PAY2S_HMAC_SECRET",
  "MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY",
  "ZALOPAY_APP_ID", "ZALOPAY_KEY1", "ZALOPAY_KEY2",
]);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" as any });
  if (!data) throw new Error("Chỉ admin được truy cập cấu hình thanh toán");
}

/** Trả về map key → { value, is_secret, has_value }. Với secret keys chỉ trả has_value + last4 để không lộ ra client. */
export const getPaymentSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("payment_settings")
      .select("key, value, is_secret, updated_at");
    if (error) throw new Error(error.message);
    return {
      items: (data ?? []).map((r: any) => {
        const isSecret = r.is_secret ?? SECRET_KEYS.has(r.key);
        const has = !!(r.value && String(r.value).trim());
        return {
          key: r.key as string,
          is_secret: isSecret,
          has_value: has,
          // trả rõ với non-secret; masked với secret
          value: isSecret ? (has ? `••••${String(r.value).slice(-4)}` : "") : (r.value ?? ""),
          updated_at: r.updated_at,
        };
      }),
    };
  });

/** Ghi (update or insert) nhiều key một lần. Empty string = giữ nguyên (không xoá). Null = xoá về "". */
export const updatePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entries: { key: string; value: string | null }[] }) =>
    z.object({
      entries: z.array(z.object({
        key: z.enum(KNOWN_KEYS as unknown as [string, ...string[]]),
        value: z.string().max(500).nullable(),
      })).min(1).max(30),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const rows = data.entries
      .filter((e) => e.value !== "") // "" = giữ nguyên
      .map((e) => ({
        key: e.key,
        value: e.value === null ? "" : e.value,
        is_secret: SECRET_KEYS.has(e.key),
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      }));
    if (rows.length === 0) return { ok: true, updated: 0 };
    const { error } = await context.supabase.from("payment_settings")
      .upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    const { invalidatePaymentConfigCache } = await import("@/lib/payments/config.server");
    invalidatePaymentConfigCache();
    return { ok: true, updated: rows.length };
  });

export const testPaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { provider: "pay2s" | "momo" | "zalopay" | "manual" }) =>
    z.object({ provider: z.enum(["pay2s", "momo", "zalopay", "manual"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { providerAvailability } = await import("@/lib/payments/index.server");
    const avail = await providerAvailability();
    return { provider: data.provider, ok: avail[data.provider] };
  });
