import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Lịch nhắc: sau khi tạo đơn 30 phút → 1 ngày → 3 ngày (tối đa 3 lần), rồi dừng.
const REMINDER_STEPS_MIN = [30, 24 * 60, 3 * 24 * 60];

export const Route = createFileRoute("/api/public/hooks/order-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");
        if (!token) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
        }
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabase = createClient(supabaseUrl, token, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Chỉ xét đơn pending trong 14 ngày, chưa vượt số lần nhắc, có email
        const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const { data: orders, error } = await supabase
          .from("course_orders")
          .select("id, order_no, customer_name, customer_email, total_vnd, reminder_count, last_reminder_at, created_at, items:course_order_items(title_snapshot, price_vnd, qty)")
          .eq("status", "pending")
          .not("customer_email", "is", null)
          .gt("created_at", cutoff)
          .lt("reminder_count", REMINDER_STEPS_MIN.length)
          .limit(200);
        if (error) {
          console.error("[reminders] query failed", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        const now = Date.now();
        const origin = process.env.PUBLIC_SITE_URL ?? "https://kaizen-duhoc-xkld.lovable.app";
        const { enqueueTransactionalEmail } = await import("@/lib/email/enqueue.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let sent = 0;
        for (const o of orders ?? []) {
          const stepIdx = o.reminder_count ?? 0;
          const dueAfterMs = REMINDER_STEPS_MIN[stepIdx] * 60 * 1000;
          const baseTs = o.last_reminder_at ? new Date(o.last_reminder_at).getTime() : new Date(o.created_at).getTime();
          if (now - baseTs < dueAfterMs) continue;

          if (!o.customer_email) continue;
          const res = await enqueueTransactionalEmail({
            templateName: "order-reminder",
            recipientEmail: o.customer_email,
            idempotencyKey: `order-reminder-${o.id}-${stepIdx + 1}`,
            templateData: {
              customerName: o.customer_name ?? undefined,
              orderNo: o.order_no,
              items: (o.items ?? []).map((i: any) => ({ title: i.title_snapshot, price_vnd: i.price_vnd, qty: i.qty })),
              totalVnd: o.total_vnd,
              checkoutUrl: `${origin}/thanh-toan/${o.id}`,
              reminderIndex: stepIdx + 1,
            },
          });
          if (res.ok) sent++;

          // Cập nhật counter dù enqueue có thành công hay không (tránh loop hồi vô hạn nếu suppressed)
          await supabaseAdmin.from("course_orders").update({
            reminder_count: stepIdx + 1,
            last_reminder_at: new Date().toISOString(),
          }).eq("id", o.id);
        }

        return new Response(
          JSON.stringify({ ok: true, scanned: orders?.length ?? 0, sent }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
