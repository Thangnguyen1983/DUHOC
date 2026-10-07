import type { CheckoutInput, CheckoutResult, VerifyResult } from "./types";
import { createHmac, timingSafeEqual } from "node:crypto";
import { loadPaymentConfig, require3 } from "./config.server";

function sign(payload: Record<string, unknown>, secret: string): string {
  const raw = Object.keys(payload).sort().map((k) => `${k}=${String(payload[k] ?? "")}`).join("&");
  return createHmac("sha256", secret).update(raw).digest("hex");
}

export async function pay2sCreateCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const c = await loadPaymentConfig();
  require3(c, ["PAY2S_MERCHANT_ID", "PAY2S_API_KEY", "PAY2S_HMAC_SECRET"], "PAY2S");
  const endpoint = c.PAY2S_ENDPOINT || "https://api.pay2s.vn/v2/checkout";

  const body = {
    merchant_id: c.PAY2S_MERCHANT_ID,
    order_no: input.orderNo,
    amount: input.amountVnd,
    currency: "VND",
    description: input.description,
    customer_email: input.customerEmail ?? "",
    customer_name: input.customerName ?? "",
    return_url: input.returnUrl,
    ipn_url: input.ipnUrl,
    ts: Date.now(),
  } as Record<string, unknown>;
  const signature = sign(body, c.PAY2S_HMAC_SECRET);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.PAY2S_API_KEY}` },
    body: JSON.stringify({ ...body, signature }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`PAY2S lỗi ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return {
    redirectUrl: (json.checkout_url as string) ?? (json.data as any)?.checkout_url,
    providerRef: (json.transaction_id as string) ?? (json.data as any)?.transaction_id,
    raw: json,
  };
}

export async function pay2sVerifyCallback(payload: Record<string, unknown>): Promise<VerifyResult> {
  const c = await loadPaymentConfig();
  const { signature, ...rest } = payload as Record<string, unknown> & { signature?: string };
  if (!signature || !c.PAY2S_HMAC_SECRET) return { ok: false, status: "failed", raw: payload };
  const expected = sign(rest, c.PAY2S_HMAC_SECRET);
  const sig = String(signature);
  const ok = sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  const statusRaw = String(payload.status ?? "").toLowerCase();
  const status: VerifyResult["status"] = ["success", "paid", "completed", "1"].includes(statusRaw) ? "paid"
    : ["fail", "failed", "cancel", "cancelled", "0"].includes(statusRaw) ? "failed" : "pending";
  return {
    ok, status,
    orderNo: String(payload.order_no ?? ""),
    providerRef: String(payload.transaction_id ?? ""),
    amountVnd: Number(payload.amount ?? 0),
    raw: payload,
  };
}
