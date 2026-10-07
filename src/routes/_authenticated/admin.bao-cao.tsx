import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, Download, Printer, FileSpreadsheet, Search } from "lucide-react";
import { REPORTS, REPORT_BY_KEY, type ReportKey } from "@/lib/reports/catalog";
import { getReport, exportReport, getAvailableReports } from "@/lib/reports/report.functions";

export const Route = createFileRoute("/_authenticated/admin/bao-cao")({
  component: ReportCenter,
});

function ReportCenter() {
  const fetchAvailable = useServerFn(getAvailableReports);
  const fetchReport = useServerFn(getReport);
  const runExport = useServerFn(exportReport);

  const [key, setKey] = useState<ReportKey>("students.status");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [group, setGroup] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const available = useQuery({
    queryKey: ["report-available"],
    queryFn: () => fetchAvailable(),
    staleTime: 60_000,
  });

  const allowed = useMemo(() => {
    const keys = available.data?.keys ?? [];
    return REPORTS.filter((r) => keys.includes(r.key));
  }, [available.data]);

  const groups = useMemo(() => {
    const out: Array<{ label: string; items: typeof REPORTS }> = [];
    for (const r of allowed) {
      let g = out.find((x) => x.label === r.group);
      if (!g) { g = { label: r.group, items: [] }; out.push(g); }
      g.items.push(r);
    }
    return out;
  }, [allowed]);

  const report = useQuery({
    queryKey: ["report", key, from, to, group, search],
    queryFn: () => fetchReport({ data: { key, from: from || null, to: to || null, group: group || null, search: search || null } }),
    staleTime: 20_000,
  });

  const meta = REPORT_BY_KEY[key];
  const data = report.data;

  async function onExcel() {
    try {
      setBusy(true);
      const res = await runExport({ data: { key, from: from || null, to: to || null, group: group || null, search: search || null } });
      const bin = atob(res.base64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a");
      a.href = url; a.download = res.filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã tải báo cáo (${res.rows} dòng)`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function onCsv() {
    if (!data) return;
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const csv = [data.headers, ...data.rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `BaoCao_${key.replace(/\./g, "-")}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const canExport = available.data?.canExport ?? false;

  return (
    <div className="w-full min-w-0 space-y-6 print:space-y-3">
      <div className="grid grid-cols-1 gap-3 no-print sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <BarChart3 className="h-6 w-6 shrink-0 text-primary" />
            <span className="truncate">Trung tâm báo cáo</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Xem chi tiết dữ liệu thực của toàn hệ thống, lọc theo thời gian và tải về Excel/CSV hoặc in.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()} disabled={!data}>
            <Printer className="mr-2 h-4 w-4" /> In
          </Button>
          <Button size="sm" variant="outline" onClick={onCsv} disabled={!data}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button size="sm" onClick={onExcel} disabled={!canExport || busy}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> {busy ? "Đang tạo…" : "Excel"}
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4 no-print">
          {available.isLoading && <p className="text-sm text-muted-foreground">Đang tải danh mục báo cáo…</p>}
          {!available.isLoading && allowed.length === 0 && (
            <p className="text-sm text-muted-foreground">Tài khoản của bạn chưa được cấp quyền xem báo cáo nào.</p>
          )}
          {allowed.length > 0 && (
            <label className="block text-xs font-medium lg:hidden">
              Chọn báo cáo
              <select
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={key}
                onChange={(e) => { setKey(e.target.value as ReportKey); setGroup(""); }}
              >
                {groups.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((r) => (
                      <option key={r.key} value={r.key}>{r.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          )}

          <div className="hidden space-y-4 lg:block">
            {groups.map((g) => (
              <div key={g.label} className="rounded-xl border bg-card p-3 shadow-sm">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.label}</p>
                <div className="space-y-1">
                  {g.items.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => { setKey(r.key); setGroup(""); }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        key === r.key ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"
                      }`}
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-lg font-bold">{meta.title}</h2>
            <p className="text-sm text-muted-foreground">{meta.desc}</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 no-print">
              <label className="text-xs font-medium">
                Từ ngày
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="text-xs font-medium">
                Đến ngày
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
              <label className="text-xs font-medium">
                Hạng mục
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {(data?.summary ?? []).map((s) => (
                    <option key={s.label} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium">
                Tìm kiếm
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Tên, mã, số điện thoại…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </label>
            </div>
          </div>

          {report.isError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
              {errorMessage(report.error)}
            </div>
          )}

          {data && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Tổng số dòng</p>
                  <p className="text-2xl font-bold">{data.totalRows}</p>
                </div>
                {data.summary.slice(0, 3).map((s) => (
                  <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="truncate text-xs text-muted-foreground" title={s.label}>{s.label}</p>
                    <p className="text-2xl font-bold">{s.count}</p>
                  </div>
                ))}
              </div>

              <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border bg-card shadow-sm [-webkit-overflow-scrolling:touch] print:overflow-visible">
                <table className="w-full min-w-[720px] text-sm print:min-w-0">
                  <thead className="bg-muted/60">
                    <tr>
                      {data.headers.map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r, i) => (
                      <tr key={i} className={i % 2 ? "bg-muted/20" : ""}>
                        {r.map((c, j) => (
                          <td key={j} className="max-w-[280px] truncate px-3 py-2" title={c}>{c}</td>
                        ))}
                      </tr>
                    ))}
                    {data.rows.length === 0 && (
                      <tr><td colSpan={data.headers.length} className="px-3 py-8 text-center text-muted-foreground">Không có dữ liệu phù hợp bộ lọc.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {data.totalRows > data.rows.length && (
                <p className="text-xs text-muted-foreground no-print">
                  Đang hiển thị {data.rows.length}/{data.totalRows} dòng — tải Excel để xem đầy đủ.
                </p>
              )}
            </>
          )}

          {report.isLoading && <p className="text-sm text-muted-foreground">Đang tải dữ liệu báo cáo…</p>}
        </section>
      </div>
    </div>
  );
}
