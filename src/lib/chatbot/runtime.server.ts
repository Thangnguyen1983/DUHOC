/**
 * Server-only helpers cho /api/chat route.
 * Đọc KB động + prompt active từ DB, gộp với KB tĩnh + DEFAULT_SYSTEM_PROMPT.
 */
import { buildStaticKnowledge } from "@/lib/chatbot/knowledge-static";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/chatbot/default-prompt";
import { DEFAULT_TRAINING, renderTrainingBlock, type TrainingConfig } from "@/lib/chatbot/default-training";

type KBRow = {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  priority: number;
};

let cache: { at: number; systemPrompt: string } | null = null;
const CACHE_MS = 60 * 1000;

export async function buildSystemPrompt(): Promise<string> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.systemPrompt;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: kbRows }, { data: promptRow }, { data: trainingRow }] = await Promise.all([
    supabaseAdmin
      .from("chatbot_knowledge")
      .select("id,category,title,content,keywords,priority")
      .eq("status", "approved")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(80),
    supabaseAdmin
      .from("chatbot_prompts")
      .select("content")
      .eq("is_active", true)
      .maybeSingle(),
    (supabaseAdmin as any)
      .from("chatbot_training")
      .select("*")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const staticKB = buildStaticKnowledge();
  const dynamicKB = (kbRows as KBRow[] | null)?.length
    ? "\n\n# KB động (admin bổ sung)\n" +
      (kbRows as KBRow[])
        .map((r) => `## [${r.category}] ${r.title}\n${r.content}`)
        .join("\n\n")
    : "";
  const basePrompt = promptRow?.content ?? DEFAULT_SYSTEM_PROMPT;
  const tr: any = trainingRow;
  const training: TrainingConfig = tr
    ? {
        context_summary: tr.context_summary ?? "",
        audience: tr.audience ?? "",
        scope_allow: tr.scope_allow ?? "",
        scope_deny: tr.scope_deny ?? "",
        tone_style: (tr.tone_style ?? "professional") as TrainingConfig["tone_style"],
        address_user: tr.address_user ?? "anh/chị",
        address_self: tr.address_self ?? "Kaizen",
        max_sentences: tr.max_sentences ?? 6,
        max_words_per_sentence: tr.max_words_per_sentence ?? 20,
        use_emoji: !!tr.use_emoji,
        language: tr.language ?? "vi",
        extra_rules: tr.extra_rules ?? "",
        sample_qa: Array.isArray(tr.sample_qa) ? tr.sample_qa : [],
      }
    : DEFAULT_TRAINING;

  const trainingBlock = renderTrainingBlock(training);

  const systemPrompt = `${basePrompt}

================ HUẤN LUYỆN (NGỮ CẢNH & GIỌNG ĐIỆU) ================
${trainingBlock}

================ KNOWLEDGE BASE ================
${staticKB}${dynamicKB}
================================================`;

  cache = { at: Date.now(), systemPrompt };
  return systemPrompt;
}

export function invalidatePromptCache() {
  cache = null;
}

export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.LOVABLE_API_KEY?.slice(0, 16) ?? "kaizen-salt";
  const enc = new TextEncoder().encode(`${salt}:${ip}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
