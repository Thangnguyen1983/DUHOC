import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import {
  createHeroBanner,
  deleteHeroBanner,
  listAllHeroBanners,
  reorderHeroBanners,
  updateHeroBanner,
  type HeroBanner,
} from "@/lib/hero-banners.functions";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: BannersPage,
});

const ALLOWED = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_BYTES = 1_600_000; // ~1.5MB

function BannersPage() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listAllHeroBanners);
  const createFn = useServerFn(createHeroBanner);
  const updateFn = useServerFn(updateHeroBanner);
  const deleteFn = useServerFn(deleteHeroBanner);
  const reorderFn = useServerFn(reorderHeroBanners);

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => fetchAll(),
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
  };

  const createMut = useMutation({
    mutationFn: () => createFn({ data: { image_url: preview!, alt } }),
    onSuccess: () => {
      toast.success("Đã thêm banner");
      setPreview(null);
      setAlt("");
      if (inputRef.current) inputRef.current.value = "";
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi khi tải lên")),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; alt?: string; active?: boolean }) =>
      updateFn({ data: vars }),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá banner");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => reorderFn({ data: { ids } }),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type as any)) {
      toast.error("Chỉ chấp nhận PNG, JPG hoặc WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / 1_048_576).toFixed(2);
      toast.error(`Ảnh quá lớn (${mb}MB). Tối đa 1.5MB — vui lòng nén lại.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("Không đọc được file.");
    reader.onload = () => {
      setPreview(reader.result as string);
      // Kiểm tra tỷ lệ và cảnh báo (không chặn)
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const target = 16 / 9; // ~1.778
        if (Math.abs(ratio - target) > 0.15) {
          toast.warning(
            `Ảnh ${img.width}×${img.height} không đúng tỷ lệ 16:9. Có thể bị cắt — khuyến nghị 1920×1080 hoặc 2400×1350.`,
          );
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...banners];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorderMut.mutate(next.map((b: HeroBanner) => b.id));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Banner trang chủ</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý ảnh banner hiển thị trên Hero trang chủ. Hệ thống tự động chuyển slide nếu có ≥ 2 ảnh.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Upload className="h-4 w-4" /> Thêm banner mới
        </div>
        <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
          <li><strong>Tỷ lệ chuẩn:</strong> 16:9 (ngang). Khuyến nghị 1920×1080 hoặc 2400×1350.</li>
          <li><strong>Định dạng:</strong> PNG / JPG / WebP. Tối đa 1.5MB.</li>
          <li>Ảnh sẽ hiển thị làm <strong>nền full-width</strong> ở Hero trang chủ — chủ thể nên đặt bên phải hoặc giữa, tránh để text/chi tiết quan trọng bên trái (vì phần trái sẽ bị text đè lên).</li>
        </ul>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onFile}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Mô tả ảnh (alt) — ví dụ: Học viên Kaizen tại Nhật Bản"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={200}
            />
            {preview && (
              <div className="flex gap-2">
                <button
                  onClick={() => createMut.mutate()}
                  disabled={createMut.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {createMut.isPending ? "Đang lưu..." : "Lưu banner"}
                </button>
                <button
                  onClick={() => {
                    setPreview(null);
                    setAlt("");
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted/30">
            {preview ? (
              <img src={preview} alt="Xem trước" className="h-full w-full object-cover" />
            ) : (
              <span className="px-3 text-center text-xs text-muted-foreground">Xem trước</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">
          Kho banner ({banners.length})
        </h2>
        {banners.length === 0 ? (
          <div className="rounded-2xl border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Chưa có banner nào. Trang chủ đang dùng ảnh mặc định.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {banners.map((b: HeroBanner, idx: number) => (
              <div key={b.id} className="overflow-hidden rounded-2xl border bg-card">
                <div className="relative aspect-video bg-muted">
                  <img
                    src={b.image_url}
                    alt={b.alt || "Banner"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {!b.active && (
                    <div className="absolute inset-0 grid place-items-center bg-black/50 text-xs font-semibold text-white">
                      Đang ẩn
                    </div>
                  )}
                  <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                    #{idx + 1}
                  </div>
                </div>
                <div className="space-y-2 p-3 text-xs">
                  <input
                    type="text"
                    defaultValue={b.alt}
                    onBlur={(e) => {
                      if (e.target.value !== b.alt)
                        updateMut.mutate({ id: b.id, alt: e.target.value });
                    }}
                    placeholder="Alt text"
                    className="w-full rounded border bg-background px-2 py-1 text-xs"
                    maxLength={200}
                  />
                  <div className="flex items-center justify-between gap-1">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={b.active}
                        onChange={(e) =>
                          updateMut.mutate({ id: b.id, active: e.target.checked })
                        }
                      />
                      <span>Hiển thị</span>
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        className="rounded border p-1 hover:bg-muted disabled:opacity-30"
                        aria-label="Lên"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => move(idx, 1)}
                        disabled={idx === banners.length - 1}
                        className="rounded border p-1 hover:bg-muted disabled:opacity-30"
                        aria-label="Xuống"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Xoá banner này?")) deleteMut.mutate(b.id);
                        }}
                        className="rounded border p-1 text-destructive hover:bg-destructive/10"
                        aria-label="Xoá"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
