import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  vi: "Vietnamese",
};

const InputSchema = z.object({
  targetLang: z.enum(["en", "ja", "ko", "vi"]),
  texts: z.array(z.string().min(1).max(500)).min(1).max(40),
});

// Restrict the translation endpoint to first-party origins to prevent
// anonymous abuse / AI credit drain. The language switcher on our own site
// will always send a same-origin Origin/Referer header.
const ALLOWED_HOST_SUFFIXES = [
  "kaizenmanpower.com",
  "lovable.app",
  "lovableproject.com",
  "localhost",
];

function isAllowedOrigin(value: string | null): boolean {
  if (!value) return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const req = getRequest();
    const origin = req?.headers.get("origin");
    const referer = req?.headers.get("referer");
    if (!isAllowedOrigin(origin) && !isAllowedOrigin(referer)) {
      throw new Error("Forbidden");
    }
    const key = "kaizen-external-ai";
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const target = LANG_NAMES[data.targetLang];
    const system =
      `You are a professional website translator for a Vietnamese study-abroad & labor-export company. ` +
      `Translate the user-provided JSON array of UI strings from Vietnamese (or any source) into ${target}. ` +
      `Rules: keep brand names (KAIZEN), phone numbers, emails, URLs, numbers and emoji unchanged; ` +
      `preserve leading/trailing whitespace and punctuation; keep length similar; natural, concise tone. ` +
      `Return ONLY a JSON object: {"t":[...]} with the SAME length and order as input.`;

    const res = await (await import("@/lib/ai/external-ai.server")).aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(data.texts) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Hệ thống dịch đang quá tải, vui lòng thử lại sau.");
    if (res.status === 402) throw new Error("Hết credit AI. Vui lòng nạp thêm trong Settings.");
    if (!res.ok) throw new Error(`AI gateway error ${res.status}`);

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";

    const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = cleaned.search(/[\[{]/);
    const isArr = start !== -1 && cleaned[start] === "[";
    const end = cleaned.lastIndexOf(isArr ? "]" : "}");
    const candidate = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;

    let arr: unknown[] = [];
    try {
      const parsed = JSON.parse(
        candidate.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"),
      );
      if (Array.isArray(parsed)) arr = parsed;
      else if (parsed && Array.isArray((parsed as { t?: unknown }).t)) arr = (parsed as { t: unknown[] }).t;
      else if (parsed && typeof parsed === "object") {
        const vals = Object.values(parsed as Record<string, unknown>);
        if (vals.every((v) => typeof v === "string")) arr = vals;
      }
    } catch (e) {
      console.error("translate parse failed", { content, err: String(e) });
      throw new Error("Phản hồi dịch không hợp lệ");
    }

    const out = data.texts.map((src, i) => {
      const v = arr[i];
      return typeof v === "string" && v.trim() ? v : src;
    });
    return { translations: out };
  });
