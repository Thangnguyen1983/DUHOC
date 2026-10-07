import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSalesKpi } from "@/lib/leads/distribution.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Bảng KPI telesales: lead nhận, tốc độ phản hồi, tỷ lệ chốt. */
export function SalesKpiPanel() {
  const fetchKpi = useServerFn(getSalesKpi);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [range, setRange] = useState<{ from?: string; to?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ["sales-kpi", range],
    queryFn: () => fetchKpi({ data: range }),
  });

  const totals = data?.totals;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Từ ngày</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Đến ngày</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <Button
          variant="outline"
          onClick={() =>
            setRange({ from: from || undefined, to: to ? `${to}T23:59:59` : undefined })
          }
        >
          Lọc
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "Lead được giao", value: totals?.assigned ?? 0 },
          { label: "Đã nhận khách", value: totals?.claimed ?? 0 },
          { label: "Đã chốt", value: totals?.converted ?? 0 },
          { label: "Khách bỏ", value: totals?.lost ?? 0 },
          { label: "Tỷ lệ chốt", value: `${totals?.conversionRate ?? 0}%` },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">Nhân sự</th>
              <th className="px-4 py-2">Được giao</th>
              <th className="px-4 py-2">Nhận khách</th>
              <th className="px-4 py-2">% nhận</th>
              <th className="px-4 py-2">Phản hồi TB</th>
              <th className="px-4 py-2">Chốt</th>
              <th className="px-4 py-2">% chốt</th>
              <th className="px-4 py-2">Khách bỏ</th>
              <th className="px-4 py-2">Quá hạn</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                  Đang tải…
                </td>
              </tr>
            )}
            {!isLoading && (data?.agents ?? []).length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                  Chưa có dữ liệu lead trong khoảng thời gian này.
                </td>
              </tr>
            )}
            {(data?.agents ?? []).map((a: any) => (
              <tr key={a.id}>
                <td className="px-4 py-2 font-medium">{a.name}</td>
                <td className="px-4 py-2">{a.assigned}</td>
                <td className="px-4 py-2">{a.claimed}</td>
                <td className="px-4 py-2">{a.claimRate}%</td>
                <td className="px-4 py-2">
                  {a.avgResponseMinutes == null ? "—" : `${a.avgResponseMinutes} phút`}
                </td>
                <td className="px-4 py-2">{a.converted}</td>
                <td className="px-4 py-2">{a.conversionRate}%</td>
                <td className="px-4 py-2">{a.lost}</td>
                <td className="px-4 py-2">{a.overdue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
