import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const HOT_PROGRAM_ICONS = [
  "Sparkles",
  "GraduationCap",
  "Briefcase",
  "Plane",
  "Languages",
  "Globe2",
  "Handshake",
  "Building2",
  "Users",
  "MapPin",
  "ShieldCheck",
  "Award",
] as const;
export type HotProgramIcon = (typeof HOT_PROGRAM_ICONS)[number];

export type HotProgram = {
  id: string;
  title: string;
  href: string;
  badge: string | null;
  icon: HotProgramIcon;
  position: number;
  active: boolean;
};

const HREF_RE = /^\/[A-Za-z0-9\-_/.?=&#%]*$/;

const writeSchema = z.object({
  title: z.string().trim().min(1, "Bắt buộc").max(80),
  href: z
    .string()
    .trim()
    .max(200)
    .refine((v) => HREF_RE.test(v), "Đường dẫn phải bắt đầu bằng / và an toàn"),
  badge: z
    .string()
    .trim()
    .max(16)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  icon: z.enum(HOT_PROGRAM_ICONS),
  active: z.boolean().optional().default(true),
});

async function assertEditor(context: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
  ]);
  if (!isAdmin && !isEditor) throw new Error("Chỉ admin/editor được thao tác");
}

export const listActiveHotPrograms = createServerFn({ method: "GET" }).handler(
  async (): Promise<HotProgram[]> => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await client
      .from("hot_programs")
      .select("id,title,href,badge,icon,position,active")
      .eq("active", true)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HotProgram[];
  },
);

export const listAllHotPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HotProgram[]> => {
    await assertEditor(context);
    const { data, error } = await context.supabase
      .from("hot_programs")
      .select("id,title,href,badge,icon,position,active")
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HotProgram[];
  });

export const createHotProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => writeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { data: maxRow } = await context.supabase
      .from("hot_programs")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = (maxRow?.position ?? -1) + 1;
    const { error } = await context.supabase.from("hot_programs").insert({
      title: data.title,
      href: data.href,
      badge: data.badge,
      icon: data.icon,
      active: data.active,
      position: nextPos,
    });
    if (error) throw error;
    return { ok: true };
  });

export const updateHotProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    writeSchema.extend({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("hot_programs")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteHotProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase
      .from("hot_programs")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reorderHotPrograms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    // Update positions sequentially (small list).
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await context.supabase
        .from("hot_programs")
        .update({ position: i })
        .eq("id", data.ids[i]);
      if (error) throw error;
    }
    return { ok: true };
  });
