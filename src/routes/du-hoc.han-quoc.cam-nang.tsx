import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/du-hoc/han-quoc/cam-nang")({
  component: () => <Outlet />,
});
