import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ExternalLink, Printer, ShieldCheck } from "lucide-react";
import { findGuide, GUIDES } from "@/lib/help/guides";

export const Route = createFileRoute("/_authenticated/admin/huong-dan/$slug")({
  loader: ({ params }) => {
    const guide = findGuide(params.slug);
    if (!guide) throw notFound();
    return { slug: guide.slug };
  },
  head: ({ loaderData }) => {
    const guide = loaderData ? findGuide(loaderData.slug) : undefined;
    return {
      meta: [
        { title: guide ? `${guide.title} — Hướng dẫn sử dụng` : "Hướng dẫn sử dụng — KAIZEN Admin" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  notFoundComponent: GuideNotFound,
  component: GuideDetail,
});

function GuideNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
      <h1 className="text-xl font-bold">Không tìm thấy hướng dẫn</h1>
      <Link to="/admin/huong-dan" className="mt-4 inline-block text-sm font-medium text-primary">
        ← Về danh sách hướng dẫn
      </Link>
    </div>
  );
}

function GuideDetail() {
  const { slug } = Route.useLoaderData();
  const guide = findGuide(slug)!;
  const others = GUIDES.filter((g) => g.slug !== slug).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/huong-dan" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Tất cả hướng dẫn
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <Printer className="h-4 w-4" /> In hướng dẫn
        </button>
      </div>

      <header className="rounded-xl border bg-card p-6">
        <div className="text-xs font-medium uppercase tracking-wide text-primary">{guide.department}</div>
        <h1 className="mt-1 text-2xl font-bold">{guide.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{guide.summary}</p>
        {guide.links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {guide.links.map((l) => (
              <Link
                key={l.to}
                to={l.to as string as never}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-5">
          {guide.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 rounded-xl border bg-card p-6">
              <h2 className="text-lg font-bold">
                <span className="mr-2 text-primary">{i + 1}.</span>
                {s.title}
              </h2>
              {s.intro && <p className="mt-2 text-sm text-muted-foreground">{s.intro}</p>}

              {s.steps && (
                <ol className="mt-4 space-y-2">
                  {s.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {s.rules && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-primary">
                    <ShieldCheck className="h-4 w-4" /> Quy tắc bắt buộc
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {s.rules.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {s.issues && (
                <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Lỗi hay gặp
                  </div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {s.issues.map((it, idx) => (
                      <li key={idx}>
                        <strong>{it.problem}:</strong> {it.fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>

        <aside className="no-print space-y-4 lg:sticky lg:top-20 lg:self-start">
          <nav className="rounded-xl border bg-card p-4 text-sm">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Mục lục</div>
            <ul className="space-y-1">
              {guide.sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded px-2 py-1 hover:bg-muted">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="rounded-xl border bg-card p-4 text-sm">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Bộ phận khác</div>
            <ul className="space-y-1">
              {others.map((g) => (
                <li key={g.slug}>
                  <Link
                    to="/admin/huong-dan/$slug"
                    params={{ slug: g.slug }}
                    className="block rounded px-2 py-1 hover:bg-muted"
                  >
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
