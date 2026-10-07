import { errorMessage } from "@/lib/errors";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuiz, upsertQuestion, deleteQuestion } from "@/lib/training/lms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Soạn câu hỏi cho một bài kiểm tra — dùng chung quản trị & cổng giáo viên. */
export function QuizQuestionsEditor({ id, backTo }: { id: string; backTo: "/admin/quizzes" | "/giang-day/bai-kiem-tra" }) {
  const fetchQuiz = useServerFn(getQuiz);
  const saveQ = useServerFn(upsertQuestion);
  const delQ = useServerFn(deleteQuestion);
  const qc = useQueryClient();
  const data = useQuery({ queryKey: ["quiz", id], queryFn: () => fetchQuiz({ data: { id } }) });
  const [editing, setEditing] = useState<any | null>(null);

  const saveMut = useMutation({
    mutationFn: (d: any) => saveQ({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); qc.invalidateQueries({ queryKey: ["quiz", id] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (qid: string) => delQ({ data: { id: qid } }),
    onSuccess: () => { toast.success("Đã xoá"); qc.invalidateQueries({ queryKey: ["quiz", id] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const newQ = () => setEditing({
    quiz_id: id, question_text: "", question_type: "single_choice",
    points: 1, order_index: (data.data?.questions.length ?? 0) + 1,
    options: [
      { option_text: "", is_correct: true, order_index: 0 },
      { option_text: "", is_correct: false, order_index: 1 },
    ],
  });

  return (
    <div className="space-y-6">
      <Link to={backTo} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 mr-1"/>Quay lại</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.data?.quiz?.title}</h1>
          <p className="text-sm text-muted-foreground">Quản lý câu hỏi của bài kiểm tra</p>
        </div>
        <Button onClick={newQ}><Plus className="h-4 w-4 mr-1"/>Thêm câu hỏi</Button>
      </div>

      {editing && <QuestionEditor q={editing} onChange={setEditing} onSave={() => saveMut.mutate(editing)} onCancel={() => setEditing(null)} pending={saveMut.isPending}/>}

      <div className="space-y-3">
        {(data.data?.questions ?? []).map((q: any, i: number) => (
          <div key={q.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Câu {i + 1} • {q.points} điểm • {q.question_type}</div>
                <div className="font-medium mt-1">{q.question_text}</div>
                <div className="mt-2 space-y-1">
                  {q.quiz_options?.map((o: any) => (
                    <div key={o.id} className={`text-sm flex items-center gap-2 ${o.is_correct ? "text-green-700 font-medium" : "text-muted-foreground"}`}>
                      {o.is_correct ? <Check className="h-3 w-3"/> : <span className="w-3"/>} {o.option_text}
                    </div>
                  ))}
                  {q.question_type === "short_answer" && (
                    <div className="text-sm text-muted-foreground">Đáp án mẫu: <span className="text-foreground font-medium">{q.correct_answer_text}</span></div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing({ ...q, options: q.quiz_options ?? [] })}><Pencil className="h-4 w-4"/></Button>
                <Button size="sm" variant="ghost" onClick={() => confirm("Xoá câu hỏi này?") && delMut.mutate(q.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            </div>
          </div>
        ))}
        {data.data?.questions.length === 0 && <div className="text-center text-muted-foreground py-12 border rounded-xl">Chưa có câu hỏi nào</div>}
      </div>
    </div>
  );
}

function QuestionEditor({ q, onChange, onSave, onCancel, pending }: any) {
  const updateOpt = (i: number, patch: any) => {
    const opts = [...q.options]; opts[i] = { ...opts[i], ...patch };
    if (patch.is_correct && (q.question_type === "single_choice" || q.question_type === "true_false")) {
      opts.forEach((o, idx) => { if (idx !== i) o.is_correct = false; });
    }
    onChange({ ...q, options: opts });
  };
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-3">
      <h3 className="font-bold">{q.id ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h3>
      <Textarea rows={2} placeholder="Nội dung câu hỏi" value={q.question_text} onChange={(e) => onChange({ ...q, question_text: e.target.value })}/>
      <div className="grid sm:grid-cols-3 gap-3">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={q.question_type} onChange={(e) => onChange({ ...q, question_type: e.target.value })}>
          <option value="single_choice">Trắc nghiệm 1 đáp án</option>
          <option value="multiple_choice">Trắc nghiệm nhiều đáp án</option>
          <option value="true_false">Đúng / Sai</option>
          <option value="short_answer">Tự luận ngắn</option>
        </select>
        <Input type="number" placeholder="Điểm" value={q.points} onChange={(e) => onChange({ ...q, points: Number(e.target.value) })}/>
        <Input type="number" placeholder="Thứ tự" value={q.order_index} onChange={(e) => onChange({ ...q, order_index: Number(e.target.value) })}/>
      </div>
      {q.question_type === "short_answer" ? (
        <Input placeholder="Đáp án đúng (so sánh không phân biệt hoa thường)" value={q.correct_answer_text ?? ""} onChange={(e) => onChange({ ...q, correct_answer_text: e.target.value })}/>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-medium">Lựa chọn</div>
          {q.options.map((o: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <input type={q.question_type === "multiple_choice" ? "checkbox" : "radio"} checked={o.is_correct} onChange={(e) => updateOpt(i, { is_correct: e.target.checked })}/>
              <Input value={o.option_text} onChange={(e) => updateOpt(i, { option_text: e.target.value })} placeholder={`Lựa chọn ${i + 1}`}/>
              <Button size="sm" variant="ghost" onClick={() => onChange({ ...q, options: q.options.filter((_: any, idx: number) => idx !== i) })}><Trash2 className="h-4 w-4"/></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => onChange({ ...q, options: [...q.options, { option_text: "", is_correct: false, order_index: q.options.length }] })}>
            <Plus className="h-4 w-4 mr-1"/>Thêm lựa chọn
          </Button>
        </div>
      )}
      <Textarea rows={2} placeholder="Giải thích (tuỳ chọn)" value={q.explanation ?? ""} onChange={(e) => onChange({ ...q, explanation: e.target.value })}/>
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={pending}>{pending ? "Đang lưu..." : "Lưu"}</Button>
        <Button variant="outline" onClick={onCancel}>Huỷ</Button>
      </div>
    </div>
  );
}
