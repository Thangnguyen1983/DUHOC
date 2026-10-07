import { errorMessage } from "@/lib/errors";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMaterials, upsertMaterial, deleteMaterial, getSignedMaterialUrl } from "@/lib/training/lms.functions";
import { listPrograms, listClasses } from "@/lib/training/training.functions";
import {
  APPROVAL_LABEL, MATERIAL_TYPES, inferMaterialType,
  listPendingMaterials, reviewMaterial, submitMaterialForApproval, listCurriculumTemplates,
} from "@/lib/training/curriculum.functions";
import { useMyAccess } from "@/lib/rbac/use-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Folder, Download, Upload, Send, Check, X, Pencil, AlertTriangle, ShieldCheck, Presentation } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { CurriculumCoverage } from "./curriculum-coverage";

const MARKETS = [
  { code: "korea", label: "Hàn Quốc" },
  { code: "japan", label: "Nhật Bản" },
  { code: "germany", label: "CHLB Đức" },
  { code: "china", label: "Đài Loan / Trung Quốc" },
  { code: "europe", label: "Châu Âu khác" },
];
export const MARKET_LABEL: Record<string, string> = Object.fromEntries(MARKETS.map((m) => [m.code, m.label]));

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[status] ?? STATUS_CLASS.draft}`}>{APPROVAL_LABEL[status] ?? status}</span>;
}

/** Tài liệu "đạt chuẩn" khi có đủ: file, thị trường, loại, số buổi và đã duyệt. */
export function isStandard(m: any) {
  return !!m.file_path && !!m.market_code && !!m.material_type && !!m.lesson_no && m.approval_status === "approved";
}

/** Quản lý tài liệu học tập — dùng chung cho trang quản trị và cổng giáo viên. */
export function MaterialsManager({ subtitle, teacherMode }: { subtitle?: string; teacherMode?: boolean }) {
  const fetchList = useServerFn(listMaterials);
  const fetchPrograms = useServerFn(listPrograms);
  const fetchClasses = useServerFn(listClasses);
  const fetchPending = useServerFn(listPendingMaterials);
  const fetchTemplates = useServerFn(listCurriculumTemplates);
  const save = useServerFn(upsertMaterial);
  const remove = useServerFn(deleteMaterial);
  const sign = useServerFn(getSignedMaterialUrl);
  const submit = useServerFn(submitMaterialForApproval);
  const review = useServerFn(reviewMaterial);
  const qc = useQueryClient();
  const { access } = useMyAccess();
  const roles: string[] = (access as any)?.roles ?? [];
  const isStaff = roles.some((r) => ["admin", "training_manager", "training_staff"].includes(r));

  const list = useQuery({ queryKey: ["materials"], queryFn: () => fetchList({ data: {} }) });
  const programs = useQuery({ queryKey: ["training-programs"], queryFn: () => fetchPrograms() });
  const classes = useQuery({ queryKey: ["training-classes"], queryFn: () => fetchClasses() });
  const pending = useQuery({ queryKey: ["materials-pending"], queryFn: () => fetchPending(), enabled: isStaff });
  const templates = useQuery({ queryKey: ["curriculum-templates"], queryFn: () => fetchTemplates() });

  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "nonstandard" | "mine">("all");
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const invalidate = () => { qc.invalidateQueries({ queryKey: ["materials"] }); qc.invalidateQueries({ queryKey: ["materials-pending"] }); qc.invalidateQueries({ queryKey: ["curriculum-coverage"] }); };
  const saveMut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const submitMut = useMutation({
    mutationFn: (id: string) => submit({ data: { id } }),
    onSuccess: () => { toast.success("Đã gửi duyệt"); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const reviewMut = useMutation({
    mutationFn: (d: { id: string; decision: "approved" | "rejected"; note?: string | null }) => review({ data: d }),
    onSuccess: (_, v) => { toast.success(v.decision === "approved" ? "Đã duyệt tài liệu" : "Đã từ chối"); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  async function uploadTo(file: File, field: "file" | "pdf") {
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error } = await supabase.storage.from("lesson-materials").upload(path, file);
      if (error) throw error;
      if (field === "file") {
        setEditing((e: any) => ({
          ...e, file_name: file.name, file_path: path, file_type: file.type, file_size: file.size,
          material_type: e?.material_type && e.material_type !== "document" ? e.material_type : inferMaterialType(file.name, file.type),
        }));
      } else {
        setEditing((e: any) => ({ ...e, pdf_companion_path: path }));
      }
      toast.success("Đã tải file");
    } catch (e: any) { toast.error(errorMessage(e)); }
    setUploading(false);
  }

  async function download(path: string) {
    try {
      const { url } = await sign({ data: { path, bucket: "lesson-materials" } });
      window.open(url, "_blank");
    } catch (e: any) { toast.error(errorMessage(e)); }
  }

  function openNew() {
    setEditing({ title: "", program_id: programs.data?.items[0]?.id ?? null, class_id: null, category: "Slide", is_public: false, market_code: "", material_type: "slide", lesson_no: null, change_note: "" });
  }

  const items: any[] = list.data?.items ?? [];
  const shown = items.filter((m) => filter === "all" ? true : filter === "mine" ? m.created_by === userId : !isStandard(m));
  const nonStandardCount = items.filter((m) => !isStandard(m)).length;
  const isPptx = (m: any) => /\.(pptx?|key|odp)$/i.test(m.file_name ?? "");
  const canEdit = (m: any) => isStaff || m.created_by === userId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Folder className="h-6 w-6"/> Tài liệu học tập</h1>
          <p className="text-sm text-muted-foreground">{subtitle ?? "Slide, PDF, audio dùng cho các chương trình — tài liệu phải đạt chuẩn và được duyệt trước khi dùng cho học viên"}</p>
        </div>
        <div className="flex gap-2">
          {teacherMode && <Button asChild variant="outline"><Link to="/giang-day/trinh-chieu"><Presentation className="h-4 w-4 mr-1"/> Trình chiếu</Link></Button>}
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1"/> Thêm tài liệu</Button>
        </div>
      </div>

      {editing && (
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <h3 className="font-bold">{editing.id ? `Sửa tài liệu (phiên bản ${editing.version ?? 1})` : "Thêm tài liệu theo chuẩn giảng dạy"}</h3>
          <Input placeholder="Tên tài liệu *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={editing.market_code ?? ""} onChange={(e) => setEditing({ ...editing, market_code: e.target.value || null })}>
              <option value="">— Thị trường * —</option>
              {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
            </select>
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={editing.material_type ?? "document"} onChange={(e) => setEditing({ ...editing, material_type: e.target.value, category: MATERIAL_TYPES.find((t) => t.value === e.target.value)?.label ?? editing.category })}>
              {MATERIAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="number" min={1} placeholder="Buổi số *" value={editing.lesson_no ?? ""} onChange={(e) => setEditing({ ...editing, lesson_no: e.target.value ? Number(e.target.value) : null })}/>
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={editing.curriculum_slot_id ?? ""} onChange={(e) => setEditing({ ...editing, curriculum_slot_id: e.target.value || null })}>
              <option value="">— Vị trí trong khung chuẩn —</option>
              {(templates.data?.items ?? []).filter((t: any) => !editing.market_code || t.market_code === editing.market_code).map((t: any) => (
                <optgroup key={t.id} label={t.name}>
                  {t.curriculum_template_items.map((it: any) => <option key={it.id} value={it.id}>Buổi {it.lesson_no}: {it.topic}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={editing.program_id ?? ""} onChange={(e) => setEditing({ ...editing, program_id: e.target.value || null })}>
              <option value="">— Chương trình (tuỳ chọn) —</option>
              {(programs.data?.items ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={editing.class_id ?? ""} onChange={(e) => setEditing({ ...editing, class_id: e.target.value || null })}>
              <option value="">— Lớp cụ thể (tuỳ chọn) —</option>
              {(classes.data?.items ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.code ? `${c.code} · ` : ""}{c.name}</option>)}
            </select>
          </div>
          <Textarea placeholder="Mô tả ngắn / mục tiêu buổi học" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}/>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm cursor-pointer hover:bg-muted">
              <Upload className="h-4 w-4"/> {uploading ? "Đang tải..." : "Chọn file chính *"}
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadTo(e.target.files[0], "file")}/>
            </label>
            {editing.file_name && <span className="text-sm text-muted-foreground">{editing.file_name} ({Math.round((editing.file_size ?? 0)/1024)} KB)</span>}
            {isPptx(editing) && (
              <label className="inline-flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm cursor-pointer hover:bg-muted">
                <Upload className="h-4 w-4"/> {editing.pdf_companion_path ? "Đã có bản PDF kèm" : "Thêm bản PDF kèm (khuyến nghị)"}
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadTo(e.target.files[0], "pdf")}/>
              </label>
            )}
          </div>
          {isPptx(editing) && !editing.pdf_companion_path && (
            <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> File PowerPoint sẽ được chiếu qua trình xem Office trực tuyến; nên đính kèm bản PDF để chiếu ổn định khi mạng yếu.</p>
          )}
          {editing.id && <Input placeholder="Ghi chú thay đổi (khi thay file mới)" value={editing.change_note ?? ""} onChange={(e) => setEditing({ ...editing, change_note: e.target.value })}/>}
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.is_public} onChange={(e) => setEditing({ ...editing, is_public: e.target.checked })}/> Tài liệu công khai cho mọi học viên</label>
          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate({ ...editing, category: editing.category || MATERIAL_TYPES.find((t) => t.value === editing.material_type)?.label })} disabled={saveMut.isPending || !editing.file_path || !editing.title}>{saveMut.isPending ? "Đang lưu..." : "Lưu"}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
          </div>
          {!isStaff && <p className="text-xs text-muted-foreground">Sau khi lưu, bấm <strong>Gửi duyệt</strong> để giáo vụ kiểm tra. Học viên chỉ thấy tài liệu đã được duyệt.</p>}
        </div>
      )}

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Thư viện ({items.length})</TabsTrigger>
          {isStaff && <TabsTrigger value="pending">Chờ duyệt ({pending.data?.items.length ?? 0})</TabsTrigger>}
          <TabsTrigger value="coverage">Khung chương trình chuẩn</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Tất cả</Button>
            <Button size="sm" variant={filter === "nonstandard" ? "default" : "outline"} onClick={() => setFilter("nonstandard")}><AlertTriangle className="h-3 w-3 mr-1"/> Chưa đạt chuẩn ({nonStandardCount})</Button>
            <Button size="sm" variant={filter === "mine" ? "default" : "outline"} onClick={() => setFilter("mine")}>Của tôi</Button>
          </div>
          <div className="rounded-2xl border bg-card overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr><th className="p-3">Tên</th><th className="p-3">Thị trường</th><th className="p-3">Loại</th><th className="p-3">Buổi</th><th className="p-3">Phạm vi</th><th className="p-3">Trạng thái</th><th className="p-3">File</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {shown.map((m: any) => (
                  <tr key={m.id} className="border-t align-top">
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-1">{isStandard(m) && <ShieldCheck className="h-4 w-4 text-emerald-600" aria-label="Đạt chuẩn"/>}{m.title}</div>
                      {m.version > 1 && <div className="text-xs text-muted-foreground">Phiên bản {m.version}</div>}
                      {m.approval_status === "rejected" && m.rejection_reason && <div className="text-xs text-destructive">Lý do: {m.rejection_reason}</div>}
                    </td>
                    <td className="p-3">{m.market_code ? MARKET_LABEL[m.market_code] ?? m.market_code : <span className="text-amber-700">Thiếu</span>}</td>
                    <td className="p-3">{MATERIAL_TYPES.find((t) => t.value === m.material_type)?.label ?? m.category}</td>
                    <td className="p-3">{m.lesson_no ?? <span className="text-amber-700">—</span>}</td>
                    <td className="p-3 text-xs text-muted-foreground">{m.training_classes?.name ?? m.training_programs?.name ?? (m.is_public ? "Công khai" : "Thị trường")}</td>
                    <td className="p-3"><StatusBadge status={m.approval_status}/></td>
                    <td className="p-3 text-xs">{m.file_name}{m.pdf_companion_path && <div className="text-muted-foreground">+ PDF kèm</div>}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {m.file_path && <Button size="sm" variant="ghost" title="Tải về" onClick={() => download(m.file_path)}><Download className="h-4 w-4"/></Button>}
                      {canEdit(m) && <Button size="sm" variant="ghost" title="Sửa" onClick={() => setEditing({ ...m, change_note: "" })}><Pencil className="h-4 w-4"/></Button>}
                      {canEdit(m) && ["draft", "rejected"].includes(m.approval_status) && <Button size="sm" variant="ghost" title="Gửi duyệt" onClick={() => submitMut.mutate(m.id)}><Send className="h-4 w-4 text-primary"/></Button>}
                      {isStaff && m.approval_status !== "approved" && <Button size="sm" variant="ghost" title="Duyệt ngay" onClick={() => reviewMut.mutate({ id: m.id, decision: "approved" })}><Check className="h-4 w-4 text-emerald-600"/></Button>}
                      {canEdit(m) && <Button size="sm" variant="ghost" title="Xoá" onClick={() => confirm("Xoá tài liệu này?") && delMut.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Chưa có tài liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {isStaff && (
          <TabsContent value="pending">
            <div className="rounded-2xl border bg-card divide-y">
              {(pending.data?.items ?? []).map((m: any) => (
                <PendingRow key={m.id} m={m} onDownload={download} onReview={(decision, note) => reviewMut.mutate({ id: m.id, decision, note })} />
              ))}
              {(pending.data?.items ?? []).length === 0 && <div className="p-6 text-center text-muted-foreground">Không có tài liệu chờ duyệt</div>}
            </div>
          </TabsContent>
        )}

        <TabsContent value="coverage">
          <CurriculumCoverage templates={templates.data?.items ?? []} classes={classes.data?.items ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingRow({ m, onDownload, onReview }: { m: any; onDownload: (p: string) => void; onReview: (d: "approved" | "rejected", note?: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="p-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold">{m.title}</div>
        <div className="text-xs text-muted-foreground">
          {MARKET_LABEL[m.market_code] ?? m.market_code ?? "—"} · {MATERIAL_TYPES.find((t) => t.value === m.material_type)?.label} · Buổi {m.lesson_no ?? "—"} · {m.training_classes?.name ?? m.training_programs?.name ?? "Thị trường"} · v{m.version}
        </div>
        {m.description && <p className="mt-1 text-sm">{m.description}</p>}
        {!isStandard({ ...m, approval_status: "approved" }) && <p className="mt-1 text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Thiếu thông tin chuẩn (thị trường/số buổi) — nên từ chối kèm hướng dẫn.</p>}
      </div>
      <div className="flex flex-col gap-2 w-full sm:w-72">
        <Input placeholder="Nhận xét / lý do từ chối" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex gap-2">
          {m.file_path && <Button size="sm" variant="outline" onClick={() => onDownload(m.file_path)}><Download className="h-4 w-4 mr-1"/> Xem</Button>}
          <Button size="sm" onClick={() => onReview("approved", note || null as any)}><Check className="h-4 w-4 mr-1"/> Duyệt</Button>
          <Button size="sm" variant="destructive" onClick={() => onReview("rejected", note)}><X className="h-4 w-4 mr-1"/> Từ chối</Button>
        </div>
      </div>
    </div>
  );
}
