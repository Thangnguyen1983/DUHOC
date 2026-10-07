import { errorMessage } from "@/lib/errors";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getKnowledge, upsertKnowledge } from "@/lib/chatbot/knowledge.functions";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/chatbot/knowledge/$id")({
  component: KnowledgeEditor,
});

const CATEGORIES = ["du_hoc", "xkld", "ngoai_ngu", "outsourcing", "cong_ty", "phap_ly", "khac"] as const;
const STATUSES = ["draft", "pending", "approved", "archived"] as const;

function KnowledgeEditor() {
  const { id } = useParams({ from: "/_authenticated/admin/chatbot/knowledge/$id" });
  const navigate = useNavigate();
  const isNew = id === "new";
  const fetchOne = useServerFn(getKnowledge);
  const saveFn = useServerFn(upsertKnowledge);

  const [form, setForm] = useState({
    category: "khac" as (typeof CATEGORIES)[number],
    title: "",
    content: "",
    keywords: "",
    priority: 0,
    status: "draft" as (typeof STATUSES)[number],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["kb", id],
    queryFn: () => fetchOne({ data: { id } }),
    enabled: !isNew,
  });

  useEffect(() => {
    if (data?.item) {
      const it = data.item;
      setForm({
        category: it.category,
        title: it.title,
        content: it.content,
        keywords: (it.keywords ?? []).join(", "),
        priority: it.priority ?? 0,
        status: it.status,
        is_active: it.is_active,
      });
    }
  }, [data]);

  async function handleSave() {
    if (form.title.trim().length < 2 || form.content.trim().length < 2) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    setSaving(true);
    try {
      await saveFn({
        data: {
          ...(isNew ? {} : { id }),
          category: form.category,
          title: form.title.trim(),
          content: form.content.trim(),
          keywords: form.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          priority: Number(form.priority) || 0,
          status: form.status,
          is_active: form.is_active,
        },
      });
      toast.success("Đã lưu");
      navigate({ to: "/admin/chatbot/knowledge" });
    } catch (e: any) {
      toast.error(errorMessage(e, "Lỗi khi lưu"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate({ to: "/admin/chatbot/knowledge" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <div>
        <h1 className="text-2xl font-bold">{isNew ? "Thêm mục tri thức" : "Sửa mục tri thức"}</h1>
        <p className="text-sm text-muted-foreground">Mục cần đặt trạng thái <strong>approved</strong> và <strong>active</strong> để được bot sử dụng.</p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Danh mục">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Tiêu đề">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Phí XKLĐ Đức điều dưỡng 2026" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </Field>

        <Field label="Nội dung (markdown)">
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={12}
            placeholder="Nhập kiến thức cho bot. Markdown hỗ trợ **đậm**, *nghiêng*, danh sách..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono"
          />
          <div className="mt-1 text-xs text-muted-foreground">{form.content.length} / 8000 ký tự</div>
        </Field>

        <Field label="Từ khóa (cách nhau bởi dấu phẩy)">
          <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="xkld, đức, điều dưỡng, phí" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ưu tiên (0–100)">
            <input type="number" min={0} max={100} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Kích hoạt">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Cho phép bot sử dụng
            </label>
          </Field>
        </div>

        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
