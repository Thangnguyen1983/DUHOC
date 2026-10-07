import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTeachingOverview } from "@/lib/training/teaching.functions";
import { AlertTriangle, CalendarDays, Users } from "lucide-react";

export const Route = createFileRoute("/giang-day/")({ component: Overview });

function Overview() {
  const fetchOverview = useServerFn(getTeachingOverview);
  const { data } = useQuery({ queryKey: ["teaching-overview"], queryFn: () => fetchOverview() });

  const classes = data?.classes ?? [];
  const today = data?.today ?? [];
  const missing = data?.missingAttendance ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan giảng dạy</h1>
        <p className="text-sm text-muted-foreground">Lớp phụ trách, buổi học hôm nay và việc cần hoàn tất.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Lớp phụ trách" value={classes.length} icon={Users} />
        <Stat label="Buổi hôm nay" value={today.length} icon={CalendarDays} />
        <Stat label="Buổi chưa điểm danh" value={missing.length} icon={AlertTriangle} tone="warn" />
      </div>

      <Section title="Buổi học hôm nay">
        {today.length === 0 ? (
          <Empty text="Hôm nay không có buổi học nào." />
        ) : (
          <ul className="divide-y">
            {today.map((s: any) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-medium">{s.training_classes?.name} · Buổi #{s.session_no}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.start_time?.slice(0, 5)}{s.end_time ? `–${s.end_time.slice(0, 5)}` : ""} {s.training_classes?.room ? `· Phòng ${s.training_classes.room}` : ""}
                  </div>
                </div>
                <Link
                  to="/giang-day/lop/$id"
                  params={{ id: s.class_id }}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                >
                  Mở lớp · Điểm danh QR
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Buổi đã qua chưa điểm danh">
        {missing.length === 0 ? (
          <Empty text="Tất cả buổi đã được điểm danh." />
        ) : (
          <ul className="divide-y">
            {missing.map((s: any) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                <span>
                  {s.session_date} · {s.training_classes?.name} · Buổi #{s.session_no}
                </span>
                <Link to="/giang-day/lop/$id" params={{ id: s.class_id }} className="text-primary">
                  Điểm danh bù
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Lớp của tôi">
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c: any) => (
            <Link
              key={c.id}
              to="/giang-day/lop/$id"
              params={{ id: c.id }}
              className="rounded-xl border p-4 hover:border-primary hover:bg-muted/40"
            >
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {c.code} · {c.training_programs?.name ?? "—"} · {c.student_count} học viên
              </div>
            </Link>
          ))}
          {classes.length === 0 && <Empty text="Chưa có lớp nào được phân công." />}
        </div>
      </Section>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: any) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${tone === "warn" && value > 0 ? "border-amber-400" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
function Section({ title, children }: any) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="py-6 text-center text-sm text-muted-foreground">{text}</div>;
}
