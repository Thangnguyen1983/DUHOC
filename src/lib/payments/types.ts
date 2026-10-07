export type PaymentProvider = "pay2s" | "momo" | "zalopay" | "manual";

export interface CheckoutInput {
  orderId: string;
  orderNo: string;
  amountVnd: number;
  description: string;
  customerEmail?: string | null;
  customerName?: string | null;
  returnUrl: string;
  ipnUrl: string;
}

export interface CheckoutResult {
  redirectUrl?: string;
  qrDataUrl?: string;
  raw?: Record<string, unknown>;
  providerRef?: string;
}

export interface VerifyResult {
  ok: boolean;
  orderNo?: string;
  providerRef?: string;
  amountVnd?: number;
  status: "paid" | "pending" | "failed";
  raw?: Record<string, unknown>;
}
