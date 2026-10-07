/**
 * Quản lý xuất cảnh — định nghĩa dùng chung (client-safe).
 * 21 cột theo đúng mẫu Template_NguoiLaoDong của cơ quan quản lý lao động.
 */

export type DepartureRecord = {
  id: string;
  student_profile_id: string | null;
  batch_id: string | null;
  id_no: string;
  id_issue_date: string | null;
  passport_no: string | null;
  passport_issue_date: string | null;
  full_name: string;
  gender: string;
  dob: string | null;
  marital_status: string | null;
  place_of_birth: string | null;
  phone: string | null;
  current_address: string | null;
  province: string | null;
  ward: string | null;
  ethnicity: string | null;
  religion: string | null;
  education_level: string | null;
  worked_abroad: boolean;
  land_lost: boolean;
  poor_household: boolean;
  veteran: boolean;
  ethnic_minority: boolean;
  destination_country: string | null;
  dossier_code?: string | null;
  program_type?: string | null;
  contract_type?: string | null;
  occupation: string | null;
  employer_name: string | null;
  planned_departure_date: string | null;
  actual_departure_date: string | null;
  flight_no: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  student_profiles?: { id: string; student_code: string | null; full_name: string | null } | null;
  departure_batches?: { id: string; name: string } | null;
};

export const DEPARTURE_STATUS: Record<string, string> = {
  planned: "Dự kiến xuất cảnh",
  departed: "Đã xuất cảnh",
  postponed: "Hoãn",
  cancelled: "Huỷ",
};

/** Loại chương trình trong mã hồ sơ xuất cảnh. */
export const PROGRAM_TYPE_LABEL: Record<string, string> = {
  LD: "Lao động",
  DH: "Du học",
};

/** Loại hợp đồng trong mã hồ sơ xuất cảnh. */
export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  HD: "Hợp đồng đưa đi",
  TV: "Tư vấn, dịch vụ",
};

export const GENDER_LABEL: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
};

export const MARITAL_LABEL: Record<string, string> = {
  single: "Độc thân",
  married: "Đã kết hôn",
};

/** Tên cột đúng thứ tự file mẫu. */
export const TEMPLATE_HEADERS = [
  "Số căn cước (*)",
  "Ngày cấp căn cước",
  "Số hộ chiếu",
  "Ngày cấp hộ chiếu",
  "Họ và tên (*)",
  "Giới tính (*)",
  "Ngày sinh (*)",
  "Hôn nhân",
  "Nơi sinh (*)",
  "Số điện thoại (*)",
  "Nơi ở hiện tại (*)",
  "Tỉnh/Thành phố (*)",
  "Phường/Xã (*)",
  "Dân tộc",
  "Tôn giáo",
  "Trình độ chuyên môn",
  "Đã từng làm việc ở nước ngoài",
  "Mất đất",
  "Hộ nghèo, cận nghèo",
  "Bồ đội xuất ngũ",
  "Dân tộc thiểu số",
] as const;

/** Khoá cột nội bộ tương ứng từng cột mẫu (cùng thứ tự). */
export const TEMPLATE_KEYS = [
  "id_no",
  "id_issue_date",
  "passport_no",
  "passport_issue_date",
  "full_name",
  "gender",
  "dob",
  "marital_status",
  "place_of_birth",
  "phone",
  "current_address",
  "province",
  "ward",
  "ethnicity",
  "religion",
  "education_level",
  "worked_abroad",
  "land_lost",
  "poor_household",
  "veteran",
  "ethnic_minority",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

const DATE_KEYS = new Set<TemplateKey>(["id_issue_date", "passport_issue_date", "dob"]);
const BOOL_KEYS = new Set<TemplateKey>([
  "worked_abroad",
  "land_lost",
  "poor_household",
  "veteran",
  "ethnic_minority",
]);

/** yyyy-mm-dd → dd-mm-yyyy (định dạng mẫu). */
export function toTemplateDate(v: string | null | undefined): string {
  if (!v) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v);
}

/** dd-mm-yyyy | dd/mm/yyyy | yyyy-mm-dd | số serial Excel → yyyy-mm-dd. */
export function parseTemplateDate(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  return null;
}

/** Giá trị một ô theo quy ước mẫu: giới tính 1/0, hôn nhân 1/0, Y/N. */
export function toTemplateCell(rec: Partial<DepartureRecord>, key: TemplateKey): string {
  if (DATE_KEYS.has(key)) return toTemplateDate(rec[key] as string | null);
  if (BOOL_KEYS.has(key)) return rec[key] ? "Y" : "N";
  if (key === "gender") return rec.gender === "female" ? "0" : "1";
  if (key === "marital_status") {
    if (!rec.marital_status) return "";
    return rec.marital_status === "married" ? "1" : "0";
  }
  const v = rec[key];
  return v === null || v === undefined ? "" : String(v);
}

/** Chuẩn hoá một ô đọc từ file Excel về giá trị lưu trong hệ thống. */
export function fromTemplateCell(key: TemplateKey, raw: unknown): string | boolean | null {
  const s = raw === null || raw === undefined ? "" : String(raw).trim();
  if (DATE_KEYS.has(key)) return parseTemplateDate(raw);
  if (BOOL_KEYS.has(key)) return /^(y|yes|1|có|co|true|x)$/i.test(s);
  if (key === "gender") {
    if (/^(0|nữ|nu|female|f)$/i.test(s)) return "female";
    return "male";
  }
  if (key === "marital_status") {
    if (!s) return null;
    if (/^(1|đã kết hôn|da ket hon|married)$/i.test(s)) return "married";
    return "single";
  }
  return s || null;
}
