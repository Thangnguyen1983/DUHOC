import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payments/zalopay/return")({
  server: {
    handlers: {
      GET: async () => new Response(null, { status: 302, headers: { Location: "/hoc-vien/don-hang" } }),
    },
  },
});
