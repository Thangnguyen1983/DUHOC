/**
 * Danh mục báo cáo dùng chung cho Trung tâm báo cáo (/admin/bao-cao).
 * File client-safe: chỉ chứa metadata, không truy vấn dữ liệu.
 */
import type { Permission } from "@/lib/rbac/permissions";

export const REPORT_KEYS = [
  "students.status",
  "students.visa",
  "students.program",
  "students.market",
  "documents.stage",
  "workflow.step",
  "leads.status",
  "leads.source",
  "orders.revenue",
  "attendance.summary",
  "grades.summary",
  "departure.records",
  "archive.records",
  "audit.activity",
] as const;

export type ReportKey = (typeof REPORT_KEYS)[number];

export type ReportMeta = {
  key: ReportKey;
  title: string;
  group: string;
  desc: string;
  permission: Permission;
};

export const REPORTS: ReportMeta[] = [
  { key: "students.status", title: "Học viên theo trạng thái", group: "Học viên & hồ sơ", desc: "Toàn bộ hồ sơ học viên theo trạng thái xử lý", permission: "students.view" },
  { key: "students.program", title: "Học viên theo chương trình", group: "Học viên & hồ sơ", desc: "Phân loại du học / XKLĐ / ngoại ngữ", permission: "students.view" },
  { key: "students.market", title: "Thị trường / nước đến", group: "Học viên & hồ sơ", desc: "Học viên theo thị trường và nước đến", permission: "students.view" },
  { key: "documents.stage", title: "Hồ sơ còn thiếu theo giai đoạn", group: "Học viên & hồ sơ", desc: "Checklist bắt buộc chưa hoàn tất", permission: "students.view" },
  { key: "workflow.step", title: "Workflow đang chạy theo bước", group: "Học viên & hồ sơ", desc: "Tiến trình 18 bước đang mở", permission: "workflow.view" },
  { key: "students.visa", title: "Hồ sơ visa", group: "Visa & Xuất cảnh", desc: "Trạng thái visa và thời gian xử lý", permission: "visa.view" },
  { key: "departure.records", title: "Danh sách xuất cảnh", group: "Visa & Xuất cảnh", desc: "Người lao động theo đợt và thời điểm xuất cảnh", permission: "departure.view" },
  { key: "leads.status", title: "Lead theo trạng thái", group: "Tuyển sinh & Marketing", desc: "Khách hàng tiềm năng và người tiếp nhận", permission: "leads.view" },
  { key: "leads.source", title: "Lead theo nguồn / chiến dịch", group: "Tuyển sinh & Marketing", desc: "Hiệu quả nguồn, UTM và tỷ lệ chuyển đổi", permission: "leads.view" },
  { key: "attendance.summary", title: "Điểm danh theo lớp", group: "Đào tạo", desc: "Chuyên cần từng buổi học của học viên", permission: "attendance.view" },
  { key: "grades.summary", title: "Bảng điểm theo lớp", group: "Đào tạo", desc: "Điểm thành phần và kết quả cuối khoá", permission: "grades.view" },
  { key: "orders.revenue", title: "Doanh thu khoá học", group: "Tài chính", desc: "Đơn hàng khoá học online theo trạng thái thanh toán", permission: "courses.orders" },
  { key: "archive.records", title: "Kho lưu trữ hồ sơ vật lý", group: "Lưu trữ & Tra soát", desc: "Vị trí lưu, mượn trả và hồ sơ quá hạn trả", permission: "students.archive" },
  { key: "audit.activity", title: "Nhật ký trách nhiệm", group: "Lưu trữ & Tra soát", desc: "Ai xử lý hồ sơ nào, thao tác gì, lúc nào", permission: "audit.view" },
];

export const REPORT_BY_KEY: Record<ReportKey, ReportMeta> = Object.fromEntries(
  REPORTS.map((r) => [r.key, r]),
) as Record<ReportKey, ReportMeta>;

export const REPORT_GROUPS: string[] = [...new Set(REPORTS.map((r) => r.group))];

export type ReportFilters = {
  from?: string | null;
  to?: string | null;
  group?: string | null;
  search?: string | null;
};
