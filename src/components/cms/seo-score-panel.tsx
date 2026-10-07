import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { auditContent } from "@/lib/cms/seo-audit";

export function SeoScorePanel({
  body,
  title,
  keyword,
}: {
  body: string;
  title?: string;
  keyword?: string;
}) {
  const result = useMemo(() => auditContent({ body, title, keyword }), [body, title, keyword]);
  const failed = result.items.filter((i) => !i.ok);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Chấm điểm SEO nội dung</div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 font-bold ${
              result.score >= 80
                ? "bg-primary/10 text-primary"
                : result.score >= 55
                  ? "bg-amber-100 text-amber-700"
                  : "bg-destructive/10 text-destructive"
            }`}
          >
            {result.score}/100
          </span>
          <span className="text-xs text-muted-foreground">{result.words} từ</span>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            result.score >= 80 ? "bg-primary" : result.score >= 55 ? "bg-amber-500" : "bg-destructive"
          }`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      <ul className="mt-3 space-y-2">
        {result.items.map((it) => {
          const Icon = it.ok
            ? CheckCircle2
            : it.severity === "error"
              ? XCircle
              : it.severity === "warn"
                ? AlertTriangle
                : Info;
          const color = it.ok
            ? "text-primary"
            : it.severity === "error"
              ? "text-destructive"
              : it.severity === "warn"
                ? "text-amber-600"
                : "text-muted-foreground";
          return (
            <li key={it.id} className="flex gap-2 text-xs">
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
              <div>
                <span className="font-medium">{it.label}</span>
                <span className="text-muted-foreground"> — {it.detail}</span>
              </div>
            </li>
          );
        })}
      </ul>

      {failed.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Còn {failed.length} mục cần xử lý để đạt chuẩn SEO on-page.
        </p>
      )}
    </div>
  );
}
