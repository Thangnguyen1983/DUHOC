import { errorMessage } from "@/lib/errors";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getMyOrder, startCoursePayment } from "@/lib/courses/orders.functions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/public-layout";

export const Route = createFileRoute("/thanh-toan/$id")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Thanh toán khoá học — KAIZEN" }, { name: "robots", content: "noindex" }] }),
});

const PROVIDERS: { key: "pay2s" | "momo" | "zalopay" | "manual"; label: string; hint: string }[] = [
  { key: "pay2s", label: "PAY2S — Thẻ ATM / QR ngân hàng", hint: "Cổng thanh toán nội địa, chuyển khoản NAPAS 24/7." },
  { key: "momo", label: "Ví MoMo", hint: "Quét mã hoặc mở app MoMo để thanh toán." },
  { key: "zalopay", label: "ZaloPay", hint: "Thanh toán qua ZaloPay." },
  { key: "manual", label: "Chuyển khoản QR (VietQR)", hint: "Chuyển khoản thủ công, KAIZEN xác nhận trong 1-4 giờ." },
];

function CheckoutPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getMyOrder);
  const start = useServerFn(startCoursePayment);
  const nav = useNavigate();
  const [qr, setQr] = useState<string | null>(null);
  const [choice, setChoice] = useState<typeof PROVIDERS[number]["key"]>("pay2s");

  const order = useQuery({ queryKey: ["order", id], queryFn: () => fetchOrder({ data: { id } }) });

  const startMut = useMutation({
    mutationFn: () => start({ data: { orderId: id, provider: choice } }),
    onSuccess: (res) => {
      if (res.redirectUrl) window.location.href = res.redirectUrl;
      else if (res.qrDataUrl) setQr(res.qrDataUrl);
      else toast.info("Đã ghi nhận, KAIZEN sẽ liên hệ xác nhận.");
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  if (order.isLoading) return <PublicLayout><div className="py-20 text-center text-muted-foreground">Đang tải...</div></PublicLayout>;
  if (order.isError || !order.data) return <PublicLayout><div className="py-20 text-center text-destructive">Không tìm thấy đơn hàng</div></PublicLayout>;

  const o = order.data as any;

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-sm text-muted-foreground">Đơn hàng</div>
          <div className="text-xl font-bold">{o.order_no}</div>
          <div className="mt-4 divide-y">
            {o.items.map((it: any) => (
              <div key={it.id} className="flex justify-between py-2 text-sm">
                <span>{it.title_snapshot} × {it.qty}</span>
                <span>{(it.price_vnd * it.qty).toLocaleString("vi-VN")}₫</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t pt-3 text-sm"><span>Tạm tính</span><span>{o.subtotal_vnd.toLocaleString("vi-VN")}₫</span></div>
          {o.discount_vnd > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Giảm giá</span><span>−{o.discount_vnd.toLocaleString("vi-VN")}₫</span></div>}
          <div className="mt-2 flex justify-between text-lg font-bold text-primary"><span>Tổng cộng</span><span>{o.total_vnd.toLocaleString("vi-VN")}₫</span></div>
        </div>

        {o.status !== "pending" ? (
          <div className="rounded-2xl border bg-emerald-50 p-6 text-center">
            <div className="text-lg font-semibold text-emerald-700">Đơn hàng đã {o.status === "paid" ? "thanh toán" : o.status}</div>
            <Button className="mt-4" onClick={() => nav({ to: "/hoc-vien/lop-hoc" })}>Vào khu học viên</Button>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="font-semibold">Chọn phương thức thanh toán</div>
            {PROVIDERS.map((p) => (
              <label key={p.key} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${choice === p.key ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
                <input type="radio" name="prov" checked={choice === p.key} onChange={() => setChoice(p.key)} className="mt-1" />
                <div>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.hint}</div>
                </div>
              </label>
            ))}
            <Button className="w-full" size="lg" disabled={startMut.isPending} onClick={() => startMut.mutate()}>
              {startMut.isPending ? "Đang tạo giao dịch..." : `Thanh toán ${o.total_vnd.toLocaleString("vi-VN")}₫`}
            </Button>
            {qr && (
              <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-center">
                <div className="mb-2 text-sm">Quét QR để chuyển khoản. Nội dung tự điền: <b>KAIZEN {o.order_no}</b></div>
                <img src={qr} alt="VietQR" className="mx-auto max-w-xs" />
                <div className="mt-2 text-xs text-muted-foreground">Sau khi chuyển khoản, KAIZEN sẽ xác nhận và kích hoạt khoá học trong 1-4 giờ.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
