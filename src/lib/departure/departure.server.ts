/**
 * Helper chỉ chạy phía máy chủ cho module Quản lý xuất cảnh:
 * đọc file Excel người dùng tải lên và dựng file Excel xuất ra đúng mẫu.
 */
import {
  TEMPLATE_HEADERS,
  TEMPLATE_KEYS,
  fromTemplateCell,
  toTemplateCell,
  type DepartureRecord,
  type TemplateKey,
} from "./fields";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

const HEADER_ALIAS: Record<string, TemplateKey> = {};
TEMPLATE_HEADERS.forEach((h, i) => {
  HEADER_ALIAS[norm(h)] = TEMPLATE_KEYS[i]!;
});

export type ParsedRow = {
  row: number;
  values: Record<string, string | boolean | null>;
  errors: string[];
};

/** Đọc file .xls/.xlsx đã mã hoá base64, trả về các dòng đã chuẩn hoá + lỗi. */
export async function parseTemplateWorkbook(base64: string): Promise<ParsedRow[]> {
  const XLSX = await import("xlsx");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const wb = XLSX.read(bytes, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName]!;
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  if (matrix.length === 0) return [];

  const header = (matrix[0] ?? []).map((c) => norm(String(c ?? "")));
  const colOf: Partial<Record<TemplateKey, number>> = {};
  header.forEach((h, i) => {
    const key = HEADER_ALIAS[h];
    if (key && colOf[key] === undefined) colOf[key] = i;
  });

  const out: ParsedRow[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const raw = matrix[r] ?? [];
    if (raw.every((c) => String(c ?? "").trim() === "")) continue;
    const values: Record<string, string | boolean | null> = {};
    for (const key of TEMPLATE_KEYS) {
      const idx = colOf[key];
      values[key] = fromTemplateCell(key, idx === undefined ? "" : raw[idx]);
    }
    const errors: string[] = [];
    if (!values["id_no"]) errors.push("Thiếu số căn cước");
    if (!values["full_name"]) errors.push("Thiếu họ và tên");
    if (!values["dob"]) errors.push("Thiếu hoặc sai định dạng ngày sinh");
    if (!values["phone"]) errors.push("Thiếu số điện thoại");
    out.push({ row: r + 1, values, errors });
  }
  return out;
}

/** Dựng file Excel 21 cột đúng mẫu (có định dạng nhận diện Kaizen). */
export async function buildTemplateWorkbook(
  records: Array<Partial<DepartureRecord>>,
): Promise<Uint8Array> {
  const { buildStyledWorkbook } = await import("@/lib/students/xlsx-report.server");
  const rows = records.map((rec) => TEMPLATE_KEYS.map((k) => toTemplateCell(rec, k)));
  return buildStyledWorkbook([
    {
      name: "NguoiLaoDong",
      title: "DANH SÁCH NGƯỜI LAO ĐỘNG XUẤT CẢNH",
      subtitle: `Số bản ghi: ${records.length} · Xuất ngày ${new Date().toLocaleDateString("vi-VN")}`,
      kind: "table",
      headers: [...TEMPLATE_HEADERS],
      rows,
      footer: "Quy ước: Giới tính 1 = Nam, 0 = Nữ · Hôn nhân 1 = Đã kết hôn, 0 = Độc thân · Y/N = Có/Không · Ngày dạng dd-mm-yyyy",
    },
  ]);
}

/** File mẫu trống (21 cột) kèm 1 dòng ví dụ và trang hướng dẫn quy ước điền. */
export async function buildBlankTemplateWorkbook(): Promise<Uint8Array> {
  const { buildStyledWorkbook } = await import("@/lib/students/xlsx-report.server");
  const sample: Record<string, string> = {
    id_no: "001099012345",
    id_issue_date: "01-06-2021",
    passport_no: "C1234567",
    passport_issue_date: "15-08-2023",
    full_name: "NGUYEN VAN A",
    gender: "1",
    dob: "20-05-1999",
    marital_status: "0",
    place_of_birth: "Thanh Hoá",
    phone: "0912345678",
    current_address: "Số 1, đường A",
    province: "Thanh Hoá",
    ward: "Phường Đông Sơn",
    ethnicity: "Kinh",
    religion: "Không",
    education_level: "THPT",
    worked_abroad: "N",
    land_lost: "N",
    poor_household: "N",
    veteran: "N",
    ethnic_minority: "N",
  };
  return buildStyledWorkbook([
    {
      name: "NguoiLaoDong",
      title: "MẪU DANH SÁCH NGƯỜI LAO ĐỘNG XUẤT CẢNH",
      subtitle: "Điền dữ liệu từ dòng dưới dòng ví dụ. Không đổi tên/thứ tự cột.",
      kind: "table",
      headers: [...TEMPLATE_HEADERS],
      rows: [TEMPLATE_KEYS.map((k) => sample[k] ?? "")],
      footer:
        "Quy ước: Giới tính 1 = Nam, 0 = Nữ · Hôn nhân 1 = Đã kết hôn, 0 = Độc thân · Y/N = Có/Không · Ngày dạng dd-mm-yyyy · Cột có (*) là bắt buộc",
    },
    {
      name: "HuongDan",
      title: "HƯỚNG DẪN ĐIỀN FILE MẪU",
      kind: "table",
      headers: ["Cột", "Bắt buộc", "Định dạng / quy ước"],
      rows: [
        ["Số căn cước (*)", "Có", "Chuỗi số, không dấu cách; dùng để chống trùng khi nhập"],
        ["Ngày cấp căn cước", "Không", "dd-mm-yyyy"],
        ["Số hộ chiếu", "Không", "Ví dụ C1234567"],
        ["Ngày cấp hộ chiếu", "Không", "dd-mm-yyyy"],
        ["Họ và tên (*)", "Có", "Viết hoa không dấu theo hộ chiếu"],
        ["Giới tính (*)", "Có", "1 = Nam · 0 = Nữ"],
        ["Ngày sinh (*)", "Có", "dd-mm-yyyy"],
        ["Hôn nhân", "Không", "1 = Đã kết hôn · 0 = Độc thân"],
        ["Nơi sinh (*)", "Có", "Tỉnh/thành nơi sinh"],
        ["Số điện thoại (*)", "Có", "Số Việt Nam, ví dụ 0912345678"],
        ["Nơi ở hiện tại (*)", "Có", "Địa chỉ chi tiết"],
        ["Tỉnh/Thành phố (*)", "Có", "Tên đầy đủ theo danh mục hành chính"],
        ["Phường/Xã (*)", "Có", "Tên đầy đủ theo danh mục hành chính"],
        ["Dân tộc", "Không", "Ví dụ Kinh"],
        ["Tôn giáo", "Không", "Ví dụ Không"],
        ["Trình độ chuyên môn", "Không", "THPT / Trung cấp / Cao đẳng / Đại học"],
        ["Đã từng làm việc ở nước ngoài", "Không", "Y = Có · N = Không"],
        ["Mất đất", "Không", "Y = Có · N = Không"],
        ["Hộ nghèo, cận nghèo", "Không", "Y = Có · N = Không"],
        ["Bồ đội xuất ngũ", "Không", "Y = Có · N = Không"],
        ["Dân tộc thiểu số", "Không", "Y = Có · N = Không"],
      ],
      footer: "Lưu file dạng .xlsx trước khi tải lên hệ thống.",
    },
  ]);
}
