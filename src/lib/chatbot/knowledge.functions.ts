import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CategoryEnum = z.enum([
  "du_hoc",
  "xkld",
  "ngoai_ngu",
  "outsourcing",
  "cong_ty",
  "phap_ly",
  "khac",
]);
const StatusEnum = z.enum(["draft", "pending", "approved", "archived"]);

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  category: CategoryEnum,
  title: z.string().trim().min(2).max(200),
  content: z.string().trim().min(2).max(8000),
  keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  priority: z.number().int().min(0).max(100).default(0),
  status: StatusEnum.default("draft"),
  is_active: z.boolean().default(true),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const listKnowledge = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("chatbot_knowledge")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return { items: data ?? [] };
  });

export const getKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("chatbot_knowledge")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw error;
    return { item: row };
  });

export const upsertKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("chatbot_knowledge")
        .update({
          category: data.category,
          title: data.title,
          content: data.content,
          keywords: data.keywords,
          priority: data.priority,
          status: data.status,
          is_active: data.is_active,
        })
        .eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("chatbot_knowledge")
      .insert({
        category: data.category,
        title: data.title,
        content: data.content,
        keywords: data.keywords,
        priority: data.priority,
        status: data.status,
        is_active: data.is_active,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const approveKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("chatbot_knowledge")
      .update({
        status: "approved",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("chatbot_knowledge")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
