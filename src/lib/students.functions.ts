import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";
import { studentDepartmentAccess, assertStudentDepartment, limitToDepartments } from "@/lib/students/department-access.server";



async function assertStaff(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "students.view");
}


async function assertPlacementEditor(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "students.placement");
}

const ListInput = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(64).optional(),
  market: z.string().trim().max(50).optional(),
  program: z.string().trim().max(120).optional(),
  program_type: z.enum(["du_hoc", "xkld"]).optional(),
  contract: z.enum(["d7", "d30", "d90", "overdue"]).optional(),
  limit: z.number().int().min(1).max(500).default(200),
});

export const listStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = limitToDepartments(supabaseAdmin
      .from("student_profiles")
      .select(
        "id, student_code, full_name, phone, email, country, program, program_type, current_status, assigned_to, created_at, employer_name, occupation, destination_country, contract_end_date",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
       .limit(data.limit), scope);
    if (data.status) q = q.eq("current_status", data.status);
    if (data.market) q = q.eq("country", data.market);
    if (data.program_type === "du_hoc") q = q.eq("program_type", "du_hoc");
    if (data.program_type === "xkld") q = q.or("program_type.is.null,program_type.neq.du_hoc");
    if (data.program) q = q.ilike("program", `%${data.program}%`);
    if (data.contract) {
      const today = new Date();
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const plus = (n: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() + n);
        return iso(d);
      };
      q = q.not("contract_end_date", "is", null);
      if (data.contract === "overdue") q = q.lt("contract_end_date", iso(today));
      else {
        const days = data.contract === "d7" ? 7 : data.contract === "d30" ? 30 : 90;
        q = q.gte("contract_end_date", iso(today)).lte("contract_end_date", plus(days));
      }
    }
    if (data.search) {
      const s = data.search.replace(/[%_]/g, "");
      q = q.or(
        `full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,student_code.ilike.%${s}%,id_no.ilike.%${s}%,employer_name.ilike.%${s}%,occupation.ilike.%${s}%`,
      );
    }
    const { data: items, error } = await q;
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });

export const getStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    await assertStudentDepartment(context, data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profile, history, careLogs, documents, enrollments, instance] = await Promise.all([
      supabaseAdmin.from("student_profiles").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("student_status_history")
        .select("*")
        .eq("student_profile_id", data.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("student_care_logs")
        .select("*")
        .eq("student_profile_id", data.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("student_documents")
        .select("*")
        .eq("student_profile_id", data.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("training_enrollments")
        .select(
          "id, status, final_grade, enrolled_at, training_classes(id, code, name, status, start_date, end_date)",
        )
        .eq("student_profile_id", data.id)
        .order("enrolled_at", { ascending: false }),
      supabaseAdmin
        .from("workflow_instances")
        .select("id, current_step, status, started_at, completed_at, workflow_definitions(steps)")
        .eq("student_profile_id", data.id)
        .maybeSingle(),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    if (!profile.data) throw new Error("Không tìm thấy hồ sơ");
    return {
      profile: profile.data,
      history: history.data ?? [],
      careLogs: careLogs.data ?? [],
      documents: documents.data ?? [],
      enrollments: enrollments.data ?? [],
      instance: instance.data ?? null,
    };
  });

export const listStudentDepartments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPermission(context, "students.manage");
    const scope = await studentDepartmentAccess(context);
    if (!scope.all) return { canAssign: false, items: [] };
    const { data, error } = await context.supabase.from("catalog_departments")
      .select("id, code, name").order("name");
    if (error) throw new Error(error.message);
    return { canAssign: true, items: data ?? [] };
  });

export const assignStudentDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), department_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertPermission(context, "students.manage");
    const scope = await studentDepartmentAccess(context);
    if (!scope.all) throw new Error("Chỉ quản trị viên được điều chuyển phòng ban");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: department } = await supabaseAdmin.from("catalog_departments").select("id, name").eq("id", data.department_id).maybeSingle();
    if (!department) throw new Error("Phòng ban không tồn tại");
    const { data: before } = await supabaseAdmin.from("student_profiles").select("department_id").eq("id", data.id).maybeSingle();
    if (!before) throw new Error("Không tìm thấy hồ sơ");
    const { error } = await supabaseAdmin.from("student_profiles").update({ department_id: data.department_id, updated_by: context.userId }).eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({ student_profile_id: data.id, action: "profile_update", actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null, entity: "student_profiles", field: "Phòng ban quản lý",
      old_value: before.department_id, new_value: department.name });
    return { ok: true };
  });

const CreateInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  dob: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().max(50).optional().or(z.literal("")),
  program: z.string().trim().max(200).optional().or(z.literal("")),
  program_type: z.enum(["du_hoc", "xkld", "thuc_tap_sinh"]).optional().or(z.literal("")),
  current_status: z.string().trim().max(64).default("lead_new"),
  // Địa bàn (chọn từ danh mục địa giới hành chính) — tuỳ chọn khi tạo hồ sơ
  origin_province_code: z.string().trim().max(20).optional().or(z.literal("")),
  origin_province_name: z.string().trim().max(160).optional().or(z.literal("")),
  origin_ward_code: z.string().trim().max(20).optional().or(z.literal("")),
  origin_ward_name: z.string().trim().max(160).optional().or(z.literal("")),
  origin_address_detail: z.string().trim().max(300).optional().or(z.literal("")),
  residence_province_code: z.string().trim().max(20).optional().or(z.literal("")),
  residence_province_name: z.string().trim().max(160).optional().or(z.literal("")),
  residence_ward_code: z.string().trim().max(20).optional().or(z.literal("")),
  residence_ward_name: z.string().trim().max(160).optional().or(z.literal("")),
  residence_address_detail: z.string().trim().max(300).optional().or(z.literal("")),
  current_province_code: z.string().trim().max(20).optional().or(z.literal("")),
  current_province_name: z.string().trim().max(160).optional().or(z.literal("")),
  current_ward_code: z.string().trim().max(20).optional().or(z.literal("")),
  current_ward_name: z.string().trim().max(160).optional().or(z.literal("")),
  current_address_detail: z.string().trim().max(300).optional().or(z.literal("")),
  // Cộng tác viên giới thiệu (tuỳ chọn) — ghi nhận doanh thu & hoa hồng
  collaborator_code: z.string().trim().max(40).optional().or(z.literal("")),
  order_revenue: z.number().int().min(0).max(100_000_000_000).optional(),
  commission_amount: z.number().int().min(0).max(100_000_000_000).optional(),
});

const DuplicateInput = z.object({
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().max(200).optional().or(z.literal("")),
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  dob: z.string().trim().max(20).optional().or(z.literal("")),
  exclude_id: z.string().uuid().optional(),
});

export type DuplicateMatch = {
  id: string;
  student_code: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  dob: string | null;
  current_status: string | null;
  country: string | null;
  program: string | null;
  created_at: string;
  reasons: string[];
};

function normPhone(v?: string | null) {
  return (v ?? "").replace(/\D/g, "").replace(/^84/, "0");
}
function normName(v?: string | null) {
  return (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Tìm hồ sơ có khả năng trùng: cùng SĐT, cùng email, hoặc cùng họ tên + ngày sinh. */
async function findDuplicates(
  supabaseAdmin: any,
  input: z.infer<typeof DuplicateInput>,
  departmentIds?: string[],
): Promise<DuplicateMatch[]> {
  const phone = normPhone(input.phone);
  const email = (input.email ?? "").trim().toLowerCase();
  const name = normName(input.full_name);
  const dob = (input.dob ?? "").trim();
  if (!phone && !email && !(name && dob)) return [];

  const ors: string[] = [];
  if (phone && phone.length >= 8) {
    const alt = phone.startsWith("0") ? "84" + phone.slice(1) : "";
    ors.push(`phone.ilike.%${phone}%`);
    if (alt) ors.push(`phone.ilike.%${alt}%`);
  }
  if (email) ors.push(`email.ilike.${email}`);
  if (name && dob) ors.push(`dob.eq.${dob}`);
  if (name && !dob && !phone && !email) return [];

  let q = supabaseAdmin
    .from("student_profiles")
    .select("id, student_code, full_name, phone, email, dob, current_status, country, program, created_at")
    .or(ors.join(","))
    .limit(30);
  if (departmentIds) q = q.in("department_id", departmentIds.length ? departmentIds : ["00000000-0000-0000-0000-000000000000"]);
  if (input.exclude_id) q = q.neq("id", input.exclude_id);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const out: DuplicateMatch[] = [];
  for (const r of (data ?? []) as any[]) {
    const reasons: string[] = [];
    if (phone && normPhone(r.phone) === phone) reasons.push("Trùng số điện thoại");
    if (email && (r.email ?? "").toLowerCase() === email) reasons.push("Trùng email");
    if (name && dob && normName(r.full_name) === name && r.dob === dob)
      reasons.push("Trùng họ tên + ngày sinh");
    if (reasons.length) out.push({ ...r, reasons });
  }
  return out;
}

/** Kiểm tra trùng thông tin trước khi tạo/sửa (gọi từ form). */
export const checkStudentDuplicates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DuplicateInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const matches = await findDuplicates(supabaseAdmin, data, scope.all ? undefined : scope.readable);
    return { matches };
  });

const GEO_PREFIXES = ["origin", "residence", "current"] as const;

/** Ghép chuỗi địa chỉ đầy đủ: chi tiết, xã/phường, tỉnh/thành. */
function composeAddress(p: Record<string, any>, prefix: string): string | null {
  return (
    [p[`${prefix}_address_detail`], p[`${prefix}_ward_name`], p[`${prefix}_province_name`]]
      .map((v) => (v ?? "").toString().trim())
      .filter(Boolean)
      .join(", ") || null
  );
}

/** Tách các trường địa bàn từ dữ liệu form thành bản ghi để lưu (rỗng → null). */
function pickGeoFields(src: Record<string, any>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const prefix of GEO_PREFIXES) {
    for (const k of ["province_code", "province_name", "ward_code", "ward_name", "address_detail"]) {
      const key = `${prefix}_${k}`;
      if (key in src) out[key] = src[key] ? String(src[key]).trim() || null : null;
    }
  }
  return out;
}

const GEO_LABEL: Record<string, string> = { origin: "Quê quán", residence: "Thường trú", current: "Nơi ở hiện tại" };

/**
 * Đối chiếu mã tỉnh/xã với Danh mục địa danh: mã phải tồn tại và xã phải thuộc tỉnh đã chọn.
 * Đồng thời chuẩn hoá lại tên theo danh mục để dữ liệu thống nhất.
 */
async function validateGeoCodes(supabaseAdmin: any, patch: Record<string, any>) {
  for (const prefix of GEO_PREFIXES) {
    const pc = patch[`${prefix}_province_code`];
    const wc = patch[`${prefix}_ward_code`];
    if (!pc && wc) throw new Error(`${GEO_LABEL[prefix]}: đã chọn xã/phường nhưng thiếu tỉnh/thành phố`);
    if (pc) {
      const { data: prov } = await supabaseAdmin
        .from("catalog_provinces").select("code, name").eq("code", pc).maybeSingle();
      if (!prov) throw new Error(`${GEO_LABEL[prefix]}: mã tỉnh/thành phố "${pc}" không có trong danh mục địa danh`);
      patch[`${prefix}_province_name`] = prov.name;
    }
    if (wc) {
      const { data: ward } = await supabaseAdmin
        .from("catalog_wards").select("code, name, province_code").eq("code", wc).maybeSingle();
      if (!ward) throw new Error(`${GEO_LABEL[prefix]}: mã xã/phường "${wc}" không có trong danh mục địa danh`);
      if (ward.province_code !== pc)
        throw new Error(`${GEO_LABEL[prefix]}: xã/phường đã chọn không thuộc tỉnh/thành phố đã chọn`);
      patch[`${prefix}_ward_name`] = ward.name;
    }
  }
}

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.extend({ force: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertPermission(context, "students.manage");
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Department is assigned by the database trigger. Restrict creators to their market's department.
    const orientation = data.program_type === "du_hoc" || /du học/i.test(data.program ?? "");
    const country = (data.country ?? "").toLowerCase();
    const code = orientation
      ? ["duc", "germany", "ba-lan", "hungary"].includes(country) ? "du_hoc_chau_au" : ["nhat-ban", "japan", "han-quoc", "korea"].includes(country) ? "du_hoc_nhat_han" : null
      : ["duc", "germany", "ba-lan", "hungary"].includes(country) ? "tt_chau_au" : ["nhat-ban", "japan"].includes(country) ? "tt_nhat_ban" : ["han-quoc", "korea"].includes(country) ? "tt_han_quoc" : ["dai-loan", "taiwan"].includes(country) ? "tt_dai_loan" : null;
    if (!scope.all) {
      if (!code) throw new Error("Chưa xác định được phòng ban theo thị trường; vui lòng liên hệ Ban Giám đốc");
      const { data: department } = await supabaseAdmin.from("catalog_departments").select("id").eq("code", code).maybeSingle();
      if (!department || !scope.writable.includes(department.id)) throw new Error("Không có quyền tạo hồ sơ cho phòng ban này");
    }

    // Cảnh báo trùng: chỉ ghi tiếp khi người dùng đã xác nhận (force).
    if (!data.force) {
      const matches = await findDuplicates(supabaseAdmin, {
        phone: data.phone,
        email: data.email || "",
        full_name: data.full_name,
        dob: data.dob || "",
      });
      if (matches.length) return { id: null as string | null, duplicate: true as const, matches };
    }

    // Kiểm tra mã CTV trước khi tạo hồ sơ để không tạo hồ sơ khi mã sai.
    if (data.collaborator_code) {
      const { resolveCollaborator } = await import("@/lib/commissions/commissions.server");
      await resolveCollaborator(supabaseAdmin, data.collaborator_code);
    }

    // Địa bàn: đối chiếu với danh mục rồi ghép chuỗi cho 2 ô chữ cũ.
    const geo = pickGeoFields(data as any);
    await validateGeoCodes(supabaseAdmin, geo);
    const place_of_origin = composeAddress(geo, "origin");
    const place_of_residence = composeAddress(geo, "residence");

    const { data: row, error } = await supabaseAdmin
      .from("student_profiles")
      .insert({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || null,
        dob: data.dob || null,
        country: data.country || null,
        program: data.program || null,
        program_type: data.program_type || null,
        current_status: data.current_status,
        ...geo,
        place_of_origin,
        place_of_residence,
        created_by: context.userId,
        updated_by: context.userId,
      } as any)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (row?.id && data.collaborator_code) {
      const { recordCommission } = await import("@/lib/commissions/record.server");
      await recordCommission(supabaseAdmin, {
        student_profile_id: row.id,
        collaborator_code: data.collaborator_code,
        order_revenue: data.order_revenue ?? 0,
        commission_amount: data.commission_amount ?? 0,
        actor: context.userId,
      });
    }
    if (row?.id) {
      const { logStudentActivity } = await import("@/lib/students/activity.server");
      await logStudentActivity({
        student_profile_id: row.id,
        action: "profile_create",
        actor_id: context.userId,
        actor_email: (context as any).claims?.email ?? null,
        actor_roles: roles,
        stage: data.current_status,
        note: [
          data.force
            ? `Tạo hồ sơ: ${data.full_name} (đã xác nhận bỏ qua cảnh báo trùng)`
            : `Tạo hồ sơ: ${data.full_name}`,
          place_of_origin ? `Quê quán: ${place_of_origin}` : null,
          place_of_residence ? `Thường trú: ${place_of_residence}` : null,
          composeAddress(geo, "current") ? `Nơi ở hiện tại: ${composeAddress(geo, "current")}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
    return { id: row?.id ?? null, duplicate: false as const, matches: [] as DuplicateMatch[] };
  });

/** Xoá vĩnh viễn hồ sơ học viên — chỉ quyền `students.delete` (mặc định: Admin). */
export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), reason: z.string().trim().min(5).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context, "students.delete");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p, error: e1 } = await supabaseAdmin
      .from("student_profiles")
      .select("id, student_code, full_name, phone, email, current_status")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!p) throw new Error("Không tìm thấy hồ sơ");

    // Ghi vết xoá vào nhật ký chung (nhật ký theo hồ sơ sẽ bị xoá theo hồ sơ).
    await supabaseAdmin.from("cms_audit_logs").insert({
      actor_id: context.userId,
      action: "student_profile_delete",
      resource_type: "student_profile",
      resource_id: p.id,
      diff: { before: p, reason: data.reason, actor_email: (context as any).claims?.email ?? null },
    });

    // Gỡ liên kết mềm (FK set null) trước khi xoá để giữ dữ liệu lead/xuất cảnh.
    await supabaseAdmin.from("consultations").update({ student_profile_id: null }).eq("student_profile_id", p.id);
    await supabaseAdmin.from("departure_records").update({ student_profile_id: null }).eq("student_profile_id", p.id);

    const { error } = await supabaseAdmin.from("student_profiles").delete().eq("id", p.id);
    if (error) throw new Error(error.message);
    return { ok: true, student_code: p.student_code };
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  patch: z
    .object({
      full_name: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().min(8).max(20).optional(),
      email: z.string().trim().email().max(200).nullable().optional(),
      dob: z.string().trim().nullable().optional(),
      country: z.string().trim().max(50).nullable().optional(),
      program: z.string().trim().max(200).nullable().optional(),
      program_type: z.enum(["du_hoc", "xkld", "thuc_tap_sinh"]).nullable().optional(),
      source: z.string().trim().max(50).nullable().optional(),
      contract_status: z.string().trim().max(50).nullable().optional(),
      visa_status: z.string().trim().max(50).nullable().optional(),
      departure_status: z.string().trim().max(50).nullable().optional(),
      post_departure_status: z.string().trim().max(50).nullable().optional(),
      // Địa bàn (chọn từ danh mục địa giới hành chính)
      origin_province_code: z.string().trim().max(20).nullable().optional(),
      origin_province_name: z.string().trim().max(160).nullable().optional(),
      origin_ward_code: z.string().trim().max(20).nullable().optional(),
      origin_ward_name: z.string().trim().max(160).nullable().optional(),
      origin_address_detail: z.string().trim().max(300).nullable().optional(),
      residence_province_code: z.string().trim().max(20).nullable().optional(),
      residence_province_name: z.string().trim().max(160).nullable().optional(),
      residence_ward_code: z.string().trim().max(20).nullable().optional(),
      residence_ward_name: z.string().trim().max(160).nullable().optional(),
      residence_address_detail: z.string().trim().max(300).nullable().optional(),
      current_province_code: z.string().trim().max(20).nullable().optional(),
      current_province_name: z.string().trim().max(160).nullable().optional(),
      current_ward_code: z.string().trim().max(20).nullable().optional(),
      current_ward_name: z.string().trim().max(160).nullable().optional(),
      current_address_detail: z.string().trim().max(300).nullable().optional(),
      place_of_origin: z.string().trim().max(400).nullable().optional(),
      place_of_residence: z.string().trim().max(400).nullable().optional(),
    })
    .partial(),
  meta_patch: z.record(z.string(), z.any()).optional(),
});

const PROFILE_FIELD_LABEL: Record<string, string> = {
  full_name: "Họ tên",
  phone: "Số điện thoại",
  email: "Email",
  dob: "Ngày sinh",
  country: "Thị trường",
  program: "Chương trình",
  program_type: "Loại chương trình",
  source: "Nguồn",
  contract_status: "Trạng thái hợp đồng",
  visa_status: "Trạng thái visa",
  departure_status: "Trạng thái xuất cảnh",
  post_departure_status: "Trạng thái sau xuất cảnh",
  destination_country: "Nước đến",
  destination_city: "Thành phố",
  occupation: "Ngành nghề",
  job_title: "Vị trí công việc",
  employer_name: "Đơn vị tiếp nhận",
  work_address: "Địa chỉ làm việc",
  employer_contact_name: "Người liên hệ",
  employer_contact_phone: "SĐT liên hệ",
  employer_contact_email: "Email liên hệ",
  contract_start_date: "Ngày bắt đầu hợp đồng",
  contract_end_date: "Ngày kết thúc hợp đồng",
  contract_duration_months: "Thời hạn hợp đồng (tháng)",
  contract_renewal_note: "Ghi chú gia hạn",
  departure_date: "Ngày xuất cảnh",
  origin_province_name: "Quê quán — Tỉnh/Thành phố",
  origin_ward_name: "Quê quán — Xã/Phường",
  origin_address_detail: "Quê quán — Địa chỉ chi tiết",
  residence_province_name: "Thường trú — Tỉnh/Thành phố",
  residence_ward_name: "Thường trú — Xã/Phường",
  residence_address_detail: "Thường trú — Địa chỉ chi tiết",
  current_province_name: "Nơi ở hiện tại — Tỉnh/Thành phố",
  current_ward_name: "Nơi ở hiện tại — Xã/Phường",
  current_address_detail: "Nơi ở hiện tại — Địa chỉ chi tiết",
  place_of_origin: "Quê quán (chữ)",
  place_of_residence: "Thường trú (chữ)",
};

export const updateStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    await assertStudentDepartment(context, data.id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logStudentActivity, diffFields } = await import("@/lib/students/activity.server");
    const { data: before } = await supabaseAdmin
      .from("student_profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    // Địa bàn: đối chiếu mã tỉnh/xã với danh mục trước khi lưu.
    const geoPatch = pickGeoFields(data.patch as any);
    if (Object.keys(geoPatch).length) await validateGeoCodes(supabaseAdmin, geoPatch);
    const updates: Record<string, unknown> = { ...data.patch, ...geoPatch, updated_by: context.userId };
    if (data.meta_patch && Object.keys(data.meta_patch).length > 0) {
      const prevMeta = (before?.meta && typeof before.meta === "object" ? before.meta : {}) as Record<string, unknown>;
      updates.meta = { ...prevMeta, ...data.meta_patch };
    }
    const { error } = await supabaseAdmin
      .from("student_profiles")
      .update(updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const changes = diffFields(before as any, data.patch, PROFILE_FIELD_LABEL);
    if (changes.length) {
      await logStudentActivity(
        changes.map((c) => ({
          student_profile_id: data.id,
          action: "profile_update",
          actor_id: context.userId,
          actor_email: (context as any).claims?.email ?? null,
          actor_roles: roles,
          stage: (before as any)?.current_status ?? null,
          ...c,
        })),
      );
    }
    return { ok: true };
  });


const optText = (max: number) => z.string().trim().max(max).nullable().optional();
const optDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ")
  .nullable()
  .optional()
  .or(z.literal(""));

const PlacementInput = z.object({
  id: z.string().uuid(),
  patch: z.object({
    destination_country: optText(100),
    destination_city: optText(120),
    occupation: optText(160),
    job_title: optText(160),
    employer_name: optText(200),
    work_address: optText(400),
    employer_contact_name: optText(120),
    employer_contact_phone: optText(40),
    employer_contact_email: optText(200),
    contract_start_date: optDate,
    contract_end_date: optDate,
    contract_duration_months: z.number().int().min(0).max(600).nullable().optional(),
    contract_renewal_note: optText(1000),
    departure_date: optDate,
  }),
});

export const updatePlacement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlacementInput.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertPlacementEditor(context);
    await assertStudentDepartment(context, data.id, true);
    const p = data.patch;

    const email = (p.employer_contact_email ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Email người liên hệ không hợp lệ");
    const phone = (p.employer_contact_phone ?? "").trim();
    if (phone && !/^[\d\s+().-]{6,25}$/.test(phone))
      throw new Error("Số điện thoại người liên hệ không hợp lệ");
    if (p.contract_start_date && p.contract_end_date && p.contract_end_date < p.contract_start_date)
      throw new Error("Ngày kết thúc hợp đồng phải sau ngày bắt đầu");

    const updates: Record<string, unknown> = { updated_by: context.userId };
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined) continue;
      updates[k] = v === "" ? null : v;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logStudentActivity, diffFields } = await import("@/lib/students/activity.server");
    const { data: before } = await supabaseAdmin
      .from("student_profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    // đổi hạn hợp đồng thì reset các mốc cảnh báo đã gửi
    if ("contract_end_date" in updates) updates["contract_alert_sent"] = {};

    const { error } = await supabaseAdmin
      .from("student_profiles")
      .update(updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const changes = diffFields(
      before as any,
      Object.fromEntries(Object.entries(updates).filter(([k]) => k in PROFILE_FIELD_LABEL)),
      PROFILE_FIELD_LABEL,
    );
    if (changes.length) {
      await logStudentActivity(
        changes.map((c) => ({
          student_profile_id: data.id,
          action: "placement_update",
          actor_id: context.userId,
          actor_email: (context as any).claims?.email ?? null,
          actor_roles: roles,
          stage: (before as any)?.current_status ?? null,
          ...c,
        })),
      );
    }
    return { ok: true };
  });


export const canEditPlacement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { hasPermission } = await import("@/lib/rbac/guard");
    return { allowed: await hasPermission(context, "students.placement") };
  });

export const addCareLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        student_profile_id: z.string().uuid(),
        channel: z.enum(["call", "zalo", "email", "sms", "meeting", "other"]),
        content: z.string().trim().min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    await assertStudentDepartment(context, data.student_profile_id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("student_care_logs").insert({
      student_profile_id: data.student_profile_id,
      channel: data.channel,
      content: data.content,
      actor_id: context.userId,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (error) throw new Error(error.message);
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({
      student_profile_id: data.student_profile_id,
      action: "care_log",
      actor_id: context.userId,
      actor_email: (context as any).claims?.email ?? null,
      actor_roles: roles,
      entity: "student_care_logs",
      new_value: data.channel,
      note: data.content,
    });
    return { ok: true };
  });

export const addDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        student_profile_id: z.string().uuid(),
        doc_type: z.string().trim().min(1).max(64),
        file_name: z.string().trim().min(1).max(200),
        note: z.string().trim().max(500).optional().or(z.literal("")),
        base64: z.string().min(1).max(7_000_000),
        mime: z.string().trim().min(3).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    await assertStudentDepartment(context, data.student_profile_id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.length > 5 * 1024 * 1024) throw new Error("File quá lớn, tối đa 5MB");
    const safeName = data.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${data.student_profile_id}/${crypto.randomUUID()}-${safeName}`;
    const up = await supabaseAdmin.storage
      .from("student-docs")
      .upload(path, bytes, { contentType: data.mime, upsert: false });
    if (up.error) throw new Error(up.error.message);
    const { error } = await supabaseAdmin.from("student_documents").insert({
      student_profile_id: data.student_profile_id,
      doc_type: data.doc_type,
      file_name: data.file_name,
      file_path: path,
      mime_type: data.mime,
      size_bytes: bytes.length,
      verified: false,
      note: data.note || null,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (error) throw new Error(error.message);
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({
      student_profile_id: data.student_profile_id,
      action: "document_add",
      actor_id: context.userId,
      actor_email: (context as any).claims?.email ?? null,
      actor_roles: roles,
      entity: "student_documents",
      field: data.doc_type,
      new_value: data.file_name,
      note: data.note || null,
    });
    return { ok: true };
  });

export const verifyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), verified: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await supabaseAdmin
      .from("student_documents")
      .select("id, student_profile_id, doc_type, file_name, verified")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) throw new Error("Không tìm thấy tài liệu");
    await assertStudentDepartment(context, doc.student_profile_id, true);
    const { error } = await supabaseAdmin
      .from("student_documents")
      .update({
        verified: data.verified,
        verified_at: data.verified ? new Date().toISOString() : null,
        verified_by: data.verified ? context.userId : null,
        updated_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (doc?.student_profile_id) {
      const { logStudentActivity } = await import("@/lib/students/activity.server");
      await logStudentActivity({
        student_profile_id: doc.student_profile_id,
        action: "document_verify",
        actor_id: context.userId,
        actor_email: (context as any).claims?.email ?? null,
        actor_roles: roles,
        entity: "student_documents",
        entity_id: data.id,
        field: `${doc.doc_type} — ${doc.file_name}`,
        old_value: doc.verified ? "Đã duyệt" : "Chưa duyệt",
        new_value: data.verified ? "Đã duyệt" : "Chưa duyệt",
      });
    }
    return { ok: true };
  });


export const signDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const documentId = data.path.split("/")[0];
    if (!documentId) throw new Error("Đường dẫn tài liệu không hợp lệ");
    await assertStudentDepartment(context, documentId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("student-docs")
      .createSignedUrl(data.path, 60 * 10);
    if (error || !signed) throw new Error(error?.message || "Không tạo được link");
    return { url: signed.signedUrl };
  });

/** Xuất danh sách học viên ra CSV (mở được trực tiếp bằng Excel, có BOM tiếng Việt). */
export const exportStudentsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = limitToDepartments(supabaseAdmin
      .from("student_profiles")
      .select(
        "id, full_name, phone, email, country, program, current_status, source, contract_status, visa_status, departure_status, post_departure_status, created_at",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
       .limit(Math.min(data.limit ?? 500, 5000)), scope);
    if (data.status) q = q.eq("current_status", data.status);
    if (data.market) q = q.eq("country", data.market);
    if (data.program) q = q.ilike("program", `%${data.program}%`);
    if (data.search) {
      const s = data.search.replace(/[%_]/g, "");
      q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
    }
    const { data: items, error } = await q;
    if (error) throw new Error(error.message);
    const headers = [
      "Họ tên",
      "SĐT",
      "Email",
      "Thị trường",
      "Chương trình",
      "Trạng thái",
      "Nguồn",
      "Hợp đồng",
      "Visa",
      "Xuất cảnh",
      "Hậu xuất cảnh",
      "Ngày tạo",
    ];
    const esc = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = (items ?? []).map((r: any) =>
      [
        r.full_name,
        r.phone,
        r.email,
        r.country,
        r.program,
        r.current_status,
        r.source,
        r.contract_status,
        r.visa_status,
        r.departure_status,
        r.post_departure_status,
        r.created_at ? new Date(r.created_at).toLocaleString("vi-VN") : "",
      ]
        .map(esc)
        .join(","),
    );
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    return { csv, count: rows.length };
  });

/** OCR giấy tờ tuỳ thân (CCCD/CMND/Hộ chiếu) → JSON chuẩn để prefill hồ sơ. */
export const ocrIdentityDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        base64: z.string().min(100).max(10_000_000),
        mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
        doc_type: z.enum(["passport", "cccd", "cmnd", "other"]).default("passport"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const key = "kaizen-external-ai";
    if (!key) throw new Error("Thiếu LOVABLE_API_KEY");
    const systemPrompt = `Bạn là OCR chuyên đọc giấy tờ tuỳ thân Việt Nam: CCCD, CMND, Hộ chiếu.
Trả về DUY NHẤT một JSON với các trường (chuỗi rỗng "" nếu không có):
{
  "full_name": "HỌ VÀ TÊN ĐẦY ĐỦ (có dấu)",
  "dob": "YYYY-MM-DD",
  "gender": "male" | "female" | "",
  "document_type": "passport" | "cccd" | "cmnd" | "other",
  "document_no": "Số giấy tờ",
  "nationality": "VNM/VN/...",
  "place_of_origin": "Quê quán",
  "place_of_residence": "Nơi thường trú",
  "issue_date": "YYYY-MM-DD",
  "expiry_date": "YYYY-MM-DD",
  "issue_place": "Nơi cấp"
}
Không thêm chú thích, không markdown.`;
    const res = await (await import("@/lib/ai/external-ai.server")).aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Đây là ảnh ${data.doc_type}. Trích xuất thông tin.` },
              {
                type: "image_url",
                image_url: { url: `data:${data.mime};base64,${data.base64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) throw new Error("Hệ thống OCR đang quá tải, vui lòng thử lại sau.");
    if (res.status === 402) throw new Error("Hết credit AI. Vui lòng nạp thêm.");
    if (!res.ok) throw new Error(`OCR lỗi ${res.status}`);
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const candidate = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : "{}";
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(candidate);
    } catch {
      parsed = {};
    }
    return { fields: parsed };
  });

/**
 * Ghi kết quả OCR đã được cán bộ soát lại vào hồ sơ học viên.
 * Chỉ ghi các trường được tick chọn trên giao diện; lưu nguyên JSON gốc vào ocr_raw.
 */
const ApplyOcrInput = z.object({
  id: z.string().uuid(),
  fields: z
    .object({
      full_name: z.string().trim().max(120).optional(),
      dob: z.string().trim().max(20).optional(),
      gender: z.string().trim().max(20).optional(),
      nationality: z.string().trim().max(80).optional(),
      id_type: z.string().trim().max(30).optional(),
      id_no: z.string().trim().max(50).optional(),
      id_issue_date: z.string().trim().max(20).optional(),
      id_issue_place: z.string().trim().max(200).optional(),
      id_expiry_date: z.string().trim().max(20).optional(),
      place_of_origin: z.string().trim().max(300).optional(),
      place_of_residence: z.string().trim().max(300).optional(),
    })
    .partial(),
  raw: z.record(z.string(), z.any()).optional(),
});

const DATE_KEYS = ["dob", "id_issue_date", "id_expiry_date"] as const;

export const applyOcrToProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApplyOcrInput.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context);
    await assertStudentDepartment(context, data.id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data.fields)) {
      const value = typeof v === "string" ? v.trim() : v;
      if (!value) continue;
      if ((DATE_KEYS as readonly string[]).includes(k) && !/^\d{4}-\d{2}-\d{2}$/.test(String(value)))
        continue;
      updates[k] = value;
    }
    if (Object.keys(updates).length === 0) throw new Error("Chưa chọn trường nào để lưu");

    const { data: before } = await supabaseAdmin
      .from("student_profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    updates.ocr_raw = data.raw ?? data.fields;
    updates.ocr_at = new Date().toISOString();
    updates.updated_by = context.userId;

    const { error } = await supabaseAdmin
      .from("student_profiles")
      .update(updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const applied = Object.keys(updates).filter((k) => !["ocr_raw", "ocr_at", "updated_by"].includes(k));
    const { logStudentActivity, diffFields } = await import("@/lib/students/activity.server");
    const changes = diffFields(
      before as any,
      Object.fromEntries(applied.map((k) => [k, updates[k]])),
    );
    await logStudentActivity(
      (changes.length
        ? changes
        : [{ field: applied.join(", "), old_value: null, new_value: null }]
      ).map((c) => ({
        student_profile_id: data.id,
        action: "ocr_apply",
        actor_id: context.userId,
        actor_email: (context as any).claims?.email ?? null,
        actor_roles: roles,
        note: "Cán bộ đã soát và xác nhận kết quả quét giấy tờ",
        ...c,
      })),
    );
    return { ok: true, applied };
  });

