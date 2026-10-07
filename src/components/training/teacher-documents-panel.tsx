import { errorMessage } from "@/lib/errors";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTeacherDocuments,
  saveTeacherDocument,
  deleteTeacherDocument,
  getTeacherDocumentUrl,
} from "@/lib/training/teacher-docs.functions";
import { TEACHER_DOC_TYPES, teacherDocTypeLabel } from "@/lib/training/teacher-docs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 8192) {
    bin += String.fromCharCode(...buf.subarray(i, i + 8192));
  }
  return btoa(bin);
}

export function TeacherDocumentsPanel({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const qc = useQueryClient();
  const fetchList = useServerFn(listTeacherDocuments);
  const save = useServerFn(saveTeacherDocument);
  const remove = useServerFn(deleteTeacherDocument);
  const signUrl = useServerFn(getTeacherDocumentUrl);

  const [form, setForm] = useState<any>({ doc_type: "certificate", title: "", issued_at: "", expires_at: "", note: "" });
  const [file, setFile] = useState<File | null>(null);

  const list = useQuery({
    queryKey: ["teacher-docs", teacherId],
    queryFn: () => fetchList({ data: { teacher_id: teacherId } }),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Vui lòng chọn tệp");
      if (file.size > 20 * 1024 * 1024) throw new Error("Tệp vượt quá 20MB");
      return save({
        data: {
          teacher_id: teacherId,
          doc_type: form.doc_type,
          title: form.title || file.name,
          file_base64: await fileToBase64(file),
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          issued_at: form.issued_at || null,
          expires_at: form.expires_at || null,
          note: form.note || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Đã tải hồ sơ lên");
      setForm({ doc_type: "certificate", title: "", issued_at: "", expires_at: "", note: "" });
      setFile(null);
      qc.invalidateQueries({ queryKey: ["teacher-docs", teacherId] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["teacher-docs", teacherId] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  async function openDoc(id: string) {
    try {
      const { url } = await signUrl({ data: { id } });
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h3 className="font-bold">Hồ sơ năng lực — {teacherName}</h3>
        <p className="text-sm text-muted-foreground">CV, bằng cấp, chứng chỉ chuyên môn (lưu trữ riêng tư, tối đa 20MB/tệp).</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className="rounded-md border bg-background p-2 text-sm"
          value={form.doc_type}
          onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
        >
          {TEACHER_DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <Input placeholder="Tên tài liệu" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label className="text-sm">
          <span className="text-xs text-muted-foreground">Ngày cấp</span>
          <Input type="date" value={form.issued_at} onChange={(e) => setForm({ ...form, issued_at: e.target.value })} />
        </label>
        <label className="text-sm">
          <span className="text-xs text-muted-foreground">Ngày hết hạn</span>
          <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        </label>
      </div>
      <Textarea placeholder="Ghi chú" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      <div className="flex flex-wrap items-center gap-2">
        <Input type="file" className="max-w-xs" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !file}>
          <Upload className="mr-1 h-4 w-4" /> {saveMut.isPending ? "Đang tải lên..." : "Tải lên"}
        </Button>
      </div>

      <div className="divide-y rounded-xl border">
        {(list.data?.items ?? []).map((d: any) => (
          <div key={d.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <button className="font-medium hover:text-primary hover:underline" onClick={() => openDoc(d.id)}>{d.title}</button>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{teacherDocTypeLabel(d.doc_type)}</span>
            {d.expires_at && (
              <span className={`text-xs ${new Date(d.expires_at) < new Date() ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                HSD {new Date(d.expires_at).toLocaleDateString("vi-VN")}
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{d.file_name}</span>
            <Button size="sm" variant="ghost" onClick={() => confirm("Xoá tài liệu này?") && delMut.mutate(d.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {(list.data?.items ?? []).length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">Chưa có tài liệu nào.</p>
        )}
      </div>
    </div>
  );
}
