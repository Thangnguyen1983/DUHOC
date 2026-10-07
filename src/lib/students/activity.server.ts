/**
 * Sổ nhật ký trách nhiệm hồ sơ học viên.
 * Mọi thao tác nghiệp vụ trên hồ sơ đều ghi thêm một dòng ở đây (best-effort,
 * không được phép làm hỏng nghiệp vụ chính).
 */

export type ActivityEntry = {
  student_profile_id: string;
  action: string;
  actor_id?: string | null;
  actor_email?: string | null;
  actor_roles?: string[];
  source?: "user" | "system";
  stage?: string | null;
  entity?: string | null;
  entity_id?: string | null;
  field?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  note?: string | null;
  meta?: Record<string, unknown>;
};

const trim = (v: unknown, max = 500): string | null => {
  if (v === null || v === undefined || v === "") return null;
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > max ? s.slice(0, max) + "…" : s;
};

/** Ghi 1 hoặc nhiều dòng nhật ký. Không throw ra ngoài. */
export async function logStudentActivity(entries: ActivityEntry | ActivityEntry[]) {
  const list = Array.isArray(entries) ? entries : [entries];
  if (list.length === 0) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = list.map((e) => ({
      student_profile_id: e.student_profile_id,
      actor_id: e.actor_id ?? null,
      actor_email: trim(e.actor_email, 200),
      actor_roles: e.actor_roles ?? [],
      source: e.source ?? (e.actor_id ? "user" : "system"),
      stage: trim(e.stage, 64),
      action: e.action,
      entity: trim(e.entity, 64),
      entity_id: trim(e.entity_id, 100),
      field: trim(e.field, 100),
      old_value: trim(e.old_value, 1000),
      new_value: trim(e.new_value, 1000),
      note: trim(e.note, 2000),
      meta: e.meta ?? {},
    }));
    await supabaseAdmin.from("student_activity_logs").insert(rows as never);
  } catch (err) {
    console.error("[activity-log]", err);
  }
}

/** Tạo dòng nhật ký từ context của server function đã xác thực. */
export function actorFrom(context: { userId: string; claims?: any }) {
  return {
    actor_id: context.userId,
    actor_email: (context.claims?.email as string | undefined) ?? null,
    source: "user" as const,
  };
}

/** So sánh dữ liệu cũ / mới, trả về danh sách trường thay đổi. */
export function diffFields(
  before: Record<string, any> | null | undefined,
  patch: Record<string, any>,
  labels: Record<string, string> = {},
) {
  const out: Array<{ field: string; old_value: string | null; new_value: string | null }> = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const oldV = before ? before[k] : undefined;
    const norm = (x: any) => (x === null || x === undefined || x === "" ? null : String(x));
    if (norm(oldV) === norm(v)) continue;
    out.push({ field: labels[k] ?? k, old_value: norm(oldV), new_value: norm(v) });
  }
  return out;
}
