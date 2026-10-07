/**
 * RBAC catalog — nguồn duy nhất mô tả các vai trò trong hệ thống Kaizen.
 * Enum `app_role` trong DB phải chứa đủ các key liệt kê ở đây.
 */

export type AppRole =
  | "admin"
  | "editor"
  | "content"
  | "seo"
  | "marketing"
  | "contributor"
  | "training_manager"
  | "training_staff"
  | "teacher"
  | "course_instructor"
  | "sales"
  | "consultant"
  | "cskh"
  | "visa_officer"
  | "departure_coordinator"
  | "market_head"
  | "student";


export type RoleGroup = "system" | "content" | "training" | "operations" | "portal";

export type RoleMeta = {
  key: AppRole;
  label: string;
  description: string;
  group: RoleGroup;
  /** Các "quyền năng" gợi ý (dùng cho UI, chưa phải enforcement — enforce vẫn qua RLS + has_role) */
  capabilities: string[];
};

export const ROLE_GROUP_LABEL: Record<RoleGroup, string> = {
  system: "Hệ thống",
  content: "Nội dung & SEO",
  training: "Đào tạo",
  operations: "Vận hành",
  portal: "Người dùng cuối",
};

export const ROLE_CATALOG: RoleMeta[] = [
  {
    key: "admin",
    label: "Quản trị viên (Admin)",
    description: "Toàn quyền: cấu hình hệ thống, phân quyền, xoá dữ liệu.",
    group: "system",
    capabilities: ["Phân quyền", "Xoá dữ liệu", "Cấu hình", "Xuất bản trực tiếp"],
  },
  {
    key: "editor",
    label: "Biên tập trưởng (Editor)",
    description: "Xuất bản mọi nội dung website, duyệt bài của contributor.",
    group: "content",
    capabilities: ["Xuất bản", "Duyệt bài", "Sửa mọi nội dung"],
  },
  {
    key: "content",
    label: "Biên tập nội dung",
    description: "Tạo và chỉnh sửa bài viết/trang tĩnh trong CMS, không xuất bản trực tiếp.",
    group: "content",
    capabilities: ["Tạo nội dung", "Sửa nội dung", "Gửi duyệt"],
  },
  {
    key: "seo",
    label: "Chuyên viên SEO",
    description: "Chỉnh sửa metadata, schema, canonical, sitemap trên nội dung CMS.",
    group: "content",
    capabilities: ["Sửa SEO metadata", "Xem SEO score", "Sửa slug"],
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Quản lý banner, chương trình hot, chiến dịch, hình ảnh media.",
    group: "content",
    capabilities: ["Quản lý banner", "Chương trình hot", "Media library"],
  },
  {
    key: "contributor",
    label: "Cộng tác viên (Contributor)",
    description: "Chỉ tạo và sửa nội dung của chính mình, phải gửi duyệt để đăng.",
    group: "content",
    capabilities: ["Tạo nội dung của mình", "Sửa nội dung của mình", "Gửi duyệt"],
  },
  {
    key: "training_manager",
    label: "Trưởng phòng đào tạo",
    description: "Quản lý chương trình, lớp học, giáo viên, chứng chỉ.",
    group: "training",
    capabilities: ["Quản lý chương trình", "Lớp học", "Giáo viên", "Cấp chứng chỉ"],
  },
  {
    key: "training_staff",
    label: "Nhân viên đào tạo",
    description: "Hỗ trợ vận hành lớp học, điểm danh, tài liệu.",
    group: "training",
    capabilities: ["Điểm danh", "Cập nhật tài liệu", "Xem lớp học"],
  },
  {
    key: "teacher",
    label: "Giáo viên",
    description: "Giảng dạy, ra bài, chấm điểm cho lớp được phân công.",
    group: "training",
    capabilities: ["Bài giảng", "Bài kiểm tra", "Chấm điểm", "Điểm danh"],
  },
  {
    key: "course_instructor",
    label: "Giảng viên online",
    description: "Xây dựng và giảng dạy khoá học trực tuyến (E-learning), duyệt hỏi đáp học viên.",
    group: "training",
    capabilities: ["Tạo khoá học", "Quản lý bài học", "Trả lời Q&A", "Xem tiến độ học viên"],
  },
  {
    key: "sales",
    label: "Kinh doanh khoá học",
    description: "Quản lý đơn hàng khoá học online, mã giảm giá, hỗ trợ khách hàng mua khoá học.",
    group: "operations",
    capabilities: ["Xem đơn hàng", "Quản lý coupon", "Xem enrollment"],
  },
  {
    key: "consultant",
    label: "Tư vấn viên",
    description: "Xử lý lead từ web/chatbot, tạo hồ sơ học viên.",
    group: "operations",
    capabilities: ["Xem lead", "Cập nhật trạng thái tư vấn", "Tạo hồ sơ HV"],
  },
  {
    key: "cskh",
    label: "Chăm sóc khách hàng",
    description: "Chăm sóc sau bán, ghi chú tương tác học viên.",
    group: "operations",
    capabilities: ["Ghi chú CSKH", "Xem hồ sơ HV"],
  },
  {
    key: "visa_officer",
    label: "Cán bộ visa",
    description: "Xử lý hồ sơ visa, cập nhật trạng thái visa workflow.",
    group: "operations",
    capabilities: ["Cập nhật visa", "Tải tài liệu"],
  },
  {
    key: "departure_coordinator",
    label: "Điều phối xuất cảnh",
    description: "Điều phối bước cuối workflow — vé, đón tiễn, bàn giao.",
    group: "operations",
    capabilities: ["Cập nhật bước xuất cảnh", "Tài liệu bay"],
  },
  {
    key: "market_head",
    label: "Trưởng thị trường",
    description: "Phụ trách một thị trường (Nhật, Hàn, Đức, Đài...): theo dõi hồ sơ, tiến độ và kết quả toàn thị trường.",
    group: "operations",
    capabilities: ["Xem toàn bộ hồ sơ thị trường", "Theo dõi tiến độ", "Báo cáo thị trường", "Xem lead"],
  },
  {
    key: "student",
    label: "Học viên",
    description: "Truy cập Portal học viên: bài giảng, bài kiểm tra, chứng chỉ.",
    group: "portal",
    capabilities: ["Xem bài giảng", "Làm quiz", "Nhận chứng chỉ"],
  },
];

export const ROLE_KEYS: AppRole[] = ROLE_CATALOG.map((r) => r.key);

/** Nhóm nhân sự được phép vào cổng giảng dạy với phạm vi quản lý. */
export const PORTAL_STAFF_ROLES: AppRole[] = ["admin", "training_manager", "training_staff"];

export function isPortalStaff(roles: string[]): boolean {
  return roles.some((role) => PORTAL_STAFF_ROLES.includes(role as AppRole));
}

export const ROLE_META: Record<AppRole, RoleMeta> = ROLE_CATALOG.reduce(
  (acc, r) => ({ ...acc, [r.key]: r }),
  {} as Record<AppRole, RoleMeta>,
);

export function roleLabel(role: string): string {
  return (ROLE_META as any)[role]?.label ?? role;
}

export function groupRoles(): Record<RoleGroup, RoleMeta[]> {
  const out: Record<RoleGroup, RoleMeta[]> = {
    system: [], content: [], training: [], operations: [], portal: [],
  };
  ROLE_CATALOG.forEach((r) => out[r.group].push(r));
  return out;
}
