import { createFileRoute } from "@tanstack/react-router";
import { QuizzesManager } from "@/components/training/quizzes-manager";

export const Route = createFileRoute("/_authenticated/admin/quizzes/")({
  component: () => <QuizzesManager detailBase="/admin/quizzes/$id" />,
});
