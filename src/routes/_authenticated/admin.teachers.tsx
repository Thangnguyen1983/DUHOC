import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTeachers, upsertTeacher, deleteTeacher } from "@/lib/training/lms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, UserCog, FolderOpen } from "lucide-react";
import { TeacherDocumentsPanel } from "@/components/training/teacher-documents-panel";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/teachers")({ component: Page });

function Page() {
  const fetchList = useServerFn(listTeachers);
  const save = useServerFn(upsertTeacher);
  const remove = useServerFn(deleteTeacher);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["teachers"], queryFn: () => fetchList() });
  const [editing, setEditing] = useState<any | null>(null);
  const [docsFor, setDocsFor] = useState<any | null>(null);

  const saveMut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); qc.invalidateQueries({ queryKey: ["teachers"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); qc.invalidateQueries({ queryKey: ["teachers"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="h-6 w-6"/> Giáo viên</h1>
          <p className="text-sm text-muted-foreground">Quản lý đội ngũ giảng viên</p>
        </div>
        <Button onClick={() => setEditing({ full_name: "", email: "", phone: "", specialization: "", is_active: true })}>
          <Plus className="h-4 w-4 mr-1"/> Thêm giáo viên
        </Button>
      </div>

      {editing && <EditForm initial={editing} onSave={(d: any) => saveMut.mutate(d)} onCancel={() => setEditing(null)} pending={saveMut.isPending}/>}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr><th className="p-3">Họ tên</th><th className="p-3">Email</th><th className="p-3">SĐT</th><th className="p-3">Chuyên môn</th><th className="p-3">Trạng thái</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((t: any) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-medium">{t.full_name}</td>
                <td className="p-3">{t.email}</td>
                <td className="p-3">{t.phone}</td>
                <td className="p-3">{t.specialization}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${t.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{t.is_active ? "Đang dạy" : "Tạm dừng"}</span></td>
                <td className="p-3 text-right space-x-2">
                  <Button size="sm" variant="ghost" title="Hồ sơ năng lực" onClick={() => setDocsFor(docsFor?.id === t.id ? null : t)}><FolderOpen className="h-4 w-4"/></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4"/></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Xoá giáo viên này?") && delMut.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </td>
              </tr>
            ))}
            {list.data?.items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Chưa có giáo viên</td></tr>}
          </tbody>
        </table>
      </div>

      {docsFor && <TeacherDocumentsPanel teacherId={docsFor.id} teacherName={docsFor.full_name} />}
    </div>
  );
}

function EditForm({ initial, onSave, onCancel, pending }: any) {
  const [f, setF] = useState(initial);
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-3">
      <h3 className="font-bold">{f.id ? "Sửa giáo viên" : "Thêm giáo viên"}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input placeholder="Họ và tên" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })}/>
        <Input placeholder="Email" value={f.email ?? ""} onChange={(e) => setF({ ...f, email: e.target.value })}/>
        <Input placeholder="Số điện thoại" value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })}/>
        <Input placeholder="Chuyên môn (VD: Tiếng Đức B1)" value={f.specialization ?? ""} onChange={(e) => setF({ ...f, specialization: e.target.value })}/>
      </div>
      <Textarea placeholder="Giới thiệu ngắn" value={f.bio ?? ""} onChange={(e) => setF({ ...f, bio: e.target.value })}/>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })}/> Đang dạy</label>
      <div className="flex gap-2">
        <Button onClick={() => onSave(f)} disabled={pending}>{pending ? "Đang lưu..." : "Lưu"}</Button>
        <Button variant="outline" onClick={onCancel}>Huỷ</Button>
      </div>
    </div>
  );
}
