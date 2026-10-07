import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Minus,
  Image as ImageIcon,
  Images,
} from "lucide-react";
import { MediaPicker } from "@/components/cms/media-picker";
import { IconPicker } from "@/components/cms/icon-picker";
import { EmbedVideoDialog } from "@/components/cms/embed-video-dialog";

type MediaLike = { url: string; alt_text?: string | null; file_name?: string };

export function ContentToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
}) {
  const lastSel = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  function clamp(n: number) {
    return Math.max(0, Math.min(n, value.length));
  }

  function sel() {
    const el = textareaRef.current;
    if (el && typeof el.selectionStart === "number") {
      // Textarea keeps its selection after blur, so read it directly.
      const start = clamp(el.selectionStart);
      const end = clamp(el.selectionEnd);
      if (start > 0 || end > 0 || document.activeElement === el) {
        lastSel.current = { start, end };
        return lastSel.current;
      }
    }
    const fallback = lastSel.current;
    return { start: clamp(fallback.start), end: clamp(fallback.end) };
  }

  function apply(next: string, caret: number) {
    onChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
      lastSel.current = { start: caret, end: caret };
    });
  }

  function insert(text: string) {
    const { start, end } = sel();
    const next = value.slice(0, start) + text + value.slice(end);
    apply(next, start + text.length);
  }

  function wrap(before: string, after = before, placeholder = "văn bản") {
    const { start, end } = sel();
    const picked = value.slice(start, end) || placeholder;
    const text = before + picked + after;
    const next = value.slice(0, start) + text + value.slice(end);
    apply(next, start + before.length + picked.length);
  }

  function prefixLines(prefix: string | ((i: number) => string)) {
    const { start, end } = sel();
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = end === start ? value.indexOf("\n", start) : value.indexOf("\n", end);
    const stop = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, stop) || "Nội dung";
    const out = block
      .split("\n")
      .map((l, i) => (typeof prefix === "string" ? prefix : prefix(i)) + l.replace(/^([#>\-*]|\d+\.)\s*/, ""))
      .join("\n");
    const next = value.slice(0, lineStart) + out + value.slice(stop);
    apply(next, lineStart + out.length);
  }

  function figure(m: MediaLike, caption = "") {
    const alt = (m.alt_text || m.file_name || "Ảnh minh hoạ Kaizen").replace(/"/g, "'");
    return `\n<figure>\n  <img src="${m.url}" alt="${alt}" loading="lazy" />\n${caption ? `  <figcaption>${caption}</figcaption>\n` : ""}</figure>\n`;
  }

  function insertLink() {
    const { start, end } = sel();
    const picked = value.slice(start, end);
    const url = window.prompt("Dán đường dẫn liên kết:", "https://");
    if (!url) return;
    const label = picked || window.prompt("Chữ hiển thị:", "Xem chi tiết") || url;
    insert(`[${label}](${url})`);
  }

  const btn = "h-8 w-8 p-0";

  return (
    <div
      className="mb-1 flex flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-1"
      onMouseDown={(e) => {
        // Keep the caret/selection inside the textarea when clicking a tool.
        if ((e.target as HTMLElement).closest("button")) e.preventDefault();
      }}
    >
      <Button type="button" variant="ghost" size="sm" className={btn} title="Tô đậm (Ctrl+B)" onClick={() => wrap("**")}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} title="In nghiêng (Ctrl+I)" onClick={() => wrap("*")}>
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} title="Gạch chân" onClick={() => wrap("<u>", "</u>")}>
        <Underline className="h-4 w-4" />
      </Button>
      <span className="mx-1 h-5 w-px bg-border" />
      <Button type="button" variant="ghost" size="sm" className={btn} title="Tiêu đề H2" onClick={() => prefixLines("## ")}>
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} title="Tiêu đề H3" onClick={() => prefixLines("### ")}>
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} title="Danh sách chấm" onClick={() => prefixLines("- ")}>
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btn}
        title="Danh sách số"
        onClick={() => prefixLines((i) => `${i + 1}. `)}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} title="Trích dẫn" onClick={() => prefixLines("> ")}>
        <Quote className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} title="Liên kết (Ctrl+K)" onClick={insertLink}>
        <Link2 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} title="Kẻ ngang" onClick={() => insert("\n\n---\n\n")}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className="mx-1 h-5 w-px bg-border" />

      <MediaPicker
        preset="generic"
        onPick={(m) => insert(figure(m))}
        trigger={
          <Button type="button" variant="outline" size="sm" title="Chèn 1 ảnh">
            <ImageIcon className="mr-1 h-4 w-4" /> Ảnh
          </Button>
        }
      />
      <MediaPicker
        preset="generic"
        multiple
        onPick={(m) => insert(figure(m))}
        onPickMany={(items) => insert(items.map((m) => figure(m)).join(""))}
        trigger={
          <Button type="button" variant="outline" size="sm" title="Chèn nhiều ảnh">
            <Images className="mr-1 h-4 w-4" /> Nhiều ảnh
          </Button>
        }
      />
      <MediaPicker
        preset="generic"
        multiple
        onPick={(m) => insert(figure(m))}
        onPickMany={(items) =>
          insert(
            `\n<div class="image-strip" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:1.5rem 0">\n` +
              items
                .map(
                  (m) =>
                    `  <img src="${m.url}" alt="${(m.alt_text || m.file_name || "Ảnh Kaizen").replace(/"/g, "'")}" loading="lazy" style="width:100%;height:auto;border-radius:12px" />`,
                )
                .join("\n") +
              `\n</div>\n`,
          )
        }
        trigger={
          <Button type="button" variant="outline" size="sm" title="Chèn dải ảnh ngang">
            <Images className="mr-1 h-4 w-4" /> Dải ảnh
          </Button>
        }
      />
      <EmbedVideoDialog onInsert={(html) => insert(html)} />
      <IconPicker onPick={(i) => insert(i + " ")} />
    </div>
  );
}
