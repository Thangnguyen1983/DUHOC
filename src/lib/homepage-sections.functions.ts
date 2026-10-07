import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type HeroSectionData = {
  eyebrow?: string;
  headline_prefix?: string;
  headline_suffix?: string;
  subheadline?: string;
  primary_cta?: { label: string; to: string };
  secondary_cta?: { label: string; to: string };
  stats?: Array<{ value: string; label: string }>;
};

export type UspPillar = { icon: string; title: string; desc: string };
export type UspSectionData = { pillars?: UspPillar[] };

export type CtaSectionData = {
  eyebrow?: string;
  headline?: string;
  description?: string;
  show_hotline?: boolean;
};

export type HomepageSections = {
  hero: HeroSectionData | null;
  usp: UspSectionData | null;
  cta: CtaSectionData | null;
};

export const getHomepageSections = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomepageSections> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data: ct } = await supabase
      .from("cms_content_types")
      .select("id")
      .eq("slug", "homepage_section")
      .maybeSingle();

    if (!ct) return { hero: null, usp: null, cta: null };

    const { data: rows } = await supabase
      .from("cms_entries")
      .select("slug, data")
      .eq("content_type_id", ct.id)
      .eq("status", "published")
      .is("deleted_at", null)
      .in("slug", ["hero", "usp", "cta"]);

    const by = new Map((rows ?? []).map((r) => [r.slug, r.data as any]));
    return {
      hero: (by.get("hero") as HeroSectionData) ?? null,
      usp: (by.get("usp") as UspSectionData) ?? null,
      cta: (by.get("cta") as CtaSectionData) ?? null,
    };
  },
);
