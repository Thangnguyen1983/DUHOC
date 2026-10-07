import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

export const OutlineSuggestionSchema = z.object({
  sections: z
    .array(
      z.object({
        level: z.number().min(2).max(3),
        title: z.string(),
        hint: z.string().optional(),
      }),
    )
    .max(20),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .max(6)
    .optional(),
});

/** Lenient shape used to parse raw model JSON before normalising. */
const RawSuggestionSchema = z.object({
  sections: z.array(z.any()).optional(),
  faq: z.array(z.any()).optional(),
});

function toLevel(value: unknown): 2 | 3 {
  if (typeof value === "number") return value >= 3 ? 3 : 2;
  if (typeof value === "string") return /3/.test(value) ? 3 : 2;
  return 2;
}

function normalise(raw: unknown): OutlineSuggestion {
  const parsed = RawSuggestionSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : { sections: [], faq: [] };
  const sections = (data.sections ?? [])
    .map((s: any) => ({
      level: toLevel(s?.level ?? s?.heading ?? s?.tag),
      title: String(s?.title ?? s?.heading ?? s?.name ?? "").trim(),
      hint: s?.hint ? String(s.hint) : undefined,
    }))
    .filter((s) => s.title)
    .slice(0, 20);
  const faq = (data.faq ?? [])
    .map((f: any) => ({
      question: String(f?.question ?? f?.q ?? "").trim(),
      answer: String(f?.answer ?? f?.a ?? "").trim(),
    }))
    .filter((f) => f.question && f.answer)
    .slice(0, 6);
  return { sections, faq: faq.length ? faq : undefined };
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI không trả về JSON hợp lệ.");
  return JSON.parse(candidate.slice(start, end + 1));
}

export type OutlineSuggestion = z.infer<typeof OutlineSuggestionSchema>;

const SYSTEM = `Bạn là chuyên gia SEO nội dung tiếng Việt cho KAIZEN — công ty du học, xuất khẩu lao động và đào tạo ngoại ngữ tại Nghệ An.
Nhiệm vụ: đề xuất DÀN Ý (chỉ tiêu đề H2/H3) chuẩn SEO cho một bài viết.
Quy tắc:
- Viết tiếng Việt CÓ DẤU, tự nhiên, không nhồi từ khoá.
- 6–10 mục H2, mỗi H2 có thể kèm 0–3 H3.
- Bám sát ý định tìm kiếm; ưu tiên các mục thực tế: điều kiện, chi phí, hồ sơ, lộ trình, thời gian, rủi ro thường gặp, kinh nghiệm thực tế.
- Mục cuối luôn là phần kết + kêu gọi đăng ký tư vấn.
- Kèm 3–5 câu FAQ ngắn, câu trả lời 1–3 câu.
- "hint" là gợi ý 1 câu về nội dung nên viết trong mục đó.`;

export async function suggestOutlineAi(input: {
  keyword: string;
  title?: string;
  intent?: string;
  existing?: string[];
}): Promise<OutlineSuggestion> {
  const apiKey = "kaizen-external-ai";
  if (!apiKey) throw new Error("LOVABLE_API_KEY chưa cấu hình.");
  const gateway = createLovableAiGatewayProvider(apiKey);

  const prompt = [
    `Từ khoá chính: ${input.keyword}`,
    input.title ? `Tiêu đề bài: ${input.title}` : "",
    input.intent ? `Ý định tìm kiếm / ghi chú: ${input.intent}` : "",
    input.existing?.length ? `Các mục đã có trong bài:\n- ${input.existing.join("\n- ")}` : "",
    "Trả về dàn ý đề xuất (bổ sung cho các mục đã có, không lặp lại y hệt).",
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await generateText({
    model: gateway(MODEL),
    system: `${SYSTEM}

CHỈ trả về JSON thuần (không giải thích, không markdown) theo đúng dạng:
{"sections":[{"level":2,"title":"...","hint":"..."}],"faq":[{"question":"...","answer":"..."}]}`,
    prompt,
  });

  const result = normalise(extractJson(text ?? ""));
  if (!result.sections.length) throw new Error("AI chưa tạo được dàn ý, vui lòng thử lại.");
  return result;
}
