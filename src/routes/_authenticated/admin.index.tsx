import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/dashboard/overview.functions";
import { getOperationsOverview } from "@/lib/operations/overview.functions";
import { testTelegramBot } from "@/lib/telegram.functions";
import { useMyAccess } from "@/lib/rbac/use-access";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { Permission } from "@/lib/rbac/permissions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Users, GraduationCap, IdCard, FileText, ShoppingCart, Megaphone, AlertTriangle,
  FileWarning, UserCog, RefreshCw, LifeBuoy, School, Workflow, Bot, BookOpen,
  CalendarDays, Award, TrendingUp, Send,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

const PIE_COLORS = ["#c62828", "#ef6c00", "#f9a825", "#2e7d32", "#0288d1", "#5e35b1", "#00897b", "#6d4c41"];

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

function Dashboard() {
  const { can } = useMyAccess();
  const fetchDash = useServerFn(getAdminDashboard);
  const fetchOps = useServerFn(getOperationsOverview);

  const dash = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchDash(),
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const ops = useQuery({
    queryKey: ["operations-overview"],
    queryFn: () => fetchOps(),
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useRealtimeRefresh(
    [
      "consultations", "student_profiles", "student_document_checklist", "workflow_instances",
      "training_classes", "training_enrollments", "training_attendance",
      "course_orders", "cms_entries", "account_provision_queue",
    ],
    ["admin-dashboard", "operations-overview"],
    "dashboard-realtime",
  );

  const d = dash.data;
  const o = ops.data;
  const loading = dash.isLoading;
  const opsOk = !ops.isError && !!o;

  const opsHint = ops.isLoading ? "…" : "—";
  const opsNote = ops.isLoading ? "Đang tải số liệu…" : "Không có quyền xem";

  const refresh = () => { dash.refetch(); ops.refetch(); };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting()}, đây là tổng quan KAIZEN</h1>
          <p className="text-sm text-muted-foreground">
            Số liệu toàn hệ thống: khách hàng tiềm năng, học viên, đào tạo, nội dung và khoá học trực tuyến.
            {d?.generatedAt && <> · Cập nhật {new Date(d.generatedAt).toLocaleString("vi-VN")}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={dash.isFetching}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${dash.isFetching ? "animate-spin" : ""}`} /> Làm mới
          </Button>
          <Link
            to="/admin/huong-dan/$slug"
            params={{ slug: "bat-dau" }}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
          >
            <LifeBuoy className="h-4 w-4" /> Hướng dẫn
          </Link>
        </div>
      </header>

      {dash.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Không tải được số liệu tổng quan. Hãy tải lại trang hoặc kiểm tra quyền truy cập.
        </div>
      )}

      {/* KPI */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi accent icon={Users} label="Đăng ký mới" value={d?.leads.new} hint={`${d?.leads.last30 ?? 0} lead trong 30 ngày`} loading={loading} to="/admin/leads" />
        <Kpi icon={IdCard} label="Hồ sơ học viên" value={opsOk ? o!.students.total : opsHint} hint={opsOk ? `+${o!.students.newLast30} trong 30 ngày` : opsNote} loading={ops.isLoading} to="/admin/students" tone="blue" />
        <Kpi icon={GraduationCap} label="Đang đào tạo" value={opsOk ? o!.students.inTraining : opsHint} hint={opsOk ? `${o!.training.classesRunning} lớp đang chạy` : opsNote} loading={ops.isLoading} to="/admin/training" tone="green" />
        <Kpi icon={Workflow} label="Đang xử lý visa" value={opsOk ? o!.students.visaStage : opsHint} hint={opsOk ? `${o!.students.departed} đã xuất cảnh` : opsNote} loading={ops.isLoading} to="/admin/visa" tone="purple" />
        <Kpi icon={FileText} label="Bài đã xuất bản" value={d?.content.published} hint={`${d?.content.draft ?? 0} nháp · ${d?.content.total ?? 0} tổng`} loading={loading} to="/admin/cms" tone="orange" />
        <Kpi icon={ShoppingCart} label="Đơn khoá học" value={d?.courses.paidOrders} hint={d ? `Doanh thu ${vnd(d.courses.revenue)}` : ""} loading={loading} to="/admin/courses/orders" tone="teal" />
      </section>

      {/* Cảnh báo */}
      <section>
        <SectionTitle>Việc cần xử lý</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AlertCard icon={Users} label="Lead chưa liên hệ" value={d?.leads.new ?? 0} to="/admin/leads" tone={(d?.leads.new ?? 0) > 0 ? "warn" : "ok"} />
          <AlertCard icon={FileWarning} label="Hồ sơ bắt buộc quá hạn" value={opsOk ? o!.alerts.docsOverdue : 0} to="/admin/students" tone={(o?.alerts.docsOverdue ?? 0) > 0 ? "danger" : "ok"} />
          <AlertCard icon={AlertTriangle} label="Hợp đồng hết hạn ≤ 90 ngày" value={opsOk ? o!.alerts.contractsExpiring : 0} to="/admin/students" tone={(o?.alerts.contractsExpiring ?? 0) > 0 ? "warn" : "ok"} />
          <AlertCard icon={UserCog} label="Chờ cấp tài khoản Portal" value={opsOk ? o!.alerts.accountQueuePending : 0} to="/admin/operations" tone={(o?.alerts.accountQueuePending ?? 0) > 0 ? "warn" : "ok"} />
        </div>
      </section>

      {/* Biểu đồ */}
      <section>
        <SectionTitle>Xu hướng &amp; phân bố</SectionTitle>
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Lead 30 ngày gần nhất" className="xl:col-span-2">
            <div className="h-64">
              {d ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.leads.series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c62828" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#c62828" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v: any) => [`${v} lead`, "Số lượng"]} />
                    <Area type="monotone" dataKey="count" stroke="#c62828" strokeWidth={2} fill="url(#leadFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <Skeleton />}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <MiniStat label="Mới" value={d?.leads.new} />
              <MiniStat label="Đã liên hệ" value={d?.leads.contacted} />
              <MiniStat label="Tiềm năng" value={d?.leads.qualified} />
              <MiniStat label="Đã chốt" value={d?.leads.done} />
            </div>
          </Panel>

          <Donut title="Nguồn lead 30 ngày" rows={d?.leads.bySource ?? []} loading={loading} />
          <Donut title="Lead theo chương trình" rows={d?.leads.byProgram ?? []} loading={loading} />
          <Donut title="Học viên theo chương trình" rows={opsOk ? o!.students.byProgramType : []} loading={loading} />
          <Donut title="Hồ sơ visa" rows={opsOk ? o!.students.byVisa : []} loading={loading} />
        </div>
      </section>

      {/* Danh sách */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Đăng ký gần đây" action={{ label: "Xem tất cả →", to: "/admin/leads" }}>
          <div className="divide-y text-sm">
            {(d?.leads.recent ?? []).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.phone} · {l.program || "—"}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${l.status === "new" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {l.status}
                </span>
              </div>
            ))}
            {!loading && (d?.leads.recent ?? []).length === 0 && <Empty>Chưa có đăng ký nào.</Empty>}
          </div>
        </Panel>

        <Panel title="Lớp đang mở" action={{ label: "Đào tạo →", to: "/admin/training" }}>
          <div className="divide-y text-sm">
            {(o?.classList ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2.5">
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
            {!loading && (o?.classList ?? []).length === 0 && <Empty>Chưa có lớp nào đang mở.</Empty>}
          </div>
        </Panel>

        <Panel title="Nội dung mới cập nhật" action={{ label: "Nội dung →", to: "/admin/cms" }}>
          <div className="divide-y text-sm">
            {(d?.content.recent ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate font-medium">{e.title || "(chưa có tiêu đề)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.updatedAt ? new Date(e.updatedAt).toLocaleDateString("vi-VN") : "—"}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${e.status === "published" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {e.status === "published" ? "đã đăng" : e.status}
                </span>
              </div>
            ))}
            {!loading && (d?.content.recent ?? []).length === 0 && <Empty>Chưa có nội dung nào.</Empty>}
          </div>
        </Panel>
      </section>

      {/* Chỉ số phụ */}
      <section>
        <SectionTitle>Chỉ số hệ thống</SectionTitle>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
          <MiniStat label="Lượt xem nội dung" value={d?.content.views} />
          <MiniStat label="Khoá học đang bán" value={d?.courses.published} />
          <MiniStat label="Đơn chờ thanh toán" value={d?.courses.pendingOrders} />
          <MiniStat label="Chiến dịch đang chạy" value={d?.marketing.running} />
          <MiniStat label="Chuyên cần 30 ngày" value={o?.training.attendanceRate == null ? "—" : `${o.training.attendanceRate}%`} />
          <MiniStat label="Chứng chỉ đã cấp" value={o?.training.certificatesIssued ?? "—"} />
        </div>
      </section>

      {/* Truy cập nhanh */}
      <QuickLinks can={can} />

      {/* Tiện ích hệ thống */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-600"><Send className="h-5 w-5" /></span>
            <div>
              <h2 className="font-bold">Kiểm tra kết nối Telegram</h2>
              <p className="text-sm text-muted-foreground">Gửi tin nhắn thử tới nhóm nhận thông báo lead.</p>
            </div>
          </div>
          <TelegramTestButton />
        </div>
      </section>
    </div>
  );
}

/* ---------- Components ---------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-4 text-sm text-muted-foreground">{children}</div>;
}

function Skeleton() {
  return <div className="h-full w-full animate-pulse rounded-xl bg-muted/60" />;
}

const TONES: Record<string, string> = {
  blue: "bg-sky-500/10 text-sky-600",
  green: "bg-emerald-500/10 text-emerald-600",
  purple: "bg-violet-500/10 text-violet-600",
  orange: "bg-orange-500/10 text-orange-600",
  teal: "bg-teal-500/10 text-teal-600",
  red: "bg-primary/10 text-primary",
};

function Kpi({
  icon: Icon, label, value, hint, accent, loading, to, tone = "red",
}: {
  icon: any; label: string; value?: number | string; hint?: string; accent?: boolean;
  loading?: boolean; to: string; tone?: keyof typeof TONES | string;
}) {
  const body = (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        accent ? "gradient-brand border-transparent text-white" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`text-[11px] font-semibold uppercase tracking-wide ${accent ? "text-white/80" : "text-muted-foreground"}`}>{label}</div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums">
            {loading && value === undefined ? "…" : (value ?? 0)}
          </div>
          {hint && <div className={`mt-1 text-xs ${accent ? "text-white/80" : "text-muted-foreground"}`}>{hint}</div>}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accent ? "bg-white/20 text-white" : TONES[tone] ?? TONES["red"]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
  return <Link to={to} className="block h-full">{body}</Link>;
}

function AlertCard({
  icon: Icon, label, value, to, tone,
}: { icon: any; label: string; value: number; to: string; tone: "ok" | "warn" | "danger" }) {
  const styles = {
    ok: "border-emerald-500/25 bg-emerald-500/5 text-emerald-700",
    warn: "border-amber-500/30 bg-amber-500/5 text-amber-700",
    danger: "border-destructive/30 bg-destructive/5 text-destructive",
  }[tone];
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${styles}`}>
      <Icon className="h-6 w-6 shrink-0" />
      <div className="min-w-0">
        <div className="text-2xl font-extrabold tabular-nums leading-none">{value}</div>
        <div className="mt-1 truncate text-xs font-medium">{label}</div>
      </div>
    </Link>
  );
}

function Panel({
  title, action, children, className = "",
}: { title: string; action?: { label: string; to: string }; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <span className="absolute inset-x-0 top-0 h-1 gradient-brand" aria-hidden />
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">{title}</h3>
        {action && <Link to={action.to} className="text-xs text-primary">{action.label}</Link>}
      </div>
      {children}
    </div>
  );
}

function Donut({
  title, rows, loading,
}: { title: string; rows: Array<{ key: string; label: string; count: number }>; loading?: boolean }) {
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <Panel title={title}>
      <div className="relative h-48">
        {loading ? <Skeleton /> : total === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="count" nameKey="label" innerRadius="60%" outerRadius="85%" paddingAngle={2} stroke="none">
                  {rows.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [`${v} (${Math.round((Number(v) / total) * 100)}%)`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-2xl font-extrabold tabular-nums">{total}</div>
                <div className="text-[11px] text-muted-foreground">tổng</div>
              </div>
            </div>
          </>
        )}
      </div>
      {total > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {rows.map((r, i) => (
            <li key={r.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="min-w-0 flex-1 truncate">{r.label}</span>
              <span className="tabular-nums text-muted-foreground">{r.count} · {Math.round((r.count / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5">
      <div className="text-lg font-bold tabular-nums">{value ?? "—"}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

type QuickTile = { to: string; label: string; icon: any; perm: Permission; tone: string };

const QUICK_TILES: QuickTile[] = [
  { to: "/admin/leads", label: "Lead & phân phối", icon: Users, perm: "leads.view", tone: "red" },
  { to: "/admin/students", label: "Hồ sơ học viên", icon: IdCard, perm: "students.view", tone: "blue" },
  { to: "/admin/van-hanh", label: "Vận hành & Đào tạo", icon: School, perm: "operations.overview", tone: "green" },
  { to: "/admin/training/oversight", label: "Lịch trung tâm", icon: CalendarDays, perm: "schedule.view", tone: "purple" },
  { to: "/admin/cms", label: "Nội dung website", icon: FileText, perm: "cms.view", tone: "orange" },
  { to: "/admin/courses", label: "Khoá học online", icon: BookOpen, perm: "courses.manage", tone: "teal" },
  { to: "/admin/marketing/campaigns", label: "Chiến dịch marketing", icon: Megaphone, perm: "cms.publish", tone: "red" },
  { to: "/admin/chatbot", label: "Chatbot", icon: Bot, perm: "chatbot.manage", tone: "purple" },
  { to: "/admin/certificates", label: "Chứng chỉ", icon: Award, perm: "certificates.view", tone: "orange" },
  { to: "/admin/training/analytics", label: "Thống kê đào tạo", icon: TrendingUp, perm: "training.analytics", tone: "green" },
];

function QuickLinks({ can }: { can: (p: Permission) => boolean }) {
  const tiles = QUICK_TILES.filter((t) => can(t.perm));
  if (!tiles.length) return null;
  return (
    <section>
      <SectionTitle>Truy cập nhanh</SectionTitle>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONES[t.tone] ?? TONES["red"]}`}>
              <t.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 text-sm font-semibold leading-tight">{t.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TelegramTestButton() {
  const sendTest = useServerFn(testTelegramBot);
  const mut = useMutation({
    mutationFn: () => sendTest(),
    onSuccess: () => toast.success("Đã gửi tin nhắn thử đến Telegram"),
    onError: (e) => toast.error(errorMessage(e, "Gửi tin nhắn thử thất bại")),
  });
  return (
    <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>
      {mut.isPending ? "Đang gửi..." : "Gửi tin nhắn thử"}
    </Button>
  );
}
