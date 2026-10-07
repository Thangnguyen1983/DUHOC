import { getRequestHeader } from "@tanstack/react-start/server";
import { mergeHrConfig, type HrConfig } from "./hr-config";

export async function readHrConfig(): Promise<HrConfig> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any).from("site_settings").select("hr_config").eq("id", true).maybeSingle();
  return mergeHrConfig(data?.hr_config);
}

/** Mã QR chấm công đổi theo từng khung thời gian. */
export async function qrCodeFor(secret: string, minutes: number, offset = 0) {
  const slot = Math.floor(Date.now() / (Math.max(1, minutes) * 60000)) + offset;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret}:${slot}`));
  return Array.from(new Uint8Array(buf)).slice(0, 5).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function clientIp() {
  const h = getRequestHeader("cf-connecting-ip") || getRequestHeader("x-real-ip") || getRequestHeader("x-forwarded-for") || "";
  return h.split(",")[0].trim();
}
