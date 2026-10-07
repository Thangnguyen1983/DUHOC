import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyClassDetail, teacherMarkAttendance, teacherUpsertGrade } from "@/lib/portal/portal.functions";
import { getClassReport, upsertSession, deleteSession } from "@/lib/training/teaching.functions";
import { QrAttendancePanel } from "@/components/training/qr-attendance-panel";
import { StudentTranscript } from "@/components/training/student-transcript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Pencil, Plus, Save, Trash2, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/giang-day/lop/$id")({ component: TeachClass });

type Status = "present" | "late" | "absent" | "excused";
type Mark = { status: Status; note: string };
const TABS = ["attendance", "grades", "report"] as const;
const STATUS_LABEL: Record<Status, string> = {
  present: "Có mặt",
  late: "Trễ",
  absent: "Vắng",
  excused: "Có phép",
};

function TeachClass() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const detail = useServerFn(getMyClassDetail);
  const mark = useServerFn(teacherMarkAttendance);
  const upsertGrade = useServerFn(teacherUpsertGrade);
  const report = useServerFn(getClassReport);
  const saveSession = useServerFn(upsertSession);
  const removeSession = useServerFn(deleteSession);

  const [tab, setTab] = useState<(typeof TABS)[number]>("attendance");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [sessionForm, setSessionForm] = useState<any | null>(null);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);

  const cls = useQuery({ queryKey: ["teach-class", id], queryFn: () => detail({ data: { class_id: id } }) });
  const rep = useQuery({
    queryKey: ["teach-report", id],
    queryFn: () => report({ data: { class_id: id, absent_threshold: 3 } }),
    enabled: tab === "report",
  });

  const sessions = cls.data?.sessions ?? [];
  const enrollments = cls.data?.enrollments ?? [];
  const attendanceRows: any[] = (cls.data as any)?.sessionAttendance ?? [];
  const activeSession = sessionId ?? sessions[0]?.id ?? null;

  // Bản ghi đã lưu của buổi đang chọn (gồm cả lượt học viên tự quét QR).
  const savedByEnrollment = useMemo(() => {
    const m = new Map<string, any>();
    attendanceRows
      .filter((a) => a.session_id === activeSession)
      .forEach((a) => m.set(a.enrollment_id, a));
    return m;
  }, [attendanceRows, activeSession]);

  // Nạp trạng thái đã lưu vào form thay vì mặc định "Có mặt" cho mọi người.
  useEffect(() => {
    if (!activeSession) return;
    const next: Record<string, Mark> = {};
    enrollments.forEach((e: any) => {
      const saved = savedByEnrollment.get(e.id);
      next[e.id] = { status: (saved?.status as Status) ?? "absent", note: saved?.note ?? "" };
    });
    setMarks(next);
  }, [activeSession, savedByEnrollment, cls.dataUpdatedAt]);

  const saveAttendance = useMutation({
    mutationFn: () =>
      mark({
        data: {
          session_id: activeSession!,
          items: enrollments.map((e: any) => ({
            enrollment_id: e.id,
            status: marks[e.id]?.status ?? "absent",
            note: marks[e.id]?.note || null,
          })),
        },
      }),
    onSuccess: (r: any) => {
      toast.success(r?.count ? `Đã lưu ${r.count} thay đổi` : "Không có thay đổi nào");
      qc.invalidateQueries({ queryKey: ["teach-class", id] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const sessionMut = useMutation({
    mutationFn: (d: any) => saveSession({ data: d }),
    onSuccess: () => {
      toast.success("Đã lưu buổi học");
      setSessionForm(null);
      qc.invalidateQueries({ queryKey: ["teach-class", id] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const delSessionMut = useMutation({
    mutationFn: (sid: string) => removeSession({ data: { id: sid } }),
    onSuccess: () => {
      toast.success("Đã xoá buổi học");
      setSessionId(null);
      qc.invalidateQueries({ queryKey: ["teach-class", id] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  async function exportExcel() {
    const data = rep.data ?? (await report({ data: { class_id: id, absent_threshold: 3 } }));
    const XLSX = await import("xlsx");
    const rows = (data.rows ?? []).map((r: any) => ({
      "Mã HV": r.student_code,
      "Họ tên": r.full_name,
      "Điện thoại": r.phone,
      "Tổng buổi": r.total,
      "Có mặt": r.present,
      Trễ: r.late,
      Vắng: r.absent,
      "Có phép": r.excused,
      "Chuyên cần (%)": r.rate,
      "Điểm TK": r.final_grade,
      "Cảnh báo": r.warning ? "Vắng nhiều" : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCaoLop");
    XLSX.writeFile(wb, `bao-cao-${(data.cls as any)?.code ?? id}.xlsx`);
  }

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, excused: 0 } as Record<Status, number>;
    enrollments.forEach((e: any) => c[marks[e.id]?.status ?? "absent"]++);
    return c;
  }, [marks, enrollments]);

  const activeSessionObj = sessions.find((s: any) => s.id === activeSession);

  if (cls.isLoading) return <p className="text-sm text-muted-foreground">Đang tải lớp...</p>;
  if (cls.error) return <p className="text-sm text-red-600">{(cls.error as any).message}</p>;

  return (
    <div className="space-y-5">
      <Link to="/giang-day/lop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Lớp của tôi
      </Link>

      <div className="rounded-2xl border bg-card p-5">
        <h1 className="text-2xl font-bold">{(cls.data?.cls as any)?.name}</h1>
        <p className="text-sm text-muted-foreground">
          {(cls.data?.cls as any)?.code} · {enrollments.length} học viên · {(cls.data?.cls as any)?.room ? `Phòng ${(cls.data?.cls as any).room}` : "Chưa gán phòng"}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TABS)[number])}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t === "attendance" ? "Điểm danh" : t === "grades" ? "Điểm số" : "Báo cáo"}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "attendance" && (
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium">Buổi học:</label>
            <select
              className="rounded-md border bg-background p-2 text-sm"
              value={activeSession ?? ""}
              onChange={(e) => setSessionId(e.target.value)}
            >
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  #{s.session_no} — {s.session_date} {s.title ? `· ${s.title}` : ""}
                </option>
              ))}
            </select>
            {sessions.length === 0 && <span className="text-sm text-muted-foreground">Lớp chưa có buổi học.</span>}
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setSessionForm({
                    class_id: id,
                    session_date: new Date().toISOString().slice(0, 10),
                    start_time: "18:00",
                    end_time: "20:00",
                    title: "",
                    topic: "",
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Thêm buổi
              </Button>
              {activeSessionObj && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setSessionForm({ ...activeSessionObj, class_id: id })}>
                    <Pencil className="mr-1 h-4 w-4" /> Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Xoá buổi học này?")) delSessionMut.mutate(activeSessionObj.id);
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Xoá
                  </Button>
                </>
              )}
            </div>
          </div>

          {sessionForm && (
            <div className="grid gap-2 rounded-xl border bg-muted/30 p-3 md:grid-cols-6">
              <Input
                type="date"
                value={sessionForm.session_date ?? ""}
                onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
              />
              <Input
                type="time"
                value={(sessionForm.start_time ?? "").slice(0, 5)}
                onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
              />
              <Input
                type="time"
                value={(sessionForm.end_time ?? "").slice(0, 5)}
                onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
              />
              <Input
                placeholder="Tiêu đề"
                value={sessionForm.title ?? ""}
                onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
              />
              <Input
                placeholder="Nội dung/chủ đề"
                value={sessionForm.topic ?? ""}
                onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={sessionMut.isPending}
                  onClick={() =>
                    sessionMut.mutate({
                      id: sessionForm.id ?? null,
                      class_id: id,
                      session_date: sessionForm.session_date,
                      start_time: sessionForm.start_time || null,
                      end_time: sessionForm.end_time || null,
                      title: sessionForm.title || null,
                      topic: sessionForm.topic || null,
                    })
                  }
                >
                  Lưu
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSessionForm(null)}>
                  Huỷ
                </Button>
              </div>
            </div>
          )}

          {activeSession && (
            <>
              <QrAttendancePanel sessionId={activeSession} />

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Có mặt {counts.present}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Trễ {counts.late}</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">Vắng {counts.absent}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">Có phép {counts.excused}</span>
                <div className="ml-auto">
                  <Button size="sm" onClick={() => saveAttendance.mutate()} disabled={saveAttendance.isPending}>
                    <Save className="mr-1 h-4 w-4" /> Lưu điểm danh
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="p-3">Học viên</th>
                      <th className="p-3">Nguồn ghi nhận</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e: any) => {
                      const cur = marks[e.id]?.status ?? "absent";
                      const saved = savedByEnrollment.get(e.id);
                      return (
                        <tr key={e.id} className="border-t align-top">
                          <td className="p-3">
                            <button
                              className="text-left font-medium hover:text-primary"
                              onClick={() => setTranscriptId(e.student_profiles?.id ?? null)}
                            >
                              <User className="mr-1 inline h-3.5 w-3.5" />
                              {e.student_profiles?.full_name}
                            </button>
                            <div className="text-xs text-muted-foreground">
                              {e.student_profiles?.student_code ?? "—"} · {e.student_profiles?.phone}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {saved
                              ? `${saved.check_in_method === "qr" ? "Học viên tự quét QR" : "Giáo viên ghi"}${
                                  saved.check_in_at ? ` · ${new Date(saved.check_in_at).toLocaleTimeString("vi-VN")}` : ""
                                }${saved.pending ? " · chờ duyệt" : ""}`
                              : "Chưa ghi nhận"}
                          </td>
                          <td className="p-3">
                            <div className="inline-flex overflow-hidden rounded-md border">
                              {(["present", "late", "absent", "excused"] as Status[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={() =>
                                    setMarks((m) => ({ ...m, [e.id]: { status: s, note: m[e.id]?.note ?? "" } }))
                                  }
                                  className={`px-2 py-1 text-xs ${cur === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
                                >
                                  {STATUS_LABEL[s]}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              className="h-8 text-xs"
                              placeholder="Lý do / ghi chú"
                              value={marks[e.id]?.note ?? ""}
                              onChange={(ev) =>
                                setMarks((m) => ({
                                  ...m,
                                  [e.id]: { status: m[e.id]?.status ?? "absent", note: ev.target.value },
                                }))
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      <Dialog open={!!transcriptId} onOpenChange={(o) => !o && setTranscriptId(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Học bạ học viên</DialogTitle>
          </DialogHeader>
          {transcriptId && <StudentTranscript studentProfileId={transcriptId} />}
        </DialogContent>
      </Dialog>


      {tab === "grades" && (
        <div className="rounded-2xl border bg-card p-5">
          <GradeEditor enrollments={enrollments} onSave={upsertGrade} onDone={() => qc.invalidateQueries({ queryKey: ["teach-class", id] })} />
        </div>
      )}

      {tab === "report" && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Báo cáo chuyên cần & điểm</h2>
            <Button size="sm" variant="outline" onClick={exportExcel}>
              <Download className="mr-1 h-4 w-4" /> Xuất Excel
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Học viên</th><th className="p-3">Chuyên cần</th>
                  <th className="p-3">Vắng</th><th className="p-3">Điểm TK</th>
                </tr>
              </thead>
              <tbody>
                {(rep.data?.rows ?? []).map((r: any) => (
                  <tr key={r.enrollment_id} className={`border-t ${r.warning ? "bg-amber-50" : ""}`}>
                    <td className="p-3">
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.student_code}</div>
                    </td>
                    <td className="p-3">{r.rate == null ? "—" : `${r.rate}%`}</td>
                    <td className="p-3">{r.absent}</td>
                    <td className="p-3">{r.final_grade ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rep.isLoading && <p className="text-sm text-muted-foreground">Đang tính toán...</p>}
        </div>
      )}
    </div>
  );
}

function GradeEditor({ enrollments, onSave, onDone }: any) {
  const [form, setForm] = useState({ enrollment_id: "", grade_type: "quiz", title: "", score: 0, max_score: 10, weight: 1 });
  const save = useMutation({
    mutationFn: () => onSave({ data: { ...form, title: form.title || null } }),
    onSuccess: () => { toast.success("Đã lưu điểm"); onDone?.(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Nhập điểm</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select className="rounded-md border bg-background p-2 text-sm" value={form.enrollment_id}
          onChange={(e) => setForm({ ...form, enrollment_id: e.target.value })}>
          <option value="">— Chọn học viên —</option>
          {enrollments.map((e: any) => <option key={e.id} value={e.id}>{e.student_profiles?.full_name}</option>)}
        </select>
        <select className="rounded-md border bg-background p-2 text-sm" value={form.grade_type}
          onChange={(e) => setForm({ ...form, grade_type: e.target.value })}>
          <option value="quiz">Kiểm tra</option>
          <option value="midterm">Giữa kỳ</option>
          <option value="final">Cuối kỳ</option>
          <option value="assignment">Bài tập</option>
        </select>
        <input className="rounded-md border bg-background p-2 text-sm" placeholder="Tiêu đề" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input type="number" className="rounded-md border bg-background p-2 text-sm" placeholder="Điểm" value={form.score}
          onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} />
        <input type="number" className="rounded-md border bg-background p-2 text-sm" placeholder="Thang điểm" value={form.max_score}
          onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })} />
        <input type="number" step="0.1" className="rounded-md border bg-background p-2 text-sm" placeholder="Hệ số" value={form.weight}
          onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
      </div>
      <Button disabled={!form.enrollment_id || save.isPending} onClick={() => save.mutate()}>
        <Save className="mr-1 h-4 w-4" /> Lưu điểm
      </Button>
    </div>
  );
}
