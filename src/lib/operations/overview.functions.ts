import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Nhãn tiếng Việt cho trạng thái hồ sơ học viên (dùng chung cho trang tổng quan vận hành). */
export const STUDENT_STATUS_LABEL: Record<string, string> = {
  lead_new: "Lead mới",
  lead_contacted: "Đã liên hệ",
  consulting: "Đang tư vấn",
  contract_pending: "Chờ ký hợp đồng",
  contract_signed: "Đã ký hợp đồng",
  class_pending: "Chờ xếp lớp",
  training: "Đang học",
  exam_pending: "Chờ thi",
  training_passed: "Đạt đầu ra",
  transfer_visa: "Chuyển hồ sơ visa",
  visa_processing: "Đang xử lý visa",
  visa_granted: "Đã có visa",
  departure_pending: "Chờ xuất cảnh",
  departed: "Đã xuất cảnh",
  post_departure: "Sau xuất cảnh",
  completed: "Hoàn tất",
  dropped: "Ngưng theo",
};

export const VISA_STATUS_LABEL: Record<string, string> = {
  not_started: "Chưa nộp",
  preparing: "Đang chuẩn bị",
  submitted: "Đã nộp",
  granted: "Được cấp",
  rejected: "Từ chối",
};

type Bucket = { key: string; label: string; count: number };

function tally(rows: Array<Record<string, any>>, field: string, labels: Record<string, string>, emptyLabel: string): Bucket[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const raw = (r[field] ?? "") as string;
    const key = raw || "__empty";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, label: key === "__empty" ? emptyLabel : (labels[key] ?? key), count }))
    .sort((a, b) => b.count - a.count);
}

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}


/** Chỉ nhân sự khối vận hành/đào tạo mới được xem số liệu tổng hợp toàn hệ thống. */
async function assertOverviewAccess(context: { supabase: any; userId: string }) {
  const { data: roleRows } = await context.supabase
    .from("user_roles").select("role").eq("user_id", context.userId);
  const roles = (roleRows ?? []).map((r: any) => r.role as string);
  const ALLOWED = ["admin", "training_manager", "training_staff", "teacher", "cskh", "consultant", "visa_officer", "departure_coordinator", "market_head"];
  if (!roles.some((r: string) => ALLOWED.includes(r))) throw new Error("Forbidden");
}

/** Tổng hợp toàn bộ số liệu cho trang landing "Vận hành & Đào tạo". */
export const getOperationsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOverviewAccess(context);


    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin;
    const now = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const in90 = new Date(now.getTime() + 90 * 86400000);
    const last30 = new Date(now.getTime() - 30 * 86400000);
    const next7 = new Date(now.getTime() + 7 * 86400000);

    const [
      students,
      classes,
      sessions,
      enrollments,
      attendance,
      checklist,
      workflow,
      teachers,
      certificates,
      queue,
    ] = await Promise.all([
      sb.from("student_profiles")
        .select("id, current_status, visa_status, market:country, program_type, contract_end_date, created_at, full_name, student_code, destination_country")
        .is("deleted_at", null),
      sb.from("training_classes").select("id, name, code, status, start_date, end_date, max_students"),
      sb.from("training_sessions").select("id, class_id, session_date, status").gte("session_date", iso(last30)).lte("session_date", iso(next7)),
      sb.from("training_enrollments").select("id, class_id, status, final_grade"),
      sb.from("training_attendance").select("id, status, created_at").gte("created_at", last30.toISOString()),
      sb.from("student_document_checklist").select("id, status, is_required, stage, due_date"),
      sb.from("workflow_instances").select("id, status, current_step"),
      sb.from("teachers").select("id, is_active"),
      sb.from("certificates").select("id, issued_at, status"),
      sb.from("account_provision_queue").select("id, status"),
    ]);

    const err = [students, classes, sessions, enrollments, attendance, checklist, workflow, teachers, certificates, queue]
      .find((r: any) => r.error)?.error;
    if (err) throw new Error(err.message);

    const S = (students.data ?? []) as any[];
    const C = (classes.data ?? []) as any[];
    const SE = (sessions.data ?? []) as any[];
    const EN = (enrollments.data ?? []) as any[];
    const AT = (attendance.data ?? []) as any[];
    const CK = (checklist.data ?? []) as any[];
    const WF = (workflow.data ?? []) as any[];
    const TE = (teachers.data ?? []) as any[];
    const CE = (certificates.data ?? []) as any[];
    const QU = (queue.data ?? []) as any[];

    const attTotal = AT.length;
    const attPresent = AT.filter((a) => a.status === "present" || a.status === "late").length;

    const expiring = S
      .filter((s) => s.contract_end_date && new Date(s.contract_end_date) >= now && new Date(s.contract_end_date) <= in90)
      .map((s) => ({
        id: s.id as string,
        name: (s.full_name ?? "") as string,
        code: (s.student_code ?? "") as string,
        country: (s.destination_country ?? s.market ?? "") as string,
        endDate: s.contract_end_date as string,
        daysLeft: daysBetween(new Date(s.contract_end_date), now),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 8);

    const overdueDocs = CK.filter(
      (c) => c.is_required && c.status !== "verified" && c.status !== "not_applicable" && c.due_date && new Date(c.due_date) < now,
    ).length;

    return {
      generatedAt: now.toISOString(),
      students: {
        total: S.length,
        newLast30: S.filter((s) => s.created_at && new Date(s.created_at) >= last30).length,
        inTraining: S.filter((s) => s.current_status === "training").length,
        visaStage: S.filter((s) => ["transfer_visa", "visa_processing", "visa_granted"].includes(s.current_status)).length,
        departed: S.filter((s) => ["departed", "post_departure", "completed"].includes(s.current_status)).length,
        byStatus: tally(S, "current_status", STUDENT_STATUS_LABEL, "Chưa đặt"),
        byVisa: tally(S, "visa_status", VISA_STATUS_LABEL, "Chưa có hồ sơ visa"),
        byProgramType: tally(S, "program_type", { du_hoc: "Du học", xkld: "XKLĐ", thuc_tap_sinh: "Thực tập sinh" }, "Chưa phân loại"),
        byMarket: tally(S, "market", {}, "Chưa rõ").slice(0, 8),
      },
      training: {
        classesTotal: C.length,
        classesRunning: C.filter((c) => c.status === "in_progress").length,
        classesScheduled: C.filter((c) => c.status === "scheduled").length,
        classesCompleted: C.filter((c) => c.status === "completed").length,
        enrollmentsActive: EN.filter((e) => e.status === "active" || e.status === "studying" || !e.status).length,
        sessionsNext7: SE.filter((s) => s.session_date >= iso(now) && s.session_date <= iso(next7)).length,
        attendanceRate: attTotal ? Math.round((attPresent / attTotal) * 100) : null,
        attendanceRecords: attTotal,
        avgGrade: (() => {
          const g = EN.map((e) => Number(e.final_grade)).filter((n) => Number.isFinite(n));
          return g.length ? Math.round((g.reduce((a, b) => a + b, 0) / g.length) * 10) / 10 : null;
        })(),
        teachersActive: TE.filter((t) => t.is_active !== false).length,
        certificatesIssued: CE.filter((c) => c.status === "issued").length,
      },
      documents: {
        total: CK.length,
        verified: CK.filter((c) => c.status === "verified").length,
        missing: CK.filter((c) => c.status === "missing").length,
        overdue: overdueDocs,
        byStage: tally(
          CK.filter((c) => c.is_required && c.status !== "verified"),
          "stage",
          { dang_ky: "Đăng ký", dao_tao: "Đào tạo", visa: "Visa", xuat_canh: "Xuất cảnh", sau_xuat_canh: "Sau xuất cảnh" },
          "Chưa gán giai đoạn",
        ),
      },
      workflow: {
        active: WF.filter((w) => w.status === "active").length,
        done: WF.filter((w) => w.status === "done").length,
        byStep: tally(WF.filter((w) => w.status === "active"), "current_step", {}, "Chưa bắt đầu").slice(0, 8),
      },
      alerts: {
        contractsExpiring: expiring.length,
        expiringList: expiring,
        accountQueuePending: QU.filter((q) => q.status === "pending" || q.status === "error").length,
        docsOverdue: overdueDocs,
      },
      classList: C
        .filter((c) => c.status === "in_progress" || c.status === "scheduled")
        .map((c) => ({
          id: c.id as string,
          name: (c.name ?? c.code ?? "") as string,
          status: c.status as string,
          startDate: c.start_date as string | null,
          endDate: c.end_date as string | null,
          students: EN.filter((e) => e.class_id === c.id).length,
          capacity: (c.max_students ?? null) as number | null,
        }))
        .slice(0, 8),
    };
  });

// ---------------------------------------------------------------------------
// Chi tiết dữ liệu thực đứng sau mỗi biểu đồ + xuất báo cáo Excel
// ---------------------------------------------------------------------------

const PROGRAM_TYPE_LABEL: Record<string, string> = {
  du_hoc: "Du học",
  xkld: "XKLĐ",
  thuc_tap_sinh: "Thực tập sinh",
};

const STAGE_LABEL: Record<string, string> = {
  dang_ky: "Đăng ký",
  dao_tao: "Đào tạo",
  visa: "Visa",
  xuat_canh: "Xuất cảnh",
  sau_xuat_canh: "Sau xuất cảnh",
};

const CHECKLIST_STATUS_LABEL: Record<string, string> = {
  missing: "Thiếu",
  submitted: "Đã nộp",
  verified: "Đã duyệt",
  rejected: "Từ chối",
  not_applicable: "Không áp dụng",
};

export type ChartDimension =
  | "students.status"
  | "students.visa"
  | "students.program"
  | "students.market"
  | "documents.stage"
  | "workflow.step";

export const CHART_DIMENSION_TITLE: Record<ChartDimension, string> = {
  "students.status": "Học viên theo trạng thái",
  "students.visa": "Hồ sơ visa",
  "students.program": "Học viên theo chương trình",
  "students.market": "Thị trường / nước đến",
  "documents.stage": "Hồ sơ còn thiếu theo giai đoạn",
  "workflow.step": "Workflow đang chạy theo bước",
};

type DetailPayload = {
  dimension: ChartDimension;
  title: string;
  generatedAt: string;
  headers: string[];
  rows: string[][];
  /** Chỉ số cột chứa "hạng mục" để lọc trong hộp thoại */
  groupIndex: number;
  summary: Array<{ label: string; count: number }>;
};

const vnDate = (v: string | null | undefined) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

function summarize(rows: string[][], groupIndex: number): Array<{ label: string; count: number }> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = r[groupIndex] || "Chưa đặt";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export async function loadChartDetail(dimension: ChartDimension): Promise<DetailPayload> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sb = supabaseAdmin;
  const now = new Date();
  const generatedAt = now.toISOString();
  const title = CHART_DIMENSION_TITLE[dimension];

  if (dimension.startsWith("students.")) {
    const { data, error } = await sb
      .from("student_profiles")
      .select(
        "student_code, full_name, phone, email, current_status, visa_status, program_type, country, destination_country, destination_city, employer_name, contract_end_date, created_at",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    const S = (data ?? []) as any[];

    const groupOf = (s: any): string => {
      if (dimension === "students.status") return STUDENT_STATUS_LABEL[s.current_status] ?? s.current_status ?? "Chưa đặt";
      if (dimension === "students.visa") return VISA_STATUS_LABEL[s.visa_status] ?? s.visa_status ?? "Chưa có hồ sơ visa";
      if (dimension === "students.program") return PROGRAM_TYPE_LABEL[s.program_type] ?? s.program_type ?? "Chưa phân loại";
      return s.country || "Chưa rõ";
    };

    const headers = [
      "Hạng mục", "Mã học viên", "Họ và tên", "Điện thoại", "Email",
      "Trạng thái hồ sơ", "Trạng thái visa", "Chương trình", "Thị trường",
      "Nước đến", "Thành phố đến", "Nơi làm việc", "Hạn hợp đồng", "Ngày tạo hồ sơ",
    ];
    const rows = S.map((s) => [
      groupOf(s),
      s.student_code ?? "",
      s.full_name ?? "",
      s.phone ?? "",
      s.email ?? "",
      STUDENT_STATUS_LABEL[s.current_status] ?? s.current_status ?? "",
      VISA_STATUS_LABEL[s.visa_status] ?? s.visa_status ?? "",
      PROGRAM_TYPE_LABEL[s.program_type] ?? s.program_type ?? "",
      s.country ?? "",
      s.destination_country ?? "",
      s.destination_city ?? "",
      s.employer_name ?? "",
      vnDate(s.contract_end_date),
      vnDate(s.created_at),
    ]);
    return { dimension, title, generatedAt, headers, rows, groupIndex: 0, summary: summarize(rows, 0) };
  }

  if (dimension === "documents.stage") {
    const { data, error } = await sb
      .from("student_document_checklist")
      .select("doc_name, doc_code, stage, status, is_required, due_date, hard_copy_received, note, updated_at, student_profile_id")
      .eq("is_required", true)
      .neq("status", "verified")
      .limit(5000);
    if (error) throw new Error(error.message);
    const CK = (data ?? []) as any[];
    const ids = [...new Set(CK.map((c) => c.student_profile_id).filter(Boolean))];
    const nameMap = new Map<string, { code: string; name: string; phone: string }>();
    if (ids.length) {
      const { data: sp } = await sb
        .from("student_profiles")
        .select("id, student_code, full_name, phone")
        .in("id", ids);
      for (const s of (sp ?? []) as any[]) {
        nameMap.set(s.id, { code: s.student_code ?? "", name: s.full_name ?? "", phone: s.phone ?? "" });
      }
    }
    const headers = [
      "Hạng mục", "Mã học viên", "Họ và tên", "Điện thoại", "Tên tài liệu",
      "Mã tài liệu", "Trạng thái", "Hạn nộp", "Số ngày quá hạn", "Đã nhận bản cứng", "Ghi chú",
    ];
    const rows = CK.map((c) => {
      const st = nameMap.get(c.student_profile_id) ?? { code: "", name: "", phone: "" };
      const overdue = c.due_date && new Date(c.due_date) < now
        ? String(Math.round((now.getTime() - new Date(c.due_date).getTime()) / 86400000))
        : "";
      return [
        STAGE_LABEL[c.stage] ?? c.stage ?? "Chưa gán giai đoạn",
        st.code, st.name, st.phone,
        c.doc_name ?? "",
        c.doc_code ?? "",
        CHECKLIST_STATUS_LABEL[c.status] ?? c.status ?? "",
        vnDate(c.due_date),
        overdue,
        c.hard_copy_received ? "Có" : "Chưa",
        c.note ?? "",
      ];
    });
    return { dimension, title, generatedAt, headers, rows, groupIndex: 0, summary: summarize(rows, 0) };
  }

  // workflow.step
  const { data, error } = await sb
    .from("workflow_instances")
    .select("current_step, status, started_at, updated_at, student_profile_id")
    .eq("status", "active")
    .limit(5000);
  if (error) throw new Error(error.message);
  const WF = (data ?? []) as any[];
  const ids = [...new Set(WF.map((w) => w.student_profile_id).filter(Boolean))];
  const map = new Map<string, any>();
  if (ids.length) {
    const { data: sp } = await sb
      .from("student_profiles")
      .select("id, student_code, full_name, phone, current_status, country")
      .in("id", ids);
    for (const s of (sp ?? []) as any[]) map.set(s.id, s);
  }
  const headers = [
    "Hạng mục", "Mã học viên", "Họ và tên", "Điện thoại", "Trạng thái hồ sơ",
    "Thị trường", "Bước hiện tại", "Trạng thái workflow", "Bắt đầu", "Cập nhật gần nhất",
  ];
  const rows = WF.map((w) => {
    const s = map.get(w.student_profile_id) ?? {};
    return [
      String(w.current_step ?? "Chưa bắt đầu"),
      s.student_code ?? "",
      s.full_name ?? "",
      s.phone ?? "",
      STUDENT_STATUS_LABEL[s.current_status] ?? s.current_status ?? "",
      s.country ?? "",
      String(w.current_step ?? ""),
      w.status ?? "",
      vnDate(w.started_at),
      vnDate(w.updated_at),
    ];
  });
  return { dimension, title, generatedAt, headers, rows, groupIndex: 0, summary: summarize(rows, 0) };
}

const parseDimension = (d: unknown): { dimension: ChartDimension } => {
  const dim = (d as any)?.dimension;
  if (!dim || !(dim in CHART_DIMENSION_TITLE)) throw new Error("Biểu đồ không hợp lệ");
  return { dimension: dim as ChartDimension };
};

/** Danh sách dữ liệu thực đứng sau một biểu đồ (dùng cho hộp thoại "Xem chi tiết"). */
export const getOperationsChartDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseDimension)
  .handler(async ({ data, context }) => {
    await assertOverviewAccess(context);
    return loadChartDetail(data.dimension);
  });

/** Xuất báo cáo Excel (Tổng hợp + Chi tiết) cho một biểu đồ. */
export const exportOperationsChartReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseDimension)
  .handler(async ({ data, context }) => {
    await assertOverviewAccess(context);
    const detail = await loadChartDetail(data.dimension);
    const { buildChartReportWorkbook } = await import("./report.server");
    const bytes = await buildChartReportWorkbook({
      title: detail.title,
      exportedBy: (context.claims?.email as string) ?? context.userId,
      generatedAt: detail.generatedAt,
      summary: detail.summary,
      headers: detail.headers,
      rows: detail.rows,
    });
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    const slug = detail.title.replace(/[^\p{L}\p{N}]+/gu, "_");
    return {
      filename: `BaoCao_${slug}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      base64: btoa(bin),
      count: detail.rows.length,
    };
  });
