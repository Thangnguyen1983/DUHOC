import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payments/zalopay/ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json().catch(() => ({}));
        console.log("[zalopay/ipn] received:", JSON.stringify(payload).slice(0, 500));

        const { verifyCallback } = await import("@/lib/payments/index.server");
        const result = await verifyCallback("zalopay", payload as Record<string, unknown>);
        if (!result.ok) {
          console.warn("[zalopay/ipn] invalid mac");
          return Response.json({ return_code: -1, return_message: "mac invalid" });
        }

        if (!result.orderNo) return Response.json({ return_code: 1, return_message: "success" });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("course_orders")
          .select("id")
          .eq("order_no", result.orderNo)
          .maybeSingle();

        if (!order) {
          console.warn("[zalopay/ipn] order not found:", result.orderNo);
          return Response.json({ return_code: 1, return_message: "success" });
        }

        const { markOrderPaid } = await import("@/lib/courses/orders.impl.server");
        try {
          if (result.status === "paid") {
            await markOrderPaid(order.id, {
              provider: "zalopay",
              providerRef: result.providerRef,
              amountVnd: result.amountVnd,
              rawPayload: payload as Record<string, unknown>,
            });
          }
        } catch (e: any) {
          console.error("[zalopay/ipn] processing error:", e?.message);
          return Response.json({ return_code: 0, return_message: e?.message ?? "error" });
        }
        return Response.json({ return_code: 1, return_message: "success" });
      },
    },
  },
});
