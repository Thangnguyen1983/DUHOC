import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

const MANAGE_ROLES: Perm[] = ["catalog.manage"];
const DOC_TYPE_ROLES: Perm[] = ["catalog.manage", "visa.edit"];
const READ_ROLES: Perm[] = ["catalog.view"];
const ADMIN_ROLES: Perm[] = ["users.manage"];

async function assertAnyRole(ctx: { supabase: any; userId: string }, allowed: readonly string[]) {
  return assertPermission(ctx, ...(allowed as Perm[]));
}

/* ================= Danh mục tổng hợp ================= */
export const getCatalogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, READ_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [langs, docTypes, stages] = await Promise.all([
      supabaseAdmin.from("catalog_languages").select("*").order("sort_order"),
      supabaseAdmin.from("catalog_document_types").select("*").order("market", { nullsFirst: true }).order("sort_order"),
      supabaseAdmin.from("catalog_training_stages").select("*").order("order_index"),
    ]);
    return {
      languages: langs.data ?? [],
      documentTypes: docTypes.data ?? [],
      stages: stages.data ?? [],
    };
  });

/* ================= Ngoại ngữ ================= */
const languageSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  flag: z.string().max(16).nullable().optional(),
  tagline: z.string().max(300).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  levels: z.array(z.string().max(120)).default([]),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const upsertLanguage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => languageSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const q = id
      ? supabaseAdmin.from("catalog_languages").update(rest).eq("id", id)
      : supabaseAdmin.from("catalog_languages").insert(rest);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLanguage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("catalog_languages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ================= Loại hồ sơ theo thị trường ================= */
const docTypeSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  market: z.string().max(60).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  program_type: z.enum(["du_hoc", "xkld", "thuc_tap_sinh"]).nullable().optional(),
  stage: z.enum(["dang_ky", "dao_tao", "visa", "xuat_canh", "sau_xuat_canh"]).default("dang_ky"),
  default_validity_months: z.number().int().min(0).max(600).nullable().optional(),
});

export const upsertDocumentType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => docTypeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, DOC_TYPE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      market: rest.market || null,
      program_type: rest.program_type || null,
      default_validity_months: rest.default_validity_months ?? null,
    };
    const q = id
      ? supabaseAdmin.from("catalog_document_types").update(payload).eq("id", id)
      : supabaseAdmin.from("catalog_document_types").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDocumentType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, DOC_TYPE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("catalog_document_types").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ================= Giai đoạn đào tạo ================= */
const stageSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  description: z.string().max(1000).nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const upsertStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => stageSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const q = id
      ? supabaseAdmin.from("catalog_training_stages").update(rest).eq("id", id)
      : supabaseAdmin.from("catalog_training_stages").insert(rest);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, MANAGE_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("catalog_training_stages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ================= Phòng ban & chức danh ================= */
const departmentSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  description: z.string().max(500).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  market_code: z.string().max(60).nullable().optional(),
  function_note: z.string().max(500).nullable().optional(),
  program_type: z.enum(["du_hoc", "xkld", "dao_tao", "ho_tro"]).nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

const jobTitleSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const listDepartments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, READ_ROLES);
    const { data, error } = await context.supabase
      .from("catalog_departments")
      .select("*")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => departmentSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, ADMIN_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, parent_id: rest.parent_id || null };
    const q = id
      ? supabaseAdmin.from("catalog_departments").update(payload).eq("id", id)
      : supabaseAdmin.from("catalog_departments").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, ADMIN_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("catalog_departments")
      .update({ is_active: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listJobTitles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAnyRole(context, READ_ROLES);
    const { data, error } = await context.supabase
      .from("catalog_job_titles")
      .select("*")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertJobTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => jobTitleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, ADMIN_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const q = id
      ? supabaseAdmin.from("catalog_job_titles").update(rest).eq("id", id)
      : supabaseAdmin.from("catalog_job_titles").insert(rest);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteJobTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAnyRole(context, ADMIN_ROLES);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("catalog_job_titles")
      .update({ is_active: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
