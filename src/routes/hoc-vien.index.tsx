import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyPortal, getMyClasses } from "@/lib/portal/portal.functions";

export const Route = createFileRoute("/hoc-vien/")({ component: Dashboard });

function Dashboard() {
  const fetchPortal = useServerFn(getMyPortal);
  const fetchClasses = useServerFn(getMyClasses);
  const portal = useQuery({ queryKey: ["my-portal"], queryFn: () => fetchPortal() });
  const cls = useQuery({ queryKey: ["my-classes"], queryFn: () => fetchClasses() });

  const p = portal.data;
  const classes = cls.data?.classes ?? [];
  const classesLoading = cls.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Xin chào{p?.profile?.full_name ? `, ${p.profile.full_name}` : ""} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi hành trình học tập của bạn tại Kaizen
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Lớp học" value={classesLoading ? "…" : classes.length} />
        {p?.isStudent && (
          <>
            <StatCard label="Trạng thái hồ sơ" value={p.profile?.current_status ?? "—"} />
            <StatCard label="Tài liệu đã nộp" value={p.documents?.length ?? 0} />
          </>
        )}
      </div>


      {p?.isStudent && p.workflow && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Tiến trình của bạn</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bước hiện tại: <strong className="text-primary">{p.workflow.current_step}</strong>
          </p>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Lớp học gần đây</h2>
          <Link to="/hoc-vien/lop-hoc" className="text-sm text-primary">Xem tất cả →</Link>
        </div>
        <div className="mt-3 divide-y">
          {classes.slice(0, 5).map((c: any) => (
            <Link
              key={c.id}
              to="/hoc-vien/lop-hoc/$id"
              params={{ id: c.id }}
              className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 rounded"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.code} · {c.schedule ?? "—"}</div>
              </div>
              <span className="text-xs rounded-full bg-muted px-2 py-1">{c.status}</span>
            </Link>
          ))}
          {classesLoading && <div className="py-6 text-center text-sm text-muted-foreground">Đang tải lớp học...</div>}
          {!classesLoading && classes.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">Chưa có lớp học.</div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
