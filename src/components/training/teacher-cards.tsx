import { cn } from "@/lib/utils";
import { AttendanceRing, ProgressBar } from "./oversight-primitives";

/** Lưới thẻ giáo viên thay cho bảng — giữ đúng dữ liệu teacherStats hiện có. */
export function TeacherCards({
  teachers,
  activeUserId,
  onFilter,
}: {
  teachers: any[];
  activeUserId: string;
  onFilter: (userId: string) => void;
}) {
  if (teachers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
        Chưa có giáo viên.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {teachers.map((t: any, i: number) => {
        const active = activeUserId && activeUserId === t.user_id;
        return (
          <div
            key={t.id}
            className={cn(
              "card-lift rounded-2xl border bg-card p-4",
              active && "border-primary shadow-brand",
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="nav-chip nav-tone-green" aria-hidden>
                <span className="text-xs font-bold">{initials(t.full_name)}</span>
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {t.full_name}
                  {!t.is_active && <span className="ml-1 text-xs font-normal text-muted-foreground">(ngưng)</span>}
                </div>
                <div className="truncate text-xs text-muted-foreground">{t.email ?? ""}</div>
              </div>
              {t.user_id && (
                <button
                  className="ml-auto shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
                  onClick={() => onFilter(active ? "" : t.user_id)}
                >
                  {active ? "Bỏ lọc" : "Lọc lớp"}
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <Stat label="Lớp" value={t.classes} />
              <Stat label="Học viên" value={t.students} />
              <Stat label="Tuần này" value={t.sessions_this_week} />
              <div>
                <div className={cn("text-base font-bold", t.unmarked > 0 ? "text-amber-600" : "")}>{t.unmarked}</div>
                <div className="text-[10px] text-muted-foreground">Chưa ĐD</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Đã nhập điểm</span>
                  <span>
                    {t.students > 0 ? Math.max(0, t.students - t.ungraded) : 0}/{t.students}
                  </span>
                </div>
                <ProgressBar ratio={t.students > 0 ? Math.max(0, t.students - t.ungraded) / t.students : 0} />
              </div>
              <AttendanceRing value={t.attendance_rate} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-base font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function initials(name: string) {
  const parts = (name ?? "").trim().split(/\s+/);
  return ((parts[parts.length - 1]?.[0] ?? "?") + (parts[0]?.[0] ?? "")).toUpperCase();
}
