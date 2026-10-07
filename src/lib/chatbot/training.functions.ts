import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_TRAINING } from "@/lib/chatbot/default-training";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

const sampleQaSchema = z.array(
  z.object({
    q: z.string().trim().min(1).max(500),
    a: z.string().trim().min(1).max(2000),
  }),
).max(20);

const trainingSchema = z.object({
  context_summary: z.string().trim().max(4000),
  audience: z.string().trim().max(2000),
  scope_allow: z.string().trim().max(2000),
  scope_deny: z.string().trim().max(2000),
  tone_style: z.enum(["formal", "friendly", "professional", "enthusiastic"]),
  address_user: z.string().trim().min(1).max(50),
  address_self: z.string().trim().min(1).max(50),
  max_sentences: z.number().int().min(1).max(20),
  max_words_per_sentence: z.number().int().min(5).max(60),
  use_emoji: z.boolean(),
  language: z.string().trim().min(2).max(10),
  extra_rules: z.string().trim().max(4000),
  sample_qa: sampleQaSchema,
});

export const listTraining = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("chatbot_training")
      .select("*")
      .order("version", { ascending: false });
    if (error) throw error;
    return { items: data ?? [], defaults: DEFAULT_TRAINING };
  });

export const saveTraining = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      config: trainingSchema,
      activate: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: maxRow } = await supabaseAdmin
      .from("chatbot_training")
      .select("version")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (maxRow?.version ?? 0) + 1;

    if (data.activate) {
      await supabaseAdmin
        .from("chatbot_training")
        .update({ is_active: false })
        .eq("is_active", true);
    }

    const { error } = await supabaseAdmin.from("chatbot_training").insert({
      version: nextVersion,
      ...data.config,
      is_active: data.activate,
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true, version: nextVersion };
  });

export const activateTraining = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("chatbot_training").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabaseAdmin
      .from("chatbot_training")
      .update({ is_active: true })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
