import { createFileRoute } from "@tanstack/react-router";
import { MaterialsManager } from "@/components/training/materials-manager";

export const Route = createFileRoute("/giang-day/tai-lieu")({
  component: () => <MaterialsManager teacherMode subtitle="Tài liệu của chương trình và lớp bạn phụ trách — gửi duyệt để dùng cho học viên và trình chiếu" />,
});
