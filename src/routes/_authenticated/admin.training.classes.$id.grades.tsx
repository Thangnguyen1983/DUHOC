import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClass, listGradesByClass, upsertGrade, deleteGrade, computeFinalGrade } from "@/lib/training/training.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Calculator, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TYPES = [
  ["quiz", "Quiz"], ["midterm", "Giữa kỳ"], ["final", "Cuối kỳ"], ["assignment", "Bài tập"],
  ["speaking", "Nói"], ["listening", "Nghe"], ["writing", "Viết"], ["reading", "Đọc"],
];

export const Route = createFileRoute("/_authenticated/admin/training/classes/$id/grades")({
  component: GradesPage,
});

function GradesPage() {
  const { id } = Route.useParams();
  const fetchClass = useServerFn(getClass);
  const fetchGrades = useServerFn(listGradesByClass);
  const save = useServerFn(upsertGrade);
  const remove = useServerFn(deleteGrade);
  const compute = useServerFn(computeFinalGrade);
  const qc = useQueryClient();

  const cls = useQuery({ queryKey: ["training-class", id], queryFn: () => fetchClass({ data: { id } }) });
  const data = useQuery({ queryKey: ["class-grades", id], queryFn: () => fetchGrades({ data: { class_id: id } }) });

  const inv = () => qc.invalidateQueries({ queryKey: ["class-grades", id] });
  const saveMut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); setAdding(null); inv(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (gid: string) => remove({ data: { id: gid } }),
    onSuccess: () => { toast.success("Đã xoá"); inv(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const computeMut = useMutation({
    mutationFn: (eid: string) => compute({ data: { enrollment_id: eid } }),
    onSuccess: (r: any) => { toast.success(`Điểm tổng kết: ${r.final ?? "—"}`); inv(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const [adding, setAdding] = useState<any | null>(null);

  const gradesByEnroll = new Map<string, any[]>();
  (data.data?.grades ?? []).forEach((g: any) => {
    if (!gradesByEnroll.has(g.enrollment_id)) gradesByEnroll.set(g.enrollment_id, []);
    gradesByEnroll.get(g.enrollment_id)!.push(g);
  });

  return (
    <div className="space-y-6">
      <Link to="/admin/training/classes/$id" params={{ id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4"/> Quay lại lớp
      </Link>

      <div className="rounded-2xl border bg-card p-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng điểm</h1>
          <p className="text-sm text-muted-foreground">{cls.data?.cls?.name}</p>
        </div>
        <Link to="/admin/training/classes/$id/attendance" params={{ id }} className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-1">
          <ClipboardCheck className="h-4 w-4"/> Điểm danh
        </Link>
      </div>

      <div className="space-y-3">
        {(data.data?.enrollments ?? []).map((e: any) => {
          const list = gradesByEnroll.get(e.id) ?? [];
          return (
            <div key={e.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-bold">{e.student_profiles?.full_name}</div>
                  <div className="text-xs text-muted-foreground">{e.student_profiles?.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-muted px-3 py-1 text-sm">
                    Tổng kết: <span className="font-bold text-primary">{e.final_grade ?? "—"}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => computeMut.mutate(e.id)}>
                    <Calculator className="h-4 w-4 mr-1"/> Tính lại
                  </Button>
                  <Button size="sm" onClick={() => setAdding({ enrollment_id: e.id, assessment_type: "quiz", max_score: 10, weight: 1, assessed_at: new Date().toISOString().slice(0,10) })}>
                    <Plus className="h-4 w-4 mr-1"/> Thêm điểm
                  </Button>
                </div>
              </div>

              {adding?.enrollment_id === e.id && (
                <div className="mt-3 rounded-lg border bg-muted/30 p-3 grid gap-2 md:grid-cols-7">
                  <select className="rounded-md border bg-background p-2 text-sm" value={adding.assessment_type} onChange={(ev) => setAdding({ ...adding, assessment_type: ev.target.value })}>
                    {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <Input placeholder="Tiêu đề" value={adding.title ?? ""} onChange={(ev) => setAdding({ ...adding, title: ev.target.value })} />
                  <Input type="number" step="0.1" placeholder="Điểm" value={adding.score ?? ""} onChange={(ev) => setAdding({ ...adding, score: Number(ev.target.value) })} />
                  <Input type="number" step="0.1" placeholder="Max" value={adding.max_score} onChange={(ev) => setAdding({ ...adding, max_score: Number(ev.target.value) })} />
                  <Input type="number" step="0.1" placeholder="Hệ số" value={adding.weight} onChange={(ev) => setAdding({ ...adding, weight: Number(ev.target.value) })} />
                  <Input type="date" value={adding.assessed_at} onChange={(ev) => setAdding({ ...adding, assessed_at: ev.target.value })} />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => saveMut.mutate(adding)} disabled={saveMut.isPending}>Lưu</Button>
                    <Button size="sm" variant="outline" onClick={() => setAdding(null)}>Huỷ</Button>
                  </div>
                </div>
              )}

              {list.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs">
                      <tr>
                        <th className="p-2">Loại</th><th className="p-2">Tiêu đề</th>
                        <th className="p-2 text-right">Điểm</th><th className="p-2 text-right">Max</th>
                        <th className="p-2 text-right">Hệ số</th><th className="p-2">Ngày</th><th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((g) => (
                        <tr key={g.id} className="border-t">
                          <td className="p-2">{(TYPES.find(([v]) => v === g.assessment_type)?.[1]) ?? g.assessment_type}</td>
                          <td className="p-2">{g.title ?? "—"}</td>
                          <td className="p-2 text-right font-medium">{g.score ?? "—"}</td>
                          <td className="p-2 text-right text-muted-foreground">{g.max_score}</td>
                          <td className="p-2 text-right text-muted-foreground">{g.weight}</td>
                          <td className="p-2 text-xs text-muted-foreground">{g.assessed_at}</td>
                          <td className="p-2 text-right">
                            <button onClick={() => { if (confirm("Xoá điểm?")) delMut.mutate(g.id); }} className="text-muted-foreground hover:text-red-600">
                              <Trash2 className="h-4 w-4"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {data.data?.enrollments.length === 0 && (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Lớp chưa có học viên.</div>
        )}
      </div>
    </div>
  );
}
