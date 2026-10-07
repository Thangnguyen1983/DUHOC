/**
 * Đồng bộ danh mục địa danh hành chính Việt Nam (mô hình 2 cấp) từ nguồn chuẩn.
 * Dùng chung cho nút "Cập nhật danh sách chuẩn" và lịch chạy ngầm hàng tuần.
 * Chỉ thêm mới / cập nhật tên & loại đơn vị — KHÔNG ghi đè is_active / merged_note do người dùng đặt.
 */

const GEO_SOURCE_URL = "https://provinces.open-api.vn/api/v2/?depth=2";
const SOURCE_LABEL = "provinces.open-api.vn v2 (mô hình 2 cấp)";

type SourceWard = { code: number; name: string; division_type: string; codename: string };
type SourceProvince = SourceWard & { wards: SourceWard[] };

export async function runGeoSync(triggerSource: "manual" | "cron") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: log } = await supabaseAdmin
    .from("catalog_sync_logs")
    .insert({ kind: "geo", trigger_source: triggerSource, status: "running" })
    .select("id")
    .maybeSingle();
  const logId = (log as any)?.id as string | undefined;

  const finish = async (patch: Record<string, unknown>) => {
    if (!logId) return;
    await supabaseAdmin
      .from("catalog_sync_logs")
      .update({ ...patch, finished_at: new Date().toISOString() })
      .eq("id", logId);
  };

  try {
    const res = await fetch(GEO_SOURCE_URL);
    if (!res.ok) throw new Error("Không tải được danh sách địa danh chuẩn, vui lòng thử lại sau");
    const list = (await res.json()) as SourceProvince[];
    if (!Array.isArray(list) || list.length === 0) throw new Error("Nguồn dữ liệu địa danh trả về rỗng");

    const now = new Date().toISOString();
    const strip = (n: string) => n.replace(/^(Thành phố|Tỉnh)\s+/i, "");

    const provinces = list.map((p, i) => ({
      code: String(p.code),
      name: p.name,
      short_name: strip(p.name),
      division_type: p.division_type,
      codename: p.codename,
      sort_order: i,
      source: SOURCE_LABEL,
      synced_at: now,
    }));
    const { error: pErr } = await supabaseAdmin
      .from("catalog_provinces")
      .upsert(provinces, { onConflict: "code" });
    if (pErr) throw new Error(pErr.message);

    const wards: any[] = [];
    list.forEach((p) =>
      p.wards.forEach((w, i) =>
        wards.push({
          code: String(w.code),
          name: w.name,
          province_code: String(p.code),
          division_type: w.division_type,
          codename: w.codename,
          sort_order: i,
          source: SOURCE_LABEL,
          synced_at: now,
        }),
      ),
    );
    for (let i = 0; i < wards.length; i += 500) {
      const { error: wErr } = await supabaseAdmin
        .from("catalog_wards")
        .upsert(wards.slice(i, i + 500), { onConflict: "code" });
      if (wErr) throw new Error(wErr.message);
    }

    await finish({ status: "success", provinces_count: provinces.length, wards_count: wards.length });
    return { provinces: provinces.length, wards: wards.length, syncedAt: now };
  } catch (e: any) {
    await finish({ status: "error", error: String(e?.message ?? e).slice(0, 1000) });
    throw e;
  }
}
