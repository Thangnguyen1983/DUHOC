import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTrainingAnalytics, runAttendanceConductScan } from "@/lib/training/reviews.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BarChart3, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/training/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const qc = useQueryClient();
  const fetchData = useServerFn(getTrainingAnalytics);
  const scan = useServerFn(runAttendanceConductScan);
  const q = useQuery({ queryKey: ["training-analytics"], queryFn: () => fetchData() });
  const d = q.data;

  const scanMut = useMutation({
    mutationFn: () => scan({ data: { absent_threshold: 3 } }),
    onSuccess: (r: any) => {
      toast.success(`Đã tạo ${r.created} ghi nhận nhắc nhở/khen thưởng`);
      qc.invalidateQueries({ queryKey: ["training-analytics"] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Thống kê đào tạo
          </h1>
          <p className="text-sm text-muted-foreground">
            Chuyên cần, điểm trung bình và nhận xét theo lớp, giáo viên và chương trình.
          </p>
        </div>
        <Button variant="secondary" onClick={() => scanMut.mutate()} disabled={scanMut.isPending}>
          <ShieldAlert className="mr-2 h-4 w-4" /> Quét nhắc nhở – khen thưởng
        </Button>
      </div>

      {q.isLoading && <div className="text-sm text-muted-foreground">Đang tải…</div>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theo lớp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(d?.byClass ?? []).map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">
                  {c.students} HV · Chuyên cần {c.attendanceRate ?? "—"}% · Điểm TB {c.avgGrade ?? "—"} · Nhận xét{" "}
                  {c.avgReview ?? "—"} · 🏆 {c.rewards} / ⚠ {c.issues}
                </span>
              </div>
              <Progress value={c.attendanceRate ?? 0} className="h-2" />
            </div>
          ))}
          {!q.isLoading && !(d?.byClass ?? []).length && (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu lớp học.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <GroupTable title="Theo giáo viên" rows={d?.byTeacher ?? []} />
        <GroupTable title="Theo chương trình" rows={d?.byProgram ?? []} />
      </div>
    </div>
  );
}

function GroupTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; name: string; classes: number; students: number; attendanceRate: number | null; avgGrade: number | null }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-left">
            <tr>
              <th className="py-1">Tên</th>
              <th className="py-1 text-right">Lớp</th>
              <th className="py-1 text-right">HV</th>
              <th className="py-1 text-right">Chuyên cần</th>
              <th className="py-1 text-right">Điểm TB</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t">
                <td className="py-1.5">{r.name}</td>
                <td className="py-1.5 text-right">{r.classes}</td>
                <td className="py-1.5 text-right">{r.students}</td>
                <td className="py-1.5 text-right">{r.attendanceRate ?? "—"}%</td>
                <td className="py-1.5 text-right">{r.avgGrade ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>}
      </CardContent>
    </Card>
  );
}
