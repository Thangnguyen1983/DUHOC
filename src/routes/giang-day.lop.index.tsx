import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTeachingOverview } from "@/lib/training/teaching.functions";

export const Route = createFileRoute("/giang-day/lop/")({ component: MyClasses });

function MyClasses() {
  const fetchOverview = useServerFn(getTeachingOverview);
  const { data, isLoading } = useQuery({ queryKey: ["teaching-overview"], queryFn: () => fetchOverview() });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Lớp của tôi</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {(data?.classes ?? []).map((c: any) => (
          <Link
            key={c.id}
            to="/giang-day/lop/$id"
            params={{ id: c.id }}
            className="rounded-xl border bg-card p-4 hover:border-primary"
          >
            <div className="font-semibold">{c.name}</div>
            <div className="text-xs text-muted-foreground">
              {c.code} · {c.training_programs?.name ?? "—"}
            </div>
            <div className="mt-2 text-xs">
              {c.student_count} học viên · {c.schedule ?? "Chưa có lịch"} {c.room ? `· Phòng ${c.room}` : ""}
            </div>
          </Link>
        ))}
      </div>
      {!isLoading && (data?.classes ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có lớp nào được phân công.</p>
      )}
    </div>
  );
}
