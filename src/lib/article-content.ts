/**
 * Chuẩn bị nội dung bài viết trước khi render:
 * - làm sạch HTML thuần (nếu có)
 * - gom các <figure> đứng liền nhau thành lưới ảnh
 */
import DOMPurify from "isomorphic-dompurify";

export const ARTICLE_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "blockquote", "code", "pre",
    "h2", "h3", "h4", "h5", "ul", "ol", "li",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
    "iframe", "div", "span", "hr",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel", "src", "alt", "title", "width", "height",
    "class", "style", "loading", "decoding", "id",
    "allow", "allowfullscreen", "frameborder", "referrerpolicy",
  ],
  ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:|\/|#)/i,
  ADD_ATTR: ["target"],
};

/** Gom 2+ thẻ <figure> liền kề thành một lưới ảnh. */
export function groupAdjacentFigures(html: string): string {
  if (!html) return html;
  return html.replace(/(?:<figure\b[\s\S]*?<\/figure>\s*){2,}/gi, (block) =>
    `\n\n<div class="figure-grid">\n${block.trim()}\n</div>\n\n`,
  );
}

/**
 * Trả về chuỗi sẵn sàng đưa vào ReactMarkdown (kèm rehypeRaw).
 * Nội dung HTML thuần được sanitize trước; Markdown giữ nguyên.
 */
export function prepareArticleBody(raw: string, isMd: boolean): string {
  if (!raw) return "";
  const safe = isMd ? raw : DOMPurify.sanitize(raw, ARTICLE_SANITIZE_CONFIG);
  return groupAdjacentFigures(safe);
}

/** Chú thích dạng tên file (z8199...webp, IMG_1234.jpg) thì không hiển thị. */
export function isFileNameCaption(text?: string): boolean {
  if (!text) return true;
  const t = text.trim();
  if (!t) return true;
  if (/\.(jpe?g|png|webp|gif|avif|bmp|heic)$/i.test(t)) return true;
  if (/^(img|image|photo|dsc|screenshot|z\d)[\w\-.]*$/i.test(t)) return true;
  if (!/\s/.test(t) && /[_\-]\w{6,}/.test(t)) return true;
  return false;
}
