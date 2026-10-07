import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSchedule, getTeachingOverview, generateSessions } from "@/lib/training/teaching.functions";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CalendarPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/giang-day/lich")({ component: SchedulePage });

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

function SchedulePage() {
  const qc = useQueryClient();
  const fetchSchedule = useServerFn(getSchedule);
  const fetchOverview = useServerFn(getTeachingOverview);
  const gen = useServerFn(generateSessions);

  const [weekStart, setWeekStart] = useState(isoWeekStart());
  const to = addDays(weekStart, 6);

  const overview = useQuery({ queryKey: ["teaching-overview"], queryFn: () => fetchOverview() });
  const sched = useQuery({
    queryKey: ["teach-schedule", weekStart],
    queryFn: () => fetchSchedule({ data: { from: weekStart, to, mine: false } }),
  });

  const [form, setForm] = useState({
    class_id: "",
    weekdays: [1, 3, 5] as number[],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    count: 12,
    start_time: "18:00",
    end_time: "20:00",
  });

  const create = useMutation({
    mutationFn: () =>
      gen({
        data: {
          class_id: form.class_id,
          weekdays: form.weekdays,
          start_date: form.start_date,
          end_date: form.end_date || null,
          count: form.count || null,
          start_time: form.start_time,
          end_time: form.end_time || null,
          skip_existing: true,
        },
      }),
    onSuccess: (r: any) => {
      toast.success(`Đã tạo ${r.created} buổi học`);
      qc.invalidateQueries({ queryKey: ["teach-schedule"] });
      qc.invalidateQueries({ queryKey: ["teaching-overview"] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const conflictIds = new Set((sched.data?.conflicts ?? []).flatMap((c: any) => [c.a, c.b]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lịch dạy</h1>
          <p className="text-sm text-muted-foreground">Tuần {weekStart} → {to}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>Tuần trước</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(isoWeekStart())}>Tuần này</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Tuần sau</Button>
        </div>
      </div>

      {(sched.data?.conflicts ?? []).length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          Phát hiện {sched.data!.conflicts.length} xung đột lịch (trùng phòng hoặc trùng giáo viên) trong tuần này.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i);
          const items = (sched.data?.sessions ?? []).filter((s: any) => s.session_date === day);
          return (
            <div key={day} className="rounded-xl border bg-card p-3">
              <div className="text-xs font-semibold">{WD[(i + 1) % 7]} · {day.slice(5)}</div>
              <div className="mt-2 space-y-2">
                {items.map((s: any) => (
                  <Link
                    key={s.id}
                    to="/giang-day/lop/$id"
                    params={{ id: s.class_id }}
                    className={`block rounded-lg border p-2 text-xs hover:border-primary ${conflictIds.has(s.id) ? "border-amber-500 bg-amber-50" : ""}`}
                  >
                    <div className="font-medium">{s.training_classes?.name}</div>
                    <div className="text-muted-foreground">
                      {s.start_time?.slice(0, 5)}{s.end_time ? `–${s.end_time.slice(0, 5)}` : ""}
                      {s.training_classes?.room ? ` · ${s.training_classes.room}` : ""}
                    </div>
                  </Link>
                ))}
                {items.length === 0 && <div className="text-[11px] text-muted-foreground">—</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold"><CalendarPlus className="h-4 w-4" /> Tạo lịch học lặp lại</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select className="rounded-md border bg-background p-2 text-sm" value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
            <option value="">— Chọn lớp —</option>
            {(overview.data?.classes ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" className="rounded-md border bg-background p-2 text-sm" value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <input type="number" className="rounded-md border bg-background p-2 text-sm" placeholder="Số buổi" value={form.count}
            onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
          <input type="time" className="rounded-md border bg-background p-2 text-sm" value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <input type="time" className="rounded-md border bg-background p-2 text-sm" value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          <div className="flex flex-wrap items-center gap-1">
            {WD.map((w, idx) => {
              const on = form.weekdays.includes(idx);
              return (
                <button key={w} type="button"
                  onClick={() => setForm({ ...form, weekdays: on ? form.weekdays.filter((d) => d !== idx) : [...form.weekdays, idx] })}
                  className={`rounded-md border px-2 py-1 text-xs ${on ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  {w}
                </button>
              );
            })}
          </div>
        </div>
        <Button className="mt-4" disabled={!form.class_id || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? "Đang tạo..." : "Tạo buổi học"}
        </Button>
      </div>
    </div>
  );
}
