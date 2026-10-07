import { createFileRoute, redirect } from "@tanstack/react-router";

// Lịch trung tâm đã gộp thành thẻ trong trang Giám sát lớp học.
// Giữ route này để chuyển hướng liên kết cũ, không phá đường dẫn đã lưu.
export const Route = createFileRoute("/_authenticated/admin/training/schedule")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/training/oversight", search: { tab: "lich" } });
  },
  component: () => null,
});
