/**
 * Cổng AI chung của hệ thống. Mọi tính năng AI đi qua đây.
 * Cài đặt AI chọn một trong hai nguồn: AI của Lovable (mặc định, không cần khoá riêng)
 * hoặc khoá riêng của Kaizen (OpenAI / Google Gemini / Anthropic Claude).
 * Khoá API là bí mật máy chủ (LOVABLE_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY), không lưu trong cơ sở dữ liệu.
 */
export const AI_PROVIDERS = ["openai", "gemini", "anthropic"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const PROVIDER_INFO: Record<AiProvider, { label: string; secret: string; baseURL: string; chat: string; image: string | null }> = {
  openai: { label: "OpenAI (ChatGPT)", secret: "OPENAI_API_KEY", baseURL: "https://api.openai.com/v1", chat: "gpt-4o-mini", image: "gpt-image-1" },
  gemini: { label: "Google Gemini", secret: "GEMINI_API_KEY", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", chat: "gemini-2.5-flash", image: "imagen-4.0-generate-001" },
  anthropic: { label: "Anthropic Claude", secret: "ANTHROPIC_API_KEY", baseURL: "https://api.anthropic.com/v1", chat: "claude-sonnet-4-5", image: null },
};

export type AiMode = "lovable" | "external";

export type AiConfig = {
  mode: AiMode;
  provider: AiProvider;
  model: string;
  image_provider: AiProvider;
  image_model: string;
};

/** Cấu hình khi dùng AI của Lovable (không cần khoá riêng). */
const LOVABLE = { baseURL: "https://ai.gateway.lovable.dev/v1", chat: "openai/gpt-6-astra", image: "openai/gpt-image-2.5-sunburst" };

export class AiConfigError extends Error {}

export async function readAiConfig(): Promise<AiConfig> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("site_settings").select("ai_config").eq("id", true).maybeSingle();
  const raw = ((data as any)?.ai_config ?? {}) as Partial<AiConfig>;
  const provider = (AI_PROVIDERS as readonly string[]).includes(raw.provider ?? "") ? (raw.provider as AiProvider) : "gemini";
  const image_provider = raw.image_provider && PROVIDER_INFO[raw.image_provider]?.image ? raw.image_provider : provider === "anthropic" ? "openai" : provider;
  return {
    mode: raw.mode === "external" ? "external" : "lovable",
    provider,
    model: raw.model?.trim() || PROVIDER_INFO[provider].chat,
    image_provider,
    image_model: raw.image_model?.trim() || PROVIDER_INFO[image_provider].image || "",
  };
}

export function providerKey(p: AiProvider): string | undefined {
  return process.env[PROVIDER_INFO[p].secret]?.trim() || undefined;
}

function requireKey(p: AiProvider) {
  const key = providerKey(p);
  if (!key) throw new AiConfigError(`Chưa nhập khoá API cho ${PROVIDER_INFO[p].label}. Vào Cài đặt AI để cấu hình.`);
  return key;
}

/** Gọi AI ngoài theo chuẩn OpenAI (`/chat/completions`, `/images/generations`). Hãng, mẫu và khoá do cài đặt quyết định. */
export async function aiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cfg = await readAiConfig();
  const isImage = path.includes("/images/");
  const cleanPath = path.replace(/^https?:\/\/[^/]+\/v1/, "").replace(/^\/?/, "/");
  let baseURL: string;
  let key: string;
  let model: string;
  let geminiImage = false;
  if (cfg.mode === "lovable") {
    baseURL = LOVABLE.baseURL;
    key = process.env.LOVABLE_API_KEY?.trim() || "";
    if (!key) throw new AiConfigError("Chưa có khoá AI của Lovable trên máy chủ.");
    model = isImage ? LOVABLE.image : LOVABLE.chat;
  } else {
    const provider = isImage ? cfg.image_provider : cfg.provider;
    const info = PROVIDER_INFO[provider];
    if (isImage && !info.image) throw new AiConfigError("Hãng AI đã chọn không hỗ trợ tạo ảnh");
    key = requireKey(provider);
    baseURL = info.baseURL;
    model = isImage ? cfg.image_model : cfg.model;
    geminiImage = isImage && provider === "gemini";
  }
  let body = init.body;
  if (typeof body === "string") {
    try {
      const json = JSON.parse(body);
      json.model = model;
      delete json.modalities;
      if (geminiImage) {
        delete json.quality;
        delete json.size;
        json.response_format = "b64_json";
      }
      body = JSON.stringify(json);
    } catch {
      /* giữ nguyên body không phải JSON */
    }
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${baseURL}${cleanPath}`, { ...init, headers, body });
}

/** Mẫu ngôn ngữ cho AI SDK (generateText/streamText) theo hãng đang chọn. */
export async function getAiModel() {
  const cfg = await readAiConfig();
  const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
  if (cfg.mode === "lovable") {
    const key = process.env.LOVABLE_API_KEY?.trim() || "";
    if (!key) throw new AiConfigError("Chưa có khoá AI của Lovable trên máy chủ.");
    return createOpenAICompatible({ name: "lovable", baseURL: LOVABLE.baseURL, apiKey: key })(LOVABLE.chat);
  }
  const key = requireKey(cfg.provider);
  const provider = createOpenAICompatible({
    name: cfg.provider,
    baseURL: PROVIDER_INFO[cfg.provider].baseURL,
    apiKey: key,
  });
  return provider(cfg.model);
}
