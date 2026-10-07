import { errorMessage } from "@/lib/errors";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { uploadPostCover, generatePostCover } from "@/lib/post-media.functions";
import { Loader2, Sparkles, Upload, Trash2 } from "lucide-react";

export type PostFormData = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  published: boolean;
};

const empty: PostFormData = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_image: "",
  category: "",
  published: false,
};

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 160);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => {
      const result = String(r.result || "");
      const i = result.indexOf("base64,");
      resolve(i >= 0 ? result.slice(i + 7) : result);
    };
    r.readAsDataURL(file);
  });
}

export function PostForm({
  initial,
  onSubmit,
  submitLabel,
  loading,
}: {
  initial?: PostFormData;
  onSubmit: (data: PostFormData) => void;
  submitLabel: string;
  loading?: boolean;
}) {
  const [form, setForm] = useState<PostFormData>(initial ?? empty);
  const [autoSlug, setAutoSlug] = useState(!initial);
  const [aiPrompt, setAiPrompt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useServerFn(uploadPostCover);
  const generate = useServerFn(generatePostCover);

  async function handleFile(file: File) {
    if (!ACCEPT.includes(file.type)) {
      toast.error("Chỉ chấp nhận PNG, JPG, WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Ảnh quá lớn, tối đa 2MB");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const mime = (file.type === "image/jpg" ? "image/jpeg" : file.type) as
        | "image/png" | "image/jpeg" | "image/webp";
      const { url } = await upload({ data: { base64, mime } });
      setForm((f) => ({ ...f, cover_image: url }));
      toast.success("Đã tải ảnh lên");
    } catch (e) {
      toast.error(errorMessage(e, "Tải ảnh thất bại"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleGenerate() {
    const prompt = aiPrompt.trim() || form.title.trim();
    if (prompt.length < 4) {
      toast.error("Nhập mô tả ảnh (≥ 4 ký tự) hoặc tiêu đề bài viết trước");
      return;
    }
    setGenerating(true);
    try {
      const { url } = await generate({ data: { prompt } });
      setForm((f) => ({ ...f, cover_image: url }));
      toast.success("Đã tạo ảnh bằng AI");
    } catch (e) {
      toast.error(errorMessage(e, "Tạo ảnh thất bại"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-5 rounded-2xl border bg-card p-6"
    >
      <div>
        <Label htmlFor="title">Tiêu đề *</Label>
        <Input
          id="title"
          required
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm((f) => ({ ...f, title, slug: autoSlug ? slugify(title) : f.slug }));
          }}
        />
      </div>
      <div>
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          required
          value={form.slug}
          onChange={(e) => { setAutoSlug(false); setForm({ ...form, slug: e.target.value }); }}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="category">Danh mục</Label>
          <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="VD: Du học Nhật" />
        </div>
        <div>
          <Label htmlFor="cover">Ảnh bìa (URL)</Label>
          <Input id="cover" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="Dán URL hoặc dùng các tùy chọn bên dưới" />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-semibold">Ảnh bìa</Label>
          {form.cover_image && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setForm({ ...form, cover_image: "" })}
            >
              <Trash2 className="mr-1 size-4" /> Xoá ảnh
            </Button>
          )}
        </div>

        {form.cover_image && (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img
            src={form.cover_image}
            alt="Ảnh bìa hiện tại"
            className="aspect-video w-full rounded-lg border object-cover"
          />
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT.join(",")}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
              {uploading ? "Đang tải lên..." : "Tải ảnh lên (PNG/JPG/WebP ≤ 2MB)"}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Mô tả ảnh muốn AI tạo (mặc định: tiêu đề bài viết)"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={generating}
                onClick={handleGenerate}
              >
                {generating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                {generating ? "Đang tạo..." : "Tạo bằng AI"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="excerpt">Mô tả ngắn</Label>
        <Textarea id="excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="content">Nội dung</Label>
        <Textarea id="content" rows={14} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="published" checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
        <Label htmlFor="published">Xuất bản công khai</Label>
      </div>
      <Button type="submit" disabled={loading} className="bg-primary">
        {loading ? "Đang lưu..." : submitLabel}
      </Button>
    </form>
  );
}
