import { errorMessage } from "@/lib/errors";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listQuizzes, upsertQuiz, deleteQuiz } from "@/lib/training/lms.functions";
import { listPrograms } from "@/lib/training/training.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, ClipboardCheck, ListChecks } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Ngân hàng bài kiểm tra — dùng chung cho trang quản trị và cổng giáo viên. */
export function QuizzesManager({ detailBase }: { detailBase: "/admin/quizzes/$id" | "/giang-day/bai-kiem-tra/$id" }) {
  const fetchList = useServerFn(listQuizzes);
  const fetchPrograms = useServerFn(listPrograms);
  const save = useServerFn(upsertQuiz);
  const remove = useServerFn(deleteQuiz);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["quizzes"], queryFn: () => fetchList() });
  const programs = useQuery({ queryKey: ["training-programs"], queryFn: () => fetchPrograms() });
  const [editing, setEditing] = useState<any | null>(null);

  const saveMut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); qc.invalidateQueries({ queryKey: ["quizzes"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); qc.invalidateQueries({ queryKey: ["quizzes"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="h-6 w-6"/> Bài kiểm tra</h1>
          <p className="text-sm text-muted-foreground">Ngân hàng câu hỏi & quiz trắc nghiệm</p>
        </div>
        <Button onClick={() => setEditing({ title: "", passing_score: 50, max_attempts: 1, shuffle_questions: false, status: "draft" })}>
          <Plus className="h-4 w-4 mr-1"/> Tạo bài kiểm tra
        </Button>
      </div>

      {editing && (
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <h3 className="font-bold">{editing.id ? "Sửa bài kiểm tra" : "Tạo bài kiểm tra"}</h3>
          <Input placeholder="Tên bài kiểm tra" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/>
          <div className="grid sm:grid-cols-3 gap-3">
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={editing.program_id ?? ""} onChange={(e) => setEditing({ ...editing, program_id: e.target.value || null })}>
              <option value="">— Không gắn chương trình —</option>
              {(programs.data?.items ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Input type="number" placeholder="Điểm đậu (%)" value={editing.passing_score} onChange={(e) => setEditing({ ...editing, passing_score: Number(e.target.value) })}/>
            <Input type="number" placeholder="Số lần làm tối đa" value={editing.max_attempts} onChange={(e) => setEditing({ ...editing, max_attempts: Number(e.target.value) })}/>
          </div>
          <Input type="number" placeholder="Giới hạn thời gian (phút, để trống = không giới hạn)" value={editing.time_limit_minutes ?? ""} onChange={(e) => setEditing({ ...editing, time_limit_minutes: Number(e.target.value) || null })}/>
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
            <option value="draft">Nháp</option><option value="published">Xuất bản</option><option value="closed">Đóng</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate(editing)} disabled={saveMut.isPending}>{saveMut.isPending ? "Đang lưu..." : "Lưu"}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left">
            <tr><th className="p-3">Tên</th><th className="p-3">Chương trình</th><th className="p-3">Câu hỏi</th><th className="p-3">Điểm đậu</th><th className="p-3">Trạng thái</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((q: any) => (
              <tr key={q.id} className="border-t">
                <td className="p-3 font-medium">{q.title}</td>
                <td className="p-3">{q.training_programs?.name ?? "—"}</td>
                <td className="p-3">{q.quiz_questions?.[0]?.count ?? 0}</td>
                <td className="p-3">{q.passing_score}%</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${q.status === "published" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{q.status}</span></td>
                <td className="p-3 text-right space-x-2">
                  <Link to={detailBase} params={{ id: q.id }} className="inline-flex items-center text-sm text-primary hover:underline"><ListChecks className="h-4 w-4 mr-1"/>Câu hỏi</Link>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(q)}><Pencil className="h-4 w-4"/></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Xoá?") && delMut.mutate(q.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </td>
              </tr>
            ))}
            {list.data?.items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Chưa có bài kiểm tra</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
