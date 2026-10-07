import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { listMyOrders, syncMyEnrollments } from "@/lib/courses/orders.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/hoc-vien/don-hang")({
  component: MyOrdersPage,
  head: () => ({ meta: [{ title: "Đơn hàng của tôi — KAIZEN" }, { name: "robots", content: "noindex" }] }),
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ thanh toán", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Đã thanh toán", cls: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Thất bại", cls: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Đã huỷ", cls: "bg-muted text-muted-foreground" },
  refunded: { label: "Hoàn tiền", cls: "bg-sky-100 text-sky-700" },
};

function MyOrdersPage() {
  const fetch = useServerFn(listMyOrders);
  const sync = useServerFn(syncMyEnrollments);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetch(),
    refetchInterval: 8_000, // realtime: cập nhật status ngay khi webhook về
  });

  // Đồng bộ enrollment ngay khi mở trang (kể cả sau login lại).
  const syncMut = useMutation({
    mutationFn: () => sync({}),
    onSuccess: (r) => {
      if (r.claimed > 0) toast.success(`Đã liên kết ${r.claimed} đơn hàng với tài khoản của bạn`);
      if (r.synced > 0) toast.success(`Đã mở quyền học cho ${r.synced} khoá`);
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
  });

  useEffect(() => {
    syncMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Đơn hàng khoá học</h1>
      {q.isLoading && <div className="text-muted-foreground">Đang tải...</div>}
      {q.data && q.data.items.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Bạn chưa có đơn hàng nào. <Link to="/khoa-hoc" className="text-primary underline">Khám phá khoá học</Link>
        </div>
      )}
      <div className="space-y-3">
        {q.data?.items.map((o: any) => {
          const s = STATUS_LABEL[o.status] ?? { label: o.status, cls: "bg-muted text-muted-foreground" };
          return (
            <div key={o.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <div>
                <div className="font-semibold">#{o.order_no}</div>
                <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("vi-VN")} · {o.payment_provider.toUpperCase()}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary">{o.total_vnd.toLocaleString("vi-VN")}₫</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                {o.status === "pending" && (
                  <Link to="/thanh-toan/$id" params={{ id: o.id }} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Thanh toán</Link>
                )}
                {o.status === "paid" && (
                  <Link to="/hoc-vien" className="rounded-md border px-3 py-1.5 text-xs font-medium">Vào học</Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
