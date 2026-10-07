import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPrograms, upsertProgram, deleteProgram } from "@/lib/training/training.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, GraduationCap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PROGRAM_TYPES, programTypeLabel } from "@/lib/training/classification";

export const Route = createFileRoute("/_authenticated/admin/training/")({
  component: ProgramsPage,
});

function ProgramsPage() {
  const fetchList = useServerFn(listPrograms);
  const save = useServerFn(upsertProgram);
  const remove = useServerFn(deleteProgram);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["training-programs"], queryFn: () => fetchList() });
  const [editing, setEditing] = useState<any | null>(null);

  const saveMut = useMutation({
    mutationFn: (data: any) => save({ data }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); qc.invalidateQueries({ queryKey: ["training-programs"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); qc.invalidateQueries({ queryKey: ["training-programs"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-6 w-6"/> Chương trình đào tạo</h1>
          <p className="text-sm text-muted-foreground">Danh mục chương trình ngôn ngữ & nghiệp vụ</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/training/classes" className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted">Lớp học →</Link>
          <Button onClick={() => setEditing({ code: "", name: "", total_hours: 0, total_sessions: 0, tuition_fee: 0, currency: "VND", is_active: true })}>
            <Plus className="h-4 w-4 mr-1"/> Thêm chương trình
          </Button>
        </div>
      </div>

      {editing && <EditForm initial={editing} onSave={(d: any) => saveMut.mutate(d)} onCancel={() => setEditing(null)} pending={saveMut.isPending} />}

      <div className="max-w-full overflow-x-auto rounded-2xl border bg-card">
        <table className="min-w-[850px] w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3">Mã</th><th className="p-3">Tên</th><th className="p-3">Ngôn ngữ</th>
              <th className="p-3">Cấp độ</th><th className="p-3">Loại</th><th className="p-3">Thị trường</th>
              <th className="p-3 text-right">Học phí</th><th className="p-3">Trạng thái</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-mono text-xs">{p.code}</td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.language ?? "—"}</td>
                <td className="p-3">{p.level ?? "—"}</td>
                <td className="p-3">{programTypeLabel(p.program_type)}</td>
                <td className="p-3">{p.market ?? "—"}</td>
                <td className="p-3 text-right">{Number(p.tuition_fee).toLocaleString("vi-VN")} {p.currency}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {p.is_active ? "Đang mở" : "Tạm ngưng"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => setEditing(p)} className="mr-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4"/></button>
                  <button onClick={() => { if (confirm("Xoá chương trình này?")) delMut.mutate(p.id); }} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                </td>
              </tr>
            ))}
            {list.data?.items.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Chưa có chương trình nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditForm({ initial, onSave, onCancel, pending }: any) {
  const [f, setF] = useState<any>(initial);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <h3 className="font-bold">{f.id ? "Sửa chương trình" : "Thêm chương trình"}</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Mã *"><Input value={f.code ?? ""} onChange={(e) => set("code", e.target.value)} /></Field>
        <Field label="Tên *" className="md:col-span-2"><Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Ngôn ngữ"><Input value={f.language ?? ""} onChange={(e) => set("language", e.target.value)} placeholder="de/ja/ko/zh" /></Field>
        <Field label="Cấp độ"><Input value={f.level ?? ""} onChange={(e) => set("level", e.target.value)} placeholder="A1/B1/N4" /></Field>
        <Field label="Loại chương trình">
          <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={f.program_type ?? ""} onChange={(e) => set("program_type", e.target.value || null)}>
            <option value="">— Chưa phân loại —</option>
            {PROGRAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Thị trường"><Input value={f.market ?? ""} onChange={(e) => set("market", e.target.value)} placeholder="duc/nhat/han" /></Field>
        <Field label="Số giờ"><Input type="number" value={f.total_hours ?? 0} onChange={(e) => set("total_hours", Number(e.target.value))} /></Field>
        <Field label="Số buổi"><Input type="number" value={f.total_sessions ?? 0} onChange={(e) => set("total_sessions", Number(e.target.value))} /></Field>
        <Field label="Học phí"><Input type="number" value={f.tuition_fee ?? 0} onChange={(e) => set("tuition_fee", Number(e.target.value))} /></Field>
        <Field label="Mô tả" className="md:col-span-3">
          <textarea className="w-full rounded-md border bg-background p-2 text-sm" rows={2} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!f.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Đang mở
      </label>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button disabled={pending} onClick={() => onSave(f)}>{pending ? "Đang lưu..." : "Lưu"}</Button>
      </div>
    </div>
  );
}
function Field({ label, children, className = "" }: any) {
  return <label className={`block text-xs font-medium text-muted-foreground space-y-1 ${className}`}><div>{label}</div>{children}</label>;
}
