import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { errorMessage } from "@/lib/errors";
import { getMyHr, checkInOut, submitLeave, cancelLeave } from "@/lib/hr/hr.functions";
import {
  vnd, CONTRACT_TYPE_LABEL, LEAVE_TYPE_LABEL, LEAVE_STATUS_LABEL, ATTENDANCE_LABEL, fmtDate, fmtTime, selectCls,
} from "@/components/hr/hr-shared";

export const Route = createFileRoute("/_authenticated/admin/ca-nhan")({
  head: () => ({
    meta: [
      { title: "Nhân sự của tôi — KAIZEN" },
      { name: "description", content: "Chấm công, xin nghỉ phép, xem hợp đồng, KPI và phiếu lương cá nhân." },
      { property: "og:title", content: "Nhân sự của tôi — KAIZEN" },
      { property: "og:description", content: "Chấm công, xin nghỉ phép, xem hợp đồng, KPI và phiếu lương cá nhân." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyHrPage,
});

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-4"><h2 className="mb-3 font-semibold">{title}</h2>{children}</section>;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error("Thiết bị không hỗ trợ định vị"));
    navigator.geolocation.getCurrentPosition(res, () => rej(new Error("Không lấy được vị trí — hãy cho phép trình duyệt truy cập vị trí")), { enableHighAccuracy: true, timeout: 15000 });
  });
}

function compressPhoto(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 720 / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src);
      res(cv.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => rej(new Error("Không đọc được ảnh"));
    img.src = URL.createObjectURL(file);
  });
}

function MyHrPage() {
  const qc = useQueryClient();
  const fn = useServerFn(getMyHr);
  const ciFn = useServerFn(checkInOut);
  const leaveFn = useServerFn(submitLeave);
  const cancelFn = useServerFn(cancelLeave);
  const q = useQuery({ queryKey: ["my-hr"], queryFn: () => fn() });
  const inv = () => qc.invalidateQueries({ queryKey: ["my-hr"] });
  const [qr, setQr] = useState("");
  const [photo, setPhoto] = useState("");
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("qr");
    if (v) setQr(v.toUpperCase());
  }, []);
  const rules = q.data?.attendanceRules;
  const ci = useMutation({
    mutationFn: async (action: "in" | "out") => {
      const payload: any = { action };
      if (rules?.methods.gps) {
        try { const p = await getPosition(); Object.assign(payload, { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }); }
        catch (e) { if (rules.match === "all") throw e; }
      }
      if (rules?.methods.qr && qr) payload.qr = qr;
      if (rules?.methods.photo && photo) payload.photo = photo;
      return ciFn({ data: payload });
    },
    onSuccess: (_r, a) => { toast.success(a === "in" ? "Đã chấm công vào" : "Đã chấm công ra"); setPhoto(""); inv(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const empty = { leave_type: "annual", start_date: "", end_date: "", days: 1, reason: "" };
  const [form, setForm] = useState<any>(empty);
  const leave = useMutation({
    mutationFn: () => leaveFn({ data: { ...form, days: Number(form.days) } }),
    onSuccess: () => { toast.success("Đã gửi đơn, chờ trưởng phòng duyệt"); setForm(empty); inv(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const cancel = useMutation({ mutationFn: (id: string) => cancelFn({ data: { id } }), onSuccess: inv });
  const d = q.data;
  const t = d?.todayRow as any;
  const methodNames = rules ? ([["gps", "định vị"], ["wifi", "wifi văn phòng"], ["qr", "mã QR"], ["photo", "ảnh khuôn mặt"]] as const).filter(([k]) => rules.methods[k]).map(([, l]) => l) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nhân sự của tôi</h1>
        <p className="text-sm text-muted-foreground">{d?.staffCode ? `Mã nhân sự: ${d.staffCode}` : "Chưa có mã nhân sự — liên hệ phòng Nhân sự lập hồ sơ."}</p>
      </div>
      {q.error && <p className="text-sm text-destructive">{errorMessage(q.error)}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`Chấm công hôm nay${d ? ` — ${fmtDate(d.today)}` : ""}`}>
          {methodNames.length > 0 && (
            <div className="mb-3 space-y-2 rounded-lg bg-muted p-2 text-sm">
              <p>Cần {rules!.match === "all" ? "đủ" : "một trong"}: <b>{methodNames.join(", ")}</b></p>
              {rules!.methods.qr && <Input placeholder="Mã QR tại văn phòng (quét bằng camera sẽ tự điền)" value={qr} onChange={(e) => setQr(e.target.value.toUpperCase())} aria-label="Mã QR" />}
              {rules!.methods.photo && (
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded-md border bg-background px-3 py-2 text-sm">
                    {photo ? "Chụp lại" : "Chụp ảnh khuôn mặt"}
                    <input type="file" accept="image/*" capture="user" className="sr-only"
                      onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setPhoto(await compressPhoto(f)); } catch (er) { toast.error(errorMessage(er)); } } e.target.value = ""; }} />
                  </label>
                  {photo && <img src={photo} alt="Ảnh chấm công" className="h-12 w-12 rounded object-cover" />}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" disabled={!!t?.check_in || ci.isPending} onClick={() => ci.mutate("in")}>{ci.isPending ? "Đang kiểm tra…" : "Vào ca"}</Button>
            <Button size="lg" variant="outline" disabled={!t?.check_in || !!t?.check_out || ci.isPending} onClick={() => ci.mutate("out")}>Ra ca</Button>
            <div className="text-sm">Vào: <b>{fmtTime(t?.check_in)}</b> · Ra: <b>{fmtTime(t?.check_out)}</b>{t?.status && <> · {ATTENDANCE_LABEL[t.status]}</>}</div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Vào sau {rules?.lateAfter ?? "08:15"} được ghi là đi muộn. Tháng này đã chấm {d?.monthDays.length ?? 0} ngày.</p>
        </Card>

        <Card title="Nghỉ phép năm">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Được hưởng", d?.leave.total], ["Đã dùng", d?.leave.used], ["Còn lại", d?.leave.remaining]].map(([l, v]) => (
              <div key={l as string} className="rounded-lg bg-muted p-2"><div className="text-xl font-bold">{v ?? "—"}</div><div className="text-xs text-muted-foreground">{l}</div></div>
            ))}
          </div>
        </Card>

        <Card title="Gửi đơn xin nghỉ">
          <div className="grid gap-2 sm:grid-cols-2">
            <select className={selectCls} value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} aria-label="Loại nghỉ">
              {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Input type="number" min={0.5} step={0.5} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} aria-label="Số ngày nghỉ" />
            <label className="grid gap-1 text-xs">Từ ngày<Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label>
            <label className="grid gap-1 text-xs">Đến ngày<Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label>
            <Input className="sm:col-span-2" placeholder="Lý do" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <Button className="mt-2" disabled={!form.start_date || !form.end_date || form.reason.trim().length < 3 || leave.isPending} onClick={() => leave.mutate()}>Gửi đơn</Button>
          <div className="mt-3 space-y-1 text-sm">
            {(d?.leaves ?? []).slice(0, 8).map((l: any) => (
              <div key={l.id} className="flex flex-wrap items-center gap-2 border-b py-1">
                <span>{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</span><span>{LEAVE_TYPE_LABEL[l.leave_type]} · {l.days} ngày</span>
                <Badge variant={l.status === "approved" ? "default" : "outline"}>{LEAVE_STATUS_LABEL[l.status]}</Badge>
                {l.status === "pending" && <Button size="sm" variant="ghost" onClick={() => cancel.mutate(l.id)}>Huỷ</Button>}
                {l.review_note && <span className="text-xs text-muted-foreground">{l.review_note}</span>}
              </div>
            ))}
          </div>
        </Card>

        <Card title="KPI tháng này">
          {(d?.kpis ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Chưa được giao chỉ tiêu.</p> : (
            <div className="space-y-2">{(d?.kpis ?? []).map((k: any) => {
              const pct = Number(k.target) > 0 ? Math.min(100, Math.round((Number(k.actual) / Number(k.target)) * 100)) : 0;
              return (
                <div key={k.id} className="text-sm">
                  <div className="flex justify-between"><span>{k.metric}</span><span>{k.actual}/{k.target}</span></div>
                  <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}</div>
          )}
        </Card>

        <Card title="Hợp đồng của tôi">
          {(d?.contracts ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Chưa có hợp đồng trên hệ thống.</p> :
            (d?.contracts ?? []).map((c: any) => (
              <div key={c.contract_no} className="border-b py-1 text-sm">
                <b>{c.contract_no}</b> · {CONTRACT_TYPE_LABEL[c.contract_type]} · {fmtDate(c.start_date)} → {c.end_date ? fmtDate(c.end_date) : "Không thời hạn"} {c.status !== "active" && "(đã kết thúc)"}
              </div>
            ))}
        </Card>

        <Card title="Phiếu lương">
          {(d?.slips ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Chưa có phiếu lương đã duyệt.</p> :
            (d?.slips ?? []).map((s: any) => (
              <details key={s.id} className="border-b py-1 text-sm">
                <summary className="cursor-pointer">Tháng {s.period.split("-").reverse().join("/")} — <b>{vnd(s.net_pay)}</b></summary>
                <div className="grid grid-cols-2 gap-x-4 py-2 text-xs">
                  <span>Công</span><span>{s.work_days}/{s.standard_days}</span>
                  <span>Lương cơ bản</span><span>{vnd(s.base_salary)}</span>
                  <span>Phụ cấp</span><span>{vnd(s.allowance)}</span>
                  <span>Thưởng KPI</span><span>{vnd(s.kpi_bonus)}</span>
                  <span>Thưởng khác</span><span>{vnd(s.other_bonus)}</span>
                  <span>Bảo hiểm</span><span>−{vnd(s.insurance)}</span>
                  <span>Thuế TNCN</span><span>−{vnd(s.tax)}</span>
                  <span>Khấu trừ</span><span>−{vnd(s.deductions)}</span>
                </div>
              </details>
            ))}
        </Card>
      </div>
    </div>
  );
}
