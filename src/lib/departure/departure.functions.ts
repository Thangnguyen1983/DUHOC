import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";
import { assertStudentDepartment, studentDepartmentAccess, limitToDepartments } from "@/lib/students/department-access.server";

async function scopedStudentIds(ctx: { supabase: any; userId: string }) {
  const scope = await studentDepartmentAccess(ctx);
  if (scope.all) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await limitToDepartments(supabaseAdmin.from("student_profiles").select("id").is("deleted_at", null).limit(10000), scope);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.id);
}

function scopedDepartures(query: any, ids: string[] | null) {
  return ids === null ? query : query.in("student_profile_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
}

async function assertDepartureAccess(ctx: { supabase: any; userId: string }, studentId: string | null | undefined, write = false) {
  if (studentId) return assertStudentDepartment(ctx, studentId, write);
  if (!(await studentDepartmentAccess(ctx)).all) throw new Error("Chỉ quản trị viên được quản lý bản ghi xuất cảnh không liên kết học viên");
}

async function assertExistingDeparture(ctx: { supabase: any; userId: string }, id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("departure_records").select("student_profile_id").eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Không tìm thấy bản ghi xuất cảnh");
  await assertDepartureAccess(ctx, data.student_profile_id, true);
}

/**
 * Quản lý xuất cảnh — danh sách người lao động/học viên xuất cảnh,
 * thống kê, nhập từ file Excel mẫu và xuất file đúng 21 cột của cơ quan.
 * Dữ liệu học viên được kéo từ student_profiles (không tạo hệ mã mới).
 */




async function assertRead(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "departure.view");
}

async function assertWrite(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "departure.edit");
}

const SELECT =
  "*, student_profiles(id, student_code, full_name), departure_batches(id, name)";

const recordSchema = z.object({
  id: z.string().uuid().optional(),
  student_profile_id: z.string().uuid().nullable().optional(),
  batch_id: z.string().uuid().nullable().optional(),
  id_no: z.string().min(6).max(30),
  id_issue_date: z.string().nullable().optional(),
  passport_no: z.string().max(30).nullable().optional(),
  passport_issue_date: z.string().nullable().optional(),
  full_name: z.string().min(2).max(150),
  gender: z.enum(["male", "female"]).default("male"),
  dob: z.string().nullable().optional(),
  marital_status: z.enum(["single", "married"]).nullable().optional(),
  place_of_birth: z.string().max(200).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  current_address: z.string().max(300).nullable().optional(),
  province: z.string().max(120).nullable().optional(),
  ward: z.string().max(120).nullable().optional(),
  ethnicity: z.string().max(60).nullable().optional(),
  religion: z.string().max(60).nullable().optional(),
  education_level: z.string().max(120).nullable().optional(),
  worked_abroad: z.boolean().default(false),
  land_lost: z.boolean().default(false),
  poor_household: z.boolean().default(false),
  veteran: z.boolean().default(false),
  ethnic_minority: z.boolean().default(false),
  destination_country: z.string().max(120).nullable().optional(),
  program_type: z.enum(["DH", "LD"]).nullable().optional(),
  contract_type: z.enum(["HD", "TV"]).nullable().optional(),
  occupation: z.string().max(150).nullable().optional(),
  employer_name: z.string().max(200).nullable().optional(),
  planned_departure_date: z.string().nullable().optional(),
  actual_departure_date: z.string().nullable().optional(),
  flight_no: z.string().max(30).nullable().optional(),
  departure_airport: z.string().max(80).nullable().optional(),
  arrival_airport: z.string().max(80).nullable().optional(),
  status: z.enum(["planned", "departed", "postponed", "cancelled"]).default("planned"),
  note: z.string().max(2000).nullable().optional(),
});

const filterSchema = z.object({
  q: z.string().max(120).optional(),
  status: z.string().max(30).optional(),
  country: z.string().max(120).optional(),
  batch_id: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  /** Lọc theo ngày dự kiến hay ngày xuất cảnh thực tế. */
  date_field: z.enum(["planned", "actual"]).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});

type Filters = z.infer<typeof filterSchema>;

function applyFilters(query: any, f: Filters) {
  let q = query.is("deleted_at", null);
  if (f.status) q = q.eq("status", f.status);
  if (f.country) q = q.eq("destination_country", f.country);
  if (f.batch_id) q = q.eq("batch_id", f.batch_id);
  const dateCol =
    f.date_field === "actual" ? "actual_departure_date" : "planned_departure_date";
  if (f.from) q = q.gte(dateCol, f.from);
  if (f.to) q = q.lte(dateCol, f.to);
  if (f.q) {
    const t = f.q.trim().replace(/[%,]/g, " ");
    q = q.or(
      `full_name.ilike.%${t}%,id_no.ilike.%${t}%,passport_no.ilike.%${t}%,phone.ilike.%${t}%`,
    );
  }
  return q;
}

/* ----------------------------- Danh sách ------------------------------ */

export const listDepartures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertRead(context);
    const ids = await scopedStudentIds(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await applyFilters(
      scopedDepartures(supabaseAdmin.from("departure_records").select(SELECT), ids),
      data,
    )
      .order("planned_departure_date", { ascending: true, nullsFirst: false })
      .limit(data.limit ?? 500);
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const listBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRead(context);
    if (!(await studentDepartmentAccess(context)).all) return { items: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("departure_batches")
      .select("*")
      .order("planned_date", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const saveBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(2).max(150),
        destination_country: z.string().max(120).nullable().optional(),
        planned_date: z.string().nullable().optional(),
        note: z.string().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    if (!(await studentDepartmentAccess(context)).all) throw new Error("Chỉ quản trị viên được quản lý đợt xuất cảnh dùng chung");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, updated_by: context.userId } as any;
    if (!data.id) payload.created_by = context.userId;
    const { data: row, error } = await supabaseAdmin
      .from("departure_batches")
      .upsert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* -------------------------- Tạo / sửa / xoá --------------------------- */

export const saveDeparture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => recordSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    await assertDepartureAccess(context, data.student_profile_id, true);
    if (data.id) await assertExistingDeparture(context, data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: any = { ...data, updated_by: context.userId };
    if (!data.id) payload.created_by = context.userId;
    const { data: row, error } = await supabaseAdmin
      .from("departure_records")
      .upsert(payload)
      .select(SELECT)
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Số căn cước này đã có trong danh sách xuất cảnh");
      throw new Error(error.message);
    }
    await syncStudentProfile(supabaseAdmin, row, context.userId);
    return row;
  });

export const deleteDeparture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    await assertExistingDeparture(context, data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("departure_records")
      .update({ deleted_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markDeparted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200), date: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    for (const id of data.ids) await assertExistingDeparture(context, id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("departure_records")
      .update({
        status: "departed",
        actual_departure_date: data.date,
        updated_by: context.userId,
      })
      .in("id", data.ids)
      .select(SELECT);
    if (error) throw new Error(error.message);
    for (const row of rows ?? []) await syncStudentProfile(supabaseAdmin, row, context.userId);
    return { count: rows?.length ?? 0 };
  });

/** Đồng bộ ngược sang hồ sơ học viên + ghi nhật ký trách nhiệm. */
async function syncStudentProfile(supabaseAdmin: any, row: any, userId: string) {
  if (!row?.student_profile_id) return;
  const patch: Record<string, unknown> = { updated_by: userId };
  if (row.status === "departed" && row.actual_departure_date) {
    patch["departure_date"] = row.actual_departure_date;
    patch["departure_status"] = "departed";
  } else if (row.planned_departure_date) {
    patch["departure_date"] = row.planned_departure_date;
  }
  await supabaseAdmin.from("student_profiles").update(patch).eq("id", row.student_profile_id);
  try {
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({
      student_profile_id: row.student_profile_id,
      actor_id: userId,
      stage: "departure",
      action: row.status === "departed" ? "departure.departed" : "departure.updated",
      entity: "departure_records",
      entity_id: row.id,
      note:
        row.status === "departed"
          ? `Đã xuất cảnh ngày ${row.actual_departure_date ?? "—"}${row.flight_no ? ` · chuyến ${row.flight_no}` : ""}`
          : `Cập nhật hồ sơ xuất cảnh (${row.status})`,
    });
  } catch {
    /* nhật ký là phụ trợ — không chặn nghiệp vụ chính */
  }
}

/* ------------------- Lấy dữ liệu từ hồ sơ học viên -------------------- */

export const searchStudentsForDeparture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ q: z.string().max(120).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertRead(context);
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const term = (data.q ?? "").trim();
    let q = limitToDepartments(supabaseAdmin
      .from("student_profiles")
      .select("id, student_code, full_name, phone")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20), scope);
    if (term) {
      const t = term.replace(/[%,]/g, " ");
      q = q.or(`full_name.ilike.%${t}%,student_code.ilike.%${t}%,phone.ilike.%${t}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const prefillFromStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_profile_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRead(context);
    await assertStudentDepartment(context, data.student_profile_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s, error } = await supabaseAdmin
      .from("student_profiles")
      .select("*")
      .eq("id", data.student_profile_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!s) throw new Error("Không tìm thấy hồ sơ học viên");
    return {
      student_profile_id: s.id,
      id_no: s.id_no ?? "",
      id_issue_date: s.id_issue_date ?? null,
      full_name: s.full_name ?? "",
      gender: s.gender === "female" || s.gender === "Nữ" ? "female" : "male",
      dob: s.dob ?? null,
      place_of_birth: s.place_of_origin ?? null,
      phone: s.phone ?? null,
      current_address: s.place_of_residence ?? null,
      destination_country: s.destination_country ?? s.country ?? null,
      occupation: s.occupation ?? s.job_title ?? null,
      employer_name: s.employer_name ?? null,
      planned_departure_date: s.departure_date ?? null,
    };
  });

/* ----------------------------- Thống kê ------------------------------- */

export const getDepartureStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertRead(context);
    const ids = await scopedStudentIds(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await applyFilters(
      scopedDepartures(supabaseAdmin
        .from("departure_records")
        .select(
          "id, status, gender, destination_country, student_profile_id, planned_departure_date, actual_departure_date",
        ), ids),
      data,
    ).limit(5000);
    if (error) throw new Error(error.message);
    const list = rows ?? [];

    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const in30 = new Date(today.getTime() + 30 * 86400000);
    const monthKey = iso(today).slice(0, 7);
    const yearKey = iso(today).slice(0, 4);

    const count = (fn: (r: any) => boolean) => list.filter(fn).length;
    const group = (fn: (r: any) => string) => {
      const m: Record<string, number> = {};
      list.forEach((r: any) => {
        const k = fn(r) || "Khác";
        m[k] = (m[k] ?? 0) + 1;
      });
      return m;
    };

    const byMonth: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      byMonth[iso(d).slice(0, 7)] = 0;
    }
    list.forEach((r: any) => {
      const k = (r.actual_departure_date ?? "").slice(0, 7);
      if (k && k in byMonth) byMonth[k] = (byMonth[k] ?? 0) + 1;
    });

    return {
      total: list.length,
      departed: count((r) => r.status === "departed"),
      planned: count((r) => r.status === "planned"),
      postponed: count((r) => r.status === "postponed" || r.status === "cancelled"),
      upcoming30: count(
        (r) =>
          r.status === "planned" &&
          r.planned_departure_date &&
          r.planned_departure_date >= iso(today) &&
          r.planned_departure_date <= iso(in30),
      ),
      departedThisMonth: count(
        (r) => r.status === "departed" && (r.actual_departure_date ?? "").startsWith(monthKey),
      ),
      departedThisYear: count(
        (r) => r.status === "departed" && (r.actual_departure_date ?? "").startsWith(yearKey),
      ),
      byCountry: group((r) => r.destination_country ?? "Chưa rõ"),
      byGender: group((r) => (r.gender === "female" ? "Nữ" : "Nam")),
      byStatus: group((r) => r.status),
      bySource: group((r) => (r.student_profile_id ? "Học viên nội bộ" : "Nhập ngoài hệ thống")),
      byMonth,
    };
  });

/** Cảnh báo trước xuất cảnh; chỉ đọc dữ liệu và không thay đổi trạng thái nghiệp vụ. */
export const getOrientationWarnings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_ids: z.array(z.string().uuid()).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRead(context);
    if (!data.student_ids.length) return { missing: [] as string[] };
    for (const id of data.student_ids) await assertStudentDepartment(context, id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: enrollments, error: enrollmentError }, { data: certificates, error: certificateError }] = await Promise.all([
      supabaseAdmin.from("training_enrollments")
        .select("student_profile_id, training_classes(training_programs(program_type))")
        .in("student_profile_id", data.student_ids),
      supabaseAdmin.from("certificates")
        .select("student_profile_id, training_programs(program_type)")
        .in("student_profile_id", data.student_ids).eq("status", "issued"),
    ]);
    if (enrollmentError || certificateError) throw new Error("Không thể xác minh tình trạng giáo dục định hướng");
    const enrolled = new Set((enrollments ?? []).filter((r: any) => r.training_classes?.training_programs?.program_type === "orientation").map((r) => r.student_profile_id));
    const certified = new Set((certificates ?? []).filter((r: any) => r.training_programs?.program_type === "orientation").map((r) => r.student_profile_id));
    return { missing: data.student_ids.filter((id) => !enrolled.has(id) || !certified.has(id)) };
  });

/* --------------------------- Nhập / Xuất ------------------------------ */

export const previewImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ file_base64: z.string().min(10) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    if (!(await studentDepartmentAccess(context)).all) throw new Error("Chỉ quản trị viên được nhập danh sách xuất cảnh tổng hợp");
    const { parseTemplateWorkbook } = await import("./departure.server");
    const rows = await parseTemplateWorkbook(data.file_base64);
    if (rows.length === 0) {
      throw new Error("Không đọc được dòng dữ liệu nào. Kiểm tra lại file có đúng mẫu không.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = rows.map((r) => String(r.values["id_no"] ?? "")).filter(Boolean);
    const { data: existing } = await supabaseAdmin
      .from("departure_records")
      .select("id_no")
      .is("deleted_at", null)
      .in("id_no", ids.length ? ids : ["__none__"]);
    const dup = new Set((existing ?? []).map((r: any) => r.id_no));
    return {
      rows: rows.map((r) => ({ ...r, duplicate: dup.has(String(r.values["id_no"] ?? "")) })),
    };
  });

export const commitImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        rows: z.array(recordSchema.partial().extend({ id_no: z.string().min(6) })).min(1).max(2000),
        update_existing: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    if (!(await studentDepartmentAccess(context)).all) throw new Error("Chỉ quản trị viên được nhập danh sách xuất cảnh tổng hợp");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let created = 0;
    let updated = 0;
    const failed: Array<{ id_no: string; error: string }> = [];

    for (const row of data.rows) {
      const { data: found } = await supabaseAdmin
        .from("departure_records")
        .select("id")
        .eq("id_no", row.id_no)
        .is("deleted_at", null)
        .maybeSingle();
      if (found && !data.update_existing) continue;
      const payload: any = { ...row, updated_by: context.userId };
      if (found) payload.id = found.id;
      else payload.created_by = context.userId;
      const { error } = await supabaseAdmin.from("departure_records").upsert(payload);
      if (error) failed.push({ id_no: row.id_no, error: error.message });
      else if (found) updated++;
      else created++;
    }
    return { created, updated, failed };
  });

export const exportTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    filterSchema.extend({ ids: z.array(z.string().uuid()).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertRead(context);
    const ids = await scopedStudentIds(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let rows: any[] = [];
    if (data.ids?.length) {
      const { data: r, error } = await scopedDepartures(supabaseAdmin
        .from("departure_records")
        .select("*")
        .in("id", data.ids)
        .is("deleted_at", null), ids);
      if (error) throw new Error(error.message);
      rows = r ?? [];
    } else {
      const { data: r, error } = await applyFilters(
        scopedDepartures(supabaseAdmin.from("departure_records").select("*"), ids),
        data,
      ).limit(5000);
      if (error) throw new Error(error.message);
      rows = r ?? [];
    }
    if (rows.length === 0) throw new Error("Không có bản ghi nào để xuất");
    const { buildTemplateWorkbook } = await import("./departure.server");
    const bytes = await buildTemplateWorkbook(rows);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return {
      filename: `DanhSachNguoiLaoDong_${new Date().toISOString().slice(0, 10)}.xlsx`,
      base64: btoa(bin),
      count: rows.length,
    };
  });

/** Tải file Excel mẫu trống (21 cột + trang hướng dẫn) để lưu trữ và điền tay. */
export const downloadBlankTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRead(context);
    const { buildBlankTemplateWorkbook } = await import("./departure.server");
    const bytes = await buildBlankTemplateWorkbook();
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return { filename: "Mau_DanhSachNguoiLaoDong.xlsx", base64: btoa(bin) };
  });
