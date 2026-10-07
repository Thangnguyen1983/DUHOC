import { errorMessage } from "@/lib/errors";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Image as ImageIcon, Search, Check } from "lucide-react";
import { listMedia, uploadMedia, listMediaFolders } from "@/lib/cms-media.functions";
import { optimizeMany, PRESETS, formatBytes, type ImagePreset } from "@/lib/cms/image-optimize";
import { toast } from "sonner";

type MediaItem = {
  id: string;
  file_name: string;
  mime_type: string | null;
  url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
};

export function MediaPicker({
  trigger,
  onPick,
  onPickMany,
  multiple = false,
  accept = "image/*",
  preset: presetProp = "generic",
}: {
  trigger?: React.ReactNode;
  onPick: (item: MediaItem) => void;
  /** Bật khi cần chọn nhiều ảnh một lần */
  onPickMany?: (items: MediaItem[]) => void;
  multiple?: boolean;
  accept?: string;
  /** Preset resize/nén khi upload (Hero / USP / CTA / OG / generic) */
  preset?: ImagePreset;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [folderId, setFolderId] = useState<string | null | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [preset, setPreset] = useState<ImagePreset>(presetProp);
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();


  const list = useServerFn(listMedia);
  const upload = useServerFn(uploadMedia);
  const foldersFn = useServerFn(listMediaFolders);

  const media = useQuery({
    queryKey: ["cms-media", { q, folderId }],
    queryFn: () => list({ data: { q, folder_id: folderId, mime_prefix: "image/", limit: 60, offset: 0 } as any }),
    enabled: open,
  });
  const folders = useQuery({
    queryKey: ["cms-media-folders"],
    queryFn: () => foldersFn(),
    enabled: open,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" type="button">
            <ImageIcon className="mr-2 h-4 w-4" /> Chọn từ thư viện
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Thư viện Media</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Tìm ảnh…" value={q} onChange={(e) => setQ(e.target.value)} />
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
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
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
          <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Tải lên
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {multiple && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span>Đã chọn {selected.length} ảnh — bấm vào ảnh để chọn hoặc bỏ chọn.</span>
            <Button
              type="button"
              size="sm"
              disabled={selected.length === 0}
              onClick={() => {
                onPickMany?.(selected);
                setSelected([]);
                setOpen(false);
              }}
            >
              Chèn {selected.length > 0 ? selected.length : ""} ảnh
            </Button>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          {media.isLoading ? (
            <div className="grid place-items-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (media.data?.items?.length ?? 0) === 0 ? (
            <div className="grid place-items-center py-12 text-sm text-muted-foreground">
              Chưa có media nào — bấm "Tải lên" để bắt đầu.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {media.data?.items?.map((m: any) => {
                const idx = selected.findIndex((s) => s.id === m.id);
                const isSel = idx >= 0;
                return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (multiple) {
                      setSelected((cur) =>
                        isSel ? cur.filter((s) => s.id !== m.id) : [...cur, m as MediaItem],
                      );
                      return;
                    }
                    onPick(m);
                    setOpen(false);
                  }}
                  className={`group relative overflow-hidden rounded-lg border bg-muted transition hover:ring-2 hover:ring-primary ${isSel ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="aspect-square w-full bg-muted">
                    {m.mime_type?.startsWith("image/") ? (
                      <img src={m.url} alt={m.alt_text ?? m.file_name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                        {m.mime_type ?? "file"}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-1.5 py-0.5 text-[10px]">
                    {m.file_name}
                  </div>
                  {isSel && (
                    <div className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {idx + 1}
                    </div>
                  )}
                  <div className="absolute inset-0 grid place-items-center bg-primary/0 opacity-0 transition group-hover:bg-primary/20 group-hover:opacity-100">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

