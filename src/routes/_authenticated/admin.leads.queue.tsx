import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/leads/queue")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/leads", search: { tab: "queue" } });
  },
});
