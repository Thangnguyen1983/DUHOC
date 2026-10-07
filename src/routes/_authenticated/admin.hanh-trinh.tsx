import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Trash2,
  Plus,
  X,
  Upload,
  Pencil,
} from "lucide-react";
import {
  listAllMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  reorderMilestones,
  uploadJourneyImage,
  type Milestone,
  type GalleryItem,
  type DocumentItem,
} from "@/lib/journey.functions";

export const Route = createFileRoute("/_authenticated/admin/hanh-trinh")({
  component: JourneyAdminPage,
});

type FormState = {
  id?: string;
  year: string;
  slug: string;
  title: string;
  short_description: string;
  content: string;
  cover_image: string;
  cover_alt: string;
  gallery: GalleryItem[];
  video_url: string;
  documents: DocumentItem[];
  achievements: string[];
  status: "published" | "draft";
  sort_order: number;
};

const EMPTY: FormState = {
  year: "",
  slug: "",
  title: "",
  short_description: "",
  content: "",
  cover_image: "",
  cover_alt: "",
  gallery: [],
  video_url: "",
  documents: [],
  achievements: [],
  status: "draft",
  sort_order: 0,
};

function JourneyAdminPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAllMilestones);
  const createFn = useServerFn(createMilestone);
  const updateFn = useServerFn(updateMilestone);
  const deleteFn = useServerFn(deleteMilestone);
  const reorderFn = useServerFn(reorderMilestones);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-milestones"],
    queryFn: () => fetchAll(),
  });

  const [editing, setEditing] = useState<FormState | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-milestones"] });
    qc.invalidateQueries({ queryKey: ["journey-milestones"] });
  }

  const saveMut = useMutation({
    mutationFn: async (form: FormState) => {
      const payload = {
        year: form.year,
        slug: form.slug,
        title: form.title,
        short_description: form.short_description,
        content: form.content,
        cover_image: form.cover_image,
        cover_alt: form.cover_alt,
        gallery: form.gallery,
        video_url: form.video_url.trim() || null,
        documents: form.documents,
        achievements: form.achievements.filter((a) => a.trim()),
        status: form.status,
        sort_order: form.sort_order,
      };
      if (form.id) {
        await updateFn({ data: { id: form.id, ...payload } });
      } else {
        await createFn({ data: payload });
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu");
      setEditing(null);
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi khi lưu")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xóa");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => reorderFn({ data: { ids } }),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  function move(idx: number, dir: -1 | 1) {
    const next = [...items];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    reorderMut.mutate(next.map((x) => x.id));
  }

  function startEdit(m: Milestone) {
    setEditing({
      id: m.id,
      year: m.year,
      slug: m.slug,
      title: m.title,
      short_description: m.short_description,
      content: m.content,
      cover_image: m.cover_image,
      cover_alt: m.cover_alt,
      gallery: m.gallery ?? [],
      video_url: m.video_url ?? "",
      documents: m.documents ?? [],
      achievements: m.achievements ?? [],
      status: m.status,
      sort_order: m.sort_order,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hành trình Kaizen</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các mốc thời gian hiển thị trên trang chủ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm mốc
        </button>
      </div>

      <div className="rounded-2xl border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Chưa có mốc nào. Hãy thêm mốc đầu tiên.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((m, idx) => (
              <li
                key={m.id}
                className="flex items-center gap-4 p-4"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-label="Lên"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Xuống"
                    onClick={() => move(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {m.cover_image && (
                    <img
                      src={m.cover_image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="serif-display text-lg font-semibold text-primary">
                      {m.year}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        m.status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {m.status === "published" ? "Đã xuất bản" : "Nháp"}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-sm font-bold">{m.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.short_description}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Xóa mốc "${m.year}"?`)) deleteMut.mutate(m.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <MilestoneEditor
          value={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={() => saveMut.mutate(editing)}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

// =========================================================
// Editor drawer
// =========================================================

function MilestoneEditor({
  value,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  value: FormState;
  onChange: (v: FormState) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const uploadFn = useServerFn(uploadJourneyImage);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    onChange({ ...value, [k]: v });

  async function uploadFile(file: File): Promise<string | null> {
    if (!file) return null;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast.error("Chỉ chấp nhận PNG, JPG, WebP");
      return null;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ảnh quá lớn, tối đa 3MB");
      return null;
    }
    const b64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = String(r.result);
        resolve(s.slice(s.indexOf(",") + 1));
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    setUploading(true);
    try {
      const res = await uploadFn({
        data: { base64: b64, mime: file.type as any },
      });
      return res.url;
    } catch (e: any) {
      toast.error(errorMessage(e, "Lỗi upload"));
      return null;
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/60"
      />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">
              {value.id ? "Sửa mốc" : "Thêm mốc"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Điền thông tin chi tiết. Bạn có thể lưu nháp trước khi xuất bản.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Năm (vd 2010 hoặc 2008–2009)" required>
              <input
                value={value.year}
                onChange={(e) => set("year", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Slug (URL-friendly)" required>
              <input
                value={value.slug}
                onChange={(e) =>
                  set(
                    "slug",
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-|-$/g, ""),
                  )
                }
                className="input"
              />
            </Field>
          </div>

          <Field label="Tiêu đề" required>
            <input
              value={value.title}
              onChange={(e) => set("title", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Mô tả ngắn (hiển thị trên card)">
            <textarea
              value={value.short_description}
              onChange={(e) => set("short_description", e.target.value)}
              rows={3}
              className="input"
            />
          </Field>

          <Field label="Nội dung chi tiết (hiển thị trong modal)">
            <textarea
              value={value.content}
              onChange={(e) => set("content", e.target.value)}
              rows={6}
              className="input"
            />
          </Field>

          <Field label="Ảnh bìa">
            <div className="flex items-start gap-3">
              <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                {value.cover_image && (
                  <img
                    src={value.cover_image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={coverInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await uploadFile(f);
                    if (url) set("cover_image", url);
                    if (coverInput.current) coverInput.current.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                >
                  <Upload className="h-3 w-3" />
                  {uploading ? "Đang tải..." : "Tải ảnh"}
                </button>
                <input
                  value={value.cover_image}
                  onChange={(e) => set("cover_image", e.target.value)}
                  placeholder="hoặc dán URL ảnh"
                  className="input"
                />
                <input
                  value={value.cover_alt}
                  onChange={(e) => set("cover_alt", e.target.value)}
                  placeholder="Mô tả ảnh (alt text)"
                  className="input"
                />
              </div>
            </div>
          </Field>

          <Field label="Thành tựu (mỗi dòng 1 thành tựu)">
            <textarea
              value={value.achievements.join("\n")}
              onChange={(e) =>
                set(
                  "achievements",
                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                )
              }
              rows={4}
              className="input"
              placeholder={"Ví dụ:\n20.000+ học viên\n500+ đối tác toàn cầu"}
            />
          </Field>

          <Field label="Video URL (YouTube)">
            <input
              value={value.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://youtu.be/..."
              className="input"
            />
          </Field>

          <Field label="Thư viện ảnh">
            <div className="space-y-2">
              {value.gallery.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <img
                    src={g.url}
                    alt=""
                    className="h-12 w-16 rounded object-cover"
                  />
                  <input
                    value={g.alt ?? ""}
                    onChange={(e) => {
                      const arr = [...value.gallery];
                      arr[i] = { ...arr[i], alt: e.target.value };
                      set("gallery", arr);
                    }}
                    placeholder="Mô tả ảnh"
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "gallery",
                        value.gallery.filter((_, j) => j !== i),
                      )
                    }
                    className="grid h-8 w-8 place-items-center rounded text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <input
                ref={galleryInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  const uploaded: GalleryItem[] = [];
                  for (const f of files) {
                    const url = await uploadFile(f);
                    if (url) uploaded.push({ url, alt: "" });
                  }
                  if (uploaded.length)
                    set("gallery", [...value.gallery, ...uploaded]);
                  if (galleryInput.current) galleryInput.current.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => galleryInput.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
              >
                <Upload className="h-3 w-3" />
                Thêm ảnh vào gallery
              </button>
            </div>
          </Field>

          <Field label="Tài liệu (mỗi dòng: Tên | URL)">
            <textarea
              value={value.documents.map((d) => `${d.name} | ${d.url}`).join("\n")}
              onChange={(e) => {
                const docs = e.target.value
                  .split("\n")
                  .map((line) => {
                    const [name, url] = line.split("|").map((s) => s.trim());
                    if (!name || !url) return null;
                    return { name, url };
                  })
                  .filter((x): x is DocumentItem => x !== null);
                set("documents", docs);
              }}
              rows={3}
              className="input"
              placeholder="Giấy phép phái cử | https://..."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trạng thái">
              <select
                value={value.status}
                onChange={(e) =>
                  set("status", e.target.value as "published" | "draft")
                }
                className="input"
              >
                <option value="draft">Nháp</option>
                <option value="published">Đã xuất bản</option>
              </select>
            </Field>
            <Field label="Thứ tự (số nhỏ hiển thị trước)">
              <input
                type="number"
                value={value.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                className="input"
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || uploading}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid hsl(var(--border));
          background: white;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus { outline: 2px solid hsl(var(--primary)); outline-offset: 1px; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
