/**
 * Hồ sơ 360° học viên — thu thập dữ liệu và dựng file PDF / Excel / ZIP.
 * Chỉ chạy phía máy chủ (dùng supabaseAdmin sau khi đã kiểm quyền ở tầng gọi).
 */

const FONT_REGULAR_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Regular.ttf";
const FONT_BOLD_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf";

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;
async function loadFonts() {
  if (fontCache) return fontCache;
  const [r, b] = await Promise.all([
    fetch(FONT_REGULAR_URL).then((res) => res.arrayBuffer()),
    fetch(FONT_BOLD_URL).then((res) => res.arrayBuffer()),
  ]);
  fontCache = { regular: r, bold: b };
  return fontCache;
}

async function loadPdfLibs() {
  const [pdfLibNs, fontkitNs] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit")]);
  const pdfLib: any = (pdfLibNs as any).default ?? pdfLibNs;
  const fontkit: any = (fontkitNs as any).default ?? fontkitNs;
  return { PDFDocument: pdfLib.PDFDocument, rgb: pdfLib.rgb, fontkit };
}

export const EXPORT_PURPOSES: Record<string, string> = {
  archive: "Lưu trữ nội bộ",
  inspection: "Phục vụ thanh tra / kiểm tra",
  handover: "Bàn giao đối tác",
  student: "Cung cấp cho học viên",
};

const ACTIVITY_ACTION: Record<string, string> = {
  profile_create: "Tạo hồ sơ",
  profile_update: "Cập nhật hồ sơ",
  profile_assign: "Bàn giao phụ trách",
  placement_update: "Nơi làm việc / hợp đồng",
  ocr_apply: "Lưu kết quả quét giấy tờ",
  care_log: "Chăm sóc học viên",
  document_add: "Tải lên giấy tờ",
  document_verify: "Duyệt giấy tờ",
  checklist_update: "Cập nhật checklist",
  checklist_add: "Thêm mục checklist",
  checklist_remove: "Xoá mục checklist",
  workflow_advance: "Chuyển bước quy trình",
  enrollment_add: "Ghi danh lớp học",
  archive_store: "Nhập kho hồ sơ giấy",
  archive_move: "Mượn / trả / chuyển kho",
  export_360: "Xuất hồ sơ 360°",
};


/* ---------------------------- Chuẩn hoá dữ liệu --------------------------- */

const EMPTY = "—";

export function fmtDate(v: any): string {
  if (!v) return EMPTY;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function fmtDateTime(v: any): string {
  if (!v) return EMPTY;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function txt(v: any): string {
  if (v === null || v === undefined || v === "") return EMPTY;
  if (typeof v === "boolean") return v ? "Có" : "Không";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function contractWarning(endDate: any): string {
  if (!endDate) return "Chưa có ngày kết thúc hợp đồng";
  const d = new Date(`${String(endDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return EMPTY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `ĐÃ QUÁ HẠN ${Math.abs(days)} ngày (${fmtDate(endDate)})`;
  if (days === 0) return `HẾT HẠN HÔM NAY (${fmtDate(endDate)})`;
  if (days <= 7) return `KHẨN: còn ${days} ngày (${fmtDate(endDate)})`;
  if (days <= 30) return `Cảnh báo: còn ${days} ngày (${fmtDate(endDate)})`;
  if (days <= 90) return `Lưu ý: còn ${days} ngày (${fmtDate(endDate)})`;
  return `Còn hạn ${days} ngày (${fmtDate(endDate)})`;
}

const ARCHIVE_STATUS: Record<string, string> = {
  stored: "Đang lưu kho",
  borrowed: "Đang cho mượn",
  returned: "Đã trả về kho",
  removed: "Đã rút khỏi kho",
};

function locationText(l: any): string {
  if (!l) return EMPTY;
  const parts = [
    l.warehouse && `Kho ${l.warehouse}`,
    l.room && `Phòng ${l.room}`,
    l.cabinet && `Tủ ${l.cabinet}`,
    l.shelf && `Kệ ${l.shelf}`,
    l.box && `Hộp ${l.box}`,
  ].filter(Boolean);
  return `${l.code} — ${l.name}${parts.length ? ` (${parts.join(" · ")})` : ""}`;
}

const GENDER: Record<string, string> = { male: "Nam", female: "Nữ", other: "Khác" };
const ATT: Record<string, string> = {
  present: "Có mặt",
  absent: "Vắng",
  late: "Đi muộn",
  excused: "Có phép",
};

export type Section =
  | { kind: "fields"; title: string; rows: Array<[string, string]> }
  | { kind: "table"; title: string; headers: string[]; rows: string[][] };

export type Dossier = {
  profile: any;
  studentCode: string;
  fullName: string;
  sections: Section[];
  docFiles: Array<{ path: string; label: string }>;
};

/* ------------------------------ Thu thập DL ------------------------------- */

export async function collectDossier(supabaseAdmin: any, id: string): Promise<Dossier> {
  const { data: profile, error } = await supabaseAdmin
    .from("student_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) throw new Error("Không tìm thấy hồ sơ học viên");

  const [
    consultation,
    history,
    stepLogs,
    checklist,
    documents,
    enrollments,
    certificates,
    careLogs,
    conduct,
    reviews,
  ] = await Promise.all([
    profile.consultation_id
      ? supabaseAdmin.from("consultations").select("*").eq("id", profile.consultation_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("student_status_history")
      .select("*")
      .eq("student_profile_id", id)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("workflow_step_logs")
      .select("*")
      .eq("student_profile_id", id)
      .order("occurred_at", { ascending: true }),
    supabaseAdmin
      .from("student_document_checklist")
      .select("*")
      .eq("student_profile_id", id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("student_documents")
      .select("*")
      .eq("student_profile_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("training_enrollments")
      .select("*, training_classes(id, code, name, status, start_date, end_date, room, schedule)")
      .eq("student_profile_id", id)
      .order("enrolled_at", { ascending: true }),
    supabaseAdmin
      .from("certificates")
      .select("*")
      .eq("student_profile_id", id)
      .order("issued_at", { ascending: true }),
    supabaseAdmin
      .from("student_care_logs")
      .select("*")
      .eq("student_profile_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("student_conduct_records")
      .select("*")
      .eq("student_profile_id", id)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("student_reviews")
      .select("*")
      .eq("student_profile_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const archive = await supabaseAdmin
    .from("student_archive_records")
    .select("*, archive_locations(code, name, warehouse, room, cabinet, shelf, box)")
    .eq("student_profile_id", id)
    .order("created_at", { ascending: true });

  const activity = await supabaseAdmin
    .from("student_activity_logs")
    .select("*")
    .eq("student_profile_id", id)
    .order("created_at", { ascending: true })
    .limit(500);
  const activityActorIds = [
    ...new Set((activity.data ?? []).map((a: any) => a.actor_id).filter(Boolean)),
  ];
  let activityNames: Record<string, string> = {};
  if (activityActorIds.length) {
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", activityActorIds);
    activityNames = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name]));
  }


  const enrollRows = (enrollments.data ?? []) as any[];
  const enrollIds = enrollRows.map((e) => e.id);
  let attendance: any[] = [];
  let grades: any[] = [];
  if (enrollIds.length) {
    const [att, gr] = await Promise.all([
      supabaseAdmin
        .from("training_attendance")
        .select("*, training_sessions(session_no, title, session_date, start_time, end_time)")
        .in("enrollment_id", enrollIds),
      supabaseAdmin.from("training_grades").select("*").in("enrollment_id", enrollIds),
    ]);
    attendance = (att.data ?? []) as any[];
    grades = (gr.data ?? []) as any[];
  }
  attendance.sort((a, b) =>
    String(a.training_sessions?.session_date ?? "").localeCompare(
      String(b.training_sessions?.session_date ?? ""),
    ),
  );

  const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceRate = attendance.length
    ? `${Math.round((presentCount / attendance.length) * 100)}%`
    : EMPTY;

  const c = consultation.data as any;
  const meta = (profile.meta ?? {}) as any;

  const sections: Section[] = [
    {
      kind: "fields",
      title: "1. Thông tin định danh",
      rows: [
        ["Mã học viên", txt(profile.student_code)],
        ["Họ và tên", txt(profile.full_name)],
        ["Ngày sinh", fmtDate(profile.dob)],
        ["Giới tính", profile.gender ? (GENDER[profile.gender] ?? profile.gender) : EMPTY],
        ["Quốc tịch", txt(profile.nationality)],
        ["Loại giấy tờ", txt(profile.id_type)],
        ["Số giấy tờ", txt(profile.id_no)],
        ["Ngày cấp", fmtDate(profile.id_issue_date)],
        ["Nơi cấp", txt(profile.id_issue_place)],
        ["Có giá trị đến", fmtDate(profile.id_expiry_date)],
        ["Quê quán", txt(profile.place_of_origin)],
        ["Nơi thường trú", txt(profile.place_of_residence)],
        ["Điện thoại", txt(profile.phone)],
        ["Email", txt(profile.email)],
        ["Thời điểm quét OCR", fmtDateTime(profile.ocr_at)],
      ],
    },
    {
      kind: "fields",
      title: "2. Nguồn khách hàng & chương trình",
      rows: [
        ["Thị trường", txt(profile.country)],
        ["Chương trình", txt(profile.program)],
        ["Nguồn hồ sơ", txt(profile.source ?? meta.source)],
        ["Phiếu tư vấn gốc", c ? `#${String(c.id).slice(0, 8)} — ${fmtDateTime(c.created_at)}` : EMPTY],
        ["Kênh tiếp cận", txt(c?.source)],
        ["Chiến dịch", txt(c?.campaign_code ?? c?.utm_campaign)],
        ["UTM source / medium", `${txt(c?.utm_source)} / ${txt(c?.utm_medium)}`],
        ["UTM content / term", `${txt(c?.utm_content)} / ${txt(c?.utm_term)}`],
        ["Nội dung tư vấn ban đầu", txt(c?.message ?? meta.message)],
        ["Ngày tạo hồ sơ", fmtDateTime(profile.created_at)],
        ["Cập nhật gần nhất", fmtDateTime(profile.updated_at)],
      ],
    },
    {
      kind: "fields",
      title: "3. Trạng thái hiện tại",
      rows: [
        ["Trạng thái hồ sơ", txt(profile.current_status)],
        ["Hợp đồng", txt(profile.contract_status)],
        ["Visa", txt(profile.visa_status)],
        ["Xuất cảnh", txt(profile.departure_status)],
        ["Sau xuất cảnh", txt(profile.post_departure_status)],
        ["Tài khoản học viên", profile.user_id ? "Đã liên kết" : "Chưa liên kết"],
      ],
    },
    {
      kind: "fields",
      title: "3.1. Nơi đến học tập, làm việc & hợp đồng",
      rows: [
        ["Nước đến", txt(profile.destination_country)],
        ["Thành phố / tỉnh đến", txt(profile.destination_city)],
        ["Ngành nghề", txt(profile.occupation)],
        ["Vị trí công việc", txt(profile.job_title)],
        ["Đơn vị tiếp nhận", txt(profile.employer_name)],
        ["Địa chỉ nơi làm việc", txt(profile.work_address)],
        ["Người liên hệ", txt(profile.employer_contact_name)],
        ["Điện thoại liên hệ", txt(profile.employer_contact_phone)],
        ["Email liên hệ", txt(profile.employer_contact_email)],
        ["Ngày xuất cảnh", fmtDate(profile.departure_date)],
        ["Hợp đồng bắt đầu", fmtDate(profile.contract_start_date)],
        ["Hợp đồng kết thúc", fmtDate(profile.contract_end_date)],
        ["Thời hạn (tháng)", txt(profile.contract_duration_months)],
        ["Ghi chú gia hạn", txt(profile.contract_renewal_note)],
        ["CẢNH BÁO THỜI HẠN HỢP ĐỒNG", contractWarning(profile.contract_end_date)],
      ],
    },
    {
      kind: "table",
      title: "4. Lịch sử chuyển trạng thái",
      headers: ["Thời điểm", "Từ", "Sang", "Ghi chú"],
      rows: (history.data ?? []).map((h: any) => [
        fmtDateTime(h.created_at),
        txt(h.from_status),
        txt(h.to_status),
        txt(h.note),
      ]),
    },
    {
      kind: "table",
      title: "5. Nhật ký các bước quy trình",
      headers: ["Thời điểm", "Bước", "Chuyển trạng thái", "Ghi chú"],
      rows: (stepLogs.data ?? []).map((s: any) => [
        fmtDateTime(s.occurred_at),
        txt(s.step_key),
        `${txt(s.from_status)} → ${txt(s.to_status)}`,
        txt(s.note),
      ]),
    },
    {
      kind: "table",
      title: "6. Danh mục giấy tờ (checklist)",
      headers: ["Mã", "Tên giấy tờ", "Bắt buộc", "Tình trạng", "Duyệt lúc", "Ghi chú"],
      rows: (checklist.data ?? []).map((k: any) => [
        txt(k.doc_code),
        txt(k.doc_name),
        k.is_required ? "Có" : "Không",
        txt(k.status),
        fmtDateTime(k.reviewed_at),
        txt(k.note),
      ]),
    },
    {
      kind: "table",
      title: "7. Tệp giấy tờ đã tải lên",
      headers: ["Loại", "Tên tệp", "Dung lượng", "Đã xác minh", "Xác minh lúc", "Tải lên"],
      rows: (documents.data ?? []).map((d: any) => [
        txt(d.doc_type),
        txt(d.file_name),
        d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : EMPTY,
        d.verified ? "Có" : "Không",
        fmtDateTime(d.verified_at),
        fmtDateTime(d.created_at),
      ]),
    },
    {
      kind: "table",
      title: "8. Lớp học đã ghi danh",
      headers: ["Mã lớp", "Tên lớp", "Khai giảng", "Kết thúc", "Trạng thái", "Điểm tổng kết"],
      rows: enrollRows.map((e) => [
        txt(e.training_classes?.code),
        txt(e.training_classes?.name),
        fmtDate(e.training_classes?.start_date),
        fmtDate(e.training_classes?.end_date),
        txt(e.status),
        txt(e.final_grade),
      ]),
    },
    {
      kind: "table",
      title: `9. Điểm danh (chuyên cần: ${attendanceRate})`,
      headers: ["Ngày", "Buổi", "Nội dung", "Tình trạng", "Hình thức", "Giờ vào"],
      rows: attendance.map((a) => [
        fmtDate(a.training_sessions?.session_date),
        txt(a.training_sessions?.session_no),
        txt(a.training_sessions?.title),
        ATT[a.status] ?? txt(a.status),
        txt(a.check_in_method),
        fmtDateTime(a.check_in_at),
      ]),
    },
    {
      kind: "table",
      title: "10. Điểm số",
      headers: ["Ngày", "Loại", "Tên bài", "Điểm", "Thang", "Nhận xét"],
      rows: grades.map((g) => [
        fmtDate(g.assessed_at),
        txt(g.assessment_type),
        txt(g.title),
        txt(g.score),
        txt(g.max_score),
        txt(g.comment),
      ]),
    },
    {
      kind: "table",
      title: "11. Chứng chỉ đã cấp",
      headers: ["Số hiệu", "Tên chứng chỉ", "Mã tra cứu", "Ngày cấp", "Trạng thái"],
      rows: (certificates.data ?? []).map((r: any) => [
        txt(r.certificate_number),
        txt(r.title),
        txt(r.verify_code),
        fmtDate(r.issued_at),
        txt(r.status),
      ]),
    },
    {
      kind: "table",
      title: "12. Nhật ký chăm sóc",
      headers: ["Thời điểm", "Kênh", "Nội dung"],
      rows: (careLogs.data ?? []).map((r: any) => [
        fmtDateTime(r.created_at),
        txt(r.channel),
        txt(r.content),
      ]),
    },
    {
      kind: "table",
      title: "13. Nhận xét & kỷ luật",
      headers: ["Thời điểm", "Loại", "Mức độ", "Tiêu đề", "Chi tiết"],
      rows: [
        ...(conduct.data ?? []).map((r: any) => [
          fmtDateTime(r.created_at),
          txt(r.record_type),
          txt(r.severity),
          txt(r.title),
          txt(r.detail),
        ]),
        ...(reviews.data ?? []).map((r: any) => [
          fmtDateTime(r.created_at),
          "Đánh giá định kỳ",
          txt(r.overall_score),
          txt(r.period_label),
          txt(r.comment),
        ]),
      ],
    },
    {
      kind: "table",
      title: "14. Lưu trữ hồ sơ vật lý (kho ngoài đời thực)",
      headers: ["Mã phiếu", "Tài liệu", "Vị trí kho", "SL", "Tình trạng", "Ngày nhập", "Trạng thái", "Mượn / Hạn trả"],
      rows: (archive.data ?? []).map((r: any) => [
        txt(r.item_code),
        `${txt(r.title)}${r.doc_kind ? ` (${r.doc_kind})` : ""}`,
        locationText(r.archive_locations),
        txt(r.quantity),
        txt(r.condition),
        fmtDate(r.stored_at),
        ARCHIVE_STATUS[r.status] ?? txt(r.status),
        r.borrower_name
          ? `${r.borrower_name} · ${fmtDate(r.borrowed_at)} → ${fmtDate(r.due_date)}`
          : EMPTY,
      ]),
    },
    {
      kind: "table",
      title: "15. Nhật ký trách nhiệm (ai xử lý, lúc nào)",
      headers: ["Thời điểm", "Người xử lý", "Việc", "Nội dung", "Từ", "Sang", "Ghi chú"],
      rows: (activity.data ?? []).map((a: any) => [
        fmtDateTime(a.created_at),
        a.actor_id
          ? (activityNames[a.actor_id] ?? a.actor_email ?? "Người dùng nội bộ")
          : "Hệ thống (tự động)",
        ACTIVITY_ACTION[a.action] ?? txt(a.action),
        txt(a.field),
        txt(a.old_value),
        txt(a.new_value),
        txt(a.note),
      ]),
    },
  ];


  const docFiles = (documents.data ?? [])
    .filter((d: any) => d.file_path)
    .map((d: any) => ({
      path: d.file_path as string,
      label: `${slug(d.doc_type || "giay-to")}_${String(d.created_at).slice(0, 10)}_${d.file_name || "file"}`,
    }));

  return {
    profile,
    studentCode: profile.student_code || String(profile.id).slice(0, 8),
    fullName: profile.full_name || "Hoc vien",
    sections,
    docFiles,
  };
}

export function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export async function checksum(bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* --------------------------------- PDF ----------------------------------- */

export type ExportMeta = {
  exportedByEmail: string;
  purposeLabel: string;
  note: string;
  exportedAt: Date;
};

export async function buildPdf(d: Dossier, meta: ExportMeta): Promise<Uint8Array> {
  const { PDFDocument, rgb, fontkit } = await loadPdfLibs();
  const fonts = await loadFonts();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fonts.regular, { subset: true });
  const bold = await pdf.embedFont(fonts.bold, { subset: true });

  const W = 595.28;
  const H = 841.89;
  const M = 40;
  const dark = rgb(0.12, 0.12, 0.16);
  const grey = rgb(0.45, 0.45, 0.5);
  const red = rgb(0.79, 0.11, 0.15);
  const line = rgb(0.85, 0.85, 0.88);

  let page: any;
  let y = 0;

  const headerHeight = 54;
  function newPage() {
    page = pdf.addPage([W, H]);
    page.drawText("CÔNG TY CỔ PHẦN NHÂN LỰC QUỐC TẾ KAIZEN", {
      x: M,
      y: H - 34,
      size: 10,
      font: bold,
      color: red,
    });
    page.drawText(`HỒ SƠ 360° — ${d.studentCode} — ${d.fullName}`, {
      x: M,
      y: H - 47,
      size: 8.5,
      font,
      color: grey,
    });
    page.drawLine({
      start: { x: M, y: H - headerHeight },
      end: { x: W - M, y: H - headerHeight },
      thickness: 0.7,
      color: line,
    });
    y = H - headerHeight - 22;
  }
  newPage();

  function need(h: number) {
    if (y - h < 60) newPage();
  }

  function splitLongWord(w: string, size: number, f: any, maxW: number): string[] {
    if (f.widthOfTextAtSize(w, size) <= maxW) return [w];
    const parts: string[] = [];
    let cur = "";
    for (const ch of w) {
      if (f.widthOfTextAtSize(cur + ch, size) > maxW && cur) {
        parts.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  }

  function wrap(text: string, size: number, f: any, maxW: number): string[] {
    const words = String(text)
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .flatMap((w) => splitLongWord(w, size, f, maxW));
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > maxW && cur) {
        out.push(cur);
        cur = w;
      } else cur = t;
    }
    out.push(cur || EMPTY);
    return out;
  }

  const green = rgb(0.247, 0.49, 0.227); // #3F7D3A
  const zebra = rgb(0.968, 0.972, 0.98);
  const labelBg = rgb(0.945, 0.945, 0.957);
  const white = rgb(1, 1, 1);
  const border = rgb(0.78, 0.78, 0.82);

  function cellBox(x: number, yTop: number, w: number, h: number, fill?: any) {
    page.drawRectangle({
      x,
      y: yTop - h,
      width: w,
      height: h,
      ...(fill ? { color: fill } : {}),
      borderColor: border,
      borderWidth: 0.5,
    });
  }

  function drawSectionTitle(title: string) {
    need(34);
    const avail = W - M * 2;
    page.drawRectangle({ x: M, y: y - 6, width: avail, height: 20, color: red });
    page.drawText(title, { x: M + 6, y, size: 10.5, font: bold, color: white });
    y -= 28;
  }

  function drawFields(rows: Array<[string, string]>) {
    const labelW = 160;
    const avail = W - M * 2;
    const valW = avail - labelW;
    for (const [k, v] of rows) {
      const vLines = wrap(v, 9, font, valW - 10);
      const kLines = wrap(k, 9, bold, labelW - 10);
      const h = Math.max(vLines.length, kLines.length) * 12 + 8;
      if (y - h < 60) newPage();
      const top = y + 10;
      cellBox(M, top, labelW, h, labelBg);
      cellBox(M + labelW, top, valW, h);
      kLines.forEach((ln, i) => {
        page.drawText(ln, { x: M + 5, y: top - 14 - i * 12, size: 9, font: bold, color: dark });
      });
      vLines.forEach((ln, i) => {
        page.drawText(ln, {
          x: M + labelW + 5,
          y: top - 14 - i * 12,
          size: 9,
          font,
          color: dark,
        });
      });
      y -= h;
    }
    y -= 14;
  }

  function drawTable(headers: string[], rows: string[][]) {
    if (!rows.length) {
      need(24);
      page.drawText("Không có dữ liệu.", { x: M, y, size: 9, font, color: grey });
      y -= 26;
      return;
    }
    const avail = W - M * 2;
    const colW = headers.map(() => avail / headers.length);
    if (headers.length > 2) {
      const extra = avail * 0.12;
      colW[colW.length - 1] += extra;
      for (let i = 0; i < colW.length - 1; i++) colW[i] -= extra / (colW.length - 1);
    }

    const drawHead = () => {
      const hLines = headers.map((h, i) => wrap(h, 8.5, bold, colW[i]! - 8));
      const hh = Math.max(...hLines.map((l) => l.length)) * 11 + 8;
      if (y - hh < 60) newPage();
      const top = y + 10;
      let x = M;
      hLines.forEach((lines, i) => {
        page.drawRectangle({ x, y: top - hh, width: colW[i]!, height: hh, color: green });
        lines.forEach((ln, j) => {
          page.drawText(ln, { x: x + 4, y: top - 13 - j * 11, size: 8.5, font: bold, color: white });
        });
        x += colW[i]!;
      });
      y -= hh;
    };
    drawHead();

    rows.forEach((r, ri) => {
      const cellLines = headers.map((_, i) => wrap(r[i] ?? EMPTY, 8, font, colW[i]! - 8).slice(0, 6));
      const h = Math.max(...cellLines.map((l) => l.length)) * 10 + 8;
      if (y - h < 60) {
        newPage();
        drawHead();
      }
      const top = y + 10;
      let x = M;
      cellLines.forEach((lines, i) => {
        cellBox(x, top, colW[i]!, h, ri % 2 === 1 ? zebra : undefined);
        lines.forEach((ln, j) => {
          page.drawText(ln, { x: x + 4, y: top - 13 - j * 10, size: 8, font, color: dark });
        });
        x += colW[i]!;
      });
      y -= h;
    });
    y -= 16;
  }

  // Trang bìa
  page.drawRectangle({ x: M, y: y - 22, width: W - M * 2, height: 40, color: red });
  page.drawText("HỒ SƠ HỌC VIÊN 360°", { x: M + 10, y: y - 8, size: 18, font: bold, color: white });
  y -= 48;
  drawFields([
    ["Mã học viên", d.studentCode],
    ["Họ và tên", d.fullName],
    ["Mục đích xuất", meta.purposeLabel],
    ["Lý do / ghi chú", meta.note || EMPTY],
    ["Người xuất", meta.exportedByEmail],
    ["Thời điểm xuất", fmtDateTime(meta.exportedAt)],
  ]);

  for (const s of d.sections) {
    drawSectionTitle(s.title);
    if (s.kind === "fields") drawFields(s.rows);
    else drawTable(s.headers, s.rows);
  }


  // Trang xác nhận
  newPage();
  page.drawText("XÁC NHẬN & TÍNH TOÀN VẸN", { x: M, y, size: 13, font: bold, color: red });
  y -= 26;
  drawFields([
    ["Tổng số mục dữ liệu", String(d.sections.length)],
    ["Người xuất", meta.exportedByEmail],
    ["Thời điểm xuất", fmtDateTime(meta.exportedAt)],
    ["Mục đích", meta.purposeLabel],
  ]);
  y -= 10;
  page.drawText(
    "Bản hồ sơ này được kết xuất tự động từ hệ thống quản trị Kaizen. Mã kiểm tra tính toàn vẹn",
    { x: M, y, size: 9, font, color: grey },
  );
  y -= 12;
  page.drawText("(SHA-256) được ghi trong nhật ký xuất hồ sơ tại /admin/students.", {
    x: M,
    y,
    size: 9,
    font,
    color: grey,
  });
  y -= 60;
  page.drawText("Cán bộ lập hồ sơ", { x: M, y, size: 10, font: bold, color: dark });
  page.drawText("Người đại diện đơn vị", { x: W / 2 + 20, y, size: 10, font: bold, color: dark });
  page.drawText("(Ký, ghi rõ họ tên)", { x: M, y: y - 14, size: 8.5, font, color: grey });
  page.drawText("(Ký, đóng dấu)", { x: W / 2 + 20, y: y - 14, size: 8.5, font, color: grey });

  // Chân trang
  const pages = pdf.getPages();
  pages.forEach((p: any, i: number) => {
    p.drawLine({
      start: { x: M, y: 46 },
      end: { x: W - M, y: 46 },
      thickness: 0.5,
      color: line,
    });
    p.drawText(`Xuất bởi ${meta.exportedByEmail} · ${fmtDateTime(meta.exportedAt)}`, {
      x: M,
      y: 33,
      size: 7.5,
      font,
      color: grey,
    });
    const label = `Trang ${i + 1}/${pages.length}`;
    p.drawText(label, {
      x: W - M - font.widthOfTextAtSize(label, 7.5),
      y: 33,
      size: 7.5,
      font,
      color: grey,
    });
  });

  return pdf.save();
}

/* -------------------------------- Excel ---------------------------------- */

export async function buildXlsx(d: Dossier, meta: ExportMeta): Promise<Uint8Array> {
  const { buildStyledWorkbook } = await import("./xlsx-report.server");
  const subtitle = `${d.studentCode} — ${d.fullName}`;
  const footer = `Xuất bởi ${meta.exportedByEmail} • ${fmtDateTime(meta.exportedAt)} • Mục đích: ${meta.purposeLabel}`;

  const sectionNames = d.sections.map((s) => s.title);
  const cover = {
    name: "Thong tin xuat",
    title: "HỒ SƠ HỌC VIÊN 360°",
    subtitle,
    kind: "fields" as const,
    headers: ["Trường thông tin", "Giá trị"],
    rows: [
      ["Mã học viên", d.studentCode],
      ["Họ và tên", d.fullName],
      ["Mục đích xuất", meta.purposeLabel],
      ["Lý do / ghi chú", meta.note || EMPTY],
      ["Người xuất", meta.exportedByEmail],
      ["Thời điểm xuất", fmtDateTime(meta.exportedAt)],
      ["Số phần dữ liệu", String(d.sections.length)],
      ["Mục lục", sectionNames.map((n, i) => `${i + 1}. ${n}`).join("\n") || EMPTY],
    ] as string[][],
    footer,
  };

  const sheets = [
    cover,
    ...d.sections.map((s) => ({
      name: slug(s.title).replace(/-/g, " ").slice(0, 31) || "sheet",
      title: s.title.toUpperCase(),
      subtitle,
      kind: s.kind,
      headers: s.kind === "fields" ? ["Trường thông tin", "Giá trị"] : s.headers,
      rows: s.kind === "fields" ? s.rows.map((r) => [r[0], r[1]]) : s.rows,
      footer,
    })),
  ];

  return await buildStyledWorkbook(sheets);
}

/* --------------------------------- ZIP ------------------------------------ */

export async function buildZip(
  supabaseAdmin: any,
  d: Dossier,
  meta: ExportMeta,
  pdf: Uint8Array,
  xlsx: Uint8Array,
  baseName: string,
): Promise<Uint8Array> {
  const { zipSync, strToU8 } = await import("fflate");
  const files: Record<string, Uint8Array> = {
    [`${baseName}.pdf`]: pdf,
    [`${baseName}.xlsx`]: xlsx,
  };

  const indexLines = [
    "MỤC LỤC GÓI HỒ SƠ 360°",
    `Mã học viên: ${d.studentCode}`,
    `Họ tên: ${d.fullName}`,
    `Mục đích: ${meta.purposeLabel}`,
    `Người xuất: ${meta.exportedByEmail}`,
    `Thời điểm: ${fmtDateTime(meta.exportedAt)}`,
    "",
    `1. ${baseName}.pdf — hồ sơ tổng hợp bản in`,
    `2. ${baseName}.xlsx — dữ liệu chi tiết theo từng sheet`,
    "3. giay-to/ — bản chụp giấy tờ đã tải lên:",
  ];

  let i = 0;
  for (const f of d.docFiles) {
    try {
      const { data, error } = await supabaseAdmin.storage.from("student-docs").download(f.path);
      if (error || !data) throw error ?? new Error("no data");
      const buf = new Uint8Array(await data.arrayBuffer());
      const name = `giay-to/${String(++i).padStart(2, "0")}_${slug(f.label).slice(0, 60)}${extOf(f.path)}`;
      files[name] = buf;
      indexLines.push(`   - ${name}`);
    } catch {
      indexLines.push(`   - (LỖI TẢI) ${f.path}`);
    }
  }
  if (!i) indexLines.push("   - (không có tệp giấy tờ nào)");

  files["MUC-LUC.txt"] = strToU8(indexLines.join("\n"));
  return zipSync(files, { level: 6 });
}

function extOf(path: string): string {
  const m = /\.[a-zA-Z0-9]{1,5}$/.exec(path);
  return m ? m[0] : "";
}
