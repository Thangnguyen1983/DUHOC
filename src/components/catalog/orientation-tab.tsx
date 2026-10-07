import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listOrientationCatalog, upsertOrientationItem, deleteOrientationItem } from "@/lib/catalog/orientation.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errors";
import { Compass, Plus, Trash2, Pencil } from "lucide-react";

type Kind = "framework" | "module" | "criterion" | "trainer";
const SECTIONS: { kind: Kind; title: string; hint: string }[] = [
  { kind: "framework", title: "Khung tiết học theo thị trường", hint: "Số tiết tối thiểu cho từng thị trường / diện" },
  { kind: "module", title: "Chuyên đề bắt buộc", hint: "Các học phần mọi lớp định hướng phải dạy" },
  { kind: "criterion", title: "Tiêu chuẩn sát hạch", hint: "Điều kiện để được cấp chứng chỉ" },
  { kind: "trainer", title: "Giảng viên định hướng", hint: "Chọn từ danh sách giáo viên hiện có" },
];
const MARKETS = [["", "—"], ["JP", "Nhật Bản"], ["KR", "Hàn Quốc"], ["TW", "Đài Loan"], ["DE", "Đức / Châu Âu"]];
const TRAINER_TYPES = ["Giảng viên nội bộ", "Cựu thực tập sinh / kỹ sư", "Chuyên gia pháp lý"];
const sel = "h-9 w-full rounded-md border bg-background px-2 text-sm";

export function OrientationTab({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listOrientationCatalog);
  const saveFn = useServerFn(upsertOrientationItem);
  const delFn = useServerFn(deleteOrientationItem);
  const [editing, setEditing] = useState<any | null>(null);
  const q = useQuery({ queryKey: ["orientation-catalog"], queryFn: () => listFn() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["orientation-catalog"] });
  const save = useMutation({
    mutationFn: (v: any) => saveFn({ data: v }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const items = (q.data?.items ?? []) as any[];
  const teachers = (q.data?.teachers ?? []) as any[];
  const teacherName = (id: string | null) => teachers.find((t) => t.id === id)?.full_name;
  const marketName = (c: string | null) => MARKETS.find(([k]) => k === c)?.[1];

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  if (q.error) return <p className="text-sm text-destructive">{errorMessage(q.error)}</p>;

  const submit = () => {
    const v = { ...editing };
    for (const k of ["hours", "threshold", "sort_order"]) v[k] = v[k] === "" || v[k] == null ? (k === "sort_order" ? 0 : null) : Number(v[k]);
    for (const k of ["market_code", "teacher_id", "unit", "trainer_type", "credential", "description"]) if (v[k] === "") v[k] = null;
    if (v.kind === "trainer" && !v.name) v.name = teacherName(v.teacher_id) ?? "";
    for (const k of ["created_at", "updated_at"]) delete v[k];
    save.mutate(v);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold"><Compass className="h-4 w-4" /> Giáo dục định hướng</p>
        <p className="text-muted-foreground">Căn cứ Luật 69/2020/QH14 và Thông tư 21/2021/TT-BLĐTBXH. Số liệu dưới đây là khung mẫu — Kaizen chỉnh lại theo quy chuẩn đã duyệt.</p>
      </div>
      {SECTIONS.map((s) => {
        const rows = items.filter((i) => i.kind === s.kind);
        return (
          <section key={s.kind} className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="font-semibold">{s.title} <span className="text-muted-foreground">({rows.length})</span></h3><p className="text-xs text-muted-foreground">{s.hint}</p></div>
              {canManage && <Button size="sm" variant="outline" onClick={() => setEditing({ kind: s.kind, name: "", sort_order: rows.length + 1, is_active: true })}><Plus className="mr-1 h-4 w-4" /> Thêm</Button>}
            </div>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có mục nào.</p> : (
              <ul className="divide-y">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">{r.kind === "trainer" ? teacherName(r.teacher_id) ?? r.name : r.name}{!r.is_active && <span className="ml-2 text-xs text-muted-foreground">(ngưng dùng)</span>}</p>
                      <p className="break-words text-xs text-muted-foreground">
                        {[marketName(r.market_code) !== "—" && marketName(r.market_code), r.hours != null && `${r.hours} tiết`, r.threshold != null && `Tối thiểu ${r.threshold} ${r.unit ?? ""}`, r.threshold == null && r.kind === "criterion" && r.unit, r.trainer_type, r.credential, r.description].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {canManage && <div className="flex gap-1">
                      <Button size="icon" variant="ghost" aria-label="Sửa" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Xoá" onClick={() => confirm("Xoá mục này?") && remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-2 sm:items-center" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl border bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">{editing.id ? "Sửa" : "Thêm"} — {SECTIONS.find((s) => s.kind === editing.kind)?.title}</h3>
            {editing.kind === "trainer" ? (<>
              <label className="block text-sm">Giáo viên<select className={sel} value={editing.teacher_id ?? ""} onChange={(e) => setEditing({ ...editing, teacher_id: e.target.value, name: teacherName(e.target.value) ?? "" })}>
                <option value="">— Chọn —</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></label>
              <label className="block text-sm">Loại giảng viên<select className={sel} value={editing.trainer_type ?? ""} onChange={(e) => setEditing({ ...editing, trainer_type: e.target.value })}>
                <option value="">—</option>{TRAINER_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="block text-sm">Chứng chỉ sư phạm / số quyết định<Input value={editing.credential ?? ""} onChange={(e) => setEditing({ ...editing, credential: e.target.value })} /></label>
            </>) : (
              <label className="block text-sm">Tên<Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            )}
            {(editing.kind === "framework" || editing.kind === "trainer") && (
              <label className="block text-sm">Thị trường<select className={sel} value={editing.market_code ?? ""} onChange={(e) => setEditing({ ...editing, market_code: e.target.value })}>
                {MARKETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            )}
            {editing.kind === "framework" && <label className="block text-sm">Số tiết tối thiểu<Input type="number" value={editing.hours ?? ""} onChange={(e) => setEditing({ ...editing, hours: e.target.value })} /></label>}
            {editing.kind === "criterion" && (<div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">Ngưỡng tối thiểu<Input type="number" value={editing.threshold ?? ""} onChange={(e) => setEditing({ ...editing, threshold: e.target.value })} /></label>
              <label className="block text-sm">Đơn vị<Input value={editing.unit ?? ""} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} /></label>
            </div>)}
            <label className="block text-sm">Ghi chú<Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">Thứ tự<Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /></label>
              <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Đang dùng</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
              <Button disabled={save.isPending || (editing.kind === "trainer" ? !editing.teacher_id : !editing.name?.trim())} onClick={submit}>Lưu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
