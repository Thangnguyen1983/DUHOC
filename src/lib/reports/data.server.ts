/**
 * Nạp dữ liệu thật cho Trung tâm báo cáo (/admin/bao-cao).
 * Dùng lại các loader sẵn có của trang Vận hành & Đào tạo, bổ sung các báo cáo còn thiếu.
 * Không tạo bảng mới, không tạo luồng dữ liệu song song.
 */
import {
  loadChartDetail,
  STUDENT_STATUS_LABEL,
  type ChartDimension,
} from "@/lib/operations/overview.functions";
import { REPORT_BY_KEY, type ReportFilters, type ReportKey } from "./catalog";

export type ReportPayload = {
  key: ReportKey;
  title: string;
  generatedAt: string;
  headers: string[];
  rows: string[][];
  /** Cột chứa "hạng mục" dùng để nhóm/lọc */
  groupIndex: number;
  /** Cột chứa ngày (dd/mm/yyyy) dùng để lọc theo khoảng thời gian */
  dateIndex: number;
  summary: Array<{ label: string; count: number }>;
};

const CHART_KEYS: ReportKey[] = [
  "students.status",
  "students.visa",
  "students.program",
  "students.market",
  "documents.stage",
  "workflow.step",
];

const p2 = (n: number) => String(n).padStart(2, "0");

const vnDate = (v: string | null | undefined) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const vnDateTime = (v: string | null | undefined) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return `${vnDate(v)} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

const money = (n: number | null | undefined) => new Intl.NumberFormat("vi-VN").format(Number(n ?? 0));

export function summarize(rows: string[][], groupIndex: number) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = r[groupIndex] || "Chưa đặt";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

const LEAD_STATUS_LABEL: Record<string, string> = {
  new: "Chờ tiếp nhận",
  pending: "Chờ tiếp nhận",
  contacted: "Đã liên hệ",
  consulting: "Đang tư vấn",
  qualified: "Tiềm năng",
  done: "Hoàn tất",
  converted: "Đã chuyển học viên",
  lost: "Không thành công",
  spam: "Rác",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã huỷ",
  refunded: "Hoàn tiền",
  failed: "Thất bại",
};

const ATTENDANCE_LABEL: Record<string, string> = {
  present: "Có mặt",
  late: "Đi muộn",
  absent: "Vắng",
  excused: "Vắng có phép",
};

const ARCHIVE_STATUS_LABEL: Record<string, string> = {
  stored: "Đang lưu kho",
  borrowed: "Đang mượn",
  returned: "Đã trả",
  transferred: "Đã chuyển",
  destroyed: "Đã tiêu huỷ",
};

async function sb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function studentMap(db: any, ids: string[]) {
  const map = new Map<string, any>();
  const list = [...new Set(ids.filter(Boolean))];
  if (!list.length) return map;
  const { data } = await db
    .from("student_profiles")
    .select("id, student_code, full_name, phone, country, current_status")
    .in("id", list);
  for (const s of (data ?? []) as any[]) map.set(s.id, s);
  return map;
}

async function loadNew(key: ReportKey): Promise<Omit<ReportPayload, "key" | "title" | "generatedAt" | "summary">> {
  const db = await sb();

  if (key === "leads.status" || key === "leads.source") {
    const { data, error } = await db
      .from("consultations")
      .select(
        "full_name, phone, email, program, market, status, source, campaign_code, utm_source, utm_medium, utm_campaign, assigned_to, assigned_at, student_profile_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    const L = (data ?? []) as any[];
    const staff = new Map<string, string>();
    const ids = [...new Set(L.map((l) => l.assigned_to).filter(Boolean))];
    if (ids.length) {
      const { data: pr } = await db.from("profiles").select("id, full_name").in("id", ids);
      for (const p of (pr ?? []) as any[]) staff.set(p.id, p.full_name ?? "");
    }
    const headers = [
      "Hạng mục", "Họ và tên", "Điện thoại", "Email", "Chương trình quan tâm", "Thị trường",
      "Trạng thái", "Nguồn", "Chiến dịch", "UTM source", "UTM medium", "UTM campaign",
      "Nhân viên tiếp nhận", "Đã chuyển học viên", "Ngày đăng ký",
    ];
    const rows = L.map((l) => [
      key === "leads.status"
        ? (LEAD_STATUS_LABEL[l.status] ?? l.status ?? "Chưa đặt")
        : (l.utm_source || l.source || "Không rõ nguồn"),
      l.full_name ?? "",
      l.phone ?? "",
      l.email ?? "",
      l.program ?? "",
      l.market ?? "",
      LEAD_STATUS_LABEL[l.status] ?? l.status ?? "",
      l.source ?? "",
      l.campaign_code ?? "",
      l.utm_source ?? "",
      l.utm_medium ?? "",
      l.utm_campaign ?? "",
      l.assigned_to ? (staff.get(l.assigned_to) || "Đã phân công") : "Chưa phân công",
      l.student_profile_id ? "Có" : "Chưa",
      vnDate(l.created_at),
    ]);
    return { headers, rows, groupIndex: 0, dateIndex: 14 };
  }

  if (key === "orders.revenue") {
    const { data, error } = await db
      .from("course_orders")
      .select("id, order_no, customer_name, customer_email, customer_phone, subtotal_vnd, discount_vnd, total_vnd, status, payment_provider, payment_ref, paid_at, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    const O = (data ?? []) as any[];
    const itemMap = new Map<string, string[]>();
    if (O.length) {
      const { data: items } = await db
        .from("course_order_items")
        .select("order_id, title_snapshot, qty")
        .in("order_id", O.map((o) => o.id));
      for (const it of (items ?? []) as any[]) {
        const arr = itemMap.get(it.order_id) ?? [];
        arr.push(`${it.title_snapshot ?? ""}${it.qty > 1 ? ` x${it.qty}` : ""}`);
        itemMap.set(it.order_id, arr);
      }
    }
    const headers = [
      "Hạng mục", "Mã đơn", "Khách hàng", "Email", "Điện thoại", "Khoá học",
      "Tạm tính (đ)", "Giảm giá (đ)", "Thành tiền (đ)", "Trạng thái",
      "Kênh thanh toán", "Mã giao dịch", "Ngày thanh toán", "Ngày tạo đơn",
    ];
    const rows = O.map((o) => [
      ORDER_STATUS_LABEL[o.status] ?? o.status ?? "Chưa đặt",
      o.order_no ?? "",
      o.customer_name ?? "",
      o.customer_email ?? "",
      o.customer_phone ?? "",
      (itemMap.get(o.id) ?? []).join("; "),
      money(o.subtotal_vnd),
      money(o.discount_vnd),
      money(o.total_vnd),
      ORDER_STATUS_LABEL[o.status] ?? o.status ?? "",
      o.payment_provider ?? "",
      o.payment_ref ?? "",
      vnDate(o.paid_at),
      vnDate(o.created_at),
    ]);
    return { headers, rows, groupIndex: 0, dateIndex: 13 };
  }

  if (key === "attendance.summary") {
    const { data, error } = await db
      .from("training_attendance")
      .select("status, check_in_at, check_in_method, note, session_id, enrollment_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    const A = (data ?? []) as any[];
    const sessionMap = new Map<string, any>();
    const enrollMap = new Map<string, any>();
    const classMap = new Map<string, any>();
    const sIds = [...new Set(A.map((a) => a.session_id).filter(Boolean))];
    const eIds = [...new Set(A.map((a) => a.enrollment_id).filter(Boolean))];
    if (sIds.length) {
      const { data: ss } = await db
        .from("training_sessions")
        .select("id, class_id, session_no, title, session_date, start_time")
        .in("id", sIds);
      for (const s of (ss ?? []) as any[]) sessionMap.set(s.id, s);
    }
    if (eIds.length) {
      const { data: es } = await db
        .from("training_enrollments")
        .select("id, class_id, student_profile_id")
        .in("id", eIds);
      for (const e of (es ?? []) as any[]) enrollMap.set(e.id, e);
    }
    const classIds = [
      ...new Set([...sessionMap.values()].map((s) => s.class_id).concat([...enrollMap.values()].map((e) => e.class_id)).filter(Boolean)),
    ];
    if (classIds.length) {
      const { data: cs } = await db.from("training_classes").select("id, code, name").in("id", classIds);
      for (const c of (cs ?? []) as any[]) classMap.set(c.id, c);
    }
    const students = await studentMap(db, [...enrollMap.values()].map((e) => e.student_profile_id));
    const headers = [
      "Hạng mục", "Mã lớp", "Tên lớp", "Buổi", "Chủ đề", "Ngày học",
      "Mã học viên", "Họ và tên", "Điện thoại", "Trạng thái điểm danh",
      "Giờ check-in", "Hình thức", "Ghi chú", "Ngày ghi nhận",
    ];
    const rows = A.map((a) => {
      const s = sessionMap.get(a.session_id) ?? {};
      const e = enrollMap.get(a.enrollment_id) ?? {};
      const c = classMap.get(s.class_id ?? e.class_id) ?? {};
      const st = students.get(e.student_profile_id) ?? {};
      return [
        c.name ? `${c.code ?? ""} ${c.name}`.trim() : "Chưa gán lớp",
        c.code ?? "",
        c.name ?? "",
        s.session_no != null ? String(s.session_no) : "",
        s.title ?? "",
        vnDate(s.session_date),
        st.student_code ?? "",
        st.full_name ?? "",
        st.phone ?? "",
        ATTENDANCE_LABEL[a.status] ?? a.status ?? "",
        vnDateTime(a.check_in_at),
        a.check_in_method ?? "",
        a.note ?? "",
        vnDate(a.created_at),
      ];
    });
    return { headers, rows, groupIndex: 0, dateIndex: 13 };
  }

  if (key === "grades.summary") {
    const { data, error } = await db
      .from("training_grades")
      .select("assessment_type, title, score, max_score, weight, assessed_at, comment, enrollment_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    const G = (data ?? []) as any[];
    const enrollMap = new Map<string, any>();
    const eIds = [...new Set(G.map((g) => g.enrollment_id).filter(Boolean))];
    if (eIds.length) {
      const { data: es } = await db
        .from("training_enrollments")
        .select("id, class_id, student_profile_id, final_grade, status")
        .in("id", eIds);
      for (const e of (es ?? []) as any[]) enrollMap.set(e.id, e);
    }
    const classMap = new Map<string, any>();
    const classIds = [...new Set([...enrollMap.values()].map((e) => e.class_id).filter(Boolean))];
    if (classIds.length) {
      const { data: cs } = await db.from("training_classes").select("id, code, name").in("id", classIds);
      for (const c of (cs ?? []) as any[]) classMap.set(c.id, c);
    }
    const students = await studentMap(db, [...enrollMap.values()].map((e) => e.student_profile_id));
    const headers = [
      "Hạng mục", "Mã lớp", "Tên lớp", "Mã học viên", "Họ và tên",
      "Loại đánh giá", "Đầu điểm", "Điểm", "Thang điểm", "Hệ số",
      "Điểm tổng kết", "Nhận xét", "Ngày đánh giá",
    ];
    const rows = G.map((g) => {
      const e = enrollMap.get(g.enrollment_id) ?? {};
      const c = classMap.get(e.class_id) ?? {};
      const st = students.get(e.student_profile_id) ?? {};
      return [
        c.name ? `${c.code ?? ""} ${c.name}`.trim() : "Chưa gán lớp",
        c.code ?? "",
        c.name ?? "",
        st.student_code ?? "",
        st.full_name ?? "",
        g.assessment_type ?? "",
        g.title ?? "",
        g.score != null ? String(g.score) : "",
        g.max_score != null ? String(g.max_score) : "",
        g.weight != null ? String(g.weight) : "",
        e.final_grade != null ? String(e.final_grade) : "",
        g.comment ?? "",
        vnDate(g.assessed_at ?? g.created_at),
      ];
    });
    return { headers, rows, groupIndex: 0, dateIndex: 12 };
  }

  if (key === "departure.records") {
    const { data, error } = await db
      .from("departure_records")
      .select("full_name, gender, dob, phone, passport_no, id_no, province, ward, destination_country, occupation, employer_name, planned_departure_date, actual_departure_date, flight_no, departure_airport, status, note, batch_id, student_profile_id, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    const D = (data ?? []) as any[];
    const batches = new Map<string, any>();
    const bIds = [...new Set(D.map((d) => d.batch_id).filter(Boolean))];
    if (bIds.length) {
      const { data: bs } = await db.from("departure_batches").select("id, name, planned_date, destination_country").in("id", bIds);
      for (const b of (bs ?? []) as any[]) batches.set(b.id, b);
    }
    const students = await studentMap(db, D.map((d) => d.student_profile_id));
    const headers = [
      "Hạng mục", "Họ và tên", "Giới tính", "Ngày sinh", "Điện thoại", "Số hộ chiếu", "Số CCCD",
      "Tỉnh/Thành", "Xã/Phường", "Nước đến", "Ngành nghề", "Nơi làm việc",
      "Dự kiến xuất cảnh", "Thực tế xuất cảnh", "Chuyến bay", "Sân bay đi",
      "Trạng thái", "Mã học viên", "Ghi chú", "Ngày tạo",
    ];
    const rows = D.map((d) => {
      const b = batches.get(d.batch_id);
      const st = students.get(d.student_profile_id) ?? {};
      return [
        b?.name ?? (d.destination_country || "Chưa gán đợt"),
        d.full_name ?? "",
        d.gender === "1" || d.gender === "nam" ? "Nam" : d.gender === "0" || d.gender === "nu" ? "Nữ" : (d.gender ?? ""),
        vnDate(d.dob),
        d.phone ?? "",
        d.passport_no ?? "",
        d.id_no ?? "",
        d.province ?? "",
        d.ward ?? "",
        d.destination_country ?? "",
        d.occupation ?? "",
        d.employer_name ?? "",
        vnDate(d.planned_departure_date),
        vnDate(d.actual_departure_date),
        d.flight_no ?? "",
        d.departure_airport ?? "",
        d.status ?? "",
        st.student_code ?? "",
        d.note ?? "",
        vnDate(d.created_at),
      ];
    });
    return { headers, rows, groupIndex: 0, dateIndex: 19 };
  }

  if (key === "archive.records") {
    const { data, error } = await db
      .from("student_archive_records")
      .select("item_code, doc_kind, title, quantity, condition, status, stored_at, stored_by_email, borrower_name, borrowed_at, due_date, returned_at, note, location_id, student_profile_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    const R = (data ?? []) as any[];
    const locs = new Map<string, any>();
    const lIds = [...new Set(R.map((r) => r.location_id).filter(Boolean))];
    if (lIds.length) {
      const { data: ls } = await db.from("archive_locations").select("id, code, name").in("id", lIds);
      for (const l of (ls ?? []) as any[]) locs.set(l.id, l);
    }
    const students = await studentMap(db, R.map((r) => r.student_profile_id));
    const now = new Date();
    const headers = [
      "Hạng mục", "Mã hồ sơ lưu", "Loại tài liệu", "Tiêu đề", "Số lượng", "Tình trạng",
      "Vị trí lưu", "Mã học viên", "Họ và tên", "Ngày nhập kho", "Người nhập",
      "Người mượn", "Ngày mượn", "Hạn trả", "Số ngày quá hạn", "Ngày trả", "Ghi chú",
    ];
    const rows = R.map((r) => {
      const st = students.get(r.student_profile_id) ?? {};
      const loc = locs.get(r.location_id);
      const overdue = r.due_date && !r.returned_at && new Date(r.due_date) < now
        ? String(Math.round((now.getTime() - new Date(r.due_date).getTime()) / 86400000))
        : "";
      return [
        ARCHIVE_STATUS_LABEL[r.status] ?? r.status ?? "Chưa đặt",
        r.item_code ?? "",
        r.doc_kind ?? "",
        r.title ?? "",
        r.quantity != null ? String(r.quantity) : "",
        r.condition ?? "",
        loc ? `${loc.code ?? ""} ${loc.name ?? ""}`.trim() : "",
        st.student_code ?? "",
        st.full_name ?? "",
        vnDate(r.stored_at),
        r.stored_by_email ?? "",
        r.borrower_name ?? "",
        vnDate(r.borrowed_at),
        vnDate(r.due_date),
        overdue,
        vnDate(r.returned_at),
        r.note ?? "",
      ];
    });
    return { headers, rows, groupIndex: 0, dateIndex: 9 };
  }

  // audit.activity
  const { data, error } = await db
    .from("student_activity_logs")
    .select("actor_email, actor_roles, source, stage, action, entity, field, old_value, new_value, note, student_profile_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  const A = (data ?? []) as any[];
  const students = await studentMap(db, A.map((a) => a.student_profile_id));
  const headers = [
    "Hạng mục", "Thời điểm", "Người xử lý", "Vai trò", "Nguồn thao tác", "Giai đoạn",
    "Hành động", "Đối tượng", "Trường dữ liệu", "Giá trị cũ", "Giá trị mới",
    "Mã học viên", "Họ và tên", "Trạng thái hồ sơ", "Ghi chú",
  ];
  const rows = A.map((a) => {
    const st = students.get(a.student_profile_id) ?? {};
    return [
      a.actor_email || "Hệ thống",
      vnDateTime(a.created_at),
      a.actor_email ?? "",
      Array.isArray(a.actor_roles) ? a.actor_roles.join(", ") : "",
      a.source ?? "",
      a.stage ?? "",
      a.action ?? "",
      a.entity ?? "",
      a.field ?? "",
      a.old_value ?? "",
      a.new_value ?? "",
      st.student_code ?? "",
      st.full_name ?? "",
      STUDENT_STATUS_LABEL[st.current_status] ?? st.current_status ?? "",
      a.note ?? "",
    ];
  });
  return { headers, rows, groupIndex: 0, dateIndex: 1 };
}

/** dd/mm/yyyy [hh:mm] → Date | null */
function parseVn(v: string | undefined): Date | null {
  if (!v) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(v.trim());
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

export function applyFilters(
  payload: { rows: string[][]; groupIndex: number; dateIndex: number },
  filters: ReportFilters,
): string[][] {
  const from = filters.from ? new Date(filters.from) : null;
  const to = filters.to ? new Date(filters.to) : null;
  if (to) to.setHours(23, 59, 59, 999);
  const group = (filters.group ?? "").trim();
  const search = (filters.search ?? "").trim().toLowerCase();

  return payload.rows.filter((r) => {
    if (group && (r[payload.groupIndex] ?? "") !== group) return false;
    if (from || to) {
      const d = parseVn(r[payload.dateIndex]);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
    }
    if (search && !r.some((c) => (c ?? "").toLowerCase().includes(search))) return false;
    return true;
  });
}

export async function loadReport(key: ReportKey, filters: ReportFilters = {}): Promise<ReportPayload> {
  const meta = REPORT_BY_KEY[key];
  const generatedAt = new Date().toISOString();

  const base = CHART_KEYS.includes(key)
    ? await (async () => {
        const d = await loadChartDetail(key as ChartDimension);
        // Cột ngày cuối cùng của các bảng sẵn có là "Ngày tạo hồ sơ"/"Cập nhật gần nhất"
        return { headers: d.headers, rows: d.rows, groupIndex: d.groupIndex, dateIndex: d.headers.length - 1 };
      })()
    : await loadNew(key);

  const rows = applyFilters(base, filters);
  return {
    key,
    title: meta.title,
    generatedAt,
    headers: base.headers,
    rows,
    groupIndex: base.groupIndex,
    dateIndex: base.dateIndex,
    summary: summarize(rows, base.groupIndex),
  };
}
