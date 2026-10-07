/**
 * Chấm điểm SEO on-page cho nội dung bài viết đang soạn trong CMS.
 * Pure function — không gọi mạng, chạy trực tiếp trong trình soạn thảo.
 */
import { wordCount, extractFaq } from "@/lib/blog-seo";
import { parseOutline } from "@/lib/cms/outline";

export type AuditItem = {
  id: string;
  label: string;
  ok: boolean;
  severity: "error" | "warn" | "info";
  detail: string;
};

export type AuditResult = {
  score: number;
  items: AuditItem[];
  words: number;
};

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function hasKeyword(text: string, keyword: string) {
  if (!keyword.trim()) return false;
  return norm(text).includes(norm(keyword));
}

const FILENAME_ALT = /^[\w\-. ]+\.(jpe?g|png|webp|gif|avif)$/i;

export function auditContent(input: {
  body: string;
  title?: string;
  keyword?: string;
}): AuditResult {
  const body = input.body ?? "";
  const title = input.title ?? "";
  const keyword = (input.keyword ?? "").trim();
  const { sections } = parseOutline(body);
  const h1 = sections.filter((s) => s.level === 1);
  const h2 = sections.filter((s) => s.level === 2);
  const words = wordCount(body);
  const items: AuditItem[] = [];

  items.push({
    id: "h1",
    label: "Không dùng H1 trong nội dung",
    ok: h1.length === 0,
    severity: "error",
    detail:
      h1.length === 0
        ? "Đúng chuẩn — tiêu đề bài viết đã là H1 của trang."
        : `Có ${h1.length} thẻ H1 trong nội dung, sẽ tạo trùng H1. Hãy hạ xuống H2.`,
  });

  items.push({
    id: "h2-count",
    label: "Có ít nhất 3 mục H2",
    ok: h2.length >= 3,
    severity: "warn",
    detail: h2.length >= 3 ? `Đang có ${h2.length} mục H2.` : `Mới có ${h2.length} mục H2 — nên chia bài thành ≥ 3 phần.`,
  });

  // nhảy cấp: H2 -> H4, hoặc bắt đầu bằng H3
  let jump = false;
  let prev = 1;
  for (const s of sections) {
    if (s.level > prev + 1) jump = true;
    prev = s.level;
  }
  items.push({
    id: "h-order",
    label: "Không nhảy cấp tiêu đề",
    ok: !jump,
    severity: "warn",
    detail: jump ? "Có chỗ nhảy cấp (ví dụ H2 → H4). Hãy dùng liên tiếp H2 → H3." : "Thứ bậc tiêu đề hợp lệ.",
  });

  if (keyword) {
    items.push({
      id: "kw-title",
      label: "Từ khoá chính có trong tiêu đề",
      ok: hasKeyword(title, keyword),
      severity: "error",
      detail: hasKeyword(title, keyword) ? "Đạt." : `Tiêu đề chưa chứa "${keyword}".`,
    });
    items.push({
      id: "kw-h2",
      label: "Từ khoá xuất hiện ở ít nhất 1 mục H2",
      ok: h2.some((s) => hasKeyword(s.title, keyword)),
      severity: "warn",
      detail: h2.some((s) => hasKeyword(s.title, keyword))
        ? "Đạt."
        : "Nên đưa từ khoá (hoặc biến thể) vào một tiêu đề H2.",
    });
    const first100 = body.replace(/<[^>]+>/g, " ").split(/\s+/).slice(0, 100).join(" ");
    items.push({
      id: "kw-intro",
      label: "Từ khoá trong 100 từ đầu",
      ok: hasKeyword(first100, keyword),
      severity: "warn",
      detail: hasKeyword(first100, keyword) ? "Đạt." : "Nên nhắc từ khoá ngay đoạn mở đầu.",
    });
  } else {
    items.push({
      id: "kw-missing",
      label: "Đã khai báo từ khoá chính",
      ok: false,
      severity: "info",
      detail: "Nhập từ khoá chính ở ô bên dưới để chấm điểm đầy đủ.",
    });
  }

  items.push({
    id: "length",
    label: "Độ dài bài ≥ 800 từ",
    ok: words >= 800,
    severity: "warn",
    detail: `Đang có ${words} từ.` + (words >= 800 ? "" : " Bài mỏng thường khó lên top."),
  });

  // đoạn văn quá dài
  const longPara = body
    .split(/\n{2,}|<\/p>/i)
    .map((p) => p.replace(/<[^>]+>/g, " ").trim())
    .filter((p) => p.split(/\s+/).filter(Boolean).length > 160).length;
  items.push({
    id: "para",
    label: "Không có đoạn văn quá dài",
    ok: longPara === 0,
    severity: "info",
    detail: longPara === 0 ? "Đạt." : `${longPara} đoạn dài hơn 160 từ — nên tách nhỏ để dễ đọc.`,
  });

  // ảnh & alt
  const imgs: string[] = [];
  const mdImg = /!\[([^\]]*)\]\(([^)\s]+)/g;
  let m: RegExpExecArray | null;
  while ((m = mdImg.exec(body))) imgs.push(m[1]);
  const htmlImg = /<img[^>]*>/gi;
  while ((m = htmlImg.exec(body))) {
    const alt = /alt\s*=\s*"([^"]*)"/i.exec(m[0]);
    imgs.push(alt?.[1] ?? "");
  }
  const badAlt = imgs.filter((a) => !a.trim() || FILENAME_ALT.test(a.trim())).length;
  items.push({
    id: "img-alt",
    label: "Mọi ảnh có alt mô tả",
    ok: imgs.length > 0 && badAlt === 0,
    severity: imgs.length === 0 ? "warn" : "error",
    detail:
      imgs.length === 0
        ? "Bài chưa có ảnh minh hoạ nào."
        : badAlt === 0
          ? `${imgs.length} ảnh đều có alt mô tả.`
          : `${badAlt}/${imgs.length} ảnh thiếu alt hoặc alt chỉ là tên file.`,
  });

  // liên kết nội bộ
  const internal =
    (body.match(/\]\((\/[^)\s]*)\)/g) ?? []).length +
    (body.match(/href\s*=\s*"\/[^"]*"/gi) ?? []).length +
    (body.match(/kaizenmanpower\.com/gi) ?? []).length;
  items.push({
    id: "internal-links",
    label: "Có ≥ 2 liên kết nội bộ",
    ok: internal >= 2,
    severity: "warn",
    detail: internal >= 2 ? `Đang có ${internal} liên kết nội bộ.` : `Mới có ${internal} liên kết nội bộ.`,
  });

  const faq = extractFaq(body);
  const hasFaqHeading = /(^|\n)\s*#{2,3}\s*.*(faq|hỏi\s*[-–—]?\s*đáp|câu hỏi thường gặp)/i.test(body) ||
    /<h[23][^>]*>[^<]*(faq|hỏi\s*[-–—]?\s*đáp|câu hỏi thường gặp)/i.test(body);
  items.push({
    id: "faq",
    label: "Có phần Hỏi – Đáp (FAQ)",
    ok: faq.length > 0 || hasFaqHeading,
    severity: "warn",
    detail: faq.length > 0 || hasFaqHeading ? "Đạt — hỗ trợ rich result & tìm kiếm AI." : "Thêm mục FAQ 3–5 câu để tăng cơ hội hiển thị nổi bật.",
  });

  const hasCta = /(đăng ký|liên hệ|tư vấn miễn phí|hotline|nhận tư vấn)/i.test(body);
  items.push({
    id: "cta",
    label: "Có đoạn kết + CTA",
    ok: hasCta,
    severity: "info",
    detail: hasCta ? "Đạt." : "Nên kết bài bằng lời kêu gọi đăng ký tư vấn.",
  });

  const weight = (s: AuditItem["severity"]) => (s === "error" ? 3 : s === "warn" ? 2 : 1);
  const total = items.reduce((a, i) => a + weight(i.severity), 0);
  const got = items.reduce((a, i) => a + (i.ok ? weight(i.severity) : 0), 0);
  return { score: total ? Math.round((got / total) * 100) : 0, items, words };
}
