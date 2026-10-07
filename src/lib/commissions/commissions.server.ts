/** Tra mã CTV (KZ-CTV-...) hoặc báo lỗi tiếng Việt. Chỉ dùng phía máy chủ. */
export async function resolveCollaborator(supabaseAdmin: any, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const { data, error } = await supabaseAdmin
    .from("sales_agents")
    .select("id, collaborator_code, display_name, is_active")
    .eq("collaborator_code", code)
    .maybeSingle();
  if (error) throw new Error("Không thể kiểm tra mã cộng tác viên");
  if (!data) throw new Error(`Mã cộng tác viên "${code}" không tồn tại`);
  if (!data.is_active) throw new Error(`Cộng tác viên ${code} đã ngừng hoạt động`);
  return data as { id: string; collaborator_code: string; display_name: string | null; is_active: boolean };
}
