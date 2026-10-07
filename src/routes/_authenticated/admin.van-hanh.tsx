import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  getOperationsOverview,
  getOperationsChartDetail,
  exportOperationsChartReport,
  type ChartDimension,
} from "@/lib/operations/overview.functions";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errors";
import { useMyAccess } from "@/lib/rbac/use-access";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { Permission } from "@/lib/rbac/permissions";
import { useState } from "react";
import {
  IdCard, Workflow, School, UserCog, ClipboardCheck, Award, Folder, AlertTriangle,
  CalendarDays, GraduationCap, FileWarning, TrendingUp, LifeBuoy,
  Table as TableIcon, Download,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/van-hanh")({
  component: OperationsLanding,
});

type Tile = { to: string; label: string; desc: string; icon: any; perm: Permission };

const GROUPS: Array<{ title: string; tiles: Tile[] }> = [
  {
    title: "Hồ sơ & Thủ tục",
    tiles: [
      { to: "/admin/students", label: "Hồ sơ học viên", desc: "Danh sách, checklist, nơi làm việc, xuất hồ sơ 360°", icon: IdCard, perm: "students.view" },
      { to: "/admin/visa", label: "Thống kê visa", desc: "Tiến độ hồ sơ visa theo trạng thái", icon: IdCard, perm: "visa.view" },
      { to: "/admin/workflow", label: "Workflow 18 bước", desc: "Tiến trình từ tư vấn đến sau xuất cảnh", icon: Workflow, perm: "workflow.view" },
      { to: "/admin/operations", label: "SLA & Cấp tài khoản", desc: "Việc quá hạn và hàng đợi tài khoản Portal", icon: AlertTriangle, perm: "operations.view" },
      { to: "/admin/luu-tru", label: "Kho lưu trữ hồ sơ", desc: "Vị trí kệ/hộp hồ sơ giấy, mượn trả và truy vết", icon: IdCard, perm: "students.archive" },
      { to: "/admin/tra-soat", label: "Tra soát trách nhiệm", desc: "Nhật ký người xử lý hồ sơ từ đầu đến cuối", icon: AlertTriangle, perm: "audit.view" },
    ],
  },
  {
    title: "Đào tạo",
    tiles: [
      { to: "/admin/training", label: "Chương trình", desc: "Chương trình đào tạo và lớp học", icon: School, perm: "training.view" },
      { to: "/admin/training/oversight", label: "Giám sát lớp học", desc: "Chuyên cần, tiến độ, tình trạng nhập điểm", icon: School, perm: "oversight.view" },
      { to: "/admin/training/oversight", label: "Lịch trung tâm", desc: "Xếp lịch buổi học, cảnh báo trùng phòng/giáo viên", icon: CalendarDays, perm: "schedule.view" },
      { to: "/admin/training/analytics", label: "Thống kê đào tạo", desc: "So sánh kết quả theo lớp, giáo viên, chương trình", icon: TrendingUp, perm: "training.analytics" },
      { to: "/admin/teachers", label: "Giáo viên", desc: "Hồ sơ và phân công giáo viên", icon: UserCog, perm: "teachers.view" },
    ],
  },
  {
    title: "Học liệu & Danh mục",
    tiles: [
      { to: "/admin/materials", label: "Tài liệu học tập", desc: "Kho học liệu dùng chung", icon: Folder, perm: "materials.view" },
      { to: "/admin/quizzes", label: "Bài kiểm tra", desc: "Ngân hàng đề và kết quả", icon: ClipboardCheck, perm: "quizzes.view" },
      { to: "/admin/certificates", label: "Chứng chỉ", desc: "Cấp và tra cứu chứng chỉ", icon: Award, perm: "certificates.view" },
      { to: "/admin/catalog", label: "Danh mục hệ thống", desc: "Ngoại ngữ, giai đoạn, loại hồ sơ theo thị trường", icon: GraduationCap, perm: "catalog.view" },
    ],
  },
];

function OperationsLanding() {
  const { can } = useMyAccess();
  const fetchOverview = useServerFn(getOperationsOverview);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["operations-overview"],
    queryFn: () => fetchOverview(),
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  useRealtimeRefresh(
    [
      "student_profiles", "student_document_checklist", "workflow_instances",
      "training_classes", "training_sessions", "training_enrollments",
      "training_attendance", "certificates", "account_provision_queue",
    ],
    ["operations-overview"],
    "van-hanh-realtime",
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vận hành &amp; Đào tạo</h1>
          <p className="text-sm text-muted-foreground">
            Trung tâm điều hành: hồ sơ học viên, thủ tục visa, lớp học và học liệu — số liệu cập nhật trực tiếp.
          </p>
        </div>
        <Link
          to="/admin/huong-dan/$slug"
          params={{ slug: "van-hanh-tong-quan" }}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
        >
          <LifeBuoy className="h-4 w-4" /> Hướng dẫn khối vận hành
        </Link>
      </header>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Không tải được số liệu tổng quan. Hãy tải lại trang.
        </div>
      )}

      {/* Số liệu chính */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi accent label="Hồ sơ học viên" value={data?.students.total} hint={`+${data?.students.newLast30 ?? 0} trong 30 ngày`} loading={isLoading} />
        <Kpi label="Đang học" value={data?.students.inTraining} hint={`${data?.training.classesRunning ?? 0} lớp đang chạy`} loading={isLoading} />
        <Kpi label="Đang xử lý visa" value={data?.students.visaStage} hint={`${data?.students.departed ?? 0} đã xuất cảnh / hoàn tất`} loading={isLoading} />
        <Kpi
          label="Chuyên cần 30 ngày"
          value={data?.training.attendanceRate == null ? "—" : `${data.training.attendanceRate}%`}
          hint={`${data?.training.attendanceRecords ?? 0} lượt điểm danh`}
          loading={isLoading}
        />
      </section>

      {/* Cảnh báo */}
      <section className="grid gap-4 md:grid-cols-3">
        <AlertCard
          icon={FileWarning}
          label="Hồ sơ bắt buộc quá hạn"
          value={data?.alerts.docsOverdue ?? 0}
          to="/admin/students"
          tone={(data?.alerts.docsOverdue ?? 0) > 0 ? "danger" : "ok"}
        />
        <AlertCard
          icon={AlertTriangle}
          label="Hợp đồng hết hạn trong 90 ngày"
          value={data?.alerts.contractsExpiring ?? 0}
          to="/admin/students"
          tone={(data?.alerts.contractsExpiring ?? 0) > 0 ? "warn" : "ok"}
        />
        <AlertCard
          icon={UserCog}
          label="Chờ cấp tài khoản Portal"
          value={data?.alerts.accountQueuePending ?? 0}
          to="/admin/operations"
          tone={(data?.alerts.accountQueuePending ?? 0) > 0 ? "warn" : "ok"}
        />
      </section>

      {/* Biểu đồ phân bố */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DonutPanel dimension="students.status" title="Học viên theo trạng thái" rows={data?.students.byStatus ?? []} loading={isLoading} />
        <DonutPanel dimension="students.visa" title="Hồ sơ visa" rows={data?.students.byVisa ?? []} loading={isLoading} />
        <DonutPanel dimension="students.program" title="Học viên theo chương trình" rows={data?.students.byProgramType ?? []} loading={isLoading} />
        <DonutPanel dimension="students.market" title="Thị trường / nước đến" rows={data?.students.byMarket ?? []} loading={isLoading} />
        <DonutPanel dimension="documents.stage" title="Hồ sơ còn thiếu theo giai đoạn" rows={data?.documents.byStage ?? []} loading={isLoading} />
        <DonutPanel dimension="workflow.step" title="Workflow đang chạy theo bước" rows={data?.workflow.byStep ?? []} loading={isLoading} />
      </section>

      {/* Lớp học & hợp đồng */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Lớp đang mở</h2>
            <Link to="/admin/training" className="text-xs text-primary">Xem tất cả →</Link>
          </div>
          <div className="mt-3 divide-y text-sm">
            {(data?.classList ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.startDate ?? "—"} → {c.endDate ?? "—"} · {c.status === "in_progress" ? "Đang học" : "Sắp khai giảng"}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {c.students}{c.capacity ? `/${c.capacity}` : ""} HV
                </span>
              </div>
            ))}
            {!isLoading && (data?.classList ?? []).length === 0 && (
              <div className="py-3 text-muted-foreground">Chưa có lớp nào đang mở.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Hợp đồng sắp hết hạn</h2>
            <Link to="/admin/students" className="text-xs text-primary">Hồ sơ học viên →</Link>
          </div>
          <div className="mt-3 divide-y text-sm">
            {(data?.alerts.expiringList ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.code} · {s.country || "—"} · hết hạn {s.endDate}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${s.daysLeft <= 30 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"}`}>
                  còn {s.daysLeft} ngày
                </span>
              </div>
            ))}
            {!isLoading && (data?.alerts.expiringList ?? []).length === 0 && (
              <div className="py-3 text-muted-foreground">Không có hợp đồng nào sắp hết hạn.</div>
            )}
          </div>
        </div>
      </section>

      {/* Số liệu đào tạo phụ */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Tổng lớp học" value={data?.training.classesTotal} />
        <MiniStat label="Buổi học 7 ngày tới" value={data?.training.sessionsNext7} />
        <MiniStat label="Điểm trung bình" value={data?.training.avgGrade ?? "—"} />
        <MiniStat label="Chứng chỉ đã cấp" value={data?.training.certificatesIssued} />
        <MiniStat label="Giáo viên đang hoạt động" value={data?.training.teachersActive} />
        <MiniStat label="Ghi danh đang hiệu lực" value={data?.training.enrollmentsActive} />
        <MiniStat label="Mục hồ sơ đã duyệt" value={data?.documents.verified} />
        <MiniStat label="Mục hồ sơ còn thiếu" value={data?.documents.missing} />
      </section>

      {/* Lối vào nhanh */}
      {GROUPS.map((g) => {
        const tiles = g.tiles.filter((t) => can(t.perm));
        if (!tiles.length) return null;
        return (
          <section key={g.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {tiles.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className="group rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-soft"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <t.icon className="h-4 w-4" />
                    </span>
                    <div className="font-semibold group-hover:text-primary">{t.label}</div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{t.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Kpi({ label, value, hint, accent, loading }: { label: string; value?: number | string; hint?: string; accent?: boolean; loading?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "gradient-brand text-white" : "bg-card"}`}>
      <div className={`text-xs uppercase ${accent ? "text-white/80" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-2 text-3xl font-extrabold">{loading ? "…" : (value ?? 0)}</div>
      {hint && <div className={`text-xs ${accent ? "text-white/80" : "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value?: number | string | null }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value ?? 0}</div>
    </div>
  );
}

function AlertCard({ icon: Icon, label, value, to, tone }: { icon: any; label: string; value: number; to: string; tone: "ok" | "warn" | "danger" }) {
  const cls =
    tone === "danger" ? "border-destructive/30 bg-destructive/5 text-destructive"
      : tone === "warn" ? "border-amber-500/30 bg-amber-500/5 text-amber-600"
        : "bg-card text-muted-foreground";
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-2xl border p-4 transition hover:shadow-soft ${cls}`}>
      <Icon className="h-6 w-6 shrink-0" />
      <div className="min-w-0">
        <div className="text-2xl font-extrabold leading-none">{value}</div>
        <div className="mt-1 truncate text-xs font-medium">{label}</div>
      </div>
    </Link>
  );
}

const DONUT_COLORS = [
  "#DC2626", "#2563EB", "#16A34A", "#F59E0B",
  "#8B5CF6", "#0D9488", "#EC4899", "#F97316",
  "#64748B", "#0891B2", "#84CC16", "#A855F7",
];

type DonutRow = { key: string; label: string; count: number };

/** Tải bảng số liệu của biểu đồ ra file CSV (mở được bằng Excel). */
function downloadRowsCsv(title: string, rows: DonutRow[], total: number) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    [esc("Hạng mục"), esc("Số lượng"), esc("Tỷ lệ %")].join(","),
    ...rows.map((r) =>
      [esc(r.label), r.count, total > 0 ? Math.round((r.count / total) * 100) : 0].join(","),
    ),
    [esc("Tổng"), total, 100].join(","),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^\p{L}\p{N}]+/gu, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Tải file .xlsx trả về dạng base64 từ máy chủ. */
function downloadBase64Xlsx(name: string, base64: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function DonutPanel({
  title, rows, loading, dimension,
}: { title: string; rows: DonutRow[]; loading?: boolean; dimension: ChartDimension }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const detailFn = useServerFn(getOperationsChartDetail);
  const exportFn = useServerFn(exportOperationsChartReport);

  const detail = useQuery({
    queryKey: ["ops-chart-detail", dimension],
    queryFn: () => detailFn({ data: { dimension } }),
    enabled: open,
    staleTime: 30_000,
  });

  const detailRows = (detail.data?.rows ?? []).filter(
    (r) => !group || r[detail.data?.groupIndex ?? 0] === group,
  );

  const onExportExcel = async () => {
    setExporting(true);
    try {
      const r = await exportFn({ data: { dimension } });
      downloadBase64Xlsx(r.filename, r.base64);
      toast.success(`Đã tạo báo cáo với ${r.count} dòng dữ liệu`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const total = rows.reduce((s, r) => s + r.count, 0);
  const chartData = rows.map((r, i) => ({
    name: r.label,
    value: r.count,
    fill: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
      <h2 className="relative font-bold">{title}</h2>
      {loading && <div className="mt-6 text-sm text-muted-foreground">Đang tải…</div>}
      {!loading && rows.length === 0 && (
        <div className="mt-6 text-sm text-muted-foreground">Chưa có dữ liệu.</div>
      )}
      {!loading && rows.length > 0 && (
        <>
          <div className="relative mx-auto mt-2 h-52 w-full max-w-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="92%"
                  paddingAngle={2}
                  strokeWidth={2}
                >
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                    return [`${value} (${pct}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold tabular-nums">{total}</div>
              <div className="text-[11px] text-muted-foreground">Tổng</div>
            </div>
          </div>
          {/* Chú thích */}
          <ul className={`mt-4 grid gap-x-4 gap-y-1.5 text-xs ${rows.length > 4 ? "sm:grid-cols-2" : ""}`}>
            {rows.map((r, i) => {
              const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
              return (
                <li key={r.key} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate">{r.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {r.count} <span className="font-normal text-muted-foreground">({pct}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <TableIcon className="mr-1.5 h-4 w-4" /> Xem chi tiết
            </Button>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                {/* Bảng tổng hợp + bộ lọc hạng mục */}
                <div className="max-h-[60vh] overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Hạng mục</th>
                        <th className="px-3 py-2 text-right">SL</th>
                        <th className="px-3 py-2 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        className={`cursor-pointer border-t ${group === null ? "bg-primary/10 font-semibold" : ""}`}
                        onClick={() => setGroup(null)}
                      >
                        <td className="px-3 py-2">Tất cả</td>
                        <td className="px-3 py-2 text-right tabular-nums">{total}</td>
                        <td className="px-3 py-2 text-right tabular-nums">100%</td>
                      </tr>
                      {rows.map((r, i) => {
                        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                        return (
                          <tr
                            key={r.key}
                            onClick={() => setGroup(r.label)}
                            className={`cursor-pointer border-t hover:bg-muted/40 ${group === r.label ? "bg-primary/10 font-semibold" : ""}`}
                          >
                            <td className="px-3 py-2">
                              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                              {r.label}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{r.count}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Danh sách dữ liệu thực */}
                <div className="min-w-0">
                  <div className="mb-2 text-xs text-muted-foreground">
                    {detail.isLoading
                      ? "Đang tải danh sách chi tiết…"
                      : detail.error
                        ? "Không tải được danh sách chi tiết."
                        : `${detailRows.length} dòng dữ liệu thực${group ? ` • lọc: ${group}` : ""}`}
                  </div>
                  <div className="max-h-[60vh] overflow-auto rounded-lg border">
                    <table className="w-full min-w-[900px] text-xs">
                      <thead className="sticky top-0 bg-muted/60 text-left uppercase text-muted-foreground">
                        <tr>
                          {(detail.data?.headers ?? []).map((h) => (
                            <th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detailRows.slice(0, 500).map((r, idx) => (
                          <tr key={idx} className="border-t">
                            {r.map((c, ci) => (
                              <td key={ci} className="whitespace-nowrap px-3 py-1.5">{c}</td>
                            ))}
                          </tr>
                        ))}
                        {!detail.isLoading && detailRows.length === 0 && (
                          <tr><td className="px-3 py-4 text-muted-foreground">Chưa có dữ liệu chi tiết.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {detailRows.length > 500 && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Hiển thị 500 dòng đầu — tải báo cáo Excel để xem đầy đủ.
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => downloadRowsCsv(title, rows, total)}>
                  <Download className="mr-1.5 h-4 w-4" /> Tải bảng tổng hợp (CSV)
                </Button>
                <Button onClick={onExportExcel} disabled={exporting}>
                  <Download className="mr-1.5 h-4 w-4" />
                  {exporting ? "Đang tạo file…" : "Tải báo cáo Excel"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
