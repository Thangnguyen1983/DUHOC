import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyClasses } from "@/lib/portal/portal.functions";

export const Route = createFileRoute("/hoc-vien/lop-hoc/")({ component: ClassesPage });

function ClassesPage() {
  const fetchClasses = useServerFn(getMyClasses);
  const { data, isLoading } = useQuery({ queryKey: ["my-classes"], queryFn: () => fetchClasses() });

  if (isLoading) return <div>Đang tải...</div>;
  const classes = data?.classes ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{data?.isTeacher ? "Lớp tôi giảng dạy" : "Lớp tôi đang học"}</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {classes.map((c: any) => (
          <Link
            key={c.id}
            to="/hoc-vien/lop-hoc/$id"
            params={{ id: c.id }}
            className="rounded-xl border bg-card p-5 hover:shadow-soft transition"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.name}</div>
              <span className="text-xs rounded-full bg-muted px-2 py-0.5">{c.status}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {c.code} · {c.training_programs?.name ?? ""}
            </div>
            <div className="mt-2 text-sm">📅 {c.schedule ?? "Chưa có lịch"}{c.room ? ` · 🏫 ${c.room}` : ""}</div>
            {data?.isStudent && c.final_grade != null && (
              <div className="mt-2 text-sm">🏆 Điểm tổng kết: <strong>{c.final_grade}</strong></div>
            )}
          </Link>
        ))}
        {classes.length === 0 && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground md:col-span-2">
            Chưa có lớp học nào.
          </div>
        )}
      </div>
    </div>
  );
}
