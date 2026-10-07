import { createFileRoute } from "@tanstack/react-router";
import { QuizQuestionsEditor } from "@/components/training/quiz-editor";

export const Route = createFileRoute("/giang-day/bai-kiem-tra/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  return <QuizQuestionsEditor id={id} backTo="/giang-day/bai-kiem-tra" />;
}
