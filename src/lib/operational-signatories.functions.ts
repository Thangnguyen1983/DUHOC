import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/rbac/guard";

export const getOperationalSignatories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPermission(context, "users.manage", "system.diagnostics");
    const { data, error } = await context.supabase.from("operational_signatories")
      .select("orientation_approver_user_id,handover_signer_user_id").eq("id", true).maybeSingle();
    if (error) throw error;
    if (!data) return { orientation_approver_user_id: null, handover_signer_user_id: null, handover_signer_name: null };
    const signerId = data.handover_signer_user_id;
    const { data: profile } = signerId
      ? await context.supabase.from("profiles").select("full_name").eq("id", signerId).maybeSingle()
      : { data: null };
    return { ...data, handover_signer_name: profile?.full_name ?? null };
  });

export const saveOperationalSignatories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.object({
    orientation_approver_user_id: z.string().uuid().nullable(),
    handover_signer_user_id: z.string().uuid().nullable(),
  }).parse(value))
  .handler(async ({ context, data }) => {
    await assertPermission(context, "users.manage");
    const ids = [...new Set([data.orientation_approver_user_id, data.handover_signer_user_id].filter((id): id is string => !!id))];
    if (ids.length) {
      const { data: profiles, error } = await context.supabase.from("profiles").select("id").in("id", ids);
      if (error) throw error;
      if (profiles?.length !== ids.length) throw new Error("Người được chọn không còn trong danh sách nhân sự");
    }
    const { error } = await context.supabase.from("operational_signatories").upsert({
      id: true, ...data, updated_by: context.userId, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { ok: true };
  });