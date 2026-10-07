import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payments/pay2s/ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json().catch(() => ({}));
        console.log("[pay2s/ipn] received:", JSON.stringify(payload).slice(0, 500));

        const { verifyCallback } = await import("@/lib/payments/index.server");
        const result = await verifyCallback("pay2s", payload as Record<string, unknown>);
        if (!result.ok) {
          console.warn("[pay2s/ipn] invalid signature for order_no:", result.orderNo);
          return new Response("Invalid signature", { status: 401 });
        }

        if (!result.orderNo) return Response.json({ ok: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("course_orders")
          .select("id")
          .eq("order_no", result.orderNo)
          .maybeSingle();

        if (!order) {
          console.warn("[pay2s/ipn] order not found:", result.orderNo);
          return Response.json({ ok: true });
        }

        const { markOrderPaid, markOrderFailed } = await import("@/lib/courses/orders.impl.server");
        try {
          if (result.status === "paid") {
            await markOrderPaid(order.id, {
              provider: "pay2s",
              providerRef: result.providerRef,
              amountVnd: result.amountVnd,
              rawPayload: payload as Record<string, unknown>,
            });
          } else if (result.status === "failed") {
            await markOrderFailed(order.id, {
              provider: "pay2s",
              providerRef: result.providerRef,
              rawPayload: payload as Record<string, unknown>,
              reason: "provider reported failed",
            });
          }
        } catch (e: any) {
          console.error("[pay2s/ipn] processing error:", e?.message);
          return new Response(e?.message ?? "processing error", { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
