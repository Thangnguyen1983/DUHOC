import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, Printer, RotateCcw } from "lucide-react";
import { findWorkflow } from "@/lib/help/workflows";

export const Route = createFileRoute("/_authenticated/admin/huong-dan/quy-trinh/$slug")({
  loader: ({ params }) => {
    const w = findWorkflow(params.slug);
    if (!w) throw notFound();
    return { slug: w.slug };
  },
  head: ({ loaderData }) => {
    const w = loaderData ? findWorkflow(loaderData.slug) : undefined;
    const title = w ? `${w.title} — Quy trình nghiệp vụ` : "Không tìm thấy quy trình";
    return {
      meta: [
        { title },
        { name: "description", content: w?.summary ?? "Quy trình nghiệp vụ Kaizen" },
        { property: "og:title", content: title },
        { property: "og:description", content: w?.summary ?? "Quy trình nghiệp vụ Kaizen" },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  notFoundComponent: WorkflowNotFound,
  component: WorkflowDetail,
});

function WorkflowNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
      <h1 className="text-xl font-bold">Không tìm thấy quy trình</h1>
      <Link to="/admin/huong-dan/quy-trinh" className="mt-4 inline-block text-sm font-medium text-primary">← Về danh sách quy trình</Link>
    </div>
  );
}

function WorkflowDetail() {
  const { slug } = Route.useLoaderData();
  const w = findWorkflow(slug)!;
  const key = `kaizen-workflow-progress:${slug}`;
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { setDone([]); }
  }, [key]);
  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  const reset = () => { setDone([]); localStorage.removeItem(key); };
  const pct = Math.round((done.length / w.steps.length) * 100);

  return (
    <div className="space-y-6">
      <div className="no-print print:hidden flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/huong-dan/quy-trinh" className="inline-flex items-center gap-1 text-sm text-primary"><ArrowLeft className="h-4 w-4" /> Tất cả quy trình</Link>
        <div className="flex gap-2">
          <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"><RotateCcw className="h-4 w-4" /> Làm lại</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"><Printer className="h-4 w-4" /> In quy trình</button>
        </div>
      </div>

      <header className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="text-xs font-medium uppercase tracking-wide text-primary">{w.department}</div>
        <h1 className="mt-1 break-words text-2xl font-bold">{w.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{w.summary}</p>
        <p className="mt-3 rounded-md bg-muted p-3 text-sm"><b>Kết quả cần đạt:</b> {w.result}</p>
        <div className="mt-4 print:hidden">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Tiến độ của bạn</span><span>{done.length}/{w.steps.length} bước</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Chỉ để bạn tự theo dõi trên máy này, không phải xác nhận phê duyệt.</p>
        </div>
      </header>

      <ol className="space-y-4">
        {w.steps.map((s, i) => {
          const ok = done.includes(i);
          return (
            <li key={i} className={`break-inside-avoid rounded-xl border bg-card p-5 ${ok ? "border-primary/50" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ok ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {ok ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Bước {i + 1}/{w.steps.length}</p>
                    <h2 className="break-words text-lg font-semibold">{s.title}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span><b>Ai làm:</b> {s.actor}</span>
                    {s.link && (
                      <Link to={s.link.to as string as never} className="print:hidden inline-flex items-center gap-1 rounded-md border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5">
                        <ExternalLink className="h-3.5 w-3.5" /> {s.link.label}
                      </Link>
                    )}
                  </div>
                  {s.prepare && <div className="text-sm"><b>Cần chuẩn bị:</b><ul className="ml-5 list-disc">{s.prepare.map((p) => <li key={p}>{p}</li>)}</ul></div>}
                  <div className="text-sm"><b>Thao tác:</b><ol className="ml-5 list-decimal space-y-1">{s.actions.map((a) => <li key={a}>{a}</li>)}</ol></div>
                  <p className="text-sm"><b>Xong khi:</b> {s.doneWhen}</p>
                  {s.issues && s.issues.length > 0 && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                      <p className="flex items-center gap-1 font-medium"><AlertTriangle className="h-4 w-4" /> Lỗi hay gặp</p>
                      <ul className="mt-1 space-y-1">{s.issues.map((x) => <li key={x.problem}><b>{x.problem}:</b> {x.fix}</li>)}</ul>
                    </div>
                  )}
                  <label className="print:hidden flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={ok} onChange={() => toggle(i)} className="h-4 w-4" /> Tôi đã làm xong bước này
                  </label>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
