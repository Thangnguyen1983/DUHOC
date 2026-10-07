import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payments/momo/return")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const orderId = url.searchParams.get("orderId") ?? "";
        const target = orderId ? `/hoc-vien/don-hang?order_no=${encodeURIComponent(orderId)}` : "/hoc-vien/don-hang";
        return new Response(null, { status: 302, headers: { Location: target } });
      },
    },
  },
});
