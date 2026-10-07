import { createFileRoute } from "@tanstack/react-router";

/**
 * Lịch chạy ngầm (pg_cron, hàng tuần): nạp lại danh mục địa danh hành chính chuẩn.
 * Bảo vệ bằng khoá hệ thống: Authorization: Bearer <service key> (lấy từ kho bảo mật của DB).
 */
export const Route = createFileRoute("/api/public/hooks/geo-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
        if (!expected || !token || token !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const { runGeoSync } = await import("@/lib/catalog/geo-sync.server");
          const r = await runGeoSync("cron");
          return new Response(JSON.stringify({ success: true, ...r }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          console.error("[geo-sync] failed", e);
          return new Response(JSON.stringify({ success: false, error: String(e?.message ?? e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
