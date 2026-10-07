import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAccess, type AccessCtx } from "@/lib/rbac/guard";
import { studentDepartmentAccess } from "@/lib/students/department-access.server";
import { calcInsurance, calcTax, distanceMeters, type HrConfig } from "./hr-config";
import { readHrConfig, qrCodeFor, clientIp } from "./hr-config.server";

/**
 * Phân hệ Nhân sự: danh sách nhân sự, hợp đồng, nghỉ phép, chấm công, KPI, lương.
 * Ghi qua quyền máy chủ sau khi kiểm quyền + phạm vi phòng ban.
 * Người có hr.manage xem toàn bộ; người chỉ có hr.view/leave.approve xem nhân sự thuộc phòng mình phụ trách.
 */

const period = z.string().regex(/^\d{4}-\d{2}$/);

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function vnDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);
}

function periodRange(p: string) {
  const [y, m] = p.split("-").map(Number);
  const start = `${p}-01`;
  const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return { start, end };
}

/** Phạm vi nhân sự người dùng được xem: null = toàn bộ. */
async function hrScope(ctx: AccessCtx, ...perms: Parameters<Awaited<ReturnType<typeof getAccess>>["can"]>) {
  const access = await getAccess(ctx);
  if (!access.can(...perms)) throw new Error("Bạn không có quyền thực hiện thao tác này");
  if (access.isAdmin || access.can("hr.manage")) return { all: true, userIds: null as string[] | null, access };
  const dep = await studentDepartmentAccess(ctx);
  if (dep.all) return { all: true, userIds: null, access };
  const db = await admin();
  const { data } = dep.readable.length
    ? await db.from("staff_profiles").select("user_id").in("department_id", dep.readable)
    : { data: [] };
  return { all: false, userIds: (data ?? []).map((r: any) => r.user_id as string), access };
}

function inScope(scope: { all: boolean; userIds: string[] | null }, userId: string) {
  return scope.all || (scope.userIds ?? []).includes(userId);
}

async function peopleMap(ids: string[]) {
  const db = await admin();
  const map = new Map<string, { name: string; email: string }>();
  if (!ids.length) return map;
  const { data: profiles } = await db.from("profiles").select("id, full_name").in("id", ids);
  for (const p of profiles ?? []) map.set(p.id, { name: p.full_name ?? "", email: "" });
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of list?.users ?? []) {
    if (!ids.includes(u.id)) continue;
    const cur = map.get(u.id) ?? { name: "", email: "" };
    map.set(u.id, { name: cur.name || (u.user_metadata?.full_name as string) || u.email || "", email: u.email ?? "" });
  }
  return map;
}

/* ───────────────────────── Danh sách nhân sự ───────────────────────── */

export const listHrStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const scope = await hrScope(context, "hr.view", "leave.approve");
    const db = await admin();
    const [{ data: roles }, { data: staff }, { data: deps }, { data: titles }, { data: contracts }] = await Promise.all([
      db.from("user_roles").select("user_id, role").neq("role", "student"),
      db.from("staff_profiles").select("user_id, staff_code, department_id, job_title_id, phone"),
      db.from("catalog_departments").select("id, code, name, is_active, sort_order").order("sort_order"),
      db.from("catalog_job_titles").select("id, code, name, is_active, sort_order").order("sort_order"),
      db.from("staff_contracts").select("user_id, contract_type, end_date, status").eq("status", "active"),
    ]);
    const ids = new Set<string>();
    (roles ?? []).forEach((r: any) => ids.add(r.user_id));
    (staff ?? []).forEach((s: any) => ids.add(s.user_id));
    let userIds = [...ids];
    if (!scope.all) userIds = userIds.filter((id) => inScope(scope, id));
    const people = await peopleMap(userIds);
    const staffBy = new Map((staff ?? []).map((s: any) => [s.user_id, s]));
    const rows = userIds.map((id) => {
      const s: any = staffBy.get(id) ?? {};
      const c = (contracts ?? []).filter((x: any) => x.user_id === id)
        .sort((a: any, b: any) => String(b.end_date ?? "9999").localeCompare(String(a.end_date ?? "9999")))[0];
      return {
        user_id: id,
        name: people.get(id)?.name ?? "",
        email: people.get(id)?.email ?? "",
        staff_code: s.staff_code ?? null,
        department_id: s.department_id ?? null,
        job_title_id: s.job_title_id ?? null,
        phone: s.phone ?? null,
        roles: (roles ?? []).filter((r: any) => r.user_id === id).map((r: any) => r.role as string),
        contract_type: c?.contract_type ?? null,
        contract_end: c?.end_date ?? null,
      };
    }).sort((a, b) => a.name.localeCompare(b.name, "vi"));
    const count = (key: "department_id" | "job_title_id", id: string) => rows.filter((r) => r[key] === id).length;
    return {
      canManage: scope.access.can("hr.manage"),
      rows,
      departments: (deps ?? []).map((d: any) => ({ ...d, staff_count: count("department_id", d.id) })),
      jobTitles: (titles ?? []).map((t: any) => ({ ...t, staff_count: count("job_title_id", t.id) })),
    };
  });

export const listCollaborators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await hrScope(context, "hr.view", "commissions.view");
    const db = await admin();
    const [{ data: agents }, { data: comms }, { data: students }] = await Promise.all([
      db.from("sales_agents").select("id, user_id, display_name, collaborator_code, markets, is_active").not("collaborator_code", "is", null),
      db.from("collaborator_commissions").select("collaborator_id, commission_amount, status"),
      db.from("student_profiles").select("collaborator_id").not("collaborator_id", "is", null),
    ]);
    const people = await peopleMap((agents ?? []).map((a: any) => a.user_id));
    return (agents ?? []).map((a: any) => {
      const mine = (comms ?? []).filter((c: any) => c.collaborator_id === a.id && c.status !== "cancelled");
      return {
        id: a.id,
        code: a.collaborator_code as string,
        name: a.display_name || people.get(a.user_id)?.name || "",
        email: people.get(a.user_id)?.email ?? "",
        markets: (a.markets ?? []) as string[],
        is_active: a.is_active as boolean,
        referred: (students ?? []).filter((s: any) => s.collaborator_id === a.id).length,
        total: mine.reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0),
        paid: mine.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0),
      };
    });
  });

/* ───────────────────────── Hợp đồng ───────────────────────── */

export const listContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const scope = await hrScope(context, "hr.view");
    const db = await admin();
    const { data, error } = await db.from("staff_contracts").select("*").order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []).filter((r: any) => inScope(scope, r.user_id));
    const people = await peopleMap([...new Set<string>(rows.map((r: any) => r.user_id))]);
    return rows.map((r: any) => ({ ...r, name: people.get(r.user_id)?.name ?? "" }));
  });

const contractSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  contract_no: z.string().trim().min(1).max(60),
  contract_type: z.enum(["probation", "fixed_term", "indefinite", "collaborator"]),
  start_date: z.string().min(10),
  end_date: z.string().nullable().optional(),
  base_salary: z.number().min(0),
  allowance: z.number().min(0),
  file_url: z.string().max(1000).nullable().optional(),
  status: z.enum(["active", "ended"]),
  note: z.string().max(1000).nullable().optional(),
});

export const upsertContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => contractSchema.parse(d))
  .handler(async ({ data, context }) => {
    await hrScope(context, "hr.manage");
    if (data.end_date && data.end_date < data.start_date) throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
    const db = await admin();
    const payload = { ...data, end_date: data.end_date || null, file_url: data.file_url || null, note: data.note || null };
    const q = data.id
      ? db.from("staff_contracts").update(payload).eq("id", data.id)
      : db.from("staff_contracts").insert({ ...payload, created_by: context.userId });
    const { error } = await q;
    if (error) throw new Error(error.code === "23505" ? "Số hợp đồng đã tồn tại" : error.message);
    return { ok: true };
  });

export const deleteContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await hrScope(context, "hr.manage");
    const { error } = await (await admin()).from("staff_contracts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────────────────────── Nghỉ phép ───────────────────────── */

export const listLeaveRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ status: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const scope = await hrScope(context, "hr.view", "leave.approve");
    const db = await admin();
    let q = db.from("leave_requests").select("*").order("created_at", { ascending: false }).limit(500);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const list = (rows ?? []).filter((r: any) => inScope(scope, r.user_id));
    const people = await peopleMap([...new Set<string>(list.map((r: any) => r.user_id))]);
    return {
      canApprove: scope.access.can("leave.approve"),
      rows: list.map((r: any) => ({ ...r, name: people.get(r.user_id)?.name ?? "" })),
    };
  });

export const reviewLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const scope = await hrScope(context, "leave.approve");
    const db = await admin();
    const { data: row } = await db.from("leave_requests").select("user_id, status").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Không tìm thấy đơn nghỉ");
    if (!inScope(scope, row.user_id)) throw new Error("Đơn này không thuộc phòng ban bạn phụ trách");
    if (row.user_id === context.userId) throw new Error("Không tự duyệt đơn của chính mình");
    if (row.status !== "pending") throw new Error("Đơn đã được xử lý");
    const { error } = await db.from("leave_requests").update({
      status: data.approve ? "approved" : "rejected",
      reviewed_by: context.userId, reviewed_at: new Date().toISOString(), review_note: data.note || null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await db.from("notifications").insert({
      user_id: row.user_id,
      type: "hr",
      title: data.approve ? "Đơn nghỉ phép đã được duyệt" : "Đơn nghỉ phép bị từ chối",
      body: data.note || "",
      link: "/admin/ca-nhan",
    }).then(() => undefined, () => undefined);
    return { ok: true };
  });

/* ───────────────────────── Chấm công ───────────────────────── */

export const attendanceMonth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ period }).parse(d))
  .handler(async ({ data, context }) => {
    const scope = await hrScope(context, "hr.view");
    const { start, end } = periodRange(data.period);
    const db = await admin();
    const [{ data: days }, { data: leaves }] = await Promise.all([
      db.from("attendance_days").select("*").gte("work_date", start).lte("work_date", end),
      db.from("leave_requests").select("user_id, days, leave_type").eq("status", "approved").gte("start_date", start).lte("start_date", end),
    ]);
    const rows = (days ?? []).filter((r: any) => inScope(scope, r.user_id));
    const ids = [...new Set<string>([...rows.map((r: any) => r.user_id), ...(leaves ?? []).filter((l: any) => inScope(scope, l.user_id)).map((l: any) => l.user_id)])];
    const people = await peopleMap(ids);
    const summary = ids.map((id) => {
      const mine = rows.filter((r: any) => r.user_id === id);
      const present = mine.filter((r: any) => r.status === "present").length + mine.filter((r: any) => r.status === "half").length * 0.5;
      const paidLeave = (leaves ?? []).filter((l: any) => l.user_id === id && l.leave_type !== "unpaid").reduce((s: number, l: any) => s + Number(l.days), 0);
      return { user_id: id, name: people.get(id)?.name ?? "", present, paid_leave: paidLeave, late: mine.filter((r: any) => r.status === "late").length, work_days: present + paidLeave + mine.filter((r: any) => r.status === "late").length };
    }).sort((a, b) => a.name.localeCompare(b.name, "vi"));
    return { canManage: scope.access.can("hr.manage"), summary, days: rows.map((r: any) => ({ ...r, name: people.get(r.user_id)?.name ?? "" })) };
  });

export const upsertAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    user_id: z.string().uuid(), work_date: z.string().min(10),
    status: z.enum(["present", "late", "half", "absent"]), note: z.string().trim().min(3, "Ghi lý do chỉnh sửa").max(500),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await hrScope(context, "hr.manage");
    const { error } = await (await admin()).from("attendance_days").upsert(
      { ...data, edited_by: context.userId }, { onConflict: "user_id,work_date" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────────────────────── KPI ───────────────────────── */

async function leadsDone(userId: string, p: string) {
  const { start, end } = periodRange(p);
  const db = await admin();
  const { count } = await db.from("consultations").select("id", { count: "exact", head: true })
    .eq("assigned_to", userId).in("status", ["done", "converted"])
    .gte("created_at", `${start}T00:00:00+07:00`).lte("created_at", `${end}T23:59:59+07:00`);
  return count ?? 0;
}

export const listKpi = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ period }).parse(d))
  .handler(async ({ data, context }) => {
    const scope = await hrScope(context, "hr.view");
    const db = await admin();
    const { data: rows } = await db.from("kpi_targets").select("*").eq("period", data.period).order("created_at");
    const list = (rows ?? []).filter((r: any) => inScope(scope, r.user_id));
    for (const r of list) if (r.auto_source === "leads_done") r.actual = await leadsDone(r.user_id, data.period);
    const people = await peopleMap([...new Set<string>(list.map((r: any) => r.user_id))]);
    return { canManage: scope.access.can("hr.manage"), rows: list.map((r: any) => ({ ...r, name: people.get(r.user_id)?.name ?? "" })) };
  });

export const upsertKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(), user_id: z.string().uuid(), period, metric: z.string().trim().min(1).max(200),
    target: z.number().min(0), actual: z.number().min(0), auto_source: z.enum(["leads_done"]).nullable(), bonus_amount: z.number().min(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await hrScope(context, "hr.manage");
    const db = await admin();
    const { error } = data.id
      ? await db.from("kpi_targets").update(data).eq("id", data.id)
      : await db.from("kpi_targets").insert(data);
    if (error) throw new Error(error.code === "23505" ? "Chỉ tiêu này đã có trong tháng" : error.message);
    return { ok: true };
  });

export const deleteKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await hrScope(context, "hr.manage");
    await (await admin()).from("kpi_targets").delete().eq("id", data.id);
    return { ok: true };
  });

/* ───────────────────────── Lương ───────────────────────── */

function calcNet(r: any) {
  const std = Number(r.standard_days) || 26;
  const base = (Number(r.base_salary) * Math.min(Number(r.work_days), std)) / std;
  return Math.round(base + Number(r.allowance) + Number(r.kpi_bonus) + Number(r.other_bonus)
    - Number(r.insurance) - Number(r.tax) - Number(r.deductions));
}

/** Tự tính bảo hiểm + thuế TNCN theo cấu hình (nếu bật), trả về dòng đã cập nhật. */
function applyDeductions(r: any, cfg: HrConfig) {
  const std = Number(r.standard_days) || cfg.standard_days;
  const gross = Math.round((Number(r.base_salary) * Math.min(Number(r.work_days), std)) / std
    + Number(r.allowance) + Number(r.kpi_bonus) + Number(r.other_bonus));
  const out = { ...r, gross_pay: gross };
  if (cfg.insurance.auto) out.insurance = calcInsurance(cfg, Number(r.base_salary), Number(r.allowance));
  if (cfg.tax.auto) out.tax = calcTax(cfg, gross, Number(out.insurance), Number(r.dependents) || 0);
  out.net_pay = calcNet(out);
  return out;
}

export const listPayroll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ period }).parse(d))
  .handler(async ({ data, context }) => {
    const access = await getAccess(context);
    if (!access.can("payroll.view")) throw new Error("Bạn không có quyền xem bảng lương");
    const db = await admin();
    const { data: rows } = await db.from("payroll_items").select("*").eq("period", data.period);
    const people = await peopleMap((rows ?? []).map((r: any) => r.user_id));
    return {
      canManage: access.can("payroll.manage"),
      rows: (rows ?? []).map((r: any) => ({ ...r, name: people.get(r.user_id)?.name ?? "" }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name, "vi")),
    };
  });

export const generatePayroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ period }).parse(d))
  .handler(async ({ data, context }) => {
    const cfg = await readHrConfig();
    const access = await getAccess(context);
    if (!access.can("payroll.manage")) throw new Error("Bạn không có quyền lập bảng lương");
    const { start, end } = periodRange(data.period);
    const db = await admin();
    const [{ data: contracts }, { data: days }, { data: leaves }, { data: kpis }, { data: existing }] = await Promise.all([
      db.from("staff_contracts").select("*").eq("status", "active").lte("start_date", end),
      db.from("attendance_days").select("user_id, status").gte("work_date", start).lte("work_date", end),
      db.from("leave_requests").select("user_id, days, leave_type").eq("status", "approved").gte("start_date", start).lte("start_date", end),
      db.from("kpi_targets").select("*").eq("period", data.period),
      db.from("payroll_items").select("*").eq("period", data.period),
    ]);
    const active = (contracts ?? []).filter((c: any) => !c.end_date || c.end_date >= start);
    let created = 0, updated = 0, locked = 0;
    for (const c of active) {
      const old = (existing ?? []).find((e: any) => e.user_id === c.user_id);
      if (old?.status === "approved") { locked++; continue; }
      const mine = (days ?? []).filter((d: any) => d.user_id === c.user_id);
      const work = mine.filter((d: any) => d.status === "present" || d.status === "late").length
        + mine.filter((d: any) => d.status === "half").length * 0.5
        + (leaves ?? []).filter((l: any) => l.user_id === c.user_id && l.leave_type !== "unpaid").reduce((s: number, l: any) => s + Number(l.days), 0);
      let kpiBonus = 0;
      for (const k of (kpis ?? []).filter((k: any) => k.user_id === c.user_id)) {
        const actual = k.auto_source === "leads_done" ? await leadsDone(k.user_id, data.period) : Number(k.actual);
        if (Number(k.target) > 0 && actual >= Number(k.target)) kpiBonus += Number(k.bonus_amount);
      }
      const row = {
        user_id: c.user_id, period: data.period,
        standard_days: old?.standard_days ?? cfg.standard_days, work_days: work,
        base_salary: Number(c.base_salary), allowance: Number(c.allowance), kpi_bonus: kpiBonus,
        other_bonus: old?.other_bonus ?? 0, insurance: old?.insurance ?? 0, tax: old?.tax ?? 0, deductions: old?.deductions ?? 0,
        dependents: old?.dependents ?? 0,
        note: old?.note ?? null, status: "draft",
      };
      const { error } = await db.from("payroll_items").upsert(applyDeductions(row, cfg), { onConflict: "user_id,period" });
      if (error) throw new Error(error.message);
      old ? updated++ : created++;
    }
    return { created, updated, locked };
  });

export const updatePayrollItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(), standard_days: z.number().min(1).max(31), work_days: z.number().min(0).max(31),
    other_bonus: z.number().min(0), insurance: z.number().min(0), tax: z.number().min(0), deductions: z.number().min(0),
    dependents: z.number().int().min(0).max(20).optional(),
    note: z.string().max(500).nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const access = await getAccess(context);
    if (!access.can("payroll.manage")) throw new Error("Bạn không có quyền sửa bảng lương");
    const db = await admin();
    const { data: row } = await db.from("payroll_items").select("*").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Không tìm thấy phiếu lương");
    if (row.status === "approved") throw new Error("Bảng lương đã khoá, không sửa được");
    const cfg = await readHrConfig();
    const next = applyDeductions({ ...row, ...data }, cfg);
    const { id: _id, ...patch } = data;
    const { error } = await db.from("payroll_items").update({
      ...patch, insurance: next.insurance, tax: next.tax, gross_pay: next.gross_pay, net_pay: next.net_pay,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approvePayroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ period }).parse(d))
  .handler(async ({ data, context }) => {
    const access = await getAccess(context);
    if (!access.isAdmin) throw new Error("Chỉ Ban Giám đốc (quản trị viên) được duyệt và khoá bảng lương");
    const { error, count } = await (await admin()).from("payroll_items")
      .update({ status: "approved", approved_by: context.userId, approved_at: new Date().toISOString() }, { count: "exact" })
      .eq("period", data.period).eq("status", "draft");
    if (error) throw new Error(error.message);
    return { approved: count ?? 0 };
  });

/* ───────────────────────── Cá nhân (tự phục vụ) ───────────────────────── */

export const getMyHr = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const uid = context.userId;
    const today = vnDate();
    const year = Number(today.slice(0, 4));
    const p = today.slice(0, 7);
    const { start, end } = periodRange(p);
    const [{ data: contracts }, { data: leaves }, { data: bal }, { data: todayRow }, { data: monthDays }, { data: slips }, { data: kpis }, { data: staff }] = await Promise.all([
      db.from("staff_contracts").select("contract_no, contract_type, start_date, end_date, status").eq("user_id", uid).order("start_date", { ascending: false }),
      db.from("leave_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50),
      db.from("leave_balances").select("annual_days").eq("user_id", uid).eq("year", year).maybeSingle(),
      db.from("attendance_days").select("*").eq("user_id", uid).eq("work_date", today).maybeSingle(),
      db.from("attendance_days").select("work_date, status, check_in, check_out").eq("user_id", uid).gte("work_date", start).lte("work_date", end).order("work_date"),
      db.from("payroll_items").select("*").eq("user_id", uid).eq("status", "approved").order("period", { ascending: false }).limit(12),
      db.from("kpi_targets").select("*").eq("user_id", uid).eq("period", p),
      db.from("staff_profiles").select("staff_code").eq("user_id", uid).maybeSingle(),
    ]);
    for (const k of kpis ?? []) if (k.auto_source === "leads_done") k.actual = await leadsDone(uid, p);
    const used = (leaves ?? []).filter((l: any) => l.status === "approved" && l.leave_type === "annual" && String(l.start_date).startsWith(String(year)))
      .reduce((s: number, l: any) => s + Number(l.days), 0);
    const cfg = await readHrConfig();
    const total = Number(bal?.annual_days ?? cfg.annual_leave_days);
    return {
      today, staffCode: staff?.staff_code ?? null,
      contracts: contracts ?? [], leaves: leaves ?? [],
      leave: { total, used, remaining: total - used },
      todayRow: todayRow ?? null, monthDays: monthDays ?? [], slips: slips ?? [], kpis: kpis ?? [],
      attendanceRules: { lateAfter: cfg.late_after, methods: cfg.attendance.methods, match: cfg.attendance.match },
    };
  });

export const checkInOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    action: z.enum(["in", "out"]),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    accuracy: z.number().optional(),
    qr: z.string().max(32).optional(),
    photo: z.string().max(2_000_000).optional(), // data URL jpeg
  }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const cfg = await readHrConfig();
    const att = cfg.attendance;
    const today = vnDate();
    const now = new Date();

    // ── Kiểm tra phương thức chấm công ──
    const checks: Array<{ method: string; ok: boolean; reason: string }> = [];
    const meta: Record<string, unknown> = {};
    if (att.methods.gps) {
      if (data.lat == null || data.lng == null) checks.push({ method: "gps", ok: false, reason: "Chưa lấy được vị trí — hãy cho phép trình duyệt truy cập vị trí" });
      else {
        const near = att.offices.map((o) => ({ o, d: Math.round(distanceMeters({ lat: data.lat!, lng: data.lng! }, o)) })).sort((a, b) => a.d - b.d)[0];
        const ok = !!near && near.d <= near.o.radius;
        meta.gps = { lat: data.lat, lng: data.lng, accuracy: data.accuracy, office: near?.o.name, distance: near?.d };
        checks.push({ method: "gps", ok, reason: ok ? "" : `Bạn đang cách ${near?.o.name ?? "văn phòng"} khoảng ${near?.d ?? "?"} m (cho phép ${near?.o.radius ?? 0} m)` });
      }
    }
    if (att.methods.wifi) {
      const ip = clientIp();
      const ok = !!ip && att.allowed_ips.some((p) => ip === p || (p.endsWith("*") && ip.startsWith(p.slice(0, -1))));
      meta.wifi = { ip };
      checks.push({ method: "wifi", ok, reason: ok ? "" : "Bạn chưa kết nối wifi văn phòng" });
    }
    if (att.methods.qr) {
      const code = (data.qr ?? "").trim().toUpperCase();
      const valid = !!code && !!att.qr_secret && (code === await qrCodeFor(att.qr_secret, att.qr_minutes) || code === await qrCodeFor(att.qr_secret, att.qr_minutes, -1));
      meta.qr = { ok: valid };
      checks.push({ method: "qr", ok: valid, reason: valid ? "" : "Mã QR không đúng hoặc đã hết hạn — quét lại mã tại văn phòng" });
    }
    let photoPath: string | null = null;
    if (att.methods.photo) {
      const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(data.photo ?? "");
      if (!m) checks.push({ method: "photo", ok: false, reason: "Cần chụp ảnh khuôn mặt khi chấm công" });
      else {
        const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        photoPath = `${context.userId}/${today}-${data.action}-${now.getTime()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
        const { error } = await db.storage.from("attendance-photos").upload(photoPath, bytes, { contentType: `image/${m[1]}` });
        if (error) throw new Error("Không lưu được ảnh: " + error.message);
        meta.photo = photoPath;
        checks.push({ method: "photo", ok: true, reason: "" });
      }
    }
    if (checks.length) {
      const passed = att.match === "any" ? checks.some((c) => c.ok) : checks.every((c) => c.ok);
      if (!passed) throw new Error(checks.filter((c) => !c.ok).map((c) => c.reason).join(". "));
    }
    const method = checks.filter((c) => c.ok).map((c) => c.method).join("+") || "button";

    const { data: row } = await db.from("attendance_days").select("*").eq("user_id", context.userId).eq("work_date", today).maybeSingle();
    if (data.action === "in") {
      if (row?.check_in) throw new Error("Hôm nay bạn đã chấm công vào");
      const hm = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
      const status = hm > cfg.late_after ? "late" : "present";
      const { error } = await db.from("attendance_days").upsert({
        user_id: context.userId, work_date: today, check_in: now.toISOString(), status,
        check_in_method: method, check_in_meta: meta, photo_path: photoPath,
      }, { onConflict: "user_id,work_date" });
      if (error) throw new Error(error.message);
    } else {
      if (!row?.check_in) throw new Error("Bạn chưa chấm công vào hôm nay");
      if (row.check_out) throw new Error("Hôm nay bạn đã chấm công ra");
      const { error } = await db.from("attendance_days").update({ check_out: now.toISOString(), check_out_meta: { ...meta, method } }).eq("id", row.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const submitLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    leave_type: z.enum(["annual", "sick", "unpaid", "personal"]),
    start_date: z.string().min(10), end_date: z.string().min(10),
    days: z.number().min(0.5).max(60), reason: z.string().trim().min(3, "Ghi lý do nghỉ").max(1000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.end_date < data.start_date) throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
    const { error } = await (await admin()).from("leave_requests").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (await admin()).from("leave_requests").update({ status: "cancelled" })
      .eq("id", data.id).eq("user_id", context.userId).eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setLeaveBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid(), year: z.number().int(), annual_days: z.number().min(0).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    await hrScope(context, "hr.manage");
    const { error } = await (await admin()).from("leave_balances").upsert(data, { onConflict: "user_id,year" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
