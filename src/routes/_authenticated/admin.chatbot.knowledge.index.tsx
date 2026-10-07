import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { listKnowledge, approveKnowledge, deleteKnowledge } from "@/lib/chatbot/knowledge.functions";
import { importKnowledgeFile } from "@/lib/chatbot/import.functions";
import { Plus, CheckCircle2, Trash2, Pencil, Search, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/chatbot/knowledge/")({
  component: KnowledgeList,
});

const CATEGORY_LABEL: Record<string, string> = {
  du_hoc: "Du học",
  xkld: "XKLĐ",
  ngoai_ngu: "Ngoại ngữ",
  outsourcing: "Outsourcing",
  cong_ty: "Công ty",
  phap_ly: "Pháp lý",
  khac: "Khác",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  archived: "bg-gray-200 text-gray-600",
};

function KnowledgeList() {
  const fetchKB = useServerFn(listKnowledge);
  const approveFn = useServerFn(approveKnowledge);
  const deleteFn = useServerFn(deleteKnowledge);
  const importFn = useServerFn(importKnowledgeFile);
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [cat, setCat] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadCat, setUploadCat] = useState<string>("khac");
  const [uploadStatus, setUploadStatus] = useState<string>("pending");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({ queryKey: ["kb"], queryFn: () => fetchKB() });

  async function handleApprove(id: string) {
    await approveFn({ data: { id } });
    toast.success("Đã duyệt mục tri thức");
    qc.invalidateQueries({ queryKey: ["kb"] });
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa mục này?")) return;
    await deleteFn({ data: { id } });
    toast.success("Đã xóa");
    qc.invalidateQueries({ queryKey: ["kb"] });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", uploadCat);
    fd.append("status", uploadStatus);
    setUploading(true);
    try {
      const res = await importFn({ data: fd });
      toast.success(`Đã nạp ${res.count} mục (${res.chars.toLocaleString()} ký tự)`);
      qc.invalidateQueries({ queryKey: ["kb"] });
    } catch (err: any) {
      toast.error(errorMessage(err, "Lỗi khi nạp file"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const items = (data?.items ?? []).filter((i: any) => {
    if (cat && i.category !== cat) return false;
    if (filter && !`${i.title} ${i.content}`.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tri thức chatbot</h1>
          <p className="text-sm text-muted-foreground">Chỉ mục có trạng thái <strong>approved</strong> + <strong>active</strong> mới được bot sử dụng.</p>
        </div>
        <Link to="/admin/chatbot/knowledge/$id" params={{ id: "new" }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Thêm mục
        </Link>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm font-medium">Nạp dữ liệu từ file</div>
            <div className="text-xs text-muted-foreground">Hỗ trợ .txt .md .pdf .docx (tối đa 10MB). Nội dung dài tự động chia thành nhiều mục.</div>
          </div>
          <select value={uploadCat} onChange={(e) => setUploadCat(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" disabled={uploading}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={uploadStatus} onChange={(e) => setUploadStatus(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" disabled={uploading}>
            <option value="pending">Chờ duyệt</option>
            <option value="draft">Nháp</option>
            <option value="approved">Duyệt ngay</option>
          </select>
          <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx" onChange={handleFileChange} disabled={uploading} className="hidden" id="kb-upload" />
          <label htmlFor="kb-upload" className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="h-4 w-4" /> {uploading ? "Đang xử lý..." : "Tải file"}
          </label>
        </div>
      </div>


      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm theo tiêu đề/nội dung..."
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
          <option value="">Tất cả danh mục</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border bg-card">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>}
        {!isLoading && items.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chưa có mục tri thức nào. <Link to="/admin/chatbot/knowledge/$id" params={{ id: "new" }} className="text-primary underline">Thêm mục đầu tiên</Link>.
          </div>
        )}
        <div className="divide-y">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {CATEGORY_LABEL[item.category]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[item.status]}`}>
                    {item.status}
                  </span>
                  {!item.is_active && <span className="text-[10px] text-muted-foreground">(tắt)</span>}
                  {item.priority > 0 && <span className="text-[10px] text-muted-foreground">P{item.priority}</span>}
                </div>
                <div className="mt-1 font-medium">{item.title}</div>
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.content}</div>
                {item.keywords?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.keywords.slice(0, 5).map((k: string) => (
                      <span key={k} className="text-[10px] rounded bg-muted px-1.5 py-0.5">{k}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {item.status !== "approved" && (
                  <button onClick={() => handleApprove(item.id)} title="Duyệt" className="grid h-8 w-8 place-items-center rounded hover:bg-green-50 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
                <Link to="/admin/chatbot/knowledge/$id" params={{ id: item.id }} className="grid h-8 w-8 place-items-center rounded hover:bg-muted">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button onClick={() => handleDelete(item.id)} title="Xóa" className="grid h-8 w-8 place-items-center rounded hover:bg-red-50 text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
