import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Save, RotateCcw, CheckCircle2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { listTraining, saveTraining, activateTraining } from "@/lib/chatbot/training.functions";
import type { TrainingConfig, SampleQA } from "@/lib/chatbot/default-training";

export const Route = createFileRoute("/_authenticated/admin/chatbot/training")({
  component: TrainingManager,
});

const TONE_OPTIONS: { value: TrainingConfig["tone_style"]; label: string }[] = [
  { value: "professional", label: "Chuyên nghiệp" },
  { value: "friendly", label: "Thân thiện" },
  { value: "formal", label: "Trang trọng" },
  { value: "enthusiastic", label: "Nhiệt tình" },
];

function TrainingManager() {
  const fetchTraining = useServerFn(listTraining);
  const saveFn = useServerFn(saveTraining);
  const activateFn = useServerFn(activateTraining);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["training"], queryFn: () => fetchTraining() });
  const [cfg, setCfg] = useState<TrainingConfig | null>(null);

  useEffect(() => {
    if (data && !cfg) {
      const active = data.items.find((p: any) => p.is_active);
      if (active) {
        setCfg({
          context_summary: active.context_summary ?? "",
          audience: active.audience ?? "",
          scope_allow: active.scope_allow ?? "",
          scope_deny: active.scope_deny ?? "",
          tone_style: (active.tone_style ?? "professional") as TrainingConfig["tone_style"],
          address_user: active.address_user ?? "anh/chị",
          address_self: active.address_self ?? "Kaizen",
          max_sentences: active.max_sentences ?? 6,
          max_words_per_sentence: active.max_words_per_sentence ?? 20,
          use_emoji: !!active.use_emoji,
          language: active.language ?? "vi",
          extra_rules: active.extra_rules ?? "",
          sample_qa: (Array.isArray(active.sample_qa) ? active.sample_qa : []) as SampleQA[],
        });
      } else {
        setCfg(data.defaults);
      }
    }
  }, [data, cfg]);

  if (!cfg) {
    return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  }

  function update<K extends keyof TrainingConfig>(key: K, value: TrainingConfig[K]) {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
  }

  function updateQA(idx: number, patch: Partial<SampleQA>) {
    setCfg((c) => {
      if (!c) return c;
      const next = [...c.sample_qa];
      next[idx] = { ...next[idx], ...patch };
      return { ...c, sample_qa: next };
    });
  }

  function addQA() {
    setCfg((c) => (c ? { ...c, sample_qa: [...c.sample_qa, { q: "", a: "" }] } : c));
  }

  function removeQA(idx: number) {
    setCfg((c) => (c ? { ...c, sample_qa: c.sample_qa.filter((_, i) => i !== idx) } : c));
  }

  async function handleSave(activate: boolean) {
    if (!cfg) return;
    try {
      const cleaned = {
        ...cfg,
        sample_qa: cfg.sample_qa.filter((s) => s.q.trim() && s.a.trim()),
      };
      const res = await saveFn({ data: { config: cleaned, activate } });
      toast.success(`Đã lưu v${res.version}${activate ? " và kích hoạt" : ""}`);
      qc.invalidateQueries({ queryKey: ["training"] });
    } catch (e: any) {
      toast.error(errorMessage(e, "Lỗi khi lưu"));
    }
  }

  function handleRestore() {
    if (!data) return;
    if (!confirm("Khôi phục cấu hình huấn luyện mặc định? (chưa lưu)")) return;
    setCfg(data.defaults);
  }

  async function handleActivate(id: string) {
    await activateFn({ data: { id } });
    toast.success("Đã kích hoạt phiên bản");
    qc.invalidateQueries({ queryKey: ["training"] });
  }

  function loadVersion(item: any) {
    setCfg({
      context_summary: item.context_summary ?? "",
      audience: item.audience ?? "",
      scope_allow: item.scope_allow ?? "",
      scope_deny: item.scope_deny ?? "",
      tone_style: (item.tone_style ?? "professional") as TrainingConfig["tone_style"],
      address_user: item.address_user ?? "anh/chị",
      address_self: item.address_self ?? "Kaizen",
      max_sentences: item.max_sentences ?? 6,
      max_words_per_sentence: item.max_words_per_sentence ?? 20,
      use_emoji: !!item.use_emoji,
      language: item.language ?? "vi",
      extra_rules: item.extra_rules ?? "",
      sample_qa: (Array.isArray(item.sample_qa) ? item.sample_qa : []) as SampleQA[],
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" /> Huấn luyện chatbot
        </h1>
        <p className="text-sm text-muted-foreground">
          Cài đặt ngữ cảnh nghiệp vụ và giọng điệu tư vấn của bot.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>Thay đổi có hiệu lực sau khoảng 60 giây (cache hệ thống).</div>
      </div>

      {/* Ngữ cảnh */}
      <Section title="Ngữ cảnh nghiệp vụ">
        <Field label="Bối cảnh công ty / dịch vụ">
          <textarea
            value={cfg.context_summary}
            onChange={(e) => update("context_summary", e.target.value)}
            rows={4}
            className="textarea"
          />
        </Field>
        <Field label="Đối tượng khách hàng">
          <textarea
            value={cfg.audience}
            onChange={(e) => update("audience", e.target.value)}
            rows={3}
            className="textarea"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Chủ đề ĐƯỢC tư vấn">
            <textarea
              value={cfg.scope_allow}
              onChange={(e) => update("scope_allow", e.target.value)}
              rows={4}
              className="textarea"
            />
          </Field>
          <Field label="Chủ đề TỪ CHỐI">
            <textarea
              value={cfg.scope_deny}
              onChange={(e) => update("scope_deny", e.target.value)}
              rows={4}
              className="textarea"
            />
          </Field>
        </div>
      </Section>

      {/* Giọng điệu */}
      <Section title="Giọng điệu tư vấn">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Phong cách">
            <select
              value={cfg.tone_style}
              onChange={(e) => update("tone_style", e.target.value as any)}
              className="input"
            >
              {TONE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label='Bot tự xưng (vd: "Kaizen", "em")'>
            <input
              value={cfg.address_self}
              onChange={(e) => update("address_self", e.target.value)}
              className="input"
            />
          </Field>
          <Field label='Gọi khách (vd: "anh/chị", "bạn")'>
            <input
              value={cfg.address_user}
              onChange={(e) => update("address_user", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Số câu tối đa">
            <input
              type="number"
              min={1}
              max={20}
              value={cfg.max_sentences}
              onChange={(e) => update("max_sentences", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Từ tối đa / câu">
            <input
              type="number"
              min={5}
              max={60}
              value={cfg.max_words_per_sentence}
              onChange={(e) => update("max_words_per_sentence", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Ngôn ngữ">
            <input
              value={cfg.language}
              onChange={(e) => update("language", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Emoji">
            <label className="inline-flex items-center gap-2 mt-2 text-sm">
              <input
                type="checkbox"
                checked={cfg.use_emoji}
                onChange={(e) => update("use_emoji", e.target.checked)}
              />
              Cho phép dùng emoji
            </label>
          </Field>
        </div>
        <Field label="Luật bổ sung">
          <textarea
            value={cfg.extra_rules}
            onChange={(e) => update("extra_rules", e.target.value)}
            rows={4}
            className="textarea"
          />
        </Field>
      </Section>

      {/* Sample QA */}
      <Section title="Ví dụ Q&A mẫu (bot học theo giọng điệu này)">
        <div className="space-y-3">
          {cfg.sample_qa.map((qa, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground">Ví dụ {i + 1}</div>
                <button onClick={() => removeQA(i)} className="text-xs text-destructive inline-flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Xóa
                </button>
              </div>
              <input
                value={qa.q}
                onChange={(e) => updateQA(i, { q: e.target.value })}
                placeholder="Câu hỏi của khách..."
                className="input"
              />
              <textarea
                value={qa.a}
                onChange={(e) => updateQA(i, { a: e.target.value })}
                placeholder="Bot trả lời mẫu..."
                rows={3}
                className="textarea"
              />
            </div>
          ))}
          <button onClick={addQA} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <Plus className="h-4 w-4" /> Thêm ví dụ
          </button>
        </div>
      </Section>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleSave(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Save className="h-4 w-4" /> Lưu & kích hoạt
        </button>
        <button onClick={() => handleSave(false)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium">
          <Save className="h-4 w-4" /> Lưu nháp
        </button>
        <button onClick={handleRestore} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
          <RotateCcw className="h-4 w-4" /> Khôi phục mặc định
        </button>
      </div>

      {/* Lịch sử */}
      <div className="rounded-2xl border bg-card">
        <div className="border-b p-4 font-bold">Lịch sử phiên bản</div>
        <div className="divide-y">
          {(data?.items ?? []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium">
                  v{p.version}
                  {p.is_active && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" /> đang chạy
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleString("vi-VN")} · {p.tone_style}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadVersion(p)} className="text-xs text-primary hover:underline">
                  Tải vào editor
                </button>
                {!p.is_active && (
                  <button onClick={() => handleActivate(p.id)} className="text-xs text-green-600 hover:underline">
                    Kích hoạt
                  </button>
                )}
              </div>
            </div>
          ))}
          {data?.items.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Chưa có phiên bản nào. Đang dùng cấu hình mặc định trong code.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .textarea { width: 100%; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); padding: 0.5rem 0.75rem; font-size: 0.875rem; font-family: inherit; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <h2 className="font-bold">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
