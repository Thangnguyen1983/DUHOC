/**
 * Bộ dịch lỗi dùng chung: đổi mọi lỗi kỹ thuật (Zod, PostgREST, HTTP, mạng)
 * thành câu cảnh báo tiếng Việt dễ hiểu. Không bao giờ hiển thị chuỗi mã thô.
 */

const FIELD_LABELS: Record<string, string> = {
  student_profile_id: "Học viên",
  location_id: "Vị trí kho",
  record_id: "Phiếu lưu trữ",
  class_id: "Lớp học",
  course_id: "Khoá học",
  lesson_id: "Bài học",
  session_id: "Buổi học",
  user_id: "Tài khoản",
  id: "Bản ghi",
  title: "Tiêu đề",
  name: "Tên",
  full_name: "Họ và tên",
  email: "Email",
  phone: "Số điện thoại",
  password: "Mật khẩu",
  code: "Mã",
  item_code: "Mã phiếu",
  slug: "Đường dẫn",
  content: "Nội dung",
  body: "Nội dung",
  quantity: "Số lượng",
  capacity: "Sức chứa",
  price: "Giá",
  amount: "Số tiền",
  score: "Điểm",
  date: "Ngày",
  due_date: "Hạn",
  stored_at: "Ngày nhập kho",
  start_date: "Ngày bắt đầu",
  end_date: "Ngày kết thúc",
  status: "Trạng thái",
  role: "Vai trò",
  market: "Thị trường",
  country: "Quốc gia",
  cover_image: "Ảnh bìa",
  note: "Ghi chú",
  reason: "Lý do",
};

function labelOf(path: unknown): string {
  if (!Array.isArray(path) || path.length === 0) return "Dữ liệu";
  const key = String(path[path.length - 1]);
  return FIELD_LABELS[key] ?? FIELD_LABELS[String(path[0])] ?? "Dữ liệu";
}

type ZodIssueLike = {
  code?: string;
  validation?: string;
  message?: string;
  path?: unknown[];
  minimum?: number;
  maximum?: number;
  expected?: string;
  received?: string;
  type?: string;
};

function issueToVi(issue: ZodIssueLike): string {
  const label = labelOf(issue.path);
  const v = issue.validation;
  if (v === "uuid") return `${label}: vui lòng chọn từ danh sách gợi ý, không nhập tay.`;
  if (v === "email") return `${label} không đúng định dạng.`;
  if (v === "url") return `${label} phải là một đường dẫn hợp lệ.`;
  if (v === "regex") return `${label} không đúng định dạng cho phép.`;

  switch (issue.code) {
    case "invalid_type":
      if (issue.received === "undefined" || issue.received === "null")
        return `${label}: chưa nhập / chưa chọn.`;
      return `${label} không đúng định dạng.`;
    case "too_small":
      if (issue.type === "string" && (issue.minimum ?? 1) <= 1)
        return `${label}: không được để trống.`;
      return `${label} phải từ ${issue.minimum} trở lên.`;
    case "too_big":
      if (issue.type === "string") return `${label} quá dài (tối đa ${issue.maximum} ký tự).`;
      return `${label} vượt quá mức cho phép (${issue.maximum}).`;
    case "invalid_enum_value":
      return `${label}: giá trị không hợp lệ, hãy chọn trong danh sách.`;
    case "invalid_date":
      return `${label} không hợp lệ.`;
    case "unrecognized_keys":
      return "Dữ liệu gửi lên có trường không hợp lệ.";
    default:
      return `${label} không hợp lệ.`;
  }
}

function parseZodIssues(input: unknown): ZodIssueLike[] | null {
  let raw: unknown = input;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s.startsWith("[") && !s.startsWith("{")) return null;
    try {
      raw = JSON.parse(s);
    } catch {
      return null;
    }
  }
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object" && raw[0] !== null) {
    const first = raw[0] as Record<string, unknown>;
    if ("code" in first || "message" in first) return raw as ZodIssueLike[];
  }
  return null;
}

const DB_MESSAGES: Record<string, string> = {
  "23505": "Dữ liệu này đã tồn tại. Vui lòng kiểm tra lại mã / thông tin trùng.",
  "23503": "Không thực hiện được vì dữ liệu đang liên kết với bản ghi khác.",
  "23502": "Còn thông tin bắt buộc chưa được nhập.",
  "23514": "Dữ liệu không thoả điều kiện hợp lệ của hệ thống.",
  "22P02": "Có ô nhập sai định dạng, vui lòng chọn lại từ danh sách gợi ý.",
  "42501": "Bạn không có quyền thực hiện thao tác này.",
  "42P01": "Không tìm thấy dữ liệu cần dùng. Vui lòng tải lại trang.",
  PGRST301: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  PGRST116: "Không tìm thấy dữ liệu phù hợp.",
};

function textToVi(msg: string): string | null {
  const m = msg.toLowerCase();
  if (m === "forbidden" || m.includes("not authorized") || m.includes("permission denied"))
    return "Bạn không có quyền thực hiện thao tác này.";
  if (m === "unauthorized" || m.includes("jwt") || m.includes("session"))
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (m.includes("duplicate key")) return DB_MESSAGES["23505"]!;
  if (m.includes("violates foreign key")) return DB_MESSAGES["23503"]!;
  if (m.includes("row-level security")) return "Bạn không có quyền với dữ liệu này.";
  if (m.includes("invalid input syntax for type uuid")) return DB_MESSAGES["22P02"]!;
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Mất kết nối mạng. Vui lòng kiểm tra đường truyền và thử lại.";
  if (m.includes("not found") || m === "404") return "Không tìm thấy dữ liệu.";
  return null;
}

function looksTechnical(msg: string): boolean {
  const s = msg.trim();
  if (!s) return true;
  if (s.startsWith("{") || s.startsWith("[")) return true;
  if (/^[A-Za-z0-9_.$-]+Error\b/.test(s)) return true;
  if (/\b(undefined|null|NaN|\[object Object\])\b/.test(s)) return true;
  if (/^(HTTP\s*)?\d{3}$/.test(s)) return true;
  // Câu tiếng Anh kỹ thuật: không dấu tiếng Việt và có từ khoá lập trình
  if (
    !/[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(s) &&
    /(error|invalid|failed|exception|expected|constraint|violates|schema|token|fetch)/i.test(s)
  )
    return true;
  return false;
}

function shortRef(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/** Trả về câu cảnh báo tiếng Việt cho mọi loại lỗi. */
export function getFriendlyError(err: unknown, fallback = "Không thực hiện được, vui lòng thử lại."): string {
  if (err == null) return fallback;

  // Lỗi kiểm tra dữ liệu (Zod) — có thể nằm trong .issues, .message hoặc chính err
  const anyErr = err as Record<string, any>;
  const issues =
    parseZodIssues(anyErr?.["issues"]) ??
    parseZodIssues(err) ??
    parseZodIssues(anyErr?.["message"]) ??
    parseZodIssues(anyErr?.["body"]);
  if (issues?.length) {
    const list = issues.slice(0, 3).map(issueToVi);
    return Array.from(new Set(list)).join(" ");
  }

  // Lỗi cơ sở dữ liệu (PostgREST / Postgres)
  const code = anyErr?.["code"];
  if (typeof code === "string" && DB_MESSAGES[code]) return DB_MESSAGES[code]!;

  // Response HTTP
  if (typeof Response !== "undefined" && err instanceof Response) {
    if (err.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (err.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (err.status === 404) return "Không tìm thấy dữ liệu.";
    return `${fallback} (mã ${shortRef()})`;
  }
  if (typeof anyErr?.["status"] === "number") {
    if (anyErr["status"] === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (anyErr["status"] === 403) return "Bạn không có quyền thực hiện thao tác này.";
  }

  const raw =
    typeof err === "string"
      ? err
      : typeof anyErr?.["message"] === "string"
        ? anyErr["message"]
        : "";
  if (raw) {
    const mapped = textToVi(raw);
    if (mapped) return mapped;
    if (!looksTechnical(raw)) return raw;
  }

  if (typeof console !== "undefined") console.error("[app-error]", err);
  return `${fallback} (mã tham chiếu ${shortRef()})`;
}

/** Dùng cho `toast.error(...)`: luôn ra câu tiếng Việt. */
export function errorMessage(err: unknown, fallback?: string): string {
  return getFriendlyError(err, fallback ?? "Không thực hiện được, vui lòng thử lại.");
}
