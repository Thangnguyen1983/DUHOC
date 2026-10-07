import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PageBannerStat = { label: string; value: string };

export type PageBanner = {
  id: string;
  page_key: string;
  label: string;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  overlay: "dark" | "brand" | "light";
  /** "overlay" = chữ đè lên ảnh; "image" = ảnh thuần 100%, chữ nằm dưới ảnh. */
  layout: "overlay" | "image";
  badge_label: string | null;
  badge_icon: string | null;
  cta_primary_label: string | null;
  cta_primary_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  stats: PageBannerStat[];
  is_active: boolean;
  updated_at: string;
};

const SELECT_COLS =
  "id,page_key,label,eyebrow,title,description,image_url,overlay,layout,badge_label,badge_icon,cta_primary_label,cta_primary_href,cta_secondary_label,cta_secondary_href,stats,is_active,updated_at";

function normalize(row: any): PageBanner {
  return {
    ...row,
    overlay: (row.overlay ?? "dark") as PageBanner["overlay"],
    layout: (row.layout ?? "overlay") as PageBanner["layout"],
    stats: Array.isArray(row.stats) ? (row.stats as PageBannerStat[]) : [],
  };
}

/** PUBLIC: đọc 1 banner đang active theo page_key. Dùng cho loader. */
export const getPageBanner = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ page_key: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data }): Promise<PageBanner | null> => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: row, error } = await supabase
      .from("page_banners")
      .select(SELECT_COLS)
      .eq("page_key", data.page_key)
      .eq("is_active", true)
      .maybeSingle();
    if (error) return null;
    return row ? normalize(row) : null;
  });

/** ADMIN: danh sách toàn bộ (kể cả inactive) */
export const listAllPageBanners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PageBanner[]> => {
    const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
    ]);
    if (!isAdmin && !isEditor) throw new Error("Không có quyền truy cập");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("page_banners")
      .select(SELECT_COLS)
      .order("label", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(normalize);
  });

const upsertSchema = z.object({
  page_key: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(200),
  eyebrow: z.string().trim().max(120).nullish(),
  title: z.string().trim().max(300).nullish(),
  description: z.string().trim().max(800).nullish(),
  image_url: z.string().trim().max(2000).nullish(),
  overlay: z.enum(["dark", "brand", "light"]).default("dark"),
  layout: z.enum(["overlay", "image"]).default("overlay"),
  badge_label: z.string().trim().max(80).nullish(),
  badge_icon: z.string().trim().max(20).nullish(),
  cta_primary_label: z.string().trim().max(80).nullish(),
  cta_primary_href: z.string().trim().max(500).nullish(),
  cta_secondary_label: z.string().trim().max(80).nullish(),
  cta_secondary_href: z.string().trim().max(500).nullish(),
  stats: z
    .array(z.object({ label: z.string().max(80), value: z.string().max(80) }))
    .max(4)
    .default([]),
  is_active: z.boolean().default(true),
});

export const upsertPageBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
    ]);
    if (!isAdmin && !isEditor) throw new Error("Không có quyền");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, updated_by: context.userId, updated_at: new Date().toISOString() };
    const { error } = await supabaseAdmin
      .from("page_banners")
      .upsert(payload as any, { onConflict: "page_key" });
    if (error) throw error;
    return { ok: true };
  });

export const togglePageBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ page_key: z.string(), is_active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
    ]);
    if (!isAdmin && !isEditor) throw new Error("Không có quyền");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("page_banners")
      .update({ is_active: data.is_active })
      .eq("page_key", data.page_key);
    if (error) throw error;
    return { ok: true };
  });

export const deletePageBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ page_key: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin được xoá");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("page_banners")
      .delete()
      .eq("page_key", data.page_key);
    if (error) throw error;
    return { ok: true };
  });

/** Danh mục preset để admin biết trang nào có sẵn để cấu hình. */
export const PAGE_BANNER_PRESETS: { key: string; label: string; group: string }[] = [
  { key: "du-hoc", label: "Trang Du học (tổng)", group: "Trang tổng" },
  { key: "xkld", label: "Trang XKLĐ (tổng)", group: "Trang tổng" },
  { key: "ngoai-ngu", label: "Trang Ngoại ngữ (tổng)", group: "Trang tổng" },
  { key: "outsourcing", label: "Trang Doanh nghiệp", group: "Trang tổng" },
  { key: "cau-chuyen", label: "Câu chuyện học viên", group: "Trang tổng" },
  { key: "doi-tac", label: "Đối tác", group: "Trang tổng" },
  { key: "doi-tac.truong", label: "Trường đối tác", group: "Trang tổng" },
  { key: "ve-kaizen", label: "Về KAIZEN", group: "Trang tổng" },
  { key: "lien-he", label: "Liên hệ", group: "Trang tổng" },
  { key: "tin-tuc", label: "Tin tức", group: "Trang tổng" },
  // XKLĐ chi tiết
  { key: "xkld:nhat-ban", label: "XKLĐ Nhật Bản", group: "XKLĐ chi tiết" },
  { key: "xkld:han-quoc", label: "XKLĐ Hàn Quốc", group: "XKLĐ chi tiết" },
  { key: "xkld:dai-loan", label: "XKLĐ Đài Loan", group: "XKLĐ chi tiết" },
  { key: "xkld:duc", label: "XKLĐ CHLB Đức", group: "XKLĐ chi tiết" },
  { key: "xkld:hungary", label: "XKLĐ Hungary", group: "XKLĐ chi tiết" },
  { key: "xkld:ba-lan", label: "XKLĐ Ba Lan", group: "XKLĐ chi tiết" },
  { key: "xkld:romania", label: "XKLĐ Romania", group: "XKLĐ chi tiết" },
  { key: "xkld:slovakia", label: "XKLĐ Slovakia", group: "XKLĐ chi tiết" },
  { key: "xkld:latvia", label: "XKLĐ Latvia", group: "XKLĐ chi tiết" },
  { key: "xkld:bulgaria", label: "XKLĐ Bulgaria", group: "XKLĐ chi tiết" },
  // Ngoại ngữ
  { key: "ngoai-ngu:tieng-nhat", label: "Tiếng Nhật", group: "Ngoại ngữ" },
  { key: "ngoai-ngu:tieng-han", label: "Tiếng Hàn", group: "Ngoại ngữ" },
  { key: "ngoai-ngu:tieng-duc", label: "Tiếng Đức", group: "Ngoại ngữ" },
  { key: "ngoai-ngu:tieng-trung", label: "Tiếng Trung", group: "Ngoại ngữ" },
  { key: "ngoai-ngu:tieng-anh", label: "Tiếng Anh", group: "Ngoại ngữ" },
  // Du học
  { key: "du-hoc:han-quoc", label: "Du học Hàn Quốc", group: "Du học chi tiết" },
  { key: "du-hoc:nhat-ban", label: "Du học Nhật Bản", group: "Du học chi tiết" },
  { key: "du-hoc:dai-loan", label: "Du học Đài Loan", group: "Du học chi tiết" },
  { key: "du-hoc:duc", label: "Du học CHLB Đức", group: "Du học chi tiết" },
  { key: "du-hoc:canada", label: "Du học Canada", group: "Du học chi tiết" },
  { key: "du-hoc:uc", label: "Du học Úc", group: "Du học chi tiết" },
  { key: "du-hoc:anh", label: "Du học Anh", group: "Du học chi tiết" },
  { key: "du-hoc:my", label: "Du học Mỹ", group: "Du học chi tiết" },
];
