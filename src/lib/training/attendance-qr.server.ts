/**
 * Ký/xác thực mã QR điểm danh.
 * Token đổi mỗi WINDOW_SECONDS giây, chỉ hợp lệ ở cửa sổ hiện tại hoặc liền trước.
 */
import { createHmac, timingSafeEqual } from "crypto";

export const WINDOW_SECONDS = 30;

function sign(secret: string, qrSessionId: string, win: number) {
  return createHmac("sha256", secret).update(`${qrSessionId}.${win}`).digest("base64url").slice(0, 24);
}

export function currentWindow(now = Date.now()) {
  return Math.floor(now / 1000 / WINDOW_SECONDS);
}

export function makeToken(secret: string, qrSessionId: string, now = Date.now()) {
  const win = currentWindow(now);
  return {
    token: `${qrSessionId}.${win}.${sign(secret, qrSessionId, win)}`,
    expires_in: WINDOW_SECONDS - Math.floor((now / 1000) % WINDOW_SECONDS),
    window_seconds: WINDOW_SECONDS,
  };
}

export function parseToken(token: string): { qrSessionId: string; win: number; sig: string } | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  const win = Number(parts[1]);
  if (!Number.isFinite(win)) return null;
  return { qrSessionId: parts[0], win, sig: parts[2] };
}

export function verifyToken(secret: string, parsed: { qrSessionId: string; win: number; sig: string }, now = Date.now()) {
  const cur = currentWindow(now);
  if (parsed.win !== cur && parsed.win !== cur - 1) return false;
  const expected = sign(secret, parsed.qrSessionId, parsed.win);
  const a = Buffer.from(expected);
  const b = Buffer.from(parsed.sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function randomSecret() {
  return createHmac("sha256", crypto.randomUUID()).update(crypto.randomUUID()).digest("base64url");
}
