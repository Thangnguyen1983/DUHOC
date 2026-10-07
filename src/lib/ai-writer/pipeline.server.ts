import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { researchKeyword, isSemrushConfigured } from "@/lib/semrush.server";
import {
  STEP1_ANALYZE_SYSTEM,
  STEP3_OUTLINE_SYSTEM,
  step4WriteSystem,
  STEP5_REVIEW_SYSTEM,
  type Step1Result,
  type Step3Result,
  type Step4Result,
  type Step5Result,
} from "./prompts";

const MODEL_FAST = "google/gemini-3-flash-preview";
const MODEL_PRO = "google/gemini-3.1-pro-preview";

async function callAiJson<T>(opts: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
}): Promise<T> {
  const gateway = createLovableAiGatewayProvider(opts.apiKey);
  try {
    const { output } = await generateText({
      model: gateway(opts.model),
      system: opts.system,
      prompt: opts.prompt,
      output: Output.object({ schema: opts.schema }),
    });
    return output as T;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      // Fallback: parse text
      try {
        const raw = error.text ?? "";
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start >= 0 && end > start) {
          return JSON.parse(raw.slice(start, end + 1)) as T;
        }
      } catch {}
    }
    throw error;
  }
}

const Step1Schema = z.object({
  searchIntent: z.string(),
  persona: z.string(),
  painPoints: z.array(z.string()),
  journeyStage: z.string(),
  eeatNeeds: z.array(z.string()),
  keyEntities: z.array(z.string()),
});

const Step3Schema = z.object({
  h1: z.string(),
  intro: z.string(),
  toc: z.array(z.string()),
  sections: z.array(
    z.object({
      h2: z.string(),
      angle: z.string(),
      h3: z.array(z.string()),
      includes: z.array(z.string()),
    }),
  ),
  faqQuestions: z.array(z.string()),
});

const Step4Schema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  bodyMarkdown: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  ogTitle: z.string(),
  ogDescription: z.string(),
  heroImagePrompt: z.string(),
  infographicPrompt: z.string(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  internalLinks: z.array(z.object({ anchor: z.string(), slug: z.string() })),
  externalLinks: z.array(z.object({ anchor: z.string(), url: z.string() })),
});

const Step5Schema = z.object({
  scores: z.record(z.string(), z.number()),
  overall: z.number(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  fixInstructions: z.string(),
});

export type PipelineInput = {
  topic: string;
  keyword: string;
  region?: string;
  contentType?: string;
  length?: string;
  tone?: string;
  notes?: string;
};

export type PipelineProgress =
  | { type: "step_start"; step: number; label: string }
  | { type: "step_done"; step: number; label: string; data?: unknown }
  | { type: "warning"; message: string }
  | { type: "final"; result: FinalResult }
  | { type: "error"; message: string };

export type FinalResult = {
  step1: Step1Result;
  step3: Step3Result;
  step4: Step4Result;
  step5: Step5Result;
  keywordData: Awaited<ReturnType<typeof researchKeyword>> | null;
  semrushUsed: boolean;
};

export async function runPipeline(
  input: PipelineInput,
  onProgress: (p: PipelineProgress) => void,
): Promise<void> {
  const apiKey = "kaizen-external-ai";
  if (!apiKey) {
    onProgress({ type: "error", message: "LOVABLE_API_KEY chưa cấu hình." });
    return;
  }

  const length = input.length ?? "2500-3500 từ";
  const tone = input.tone ?? "chuyên gia, đáng tin, có số liệu";

  try {
    // === BƯỚC 1: Phân tích intent ===
    onProgress({ type: "step_start", step: 1, label: "Phân tích intent & persona" });
    const step1 = await callAiJson({
      apiKey,
      model: MODEL_FAST,
      system: STEP1_ANALYZE_SYSTEM,
      prompt: `Chủ đề: "${input.topic}"
Từ khoá SEO chính: "${input.keyword}"
Địa bàn: ${input.region ?? "Việt Nam"}
Loại bài: ${input.contentType ?? "landing dịch vụ"}
Ghi chú: ${input.notes ?? "(không có)"}

Phân tích và trả JSON:
- searchIntent (informational/commercial/transactional/navigational + mô tả 1 câu)
- persona (chân dung người đọc điển hình 2-3 câu)
- painPoints (5-7 nỗi đau cụ thể)
- journeyStage (awareness/consideration/decision)
- eeatNeeds (3-5 tín hiệu EEAT bài cần bổ sung)
- keyEntities (10-15 entity: người, tổ chức, địa danh, chương trình, luật, visa liên quan)`,
      schema: Step1Schema,
    });
    onProgress({ type: "step_done", step: 1, label: "Phân tích intent", data: step1 });

    // === BƯỚC 2: Semrush keyword research ===
    onProgress({ type: "step_start", step: 2, label: "Nghiên cứu từ khoá (Semrush)" });
    let keywordData: Awaited<ReturnType<typeof researchKeyword>> | null = null;
    let semrushUsed = false;
    if (isSemrushConfigured()) {
      keywordData = await researchKeyword(input.keyword, "vn", 20);
      semrushUsed = keywordData.warnings.length === 0 || keywordData.related.length > 0;
      keywordData.warnings.forEach((w) => onProgress({ type: "warning", message: `Semrush: ${w}` }));
    } else {
      onProgress({
        type: "warning",
        message: "Chưa kết nối Semrush — dùng AI tự đề xuất keyword (dữ liệu không phải volume thật).",
      });
    }
    onProgress({ type: "step_done", step: 2, label: "Từ khoá", data: keywordData });

    // === BƯỚC 3: Outline ===
    onProgress({ type: "step_start", step: 3, label: "Xây outline vượt đối thủ" });
    const keywordSummary = keywordData
      ? `PRIMARY: ${keywordData.primary?.keyword ?? input.keyword} — volume ${keywordData.primary?.volume ?? "?"}, KD ${keywordData.primary?.difficulty ?? "?"}.
RELATED (${keywordData.related.length}): ${keywordData.related.slice(0, 15).map((k) => `${k.keyword} (${k.volume})`).join(", ")}.
QUESTIONS (${keywordData.questions.length}): ${keywordData.questions.slice(0, 15).map((q) => q.keyword).join(" | ")}.
SERP TOP: ${keywordData.serpTop.slice(0, 10).map((s) => `${s.domain} - ${s.title}`).join(" ; ")}.`
      : `(Không có dữ liệu Semrush. Hãy tự đề xuất 15 secondary keywords + 10 câu hỏi PAA điển hình cho chủ đề tiếng Việt.)`;

    const step3 = await callAiJson({
      apiKey,
      model: MODEL_FAST,
      system: STEP3_OUTLINE_SYSTEM,
      prompt: `PHÂN TÍCH INTENT:
${JSON.stringify(step1, null, 2)}

KEYWORD & SERP:
${keywordSummary}

Hãy tạo outline chi tiết theo schema. Yêu cầu:
- 6-10 H2, mỗi H2 có angle riêng biệt, không trùng đối thủ TOP.
- Bao phủ toàn bộ questions phía trên trong body hoặc FAQ.
- includes[] chọn từ: ["table", "checklist", "highlight", "cta", "image", "comparison", "case_study"].
- faqQuestions ≥ 10 câu.`,
      schema: Step3Schema,
    });
    onProgress({ type: "step_done", step: 3, label: "Outline", data: step3 });

    // === BƯỚC 4: Viết bài ===
    onProgress({ type: "step_start", step: 4, label: "Viết bài hoàn chỉnh" });
    const step4 = await callAiJson({
      apiKey,
      model: MODEL_PRO,
      system: step4WriteSystem(length, tone),
      prompt: `OUTLINE ĐÃ CHỐT:
${JSON.stringify(step3, null, 2)}

INTENT/PERSONA:
${JSON.stringify(step1, null, 2)}

KEYWORD PHỤ CẦN CHÈN TỰ NHIÊN:
${keywordData ? keywordData.related.slice(0, 15).map((k) => k.keyword).join(", ") : "(AI tự chọn)"}

ENTITY CẦN NHẮC TỚI:
${step1.keyEntities.join(", ")}

Viết bài hoàn chỉnh theo schema. bodyMarkdown là markdown thuần (H1 = #, H2 = ##, H3 = ###, bảng markdown chuẩn, blockquote cho highlight box).
seoTitle 50-60 ký tự có keyword ở đầu + "| Kaizen". seoDescription 140-155 ký tự có CTA.
slug: không dấu, gạch ngang, ≤60 ký tự.
faq ≥ 10 cặp. internalLinks 8-15 mục (slug dạng /du-hoc/han-quoc, /xkld/nhat-ban, /ngoai-ngu/tieng-han, /lien-he, /tin-tuc). externalLinks 3-5 mục tới nguồn gov/edu/tổ chức quốc tế.`,
      schema: Step4Schema,
    });
    onProgress({ type: "step_done", step: 4, label: "Bài viết", data: { title: step4.title, wordCount: step4.bodyMarkdown.split(/\s+/).length } });

    // === BƯỚC 5: Self-review ===
    onProgress({ type: "step_start", step: 5, label: "Chấm điểm chất lượng" });
    const step5 = await callAiJson({
      apiKey,
      model: MODEL_FAST,
      system: STEP5_REVIEW_SYSTEM,
      prompt: `Chấm bài viết sau theo 12 tiêu chí (mỗi tiêu chí 0-100):
SEO, EEAT, UX, Readability, Conversion, Semantic, Entity, InternalLink, GoogleDiscover, AIOverview, CoreContent, Trust.

TITLE: ${step4.title}
META: ${step4.seoDescription}
BODY (${step4.bodyMarkdown.length} ký tự):
${step4.bodyMarkdown.slice(0, 8000)}${step4.bodyMarkdown.length > 8000 ? "\n...[cắt bớt]" : ""}

FAQ: ${step4.faq.length} câu.
Internal links: ${step4.internalLinks.length}. External links: ${step4.externalLinks.length}.

Trả JSON:
- scores: object với 12 key trên, mỗi value 0-100.
- overall: trung bình cộng.
- strengths (3-5), weaknesses (3-5), fixInstructions (1 đoạn khuyến nghị).`,
      schema: Step5Schema,
    });
    onProgress({ type: "step_done", step: 5, label: "Chấm điểm", data: { overall: step5.overall } });

    const final: FinalResult = { step1, step3, step4, step5, keywordData, semrushUsed };
    onProgress({ type: "final", result: final });
  } catch (e) {
    onProgress({ type: "error", message: (e as Error).message ?? "Lỗi không xác định" });
  }
}
