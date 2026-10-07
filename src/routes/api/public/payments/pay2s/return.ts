import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payments/pay2s/return")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const orderNo = url.searchParams.get("order_no") ?? "";
        const target = orderNo
          ? `/hoc-vien/don-hang?order_no=${encodeURIComponent(orderNo)}`
          : "/hoc-vien/don-hang";
        return new Response(null, { status: 302, headers: { Location: target } });
      },
    },
  },
});
