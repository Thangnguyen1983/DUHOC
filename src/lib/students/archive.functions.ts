import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";
import { assertStudentDepartment, studentDepartmentAccess, limitToDepartments } from "@/lib/students/department-access.server";

/**
 * Thư viện lưu trữ hồ sơ vật lý — quản lý vị trí kho (kho/phòng/tủ/kệ/hộp)
 * và phiếu lưu trữ hồ sơ giấy của từng học viên, phục vụ tra cứu & rút hồ sơ.
 */


async function assertRead(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "students.archive");
}

async function assertWrite(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "students.archive.edit");
}

export const ARCHIVE_STATUS: Record<string, string> = {
  stored: "Đang lưu kho",
  borrowed: "Đang cho mượn",
  returned: "Đã trả về kho",
  removed: "Đã rút khỏi kho",
};

const LOCATION_SELECT = "*";
const RECORD_SELECT =
  "*, archive_locations(id, code, name, warehouse, room, cabinet, shelf, box), student_profiles(id, student_code, full_name, phone, program, country)";

/* --------------------- Tìm học viên (mã / tên / SĐT) --------------------- */

export const searchStudentsForArchive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ q: z.string().max(120).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertRead(context);
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const term = (data.q ?? "").trim();
    let query = limitToDepartments(supabaseAdmin
      .from("student_profiles")
      .select("id, student_code, full_name, phone, country, program")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20), scope);
    if (term) {
      const safe = term.replace(/[%,()]/g, " ");
      query = query.or(
        `student_code.ilike.%${safe}%,full_name.ilike.%${safe}%,phone.ilike.%${safe}%`,
      );
    }
    const { data: items, error } = await query;
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });

/* ------------------------------ Vị trí kho ------------------------------- */

export const listArchiveLocations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRead(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const scope = await studentDepartmentAccess(context);
    const { data: locations, error } = await supabaseAdmin.from("archive_locations").select(LOCATION_SELECT).order("code");
    if (error) throw new Error(error.message);
    let countsQuery = supabaseAdmin.from("student_archive_records")
      .select("location_id, status, student_profiles!inner(department_id)");
    if (!scope.all) countsQuery = countsQuery.in("student_profiles.department_id", scope.readable.length ? scope.readable : ["00000000-0000-0000-0000-000000000000"]);
    const { data: counts, error: countsError } = await countsQuery.limit(10000);
    if (countsError) throw new Error(countsError.message);
    const used = new Map<string, number>();
    for (const r of (counts ?? []) as any[]) {
      if (!r.location_id || r.status === "removed") continue;
      used.set(r.location_id, (used.get(r.location_id) ?? 0) + 1);
    }
    return {
      items: (locations ?? []).map((l: any) => ({ ...l, used: used.get(l.id) ?? 0 })),
    };
  });

const locationInput = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  warehouse: z.string().max(200).nullable().optional(),
  room: z.string().max(100).nullable().optional(),
  cabinet: z.string().max(100).nullable().optional(),
  shelf: z.string().max(100).nullable().optional(),
  box: z.string().max(100).nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const upsertArchiveLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => locationInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    const scope = await studentDepartmentAccess(context);
    if (!scope.all) throw new Error("Chỉ quản trị viên được thay đổi vị trí kho dùng chung");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data };
    delete (payload as any).id;
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("archive_locations")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("archive_locations")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row!.id };
  });

/* ---------------------------- Phiếu lưu trữ ------------------------------ */

export const listArchiveRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        q: z.string().max(200).optional(),
        status: z.string().max(30).optional(),
        location_id: z.string().uuid().optional(),
        student_profile_id: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertRead(context);
    const scope = await studentDepartmentAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: allowed, error: allowedError } = await limitToDepartments(
      supabaseAdmin.from("student_profiles").select("id").is("deleted_at", null).limit(10000), scope,
    );
    if (allowedError) throw new Error(allowedError.message);
    const allowedIds = (allowed ?? []).map((p) => p.id);
    if (!allowedIds.length) return { items: [] };

    let query = supabaseAdmin
      .from("student_archive_records")
      .select(RECORD_SELECT)
      .in("student_profile_id", allowedIds)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);

    if (data.student_profile_id) query = query.eq("student_profile_id", data.student_profile_id);
    if (data.status) query = query.eq("status", data.status);
    if (data.location_id) query = query.eq("location_id", data.location_id);

    const term = (data.q ?? "").trim();
    if (term) {
      // Tìm theo mã học viên / họ tên trước, rồi kết hợp với mã phiếu, tên tài liệu
      const { data: profiles } = await supabaseAdmin
        .from("student_profiles")
        .select("id")
        .in("id", allowedIds)
        .or(`student_code.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(200);
      const ids = (profiles ?? []).map((p: any) => p.id as string);
      const ors = [`item_code.ilike.%${term}%`, `title.ilike.%${term}%`, `note.ilike.%${term}%`];
      if (ids.length) ors.push(`student_profile_id.in.(${ids.join(",")})`);
      query = query.or(ors.join(","));
    }

    const { data: items, error } = await query;
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });

const recordInput = z.object({
  id: z.string().uuid().optional(),
  student_profile_id: z.string().uuid(),
  location_id: z.string().uuid().nullable().optional(),
  item_code: z.string().max(80).nullable().optional(),
  doc_kind: z.string().max(120).nullable().optional(),
  title: z.string().min(1).max(300),
  quantity: z.number().int().min(1).max(9999).optional(),
  condition: z.string().max(200).nullable().optional(),
  stored_at: z.string().max(20).nullable().optional(),
  note: z.string().max(4000).nullable().optional(),
});

export const upsertArchiveRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => recordInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    await assertStudentDepartment(context, data.student_profile_id, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims as any)?.email ?? null;
    const payload: Record<string, any> = { ...data };
    delete payload.id;
    if (!payload.item_code) delete payload.item_code;
    if (!payload.stored_at) delete payload.stored_at;

    if (data.id) {
      const { data: before } = await supabaseAdmin
        .from("student_archive_records")
        .select("location_id, student_profile_id")
        .eq("id", data.id)
        .maybeSingle();
      if (!before) throw new Error("Không tìm thấy phiếu lưu trữ");
      await assertStudentDepartment(context, before.student_profile_id, true);
      const { error } = await supabaseAdmin
        .from("student_archive_records")
        .update(payload as any)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("student_archive_movements").insert({
        record_id: data.id,
        action: "update",
        from_location_id: before?.location_id ?? null,
        to_location_id: data.location_id ?? before?.location_id ?? null,
        actor_id: context.userId,
        actor_email: email,
        note: "Cập nhật thông tin phiếu lưu trữ",
      });
      return { id: data.id };
    }

    payload.stored_by = context.userId;
    payload.stored_by_email = email;
    payload.status = "stored";
    const { data: row, error } = await supabaseAdmin
      .from("student_archive_records")
      .insert(payload as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("student_archive_movements").insert({
      record_id: row!.id,
      action: "store",
      to_location_id: data.location_id ?? null,
      actor_id: context.userId,
      actor_email: email,
      note: "Nhập kho",
    });
    const { logStudentActivity } = await import("@/lib/students/activity.server");
    await logStudentActivity({
      student_profile_id: data.student_profile_id,
      action: "archive_store",
      actor_id: context.userId,
      actor_email: email,
      entity: "student_archive_records",
      entity_id: row!.id,
      field: data.doc_kind ?? "Hồ sơ giấy",
      new_value: data.title,
      note: data.note ?? null,
    });
    return { id: row!.id };
  });


export const archiveRecordAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["borrow", "return", "move", "remove"]),
        location_id: z.string().uuid().nullable().optional(),
        borrower_name: z.string().max(200).nullable().optional(),
        due_date: z.string().max(20).nullable().optional(),
        note: z.string().max(2000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWrite(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims as any)?.email ?? null;
    const today = new Date().toISOString().slice(0, 10);

    const { data: before, error: e0 } = await supabaseAdmin
      .from("student_archive_records")
      .select("location_id, status, student_profile_id, title")

      .eq("id", data.id)
      .maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!before) throw new Error("Không tìm thấy phiếu lưu trữ");
    await assertStudentDepartment(context, before.student_profile_id, true);

    const patch: Record<string, any> = {};
    if (data.action === "borrow") {
      patch.status = "borrowed";
      patch.borrower_name = data.borrower_name ?? null;
      patch.borrowed_at = today;
      patch.due_date = data.due_date ?? null;
      patch.returned_at = null;
    } else if (data.action === "return") {
      patch.status = "returned";
      patch.returned_at = today;
    } else if (data.action === "move") {
      patch.location_id = data.location_id ?? null;
      patch.status = before.status === "removed" ? "stored" : before.status;
    } else {
      patch.status = "removed";
    }

    const { error } = await supabaseAdmin
      .from("student_archive_records")
      .update(patch as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("student_archive_movements").insert({
      record_id: data.id,
      action: data.action,
      from_location_id: before.location_id ?? null,
      to_location_id:
        data.action === "move" ? (data.location_id ?? null) : (before.location_id ?? null),
      actor_id: context.userId,
      actor_email: email,
      note: data.note ?? null,
    });
    if (before.student_profile_id) {
      const ACTION_VI: Record<string, string> = {
        borrow: "Cho mượn",
        return: "Nhận lại",
        move: "Chuyển vị trí",
        remove: "Rút khỏi kho",
      };
      const { logStudentActivity } = await import("@/lib/students/activity.server");
      await logStudentActivity({
        student_profile_id: before.student_profile_id,
        action: "archive_move",
        actor_id: context.userId,
        actor_email: email,
        entity: "student_archive_records",
        entity_id: data.id,
        field: before.title ?? "Hồ sơ giấy",
        old_value: before.status,
        new_value: ACTION_VI[data.action] ?? data.action,
        note: data.note ?? null,
      });
    }
    return { ok: true };
  });


export const listArchiveMovements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ record_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRead(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: record } = await supabaseAdmin.from("student_archive_records").select("student_profile_id").eq("id", data.record_id).maybeSingle();
    if (!record) throw new Error("Không tìm thấy phiếu lưu trữ");
    await assertStudentDepartment(context, record.student_profile_id);
    const { data: items, error } = await supabaseAdmin
      .from("student_archive_movements")
      .select("*, from:from_location_id(code, name), to:to_location_id(code, name)")
      .eq("record_id", data.record_id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });

export const canManageArchive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAccess } = await import("@/lib/rbac/guard");
    const a = await getAccess(context);
    return { canRead: a.can("students.archive"), canWrite: a.can("students.archive.edit") };
  });
