import { createFileRoute } from "@tanstack/react-router";
import { QuizzesManager } from "@/components/training/quizzes-manager";

export const Route = createFileRoute("/giang-day/bai-kiem-tra/")({
  component: () => <QuizzesManager detailBase="/giang-day/bai-kiem-tra/$id" />,
});
