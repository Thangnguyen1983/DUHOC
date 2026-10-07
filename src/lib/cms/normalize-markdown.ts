/**
 * Auto-normalize markdown lưu trong CMS Kaizen.
 *
 * Nhiều bài cũ được dán từ Word/Zalo dưới dạng 1 khối text với emoji
 * ✅ 🎯 làm bullet, xuống dòng thủ công, không có `##` heading và không
 * có `\n\n` giữa các đoạn. Renderer markdown biến cả bài thành 1 `<p>`
 * khổng lồ → mất H2/H3/list, SEO/UX rất tệ trên mobile.
 *
 * Bộ này là pure function, idempotent. Chỉ chạy khi `looksUnnormalized`
 * trả `true` để tránh phá bài đã sạch.
 */

import { demoteH1 } from "@/lib/blog-seo";

// Emoji hay dùng làm bullet checkmark (sẽ bị strip khi convert list).
const BULLET_EMOJI = ["✅", "✔", "✔️", "☑", "☑️", "▶", "▶️", "👉", "•", "◦", "🔹", "🔸"];
// Emoji content/meta (giữ lại làm nhãn khi convert list hoặc CTA).
const CONTENT_EMOJI = ["🎯", "🔥", "📌", "⭐", "🌟", "💡", "📞", "📩", "📧", "📱", "🏆", "🎓", "🌍", "🗓", "🗓️", "📅", "📍", "🇻🇳", "🇯🇵", "🇰🇷", "🇩🇪", "🇹🇼"];
// Emoji nhóm meta thường đứng đầu dòng ngắn (thời gian/địa điểm/liên hệ).
const META_EMOJI = ["🗓", "🗓️", "📅", "📍", "🎯", "🌍", "🔥", "📌", "⭐", "🌟", "💡", "📞", "📱", "📩", "📧", "🏆", "🎓"];
// Ký hiệu/emoji trang trí mở đầu đoạn, không phải bullet cần strip.
const DECORATIVE_LINE_MARKERS = ["✦", "✧", "✩", "✪", "✨", "💙", "💚", "💛", "💜", "❤️", "❤", "🩵"];

const HEADING_PATTERNS: { re: RegExp; level: 2 | 3 }[] = [
  { re: /^(KHAI GIẢNG[^.\n]{0,80})$/i, level: 2 },
  { re: /^(LỊCH (?:HỌC|KHAI GIẢNG)[^.\n]{0,60})$/i, level: 2 },
  { re: /^(HỌC PHÍ[^.\n]{0,60})$/i, level: 2 },
  { re: /^(CHƯƠNG TRÌNH[^.\n]{0,60})$/i, level: 2 },
  { re: /^(NỘI DUNG[^.\n]{0,60})$/i, level: 2 },
  { re: /^(ƯU ĐÃI[^.\n]{0,60})$/i, level: 2 },
  { re: /^(ĐIỀU KIỆN[^.\n]{0,60})$/i, level: 2 },
  { re: /^(QUYỀN LỢI[^.\n]{0,60})$/i, level: 2 },
  { re: /^(LỘ TRÌNH[^.\n]{0,60})$/i, level: 2 },
  { re: /^(THÔNG TIN (?:CHUNG|LIÊN HỆ|CHI TIẾT)[^.\n]{0,60})$/i, level: 2 },
  { re: /^(ĐĂNG KÝ (?:NGAY|TƯ VẤN)[^.\n]{0,60})$/i, level: 2 },
  { re: /^(LIÊN HỆ[^.\n]{0,60})$/i, level: 2 },
  { re: /^(Bước\s*\d+\s*[:\-–.].{0,80})$/, level: 3 },
];

function isBulletEmoji(ch: string): boolean {
  return BULLET_EMOJI.includes(ch);
}

function isContentEmoji(ch: string): boolean {
  return CONTENT_EMOJI.includes(ch);
}

function isMetaEmoji(ch: string): boolean {
  return META_EMOJI.includes(ch);
}

/** Regex phát hiện "điểm chèn bullet": khoảng trắng + emoji + khoảng trắng. */
const BULLET_SPLIT_RE = new RegExp(
  `\\s+(${[...BULLET_EMOJI, ...CONTENT_EMOJI].map(escapeRe).join("|")})\\s+`,
  "gu",
);

/** Regex match dòng bắt đầu bằng bullet-emoji: `✅ text`. */
const LINE_BULLET_RE = new RegExp(
  `^(${BULLET_EMOJI.map(escapeRe).join("|")})\\s+(.+)$`,
);

/** Regex match dòng bắt đầu bằng meta-emoji: `🗓 text` hoặc `📞 text`. */
const LINE_META_RE = new RegExp(
  `^(${META_EMOJI.map(escapeRe).join("|")})\\s+(.+)$`,
);

/** Regex match dòng mở đầu bằng ký hiệu trang trí: `✦ text`, `💙 text`. */
const DECORATIVE_LINE_RE = new RegExp(
  `^(${DECORATIVE_LINE_MARKERS.map(escapeRe).join("|")})\\s+(.+)$`,
  "u",
);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Bỏ emoji/ký hiệu trang trí ở đầu dòng để xét nội dung chữ. */
function stripLeadingSymbols(text: string): string {
  return text
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .trim();
}

/** Dòng "tiêu đề ngầm": VIẾT HOA (có/không emoji đầu dòng), không dấu câu cuối. */
export function isImpliedHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^#{1,6}\s+/.test(t)) return false;
  if (/^<|^https?:/i.test(t)) return false;
  if (/^(?:[-*+]|\d+\.)\s+/.test(t)) return false;
  const body = stripLeadingSymbols(t);
  if (body.length < 6 || body.length > 90) return false;
  if (/[.!?…:]$/.test(body)) return false;
  if (body !== body.toUpperCase()) return false;
  return /[A-ZÀ-Ỹ]/.test(body);
}

/** Có mẫu "dòng kết thúc bằng :" + ≥2 dòng ngắn liền sau chưa phải list. */
function hasImpliedListPattern(lines: string[]): boolean {
  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if (!/:$/.test(t) || t.length > 120) continue;
    let count = 0;
    for (let j = i + 1; j < lines.length; j += 1) {
      const n = lines[j].trim();
      if (!n) {
        if (count > 0) break;
        continue;
      }
      if (/^#{1,6}\s+|^<|^(?:[-*+]|\d+\.)\s+/.test(n)) break;
      if (n.length > 160 || isImpliedHeadingLine(n)) break;
      count += 1;
      if (count >= 2) return true;
    }
  }
  return false;
}

/** Heuristic: bài đang ở dạng "chưa chuẩn". */
export function looksUnnormalized(raw: string): boolean {
  const lastImageTagStart = raw.toLowerCase().lastIndexOf("<img");
  const hasDanglingImageTag = lastImageTagStart >= 0 && raw.indexOf(">", lastImageTagStart) === -1;
  const hasMultilineImageTag = /<img\b[\s\S]*?\n[\s\S]*?>/i.test(raw);
  if (hasMultilineImageTag || hasDanglingImageTag) return true;
  if (!raw || raw.length < 120) return false;

  const lines = raw.split(/\n/);
  const headingCount = (raw.match(/^\s{0,3}#{1,6}\s+/gm) || []).length
    + (raw.match(/<h[1-6][\s>]/gi) || []).length;
  const hasMdList = lines.some((l) => /^\s*(?:[-*+]|\d+\.)\s+/.test(l));

  // Đếm dòng bắt đầu bằng bullet-emoji (✅ …).
  const emojiBulletLines = lines.filter((l) => LINE_BULLET_RE.test(l.trim())).length;
  // Đếm dòng bắt đầu bằng meta-emoji (🗓 / 📞 / 📍 …).
  const metaLines = lines.filter((l) => LINE_META_RE.test(l.trim())).length;
  const decorativeLines = lines.filter((l) => DECORATIVE_LINE_RE.test(l.trim())).length;
  const hasParagraphListCollision = lines.some((line, i) => {
    const current = line.trim();
    const previous = lines[i - 1]?.trim() ?? "";
    if (!/^(?:[-*+]|\d+\.)\s+/.test(current)) return false;
    return Boolean(previous) && !/^(?:(?:[-*+]|\d+\.)\s+|#{1,6}\s+|>\s+)/.test(previous);
  });

  // Dấu hiệu 0: có "tiêu đề ngầm" (dòng VIẾT HOA / emoji + VIẾT HOA) nhưng
  // chưa có heading markdown nào → bài dán từ Facebook/Word.
  const impliedHeadings = lines.filter((l) => isImpliedHeadingLine(l.trim())).length;
  if (impliedHeadings >= 2 && headingCount < impliedHeadings) return true;
  // Dấu hiệu 0b: có dòng "…:" theo sau bởi ≥2 dòng ngắn chưa phải list.
  if (!hasMdList && hasImpliedListPattern(lines)) return true;

  // Dấu hiệu 1: nhiều ✅ dòng mà chưa có list markdown.
  if (emojiBulletLines >= 3 && !hasMdList) return true;
  // Dấu hiệu 2: nhiều dòng meta emoji + thiếu heading.
  if (metaLines >= 2 && headingCount < 2) return true;
  // Dấu hiệu 2b: đoạn trang trí/list đang dính block hoặc thẻ ảnh HTML bị bẻ dòng.
  if (hasMdList && decorativeLines >= 1 && (headingCount < 1 || hasParagraphListCollision)) return true;

  const bulletHits = [...BULLET_EMOJI, ...CONTENT_EMOJI].reduce(
    (n, e) => n + (raw.split(e).length - 1),
    0,
  );
  const paragraphBreaks = (raw.match(/\n\s*\n/g) || []).length;
  // Dấu hiệu 3 (cũ): nhiều emoji bullet + ít heading + ít paragraph break.
  if (bulletHits >= 3 && headingCount < 2 && paragraphBreaks < 3) return true;
  // Dấu hiệu 4: 1 dòng cực dài > 400 ký tự.
  if (lines.some((l) => l.length > 400)) return true;
  return false;
}

/** Tách 1 đoạn dài có nhiều emoji-bullet inline thành nhiều bullet dòng riêng. */
function splitInlineBullets(paragraph: string): string {
  if (/^\s*(?:[-*+]|\d+\.)\s+/.test(paragraph)) return paragraph;
  if (!BULLET_SPLIT_RE.test(paragraph)) return paragraph;
  BULLET_SPLIT_RE.lastIndex = 0;

  const parts: string[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  const emojis: string[] = [];
  while ((m = BULLET_SPLIT_RE.exec(paragraph))) {
    parts.push(paragraph.slice(lastIdx, m.index));
    emojis.push(m[1]);
    lastIdx = m.index + m[0].length;
  }
  parts.push(paragraph.slice(lastIdx));

  const head = parts[0].trim();
  const bullets = parts.slice(1).map((body, i) => {
    const emoji = emojis[i];
    const clean = body.trim().replace(/[.!?;,]+$/, "");
    if (!clean) return "";
    if (isBulletEmoji(emoji)) return `- ${clean}`;
    if (isContentEmoji(emoji)) return `- ${emoji} ${clean}`;
    return `- ${clean}`;
  }).filter(Boolean);

  if (bullets.length < 2) return paragraph;
  return [head, "", bullets.join("\n")].filter(Boolean).join("\n");
}

/**
 * Nếu block gồm nhiều dòng và ≥2 dòng bắt đầu bằng bullet-emoji (✅ …),
 * chuyển tất cả các dòng đó thành `- …` (giữ dòng khác nguyên).
 * Tương tự cho meta-emoji (🗓 📍 …) → `- 🗓 …` (giữ emoji làm nhãn).
 */
function promoteEmojiBulletLines(block: string): string {
  const lines = block.split(/\n/);
  if (lines.length < 2) return block;

  const bulletHits = lines.filter((l) => LINE_BULLET_RE.test(l.trim())).length;
  const metaHits = lines.filter((l) => LINE_META_RE.test(l.trim())).length;
  if (bulletHits < 2 && metaHits < 2) return block;

  const out: string[] = [];
  let inList = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      out.push("");
      inList = false;
      continue;
    }
    // Nếu đã là list markdown, giữ nguyên.
    if (/^(?:[-*+]|\d+\.)\s+/.test(t)) {
      out.push(t);
      inList = true;
      continue;
    }
    // Nếu là heading, giữ nguyên (kết thúc list).
    if (/^#{1,6}\s+/.test(t)) {
      if (inList) out.push("");
      out.push(t);
      inList = false;
      continue;
    }
    const bm = t.match(LINE_BULLET_RE);
    if (bm && bulletHits >= 2) {
      const body = bm[2].trim().replace(/[.;]+$/, "");
      out.push(`- ${body}`);
      inList = true;
      continue;
    }
    const mm = t.match(LINE_META_RE);
    if (mm && metaHits >= 2) {
      const body = mm[2].trim();
      out.push(`- ${mm[1]} ${body}`);
      inList = true;
      continue;
    }
    // Dòng thường: nếu đang trong list, cần ngắt dòng trống trước.
    if (inList) out.push("");
    out.push(t);
    inList = false;
  }

  // Dedupe blank liên tiếp.
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Nối lại thẻ ảnh HTML bị CMS/textarea bẻ dòng giữa URL hoặc attributes. */
function repairMultilineImageTags(text: string): string {
  const repaired = text.replace(/<img\b[\s\S]*?>/gi, (tag) => {
    const repairedAttrs = tag
      .replace(/\b(src|href)=(["'])([\s\S]*?)\2/gi, (_m, attr: string, quote: string, value: string) => {
        return `${attr}=${quote}${value.replace(/\s+/g, "")}${quote}`;
      })
      .replace(/\b(alt|title)=(["'])([\s\S]*?)\2/gi, (_m, attr: string, quote: string, value: string) => {
        return `${attr}=${quote}${value.replace(/\s+/g, " ").trim()}${quote}`;
      });

    return repairedAttrs.replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  });

  // Nếu thẻ `<img` đã bị cắt mất phần cuối khi lưu CMS, bỏ phần hỏng để
  // không hiển thị token/URL thành chữ trong bài viết.
  const lastImageTagStart = repaired.toLowerCase().lastIndexOf("<img");
  if (lastImageTagStart >= 0 && repaired.indexOf(">", lastImageTagStart) === -1) {
    return repaired.slice(0, lastImageTagStart).trim();
  }

  return repaired;
}

type MarkdownLineKind = "blank" | "heading" | "list" | "blockquote" | "html" | "paragraph";

function markdownLineKind(line: string): MarkdownLineKind {
  const t = line.trim();
  if (!t) return "blank";
  if (/^#{1,6}\s+/.test(t)) return "heading";
  if (/^(?:[-*+]|\d+\.)\s+/.test(t)) return "list";
  if (/^>\s+/.test(t)) return "blockquote";
  if (/^<(?:img|figure|iframe|table|h[1-6]|ul|ol|p|div|blockquote|hr)\b/i.test(t)) return "html";
  return "paragraph";
}

function needsBlankBetween(prevKind: MarkdownLineKind, nextKind: MarkdownLineKind): boolean {
  if (prevKind === "blank" || nextKind === "blank") return false;
  if (prevKind === nextKind) return false;
  if ((prevKind as MarkdownLineKind) === "heading") return false;
  if (nextKind === "list" && prevKind === "paragraph") return true;
  if (nextKind === "paragraph" && prevKind === "list") return true;
  if (nextKind === "html" && (prevKind === "paragraph" || prevKind === "list")) return true;
  if (nextKind === "paragraph" && prevKind === "html") return true;
  if (nextKind === "blockquote" && prevKind !== "heading") return true;
  return false;
}

/** Tách rõ paragraph/list/html để ReactMarkdown không gộp thành một `<p>`. */
function enforceMarkdownBlockSpacing(block: string): string {
  const lines = block.split(/\n/);
  if (lines.length < 2) return block;

  const out: string[] = [];
  let prevKind: MarkdownLineKind = "blank";
  for (const line of lines) {
    const kind = markdownLineKind(line);
    if (needsBlankBetween(prevKind, kind) && out[out.length - 1] !== "") {
      out.push("");
    }
    out.push(line);
    prevKind = kind;
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Phát hiện dòng viết hoa → biến thành H2 (nếu chưa là heading). */
function promoteImpliedHeading(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return line;
  if (/^#{1,6}\s+/.test(trimmed)) return line;
  if (/^<h[1-6][\s>]/i.test(trimmed)) return line;

  // Chỉ dùng HEADING_PATTERNS cho dòng thực sự giống tiêu đề: ngắn, không
  // phải một câu (không dấu phẩy, không kết bằng dấu câu).
  const looksLikeTitle =
    trimmed.length <= 70 && !/[,;]/.test(trimmed) && !/[.!?…]$/.test(trimmed);
  if (looksLikeTitle) {
    for (const { re, level } of HEADING_PATTERNS) {
      if (re.test(trimmed)) {
        return `${"#".repeat(level)} ${trimmed.replace(/[:：]$/, "")}`;
      }
    }
  }

  // Dòng có emoji đầu + phần chữ VIẾT HOA → H2 (dạng bài dán từ Facebook).
  if (isImpliedHeadingLine(trimmed)) {
    return `## ${trimmed}`;
  }

  // Câu hỏi tiêu đề: "Vì sao …?", "Học tiếng Đức ở đâu?" — ngắn, có ?
  if (
    trimmed.length <= 80 &&
    trimmed.length >= 8 &&
    /\?$/.test(trimmed) &&
    !/[.!…]/.test(trimmed.slice(0, -1)) &&
    /^[A-ZÀ-ỸĐ]/.test(trimmed)
  ) {
    return `### ${trimmed}`;
  }

  // Dòng ngắn (≤80), TOÀN VIẾT HOA (có dấu tiếng Việt), không kết thúc bằng dấu câu.
  if (
    trimmed.length <= 80 &&
    trimmed.length >= 6 &&
    !/[.!?…]$/.test(trimmed) &&
    trimmed === trimmed.toUpperCase() &&
    /[A-ZÀ-Ỹ]/.test(trimmed) &&
    !/^https?:/i.test(trimmed)
  ) {
    return `## ${trimmed}`;
  }
  return line;
}

/** Tách paragraph dài (nhiều câu) thành từng cụm 2-3 câu cách nhau bằng \n\n. */
function breakLongParagraph(paragraph: string): string {
  if (paragraph.length < 300) return paragraph;
  // Không tách đoạn chứa link/ảnh Markdown: dấu chấm trong URL (…​.webp?token=…)
  // sẽ bị coi là kết câu và làm gãy đường dẫn ảnh.
  if (/!\[|\]\(|https?:\/\//i.test(paragraph)) return paragraph;
  if (/^\s*(?:[-*+#>]|\d+\.)\s+/.test(paragraph)) return paragraph;
  const sentences = paragraph.match(/[^.!?…]+[.!?…]+["')\]]*\s*/g);
  if (!sentences || sentences.length < 4) return paragraph;
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    chunks.push(sentences.slice(i, i + 3).join("").trim());
  }
  return chunks.filter(Boolean).join("\n\n");
}

/** Wrap dòng CTA đứng riêng thành blockquote highlight. */
function highlightCtaLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return line;
  if (/^>/.test(trimmed)) return line;
  if (/^-\s+/.test(trimmed)) return line; // đã là list, không wrap
  // Prefix chữ: Hotline / Zalo / Điện thoại / Đăng ký ngay
  if (/^(?:Hotline|Zalo|Điện thoại|Đăng ký ngay)\s*[:\-–]/i.test(trimmed)) {
    return `> **📞 ${trimmed}**`;
  }
  // Prefix emoji liên hệ: 📞 Hotline: …, 📱 Zalo: …, 📩/📧 Email: …
  if (/^(?:📞|📱)\s*(?:Hotline|Zalo|Điện thoại|Số điện thoại|SĐT)?\s*[:\-–]?\s*[+\d(]/i.test(trimmed)) {
    return `> **${trimmed}**`;
  }
  if (/^(?:📩|📧)\s*(?:Email|E-?mail)?\s*[:\-–]?\s*\S+@\S+/i.test(trimmed)) {
    return `> **${trimmed}**`;
  }
  return line;
}

/** Chuẩn hoá FAQ markers "Hỏi:" / "Đáp:" thành `**Hỏi:**` / `**Đáp:**`. */
function normalizeFaqMarkers(text: string): string {
  return text
    .replace(/^\s*(Hỏi|Câu hỏi|Q)\s*[:：]\s*/gim, "**Hỏi:** ")
    .replace(/^\s*(Đáp|Trả lời|A)\s*[:：]\s*/gim, "**Đáp:** ");
}

/** Pipeline chính. Idempotent — chạy 2 lần cho ra cùng kết quả. */
export function normalizeMarkdown(raw: string): string {
  if (!raw) return "";

  // 1. Chuẩn Unicode + line-endings.
  let text = raw.normalize("NFC").replace(/\r\n?/g, "\n");

  // 1b. Sửa thẻ ảnh HTML bị xuống dòng giữa URL/attributes trước khi tách block.
  text = repairMultilineImageTags(text);

  // 2. Demote H1 → H2 (trang chỉ 1 H1 là title).
  text = demoteH1(text);

  // 3. FAQ markers.
  text = normalizeFaqMarkers(text);

  // 4. Xử lý từng "block" (chia bằng blank line).
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const processed = blocks.map((block) => {
    // 4a. Convert dòng ✅/emoji-meta thành list `- …` (block-level).
    let out = promoteEmojiBulletLines(block);

    // 4b. Xử lý từng dòng: heading + CTA highlight.
    const lines = out.split(/\n/).map((l) => {
      let x = promoteImpliedHeading(l);
      x = highlightCtaLine(x);
      return x;
    });
    out = lines.join("\n");

    // 4b2. Tách paragraph/list/html rõ ràng để renderer giữ cấu trúc.
    out = enforceMarkdownBlockSpacing(out);

    // 4c. Nếu là 1 dòng dài chứa emoji bullet inline → tách list.
    if (!/\n/.test(out)) {
      out = splitInlineBullets(out);
    }

    // 4d. Nếu vẫn là 1 paragraph rất dài → tách 2-3 câu / đoạn.
    if (!/\n/.test(out)) {
      out = breakLongParagraph(out);
    }
    return out;
  });

  // 5. Ghép lại + dedupe blank line.
  let final = processed.join("\n\n");
  // 5b. Chuyển các dòng ngắn liệt kê sau "…:" thành bullet list.
  final = promoteImpliedLists(final);
  final = final.replace(/\n{3,}/g, "\n\n").trim();
  return final;
}

/**
 * Sau một dòng kết thúc bằng ":", các dòng ngắn liền kề (chưa phải list,
 * không phải heading/HTML) được chuyển thành `- …`.
 */
function promoteImpliedLists(text: string): string {
  const lines = text.split(/\n/);
  const out: string[] = [];
  let collecting = false;
  let items = 0;

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (items > 0) {
        collecting = false;
        items = 0;
      }
      out.push("");
      continue;
    }
    const isBlockish = /^#{1,6}\s+|^<|^>|^(?:[-*+]|\d+\.)\s+/.test(t);
    if (collecting && !isBlockish && t.length <= 160 && !isImpliedHeadingLine(t)) {
      if (items === 0 && out[out.length - 1] !== "") out.push("");
      out.push(`- ${t.replace(/[.;]+$/, "")}`);
      items += 1;
      continue;
    }
    if (items > 0) {
      collecting = false;
      items = 0;
      if (out[out.length - 1] !== "") out.push("");
    }
    out.push(line);
    collecting = !isBlockish && /:$/.test(t) && t.length <= 120;
  }

  return out.join("\n");
}
