/**
 * Bộ tài liệu đạt chuẩn giảng dạy & chế độ Trình chiếu lớp học.
 * Dùng lại learning_materials + bucket lesson-materials + phạm vi thị trường (scope.server).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF = ["admin", "training_manager", "training_staff"] as const;
const TEACH = ["admin", "training_manager", "training_staff", "teacher"] as const;

export const MATERIAL_TYPES = [
  { value: "slide", label: "Slide bài giảng" },
  { value: "pdf", label: "Giáo trình PDF" },
  { value: "audio", label: "Audio luyện nghe" },
  { value: "video", label: "Video" },
  { value: "image", label: "Hình ảnh / bảng biểu" },
  { value: "document", label: "Tài liệu khác" },
] as const;

export const APPROVAL_LABEL: Record<string, string> = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

async function getRoles(supabase: any, userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role);
}
async function assertRole(ctx: { supabase: any; userId: string }, allowed: readonly string[]) {
  const roles = await getRoles(ctx.supabase, ctx.userId);
  if (!roles.some((r) => allowed.includes(r))) throw new Error("Forbidden");
  return roles;
}

/** Suy ra loại tài liệu từ tên file / MIME. */
export function inferMaterialType(fileName?: string | null, mime?: string | null): string {
  const n = (fileName ?? "").toLowerCase();
  const m = (mime ?? "").toLowerCase();
  if (/\.(pptx?|key|odp)$/.test(n) || m.includes("presentation")) return "slide";
  if (n.endsWith(".pdf") || m === "application/pdf") return "pdf";
  if (m.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/.test(n)) return "audio";
  if (m.startsWith("video/") || /\.(mp4|webm|mov)$/.test(n)) return "video";
  if (m.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(n)) return "image";
  return "document";
}

/* ============ DUYỆT TÀI LIỆU ============ */
export const submitMaterialForApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, TEACH);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("learning_materials").select("id, created_by, approval_status, file_path, market_code, material_type").eq("id", data.id).maybeSingle();
    if (!m) throw new Error("Không tìm thấy tài liệu");
    const roles = await getRoles(context.supabase, context.userId);
    const isStaff = roles.some((r) => STAFF.includes(r as any));
    if (!isStaff && m.created_by !== context.userId) throw new Error("Chỉ người tạo mới được gửi duyệt");
    if (!m.file_path) throw new Error("Tài liệu chưa có file đính kèm");
    if (!m.market_code) throw new Error("Chưa chọn thị trường — tài liệu chưa đạt chuẩn");
    const { error } = await supabaseAdmin.from("learning_materials").update({ approval_status: "pending", rejection_reason: null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("material_approval_logs").insert({ material_id: data.id, action: "submit", from_status: m.approval_status, to_status: "pending", actor_id: context.userId });
    return { ok: true };
  });

export const reviewMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    note: z.string().max(1000).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, STAFF);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("learning_materials").select("approval_status").eq("id", data.id).maybeSingle();
    if (!m) throw new Error("Không tìm thấy tài liệu");
    if (data.decision === "rejected" && !data.note?.trim()) throw new Error("Cần ghi lý do từ chối");
    const patch: any = data.decision === "approved"
      ? { approval_status: "approved", approved_by: context.userId, approved_at: new Date().toISOString(), rejection_reason: null }
      : { approval_status: "rejected", approved_by: null, approved_at: null, rejection_reason: data.note };
    const { error } = await supabaseAdmin.from("learning_materials").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("material_approval_logs").insert({ material_id: data.id, action: data.decision === "approved" ? "approve" : "reject", from_status: m.approval_status, to_status: data.decision, note: data.note ?? null, actor_id: context.userId });
    return { ok: true };
  });

export const listPendingMaterials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context, STAFF);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("learning_materials")
      .select("*, training_programs(name), training_classes(name)")
      .eq("approval_status", "pending")
      .order("updated_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getMaterialHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, TEACH);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items } = await supabaseAdmin.from("material_approval_logs").select("*").eq("material_id", data.id).order("created_at", { ascending: false }).limit(50);
    return { items: items ?? [] };
  });

/* ============ KHUNG CHƯƠNG TRÌNH CHUẨN ============ */
export const listCurriculumTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context, TEACH);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("curriculum_templates").select("*, curriculum_template_items(*)").eq("is_active", true).order("market_code");
    if (error) throw new Error(error.message);
    return {
      items: (data ?? []).map((t: any) => ({
        ...t,
        curriculum_template_items: [...(t.curriculum_template_items ?? [])].sort((a: any, b: any) => a.lesson_no - b.lesson_no),
      })),
    };
  });

/**
 * Độ phủ tài liệu chuẩn theo khung chương trình: từng buổi đã có đủ loại tài liệu
 * bắt buộc (đã duyệt) hay chưa — tính trên tài liệu của lớp/chương trình + tài liệu
 * chung của thị trường.
 */
export const getCurriculumCoverage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ template_id: z.string().uuid(), class_id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertRole(context, TEACH);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tpl } = await supabaseAdmin.from("curriculum_templates").select("*, curriculum_template_items(*)").eq("id", data.template_id).maybeSingle();
    if (!tpl) throw new Error("Không tìm thấy khung chương trình");

    let cls: any = null;
    if (data.class_id) {
      const { data: c } = await supabaseAdmin.from("training_classes").select("id, program_id, market").eq("id", data.class_id).maybeSingle();
      cls = c;
      const { getTeachingScope, assertInScope } = await import("./scope.server");
      const scope = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
      if (!scope.scopeAll) assertInScope(scope, { class_id: data.class_id, program_id: cls?.program_id });
    }

    let q = supabaseAdmin.from("learning_materials").select("id, title, lesson_no, material_type, approval_status, class_id, program_id, market_code, curriculum_slot_id").eq("market_code", tpl.market_code);
    const { data: mats } = await q;
    const relevant = (mats ?? []).filter((m: any) => {
      if (!cls) return true;
      return (!m.class_id && !m.program_id) || m.class_id === cls.id || (m.program_id && m.program_id === cls.program_id);
    });

    const items = [...(tpl.curriculum_template_items ?? [])].sort((a: any, b: any) => a.lesson_no - b.lesson_no).map((slot: any) => {
      const own = relevant.filter((m: any) => m.curriculum_slot_id === slot.id || (!m.curriculum_slot_id && m.lesson_no === slot.lesson_no));
      const approved = own.filter((m: any) => m.approval_status === "approved");
      const have = new Set(approved.map((m: any) => m.material_type));
      const missing = (slot.required_types ?? []).filter((t: string) => !have.has(t));
      return { slot, materials: own, missing, complete: missing.length === 0 };
    });
    const done = items.filter((i) => i.complete).length;
    return { template: { id: tpl.id, name: tpl.name, market_code: tpl.market_code, level: tpl.level }, items, done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 };
  });

/* ============ TRÌNH CHIẾU LỚP HỌC ============ */
/** Danh sách lớp được phép trình chiếu (theo phạm vi giáo viên). */
export const listPresentableClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertRole(context, TEACH);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getTeachingScope } = await import("./scope.server");
    const scope = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
    let q = supabaseAdmin.from("training_classes").select("id, code, name, market, status, program_id, training_programs(name, level)").neq("status", "cancelled").order("name");
    if (!scope.scopeAll) {
      if (scope.classIds.length === 0) return { items: [] };
      q = q.in("id", scope.classIds);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { items: (data ?? []).map((c: any) => ({ ...c, own: scope.ownClassIds.includes(c.id) })) };
  });

/**
 * Bộ tài liệu trình chiếu cho 1 lớp (+ buổi học tuỳ chọn): tài liệu của lớp,
 * chương trình và thị trường, kèm signed URL 1 giờ. Giáo viên thấy nháp của mình;
 * tài liệu người khác chỉ khi đã duyệt.
 */
export const getPresentationDeck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ class_id: z.string().uuid(), session_id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertRole(context, TEACH);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cls } = await supabaseAdmin.from("training_classes").select("id, code, name, market, program_id, training_programs(name, level, market)").eq("id", data.class_id).maybeSingle();
    if (!cls) throw new Error("Không tìm thấy lớp");
    const { getTeachingScope, assertInScope } = await import("./scope.server");
    const scope = await getTeachingScope(supabaseAdmin as any, context.userId, roles);
    if (!scope.scopeAll) assertInScope(scope, { class_id: cls.id, program_id: cls.program_id });

    const market = (cls as any).market ?? (cls as any).training_programs?.market ?? null;
    const { data: sessions } = await supabaseAdmin.from("training_sessions").select("id, session_no, title, topic, session_date").eq("class_id", cls.id).order("session_no");
    const session = data.session_id ? (sessions ?? []).find((s: any) => s.id === data.session_id) ?? null : null;

    const ors = [`class_id.eq.${cls.id}`];
    if (cls.program_id) ors.push(`program_id.eq.${cls.program_id}`);
    if (market) ors.push(`and(market_code.eq.${market},class_id.is.null,program_id.is.null)`);
    const { data: mats, error } = await supabaseAdmin
      .from("learning_materials")
      .select("id, title, description, category, material_type, lesson_no, file_name, file_path, file_type, file_size, pdf_companion_path, approval_status, created_by, class_id, program_id, market_code, version")
      .or(ors.join(","))
      .not("file_path", "is", null)
      .order("lesson_no", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const visible = (mats ?? []).filter((m: any) => m.approval_status === "approved" || m.created_by === context.userId);
    const ordered = session
      ? [...visible].sort((a: any, b: any) => Number(b.lesson_no === session.session_no) - Number(a.lesson_no === session.session_no))
      : visible;

    const items = await Promise.all(ordered.map(async (m: any) => {
      const [{ data: s1 }, s2] = await Promise.all([
        supabaseAdmin.storage.from("lesson-materials").createSignedUrl(m.file_path, 3600),
        m.pdf_companion_path ? supabaseAdmin.storage.from("lesson-materials").createSignedUrl(m.pdf_companion_path, 3600) : Promise.resolve({ data: null } as any),
      ]);
      return { ...m, url: s1?.signedUrl ?? null, pdf_url: s2?.data?.signedUrl ?? null, forSession: session ? m.lesson_no === session.session_no : false };
    }));

    return { class: cls, market, sessions: sessions ?? [], session, items: items.filter((i) => i.url) };
  });

export const logPresentation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    class_id: z.string().uuid(),
    session_id: z.string().uuid().nullable().optional(),
    material_id: z.string().uuid().nullable().optional(),
    ended: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context, TEACH);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id && data.ended) {
      const { data: row } = await supabaseAdmin.from("class_presentation_logs").select("started_at").eq("id", data.id).eq("teacher_id", context.userId).maybeSingle();
      if (!row) return { id: data.id };
      const ended = new Date();
      const secs = Math.max(0, Math.round((ended.getTime() - new Date(row.started_at).getTime()) / 1000));
      await supabaseAdmin.from("class_presentation_logs").update({ ended_at: ended.toISOString(), duration_seconds: secs }).eq("id", data.id);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("class_presentation_logs").insert({
      class_id: data.class_id, session_id: data.session_id ?? null, material_id: data.material_id ?? null, teacher_id: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
