import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listLessons, upsertLesson, deleteLesson } from "@/lib/training/lms.functions";
import { listPrograms } from "@/lib/training/training.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, NotebookPen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FreeResourcesPanel } from "@/components/training/free-resources-panel";

export const Route = createFileRoute("/_authenticated/admin/lessons")({ component: Page });

function Page() {
  const fetchList = useServerFn(listLessons);
  const fetchPrograms = useServerFn(listPrograms);
  const save = useServerFn(upsertLesson);
  const remove = useServerFn(deleteLesson);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["lessons"], queryFn: () => fetchList({ data: {} }) });
  const programs = useQuery({ queryKey: ["training-programs"], queryFn: () => fetchPrograms() });
  const [editing, setEditing] = useState<any | null>(null);

  const saveMut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); qc.invalidateQueries({ queryKey: ["lessons"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); qc.invalidateQueries({ queryKey: ["lessons"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><NotebookPen className="h-6 w-6"/> Bài học</h1>
          <p className="text-sm text-muted-foreground">Nội dung & video theo chương trình</p>
        </div>
        <Button onClick={() => setEditing({ title: "", program_id: programs.data?.items[0]?.id ?? null, order_index: 0, status: "draft" })}>
          <Plus className="h-4 w-4 mr-1"/> Thêm bài học
        </Button>
      </div>

      {editing?.id && <FreeResourcesPanel lessonId={editing.id} lessonTitle={editing.title} />}

      {editing && <EditForm initial={editing} programs={programs.data?.items ?? []} onSave={(d: any) => saveMut.mutate(d)} onCancel={() => setEditing(null)} pending={saveMut.isPending}/>}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr><th className="p-3">#</th><th className="p-3">Tên bài</th><th className="p-3">Chương trình</th><th className="p-3">Thời lượng</th><th className="p-3">Trạng thái</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">{l.order_index}</td>
                <td className="p-3 font-medium">{l.title}</td>
                <td className="p-3">{l.training_programs?.name ?? "—"}</td>
                <td className="p-3">{l.duration_minutes ? `${l.duration_minutes} phút` : "—"}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${l.status === "published" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{l.status}</span></td>
                <td className="p-3 text-right space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(l)}><Pencil className="h-4 w-4"/></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Xoá?") && delMut.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </td>
              </tr>
            ))}
            {list.data?.items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Chưa có bài học</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditForm({ initial, programs, onSave, onCancel, pending }: any) {
  const [f, setF] = useState(initial);
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-3">
      <h3 className="font-bold">{f.id ? "Sửa bài học" : "Thêm bài học"}</h3>
      <Input placeholder="Tên bài" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}/>
      <div className="grid sm:grid-cols-3 gap-3">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={f.program_id ?? ""} onChange={(e) => setF({ ...f, program_id: e.target.value || null })}>
          <option value="">— Chọn chương trình —</option>
          {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Input type="number" placeholder="Thứ tự" value={f.order_index} onChange={(e) => setF({ ...f, order_index: Number(e.target.value) })}/>
        <Input type="number" placeholder="Thời lượng (phút)" value={f.duration_minutes ?? ""} onChange={(e) => setF({ ...f, duration_minutes: Number(e.target.value) || null })}/>
      </div>
      <Input placeholder="Video URL (YouTube/Vimeo)" value={f.video_url ?? ""} onChange={(e) => setF({ ...f, video_url: e.target.value })}/>
      <Textarea rows={3} placeholder="Mô tả ngắn" value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })}/>
      <Textarea rows={8} placeholder="Nội dung bài học (markdown)" value={f.content ?? ""} onChange={(e) => setF({ ...f, content: e.target.value })}/>
      <select className="rounded-md border bg-background px-3 py-2 text-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
        <option value="draft">Nháp</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option>
      </select>
      <div className="flex gap-2">
        <Button onClick={() => onSave(f)} disabled={pending}>{pending ? "Đang lưu..." : "Lưu"}</Button>
        <Button variant="outline" onClick={onCancel}>Huỷ</Button>
      </div>
    </div>
  );
}
