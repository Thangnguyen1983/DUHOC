import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { errorMessage } from "@/lib/errors";
import { createCommission, listStudentCommissions } from "@/lib/commissions/commissions.functions";
import { COMMISSION_STATUS_LABEL, COMMISSION_STATUS_VARIANT, vnd } from "./labels";

const digits = (v: string) => Number(v.replace(/\D/g, "")) || 0;
const fmt = (v: string) => { const n = v.replace(/\D/g, ""); return n ? Number(n).toLocaleString("vi-VN") : ""; };

export function StudentCommissionsPanel({ studentProfileId }: { studentProfileId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listStudentCommissions);
  const createFn = useServerFn(createCommission);
  const key = ["student-commissions", studentProfileId];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => listFn({ data: { student_profile_id: studentProfileId } }) });
  const [f, setF] = useState({ code: "", title: "", revenue: "", amount: "" });

  const add = useMutation({
    mutationFn: () => createFn({ data: {
      student_profile_id: studentProfileId, collaborator_code: f.code.trim().toUpperCase(),
      order_title: f.title, order_revenue: digits(f.revenue), commission_amount: digits(f.amount),
    } }),
    onSuccess: () => {
      toast.success("Đã ghi nhận hoa hồng, chờ duyệt");
      setF({ code: "", title: "", revenue: "", amount: "" });
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["commissions"] });
    },
    onError: (e) => toast.error(errorMessage(e, "Không ghi nhận được hoa hồng")),
  });

  const items = (data?.items ?? []) as any[];
  return (
    <div className="space-y-4">
      <form className="rounded-lg border p-4 space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
        <h3 className="font-semibold">Ghi nhận đơn hàng giới thiệu</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label htmlFor="c-code">Mã CTV <span className="text-destructive">*</span></Label>
            <Input id="c-code" required aria-required="true" placeholder="KZ-CTV-2608-0001" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
          <div><Label htmlFor="c-title">Đơn hàng / chương trình</Label>
            <Input id="c-title" placeholder="Để trống sẽ lấy theo chương trình" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label htmlFor="c-rev">Doanh thu (VNĐ)</Label>
            <Input id="c-rev" inputMode="numeric" value={fmt(f.revenue)} onChange={(e) => setF({ ...f, revenue: e.target.value })} /></div>
          <div><Label htmlFor="c-amt">Hoa hồng (VNĐ)</Label>
            <Input id="c-amt" inputMode="numeric" value={fmt(f.amount)} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
        </div>
        <Button type="submit" disabled={add.isPending || !f.code.trim()}>Ghi nhận hoa hồng</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/50 text-left"><tr>
            <th className="p-2">Ngày</th><th className="p-2">CTV</th><th className="p-2">Đơn hàng</th>
            <th className="p-2 text-right">Doanh thu</th><th className="p-2 text-right">Hoa hồng</th><th className="p-2">Trạng thái</th>
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Đang tải…</td></tr>}
            {!isLoading && !items.length && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chưa có hoa hồng cho hồ sơ này.</td></tr>}
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{new Date(r.created_at).toLocaleDateString("vi-VN")}</td>
                <td className="p-2"><div className="font-medium">{r.collaborator_code}</div><div className="text-xs text-muted-foreground">{r.sales_agents?.display_name}</div></td>
                <td className="p-2">{r.order_title ?? "—"}</td>
                <td className="p-2 text-right">{vnd(r.order_revenue)}</td>
                <td className="p-2 text-right">{vnd(r.commission_amount)}</td>
                <td className="p-2"><Badge variant={COMMISSION_STATUS_VARIANT[r.status]}>{COMMISSION_STATUS_LABEL[r.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
