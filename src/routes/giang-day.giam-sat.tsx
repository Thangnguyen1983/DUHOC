import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTrainingOversight } from "@/lib/training/oversight.functions";
import { CenterSchedule } from "@/components/training/center-schedule";
import { KpiCard, Skeleton } from "@/components/training/oversight-primitives";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, CalendarDays, GraduationCap, Users } from "lucide-react";

export const Route = createFileRoute("/giang-day/giam-sat")({ component: Page });

function Page() {
  const fetchOversight = useServerFn(getTrainingOversight);
  const q = useQuery({ queryKey: ["teaching-oversight"], queryFn: () => fetchOversight({ data: {} }) });

  if (q.isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (q.error) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Không tải được dữ liệu giám sát.</div>;

  const d: any = q.data;
  const kpi = d?.kpi ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-6 w-6"/> Giám sát lớp học</h1>
        <p className="text-sm text-muted-foreground">Chỉ hiển thị lớp thuộc thị trường bạn phụ trách</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={GraduationCap} label="Lớp đang mở" value={kpi.activeClasses ?? 0} />
        <KpiCard icon={Users} label="Học viên" value={kpi.students ?? 0} />
        <KpiCard icon={CalendarDays} label="Buổi trong tuần" value={kpi.sessionsThisWeek ?? 0} />
        <KpiCard icon={AlertTriangle} label="Buổi chưa điểm danh" value={kpi.unmarked ?? 0} />
      </div>

      <Tabs defaultValue="lop">
        <TabsList>
          <TabsTrigger value="lop">Lớp của thị trường</TabsTrigger>
          <TabsTrigger value="lich">Lịch trung tâm</TabsTrigger>
        </TabsList>

        <TabsContent value="lop" className="mt-4">
          <div className="rounded-2xl border bg-card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Lớp</th><th className="p-3">Chương trình</th><th className="p-3">Giáo viên</th>
                  <th className="p-3">Học viên</th><th className="p-3">Chuyên cần</th><th className="p-3">Chưa điểm danh</th>
                </tr>
              </thead>
              <tbody>
                {(d?.classes ?? []).map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 font-medium">{c.code} · {c.name}</td>
                    <td className="p-3">{c.program?.name ?? "—"}</td>
                    <td className="p-3">{c.teacher_name ?? "Chưa gán"}</td>
                    <td className="p-3">{c.students}</td>
                    <td className="p-3">{c.attendance_rate != null ? `${c.attendance_rate}%` : "—"}</td>
                    <td className="p-3">{c.sessions_unmarked}</td>
                  </tr>
                ))}
                {(d?.classes ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Chưa có lớp trong phạm vi của bạn</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="lich" className="mt-4">
          <CenterSchedule />
        </TabsContent>
      </Tabs>
    </div>
  );
}
