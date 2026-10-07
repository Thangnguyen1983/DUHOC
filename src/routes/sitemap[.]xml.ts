import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { HAN_QUOC_GUIDES } from "@/lib/han-quoc/guides";
import { HAN_QUOC_PARTNERS } from "@/lib/han-quoc/partners";

const BASE_URL = "https://kaizenmanpower.com";

const XKLD_COUNTRIES = ["nhat-ban", "han-quoc", "dai-loan", "duc", "hungary", "ba-lan", "romania", "slovakia", "latvia", "bulgaria"];
const STUDY_COUNTRIES = ["han-quoc", "dai-loan", "nhat-ban", "duc", "canada", "uc", "anh", "my"];
const LANGS = ["nhat", "han", "trung", "anh", "duc"];

type SitemapEntry = { path: string; priority?: string; changefreq?: string; lastmod?: string };

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths: SitemapEntry[] = [
          { path: "/", priority: "1.0", changefreq: "weekly" },
          { path: "/ve-kaizen", priority: "0.9", changefreq: "monthly" },
          { path: "/ve-kaizen/founder", priority: "0.8" },
          { path: "/ve-kaizen/phap-ly", priority: "0.8" },
          { path: "/ve-kaizen/hanh-trinh", priority: "0.8" },
          { path: "/ve-kaizen/thu-vien", priority: "0.7" },
          { path: "/gioi-thieu", priority: "0.5" },
          { path: "/xkld", priority: "0.9", changefreq: "weekly" },
          { path: "/du-hoc", priority: "0.9", changefreq: "weekly" },
          { path: "/ngoai-ngu", priority: "0.8" },
          { path: "/outsourcing", priority: "0.7" },
          { path: "/doi-tac", priority: "0.7" },
          { path: "/doi-tac/truong", priority: "0.7", changefreq: "weekly" },
          { path: "/cau-chuyen", priority: "0.7", changefreq: "weekly" },
          { path: "/tin-tuc", priority: "0.8", changefreq: "daily" },

          { path: "/du-lich-visa", priority: "0.6" },
          { path: "/lien-he", priority: "0.7" },
          { path: "/dang-ky", priority: "0.8" },
          { path: "/dieu-khoan", priority: "0.3" },
          { path: "/chinh-sach-bao-mat", priority: "0.3" },
          { path: "/khoa-hoc", priority: "0.9", changefreq: "weekly" },
        ];

        for (const c of XKLD_COUNTRIES) paths.push({ path: `/xkld/${c}`, priority: "0.8", changefreq: "weekly" });
        for (const c of STUDY_COUNTRIES) paths.push({ path: `/du-hoc/${c}`, priority: "0.8", changefreq: "weekly" });
        for (const l of LANGS) paths.push({ path: `/ngoai-ngu/${l}`, priority: "0.7" });

        // Du học Hàn Quốc — landing chuyên biệt + chuyên mục
        paths.push({ path: "/du-hoc/han-quoc/cam-nang", priority: "0.8", changefreq: "weekly" });
        paths.push({ path: "/du-hoc/han-quoc/cau-chuyen", priority: "0.7" });
        for (const g of HAN_QUOC_GUIDES) paths.push({ path: `/du-hoc/han-quoc/cam-nang/${g.slug}`, priority: "0.7" });
        for (const p of HAN_QUOC_PARTNERS) paths.push({ path: `/du-hoc/han-quoc/truong/${p.slug}`, priority: "0.7" });

        // CMS: bài viết, câu chuyện, trường (từ CMS tập trung)
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const cmsSources: Array<{
            typeSlugs: string[];
            base: string;
            priority: string;
            changefreq?: string;
          }> = [
            { typeSlugs: ["blog", "post"], base: "/tin-tuc", priority: "0.7", changefreq: "weekly" },
            { typeSlugs: ["success_story"], base: "/cau-chuyen", priority: "0.6" },
            { typeSlugs: ["school"], base: "/doi-tac/truong", priority: "0.6" },
          ];

          for (const src of cmsSources) {
            const { data: types } = await supabaseAdmin
              .from("cms_content_types")
              .select("id,slug")
              .in("slug", src.typeSlugs as any);
            const typeIds = (types ?? []).map((t: any) => t.id);
            if (typeIds.length === 0) continue;

            const { data: rows } = await (supabaseAdmin.from("cms_entries") as any)
              .select("slug,updated_at,published_at")
              .in("content_type_id", typeIds)
              .eq("status", "published")
              .is("deleted_at", null)
              .order("published_at", { ascending: false })
              .limit(1000);

            const seen = new Set<string>();
            for (const r of rows ?? []) {
              if (!r.slug || seen.has(r.slug)) continue;
              seen.add(r.slug);
              const iso = r.updated_at ?? r.published_at;
              paths.push({
                path: `${src.base}/${r.slug}`,
                priority: src.priority,
                changefreq: src.changefreq,
                lastmod: iso ? new Date(iso).toISOString().slice(0, 10) : undefined,
              });
            }
          }
        } catch {
          // ignore — sitemap vẫn render các trang tĩnh
        }

        // Khoá học trực tuyến đã xuất bản
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: courses } = await supabaseAdmin
            .from("courses")
            .select("slug, updated_at, published_at")
            .eq("is_published", true)
            .limit(500);
          for (const c of courses ?? []) {
            if (!(c as any).slug) continue;
            const iso = (c as any).updated_at ?? (c as any).published_at;
            paths.push({
              path: `/khoa-hoc/${(c as any).slug}`,
              priority: "0.8",
              changefreq: "weekly",
              lastmod: iso ? new Date(iso).toISOString().slice(0, 10) : undefined,
            });
          }
        } catch {
          // ignore
        }

        const urls = paths
          .map((e) => {
            const parts = [`  <url>`, `    <loc>${BASE_URL}${e.path}</loc>`];
            if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
            if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
            if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
            parts.push(`  </url>`);
            return parts.join("\n");
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
