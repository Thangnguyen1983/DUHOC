import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListOrders, adminMarkOrderPaid, adminGetOrder } from "@/lib/courses/orders.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShoppingCart, CheckCircle2, RefreshCw, Eye, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/courses/orders")({
  component: OrdersAdmin,
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ TT", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Đã TT", cls: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Thất bại", cls: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Huỷ", cls: "bg-muted text-muted-foreground" },
  refunded: { label: "Hoàn tiền", cls: "bg-sky-100 text-sky-700" },
};

function OrdersAdmin() {
  const list = useServerFn(adminListOrders);
  const mark = useServerFn(adminMarkOrderPaid);
  const getOne = useServerFn(adminGetOrder);
  const qc = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => list(),
    refetchInterval: 10_000, // realtime nhẹ: 10s poll
    refetchIntervalInBackground: false,
  });

  const detail = useQuery({
    queryKey: ["admin-order", detailId],
    queryFn: () => getOne({ data: { id: detailId! } }),
    enabled: !!detailId,
    refetchInterval: detailId ? 5_000 : false,
  });

  const markMut = useMutation({
    mutationFn: (id: string) => mark({ data: { id, note: "Admin xác nhận CK" } }),
    onSuccess: () => { toast.success("Đã ghi nhận & cấp khoá học"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-order"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Đơn hàng khoá học</h1>
          <p className="text-sm text-muted-foreground">Tự động làm mới mỗi 10 giây. Nhấn "Chi tiết" để xem log webhook realtime.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`h-3 w-3 mr-1 ${q.isFetching ? "animate-spin" : ""}`} /> Làm mới
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2">Mã ĐH</th>
              <th className="px-3 py-2">Khách</th>
              <th className="px-3 py-2 text-right">Tổng</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Tạo lúc</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {q.data?.items.map((o: any) => {
              const s = STATUS_LABEL[o.status] ?? { label: o.status, cls: "bg-muted" };
              return (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{o.order_no}</td>
                  <td className="px-3 py-2">{o.customer_name ?? "—"}<div className="text-xs text-muted-foreground">{o.customer_email}</div></td>
                  <td className="px-3 py-2 text-right font-semibold">{o.total_vnd.toLocaleString("vi-VN")}₫</td>
                  <td className="px-3 py-2 uppercase text-xs">{o.payment_provider}</td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("vi-VN")}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setDetailId(o.id)}>
                        <Eye className="h-3 w-3 mr-1" /> Chi tiết
                      </Button>
                      {o.status === "pending" && (
                        <Button size="sm" variant="outline" disabled={markMut.isPending} onClick={() => { if (confirm(`Xác nhận đã nhận CK ${o.order_no}?`)) markMut.mutate(o.id); }}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Xác nhận
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {q.data && q.data.items.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">Chưa có đơn hàng.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng {detail.data ? `#${(detail.data as any).order_no}` : ""}</DialogTitle>
          </DialogHeader>
          {detail.isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</div>}
          {detail.data && <OrderDetailBody order={detail.data as any} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetailBody({ order }: { order: any }) {
  const s = STATUS_LABEL[order.status] ?? { label: order.status, cls: "bg-muted" };
  const logs: any[] = Array.isArray(order.payment_payload?.webhook_logs) ? order.payment_payload.webhook_logs : [];
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Info label="Trạng thái"><span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span></Info>
        <Info label="Provider">{String(order.payment_provider).toUpperCase()}</Info>
        <Info label="Khách">{order.customer_name || "—"}<div className="text-xs text-muted-foreground">{order.customer_email}</div></Info>
        <Info label="Số tiền"><span className="font-bold text-primary">{order.total_vnd.toLocaleString("vi-VN")}₫</span></Info>
        <Info label="Payment ref"><code className="text-xs">{order.payment_ref || "—"}</code></Info>
        <Info label="Paid at">{order.paid_at ? new Date(order.paid_at).toLocaleString("vi-VN") : "—"}</Info>
      </div>

      <div>
        <div className="font-semibold mb-1">Sản phẩm</div>
        <ul className="rounded-lg border divide-y">
          {(order.items ?? []).map((i: any) => (
            <li key={i.id} className="p-2 flex justify-between">
              <span>{i.title_snapshot}</span>
              <span className="font-medium">{i.price_vnd.toLocaleString("vi-VN")}₫ × {i.qty}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="font-semibold mb-1 flex items-center gap-2">Log webhook <span className="text-xs text-muted-foreground">({logs.length} bản ghi · tự làm mới 5s)</span></div>
        {logs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Chưa có webhook nào cho đơn này.</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logs.slice().reverse().map((l, idx) => (
              <details key={idx} className="rounded-lg border bg-muted/30 p-2">
                <summary className="cursor-pointer text-xs flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 ${l.type === "paid" ? "bg-emerald-100 text-emerald-700" : l.type === "failed" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{l.type}</span>
                  <span className="uppercase">{l.provider ?? "?"}</span>
                  <span className="text-muted-foreground">{l.at ? new Date(l.at).toLocaleString("vi-VN") : ""}</span>
                  {typeof l.amountVnd === "number" && <span className="ml-auto">{l.amountVnd.toLocaleString("vi-VN")}₫</span>}
                </summary>
                <pre className="mt-2 text-[10px] leading-tight bg-background rounded p-2 overflow-x-auto">{JSON.stringify(l, null, 2)}</pre>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
