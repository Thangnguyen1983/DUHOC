import { useRef, useState } from "react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, CheckCircle2, Loader2, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { EntryFormValue } from "./entry-form";

type PipelineProgress =
  | { type: "step_start"; step: number; label: string }
  | { type: "step_done"; step: number; label: string; data?: any }
  | { type: "warning"; message: string }
  | { type: "final"; result: FinalResult }
  | { type: "error"; message: string };

type FinalResult = {
  step1: any;
  step3: any;
  step4: {
    title: string;
    slug: string;
    excerpt: string;
    bodyMarkdown: string;
    seoTitle: string;
    seoDescription: string;
    ogTitle: string;
    ogDescription: string;
    heroImagePrompt: string;
    infographicPrompt: string;
    faq: { question: string; answer: string }[];
    internalLinks: { anchor: string; slug: string }[];
    externalLinks: { anchor: string; url: string }[];
  };
  step5: {
    scores: Record<string, number>;
    overall: number;
    strengths: string[];
    weaknesses: string[];
    fixInstructions: string;
  };
  semrushUsed: boolean;
};

const STEPS = [
  { n: 1, label: "Phân tích intent & persona" },
  { n: 2, label: "Nghiên cứu từ khoá (Semrush)" },
  { n: 3, label: "Xây outline vượt đối thủ" },
  { n: 4, label: "Viết bài hoàn chỉnh (2-4 phút)" },
  { n: 5, label: "Self-review & chấm điểm" },
];

const LENGTH_OPTS = [
  { v: "1500-2000 từ", label: "Vừa (1500-2000 từ)" },
  { v: "2500-3500 từ", label: "Dài (2500-3500 từ)" },
  { v: "4000-5500 từ", label: "Siêu dài / pillar (4000-5500 từ)" },
];
const TONE_OPTS = [
  "chuyên gia, đáng tin, có số liệu",
  "gần gũi, truyền cảm hứng",
  "phân tích sắc bén, phản biện",
  "hướng dẫn từng bước, thân thiện",
];
const CONTENT_TYPES = [
  "Landing dịch vụ",
  "Bài blog kiến thức",
  "So sánh / review",
  "Hướng dẫn từng bước",
  "Tin tức cập nhật",
  "Case study",
];

export function AiWriterPanel({
  onApply,
  currentTitle,
}: {
  onApply: (patch: Partial<EntryFormValue>) => void;
  currentTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [length, setLength] = useState(LENGTH_OPTS[1].v);
  const [tone, setTone] = useState(TONE_OPTS[0]);
  const [notes, setNotes] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Record<number, "pending" | "running" | "done">>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinalResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleGenerate() {
    if (!topic.trim() || !keyword.trim()) {
      setError("Vui lòng nhập chủ đề và từ khoá.");
      return;
    }
    setError(null);
    setResult(null);
    setWarnings([]);
    setProgress({ 1: "running", 2: "pending", 3: "pending", 4: "pending", 5: "pending" });
    setRunning(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Chưa đăng nhập.");

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/ai-writer", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, keyword, contentType, length, tone, notes }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6)) as PipelineProgress;
            handleEvent(evt);
          } catch {}
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function handleEvent(evt: PipelineProgress) {
    if (evt.type === "step_start") {
      setProgress((p) => ({ ...p, [evt.step]: "running" }));
    } else if (evt.type === "step_done") {
      setProgress((p) => {
        const next = { ...p, [evt.step]: "done" as const };
        if (evt.step < 5) next[evt.step + 1] = "running";
        return next;
      });
    } else if (evt.type === "warning") {
      setWarnings((w) => [...w, evt.message]);
    } else if (evt.type === "error") {
      setError(evt.message);
    } else if (evt.type === "final") {
      setResult(evt.result);
    }
  }

  function apply() {
    if (!result) return;
    const s4 = result.step4;
    const bodyMdWithFaq =
      s4.bodyMarkdown +
      (s4.faq.length
        ? `\n\n## Câu hỏi thường gặp\n\n${s4.faq
            .map((f) => `### ${f.question}\n\n${f.answer}`)
            .join("\n\n")}`
        : "");

    // Chuyển placeholder [[link:/du-hoc/han-quoc]] và [[link:/du-hoc/han-quoc|Anchor]]
    // thành markdown link chuẩn trước khi convert sang HTML.
    const withLinks = bodyMdWithFaq.replace(
      /\[\[link:([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_m, url, anchor) => `[${(anchor || url).trim()}](${url.trim()})`,
    );

    // Chuyển markdown → HTML để trang public render đúng (public page dùng
    // dangerouslySetInnerHTML, không có markdown renderer).
    const bodyHtml = marked.parse(withLinks, { async: false, gfm: true, breaks: false }) as string;

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: s4.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    };

    const confirm =
      currentTitle && currentTitle.trim().length > 0
        ? window.confirm(
            "Form hiện đã có tiêu đề. Áp dụng kết quả AI sẽ GHI ĐÈ toàn bộ title/slug/excerpt/body/SEO. Tiếp tục?",
          )
        : true;
    if (!confirm) return;

    onApply({
      title: s4.title,
      slug: s4.slug,
      excerpt: s4.excerpt,
      data: { body: bodyHtml },
      seo: {
        meta_title: s4.seoTitle,
        meta_description: s4.seoDescription,
        og_title: s4.ogTitle,
        og_description: s4.ogDescription,
        schema_jsonld: JSON.stringify(faqJsonLd, null, 2),
      },
    });
  }

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="mb-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
    >
      <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" />
        Trợ lý AI viết bài SEO
        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-normal text-primary">
          Kaizen SEO Content Agent
        </span>
      </summary>

      <div className="border-t p-4 space-y-3">
        {!running && !result && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Chủ đề chính *</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="VD: Du học Hàn Quốc 2026 chi phí bao nhiêu"
                />
              </div>
              <div>
                <Label className="text-xs">Từ khoá SEO chính *</Label>
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="VD: du học hàn quốc"
                />
              </div>
              <div>
                <Label className="text-xs">Loại bài</Label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {CONTENT_TYPES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Độ dài</Label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {LENGTH_OPTS.map((l) => (
                    <option key={l.v} value={l.v}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Tone</Label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {TONE_OPTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Ghi chú thêm (tuỳ chọn)</Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: nhấn mạnh chương trình EPS-TOPIK, đối tượng học sinh cấp 3 vừa tốt nghiệp..."
                />
              </div>
            </div>

            <Button onClick={handleGenerate} className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate bài hoàn chỉnh (2-4 phút)
            </Button>
            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{error}</div>
              </div>
            )}
          </>
        )}

        {(running || result || error) && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Tiến độ</div>
            <ul className="space-y-1.5">
              {STEPS.map((s) => {
                const st = progress[s.n];
                return (
                  <li key={s.n} className="flex items-center gap-2 text-sm">
                    {st === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : st === "running" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                    <span className={st === "pending" ? "text-muted-foreground" : ""}>
                      Bước {s.n}: {s.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            {warnings.length > 0 && (
              <div className="rounded-md bg-yellow-50 p-2 text-xs text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400">
                <div className="flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3 w-3" /> Cảnh báo
                </div>
                <ul className="mt-1 list-disc pl-4">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && !result && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">Lỗi:</div>
                  <div>{error}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setError(null);
                      setProgress({});
                    }}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-3 space-y-3 rounded-lg border bg-card p-3">
                <div>
                  <div className="text-xs text-muted-foreground">Điểm tổng thể</div>
                  <div className="flex items-baseline gap-2">
                    <div
                      className={`text-3xl font-bold ${
                        result.step5.overall >= 95
                          ? "text-green-600"
                          : result.step5.overall >= 85
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.round(result.step5.overall)}
                    </div>
                    <div className="text-sm text-muted-foreground">/100</div>
                    {!result.semrushUsed && (
                      <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] text-yellow-800">
                        không dùng Semrush
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] sm:grid-cols-4">
                  {Object.entries(result.step5.scores).map(([k, v]) => (
                    <div key={k} className="rounded bg-muted px-1.5 py-1">
                      <div className="font-medium">{k}</div>
                      <div className={v >= 90 ? "text-green-600" : v >= 75 ? "text-yellow-600" : "text-red-600"}>
                        {Math.round(v)}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs font-semibold">Bài viết đã sinh:</div>
                  <div className="mt-1 rounded border bg-background p-2 text-xs">
                    <div className="font-semibold">{result.step4.title}</div>
                    <div className="text-muted-foreground">
                      slug: /{result.step4.slug} • {result.step4.bodyMarkdown.length.toLocaleString()} ký tự •{" "}
                      {result.step4.faq.length} FAQ • {result.step4.internalLinks.length} internal link
                    </div>
                    <div className="mt-1 line-clamp-2 text-muted-foreground">{result.step4.excerpt}</div>
                  </div>
                </div>

                {result.step5.weaknesses.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Điểm cần cải thiện ({result.step5.weaknesses.length})
                    </summary>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                      {result.step5.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </details>
                )}

                <div className="flex gap-2">
                  <Button onClick={apply} className="flex-1">
                    Áp dụng vào form
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null);
                      setProgress({});
                      setWarnings([]);
                    }}
                  >
                    Chạy lại
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Prompt ảnh hero: <em>{result.step4.heroImagePrompt}</em>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
