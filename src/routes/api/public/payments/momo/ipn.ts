import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payments/momo/ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json().catch(() => ({}));
        console.log("[momo/ipn] received:", JSON.stringify(payload).slice(0, 500));

        const { verifyCallback } = await import("@/lib/payments/index.server");
        const result = await verifyCallback("momo", payload as Record<string, unknown>);
        if (!result.ok) {
          console.warn("[momo/ipn] invalid signature for orderId:", result.orderNo);
          return Response.json({ resultCode: 1, message: "Invalid signature" }, { status: 401 });
        }

        if (!result.orderNo) return Response.json({ resultCode: 0, message: "success" });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("course_orders")
          .select("id")
          .eq("order_no", result.orderNo)
          .maybeSingle();

        if (!order) {
          console.warn("[momo/ipn] order not found:", result.orderNo);
          return Response.json({ resultCode: 0, message: "success" });
        }

        const { markOrderPaid, markOrderFailed } = await import("@/lib/courses/orders.impl.server");
        try {
          if (result.status === "paid") {
            await markOrderPaid(order.id, {
              provider: "momo",
              providerRef: result.providerRef,
              amountVnd: result.amountVnd,
              rawPayload: payload as Record<string, unknown>,
            });
          } else if (result.status === "failed") {
            await markOrderFailed(order.id, {
              provider: "momo",
              providerRef: result.providerRef,
              rawPayload: payload as Record<string, unknown>,
              reason: `resultCode=${(payload as any)?.resultCode}`,
            });
          }
        } catch (e: any) {
          console.error("[momo/ipn] processing error:", e?.message);
          return Response.json({ resultCode: 99, message: e?.message ?? "error" }, { status: 500 });
        }
        return Response.json({ resultCode: 0, message: "success" });
      },
    },
  },
});
