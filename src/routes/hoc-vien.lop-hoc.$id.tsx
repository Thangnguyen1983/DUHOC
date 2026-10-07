import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  getMyClassDetail,
  teacherMarkAttendance,
  teacherUpsertGrade,
} from "@/lib/portal/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/hoc-vien/lop-hoc/$id")({ component: ClassDetailPage });

const ATT_STATUSES = [
  { v: "present", label: "Có mặt" },
  { v: "late", label: "Trễ" },
  { v: "absent", label: "Vắng" },
  { v: "excused", label: "Có phép" },
] as const;

function ClassDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getMyClassDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["my-class", id],
    queryFn: () => fetchDetail({ data: { class_id: id } }),
  });

  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [attMap, setAttMap] = useState<Record<string, { status: string; note?: string }>>({});

  const markAtt = useServerFn(teacherMarkAttendance);
  const saveAttMut = useMutation({
    mutationFn: async () => {
      if (!activeSession) return;
      const items = Object.entries(attMap).map(([enrollment_id, v]) => ({
        enrollment_id,
        status: v.status as any,
        note: v.note ?? null,
      }));
      await markAtt({ data: { session_id: activeSession, items } });
    },
    onSuccess: () => {
      toast.success("Đã lưu điểm danh");
      qc.invalidateQueries({ queryKey: ["my-class", id] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  if (isLoading) return <div>Đang tải...</div>;
  if (!data) return null;
  const { cls, sessions, enrollments, myAttendance, myGrades, isTeacher, isStudent } = data as any;

  return (
    <div className="space-y-6">
      <Link to="/hoc-vien/lop-hoc" className="text-sm text-muted-foreground">← Tất cả lớp học</Link>
      <div>
        <h1 className="text-2xl font-bold">{cls.name}</h1>
        <p className="text-sm text-muted-foreground">
          {cls.code} · {cls.training_programs?.name} · {cls.schedule ?? "—"}{cls.room ? ` · ${cls.room}` : ""}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Lịch học ({sessions.length} buổi)</h2>
        <div className="divide-y">
          {sessions.map((s: any) => {
            const myAtt = myAttendance.find((a: any) => a.session_id === s.id);
            return (
              <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">Buổi {s.session_no} · {s.title ?? s.topic ?? "Buổi học"}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.session_date} · {s.start_time ?? ""} - {s.end_time ?? ""}
                  </div>
                </div>
                {isStudent && (
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    myAtt?.status === "present" ? "bg-emerald-100 text-emerald-700" :
                    myAtt?.status === "absent" ? "bg-red-100 text-red-700" :
                    myAtt?.status ? "bg-amber-100 text-amber-700" : "bg-muted"
                  }`}>
                    {myAtt ? ATT_STATUSES.find((x) => x.v === myAtt.status)?.label : "Chưa điểm danh"}
                  </span>
                )}
                {isTeacher && (
                  <Button
                    size="sm"
                    variant={activeSession === s.id ? "default" : "outline"}
                    onClick={() => {
                      setActiveSession(activeSession === s.id ? null : s.id);
                      setAttMap({});
                    }}
                  >
                    {activeSession === s.id ? "Đang điểm danh" : "Điểm danh"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {isTeacher && activeSession && (
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <h3 className="font-semibold mb-2">Điểm danh buổi này</h3>
            <div className="space-y-2">
              {enrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded bg-card p-2">
                  <div className="text-sm">{e.student_profiles?.full_name}</div>
                  <div className="flex gap-1">
                    {ATT_STATUSES.map((st) => (
                      <button
                        key={st.v}
                        onClick={() => setAttMap((m) => ({ ...m, [e.id]: { ...(m[e.id] ?? {}), status: st.v } }))}
                        className={`text-xs rounded px-2 py-1 border ${
                          attMap[e.id]?.status === st.v ? "bg-primary text-primary-foreground border-primary" : "bg-card"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-3"
              onClick={() => saveAttMut.mutate()}
              disabled={saveAttMut.isPending || Object.keys(attMap).length === 0}
            >
              {saveAttMut.isPending ? "Đang lưu..." : "Lưu điểm danh"}
            </Button>
          </div>
        )}
      </section>

      {isStudent && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3">Điểm của tôi</h2>
          {myGrades.length === 0 && <p className="text-sm text-muted-foreground">Chưa có điểm.</p>}
          <table className="w-full text-sm">
            <tbody>
              {myGrades.map((g: any) => (
                <tr key={g.id} className="border-b">
                  <td className="py-2">{g.title ?? g.assessment_type}</td>
                  <td className="py-2 text-xs text-muted-foreground">{g.assessment_type}</td>
                  <td className="py-2 text-right font-bold">{g.score}/{g.max_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {isTeacher && <TeacherGrades classId={id} enrollments={enrollments} />}
    </div>
  );
}

function TeacherGrades({ classId, enrollments }: { classId: string; enrollments: any[] }) {
  const qc = useQueryClient();
  const upsert = useServerFn(teacherUpsertGrade);
  const [form, setForm] = useState({ enrollment_id: "", grade_type: "quiz", title: "", score: "", max_score: "10", weight: "1" });

  const mut = useMutation({
    mutationFn: async () => {
      await upsert({
        data: {
          enrollment_id: form.enrollment_id,
          grade_type: form.grade_type,
          title: form.title || null,
          score: parseFloat(form.score),
          max_score: parseFloat(form.max_score),
          weight: parseFloat(form.weight),
        },
      });
    },
    onSuccess: () => {
      toast.success("Đã lưu điểm");
      setForm({ ...form, title: "", score: "" });
      qc.invalidateQueries({ queryKey: ["my-class", classId] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold mb-3">Nhập điểm</h2>
      <div className="grid gap-2 md:grid-cols-6">
        <select
          className="border rounded px-2 py-1 text-sm md:col-span-2"
          value={form.enrollment_id}
          onChange={(e) => setForm({ ...form, enrollment_id: e.target.value })}
        >
          <option value="">— Chọn học viên —</option>
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>{e.student_profiles?.full_name}</option>
          ))}
        </select>
        <Input placeholder="Loại (quiz, mid, final...)" value={form.grade_type} onChange={(e) => setForm({ ...form, grade_type: e.target.value })} />
        <Input placeholder="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Điểm" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
        <Input placeholder="Tối đa" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
      </div>
      <Button className="mt-3" onClick={() => mut.mutate()} disabled={mut.isPending || !form.enrollment_id || !form.score}>
        {mut.isPending ? "Đang lưu..." : "Lưu điểm"}
      </Button>
    </section>
  );
}
