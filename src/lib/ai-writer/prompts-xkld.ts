/**
 * Prompt library chuyên biệt để VIẾT LẠI 150 bài seed XKLĐ.
 *
 * Khác với pipeline 5-bước ở `prompts.ts`, đây là 1-shot prompt tối ưu credit:
 * đầu vào là {title, market, intent} → đầu ra là JSON gồm bodyMarkdown, excerpt, FAQ, seo.
 *
 * Yêu cầu:
 * - Không H1 trong body (H1 = title, render bên ngoài).
 * - Cấm bịa số cụ thể — dùng khoảng ("khoảng 2.500-3.200 EUR/tháng").
 * - Bắt buộc có disclaimer, internal link, CTA.
 */

import { KAIZEN_BRAND_CONTEXT } from "./prompts";

export type XkldIntent = "huong-dan" | "tin-tuc" | "kinh-nghiem" | "chi-phi" | "nganh-nghe";

/**
 * Nhận diện intent từ slug pattern `sample-{market}-{intent}-{n}`.
 * Market có thể nhiều hyphen (nhat-ban, dai-loan, ba-lan, han-quoc) nên
 * dò intent bằng regex trực tiếp thay vì split by index.
 */
export function detectIntent(slug: string): XkldIntent {
  if (/\bhuong-dan\b/.test(slug)) return "huong-dan";
  if (/\btin-tuc\b/.test(slug)) return "tin-tuc";
  if (/\bkinh-nghiem\b/.test(slug)) return "kinh-nghiem";
  if (/\bchi-phi\b/.test(slug)) return "chi-phi";
  if (/\bnganh-nghe\b/.test(slug)) return "nganh-nghe";
  return "huong-dan";
}

/** Bối cảnh thị trường: tên đẹp + slug landing + đặc điểm ngành nghề. */
export const MARKET_CONTEXT: Record<
  string,
  { name: string; landing: string; salary: string; industries: string; visa: string; entry: string }
> = {
  "nhat-ban": {
    name: "Nhật Bản",
    landing: "/xkld/nhat-ban",
    salary: "khoảng 30-45 triệu VND/tháng (chưa trừ chi phí sinh hoạt)",
    industries: "cơ khí, chế biến thực phẩm, xây dựng, điều dưỡng, nông nghiệp",
    visa: "visa Tokutei Ginou (kỹ năng đặc định) hoặc Thực tập sinh kỹ năng",
    entry: "N4 tiếng Nhật + học tiếng 6-8 tháng tại Việt Nam",
  },
  "han-quoc": {
    name: "Hàn Quốc",
    landing: "/xkld/han-quoc",
    salary: "khoảng 35-45 triệu VND/tháng",
    industries: "sản xuất, xây dựng, nông nghiệp, ngư nghiệp, đóng tàu",
    visa: "visa E-9 (EPS) hoặc E-7 (chuyên môn)",
    entry: "TOPIK 2 trở lên + thi tuyển EPS",
  },
  "dai-loan": {
    name: "Đài Loan",
    landing: "/xkld/dai-loan",
    salary: "khoảng 22-28 triệu VND/tháng",
    industries: "điện tử, dệt may, cơ khí, giúp việc, hộ lý, thuyền viên",
    visa: "visa lao động thời hạn 3 năm, gia hạn tối đa 12 năm",
    entry: "sơ tuyển sức khoẻ + phỏng vấn chủ sử dụng, không bắt buộc tiếng Hoa đầu vào",
  },
  duc: {
    name: "CHLB Đức",
    landing: "/xkld/duc",
    salary: "khoảng 2.500-3.200 EUR/tháng gross tuỳ ngành và bang",
    industries: "điều dưỡng, nhà hàng khách sạn, cơ khí, IT, xây dựng, logistics",
    visa: "visa D theo Fachkräfteeinwanderungsgesetz (FEG) hoặc §16d/§18a",
    entry: "B1 tiếng Đức tối thiểu (B2 với điều dưỡng) + bằng nghề công nhận Anerkennung",
  },
  "ba-lan": {
    name: "Ba Lan",
    landing: "/xkld/ba-lan",
    salary: "khoảng 900-1.400 EUR/tháng",
    industries: "chế biến thực phẩm, xây dựng, kho vận, sản xuất công nghiệp",
    visa: "visa D lao động dựa trên Zezwolenie na pracę (type A) hoặc Oświadczenie",
    entry: "không yêu cầu tiếng, hồ sơ đơn giản, thời gian bay nhanh 2-4 tháng",
  },
  bulgaria: {
    name: "Bulgaria",
    landing: "/xkld/bulgaria",
    salary: "khoảng 900-1.300 EUR/tháng",
    industries: "sản xuất công nghiệp, chế biến, xây dựng, du lịch khách sạn",
    visa: "visa D loại lao động do Cơ quan Việc làm Bulgaria phê duyệt",
    entry: "khám sức khoẻ + apostille bằng cấp, không bắt buộc tiếng",
  },
  latvia: {
    name: "Latvia",
    landing: "/xkld/latvia",
    salary: "khoảng 900-1.200 EUR/tháng",
    industries: "chế biến gỗ, xây dựng, sản xuất, logistics",
    visa: "visa D lao động dài hạn OCMA cấp",
    entry: "hồ sơ đơn giản, thị trường EU tiếp cận nhanh",
  },
  romania: {
    name: "Romania",
    landing: "/xkld/romania",
    salary: "khoảng 900-1.400 EUR/tháng",
    industries: "xây dựng, may mặc, chế biến thịt, đóng gói, cơ khí",
    visa: "visa D lao động dài hạn (Long-stay D/AM)",
    entry: "không yêu cầu tiếng, chi phí thấp, tiếp cận EU dễ",
  },
  hungary: {
    name: "Hungary",
    landing: "/xkld/hungary",
    salary: "khoảng 1.000-1.500 EUR/tháng",
    industries: "sản xuất ô tô, điện tử, chế biến thực phẩm, logistics",
    visa: "visa D lao động dựa trên giấy phép lao động của MÁK",
    entry: "hồ sơ đơn giản, doanh nghiệp Việt tham gia nhiều",
  },
  slovakia: {
    name: "Slovakia",
    landing: "/xkld/slovakia",
    salary: "khoảng 1.000-1.500 EUR/tháng",
    industries: "sản xuất ô tô, cơ khí, điện tử, logistics",
    visa: "visa D lao động (Prechodný pobyt na účel zamestnania)",
    entry: "không yêu cầu tiếng, cụm nhà máy ô tô lớn (VW, KIA, PSA, JLR)",
  },
};

export function marketInfo(slug: string) {
  return MARKET_CONTEXT[slug] ?? {
    name: slug,
    landing: `/xkld/${slug}`,
    salary: "tuỳ ngành và hợp đồng cụ thể",
    industries: "sản xuất, xây dựng, dịch vụ",
    visa: "visa lao động dài hạn theo luật nước sở tại",
    entry: "hồ sơ theo yêu cầu chương trình",
  };
}

const INTENT_BRIEF: Record<XkldIntent, string> = {
  "huong-dan":
    "Hướng dẫn quy trình từng bước (checklist thực chiến). Cấu trúc: mở bài trả lời thẳng câu hỏi → 3-5 bước lớn → checklist giấy tờ → thời gian xử lý → lỗi thường gặp → FAQ.",
  "tin-tuc":
    "Bản tin cập nhật đơn hàng/chính sách/lịch tuyển. Cấu trúc: tóm tắt tin trong 3 câu → chi tiết chương trình → điều kiện ứng tuyển → hạn nộp và cách đăng ký → FAQ.",
  "kinh-nghiem":
    "Nhật ký / kinh nghiệm từ góc nhìn học viên đã đi. Cấu trúc: bối cảnh → 3-5 bài học thực tế có tình huống cụ thể → điều nên/không nên → gợi ý cho người chuẩn bị bay → FAQ. Dùng ngôi 'mình' hoặc trần thuật ngôi thứ ba, không xưng 'chúng tôi'.",
  "chi-phi":
    "Bảng chi phí minh bạch. Cấu trúc: tổng chi phí ước tính (dạng khoảng) → bảng chi tiết từng đầu mục → khoản có thể tối ưu → cách trả góp/vay tín chấp → so sánh với thị trường tương đương → FAQ.",
  "nganh-nghe":
    "Phân tích ngành nghề tiếp nhận. Cấu trúc: ngành đang thiếu nhân lực → mô tả công việc + môi trường → yêu cầu tay nghề/sức khoẻ → mức lương và phúc lợi → lộ trình thăng tiến → FAQ.",
};

/**
 * System + user prompt hợp nhất cho 1-shot rewrite.
 * Trả JSON theo schema đã khai báo phía server.
 */
export function buildRewritePrompt(args: {
  title: string;
  slug: string;
  market: string;
  intent: XkldIntent;
  targetWords: number;
}) {
  const info = marketInfo(args.market);
  const intentBrief = INTENT_BRIEF[args.intent];

  const system = `Bạn là biên tập viên SEO cao cấp chuyên viết bài về xuất khẩu lao động và di trú lao động cho thị trường Việt Nam.
${KAIZEN_BRAND_CONTEXT}

QUY TẮC BẮT BUỘC — vi phạm sẽ bị reject:
1. Tiếng Việt có dấu đầy đủ. Câu ngắn, chuyên gia thật, không "trong bối cảnh...", "đáng chú ý là...", "tóm lại...".
2. KHÔNG viết H1 (không có dòng "# ...") — H1 đã là title bên ngoài. Chỉ dùng ## và ### trong body.
3. Cấm bịa số cụ thể. Khi nêu lương/chi phí/thời gian, luôn dùng "khoảng X-Y" hoặc "tham khảo, tuỳ hợp đồng".
4. Bắt buộc chèn ít nhất 1 markdown link nội bộ tới ${info.landing} (anchor có nghĩa, không "click tại đây").
5. Cuối bài phải có block CTA blockquote dạng "> **Đăng ký tư vấn miễn phí** — [Nhận tư vấn 1-1 với Kaizen](/dang-ky?src=xkld-${args.market})".
6. Ngay sau đoạn mở bài (trước H2 đầu tiên), chèn disclaimer nghiêng: "*Thông tin trong bài mang tính tham khảo. Vui lòng liên hệ Kaizen để được tư vấn theo hồ sơ cá nhân.*".
7. Cấm dùng cụm placeholder "kiểm chứng hiển thị hero", "floating stats", "marquee", "bài viết mẫu".
8. Không hứa hẹn "chắc chắn đậu visa", "cam kết 100%", "uy tín số 1".`;

  const user = `Viết lại bài blog XKLĐ theo bối cảnh dưới đây.

TIÊU ĐỀ (giữ nguyên): ${args.title}
SLUG (giữ nguyên): ${args.slug}
THỊ TRƯỜNG: ${info.name}
LOẠI BÀI: ${args.intent} — ${intentBrief}

DỮ LIỆU THAM CHIẾU VỀ THỊ TRƯỜNG:
- Lương tham chiếu: ${info.salary}
- Ngành nghề chính: ${info.industries}
- Loại visa: ${info.visa}
- Điều kiện đầu vào: ${info.entry}
- Landing page nội bộ: ${info.landing}

YÊU CẦU ĐỘ DÀI: ${args.targetWords - 200}-${args.targetWords + 200} từ tiếng Việt.

YÊU CẦU CẤU TRÚC:
- ≥ 4 H2 (##), mỗi H2 có 2-4 đoạn ngắn hoặc bảng/list.
- ≥ 2 markdown list (- ...).
- ≥ 1 bảng markdown hoặc blockquote highlight.
- FAQ 4-6 cặp cuối bài, mỗi câu hỏi bắt đầu bằng "###".

TRẢ JSON đúng schema:
{
  "bodyMarkdown": "toàn bộ nội dung markdown, KHÔNG có dòng H1",
  "excerpt": "1 câu 120-155 ký tự, có CTA nhẹ",
  "seoTitle": "40-60 ký tự, có tên thị trường + 2026 + | Kaizen",
  "seoDescription": "140-155 ký tự, có CTA",
  "faq": [{ "question": "...", "answer": "..." }],
  "keywords": ["3-6 keyword phụ tiếng Việt có dấu"]
}`;

  return { system, user };
}
