import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errorMessage } from "@/lib/errors";
import { getMyCollaborator, submitReferral } from "@/lib/hr/ctv.functions";
import { vnd, fmtDate, selectCls } from "@/components/hr/hr-shared";
import { COMMISSION_STATUS_LABEL } from "@/components/commissions/labels";

export const Route = createFileRoute("/_authenticated/admin/ctv")({
  head: () => ({
    meta: [
      { title: "Cổng cộng tác viên — KAIZEN" },
      { name: "description", content: "Cộng tác viên giới thiệu ứng viên, theo dõi tiến độ hồ sơ và hoa hồng của mình." },
      { property: "og:title", content: "Cổng cộng tác viên — KAIZEN" },
      { property: "og:description", content: "Cộng tác viên giới thiệu ứng viên, theo dõi tiến độ hồ sơ và hoa hồng của mình." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CtvPortal,
});

const LEAD_LABEL: Record<string, string> = { new: "Mới gửi", contacted: "Đã liên hệ", qualified: "Đang tư vấn", done: "Đã chốt", converted: "Đã chốt", lost: "Không theo" };
const MARKETS = ["Nhật Bản", "Hàn Quốc", "Đài Loan", "Đức", "Châu Âu khác"];

function CtvPortal() {
  const qc = useQueryClient();
  const fn = useServerFn(getMyCollaborator);
  const sendFn = useServerFn(submitReferral);
  const q = useQuery({ queryKey: ["my-ctv"], queryFn: () => fn() });
  const empty = { full_name: "", phone: "", market: "", program: "xkld", note: "" };
  const [form, setForm] = useState<any>(empty);
  const send = useMutation({
    mutationFn: () => sendFn({ data: form }),
    onSuccess: () => { toast.success("Đã gửi ứng viên. Cán bộ phụ trách sẽ liên hệ."); setForm(empty); qc.invalidateQueries({ queryKey: ["my-ctv"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const d = q.data;
  if (q.isLoading) return <p className="p-4 text-sm">Đang tải…</p>;
  if (q.error) return <p className="p-4 text-sm text-destructive">{errorMessage(q.error)}</p>;
  if (!d?.agent) return (
    <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center">
      <h1 className="text-xl font-bold">Cổng cộng tác viên</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tài khoản của bạn chưa được cấp mã cộng tác viên (KZ-CTV). Vui lòng liên hệ cán bộ phụ trách.</p>
    </div>
  );
  const total = d.commissions.filter((c: any) => c.status !== "cancelled").reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
  const paid = d.commissions.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.commission_amount), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Xin chào, {d.agent.display_name || "cộng tác viên"}</h1>
        <p className="text-sm text-muted-foreground">Mã của bạn: <b className="font-mono">{d.agent.collaborator_code}</b></p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Ứng viên đã gửi", String(d.leads.length)], ["Hoa hồng", vnd(total)], ["Đã nhận", vnd(paid)]].map(([l, v]) => (
          <div key={l} className="rounded-xl border bg-card p-3"><div className="text-base font-bold sm:text-xl">{v}</div><div className="text-xs text-muted-foreground">{l}</div></div>
        ))}
      </div>
      <Tabs defaultValue="send">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Giới thiệu</TabsTrigger>
          <TabsTrigger value="mine">Ứng viên</TabsTrigger>
          <TabsTrigger value="money">Hoa hồng</TabsTrigger>
        </TabsList>
        <TabsContent value="send">
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <Input placeholder="Họ tên ứng viên" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} aria-label="Họ tên ứng viên" />
            <Input type="tel" inputMode="tel" placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Số điện thoại" />
            <div className="grid grid-cols-2 gap-2">
              <select className={selectCls} value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} aria-label="Chương trình">
                <option value="xkld">Xuất khẩu lao động</option><option value="du_hoc">Du học</option>
              </select>
              <select className={selectCls} value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} aria-label="Thị trường">
                <option value="">Thị trường…</option>{MARKETS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <Input placeholder="Ghi chú (không bắt buộc)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} aria-label="Ghi chú" />
            <Button className="w-full" size="lg" disabled={send.isPending || !form.full_name || !form.phone || !form.market} onClick={() => send.mutate()}>Gửi ứng viên</Button>
          </div>
        </TabsContent>
        <TabsContent value="mine">
          <div className="space-y-2">
            {d.leads.length === 0 && d.students.length === 0 && <p className="text-sm text-muted-foreground">Bạn chưa gửi ứng viên nào.</p>}
            {d.leads.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 text-sm">
                <div className="min-w-0"><div className="truncate font-medium">{l.full_name}</div><div className="text-xs text-muted-foreground">{l.phone} · {l.market} · {fmtDate(l.created_at)}</div></div>
                <Badge variant="outline" className="shrink-0">{LEAD_LABEL[l.status] ?? l.status}</Badge>
              </div>
            ))}
            {d.students.length > 0 && <h3 className="pt-2 text-sm font-semibold">Đã thành học viên</h3>}
            {d.students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 text-sm">
                <div className="min-w-0"><div className="truncate font-medium">{s.full_name}</div><div className="text-xs text-muted-foreground">{s.student_code} · {s.market ?? ""}</div></div>
                <Badge className="shrink-0">Học viên</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="money">
          <div className="space-y-2">
            {d.commissions.length === 0 && <p className="text-sm text-muted-foreground">Chưa có khoản hoa hồng nào.</p>}
            {d.commissions.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 text-sm">
                <div className="min-w-0"><div className="truncate font-medium">{c.order_title || "Đơn giới thiệu"}</div><div className="text-xs text-muted-foreground">{fmtDate(c.created_at)}{c.paid_at ? ` · trả ${fmtDate(c.paid_at)}` : ""}</div></div>
                <div className="shrink-0 text-right"><div className="font-semibold">{vnd(c.commission_amount)}</div><div className="text-xs">{COMMISSION_STATUS_LABEL[c.status as keyof typeof COMMISSION_STATUS_LABEL] ?? c.status}</div></div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
