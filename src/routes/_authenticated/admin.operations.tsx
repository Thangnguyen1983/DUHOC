import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  scanSlaOverdue,
  listProvisionQueue,
  processProvisionQueue,
  enqueueMissingAccounts,
} from "@/lib/operations.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Send, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/operations")({
  component: OperationsPage,
});

function OperationsPage() {
  const scanFn = useServerFn(scanSlaOverdue);
  const listQueueFn = useServerFn(listProvisionQueue);
  const processFn = useServerFn(processProvisionQueue);
  const enqueueFn = useServerFn(enqueueMissingAccounts);
  const qc = useQueryClient();

  const sla = useQuery({
    queryKey: ["ops-sla"],
    queryFn: () => scanFn({ data: { notify: false } }),
  });
  const queue = useQuery({ queryKey: ["ops-queue"], queryFn: () => listQueueFn() });

  const notifyMut = useMutation({
    mutationFn: () => scanFn({ data: { notify: true } }),
    onSuccess: (r) => toast.success(`Đã gửi Telegram: ${r.total} hồ sơ quá hạn`),
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });
  const processMut = useMutation({
    mutationFn: (id?: string) => processFn({ data: id ? { id } : {} }),
    onSuccess: (r) => {
      toast.success(`Đã xử lý ${r.processed} mục`);
      qc.invalidateQueries({ queryKey: ["ops-queue"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });
  const enqueueMut = useMutation({
    mutationFn: () => enqueueFn(),
    onSuccess: (r) => {
      toast.success(`Đã thêm ${r.added} hồ sơ vào hàng đợi`);
      qc.invalidateQueries({ queryKey: ["ops-queue"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vận hành — SLA & Tài khoản Portal</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi hồ sơ vượt SLA và cấp tài khoản Portal cho học viên.
        </p>
      </div>

      <Tabs defaultValue="sla">
        <TabsList>
          <TabsTrigger value="sla">
            <AlertTriangle className="h-4 w-4 mr-1" /> SLA quá hạn (
            {sla.data?.total ?? "…"})
          </TabsTrigger>
          <TabsTrigger value="queue">
            <UserPlus className="h-4 w-4 mr-1" /> Cấp tài khoản Portal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sla" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => sla.refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Quét lại
            </Button>
            <Button
              onClick={() => notifyMut.mutate()}
              disabled={notifyMut.isPending || (sla.data?.total ?? 0) === 0}
            >
              <Send className="h-4 w-4 mr-1" />
              {notifyMut.isPending ? "Đang gửi..." : "Gửi cảnh báo Telegram"}
            </Button>
          </div>
          <div className="rounded-lg border bg-card divide-y">
            {sla.isLoading && <div className="p-6 text-muted-foreground">Đang quét...</div>}
            {sla.data && sla.data.total === 0 && (
              <div className="p-6 text-center text-emerald-600">🎉 Không có hồ sơ nào quá hạn.</div>
            )}
            {sla.data?.overdue.map((o: any) => (
              <a
                key={o.instance_id}
                href={`/admin/students/${o.student_profile_id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/40"
              >
                <div>
                  <div className="font-medium">{o.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.phone ?? "—"} · Bước: <strong>{o.step_label}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">
                    Trễ {Math.round(o.hours_elapsed - o.sla_hours)}h
                  </Badge>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    SLA {o.sla_hours}h · cập nhật {new Date(o.updated_at).toLocaleString("vi-VN")}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => enqueueMut.mutate()} disabled={enqueueMut.isPending}>
              <UserPlus className="h-4 w-4 mr-1" />
              {enqueueMut.isPending ? "Đang quét..." : "Quét hồ sơ chưa có tài khoản"}
            </Button>
            <Button onClick={() => processMut.mutate(undefined)} disabled={processMut.isPending}>
              <Send className="h-4 w-4 mr-1" />
              {processMut.isPending ? "Đang gửi mời..." : "Xử lý hàng đợi"}
            </Button>
            <Button variant="outline" onClick={() => queue.refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-lg border bg-card divide-y">
            {queue.isLoading && <div className="p-6 text-muted-foreground">Đang tải...</div>}
            {queue.data?.items.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">Hàng đợi trống.</div>
            )}
            {queue.data?.items.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">
                    {r.student_profiles?.full_name ?? r.full_name} ·{" "}
                    <span className="text-xs text-muted-foreground">{r.email}</span>
                  </div>
                  {r.error && <div className="text-xs text-red-600 mt-1">{r.error}</div>}
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Tạo {new Date(r.created_at).toLocaleString("vi-VN")} · Thử {r.attempts} lần
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.status === "done"
                        ? "default"
                        : r.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {r.status}
                  </Badge>
                  {r.status !== "done" && (
                    <Button size="sm" variant="ghost" onClick={() => processMut.mutate(r.id)}>
                      Gửi mời
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
