import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getSchedule } from "@/lib/training/teaching.functions";
import { getTrainingOversight } from "@/lib/training/oversight.functions";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function isoWeekStart(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lịch tuần toàn trung tâm: tất cả lớp, tất cả giáo viên, cảnh báo xung đột. */
export function CenterSchedule() {
  const fetchSchedule = useServerFn(getSchedule);
  const fetchOversight = useServerFn(getTrainingOversight);
  const [weekStart, setWeekStart] = useState(isoWeekStart());
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");
  const to = addDays(weekStart, 6);

  const sched = useQuery({
    queryKey: ["admin-schedule", weekStart],
    queryFn: () => fetchSchedule({ data: { from: weekStart, to, mine: false } }),
  });
  const meta = useQuery({ queryKey: ["training-oversight"], queryFn: () => fetchOversight({ data: {} }) });

  const conflictIds = new Set((sched.data?.conflicts ?? []).flatMap((c: any) => [c.a, c.b]));
  const rooms = [...new Set((meta.data?.classes ?? []).map((c: any) => c.room).filter(Boolean))] as string[];
  const teacherOf = new Map<string, string>();
  for (const c of meta.data?.classes ?? []) if (c.teacher_name) teacherOf.set(c.id, c.teacher_name);

  const sessions = (sched.data?.sessions ?? []).filter((s: any) => {
    if (teacher && s.training_classes?.teacher_id !== teacher) return false;
    if (room && s.training_classes?.room !== room) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Tuần {weekStart} → {to} · tất cả lớp, tất cả giáo viên</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>Tuần trước</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(isoWeekStart())}>Tuần này</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Tuần sau</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className="rounded-md border bg-background p-2 text-sm" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
          <option value="">Tất cả giáo viên</option>
          {(meta.data?.teachers ?? []).filter((t: any) => t.user_id).map((t: any) => (
            <option key={t.id} value={t.user_id}>{t.full_name}</option>
          ))}
        </select>
        <select className="rounded-md border bg-background p-2 text-sm" value={room} onChange={(e) => setRoom(e.target.value)}>
          <option value="">Tất cả phòng</option>
          {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {(sched.data?.conflicts ?? []).length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-red-400 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          {sched.data!.conflicts.length} xung đột lịch trong tuần (trùng phòng hoặc trùng giáo viên) — các buổi được tô đỏ bên dưới.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i);
          const items = sessions.filter((s: any) => s.session_date === day);
          return (
            <div key={day} className="rounded-xl border bg-card p-3">
              <div className="text-xs font-semibold">{WD[(i + 1) % 7]} · {day.slice(5)}</div>
              <div className="mt-2 space-y-2">
                {items.map((s: any) => (
                  <Link
                    key={s.id}
                    to="/admin/training/classes/$id/attendance"
                    params={{ id: s.class_id }}
                    className={`block rounded-lg border p-2 text-xs hover:border-primary ${conflictIds.has(s.id) ? "border-red-500 bg-red-50" : ""}`}
                  >
                    <div className="font-medium">{s.training_classes?.name}</div>
                    <div className="text-muted-foreground">
                      {s.start_time?.slice(0, 5)}{s.end_time ? `–${s.end_time.slice(0, 5)}` : ""}
                      {s.training_classes?.room ? ` · ${s.training_classes.room}` : ""}
                    </div>
                    <div className="text-muted-foreground">{teacherOf.get(s.class_id) ?? "Chưa gán GV"}</div>
                  </Link>
                ))}
                {items.length === 0 && <div className="text-[11px] text-muted-foreground">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
