import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { generateCmsImage } from "@/lib/cms/ai-image.functions";
import { Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload, Trash2, Search, FolderPlus, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { optimizeMany, PRESETS, formatBytes, type ImagePreset } from "@/lib/cms/image-optimize";
import {
  listMedia,
  uploadMedia,
  listMediaFolders,
  createMediaFolder,
  updateMediaMeta,
  deleteMedia,
} from "@/lib/cms-media.functions";

export const Route = createFileRoute("/_authenticated/admin/cms/media")({
  component: MediaLibraryPage,
});


function MediaLibraryPage() {
  const [q, setQ] = useState("");
  const [folderId, setFolderId] = useState<string | null | undefined>(undefined);
  const [mimePrefix, setMimePrefix] = useState<string>("image/");
  const [uploading, setUploading] = useState(false);
  const [preset, setPreset] = useState<ImagePreset>("generic");
  const [editing, setEditing] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const list = useServerFn(listMedia);
  const foldersFn = useServerFn(listMediaFolders);
  const upload = useServerFn(uploadMedia);
  const createFolder = useServerFn(createMediaFolder);
  const updateMeta = useServerFn(updateMediaMeta);
  const del = useServerFn(deleteMedia);
  const genImage = useServerFn(generateCmsImage);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    const prompt = aiPrompt.trim();
    if (prompt.length < 5) return toast.error("Nhập mô tả ảnh (tối thiểu 5 ký tự)");
    setGenerating(true);
    try {
      await genImage({ data: { prompt, folder_id: folderId ?? null } });
      toast.success("Đã tạo ảnh AI và lưu vào thư viện");
      setAiPrompt("");
      qc.invalidateQueries({ queryKey: ["cms-media"] });
    } catch (e: any) {
      toast.error(errorMessage(e, "Tạo ảnh thất bại"));
    } finally {
      setGenerating(false);
    }
  }

  const media = useQuery({
    queryKey: ["cms-media", { q, folderId, mimePrefix }],
    queryFn: () => list({ data: { q, folder_id: folderId, mime_prefix: mimePrefix, limit: 120, offset: 0 } as any }),
  });
  const folders = useQuery({
    queryKey: ["cms-media-folders"],
    queryFn: () => foldersFn(),
  });

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const optimized = await optimizeMany(Array.from(files), preset);
      const totalOrig = optimized.reduce((a, o) => a + o.originalBytes, 0);
      const totalNew = optimized.reduce((a, o) => a + o.bytes, 0);
      const payload = optimized.map((o) => ({
        file_name: o.file.name,
        mime: o.mime,
        base64: o.base64,
        width: o.width || undefined,
        height: o.height || undefined,
      }));
      await upload({ data: { files: payload, folder_id: folderId ?? null } as any });
      const saved = Math.max(0, totalOrig - totalNew);
      toast.success(
        `Đã tải lên ${files.length} ảnh · ${PRESETS[preset].label} · tiết kiệm ${formatBytes(saved)}`,
      );
      qc.invalidateQueries({ queryKey: ["cms-media"] });
    } catch (e: any) {
      toast.error(errorMessage(e, "Tải lên thất bại"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleCreateFolder() {
    const name = window.prompt("Tên folder mới:");
    if (!name) return;
    try {
      await createFolder({ data: { name } as any });
      toast.success("Đã tạo folder");
      qc.invalidateQueries({ queryKey: ["cms-media-folders"] });
    } catch (e: any) {
      toast.error(errorMessage(e, "Tạo folder thất bại"));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Xoá vĩnh viễn media này?")) return;
    try {
      await del({ data: { id } as any });
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["cms-media"] });
    } catch (e: any) {
      toast.error(errorMessage(e, "Xoá thất bại"));
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Thư viện Media</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý ảnh, video, tài liệu dùng chung cho toàn bộ website.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            value={preset}
            onChange={(e) => setPreset(e.target.value as ImagePreset)}
            title="Preset resize/nén khi upload"
          >
            {(Object.keys(PRESETS) as ImagePreset[]).map((k) => (
              <option key={k} value={k}>{PRESETS[k].label}</option>
            ))}
          </select>
          <Button variant="outline" onClick={handleCreateFolder}>
            <FolderPlus className="mr-2 h-4 w-4" /> Folder mới
          </Button>
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Tải lên
          </Button>
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 pt-2">
          <Input
            className="max-w-md"
            placeholder="Mô tả ảnh muốn tạo bằng AI…"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <Button variant="secondary" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="mr-2 h-4 w-4" /> {generating ? "Đang tạo…" : "Tạo ảnh AI"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-card p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm theo tên / alt / caption…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
          value={folderId === undefined ? "" : folderId === null ? "root" : folderId}
          onChange={(e) => {
            const v = e.target.value;
            setFolderId(v === "" ? undefined : v === "root" ? null : v);
          }}
        >
          <option value="">Tất cả folder</option>
          <option value="root">— Không có folder —</option>
          {folders.data?.items?.map((f: any) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <select
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
          value={mimePrefix}
          onChange={(e) => setMimePrefix(e.target.value)}
        >
          <option value="">Tất cả loại</option>
          <option value="image/">Ảnh</option>
          <option value="video/">Video</option>
          <option value="application/pdf">PDF</option>
          <option value="application/">Tài liệu</option>
        </select>
      </div>

      {media.isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (media.data?.items?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center text-sm text-muted-foreground">
          Chưa có media — bấm "Tải lên" ở góc phải trên để bắt đầu.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {media.data?.items?.map((m: any) => (
            <div key={m.id} className="group overflow-hidden rounded-lg border bg-card">
              <div className="aspect-square w-full bg-muted">
                {m.mime_type?.startsWith("image/") ? (
                  <img src={m.url} alt={m.alt_text ?? m.file_name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                    {m.mime_type ?? "file"}
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="truncate text-xs font-medium">{m.file_name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  {m.width && m.height ? `${m.width}×${m.height}` : ""}
                  {m.size_bytes ? ` · ${(m.size_bytes / 1024).toFixed(0)}KB` : ""}
                </div>
                <div className="mt-1.5 flex gap-1">
                  <button
                    className="rounded p-1 hover:bg-muted"
                    title="Copy URL"
                    onClick={() => {
                      navigator.clipboard.writeText(m.url);
                      toast.success("Đã copy link");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button className="rounded p-1 hover:bg-muted" title="Sửa metadata" onClick={() => setEditing(m)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="rounded p-1 hover:bg-destructive/10 text-destructive"
                    title="Xoá"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit metadata dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa thông tin media</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Alt text (mô tả cho SEO / screen reader)</Label>
                <Input
                  value={editing.alt_text ?? ""}
                  onChange={(e) => setEditing({ ...editing, alt_text: e.target.value })}
                />
              </div>
              <div>
                <Label>Caption</Label>
                <Textarea
                  rows={2}
                  value={editing.caption ?? ""}
                  onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                />
              </div>
              <div>
                <Label>Folder</Label>
                <select
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                  value={editing.folder_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, folder_id: e.target.value || null })}
                >
                  <option value="">— Không —</option>
                  {folders.data?.items?.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={async () => {
                  try {
                    await updateMeta({
                      data: {
                        id: editing.id,
                        alt_text: editing.alt_text ?? "",
                        caption: editing.caption ?? "",
                        folder_id: editing.folder_id ?? null,
                      } as any,
                    });
                    toast.success("Đã lưu");
                    setEditing(null);
                    qc.invalidateQueries({ queryKey: ["cms-media"] });
                  } catch (e: any) {
                    toast.error(errorMessage(e, "Lưu thất bại"));
                  }
                }}
              >
                Lưu
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
