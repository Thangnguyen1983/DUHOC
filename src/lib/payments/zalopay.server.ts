import type { CheckoutInput, CheckoutResult, VerifyResult } from "./types";
import { createHmac, timingSafeEqual } from "node:crypto";
import { loadPaymentConfig, require3 } from "./config.server";

export async function zalopayCreateCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const c = await loadPaymentConfig();
  require3(c, ["ZALOPAY_APP_ID", "ZALOPAY_KEY1", "ZALOPAY_KEY2"], "ZaloPay");
  const endpoint = c.ZALOPAY_ENDPOINT || "https://openapi.zalopay.vn/v2/create";

  const appTransId = `${new Date().toISOString().slice(2, 10).replace(/-/g, "")}_${input.orderNo}`;
  const appTime = Date.now();
  const embedData = JSON.stringify({ redirecturl: input.returnUrl, orderNo: input.orderNo });
  const items = JSON.stringify([{ name: input.description, amount: input.amountVnd, quantity: 1 }]);
  const amount = input.amountVnd;
  const appUser = input.customerEmail ?? "guest";

  const macData = `${c.ZALOPAY_APP_ID}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${items}`;
  const mac = createHmac("sha256", c.ZALOPAY_KEY1).update(macData).digest("hex");

  const body = new URLSearchParams({
    app_id: c.ZALOPAY_APP_ID, app_user: appUser, app_trans_id: appTransId, app_time: String(appTime),
    amount: String(amount), item: items, embed_data: embedData,
    description: input.description, bank_code: "", callback_url: input.ipnUrl, mac,
  });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (Number(json.return_code ?? 0) !== 1) throw new Error(`ZaloPay lỗi: ${json.return_message ?? "unknown"}`);
  return { redirectUrl: String(json.order_url ?? ""), providerRef: appTransId, raw: json };
}

export async function zalopayVerifyCallback(payload: Record<string, unknown>): Promise<VerifyResult> {
  const c = await loadPaymentConfig();
  if (!c.ZALOPAY_KEY2) return { ok: false, status: "failed", raw: payload };
  const data = String(payload.data ?? "");
  const mac = String(payload.mac ?? "");
  const expected = createHmac("sha256", c.ZALOPAY_KEY2).update(data).digest("hex");
  const ok = !!mac && mac.length === expected.length && timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  let parsed: any = {};
  try { parsed = JSON.parse(data); } catch { /* noop */ }
  let embed: any = {};
  try { embed = JSON.parse(parsed.embed_data ?? "{}"); } catch { /* noop */ }
  const status: VerifyResult["status"] = ok ? "paid" : "failed";
  return {
    ok, status,
    orderNo: String(embed.orderNo ?? ""),
    providerRef: String(parsed.app_trans_id ?? ""),
    amountVnd: Number(parsed.amount ?? 0),
    raw: { payload, parsed, embed },
  };
}
