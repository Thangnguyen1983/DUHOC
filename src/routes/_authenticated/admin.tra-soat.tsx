import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { auditActivity, ACTION_LABEL } from "@/lib/students/activity.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tra-soat")({
  component: AuditPage,
});

function AuditPage() {
  const fetchAudit = useServerFn(auditActivity);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const query = useQuery({
    queryKey: ["activity-audit", q, action, from, to],
    queryFn: () =>
      fetchAudit({
        data: {
          q: q || undefined,
          action: action || undefined,
          from: from || undefined,
          to: to ? `${to}T23:59:59` : undefined,
          limit: 300,
        },
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-6 w-6 text-primary" /> Tra soát trách nhiệm hồ sơ
        </h1>
        <p className="text-sm text-muted-foreground">
          Xem ai đã xử lý hồ sơ nào, làm gì và vào lúc nào — dùng cho kiểm tra nội bộ và thanh tra.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="text-xs text-muted-foreground">Học viên (mã hoặc tên)</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="KZ26… hoặc họ tên" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Loại việc</label>
          <select
            className="h-10 w-full rounded-md border bg-background px-2 text-sm"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">Tất cả</option>
            {Object.entries(ACTION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Từ ngày</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Đến ngày</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {(query.data?.byActor?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          {query.data!.byActor.map((a) => (
            <Badge key={a.id} variant="secondary" className="text-sm">
              {a.name}: {a.count} thao tác
            </Badge>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Thời điểm</th>
              <th className="p-3">Học viên</th>
              <th className="p-3">Người xử lý</th>
              <th className="p-3">Việc</th>
              <th className="p-3">Thay đổi</th>
              <th className="p-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {query.isLoading && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  Đang tải…
                </td>
              </tr>
            )}
            {!query.isLoading && (query.data?.items?.length ?? 0) === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  Không có dữ liệu phù hợp
                </td>
              </tr>
            )}
            {(query.data?.items ?? []).map((i: any) => (
              <tr key={i.id}>
                <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(i.created_at).toLocaleString("vi-VN")}
                </td>
                <td className="p-3">
                  {i.student_profiles?.student_code ?? "—"}
                  <div className="text-xs text-muted-foreground">
                    {i.student_profiles?.full_name ?? ""}
                  </div>
                </td>
                <td className="p-3">{i.actor_name}</td>
                <td className="p-3">
                  <Badge variant="outline">{i.action_label}</Badge>
                </td>
                <td className="p-3">
                  {i.field && <span className="text-muted-foreground">{i.field}: </span>}
                  {i.old_value && <span className="line-through opacity-60">{i.old_value}</span>}
                  {i.old_value && i.new_value && <span className="mx-1">→</span>}
                  {i.new_value}
                </td>
                <td className="p-3 text-muted-foreground">{i.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
