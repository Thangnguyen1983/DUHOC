import type { CheckoutInput, CheckoutResult, PaymentProvider, VerifyResult } from "./types";
import { pay2sCreateCheckout, pay2sVerifyCallback } from "./pay2s.server";
import { momoCreateCheckout, momoVerifyCallback } from "./momo.server";
import { zalopayCreateCheckout, zalopayVerifyCallback } from "./zalopay.server";
import { manualCreateCheckout } from "./manual.server";
import { loadPaymentConfig } from "./config.server";

export async function createCheckout(provider: PaymentProvider, input: CheckoutInput): Promise<CheckoutResult> {
  switch (provider) {
    case "pay2s": return pay2sCreateCheckout(input);
    case "momo": return momoCreateCheckout(input);
    case "zalopay": return zalopayCreateCheckout(input);
    case "manual": return manualCreateCheckout(input);
  }
}

export async function verifyCallback(provider: PaymentProvider, payload: Record<string, unknown>): Promise<VerifyResult> {
  switch (provider) {
    case "pay2s": return pay2sVerifyCallback(payload);
    case "momo": return momoVerifyCallback(payload);
    case "zalopay": return zalopayVerifyCallback(payload);
    case "manual": return { ok: true, status: "pending", raw: payload };
  }
}

export async function providerAvailability(): Promise<Record<PaymentProvider, boolean>> {
  const c = await loadPaymentConfig();
  return {
    manual: !!c.BANK_ACCOUNT_NO,
    pay2s: !!(c.PAY2S_MERCHANT_ID && c.PAY2S_API_KEY && c.PAY2S_HMAC_SECRET),
    momo: !!(c.MOMO_PARTNER_CODE && c.MOMO_ACCESS_KEY && c.MOMO_SECRET_KEY),
    zalopay: !!(c.ZALOPAY_APP_ID && c.ZALOPAY_KEY1 && c.ZALOPAY_KEY2),
  };
}
