/**
 * Batch rewriter cho 150 bài seed XKLĐ (chất lượng thấp, duplicate content).
 *
 * Chiến lược:
 * - 1-shot Gemini Flash call cho mỗi bài (rẻ, đủ chất lượng long-form VN).
 * - Quality gate (word count, H2 count, internal link, marker placeholder) trước khi ghi DB.
 * - Ghi revision v+1 để có thể rollback từng bài qua `revertRevision`.
 * - Client gọi từng bài (rate limit tự nhiên qua request-per-request).
 *
 * Nhận diện bài seed bằng dấu vân tay chuỗi trong body (đã verify là duy nhất).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildRewritePrompt, detectIntent, marketInfo } from "@/lib/ai-writer/prompts-xkld";
import { normalizeMarkdown, looksUnnormalized } from "@/lib/cms/normalize-markdown";

const SEED_MARKER = "kiểm chứng hiển thị hero, floating stats";
const MODEL_FAST = "google/gemini-3-flash-preview";
const MODEL_PRO = "google/gemini-3.1-pro-preview";

const RewriteSchema = z.object({
  bodyMarkdown: z.string(),
  excerpt: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  keywords: z.array(z.string()),
});
type RewriteOutput = z.infer<typeof RewriteSchema>;

async function assertAdmin(context: any) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Chỉ admin được chạy rewrite seed");
}

/** Liệt kê tất cả bài seed đang cần viết lại (nhận diện qua marker). */
export const listSeedPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("cms_entries")
      .select("id,slug,title,market,version,status,updated_at,data")
      .like("data->>body", `%${SEED_MARKER}%`)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      market: r.market,
      version: r.version,
      status: r.status,
      updated_at: r.updated_at,
      body_len: typeof r.data?.body === "string" ? r.data.body.length : 0,
    }));
    return { items, total: items.length };
  });

const rewriteInput = z.object({
  id: z.string().uuid(),
  dryRun: z.boolean().default(false),
  targetWords: z.number().int().min(600).max(2500).default(1000),
  usePro: z.boolean().default(false),
});

type QualityCheck = { ok: boolean; reasons: string[]; stats: Record<string, number> };

function checkQuality(bodyMd: string, marketLanding: string): QualityCheck {
  const reasons: string[] = [];
  const wordCount = bodyMd.trim().split(/\s+/).filter(Boolean).length;
  const h2Count = (bodyMd.match(/^##\s+/gm) ?? []).length;
  const listCount = (bodyMd.match(/^-\s+/gm) ?? []).length;
  const hasInternalLink = bodyMd.includes(marketLanding) || /\]\(\/xkld\//.test(bodyMd);
  const hasSeedMarker = bodyMd.includes(SEED_MARKER) || bodyMd.includes("Bài viết mẫu");
  const hasH1 = /^#\s+/m.test(bodyMd);
  const hasCta = /\/dang-ky\?src=xkld/.test(bodyMd);

  if (wordCount < 500) reasons.push(`Chỉ ${wordCount} từ (< 500)`);
  if (h2Count < 3) reasons.push(`Chỉ ${h2Count} H2 (< 3)`);
  if (listCount < 2) reasons.push(`Chỉ ${listCount} bullet (< 2)`);
  if (!hasInternalLink) reasons.push("Thiếu internal link tới landing thị trường");
  if (hasSeedMarker) reasons.push("Vẫn còn cụm placeholder");
  if (hasH1) reasons.push("Body chứa H1 (không được phép)");
  if (!hasCta) reasons.push("Thiếu CTA /dang-ky?src=xkld");
  if (looksUnnormalized(bodyMd)) reasons.push("Chưa normalize (looksUnnormalized=true)");

  return {
    ok: reasons.length === 0,
    reasons,
    stats: { wordCount, h2Count, listCount },
  };
}

async function generateRewrite(args: {
  apiKey: string;
  model: string;
  title: string;
  slug: string;
  market: string;
  intent: ReturnType<typeof detectIntent>;
  targetWords: number;
}): Promise<RewriteOutput> {
  const { system, user } = buildRewritePrompt({
    title: args.title,
    slug: args.slug,
    market: args.market,
    intent: args.intent,
    targetWords: args.targetWords,
  });
  const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(args.apiKey);
  try {
    const { output } = await generateText({
      model: gateway(args.model),
      system,
      prompt: user,
      output: Output.object({ schema: RewriteSchema }),
    });
    return output as RewriteOutput;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      const raw = error.text ?? "";
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return RewriteSchema.parse(JSON.parse(raw.slice(start, end + 1)));
      }
    }
    throw error;
  }
}

/**
 * Viết lại MỘT bài. Client loop qua tất cả bài để có progress bar.
 * dryRun=true: chỉ trả kết quả AI, không ghi DB.
 */
export const rewriteSeedPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rewriteInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const apiKey = "kaizen-external-ai";
    if (!apiKey) throw new Error("LOVABLE_API_KEY chưa cấu hình");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("cms_entries")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Không tìm thấy bài viết");

    const body = typeof (row as any).data?.body === "string" ? (row as any).data.body : "";
    if (!body.includes(SEED_MARKER) && !data.dryRun) {
      throw new Error("Bài này không phải seed (không có marker) — từ chối ghi đè để an toàn");
    }

    const intent = detectIntent((row as any).slug);
    const market = (row as any).market ?? "duc";
    const info = marketInfo(market);

    const model = data.usePro ? MODEL_PRO : MODEL_FAST;
    const out = await generateRewrite({
      apiKey,
      model,
      title: (row as any).title,
      slug: (row as any).slug,
      market,
      intent,
      targetWords: data.targetWords,
    });

    // Chuẩn hoá lần cuối để đảm bảo double-safety.
    const normalized = normalizeMarkdown(out.bodyMarkdown);
    const quality = checkQuality(normalized, info.landing);

    if (data.dryRun) {
      return {
        id: data.id,
        title: (row as any).title,
        slug: (row as any).slug,
        market,
        intent,
        preview: {
          bodyMarkdown: normalized,
          excerpt: out.excerpt,
          seoTitle: out.seoTitle,
          seoDescription: out.seoDescription,
          faq: out.faq,
          keywords: out.keywords,
        },
        quality,
        written: false,
      };
    }

    if (!quality.ok) {
      return {
        id: data.id,
        title: (row as any).title,
        slug: (row as any).slug,
        quality,
        written: false,
        skipReason: quality.reasons.join("; "),
      };
    }

    // Ghi revision v+1
    await supabaseAdmin.from("cms_entry_revisions").insert({
      entry_id: (row as any).id,
      version: (row as any).version ?? 1,
      title: (row as any).title,
      excerpt: (row as any).excerpt,
      cover_image: (row as any).cover_image,
      data: (row as any).data,
      seo: (row as any).seo,
      status: (row as any).status,
      editor_id: context.userId,
      note: `AI rewrite seed (model=${model}, intent=${intent})`,
    });

    const newData = { ...((row as any).data ?? {}), body: normalized };
    const newSeo = {
      ...((row as any).seo ?? {}),
      title: out.seoTitle,
      description: out.seoDescription,
      keywords: out.keywords,
      faq: out.faq,
    };

    const { error: upErr } = await (supabaseAdmin.from("cms_entries") as any)
      .update({
        data: newData,
        seo: newSeo,
        excerpt: out.excerpt,
        version: ((row as any).version ?? 1) + 1,
        updated_by: context.userId,
      })
      .eq("id", (row as any).id);
    if (upErr) throw upErr;

    return {
      id: data.id,
      title: (row as any).title,
      slug: (row as any).slug,
      quality,
      written: true,
    };
  });
