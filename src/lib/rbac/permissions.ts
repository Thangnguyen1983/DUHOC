/**
 * RBAC permissions — bản đồ vai trò → quyền năng cụ thể trong Admin.
 * Enforcement dữ liệu vẫn nằm ở RLS; lớp này kiểm soát UI/route trong console.
 */
import type { AppRole } from "./catalog";

export const PERMISSIONS = [
  "dashboard.view",
  "operations.overview",
  // Nội dung
  "cms.view",
  "cms.edit",
  "cms.publish",
  "cms.seo",
  "media.manage",
  "popups.manage",
  "banners.manage",
  "journey.manage",
  "marketing.campaigns",
  "commissions.view",
  "commissions.manage",
  "ai.settings",
  "ai.assistant",
  // Nhân sự & CTV
  "hr.view",
  "hr.manage",
  "leave.approve",
  "payroll.view",
  "payroll.manage",
  "ctv.portal",
  // Vận hành khách hàng
  "leads.view",
  "leads.manage",
  "leads.distribute",
  "students.view",
  "students.manage",
  "students.placement",
  "students.export",
  "students.delete",
  "students.archive",
  "students.archive.edit",
  "audit.view",
  "visa.view",
  "visa.edit",
  "departure.view",
  "departure.edit",
  "workflow.view",
  "workflow.manage",
  "operations.view",
  "operations.manage",
  "system.diagnostics",
  // Trung tâm báo cáo
  "report.view",
  "report.export",
  // Đào tạo
  "training.view",
  "training.manage",
  "classes.view",
  "classes.edit",
  "schedule.view",
  "schedule.edit",
  "oversight.view",
  "oversight.edit",
  "attendance.view",
  "attendance.edit",
  "grades.view",
  "grades.edit",
  "training.analytics",
  "teachers.view",
  "teachers.manage",
  "lessons.view",
  "lessons.manage",
  "materials.view",
  "materials.manage",
  "materials.approve",
  "materials.present",
  "curriculum.manage",
  "quizzes.view",
  "quizzes.manage",
  "certificates.view",
  "certificates.manage",
  // E-learning
  "courses.view",
  "courses.manage",
  "courses.orders",
  // Chatbot
  "chatbot.view",
  "chatbot.manage",
  // Hệ thống
  "catalog.view",
  "catalog.manage",
  "catalog.geo.manage",
  "users.manage",
  "staff.view",
  "staff.manage",
  "settings.manage",
  "settings.payments",
  "settings.emails",
  "notifications.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Toàn bộ quyền "chỉ xem" của khối Vận hành & Đào tạo. */
const OPS_TRAINING_VIEW: Permission[] = [
  "operations.overview",
  "students.view",
  "students.archive",
  "visa.view",
  "departure.view",
  "workflow.view",
  "operations.view",
  "training.view",
  "classes.view",
  "schedule.view",
  "oversight.view",
  "attendance.view",
  "grades.view",
  "training.analytics",
  "teachers.view",
  "lessons.view",
  "materials.view",
  "quizzes.view",
  "certificates.view",
  "catalog.view",
];

/** Quyền theo từng vai trò (admin được cấp toàn bộ, xử lý riêng bên dưới). */
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [...PERMISSIONS],
  editor: ["ai.assistant", 
    "dashboard.view",
    "cms.view", "cms.edit", "cms.publish", "cms.seo",
    "media.manage", "banners.manage", "popups.manage", "journey.manage",
    "leads.view",
  ],
  content: ["ai.assistant", "dashboard.view", "cms.view", "cms.edit", "media.manage"],
  seo: ["ai.assistant", "dashboard.view", "cms.view", "cms.edit", "cms.seo"],
  marketing: ["ai.assistant", 
    "dashboard.view", "cms.view", "cms.edit",
    "media.manage", "banners.manage", "popups.manage", "journey.manage", "leads.view",
    "chatbot.view", "chatbot.manage", "marketing.campaigns",
  ],
  contributor: ["dashboard.view", "cms.view", "cms.edit", "ctv.portal"],
  training_manager: ["ai.assistant", 
    "dashboard.view", ...OPS_TRAINING_VIEW,
    "students.manage", "students.export", "students.archive.edit",
    "training.manage", "classes.edit", "schedule.edit", "oversight.edit",
    "attendance.edit", "grades.edit",
    "teachers.manage", "lessons.manage", "materials.manage", "materials.approve", "materials.present", "curriculum.manage",
    "quizzes.manage", "certificates.manage", "catalog.manage",
    "operations.manage", "hr.view", "leave.approve",
  ],
  training_staff: ["ai.assistant", 
    "dashboard.view", ...OPS_TRAINING_VIEW,
    "classes.edit", "schedule.edit", "attendance.edit",
    "lessons.manage", "materials.manage", "materials.approve", "materials.present", "curriculum.manage",
  ],
  teacher: ["ai.assistant", 
    "dashboard.view",
    "training.view", "classes.view", "schedule.view",
    "attendance.view", "attendance.edit",
    "grades.view", "grades.edit",
    "lessons.view", "lessons.manage",
    "materials.view", "materials.manage", "materials.present",
    "quizzes.view", "quizzes.manage",
    "certificates.view",
  ],
  course_instructor: ["dashboard.view", "courses.view", "courses.manage", "media.manage", "materials.view", "materials.manage"],
  sales: ["ai.assistant", "dashboard.view", "courses.view", "courses.orders", "leads.view", "students.view", "marketing.campaigns", "ctv.portal"],
  consultant: ["ai.assistant", 
    "dashboard.view", "operations.overview", "leads.view", "leads.manage",
    "students.view", "students.manage", "students.export", "students.archive",
    "visa.view", "workflow.view",
  ],
  cskh: ["ai.assistant", 
    "dashboard.view", "operations.overview", "leads.view",
    "students.view", "students.manage", "students.placement", "students.export", "students.archive",
    "visa.view", "workflow.view",
  ],
  visa_officer: ["ai.assistant", 
    "dashboard.view", "operations.overview",
    "students.view", "students.manage", "students.export", "students.archive",
    "visa.view", "visa.edit", "departure.view", "workflow.view", "workflow.manage",
  ],
  departure_coordinator: ["ai.assistant", 
    "dashboard.view", "operations.overview",
    "students.view", "students.manage", "students.placement", "students.export", "students.archive",
    "visa.view", "visa.edit", "departure.view", "departure.edit",
    "workflow.view", "workflow.manage",
  ],
  market_head: ["ai.assistant", 
    "dashboard.view", ...OPS_TRAINING_VIEW, "leads.view", "leads.distribute",
    "students.manage", "students.export", "audit.view", "workflow.manage", "operations.manage",
    "marketing.campaigns", "commissions.view", "hr.view", "leave.approve",
  ],
  student: [],
};

/**
 * Trung tâm báo cáo (/admin/bao-cao): mọi vai trò nội bộ đã xem được dashboard
 * đều được xem và tải báo cáo — nội dung hiển thị vẫn bị giới hạn theo quyền
 * của từng loại báo cáo, không mở thêm dữ liệu mới.
 */
/** Quyền "sửa" bao hàm quyền "xem" tương ứng; quyền cha bao hàm quyền con. */
const IMPLIED: Array<[Permission, Permission[]]> = [
  ["courses.manage", ["courses.view"]],
  ["courses.orders", ["courses.view"]],
  ["chatbot.manage", ["chatbot.view"]],
  ["settings.manage", ["settings.payments", "settings.emails"]],
  ["students.manage", ["students.view"]],
  ["students.archive.edit", ["students.archive"]],
  ["leads.manage", ["leads.view"]],
  ["leads.distribute", ["leads.view"]],
  ["visa.edit", ["visa.view"]],
  ["departure.edit", ["departure.view"]],
  ["workflow.manage", ["workflow.view"]],
  ["operations.manage", ["operations.view"]],
  ["training.manage", ["training.view"]],
  ["classes.edit", ["classes.view"]],
  ["schedule.edit", ["schedule.view"]],
  ["oversight.edit", ["oversight.view"]],
  ["attendance.edit", ["attendance.view"]],
  ["grades.edit", ["grades.view"]],
  ["teachers.manage", ["teachers.view"]],
  ["lessons.manage", ["lessons.view"]],
  ["materials.manage", ["materials.view"]],
  ["materials.approve", ["materials.view"]],
  ["materials.present", ["materials.view"]],
  ["curriculum.manage", ["materials.view"]],
  ["quizzes.manage", ["quizzes.view"]],
  ["certificates.manage", ["certificates.view"]],
  ["catalog.manage", ["catalog.view"]],
  ["catalog.geo.manage", ["catalog.view"]],
  ["staff.manage", ["staff.view"]],
  ["hr.manage", ["hr.view", "leave.approve"]],
  ["payroll.manage", ["payroll.view"]],
  ["users.manage", ["staff.view", "staff.manage"]],
];

export function expandImplied(list: Permission[]): Permission[] {
  const set = new Set<Permission>(list);
  for (const [parent, children] of IMPLIED) {
    if (set.has(parent)) children.forEach((c) => set.add(c));
  }
  return [...set];
}

for (const key of Object.keys(ROLE_PERMISSIONS) as AppRole[]) {
  const list = ROLE_PERMISSIONS[key];
  expandImplied(list).forEach((p) => { if (!list.includes(p)) list.push(p); });
  if (list.includes("dashboard.view")) {
    if (!list.includes("report.view")) list.push("report.view");
    if (!list.includes("report.export")) list.push("report.export");
  }
}



/** Bản ghi đè quyền theo vai trò (lưu trong CSDL, ghi đè mặc định của mã nguồn). */
export type RolePermissionOverrides = Partial<Record<AppRole, Permission[]>>;

/** Quyền hiệu lực của một vai trò: có bản ghi đè thì dùng, không thì dùng mặc định. */
export function permissionsOfRole(
  role: string,
  overrides?: RolePermissionOverrides,
): Permission[] {
  if (role === "admin") return [...PERMISSIONS];
  const ov = overrides?.[role as AppRole];
  if (ov) return ov;
  return ROLE_PERMISSIONS[role as AppRole] ?? [];
}

export function permissionsForRoles(
  roles: string[],
  overrides?: RolePermissionOverrides,
): Permission[] {
  if (roles.includes("admin")) return [...PERMISSIONS];
  const set = new Set<Permission>();
  roles.forEach((r) => permissionsOfRole(r, overrides).forEach((p) => set.add(p)));
  return expandImplied([...set]);
}

/** Bản đồ đường dẫn admin → quyền tối thiểu để truy cập (khớp tiền tố dài nhất). */
export const ROUTE_PERMISSIONS: Array<{ path: string; permission: Permission }> = [
  { path: "/admin/leads/queue", permission: "leads.view" },
  { path: "/admin/marketing/campaigns", permission: "marketing.campaigns" },
  { path: "/admin/marketing", permission: "marketing.campaigns" },
  { path: "/admin/leads", permission: "leads.view" },
  { path: "/admin/hoa-hong", permission: "commissions.view" },
  { path: "/admin/cai-dat-ai", permission: "ai.settings" },
  { path: "/admin/nhan-su", permission: "hr.view" },
  { path: "/admin/ca-nhan", permission: "dashboard.view" },
  { path: "/admin/ctv", permission: "ctv.portal" },
  { path: "/admin/cms/media", permission: "media.manage" },
  { path: "/admin/cms", permission: "cms.view" },
  { path: "/admin/posts", permission: "cms.view" },
  { path: "/admin/posts-hub", permission: "cms.view" },
  { path: "/admin/logo", permission: "banners.manage" },
  { path: "/admin/banners", permission: "banners.manage" },
  { path: "/admin/page-banners", permission: "banners.manage" },
  { path: "/admin/hot-programs", permission: "banners.manage" },
  { path: "/admin/popups", permission: "popups.manage" },

  { path: "/admin/hanh-trinh", permission: "journey.manage" },
  { path: "/admin/students", permission: "students.view" },
  { path: "/admin/visa", permission: "visa.view" },
  { path: "/admin/xuat-canh", permission: "departure.view" },
  { path: "/admin/luu-tru", permission: "students.archive" },
  { path: "/admin/tra-soat", permission: "audit.view" },
  { path: "/admin/van-hanh", permission: "operations.overview" },
  { path: "/admin/kiem-nghiem", permission: "system.diagnostics" },
  { path: "/admin/bao-cao", permission: "report.view" },

  { path: "/admin/workflow/config", permission: "workflow.manage" },
  { path: "/admin/workflow", permission: "workflow.view" },
  { path: "/admin/training/analytics", permission: "training.analytics" },
  { path: "/admin/training/oversight", permission: "oversight.view" },
  { path: "/admin/training/schedule", permission: "schedule.view" },
  { path: "/admin/training/classes", permission: "classes.view" },
  { path: "/admin/training", permission: "training.view" },
  { path: "/admin/teachers", permission: "teachers.view" },
  { path: "/admin/lessons", permission: "lessons.view" },
  { path: "/admin/materials", permission: "materials.view" },
  { path: "/admin/quizzes", permission: "quizzes.view" },
  { path: "/admin/certificates", permission: "certificates.view" },
  { path: "/admin/operations", permission: "operations.view" },
  { path: "/admin/chatbot", permission: "chatbot.view" },
  { path: "/admin/courses/orders", permission: "courses.orders" },
  { path: "/admin/courses", permission: "courses.view" },
  { path: "/admin/catalog", permission: "catalog.view" },
  { path: "/admin/users", permission: "users.manage" },
  { path: "/admin/settings/payments", permission: "settings.payments" },
  { path: "/admin/settings/emails", permission: "settings.emails" },
  { path: "/admin/settings", permission: "settings.manage" },
  { path: "/admin/huong-dan", permission: "dashboard.view" },
  { path: "/admin/telegram", permission: "notifications.manage" },
  { path: "/admin", permission: "dashboard.view" },

];

export function requiredPermissionForPath(pathname: string): Permission | null {
  const match = ROUTE_PERMISSIONS
    .filter((r) => pathname === r.path || pathname.startsWith(r.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.permission ?? null;
}

export const PERMISSION_LABEL: Record<Permission, string> = {
  "dashboard.view": "Xem dashboard",
  "operations.overview": "Tổng quan khối vận hành",
  "system.diagnostics": "Tự kiểm nghiệm & biên bản bàn giao",
  "marketing.campaigns": "Chiến dịch marketing",
  "commissions.view": "Xem hoa hồng cộng tác viên",
  "commissions.manage": "Duyệt & chi trả hoa hồng cộng tác viên",
  "ai.settings": "Cài đặt AI & khoá API",
  "ai.assistant": "Dùng trợ lý ảo",
  "hr.view": "Xem nhân sự, hợp đồng, chấm công",
  "hr.manage": "Quản lý nhân sự, hợp đồng, chấm công, KPI",
  "leave.approve": "Duyệt đơn nghỉ phép",
  "payroll.view": "Xem bảng lương",
  "payroll.manage": "Lập & duyệt bảng lương",
  "ctv.portal": "Cổng cộng tác viên (tự giới thiệu ứng viên)",
  "students.archive": "Kho lưu trữ hồ sơ vật lý",
  "audit.view": "Tra soát nhật ký trách nhiệm",
  "report.view": "Xem Trung tâm báo cáo",
  "report.export": "Tải/in báo cáo",
  "notifications.manage": "Cấu hình cảnh báo Telegram",
  "cms.view": "Xem CMS",
  "cms.edit": "Sửa nội dung CMS",
  "cms.publish": "Xuất bản nội dung",
  "cms.seo": "Chỉnh SEO",
  "media.manage": "Thư viện media",
  "popups.manage": "Popup khuyến mãi",
  "banners.manage": "Banner & chương trình hot",
  "journey.manage": "Hành trình Kaizen",
  "leads.view": "Xem lead tư vấn",
  "leads.manage": "Xử lý lead tư vấn",
  "leads.distribute": "Phân phối & điều phối lead",
  "students.view": "Xem hồ sơ học viên",
  "students.manage": "Sửa hồ sơ học viên",
  "students.placement": "Cập nhật nơi đến & hợp đồng",
  "students.export": "Xuất hồ sơ 360°",
  "students.delete": "Xoá hồ sơ học viên (vĩnh viễn)",
  "students.archive.edit": "Sửa kho lưu trữ (mượn/trả)",
  "departure.view": "Xem danh sách xuất cảnh",
  "departure.edit": "Cập nhật danh sách xuất cảnh",
  "visa.view": "Xem hồ sơ visa",
  "visa.edit": "Cập nhật hồ sơ visa",
  "workflow.view": "Xem tiến trình workflow",
  "workflow.manage": "Chuyển bước & cấu hình workflow",
  "operations.view": "Xem SLA & hàng đợi tài khoản",
  "operations.manage": "Chạy SLA & cấp tài khoản",
  "training.view": "Xem chương trình đào tạo",
  "training.manage": "Sửa chương trình đào tạo",
  "classes.view": "Xem lớp học",
  "classes.edit": "Sửa lớp học & phân công",
  "schedule.view": "Xem lịch trung tâm",
  "schedule.edit": "Sửa lịch buổi học",
  "oversight.view": "Xem giám sát lớp học",
  "oversight.edit": "Điều chỉnh giám sát lớp học",
  "attendance.view": "Xem điểm danh",
  "attendance.edit": "Điểm danh & tạo mã QR",
  "grades.view": "Xem điểm số",
  "grades.edit": "Chấm & sửa điểm",
  "training.analytics": "Thống kê đào tạo",
  "teachers.view": "Xem giáo viên",
  "teachers.manage": "Sửa hồ sơ giáo viên",
  "lessons.view": "Xem bài học",
  "lessons.manage": "Sửa bài học",
  "materials.view": "Xem tài liệu học tập",
  "materials.manage": "Sửa tài liệu học tập",
  "materials.approve": "Duyệt tài liệu đạt chuẩn giảng dạy",
  "materials.present": "Trình chiếu lớp học",
  "curriculum.manage": "Quản lý khung chương trình chuẩn",
  "quizzes.view": "Xem bài kiểm tra",
  "quizzes.manage": "Sửa & chấm bài kiểm tra",
  "certificates.view": "Xem chứng chỉ",
  "certificates.manage": "Cấp & thu hồi chứng chỉ",
  "courses.view": "Xem khoá học online",
  "courses.manage": "Sửa khoá học online",
  "courses.orders": "Đơn hàng khoá học",
  "chatbot.view": "Xem chatbot & hội thoại",
  "chatbot.manage": "Cấu hình & huấn luyện chatbot",
  "catalog.view": "Xem danh mục hệ thống",
  "catalog.manage": "Sửa danh mục hệ thống",
  "catalog.geo.manage": "Cập nhật danh sách địa danh chuẩn",

  "users.manage": "Tài khoản & phân quyền",
  "staff.view": "Xem hồ sơ cán bộ",
  "staff.manage": "Hồ sơ CBNV & phân công phòng ban",
  "settings.manage": "Cài đặt hệ thống",
  "settings.payments": "Cài đặt thanh toán",
  "settings.emails": "Tuỳ chỉnh email",
};

/**
 * Quyền "sửa" tương ứng cho từng trang trong khối Vận hành & Đào tạo.
 * Không có quyền này → trang hiển thị ở chế độ chỉ xem (khoá thao tác).
 */
export const ROUTE_EDIT_PERMISSIONS: Array<{ path: string; permission: Permission }> = [
  { path: "/admin/students", permission: "students.manage" },
  { path: "/admin/luu-tru", permission: "students.archive.edit" },
  { path: "/admin/visa", permission: "visa.edit" },
  { path: "/admin/xuat-canh", permission: "departure.edit" },
  { path: "/admin/workflow", permission: "workflow.manage" },
  { path: "/admin/operations", permission: "operations.manage" },
  { path: "/admin/training/oversight", permission: "oversight.edit" },
  { path: "/admin/training/schedule", permission: "schedule.edit" },
  { path: "/admin/training/classes", permission: "classes.edit" },
  { path: "/admin/training", permission: "training.manage" },
  { path: "/admin/teachers", permission: "teachers.manage" },
  { path: "/admin/lessons", permission: "lessons.manage" },
  { path: "/admin/materials", permission: "materials.manage" },
  { path: "/admin/quizzes", permission: "quizzes.manage" },
  { path: "/admin/certificates", permission: "certificates.manage" },
  { path: "/admin/catalog", permission: "catalog.manage" },
  { path: "/admin/courses/orders", permission: "courses.orders" },
  { path: "/admin/courses", permission: "courses.manage" },
  { path: "/admin/chatbot", permission: "chatbot.manage" },
];

export function editPermissionForPath(pathname: string): Permission | null {
  if (pathname.endsWith("/attendance")) return "attendance.edit";
  if (pathname.endsWith("/grades")) return "grades.edit";
  const match = ROUTE_EDIT_PERMISSIONS
    .filter((r) => pathname === r.path || pathname.startsWith(r.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.permission ?? null;
}

/** Nhóm hiển thị cho bảng Vai trò × Quyền. */
export const PERMISSION_GROUPS: Array<{ label: string; items: Permission[] }> = [
  { label: "Tổng quan", items: ["dashboard.view", "operations.overview", "report.view", "report.export"] },
  {
    label: "Nội dung & SEO",
    items: ["cms.view", "cms.edit", "cms.publish", "cms.seo", "media.manage",
      "banners.manage", "popups.manage", "journey.manage", "marketing.campaigns"],
  },
  {
    label: "Khách hàng & Học viên",
    items: ["leads.view", "leads.manage", "leads.distribute", "commissions.view", "commissions.manage",
      "students.view", "students.manage", "students.placement", "students.export", "students.delete",
      "students.archive", "students.archive.edit", "audit.view"],
  },
  {
    label: "Vận hành",
    items: ["visa.view", "visa.edit", "departure.view", "departure.edit",
      "workflow.view", "workflow.manage",
      "operations.view", "operations.manage", "system.diagnostics", "ai.settings", "ai.assistant"],
  },
  {
    label: "Đào tạo",
    items: ["training.view", "training.manage", "classes.view", "classes.edit",
      "schedule.view", "schedule.edit", "oversight.view", "oversight.edit",
      "attendance.view", "attendance.edit", "grades.view", "grades.edit",
      "training.analytics", "teachers.view", "teachers.manage",
      "lessons.view", "lessons.manage", "materials.view", "materials.manage",
      "materials.approve", "materials.present", "curriculum.manage",
      "quizzes.view", "quizzes.manage", "certificates.view", "certificates.manage"],
  },
  { label: "Nhân sự & CTV", items: ["hr.view", "hr.manage", "leave.approve", "payroll.view", "payroll.manage", "ctv.portal"] },
  { label: "E-learning & Chatbot", items: ["courses.view", "courses.manage", "courses.orders", "chatbot.view", "chatbot.manage"] },
  {
    label: "Hệ thống",
    items: ["catalog.view", "catalog.manage", "catalog.geo.manage", "users.manage", "staff.view", "staff.manage", "settings.manage", "settings.payments", "settings.emails", "notifications.manage"],
  },
];
