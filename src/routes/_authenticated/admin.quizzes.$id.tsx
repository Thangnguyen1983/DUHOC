import { createFileRoute } from "@tanstack/react-router";
import { QuizQuestionsEditor } from "@/components/training/quiz-editor";

export const Route = createFileRoute("/_authenticated/admin/quizzes/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  return <QuizQuestionsEditor id={id} backTo="/admin/quizzes" />;
}
