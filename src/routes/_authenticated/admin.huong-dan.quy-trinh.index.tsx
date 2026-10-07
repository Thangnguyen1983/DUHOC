import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ListChecks, Search } from "lucide-react";
import { WORKFLOWS } from "@/lib/help/workflows";
import { useMyAccess } from "@/lib/rbac/use-access";

export const Route = createFileRoute("/_authenticated/admin/huong-dan/quy-trinh/")({
  head: () => ({
    meta: [
      { title: "Quy trình nghiệp vụ từng bước — KAIZEN Admin" },
      { name: "description", content: "Quy trình thao tác từng bước cho các phòng ban Kaizen." },
      { property: "og:title", content: "Quy trình nghiệp vụ — KAIZEN" },
      { property: "og:description", content: "Quy trình thao tác từng bước cho các phòng ban Kaizen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkflowIndex,
});

function WorkflowIndex() {
  const { access } = useMyAccess();
  const perms = access?.permissions ?? [];
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("mine");
  const mine = useMemo(() => WORKFLOWS.filter((w) => w.permissions.some((p) => perms.includes(p))), [perms]);
  const depts = Array.from(new Set(WORKFLOWS.map((w) => w.department)));
  const base = dept === "mine" ? (mine.length ? mine : WORKFLOWS) : dept === "all" ? WORKFLOWS : WORKFLOWS.filter((w) => w.department === dept);
  const kw = q.trim().toLowerCase();
  const list = kw ? base.filter((w) => [w.title, w.department, w.summary, ...w.steps.map((s) => s.title)].join(" ").toLowerCase().includes(kw)) : base;

  return (
    <div className="space-y-6">
      <Link to="/admin/huong-dan" className="inline-flex items-center gap-1 text-sm text-primary"><ArrowLeft className="h-4 w-4" /> Hướng dẫn sử dụng</Link>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ListChecks className="h-6 w-6" /> Quy trình nghiệp vụ</h1>
        <p className="text-sm text-muted-foreground">Làm theo từng bước: ai làm, làm ở đâu, cần chuẩn bị gì và thế nào là xong.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm quy trình (vd: tạo hồ sơ, điểm danh, visa)..."
            className="w-full rounded-md border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select aria-label="Phòng ban" value={dept} onChange={(e) => setDept(e.target.value)} className="h-10 rounded-md border bg-card px-3 text-sm">
          <option value="mine">Quy trình của tôi</option>
          <option value="all">Tất cả phòng ban</option>
          {depts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {list.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Không tìm thấy quy trình phù hợp.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((w) => (
            <Link key={w.slug} to="/admin/huong-dan/quy-trinh/$slug" params={{ slug: w.slug }}
              className="group flex flex-col rounded-xl border bg-card p-5 transition hover:border-primary/40">
              <span className="text-xs font-medium uppercase tracking-wide text-primary">{w.department}</span>
              <h2 className="mt-2 text-base font-bold group-hover:text-primary">{w.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{w.summary}</p>
              <span className="mt-3 text-xs font-medium text-primary">{w.steps.length} bước →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
