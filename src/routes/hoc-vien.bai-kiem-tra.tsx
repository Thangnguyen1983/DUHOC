import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { listQuizzes, listMyAttempts, getQuiz, startQuizAttempt, submitQuizAttempt } from "@/lib/training/lms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardCheck, Play, Check, X, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hoc-vien/bai-kiem-tra")({ component: Page });

function Page() {
  const fetchList = useServerFn(listQuizzes);
  const fetchAttempts = useServerFn(listMyAttempts);
  const fetchQuiz = useServerFn(getQuiz);
  const start = useServerFn(startQuizAttempt);
  const submit = useServerFn(submitQuizAttempt);

  const list = useQuery({ queryKey: ["quizzes"], queryFn: () => fetchList() });
  const attempts = useQuery({ queryKey: ["my-attempts"], queryFn: () => fetchAttempts() });

  const [active, setActive] = useState<{ quiz: any; questions: any[]; attemptId: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, { selected_option_ids?: string[]; answer_text?: string }>>({});
  const [result, setResult] = useState<any>(null);

  const startMut = useMutation({
    mutationFn: async (quizId: string) => {
      const { attempt_id } = await start({ data: { quiz_id: quizId } });
      const detail = await fetchQuiz({ data: { id: quizId } });
      return { ...detail, attemptId: attempt_id };
    },
    onSuccess: (r) => { setActive({ quiz: r.quiz, questions: r.questions, attemptId: r.attemptId }); setAnswers({}); setResult(null); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const submitMut = useMutation({
    mutationFn: () => submit({ data: {
      attempt_id: active!.attemptId,
      answers: Object.entries(answers).map(([qid, a]) => ({ question_id: qid, ...a })),
    } }),
    onSuccess: (r) => { setResult(r); attempts.refetch(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const quizzes = (list.data?.items ?? []).filter((q: any) => q.status === "published");

  if (result && active) {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl border-2 p-8 text-center ${result.passed ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
          <Trophy className={`h-16 w-16 mx-auto ${result.passed ? "text-green-600" : "text-red-600"}`}/>
          <div className="text-3xl font-bold mt-3">{result.percent}%</div>
          <div className="text-sm text-muted-foreground">{result.score}/{result.max_score} điểm</div>
          <div className={`mt-3 text-lg font-bold ${result.passed ? "text-green-700" : "text-red-700"}`}>
            {result.passed ? "🎉 Đậu" : "Chưa đạt"}
          </div>
          {result.certificate?.issued && (
            <div className="mt-3 rounded-lg border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700">
              Đã tự động cấp chứng chỉ PDF: {result.certificate.certificate?.certificate_number}
            </div>
          )}
          {result.passed && result.certificate?.eligible === false && (
            <div className="mt-3 rounded-lg border bg-white px-4 py-3 text-sm text-muted-foreground">
              Chứng chỉ sẽ tự cấp khi hoàn tất đủ điều kiện lớp học.
            </div>
          )}
        </div>
        <Button onClick={() => { setActive(null); setResult(null); }}>Quay lại danh sách</Button>
      </div>
    );
  }

  if (active) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-bold">{active.quiz.title}</h1>
        <p className="text-sm text-muted-foreground">{active.questions.length} câu • Điểm đậu: {active.quiz.passing_score}%</p>
        {active.questions.map((q: any, i: number) => (
          <div key={q.id} className="rounded-2xl border bg-card p-5">
            <div className="text-xs text-muted-foreground">Câu {i + 1} • {q.points} điểm</div>
            <div className="font-medium mt-1">{q.question_text}</div>
            <div className="mt-3 space-y-2">
              {q.question_type === "short_answer" ? (
                <Input value={answers[q.id]?.answer_text ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: { answer_text: e.target.value } })} placeholder="Nhập câu trả lời..."/>
              ) : (
                q.quiz_options.map((o: any) => {
                  const sel = answers[q.id]?.selected_option_ids ?? [];
                  const checked = sel.includes(o.id);
                  const multi = q.question_type === "multiple_choice";
                  return (
                    <label key={o.id} className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer ${checked ? "border-primary bg-primary/5" : ""}`}>
                      <input type={multi ? "checkbox" : "radio"} name={q.id} checked={checked} onChange={() => {
                        const next = multi ? (checked ? sel.filter((x) => x !== o.id) : [...sel, o.id]) : [o.id];
                        setAnswers({ ...answers, [q.id]: { selected_option_ids: next } });
                      }}/>
                      <span className="text-sm">{o.option_text}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>{submitMut.isPending ? "Đang nộp..." : "Nộp bài"}</Button>
          <Button variant="outline" onClick={() => setActive(null)}>Huỷ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="h-6 w-6"/> Bài kiểm tra</h1>
        <p className="text-sm text-muted-foreground">Làm bài và xem kết quả</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {quizzes.map((q: any) => (
          <div key={q.id} className="rounded-2xl border bg-card p-5">
            <h3 className="font-bold">{q.title}</h3>
            <div className="text-xs text-muted-foreground mt-1">Điểm đậu: {q.passing_score}% • Số lần tối đa: {q.max_attempts}</div>
            <Button size="sm" className="mt-3" onClick={() => startMut.mutate(q.id)} disabled={startMut.isPending}>
              <Play className="h-4 w-4 mr-1"/> Bắt đầu
            </Button>
          </div>
        ))}
        {quizzes.length === 0 && <div className="col-span-2 text-center text-muted-foreground py-12 border rounded-2xl">Chưa có bài kiểm tra</div>}
      </div>

      <div>
        <h2 className="font-bold mb-3">Lịch sử làm bài</h2>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left"><tr><th className="p-3">Bài</th><th className="p-3">Lần</th><th className="p-3">Điểm</th><th className="p-3">Kết quả</th><th className="p-3">Ngày</th></tr></thead>
            <tbody>
              {(attempts.data?.items ?? []).map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.quizzes?.title}</td>
                  <td className="p-3">#{a.attempt_number}</td>
                  <td className="p-3">{a.score}/{a.max_score}</td>
                  <td className="p-3">{a.passed ? <span className="text-green-700 flex items-center gap-1"><Check className="h-4 w-4"/>Đậu</span> : <span className="text-red-700 flex items-center gap-1"><X className="h-4 w-4"/>Chưa đạt</span>}</td>
                  <td className="p-3">{new Date(a.started_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
              {(attempts.data?.items ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Chưa làm bài nào</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
