import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAccess } from "@/lib/rbac/guard";
import { readHrConfig, qrCodeFor, clientIp } from "./hr-config.server";

const schema = z.object({
  annual_leave_days: z.number().min(0).max(60),
  late_after: z.string().regex(/^\d{2}:\d{2}$/),
  standard_days: z.number().min(1).max(31),
  insurance: z.object({
    auto: z.boolean(), bhxh: z.number().min(0).max(50), bhyt: z.number().min(0).max(50), bhtn: z.number().min(0).max(50),
    base: z.enum(["base_salary", "base_plus_allowance"]), cap: z.number().min(0),
  }),
  tax: z.object({
    auto: z.boolean(), personal_deduction: z.number().min(0), dependent_deduction: z.number().min(0),
    brackets: z.array(z.object({ upTo: z.number().positive().nullable(), rate: z.number().min(0).max(100) })).min(1).max(10),
  }),
  attendance: z.object({
    methods: z.object({ gps: z.boolean(), wifi: z.boolean(), qr: z.boolean(), photo: z.boolean() }),
    match: z.enum(["any", "all"]),
    offices: z.array(z.object({ name: z.string().min(1).max(100), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), radius: z.number().min(10).max(5000) })).max(20),
    allowed_ips: z.array(z.string().min(3).max(64)).max(30),
    qr_secret: z.string().max(100),
    qr_minutes: z.number().int().min(1).max(60),
  }),
});

export const getHrConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getAccess(context);
    const cfg = await readHrConfig();
    const canManage = access.isAdmin || access.can("hr.manage");
    if (!canManage) cfg.attendance.qr_secret = "";
    return { config: cfg, canManage, myIp: clientIp() };
  });

export const saveHrConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const access = await getAccess(context);
    if (!access.isAdmin && !access.can("hr.manage")) throw new Error("Bạn không có quyền sửa cấu hình nhân sự");
    if (data.attendance.methods.gps && !data.attendance.offices.length) throw new Error("Bật chấm công định vị cần ít nhất một văn phòng");
    if (data.attendance.methods.wifi && !data.attendance.allowed_ips.length) throw new Error("Bật chấm công wifi cần ít nhất một địa chỉ mạng văn phòng");
    if (data.attendance.methods.qr && !data.attendance.qr_secret) data.attendance.qr_secret = crypto.randomUUID();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("site_settings")
      .upsert({ id: true, hr_config: data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Mã QR hiện tại cho màn hình đặt ở văn phòng. */
export const currentAttendanceQr = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getAccess(context);
    if (!access.isAdmin && !access.can("hr.manage")) throw new Error("Bạn không có quyền hiển thị mã QR chấm công");
    const cfg = await readHrConfig();
    if (!cfg.attendance.qr_secret) throw new Error("Chưa bật chấm công QR — hãy bật và lưu cấu hình trước");
    const minutes = cfg.attendance.qr_minutes;
    const code = await qrCodeFor(cfg.attendance.qr_secret, minutes);
    const slotMs = minutes * 60000;
    return { code, expiresInMs: slotMs - (Date.now() % slotMs) };
  });
