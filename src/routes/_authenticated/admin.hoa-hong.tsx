import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { errorMessage } from "@/lib/errors";
import { useMyAccess } from "@/lib/rbac/use-access";
import { listCommissions, updateCommissionStatus, type CommissionStatus } from "@/lib/commissions/commissions.functions";
import { COMMISSION_STATUS_LABEL, COMMISSION_STATUS_VARIANT, vnd } from "@/components/commissions/labels";

export const Route = createFileRoute("/_authenticated/admin/hoa-hong")({
  head: () => ({
    meta: [
      { title: "Hoa hồng cộng tác viên — KAIZEN" },
      { name: "description", content: "Đối soát doanh thu và hoa hồng cộng tác viên theo đơn hàng giới thiệu." },
      { property: "og:title", content: "Hoa hồng cộng tác viên — KAIZEN" },
      { property: "og:description", content: "Đối soát doanh thu và hoa hồng cộng tác viên theo đơn hàng giới thiệu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommissionsPage,
});

const FILTERS: Array<{ v: "" | CommissionStatus; label: string }> = [
  { v: "", label: "Tất cả" }, { v: "pending", label: "Chờ duyệt" }, { v: "approved", label: "Đã duyệt" },
  { v: "paid", label: "Đã thanh toán" }, { v: "cancelled", label: "Đã huỷ" },
];

function CommissionsPage() {
  const qc = useQueryClient();
  const { can } = useMyAccess();
  const manage = can("commissions.manage");
  const listFn = useServerFn(listCommissions);
  const updFn = useServerFn(updateCommissionStatus);
  const [status, setStatus] = useState<"" | CommissionStatus>("");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["commissions", status, search],
    queryFn: () => listFn({ data: { status: status || undefined, search: search || undefined } }),
  });
  const items = (data?.items ?? []) as any[];

  const totals = useMemo(() => {
    const t = { revenue: 0, total: 0, paid: 0, due: 0 };
    for (const r of items) {
      if (r.status === "cancelled") continue;
      t.revenue += Number(r.order_revenue); t.total += Number(r.commission_amount);
      if (r.status === "paid") t.paid += Number(r.commission_amount); else t.due += Number(r.commission_amount);
    }
    return t;
  }, [items]);

  const upd = useMutation({
    mutationFn: (v: { id: string; status: CommissionStatus; payment_reference?: string }) => updFn({ data: v }),
    onSuccess: () => { toast.success("Đã cập nhật"); qc.invalidateQueries({ queryKey: ["commissions"] }); },
    onError: (e) => toast.error(errorMessage(e, "Không cập nhật được")),
  });

  const pay = (id: string) => {
    const ref = window.prompt("Nhập số chứng từ / ủy nhiệm chi:");
    if (ref?.trim()) upd.mutate({ id, status: "paid", payment_reference: ref.trim() });
  };
  const cancel = (id: string) => { if (window.confirm("Huỷ khoản hoa hồng này?")) upd.mutate({ id, status: "cancelled" }); };

  const exportCsv = () => {
    const head = ["Ngày", "Mã CTV", "Tên CTV", "Mã học viên", "Học viên", "Đơn hàng", "Doanh thu", "Hoa hồng", "Trạng thái", "Chứng từ"];
    const rows = items.map((r) => [
      new Date(r.created_at).toLocaleDateString("vi-VN"), r.collaborator_code, r.sales_agents?.display_name ?? "",
      r.student_profiles?.student_code ?? "", r.student_profiles?.full_name ?? "", r.order_title ?? "",
      r.order_revenue, r.commission_amount, COMMISSION_STATUS_LABEL[r.status], r.payment_reference ?? "",
    ]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `bang-ke-hoa-hong-ctv.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hoa hồng cộng tác viên</h1>
          <p className="text-sm text-muted-foreground">Ghi nhận khi cán bộ nhập mã CTV vào hồ sơ học viên. Duyệt rồi xác nhận chi trả.</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!items.length}><Download className="mr-1 h-4 w-4" />Xuất bảng kê</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Doanh thu từ CTV", totals.revenue], ["Tổng hoa hồng", totals.total], ["Đã thanh toán", totals.paid], ["Còn phải trả", totals.due]].map(([l, v]) => (
          <div key={l as string} className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">{l}</div>
            <div className="text-lg font-semibold break-words">{vnd(v as number)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button key={f.v} role="tab" aria-selected={status === f.v} size="sm" variant={status === f.v ? "default" : "outline"} onClick={() => setStatus(f.v)}>{f.label}</Button>
          ))}
        </div>
        <Input className="sm:max-w-xs" placeholder="Tìm mã CTV, học viên, đơn hàng…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left"><tr>
            <th className="p-2">Ngày</th><th className="p-2">CTV</th><th className="p-2">Học viên</th><th className="p-2">Đơn hàng</th>
            <th className="p-2 text-right">Doanh thu</th><th className="p-2 text-right">Hoa hồng</th><th className="p-2">Trạng thái</th>
            {manage && <th className="p-2">Thao tác</th>}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Đang tải…</td></tr>}
            {!isLoading && !items.length && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Chưa có khoản hoa hồng nào.</td></tr>}
            {items.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-2">{new Date(r.created_at).toLocaleDateString("vi-VN")}</td>
                <td className="p-2"><div className="font-medium">{r.collaborator_code}</div><div className="text-xs text-muted-foreground">{r.sales_agents?.display_name}</div></td>
                <td className="p-2">
                  <Link to="/admin/students/$id" params={{ id: r.student_profiles.id }} className="font-medium text-primary hover:underline">{r.student_profiles.full_name}</Link>
                  <div className="text-xs text-muted-foreground">{r.student_profiles.student_code}</div>
                </td>
                <td className="p-2">{r.order_title ?? "—"}</td>
                <td className="p-2 text-right">{vnd(r.order_revenue)}</td>
                <td className="p-2 text-right font-medium">{vnd(r.commission_amount)}</td>
                <td className="p-2">
                  <Badge variant={COMMISSION_STATUS_VARIANT[r.status]}>{COMMISSION_STATUS_LABEL[r.status]}</Badge>
                  {r.payment_reference && <div className="mt-1 text-xs text-muted-foreground">CT: {r.payment_reference}</div>}
                </td>
                {manage && (
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {r.status === "pending" && <Button size="sm" onClick={() => upd.mutate({ id: r.id, status: "approved" })}>Duyệt</Button>}
                      {r.status === "approved" && <Button size="sm" onClick={() => pay(r.id)}>Xác nhận chi trả</Button>}
                      {(r.status === "pending" || r.status === "approved") && <Button size="sm" variant="outline" onClick={() => cancel(r.id)}>Huỷ</Button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
