import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /_authenticated\n\nSitemap: https://kaizenmanpower.com/sitemap.xml\n`,
          { headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=3600" } },
        ),
    },
  },
});
