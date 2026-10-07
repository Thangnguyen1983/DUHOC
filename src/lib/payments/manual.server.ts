import type { CheckoutInput, CheckoutResult } from "./types";
import { loadPaymentConfig } from "./config.server";

export async function manualBankInfo() {
  const c = await loadPaymentConfig();
  return {
    bankBin: c.BANK_BIN || "970422",
    accountNo: c.BANK_ACCOUNT_NO || "",
    accountName: c.BANK_ACCOUNT_NAME || "CONG TY CP NHAN LUC QUOC TE KAIZEN",
    bankName: c.BANK_NAME || "MB Bank",
  };
}

export async function manualCreateCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const b = await manualBankInfo();
  if (!b.accountNo) {
    return { raw: { warning: "Chưa cấu hình BANK_ACCOUNT_NO — vào Admin → Cài đặt → Thanh toán để nhập." } };
  }
  const addInfo = encodeURIComponent(`KAIZEN ${input.orderNo}`);
  const qrDataUrl = `https://img.vietqr.io/image/${b.bankBin}-${b.accountNo}-compact2.png?amount=${input.amountVnd}&addInfo=${addInfo}&accountName=${encodeURIComponent(b.accountName)}`;
  return { qrDataUrl, providerRef: input.orderNo, raw: { bank: b } };
}
