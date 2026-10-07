import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getVisaStats } from "@/lib/students/checklist.functions";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/visa")({
  component: VisaDashboard,
});

const STATUS_LABEL: Record<string, string> = {
  none: "Chưa xử lý",
  preparing: "Chuẩn bị HS",
  submitted: "Đã nộp",
  interview: "Phỏng vấn",
  granted: "Đã cấp",
  rejected: "Từ chối",
};

function VisaDashboard() {
  const fetchStats = useServerFn(getVisaStats);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [market, setMarket] = useState("");

  const q = useQuery({
    queryKey: ["visa-stats", from, to, market],
    queryFn: () =>
      fetchStats({
        data: {
          from: from || undefined,
          to: to ? `${to}T23:59:59` : undefined,
          market: market || undefined,
        },
      }),
  });
  const d = q.data;

  const granted = d?.byStatus?.granted ?? 0;
  const rejected = d?.byStatus?.rejected ?? 0;
  const decided = granted + rejected;
  const rate = decided ? Math.round((granted / decided) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Thống kê visa
          </h1>
          <p className="text-sm text-muted-foreground">Tỷ lệ đạt/trượt theo thị trường, cán bộ phụ trách và theo tháng.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Từ ngày</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Đến ngày</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Thị trường</label>
            <Input
              placeholder="VD: Đức"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="h-9 w-40"
            />
          </div>
        </div>
      </div>

      {q.isLoading && <div className="text-sm text-muted-foreground">Đang tải…</div>}

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi title="Tổng hồ sơ" value={d?.total ?? 0} />
        <Kpi title="Đã cấp visa" value={granted} tone="text-emerald-600" />
        <Kpi title="Bị từ chối" value={rejected} tone="text-destructive" />
        <Kpi title="Tỷ lệ đạt" value={`${rate}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theo trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(d?.byStatus ?? {}).map(([k, v]) => (
            <Badge key={k} variant="outline" className="text-sm">
              {STATUS_LABEL[k] ?? k}: {v as number}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theo thị trường</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(d?.markets ?? []).map((m) => {
            const dec = m.granted + m.rejected;
            const r = dec ? Math.round((m.granted / dec) * 100) : 0;
            return (
              <div key={m.market} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{m.market}</span>
                  <span className="text-muted-foreground">
                    {m.granted} đạt / {m.rejected} trượt / {m.pending} đang xử lý · {r}%
                  </span>
                </div>
                <Progress value={r} className="h-2" />
              </div>
            );
          })}
          {!q.isLoading && !(d?.markets ?? []).length && (
            <div className="text-sm text-muted-foreground">Chưa có dữ liệu.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theo cán bộ phụ trách</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="py-1">Cán bộ</th>
                  <th className="py-1 text-right">Đạt</th>
                  <th className="py-1 text-right">Trượt</th>
                  <th className="py-1 text-right">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {(d?.officers ?? []).map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-1.5">{o.name}</td>
                    <td className="py-1.5 text-right">{o.granted}</td>
                    <td className="py-1.5 text-right">{o.rejected}</td>
                    <td className="py-1.5 text-right font-medium">{o.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(d?.officers ?? []).length && <div className="text-sm text-muted-foreground">Chưa có dữ liệu.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="py-1">Tháng</th>
                  <th className="py-1 text-right">Đạt</th>
                  <th className="py-1 text-right">Trượt</th>
                </tr>
              </thead>
              <tbody>
                {(d?.months ?? []).map((m) => (
                  <tr key={m.month} className="border-t">
                    <td className="py-1.5">{m.month}</td>
                    <td className="py-1.5 text-right">{m.granted}</td>
                    <td className="py-1.5 text-right">{m.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(d?.months ?? []).length && <div className="text-sm text-muted-foreground">Chưa có dữ liệu.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ title, value, tone }: { title: string; value: number | string; tone?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
