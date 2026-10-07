// Server-only loader: đọc cấu hình cổng thanh toán từ bảng
// public.payment_settings (admin-managed). Fallback về process.env nếu
// khoá chưa được cấu hình trong DB.

export type PaymentConfig = Record<string, string>;

let cache: { at: number; data: PaymentConfig } | null = null;
const TTL_MS = 30_000;

export async function loadPaymentConfig(force = false): Promise<PaymentConfig> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("payment_settings").select("key, value");
  if (error) throw new Error(`Không đọc được payment_settings: ${error.message}`);
  const out: PaymentConfig = {};
  for (const row of data ?? []) {
    if (row.value && String(row.value).trim() !== "") out[row.key] = String(row.value);
  }
  // env fallback cho các key còn thiếu (giúp không breaking khi mới migrate)
  for (const k of Object.keys(process.env)) {
    if (!(k in out) && process.env[k]) out[k] = String(process.env[k]);
  }
  cache = { at: Date.now(), data: out };
  return out;
}

export function invalidatePaymentConfigCache() { cache = null; }

export function require3(cfg: PaymentConfig, keys: string[], providerLabel: string): void {
  const missing = keys.filter((k) => !cfg[k]);
  if (missing.length) throw new Error(`${providerLabel} chưa cấu hình: thiếu ${missing.join(", ")}. Vào Admin → Cài đặt → Thanh toán để nhập.`);
}
