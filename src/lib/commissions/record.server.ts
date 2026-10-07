import { resolveCollaborator } from "./commissions.server";

/** Gắn CTV vào hồ sơ và tạo khoản hoa hồng Chờ duyệt. */
export async function recordCommission(
  supabaseAdmin: any,
  input: {
    student_profile_id: string;
    collaborator_code: string;
    order_title?: string;
    order_revenue?: number;
    commission_amount?: number;
    note?: string;
    actor: string;
  },
) {
  const c = await resolveCollaborator(supabaseAdmin, input.collaborator_code);
  const { data: student } = await supabaseAdmin
    .from("student_profiles").select("id, program, program_type").eq("id", input.student_profile_id).maybeSingle();
  if (!student) throw new Error("Không tìm thấy hồ sơ học viên");
  await supabaseAdmin.from("student_profiles")
    .update({ collaborator_id: c.id, collaborator_code: c.collaborator_code, updated_by: input.actor })
    .eq("id", student.id);
  const { data, error } = await supabaseAdmin.from("collaborator_commissions").insert({
    collaborator_id: c.id,
    collaborator_code: c.collaborator_code,
    student_profile_id: student.id,
    order_title: input.order_title || student.program || null,
    program_type: student.program_type,
    order_revenue: input.order_revenue ?? 0,
    commission_amount: input.commission_amount ?? 0,
    note: input.note || null,
    created_by: input.actor,
  }).select("id").single();
  if (error) throw new Error("Không ghi nhận được hoa hồng");
  return data.id as string;
}
