import { describe, expect, it } from "vitest";
import { isMarkdown } from "@/lib/blog-seo";
import { looksUnnormalized, normalizeMarkdown } from "@/lib/cms/normalize-markdown";

/**
 * Regression fixtures cho normalizeMarkdown.
 *
 * Mục tiêu: khoá cứng các case đã từng gãy trong CMS Kaizen để tránh
 * ai đó chỉnh heuristic rồi vô tình phá lại cấu trúc.
 *
 * Không assert nguyên văn — dùng contain / regex để cho phép tinh chỉnh
 * whitespace mà vẫn bắt được lỗi cấu trúc (mất list, mất heading, mất CTA).
 */

describe("normalizeMarkdown — fixture ✅ tách dòng", () => {
  const raw = [
    "KHAI GIẢNG KHOÁ TIẾNG ĐỨC K62",
    "",
    "✅ Giáo trình chuẩn Goethe A1-B1",
    "✅ Giáo viên bản ngữ + trợ giảng Việt",
    "✅ Cam kết đầu ra B1 sau 8 tháng",
    "✅ Học phí trả góp 0% lãi suất",
    "",
    "Đăng ký ngay để nhận ưu đãi sớm.",
  ].join("\n");

  it("bị coi là chưa chuẩn", () => {
    expect(looksUnnormalized(raw)).toBe(true);
  });

  it("chuyển các dòng ✅ thành bullet list markdown", () => {
    const out = normalizeMarkdown(raw);
    const bullets = out.split("\n").filter((l) => /^-\s+/.test(l));
    expect(bullets.length).toBeGreaterThanOrEqual(4);
    // Emoji ✅ bị strip khi convert (nó là bullet marker, không phải nội dung).
    expect(out).not.toMatch(/-\s+✅/);
    expect(out).toMatch(/-\s+Giáo trình chuẩn Goethe A1-B1/);
  });

  it("promote dòng viết hoa thành H2", () => {
    const out = normalizeMarkdown(raw);
    expect(out).toMatch(/^##\s+KHAI GIẢNG KHOÁ TIẾNG ĐỨC K62/m);
  });

  it("idempotent — chạy 2 lần cho kết quả bằng nhau", () => {
    const once = normalizeMarkdown(raw);
    const twice = normalizeMarkdown(once);
    expect(twice).toBe(once);
  });
});

describe("normalizeMarkdown — fixture Hotline 📞", () => {
  // Mỗi dòng liên hệ đứng riêng 1 block → được wrap CTA blockquote.
  // (Nhiều dòng meta cùng block sẽ được gom thành list — cũng chấp nhận được,
  // xem test "gom thành list" bên dưới.)
  it("wrap dòng Hotline emoji thành blockquote CTA", () => {
    const out = normalizeMarkdown("📞 Hotline: 0979 160 999");
    expect(out).toMatch(/^>\s+\*\*📞\s*Hotline:\s*0979 160 999\*\*/m);
  });

  it("wrap dòng Zalo emoji thành blockquote CTA", () => {
    const out = normalizeMarkdown("📱 Zalo: 0979 160 999");
    expect(out).toMatch(/^>\s+\*\*📱\s*Zalo:\s*0979 160 999\*\*/m);
  });

  it("wrap dòng Email emoji thành blockquote CTA", () => {
    const out = normalizeMarkdown("📧 Email: info@kaizen.vn");
    expect(out).toMatch(/^>\s+\*\*📧\s*Email:\s*info@kaizen\.vn\*\*/m);
  });

  it("Hotline prefix chữ (không emoji) cũng thành blockquote CTA", () => {
    const out = normalizeMarkdown("Hotline: 0979 160 999");
    expect(out).toMatch(/^>\s+\*\*📞\s*Hotline:\s*0979 160 999\*\*/m);
  });

  it("nhiều dòng contact cùng block → gom thành list markdown", () => {
    const raw = [
      "📞 Hotline: 0979 160 999",
      "📱 Zalo: 0979 160 999",
      "📧 Email: info@kaizen.vn",
    ].join("\n");
    const out = normalizeMarkdown(raw);
    const bullets = out.split("\n").filter((l) => /^-\s+/.test(l));
    expect(bullets.length).toBeGreaterThanOrEqual(3);
    expect(out).toMatch(/-\s+📞\s*Hotline/);
  });
});

describe("normalizeMarkdown — fixture heading kết thúc bằng ?", () => {
  const raw = [
    "Vì sao nên học tại Kaizen?",
    "",
    "Chúng tôi có 15 năm kinh nghiệm đưa học viên đi Đức.",
  ].join("\n");

  it("câu hỏi ngắn viết hoa đầu → promote thành H3", () => {
    const out = normalizeMarkdown(raw);
    expect(out).toMatch(/^###\s+Vì sao nên học tại Kaizen\?/m);
  });

  it("không promote nếu câu quá dài / có chấm câu giữa", () => {
    const noisy = "Bạn đã bao giờ tự hỏi rằng, liệu có cách nào tốt hơn để chuẩn bị hành trang du học Đức, mà vẫn tiết kiệm chi phí không?";
    const out = normalizeMarkdown(noisy);
    expect(out).not.toMatch(/^###\s+Bạn đã bao giờ/m);
  });

  it("không double-promote heading đã có sẵn", () => {
    const already = "### Vì sao nên học tại Kaizen?";
    const out = normalizeMarkdown(already);
    // Không được biến thành "### ### ..."
    expect(out).not.toMatch(/^#{4,}/m);
    expect(out).toMatch(/^###\s+Vì sao nên học tại Kaizen\?/m);
  });
});

describe("normalizeMarkdown — bài đã sạch không bị đụng", () => {
  it("không đánh dấu bài chuẩn là unnormalized", () => {
    const clean = [
      "## Chương trình học",
      "",
      "Nội dung chi tiết của chương trình đào tạo tại Kaizen.",
      "",
      "- Điểm 1",
      "- Điểm 2",
      "- Điểm 3",
      "",
      "### Học phí",
      "",
      "Học phí trọn gói bao gồm tài liệu và thi thử.",
    ].join("\n");
    expect(looksUnnormalized(clean)).toBe(false);
  });
});

describe("normalizeMarkdown — fixture đoạn emoji + list dính dòng", () => {
  const raw = [
    "✦ Thông qua chương trình hợp tác, học viên Kaizen sẽ được:",
    "- Tư vấn lộ trình du học phù hợp",
    "- Hỗ trợ hoàn thiện hồ sơ và thủ tục nhập học",
    "- Đồng hành trong quá trình xin visa và xuất cảnh",
    "- Kết nối trực tiếp với chương trình đào tạo của Trường Đại học Sungkyul",
    "💙 Với định hướng phát triển bền vững, Kaizen luôn không ngừng mở rộng hợp tác với các trường đại học và tổ chức giáo dục uy tín trên thế giới.",
  ].join("\n");

  it("bị coi là chưa chuẩn để auto-format khi lưu", () => {
    expect(looksUnnormalized(raw)).toBe(true);
  });

  it("giữ đoạn mở đầu, list và đoạn kết thành các block riêng", () => {
    const out = normalizeMarkdown(raw);
    expect(out).toContain("✦ Thông qua chương trình hợp tác, học viên Kaizen sẽ được:\n\n- Tư vấn lộ trình du học phù hợp");
    expect(out).toContain("Trường Đại học Sungkyul\n\n💙 Với định hướng phát triển bền vững");
    expect(out.split("\n").filter((l) => /^-\s+/.test(l))).toHaveLength(4);
  });

  it("được nhận diện là Markdown dù không có heading", () => {
    const out = normalizeMarkdown(raw);
    expect(isMarkdown(out)).toBe(true);
  });
});

describe("normalizeMarkdown — fixture img HTML bị xuống dòng", () => {
  const raw = [
    "Nội dung trước ảnh.",
    "",
    '<img src="https://example.com/storage/v1/object/sign/cms-media/2026-07/abc-5.',
    "webp?",
    'token=abc.def.ghi" alt="Đại học Sungkyul" loading="lazy">',
    "",
    "Nội dung sau ảnh.",
  ].join("\n");

  it("bị coi là chưa chuẩn", () => {
    expect(looksUnnormalized(raw)).toBe(true);
  });

  it("nối lại URL ảnh, không để phần webp/token rơi thành chữ", () => {
    const out = normalizeMarkdown(raw);
    expect(out).toContain('<img src="https://example.com/storage/v1/object/sign/cms-media/2026-07/abc-5.webp?token=abc.def.ghi" alt="Đại học Sungkyul" loading="lazy">');
    expect(out).not.toMatch(/^webp\?/m);
    expect(out).not.toMatch(/^token=/m);
  });

  it("loại bỏ thẻ img bị cắt mất phần cuối để không lộ token trên trang", () => {
    const broken = [
      "Nội dung trước ảnh.",
      "",
      '<img src="https://example.com/storage/v1/object/sign/cms-media/2026-07/abc-5.',
      "",
      "webp?",
      "token=abc.def",
    ].join("\n");
    const out = normalizeMarkdown(broken);
    expect(looksUnnormalized(broken)).toBe(true);
    expect(out).toBe("Nội dung trước ảnh.");
    expect(out).not.toContain("<img");
    expect(out).not.toContain("token=");
  });
});
