import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/chatbot/default-prompt";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const listPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("chatbot_prompts")
      .select("*")
      .order("version", { ascending: false });
    if (error) throw error;
    return { items: data ?? [], defaultPrompt: DEFAULT_SYSTEM_PROMPT };
  });

export const savePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      content: z.string().trim().min(50).max(20000),
      activate: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: maxRow } = await supabaseAdmin
      .from("chatbot_prompts")
      .select("version")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (maxRow?.version ?? 0) + 1;

    if (data.activate) {
      await supabaseAdmin
        .from("chatbot_prompts")
        .update({ is_active: false })
        .eq("is_active", true);
    }

    const { error } = await supabaseAdmin.from("chatbot_prompts").insert({
      version: nextVersion,
      content: data.content,
      is_active: data.activate,
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true, version: nextVersion };
  });

export const activatePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("chatbot_prompts").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabaseAdmin
      .from("chatbot_prompts")
      .update({ is_active: true })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
