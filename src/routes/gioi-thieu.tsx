import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gioi-thieu")({
  beforeLoad: () => {
    throw redirect({ to: "/ve-kaizen", statusCode: 301 });
  },
  component: () => null,
});
