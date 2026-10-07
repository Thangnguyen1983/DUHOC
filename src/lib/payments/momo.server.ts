import type { CheckoutInput, CheckoutResult, VerifyResult } from "./types";
import { createHmac, timingSafeEqual } from "node:crypto";
import { loadPaymentConfig, require3 } from "./config.server";

export async function momoCreateCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const c = await loadPaymentConfig();
  require3(c, ["MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY"], "MoMo");
  const endpoint = c.MOMO_ENDPOINT || "https://payment.momo.vn/v2/gateway/api/create";

  const requestId = `${input.orderNo}-${Date.now()}`;
  const orderId = input.orderNo;
  const amount = String(input.amountVnd);
  const orderInfo = input.description;
  const extraData = "";
  const requestType = "captureWallet";

  const rawSig = `accessKey=${c.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${input.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${c.MOMO_PARTNER_CODE}&redirectUrl=${input.returnUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = createHmac("sha256", c.MOMO_SECRET_KEY).update(rawSig).digest("hex");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partnerCode: c.MOMO_PARTNER_CODE, accessKey: c.MOMO_ACCESS_KEY,
      requestId, amount, orderId, orderInfo,
      redirectUrl: input.returnUrl, ipnUrl: input.ipnUrl,
      extraData, requestType, signature, lang: "vi",
    }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (Number(json.resultCode ?? -1) !== 0) throw new Error(`MoMo lỗi: ${json.message ?? "unknown"}`);
  return { redirectUrl: String(json.payUrl ?? ""), providerRef: String(json.requestId ?? ""), raw: json };
}

export async function momoVerifyCallback(payload: Record<string, unknown>): Promise<VerifyResult> {
  const c = await loadPaymentConfig();
  if (!c.MOMO_SECRET_KEY) return { ok: false, status: "failed", raw: payload };
  const p = payload as any;
  const rawSig = `accessKey=${c.MOMO_ACCESS_KEY}&amount=${p.amount}&extraData=${p.extraData}&message=${p.message}&orderId=${p.orderId}&orderInfo=${p.orderInfo}&orderType=${p.orderType}&partnerCode=${p.partnerCode}&payType=${p.payType}&requestId=${p.requestId}&responseTime=${p.responseTime}&resultCode=${p.resultCode}&transId=${p.transId}`;
  const expected = createHmac("sha256", c.MOMO_SECRET_KEY).update(rawSig).digest("hex");
  const sig = String(p.signature ?? "");
  const ok = !!sig && sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  const status: VerifyResult["status"] = Number(p.resultCode) === 0 ? "paid" : Number(p.resultCode) === 9000 ? "pending" : "failed";
  return { ok, status, orderNo: String(p.orderId ?? ""), providerRef: String(p.transId ?? ""), amountVnd: Number(p.amount ?? 0), raw: payload };
}
