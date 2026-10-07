import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, Plus, Trash2 } from "lucide-react";
import { MediaPicker } from "@/components/cms/media-picker";
import { SitePopupCard } from "@/components/site-popup";
import {
  createPopup,
  deletePopup,
  listAllPopups,
  reorderPopups,
  updatePopup,
  type SitePopup,
} from "@/lib/site-popups.functions";

export const Route = createFileRoute("/_authenticated/admin/popups")({
  component: PopupsPage,
});

type Draft = {
  title: string;
  description: string;
  image_url: string | null;
  cta_label: string;
  cta_href: string;
  starts_at: string;
  ends_at: string;
  dismiss_hours: number;
  active: boolean;
};

const emptyDraft: Draft = {
  title: "",
  description: "",
  image_url: null,
  cta_label: "Tìm hiểu ngay",
  cta_href: "/dang-ky",
  starts_at: "",
  ends_at: "",
  dismiss_hours: 24,
  active: true,
};

function toLocalInput(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PopupsPage() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listAllPopups);
  const createFn = useServerFn(createPopup);
  const updateFn = useServerFn(updatePopup);
  const deleteFn = useServerFn(deletePopup);
  const reorderFn = useServerFn(reorderPopups);

  const { data: popups = [] } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: () => fetchAll(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [previewing, setPreviewing] = useState<SitePopup | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
    queryClient.invalidateQueries({ queryKey: ["site-popup"] });
  };

  const payload = () => ({
    title: draft.title,
    description: draft.description,
    image_url: draft.image_url,
    cta_label: draft.cta_label,
    cta_href: draft.cta_href,
    starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
    ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
    dismiss_hours: Number(draft.dismiss_hours) || 0,
    active: draft.active,
  });

  const saveMut = useMutation({
    mutationFn: () =>
      editingId
        ? updateFn({ data: { id: editingId, ...payload() } })
        : createFn({ data: payload() }),
    onSuccess: () => {
      toast.success(editingId ? "Đã cập nhật popup" : "Đã thêm popup");
      setEditingId(null);
      setDraft(emptyDraft);
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi khi lưu")),
  });

  const toggleMut = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) => updateFn({ data: vars }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá popup");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => reorderFn({ data: { ids } }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  function move(idx: number, dir: -1 | 1) {
    const next = [...popups];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorderMut.mutate(next.map((p: SitePopup) => p.id));
  }

  function startEdit(p: SitePopup) {
    setEditingId(p.id);
    setDraft({
      title: p.title,
      description: p.description ?? "",
      image_url: p.image_url,
      cta_label: p.cta_label,
      cta_href: p.cta_href,
      starts_at: toLocalInput(p.starts_at),
      ends_at: toLocalInput(p.ends_at),
      dismiss_hours: p.dismiss_hours,
      active: p.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Popup trang chủ</h1>
        <p className="text-sm text-muted-foreground">
          Popup hiển thị ngay khi khách truy cập trang chủ để quảng bá chương trình nổi bật. Nếu có
          nhiều popup đang bật, popup ở vị trí đầu danh sách sẽ được hiển thị.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> {editingId ? "Sửa popup" : "Thêm popup mới"}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <input
              className={field}
              placeholder="Tiêu đề — ví dụ: Học bổng du học Hàn Quốc 2026"
              value={draft.title}
              maxLength={120}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <textarea
              className={field}
              rows={3}
              maxLength={500}
              placeholder="Mô tả ngắn hiển thị dưới tiêu đề"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={field}
                placeholder="Nhãn nút — Đăng ký tư vấn"
                maxLength={40}
                value={draft.cta_label}
                onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })}
              />
              <input
                className={field}
                placeholder="Đường dẫn nút — /dang-ky"
                value={draft.cta_href}
                onChange={(e) => setDraft({ ...draft, cta_href: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-muted-foreground">
                Bắt đầu (tuỳ chọn)
                <input
                  type="datetime-local"
                  className={field}
                  value={draft.starts_at}
                  onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Kết thúc (tuỳ chọn)
                <input
                  type="datetime-local"
                  className={field}
                  value={draft.ends_at}
                  onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Ẩn lại sau khi đóng (giờ)
                <input
                  type="number"
                  min={0}
                  max={720}
                  className={field}
                  value={draft.dismiss_hours}
                  onChange={(e) =>
                    setDraft({ ...draft, dismiss_hours: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Đang bật
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending || !draft.title.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saveMut.isPending ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm popup"}
              </button>
              <button
                onClick={() =>
                  setPreviewing({
                    id: "preview",
                    position: 0,
                    ...payload(),
                  } as SitePopup)
                }
                disabled={!draft.title.trim()}
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                Xem thử
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setDraft(emptyDraft);
                  }}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Hủy
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold">Ảnh popup</div>
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted/30">
              {draft.image_url ? (
                <img src={draft.image_url} alt="Xem trước" className="h-full w-full object-cover" />
              ) : (
                <span className="px-3 text-center text-xs text-muted-foreground">Chưa có ảnh</span>
              )}
            </div>
            <p className="rounded-md bg-muted/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
              <strong>Kích thước khuyến nghị:</strong> 1280×720 px (tỷ lệ 16:9), tối thiểu 800×450 px,
              định dạng JPG/WebP, dung lượng &lt; 500KB.
              <br />
              Ảnh sẽ được cắt theo tỷ lệ 16:9 — hãy đặt nội dung/chữ quan trọng ở giữa khung để tránh bị xén.
            </p>

            <div className="flex gap-2">
              <MediaPicker
                preset="hero"
                onPick={(item) => setDraft({ ...draft, image_url: item.url })}
                trigger={
                  <button className="flex-1 rounded-md border px-3 py-2 text-xs font-semibold">
                    Chọn ảnh
                  </button>
                }
              />
              {draft.image_url && (
                <button
                  onClick={() => setDraft({ ...draft, image_url: null })}
                  className="rounded-md border px-3 py-2 text-xs"
                >
                  Xoá ảnh
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Danh sách popup ({popups.length})</h2>
        {popups.length === 0 ? (
          <div className="rounded-2xl border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Chưa có popup nào.
          </div>
        ) : (
          <div className="space-y-3">
            {popups.map((p: SitePopup, idx: number) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center"
              >
                <div className="h-20 w-36 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
                      Không ảnh
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                      #{idx + 1}
                    </span>
                    <span className="truncate font-semibold">{p.title}</span>
                    {!p.active && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Đang ẩn</span>
                    )}
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{p.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {p.cta_label} → {p.cta_href} · ẩn lại {p.dismiss_hours}h
                    {p.starts_at ? ` · từ ${new Date(p.starts_at).toLocaleString("vi-VN")}` : ""}
                    {p.ends_at ? ` · đến ${new Date(p.ends_at).toLocaleString("vi-VN")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <label className="mr-2 flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={p.active}
                      onChange={(e) => toggleMut.mutate({ id: p.id, active: e.target.checked })}
                    />
                    Bật
                  </label>
                  <button
                    onClick={() => setPreviewing(p)}
                    className="rounded border p-1.5 hover:bg-muted"
                    aria-label="Xem thử"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="rounded border p-1.5 hover:bg-muted disabled:opacity-30"
                    aria-label="Lên"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === popups.length - 1}
                    className="rounded border p-1.5 hover:bg-muted disabled:opacity-30"
                    aria-label="Xuống"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded border px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Xoá popup này?")) deleteMut.mutate(p.id);
                    }}
                    className="rounded border p-1.5 text-destructive hover:bg-destructive/10"
                    aria-label="Xoá"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewing && (
        <SitePopupCard popup={previewing} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}
