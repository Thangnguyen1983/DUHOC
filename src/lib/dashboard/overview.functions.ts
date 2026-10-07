import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission, type Permission as Perm } from "@/lib/rbac/guard";

/** Các vai trò được xem số liệu tổng quan toàn hệ thống trên trang /admin. */
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Số liệu tổng quan toàn hệ thống cho trang chủ quản trị (/admin).
 * Chỉ gộp phần lead / nội dung / khoá học / marketing.
 * Phần vận hành – đào tạo – visa dùng lại getOperationsOverview, không viết lại truy vấn.
 */
export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await assertPermission(context, "dashboard.view");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin;
    const now = new Date();
    const last30 = new Date(now.getTime() - 29 * 86400000);

    const [leads, entries, courses, orders, campaigns] = await Promise.all([
      sb.from("consultations")
        .select("id, full_name, phone, program, status, created_at, utm_source, market")
        .order("created_at", { ascending: false })
        .limit(1000),
      sb.from("cms_entries")
        .select("id, title, slug, status, published_at, updated_at, view_count, module")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(500),
      sb.from("courses").select("id, is_published, price_vnd"),
      sb.from("course_orders").select("id, status, total_vnd, created_at"),
      sb.from("marketing_campaigns").select("id, name, code, channel, market, is_active, starts_at, ends_at"),
    ]);

    const err = [leads, entries, courses, orders, campaigns].find((r: any) => r.error)?.error;
    if (err) throw new Error(err.message);

    const L = (leads.data ?? []) as any[];
    const E = (entries.data ?? []) as any[];
    const CO = (courses.data ?? []) as any[];
    const OR = (orders.data ?? []) as any[];
    const CA = (campaigns.data ?? []) as any[];

    // Chuỗi 30 ngày lead theo ngày
    const series: Array<{ date: string; label: string; count: number }> = [];
    const bucket = new Map<string, number>();
    for (const l of L) {
      if (!l.created_at) continue;
      const k = dayKey(new Date(l.created_at));
      bucket.set(k, (bucket.get(k) ?? 0) + 1);
    }
    for (let i = 0; i < 30; i++) {
      const d = new Date(last30.getTime() + i * 86400000);
      const k = dayKey(d);
      series.push({ date: k, label: `${d.getDate()}/${d.getMonth() + 1}`, count: bucket.get(k) ?? 0 });
    }

    const countBy = (rows: any[], field: string, limit = 8) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const key = (r[field] ?? "") || "khac";
        m.set(key, (m.get(key) ?? 0) + 1);
      }
      return [...m.entries()]
        .map(([key, count]) => ({ key, label: key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    };

    const leadsLast30 = L.filter((l) => l.created_at && new Date(l.created_at) >= last30);
    const paidOrders = OR.filter((o) => o.status === "paid");

    return {
      generatedAt: now.toISOString(),
      leads: {
        total: L.length,
        new: L.filter((l) => l.status === "new").length,
        contacted: L.filter((l) => l.status === "contacted").length,
        qualified: L.filter((l) => l.status === "qualified").length,
        done: L.filter((l) => l.status === "done").length,
        lost: L.filter((l) => l.status === "lost").length,
        last30: leadsLast30.length,
        series,
        bySource: countBy(leadsLast30, "utm_source", 6),
        byProgram: countBy(leadsLast30, "program", 6),
        recent: L.slice(0, 6).map((l) => ({
          id: l.id as string,
          name: (l.full_name ?? "") as string,
          phone: (l.phone ?? "") as string,
          program: (l.program ?? "") as string,
          status: (l.status ?? "new") as string,
          createdAt: l.created_at as string,
        })),
      },
      content: {
        total: E.length,
        published: E.filter((e) => e.status === "published").length,
        draft: E.filter((e) => e.status === "draft").length,
        scheduled: E.filter((e) => e.status === "scheduled").length,
        views: E.reduce((a, e) => a + (Number(e.view_count) || 0), 0),
        recent: E.slice(0, 6).map((e) => ({
          id: e.id as string,
          title: (e.title ?? "") as string,
          status: (e.status ?? "draft") as string,
          updatedAt: e.updated_at as string,
        })),
      },
      courses: {
        total: CO.length,
        published: CO.filter((c) => c.is_published).length,
        orders: OR.length,
        paidOrders: paidOrders.length,
        pendingOrders: OR.filter((o) => o.status === "pending").length,
        revenue: paidOrders.reduce((a, o) => a + (Number(o.total_vnd) || 0), 0),
      },
      marketing: {
        total: CA.length,
        running: CA.filter((c) => c.is_active).length,
        list: CA.slice(0, 5).map((c) => ({
          id: c.id as string,
          name: (c.name ?? "") as string,
          status: (c.is_active ? "Đang chạy" : "Tạm dừng") as string,
          channel: (c.channel ?? "") as string,
        })),
      },
    };
  });
