import { errorMessage } from "@/lib/errors";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCertificates, issueCertificate, revokeCertificate, getSignedMaterialUrl } from "@/lib/training/lms.functions";
import { listStudents } from "@/lib/students.functions";
import { listPrograms } from "@/lib/training/training.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Award, Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Quản lý chứng chỉ — dùng chung cho trang quản trị và cổng giáo viên.
 * `canIssue=false` (giáo viên) chỉ xem và tải chứng chỉ trong phạm vi lớp của mình.
 */
export function CertificatesManager({ canIssue = true }: { canIssue?: boolean }) {
  const fetchList = useServerFn(listCertificates);
  const fetchStudents = useServerFn(listStudents);
  const fetchPrograms = useServerFn(listPrograms);
  const issue = useServerFn(issueCertificate);
  const revoke = useServerFn(revokeCertificate);
  const sign = useServerFn(getSignedMaterialUrl);
  const qc = useQueryClient();

  const list = useQuery({ queryKey: ["certificates"], queryFn: () => fetchList() });
  const students = useQuery({ queryKey: ["students-all"], queryFn: () => fetchStudents({ data: {} }), enabled: canIssue });
  const programs = useQuery({ queryKey: ["training-programs"], queryFn: () => fetchPrograms(), enabled: canIssue });

  const [form, setForm] = useState<any | null>(null);

  const issueMut = useMutation({
    mutationFn: (d: any) => issue({ data: d }),
    onSuccess: (r: any) => { toast.success(`Đã cấp chứng chỉ ${r.certificate_number}`); setForm(null); qc.invalidateQueries({ queryKey: ["certificates"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => { toast.success("Đã thu hồi"); qc.invalidateQueries({ queryKey: ["certificates"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  async function downloadPdf(path: string) {
    const { url } = await sign({ data: { path, bucket: "certificates" } });
    window.open(url, "_blank");
  }

  const studentList = students.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6"/> Chứng chỉ</h1>
          <p className="text-sm text-muted-foreground">
            {canIssue ? "Cấp chứng chỉ PDF tự động cho học viên" : "Chứng chỉ của học viên trong lớp bạn phụ trách"}
          </p>
        </div>
        {canIssue && (
          <Button onClick={() => setForm({ student_profile_id: "", program_id: "", title: "Hoàn thành chương trình đào tạo", recipient_name: "" })}>
            <Plus className="h-4 w-4 mr-1"/> Cấp chứng chỉ
          </Button>
        )}
      </div>

      {canIssue && form && (
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <h3 className="font-bold">Cấp chứng chỉ mới</h3>
          <select className="rounded-md border bg-background px-3 py-2 text-sm w-full" value={form.student_profile_id} onChange={(e) => {
            const s = studentList.find((x: any) => x.id === e.target.value);
            setForm({ ...form, student_profile_id: e.target.value, recipient_name: s?.full_name ?? "" });
          }}>
            <option value="">— Chọn học viên —</option>
            {studentList.map((s: any) => <option key={s.id} value={s.id}>{s.full_name} ({s.phone})</option>)}
          </select>
          <select className="rounded-md border bg-background px-3 py-2 text-sm w-full" value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}>
            <option value="">— Không gắn chương trình —</option>
            {(programs.data?.items ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Input placeholder="Tên chứng chỉ" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/>
          <Input placeholder="Tên người được cấp (in trên chứng chỉ)" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}/>
          <div className="flex gap-2">
            <Button onClick={() => issueMut.mutate({ ...form, program_id: form.program_id || null })} disabled={issueMut.isPending || !form.student_profile_id || !form.recipient_name}>
              {issueMut.isPending ? "Đang tạo PDF..." : "Cấp chứng chỉ"}
            </Button>
            <Button variant="outline" onClick={() => setForm(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/40 text-left">
            <tr><th className="p-3">Mã</th><th className="p-3">Học viên</th><th className="p-3">Tên chứng chỉ</th><th className="p-3">Ngày cấp</th><th className="p-3">Mã xác minh</th><th className="p-3">Trạng thái</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-mono text-xs">{c.certificate_number}</td>
                <td className="p-3">{c.recipient_name}</td>
                <td className="p-3">{c.title}</td>
                <td className="p-3">{new Date(c.issued_at).toLocaleDateString("vi-VN")}</td>
                <td className="p-3 font-mono text-xs">{c.verify_code}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${c.status === "issued" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.status}</span></td>
                <td className="p-3 text-right space-x-2">
                  {c.pdf_path && <Button size="sm" variant="ghost" onClick={() => downloadPdf(c.pdf_path)}><Download className="h-4 w-4"/></Button>}
                  {canIssue && c.status === "issued" && <Button size="sm" variant="ghost" onClick={() => confirm("Thu hồi chứng chỉ?") && revokeMut.mutate(c.id)}><Ban className="h-4 w-4 text-destructive"/></Button>}
                </td>
              </tr>
            ))}
            {list.data?.items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Chưa có chứng chỉ</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
