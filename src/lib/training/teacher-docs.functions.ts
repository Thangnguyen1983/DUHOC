import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

const BUCKET = "teacher-docs";

async function assertManager(ctx: { supabase: any; userId: string }) {
  return assertPermission(ctx, "teachers.manage");
}

export const listTeacherDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ teacher_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertManager(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("teacher_documents")
      .select("*")
      .eq("teacher_id", data.teacher_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  teacher_id: z.string().uuid(),
  doc_type: z.enum(["cv", "degree", "certificate", "other"]).default("other"),
  title: z.string().min(1).max(200),
  file_base64: z.string().min(1).max(28_000_000).optional(),
  file_name: z.string().max(255).optional(),
  mime_type: z.string().max(120).optional(),
  issued_at: z.string().max(20).nullable().optional(),
  expires_at: z.string().max(20).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

export const saveTeacherDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertManager(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: any = {
      teacher_id: data.teacher_id,
      doc_type: data.doc_type,
      title: data.title,
      issued_at: data.issued_at || null,
      expires_at: data.expires_at || null,
      note: data.note || null,
    };

    if (data.file_base64) {
      const bytes = Uint8Array.from(atob(data.file_base64), (c) => c.charCodeAt(0));
      const ext = (data.file_name?.split(".").pop() ?? "bin").toLowerCase().slice(0, 8);
      const path = `${data.teacher_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: data.mime_type || "application/octet-stream", upsert: false });
      if (upErr) throw new Error(upErr.message);
      patch.file_path = path;
      patch.file_name = data.file_name ?? null;
      patch.mime_type = data.mime_type ?? null;
      patch.size_bytes = bytes.byteLength;
    }

    if (data.id) {
      const { error } = await supabaseAdmin.from("teacher_documents").update(patch as any).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    if (!patch.file_path) throw new Error("Vui lòng chọn tệp để tải lên");
    const { error } = await supabaseAdmin
      .from("teacher_documents")
      .insert({ ...patch, created_by: context.userId } as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTeacherDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertManager(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("teacher_documents").select("file_path").eq("id", data.id).maybeSingle();
    if (row?.file_path) await supabaseAdmin.storage.from(BUCKET).remove([row.file_path]);
    const { error } = await supabaseAdmin.from("teacher_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getTeacherDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertManager(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("teacher_documents").select("file_path").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(BUCKET).createSignedUrl(row.file_path, 300);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl };
  });
