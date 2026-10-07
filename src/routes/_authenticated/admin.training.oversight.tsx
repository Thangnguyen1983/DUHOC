import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTrainingOversight, assignClassTeacher } from "@/lib/training/oversight.functions";
import { CenterSchedule } from "@/components/training/center-schedule";
import { TeacherCards } from "@/components/training/teacher-cards";
import { AttendanceRing, CountUp, KpiCard, ProgressBar, Skeleton } from "@/components/training/oversight-primitives";
import { useMyAccess } from "@/lib/rbac/use-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  GraduationCap,
  MoreHorizontal,
  Search,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/training/oversight")({
  validateSearch: (s: Record<string, unknown>): { tab?: "lich" } => ({
    tab: s.tab === "lich" ? "lich" : undefined,
  }),
  component: OversightPage,
});

function OversightPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const activeTab: "giam-sat" | "lich" = tab === "lich" ? "lich" : "giam-sat";
  const { can } = useMyAccess();
  const canSchedule = can("schedule.view");
  const setTab = (t: "giam-sat" | "lich") =>
    navigate({ to: "/admin/training/oversight", search: { tab: t === "lich" ? "lich" : undefined } });
  const fetchData = useServerFn(getTrainingOversight);
  const assign = useServerFn(assignClassTeacher);

  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const q = useQuery({ queryKey: ["training-oversight"], queryFn: () => fetchData({ data: {} }) });
  const data = q.data;

  const assignMut = useMutation({
    mutationFn: (p: { class_id: string; teacher_user_id: string | null }) => assign({ data: p }),
    onSuccess: () => {
      toast.success("Đã cập nhật giáo viên phụ trách");
      qc.invalidateQueries({ queryKey: ["training-oversight"] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const programs = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of data?.classes ?? []) if (c.program_id) map.set(c.program_id, c.program?.name ?? c.program_id);
    return [...map.entries()];
  }, [data]);

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of data?.classes ?? []) m.set(c.status, (m.get(c.status) ?? 0) + 1);
    return m;
  }, [data]);

  const rows = (data?.classes ?? []).filter((c: any) => {
    if (teacherFilter && c.teacher_id !== teacherFilter) return false;
    if (programFilter && c.program_id !== programFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!`${c.code} ${c.name} ${c.teacher_name ?? ""}`.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const alertGroups = useMemo(() => {
    const groups: Record<string, { title: string; items: any[] }> = {
      unmarked: { title: "Chưa điểm danh", items: [] },
      no_teacher: { title: "Chưa gán giáo viên", items: [] },
      ungraded: { title: "Sắp kết thúc thiếu điểm", items: [] },
    };
    for (const a of data?.alerts ?? []) if (groups[a.kind]) groups[a.kind].items.push(a);
    return Object.entries(groups).filter(([, g]) => g.items.length > 0);
  }, [data]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r: any) => ({
        "Mã lớp": r.code,
        "Tên lớp": r.name,
        "Chương trình": r.program?.name ?? "",
        "Giáo viên": r.teacher_name ?? "Chưa gán",
        "Học viên": r.students,
        "Buổi đã dạy": `${r.sessions_done}/${r.sessions_total}`,
        "Chưa điểm danh": r.sessions_unmarked,
        "Chuyên cần (%)": r.attendance_rate ?? "",
        "Đã có điểm": `${r.graded_students}/${r.students}`,
        "Trạng thái": statusLabel(r.status),
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Giam sat lop");
    XLSX.writeFile(wb, `giam-sat-lop-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card-lift flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Giám sát lớp học</h1>
          <p className="text-sm text-muted-foreground">
            Toàn bộ lớp của mọi giáo viên · cập nhật {data?.today ?? ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/giang-day" className="rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted">
            Cổng giảng dạy
          </Link>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={rows.length === 0}>
            <Download className="mr-1 h-4 w-4" /> Xuất Excel
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {canSchedule && (
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as "giam-sat" | "lich")}>
          <TabsList>
            {(
              [
                ["giam-sat", "Giám sát lớp", GraduationCap],
                ["lich", "Lịch trung tâm", CalendarDays],
              ] as const
            ).map(([key, label, Icon]) => (
              <TabsTrigger key={key} value={key}>
                <Icon className="h-4 w-4" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {activeTab === "lich" && canSchedule ? (
        <CenterSchedule />
      ) : (
        <>
          {q.isLoading && (
            <div className="space-y-4" aria-busy>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-28" />
              <Skeleton className="h-64" />
            </div>
          )}
          {q.error && <p className="text-sm text-red-600">{(q.error as any).message}</p>}

          {data && (
            <>
              {/* KPI */}
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <KpiCard
                  delay={0}
                  tone="green"
                  label="Lớp đang hoạt động"
                  icon={GraduationCap}
                  value={
                    <>
                      <CountUp value={data.kpi.activeClasses} />
                      <span className="text-sm font-normal text-muted-foreground">/{data.kpi.totalClasses}</span>
                    </>
                  }
                />
                <KpiCard delay={40} tone="teal" label="Học viên" icon={Users} value={<CountUp value={data.kpi.students} />} />
                <KpiCard delay={80} tone="slate" label="Buổi tuần này" icon={CalendarDays} value={<CountUp value={data.kpi.sessionsThisWeek} />} />
                <KpiCard
                  delay={120}
                  tone={data.kpi.unmarked > 0 ? "red" : "slate"}
                  label="Buổi chưa điểm danh"
                  value={<CountUp value={data.kpi.unmarked} />}
                />
                <KpiCard delay={160} tone="amber" label="Chuyên cần TB" value={<CountUp value={data.kpi.avgAttendance} suffix="%" />} />
                <KpiCard
                  delay={200}
                  tone={data.kpi.unassigned > 0 ? "red" : "slate"}
                  label="Lớp chưa có GV"
                  icon={UserX}
                  value={<CountUp value={data.kpi.unassigned} />}
                />
              </div>

              {/* Trung tâm xử lý + bộ lọc */}
              <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <div className="card-lift rounded-2xl border bg-card p-4" style={{ animationDelay: "120ms" }}>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="nav-chip nav-chip-sm nav-tone-amber" aria-hidden>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </span>
                    Trung tâm xử lý
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                      {data.alerts.length}
                    </span>
                  </div>
                  {alertGroups.length === 0 ? (
                    <p className="mt-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                      Không có vấn đề nào cần xử lý — mọi lớp đều đúng tiến độ.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {alertGroups.map(([kind, g]) => (
                        <div key={kind} className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                            <span className="pulse h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                            {g.title} ({g.items.length})
                          </div>
                          <ul className="mt-2 space-y-1.5 text-xs text-amber-900">
                            {g.items.slice(0, 4).map((a: any, i: number) => (
                              <li key={i}>
                                <Link
                                  to="/admin/training/classes/$id/attendance"
                                  params={{ id: a.class_id }}
                                  className="font-medium underline decoration-amber-400 underline-offset-2 hover:text-primary"
                                >
                                  {a.label}
                                </Link>
                                <div className="text-amber-800/80">{a.detail}</div>
                              </li>
                            ))}
                            {g.items.length > 4 && (
                              <li className="text-amber-700">+{g.items.length - 4} lớp khác…</li>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-lift rounded-2xl border bg-card p-4" style={{ animationDelay: "160ms" }}>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="nav-chip nav-chip-sm nav-tone-red" aria-hidden>
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    Bộ lọc nhanh
                  </div>
                  <div className="mt-3 space-y-2">
                    <Input
                      placeholder="Tìm mã / tên lớp / giáo viên"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      value={teacherFilter}
                      onChange={(e) => setTeacherFilter(e.target.value)}
                    >
                      <option value="">Tất cả giáo viên</option>
                      {(data.teachers ?? []).filter((t: any) => t.user_id).map((t: any) => (
                        <option key={t.id} value={t.user_id}>{t.full_name}</option>
                      ))}
                    </select>
                    <select
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      value={programFilter}
                      onChange={(e) => setProgramFilter(e.target.value)}
                    >
                      <option value="">Tất cả chương trình</option>
                      {programs.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StatusChip label="Tất cả" count={data.kpi.totalClasses} active={statusFilter === ""} onClick={() => setStatusFilter("")} />
                    {["in_progress", "open", "planning", "finished", "cancelled"].map((s) => (
                      <StatusChip
                        key={s}
                        label={statusLabel(s)}
                        count={statusCounts.get(s) ?? 0}
                        active={statusFilter === s}
                        onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Giáo viên */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Theo giáo viên</h2>
                <TeacherCards
                  teachers={data.teacherStats ?? []}
                  activeUserId={teacherFilter}
                  onFilter={setTeacherFilter}
                />
              </section>

              {/* Danh sách lớp */}
              <div className="card-lift rounded-2xl border bg-card p-4" style={{ animationDelay: "200ms" }}>
                <h2 className="font-bold">Lớp học toàn hệ thống ({rows.length})</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">Lớp</th>
                        <th>Chương trình</th>
                        <th>Giáo viên phụ trách</th>
                        <th>HV</th>
                        <th className="min-w-28">Tiến độ</th>
                        <th>Chưa ĐD</th>
                        <th>Chuyên cần</th>
                        <th>Điểm</th>
                        <th>Trạng thái</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rows.map((c: any) => (
                        <tr key={c.id} className="transition-colors hover:bg-muted/50">
                          <td className="py-3 pr-2">
                            <div className="font-mono text-[11px] text-muted-foreground">{c.code}</div>
                            <Link to="/admin/training/classes/$id" params={{ id: c.id }} className="font-medium hover:text-primary">
                              {c.name}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {c.schedule ?? "Chưa có lịch"}
                              {c.room ? ` · ${c.room}` : ""}
                            </div>
                          </td>
                          <td className="text-xs">{c.program?.name ?? "—"}</td>
                          <td>
                            <select
                              className="rounded-md border bg-background p-1 text-xs"
                              value={c.teacher_id ?? ""}
                              onChange={(e) => assignMut.mutate({ class_id: c.id, teacher_user_id: e.target.value || null })}
                            >
                              <option value="">— Chưa gán —</option>
                              {(data.teachers ?? []).filter((t: any) => t.user_id).map((t: any) => (
                                <option key={t.id} value={t.user_id}>{t.full_name}</option>
                              ))}
                            </select>
                          </td>
                          <td>{c.students}</td>
                          <td>
                            <div className="mb-1 text-xs font-medium">
                              {c.sessions_done}/{c.sessions_total} buổi
                            </div>
                            <ProgressBar ratio={c.sessions_total > 0 ? c.sessions_done / c.sessions_total : 0} />
                          </td>
                          <td className={c.sessions_unmarked > 0 ? "font-semibold text-amber-700" : ""}>{c.sessions_unmarked}</td>
                          <td>
                            <AttendanceRing value={c.attendance_rate} />
                          </td>
                          <td className="text-xs">{c.graded_students}/{c.students}</td>
                          <td>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs", statusColor(c.status))}>{statusLabel(c.status)}</span>
                          </td>
                          <td className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="rounded-md border p-1.5 transition-colors hover:bg-muted" aria-label="Thao tác">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to="/giang-day/lop/$id" params={{ id: c.id }}>Vào lớp</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to="/admin/training/classes/$id/attendance" params={{ id: c.id }}>Điểm danh</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to="/admin/training/classes/$id/grades" params={{ id: c.id }}>Điểm</Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && !q.isLoading && (
                        <tr>
                          <td colSpan={10} className="py-6 text-center text-muted-foreground">
                            Không có lớp phù hợp bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatusChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
      )}
    >
      {label} <span className={cn(active ? "text-primary-foreground/80" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}

function statusLabel(s: string) {
  return ({ planning: "Lên kế hoạch", open: "Đang tuyển", in_progress: "Đang học", finished: "Kết thúc", cancelled: "Đã huỷ" } as any)[s] ?? s;
}
function statusColor(s: string) {
  return (
    {
      planning: "bg-blue-100 text-blue-700",
      open: "bg-amber-100 text-amber-700",
      in_progress: "bg-emerald-100 text-emerald-700",
      finished: "bg-muted text-muted-foreground",
      cancelled: "bg-red-100 text-red-700",
    } as any
  )[s] ?? "bg-muted text-muted-foreground";
}
