/**
 * Blog SEO helpers: normalize headings, extract TOC, FAQ, reading time,
 * and detect if content is Markdown or HTML.
 */

const SITE_URL = "https://kaizenmanpower.com";

export function isMarkdown(content: string): boolean {
  if (!content) return false;
  // Chỉ coi là HTML khi thực sự có block tag HTML. Mọi nội dung còn lại
  // (kể cả text thuần dán từ Facebook/Zalo) đều render bằng Markdown để
  // giữ **in đậm**, xuống dòng, list… thay vì đổ ra 1 khối chữ.
  const hasHtmlBlock = /<(p|h[1-6]|div|section|article|ul|ol|table|figure)[\s>]/i.test(content);
  return !hasHtmlBlock;
}


/**
 * Convert a heading text to a URL-friendly slug (Vietnamese-safe).
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

/**
 * Extract a table of contents (H2/H3) from Markdown or HTML content.
 * H1s in the body are ignored (the page H1 is the post title).
 */
export function extractToc(content: string): TocItem[] {
  if (!content) return [];
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  const pushHeading = (level: number, text: string) => {
    if (level < 2 || level > 3) return;
    const clean = text.replace(/[*_`]/g, "").trim();
    if (!clean) return;
    let id = slugify(clean);
    if (!id) return;
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n > 0) id = `${id}-${n + 1}`;
    items.push({ id, text: clean, level: level as 2 | 3 });
  };

  if (isMarkdown(content)) {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const m = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (m) pushHeading(m[1].length, m[2]);
    }
  } else {
    const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      const text = m[2].replace(/<[^>]+>/g, "");
      pushHeading(Number(m[1]), text);
    }
  }
  return items;
}

/**
 * Extract FAQ pairs from the classic "**Hỏi:** ... **Đáp:** ..." Markdown pattern.
 * Also picks up "Q:" / "A:" (english) and heading-based FAQ blocks.
 */
export function extractFaq(content: string): { question: string; answer: string }[] {
  if (!content) return [];
  const faq: { question: string; answer: string }[] = [];
  const re =
    /\*\*(?:Hỏi|Câu hỏi|Q|Question)\s*:?\*\*\s*([^\n]+)[\s\S]*?\*\*(?:Đáp|Trả lời|A|Answer)\s*:?\*\*\s*([\s\S]*?)(?=\n\s*\*\*(?:Hỏi|Câu hỏi|Q|Question)\s*:?\*\*|\n\s*#{1,6}\s|\n\s*---|\n\s*$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const q = m[1].replace(/[*_`]/g, "").trim();
    const a = m[2].replace(/[*_`]/g, "").trim().split(/\n{2,}/)[0].trim();
    if (q && a) faq.push({ question: q, answer: a });
  }
  return faq;
}

export function readingTimeMinutes(content: string): number {
  if (!content) return 1;
  const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  // Vietnamese reading speed ~ 220 wpm
  return Math.max(1, Math.round(words / 220));
}

export function wordCount(content: string): number {
  if (!content) return 0;
  return content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Demote any H1 in raw markdown/HTML to H2 so the page only has one H1 (the post title).
 */
export function demoteH1(content: string): string {
  if (!content) return "";
  let out = content;
  // Markdown H1: "# Title" -> "## Title" (but not "##")
  out = out.replace(/^\s{0,3}#\s+(.+)$/gm, "## $1");
  // HTML H1
  out = out.replace(/<h1(\s[^>]*)?>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");
  return out;
}

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export { SITE_URL };
