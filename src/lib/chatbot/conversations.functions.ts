import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("chat_conversations")
      .select("id, started_at, last_message_at, message_count, lead_captured, ip_hash, user_agent")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: conv }, { data: messages }, { data: leads }] = await Promise.all([
      supabaseAdmin.from("chat_conversations").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("chat_messages")
        .select("id, role, content, has_cta, created_at")
        .eq("conversation_id", data.id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("consultations")
        .select("id, full_name, phone, email, program, market, status, created_at")
        .eq("conversation_id", data.id),
    ]);
    return { conversation: conv, messages: messages ?? [], leads: leads ?? [] };
  });
