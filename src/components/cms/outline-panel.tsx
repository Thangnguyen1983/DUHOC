import { errorMessage } from "@/lib/errors";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ListTree,
  Plus,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  insertSection,
  moveSection,
  parseOutline,
  removeSection,
  reorderBySuggestion,
  serializeOutline,
  updateSection,
  type OutlineSection,
} from "@/lib/cms/outline";
import { normalizeMarkdown, looksUnnormalized } from "@/lib/cms/normalize-markdown";
import { suggestOutline } from "@/lib/cms/outline.functions";

type Suggested = { level: number; title: string; hint?: string };

export function OutlinePanel({
  body,
  title,
  keyword,
  onKeywordChange,
  onChange,
}: {
  body: string;
  title?: string;
  keyword: string;
  onKeywordChange: (v: string) => void;
  onChange: (body: string) => void;
}) {
  const outline = useMemo(() => parseOutline(body), [body]);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [intent, setIntent] = useState("");
  const [suggested, setSuggested] = useState<Suggested[]>([]);
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const askAi = useServerFn(suggestOutline);

  function commit(sections: OutlineSection[]) {
    setUndoStack((s) => [body, ...s].slice(0, 20));
    onChange(serializeOutline({ ...outline, sections }));
  }

  function commitRaw(next: string) {
    setUndoStack((s) => [body, ...s].slice(0, 20));
    onChange(next);
  }

  function undo() {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      onChange(s[0]);
      return s.slice(1);
    });
  }

  async function runSuggest() {
    if (!keyword.trim()) {
      toast.error("Nhập từ khoá chính trước đã.");
      return;
    }
    setBusy(true);
    try {
      const res: any = await askAi({
        data: {
          keyword: keyword.trim(),
          title: title || undefined,
          intent: intent.trim() || undefined,
          existing: outline.sections.map((s) => s.title).slice(0, 30),
        },
      });
      setSuggested(res?.sections ?? []);
      setFaq(res?.faq ?? []);
      if (!res?.sections?.length) toast.warning("AI chưa trả về dàn ý, thử lại nhé.");
    } catch (e) {
      toast.error(errorMessage(e, "Không gọi được AI."));
    } finally {
      setBusy(false);
    }
  }

  function insertSuggested(items: Suggested[]) {
    let next = outline.sections;
    for (const s of items) {
      next = insertSection(next, next.length, {
        level: s.level,
        title: s.title,
        content: s.hint ? `<!-- Gợi ý: ${s.hint} -->` : "",
        format: outline.format,
      });
    }
    commit(next);
    toast.success(`Đã chèn ${items.length} mục vào cuối bài.`);
  }

  function insertFaq() {
    if (faq.length === 0) return;
    const md = faq.map((f) => `**Hỏi:** ${f.question}\n\n**Đáp:** ${f.answer}`).join("\n\n");
    commit(
      insertSection(outline.sections, outline.sections.length, {
        level: 2,
        title: "Câu hỏi thường gặp",
        content: md,
        format: outline.format,
      }),
    );
    toast.success("Đã chèn khối FAQ.");
  }

  function applyReorder() {
    if (suggested.length === 0) return;
    commit(reorderBySuggestion(outline.sections, suggested.filter((s) => s.level === 2)));
    toast.success("Đã sắp xếp lại theo dàn ý gợi ý. Có thể bấm Hoàn tác nếu chưa ưng.");
  }

  function normalize() {
    const next = normalizeMarkdown(body);
    if (next === body) {
      toast.info("Nội dung đã chuẩn, không cần thay đổi.");
      return;
    }
    commitRaw(next);
    toast.success("Đã chuẩn hoá cấu trúc. Bấm Hoàn tác nếu muốn quay lại.");
  }

  return (
    <div className="mt-2 space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ListTree className="h-4 w-4" /> Dàn ý hiện tại ({outline.sections.length} mục)
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={normalize}>
              <Wand2 className="mr-1 h-3.5 w-3.5" />
              Chuẩn hoá cấu trúc
              {looksUnnormalized(body) ? " •" : ""}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={undoStack.length === 0} onClick={undo}>
              <Undo2 className="mr-1 h-3.5 w-3.5" /> Hoàn tác
            </Button>
          </div>
        </div>

        {outline.sections.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Chưa có tiêu đề H2/H3 nào. Dùng nút "Thêm mục" hoặc gợi ý AI bên dưới.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {outline.sections.map((s, i) => (
              <li
                key={s.key}
                className="flex items-center gap-2 rounded-lg border bg-background p-2"
                style={{ marginLeft: (Math.max(2, s.level) - 2) * 20 }}
              >
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  H{s.level}
                </span>
                <Input
                  value={s.title}
                  onChange={(e) => commit(updateSection(outline.sections, i, { title: e.target.value }))}
                  className="h-8 flex-1 text-sm"
                />
                <div className="flex shrink-0 gap-0.5">
                  <IconBtn title="Lên" onClick={() => commit(moveSection(outline.sections, i, -1))}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn title="Xuống" onClick={() => commit(moveSection(outline.sections, i, 1))}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn
                    title="Nâng cấp (H3 → H2)"
                    onClick={() => commit(updateSection(outline.sections, i, { level: Math.max(2, s.level - 1) }))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn
                    title="Hạ cấp (H2 → H3)"
                    onClick={() => commit(updateSection(outline.sections, i, { level: Math.min(4, s.level + 1) }))}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn
                    title="Chèn mục mới bên dưới"
                    onClick={() =>
                      commit(insertSection(outline.sections, i + 1, { level: s.level, title: "Mục mới", format: outline.format }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn title="Xoá mục (kèm nội dung)" onClick={() => commit(removeSection(outline.sections, i))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() =>
            commit(
              insertSection(outline.sections, outline.sections.length, {
                level: 2,
                title: "Mục mới",
                format: outline.format,
              }),
            )
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Thêm mục H2
        </Button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Di chuyển mục sẽ kéo theo toàn bộ nội dung, ảnh và video thuộc mục đó.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" /> Gợi ý dàn ý chuẩn SEO
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Từ khoá chính</Label>
            <Input
              value={keyword}
              placeholder="vd: du học Hàn Quốc 2026 chi phí"
              onChange={(e) => onKeywordChange(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Ý định tìm kiếm / ghi chú</Label>
            <Input
              value={intent}
              placeholder="vd: phụ huynh tìm hiểu chi phí và điều kiện"
              onChange={(e) => setIntent(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" size="sm" className="mt-3" disabled={busy} onClick={runSuggest}>
          <Sparkles className="mr-1 h-3.5 w-3.5" /> {busy ? "Đang gợi ý..." : "Gợi ý dàn ý"}
        </Button>

        {suggested.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => insertSuggested(suggested)}>
                Chèn tất cả
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={applyReorder}>
                Sắp xếp lại theo dàn ý gợi ý
              </Button>
              {faq.length > 0 && (
                <Button type="button" size="sm" variant="outline" onClick={insertFaq}>
                  Chèn FAQ ({faq.length})
                </Button>
              )}
            </div>
            <ul className="space-y-1.5">
              {suggested.map((s, i) => (
                <li
                  key={`${s.title}-${i}`}
                  className="flex items-start gap-2 rounded-lg border bg-background p-2 text-sm"
                  style={{ marginLeft: (s.level - 2) * 20 }}
                >
                  <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                    H{s.level}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{s.title}</div>
                    {s.hint && <div className="text-xs text-muted-foreground">{s.hint}</div>}
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => insertSuggested([s])}>
                    Chèn
                  </Button>
                </li>
              ))}
            </ul>
            {faq.length > 0 && (
              <Textarea
                readOnly
                rows={4}
                className="text-xs"
                value={faq.map((f) => `Hỏi: ${f.question}\nĐáp: ${f.answer}`).join("\n\n")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
