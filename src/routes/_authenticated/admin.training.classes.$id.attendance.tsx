import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClass, getSessionAttendance, bulkMarkAttendance } from "@/lib/training/training.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, Clock, FileText, Save } from "lucide-react";
import { QrAttendancePanel } from "@/components/training/qr-attendance-panel";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Status = "present" | "absent" | "late" | "excused";

export const Route = createFileRoute("/_authenticated/admin/training/classes/$id/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const { id } = Route.useParams();
  const fetchClass = useServerFn(getClass);
  const fetchAtt = useServerFn(getSessionAttendance);
  const bulk = useServerFn(bulkMarkAttendance);
  const qc = useQueryClient();

  const cls = useQuery({ queryKey: ["training-class", id], queryFn: () => fetchClass({ data: { id } }) });
  const sessions = cls.data?.sessions ?? [];
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => { if (!sessionId && sessions[0]) setSessionId(sessions[0].id); }, [sessions, sessionId]);

  const att = useQuery({
    queryKey: ["attendance", sessionId],
    queryFn: () => fetchAtt({ data: { session_id: sessionId! } }),
    enabled: !!sessionId,
  });

  const [state, setState] = useState<Record<string, { status: Status; note?: string }>>({});
  useEffect(() => {
    if (!att.data) return;
    const next: Record<string, { status: Status; note?: string }> = {};
    for (const r of att.data.rows as any[]) {
      next[r.enrollment_id] = {
        status: (r.mark?.status as Status) ?? "present",
        note: r.mark?.note ?? "",
      };
    }
    setState(next);
  }, [att.data]);

  const saveMut = useMutation({
    mutationFn: () => bulk({ data: {
      session_id: sessionId!,
      marks: Object.entries(state).map(([eid, v]) => ({ enrollment_id: eid, status: v.status, note: v.note ?? null })),
    } }),
    onSuccess: () => { toast.success("Đã lưu điểm danh"); qc.invalidateQueries({ queryKey: ["attendance", sessionId] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(state).forEach((v) => { c[v.status]++; });
    return c;
  }, [state]);

  return (
    <div className="space-y-6">
      <Link to="/admin/training/classes/$id" params={{ id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4"/> Quay lại lớp
      </Link>

      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Điểm danh</h1>
            <p className="text-sm text-muted-foreground">{cls.data?.cls?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/training/classes/$id/grades" params={{ id }} className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-1">
              <FileText className="h-4 w-4"/> Bảng điểm
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium">Buổi học:</label>
          <select className="rounded-md border bg-background p-2 text-sm" value={sessionId ?? ""} onChange={(e) => setSessionId(e.target.value)}>
            {sessions.map((s: any) => (
              <option key={s.id} value={s.id}>#{s.session_no} — {s.session_date} {s.title ? `· ${s.title}` : ""}</option>
            ))}
          </select>
          {sessions.length === 0 && <span className="text-sm text-muted-foreground">Chưa có buổi học. Thêm ở trang lớp.</span>}
        </div>

        {sessionId && (
          <>
            <QrAttendancePanel sessionId={sessionId} />
            <div className="flex items-center gap-3 text-xs">

              <Pill cls="bg-emerald-100 text-emerald-700">Có mặt: {counts.present}</Pill>
              <Pill cls="bg-amber-100 text-amber-700">Trễ: {counts.late}</Pill>
              <Pill cls="bg-red-100 text-red-700">Vắng: {counts.absent}</Pill>
              <Pill cls="bg-blue-100 text-blue-700">Có phép: {counts.excused}</Pill>
              <div className="ml-auto">
                <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                  <Save className="h-4 w-4 mr-1"/> {saveMut.isPending ? "Đang lưu..." : "Lưu điểm danh"}
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr><th className="p-3">Học viên</th><th className="p-3">Trạng thái</th><th className="p-3">Ghi chú</th></tr>
                </thead>
                <tbody>
                  {(att.data?.rows ?? []).map((r: any) => {
                    const cur = state[r.enrollment_id]?.status ?? "present";
                    return (
                      <tr key={r.enrollment_id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{r.student?.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.student?.student_code ? `${r.student.student_code} · ` : ""}{r.student?.phone}
                          </div>
                          {r.mark && (
                            <div className="text-[11px] text-muted-foreground">
                              {r.mark.check_in_method === "qr" ? "🟢 Học viên tự quét QR" : "✍️ Giáo viên ghi"}
                              {r.mark.pending ? " · chờ duyệt" : ""}
                              {r.mark.check_in_at ? ` · ${new Date(r.mark.check_in_at).toLocaleTimeString("vi-VN")}` : ""}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="inline-flex rounded-md border overflow-hidden">
                            <StatusBtn cur={cur} v="present" onClick={() => setState((s) => ({ ...s, [r.enrollment_id]: { ...s[r.enrollment_id], status: "present" } }))} icon={<Check className="h-3 w-3"/>} label="Có mặt" color="emerald" />
                            <StatusBtn cur={cur} v="late" onClick={() => setState((s) => ({ ...s, [r.enrollment_id]: { ...s[r.enrollment_id], status: "late" } }))} icon={<Clock className="h-3 w-3"/>} label="Trễ" color="amber" />
                            <StatusBtn cur={cur} v="absent" onClick={() => setState((s) => ({ ...s, [r.enrollment_id]: { ...s[r.enrollment_id], status: "absent" } }))} icon={<X className="h-3 w-3"/>} label="Vắng" color="red" />
                            <StatusBtn cur={cur} v="excused" onClick={() => setState((s) => ({ ...s, [r.enrollment_id]: { ...s[r.enrollment_id], status: "excused" } }))} icon={<FileText className="h-3 w-3"/>} label="Có phép" color="blue" />
                          </div>
                        </td>
                        <td className="p-3">
                          <input className="w-full rounded-md border bg-background p-1 text-xs" placeholder="Ghi chú"
                            value={state[r.enrollment_id]?.note ?? ""}
                            onChange={(e) => setState((s) => ({ ...s, [r.enrollment_id]: { ...s[r.enrollment_id], note: e.target.value } }))} />
                        </td>
                      </tr>
                    );
                  })}
                  {att.data?.rows.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Lớp chưa có học viên nào.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Pill({ children, cls }: any) { return <span className={`rounded-full px-2 py-0.5 ${cls}`}>{children}</span>; }
function StatusBtn({ cur, v, onClick, icon, label, color }: any) {
  const active = cur === v;
  const map: any = {
    emerald: "bg-emerald-600 text-white", amber: "bg-amber-500 text-white",
    red: "bg-red-600 text-white", blue: "bg-blue-600 text-white",
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-1 px-2 py-1 text-xs ${active ? map[color] : "bg-card hover:bg-muted"}`}>
      {icon}{label}
    </button>
  );
}
