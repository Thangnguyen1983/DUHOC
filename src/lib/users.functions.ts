import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { ROLE_KEYS, type AppRole } from "@/lib/rbac/catalog";

const APP_ROLES = ROLE_KEYS as unknown as readonly AppRole[];
const roleSchema = z.enum(ROLE_KEYS as [AppRole, ...AppRole[]]);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden — chỉ admin được phép thao tác");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const all: any[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      all.push(...data.users);
      if (data.users.length < 200) break;
      page += 1;
      if (page > 25) break;
    }

    const ids = all.map((u) => u.id);
    const [{ data: roles }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, department_id, job_title_id")
        .in("id", ids),
    ]);
    const rolesById = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesById.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesById.set(r.user_id, arr);
    });
    const profileById = new Map<string, { full_name: string; department_id: string | null; job_title_id: string | null }>();
    (profiles ?? []).forEach((p: any) =>
      profileById.set(p.id, {
        full_name: p.full_name ?? "",
        department_id: p.department_id ?? null,
        job_title_id: p.job_title_id ?? null,
      }),
    );

    const items = all.map((u) => {
      const profile = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        full_name: profile?.full_name ?? (u.user_metadata?.full_name ?? ""),
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        banned_until: (u as any).banned_until ?? null,
        roles: rolesById.get(u.id) ?? [],
        department_id: profile?.department_id ?? null,
        job_title_id: profile?.job_title_id ?? null,
      };
    });
    items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return { items, currentUserId: context.userId };
  });

export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), roles: z.array(roleSchema) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wanted = Array.from(new Set(data.roles));

    // Xoá các vai trò không còn được chọn (không xoá sạch để tránh đụng độ khi tick nhanh)
    let del = supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    if (wanted.length > 0) del = del.not("role", "in", `(${wanted.join(",")})`);
    const { error: delErr } = await del;
    if (delErr) throw new Error(delErr.message);

    if (wanted.length > 0) {
      const rows = wanted.map((role) => ({ user_id: data.user_id, role }));
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert(rows, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email(),
      full_name: z.string().trim().min(1).max(200).optional().or(z.literal("")),
      roles: z.array(roleSchema).default([]),
      department_id: z.string().uuid().nullable().optional().or(z.literal("")),
      job_title_id: z.string().uuid().nullable().optional().or(z.literal("")),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { OFFICIAL_SITE_URL } = await import("@/lib/site-url");
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: data.full_name ? { full_name: data.full_name } : undefined,
      redirectTo: `${OFFICIAL_SITE_URL}/accept-invite`,
    } as any);
    if (error) throw new Error(error.message);
    const userId = invited.user?.id;
    if (userId && data.roles.length > 0) {
      const rows = Array.from(new Set(data.roles)).map((role) => ({ user_id: userId, role }));
      await supabaseAdmin.from("user_roles").insert(rows);
    }
    if (userId && data.full_name) {
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        full_name: data.full_name,
        department_id: data.department_id || null,
        job_title_id: data.job_title_id || null,
      });
    }
    return { ok: true, user_id: userId };
  });

export const sendResetLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid(), redirect_to: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: user, error: e1 } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (e1 || !user.user?.email) throw new Error("Không tìm thấy email user");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(user.user.email, {
      redirectTo: data.redirect_to,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserBanned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid(), banned: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("Không thể tự khoá chính mình");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      ban_duration: data.banned ? "876000h" : "none",
    } as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("Không thể tự xoá chính mình");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const createUserWithPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(8).max(128),
      full_name: z.string().trim().min(1).max(200).optional().or(z.literal("")),
      roles: z.array(roleSchema).default([]),
      email_confirm: z.boolean().default(true),
      department_id: z.string().uuid().nullable().optional().or(z.literal("")),
      job_title_id: z.string().uuid().nullable().optional().or(z.literal("")),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Nếu email đã tồn tại → chỉ cập nhật roles + optionally reset password
    const emailLower = data.email.toLowerCase();
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing.users.find((u) => (u.email ?? "").toLowerCase() === emailLower);

    let userId = found?.id;
    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: data.email_confirm,
        user_metadata: data.full_name ? { full_name: data.full_name } : undefined,
      });
      if (error) throw new Error(error.message);
      userId = created.user?.id;
    } else {
      // update password + confirm status
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        email_confirm: data.email_confirm,
      } as any);
    }

    if (!userId) throw new Error("Không tạo được user");

    if (data.full_name) {
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        full_name: data.full_name,
        department_id: data.department_id || null,
        job_title_id: data.job_title_id || null,
      });
    }

    if (data.roles.length > 0) {
      // Thay toàn bộ roles để bằng danh sách yêu cầu
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      const rows = Array.from(new Set(data.roles)).map((role) => ({ user_id: userId!, role }));
      const { error: e2 } = await supabaseAdmin.from("user_roles").insert(rows);
      if (e2) throw new Error(e2.message);
    }

    return { ok: true, user_id: userId, existed: !!found };
  });

/** Cập nhật thông tin cá nhân / nhân sự của một tài khoản. */
export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      full_name: z.string().trim().min(1).max(200),
      department_id: z.string().uuid().nullable().optional().or(z.literal("")),
      job_title_id: z.string().uuid().nullable().optional().or(z.literal("")),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: data.user_id,
      full_name: data.full_name,
      department_id: data.department_id || null,
      job_title_id: data.job_title_id || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const AVAILABLE_ROLES = APP_ROLES;

/** Admin đặt trực tiếp mật khẩu mới cho một tài khoản. */
export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(128),
        email_confirm: z.boolean().default(true),
        sign_out_other_sessions: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: found, error: e1 } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (e1 || !found?.user) throw new Error("Không tìm thấy tài khoản");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
      ...(data.email_confirm ? { email_confirm: true } : {}),
    } as any);
    if (error) throw new Error(error.message);

    if (data.sign_out_other_sessions) {
      try {
        await (supabaseAdmin.auth.admin as any).signOut(data.user_id, "global");
      } catch {
        /* không critical */
      }
    }

    return { ok: true, email: found.user.email ?? "" };
  });
