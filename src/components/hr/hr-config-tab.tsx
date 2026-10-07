import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { errorMessage } from "@/lib/errors";
import { getHrConfig, saveHrConfig, currentAttendanceQr } from "@/lib/hr/hr-config.functions";
import { calcInsurance, calcTax, type HrConfig } from "@/lib/hr/hr-config";
import { vnd, selectCls } from "@/components/hr/hr-shared";

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      {desc && <p className="mb-3 text-xs text-muted-foreground">{desc}</p>}
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm"><span className="text-xs text-muted-foreground">{label}</span>{children}</label>;
}
const num = (v: string) => (v === "" ? 0 : Number(v));

export function HrConfigTab() {
  const qc = useQueryClient();
  const getFn = useServerFn(getHrConfig);
  const saveFn = useServerFn(saveHrConfig);
  const q = useQuery({ queryKey: ["hr-config"], queryFn: () => getFn() });
  const [c, setC] = useState<HrConfig | null>(null);
  const [ipText, setIpText] = useState("");
  const [sample, setSample] = useState(15_000_000);
  useEffect(() => {
    if (q.data && !c) { setC(q.data.config); setIpText(q.data.config.attendance.allowed_ips.join("\n")); }
  }, [q.data, c]);
  const save = useMutation({
    mutationFn: () => saveFn({ data: { ...c!, attendance: { ...c!.attendance, allowed_ips: ipText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) } } }),
    onSuccess: () => { toast.success("Đã lưu cấu hình nhân sự"); setC(null); qc.invalidateQueries({ queryKey: ["hr-config"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (q.error) return <p className="text-sm text-destructive">{errorMessage(q.error)}</p>;
  if (!c) return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  const set = (patch: Partial<HrConfig>) => setC({ ...c, ...patch });
  const ins = c.insurance, tax = c.tax, att = c.attendance;
  const sampleIns = calcInsurance(c, sample, 0);
  const sampleTax = calcTax(c, sample, sampleIns, 0);

  return (
    <div className="space-y-4">
      <Section title="Ngày phép, giờ làm, ngày công" desc="Áp dụng cho chấm công, đơn nghỉ và bảng lương tính từ lần sau.">
        <div className="grid gap-3 sm:grid-cols-3">
          <F label="Số ngày phép năm (mặc định cho mọi người)"><Input type="number" min={0} value={c.annual_leave_days} onChange={(e) => set({ annual_leave_days: num(e.target.value) })} /></F>
          <F label="Vào ca sau giờ này tính là đi muộn"><Input type="time" value={c.late_after} onChange={(e) => set({ late_after: e.target.value })} /></F>
          <F label="Số ngày công chuẩn mỗi tháng"><Input type="number" min={1} max={31} value={c.standard_days} onChange={(e) => set({ standard_days: num(e.target.value) })} /></F>
        </div>
      </Section>

      <Section title="Bảo hiểm bắt buộc (phần người lao động đóng)">
        <div className="flex items-center gap-2 text-sm"><Switch checked={ins.auto} onCheckedChange={(v) => set({ insurance: { ...ins, auto: v } })} /> Tự động tính trong bảng lương</div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <F label="BHXH (%)"><Input type="number" step={0.1} value={ins.bhxh} onChange={(e) => set({ insurance: { ...ins, bhxh: num(e.target.value) } })} /></F>
          <F label="BHYT (%)"><Input type="number" step={0.1} value={ins.bhyt} onChange={(e) => set({ insurance: { ...ins, bhyt: num(e.target.value) } })} /></F>
          <F label="BHTN (%)"><Input type="number" step={0.1} value={ins.bhtn} onChange={(e) => set({ insurance: { ...ins, bhtn: num(e.target.value) } })} /></F>
          <F label="Mức lương đóng">
            <select className={selectCls} value={ins.base} onChange={(e) => set({ insurance: { ...ins, base: e.target.value as any } })}>
              <option value="base_salary">Lương cơ bản</option><option value="base_plus_allowance">Lương cơ bản + phụ cấp</option>
            </select>
          </F>
          <F label="Mức trần lương đóng (đ, 0 = không trần)"><Input type="number" value={ins.cap} onChange={(e) => set({ insurance: { ...ins, cap: num(e.target.value) } })} /></F>
        </div>
      </Section>

      <Section title="Thuế thu nhập cá nhân" desc="Biểu thuế luỹ tiến theo thu nhập tính thuế mỗi tháng. Để trống ô 'Đến' ở bậc cuối.">
        <div className="flex items-center gap-2 text-sm"><Switch checked={tax.auto} onCheckedChange={(v) => set({ tax: { ...tax, auto: v } })} /> Tự động tính trong bảng lương</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Giảm trừ bản thân (đ/tháng)"><Input type="number" value={tax.personal_deduction} onChange={(e) => set({ tax: { ...tax, personal_deduction: num(e.target.value) } })} /></F>
          <F label="Giảm trừ mỗi người phụ thuộc (đ/tháng)"><Input type="number" value={tax.dependent_deduction} onChange={(e) => set({ tax: { ...tax, dependent_deduction: num(e.target.value) } })} /></F>
        </div>
        <div className="space-y-2">
          {tax.brackets.map((b, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-14">Bậc {i + 1}</span>
              <Input className="w-44" type="number" placeholder="Đến (đ) — trống = trở lên" value={b.upTo ?? ""} aria-label={`Bậc ${i + 1} đến`}
                onChange={(e) => { const br = [...tax.brackets]; br[i] = { ...b, upTo: e.target.value === "" ? null : Number(e.target.value) }; set({ tax: { ...tax, brackets: br } }); }} />
              <Input className="w-20" type="number" value={b.rate} aria-label={`Bậc ${i + 1} thuế suất`}
                onChange={(e) => { const br = [...tax.brackets]; br[i] = { ...b, rate: num(e.target.value) }; set({ tax: { ...tax, brackets: br } }); }} />%
              <Button size="icon" variant="ghost" aria-label="Xoá bậc" onClick={() => set({ tax: { ...tax, brackets: tax.brackets.filter((_, j) => j !== i) } })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => set({ tax: { ...tax, brackets: [...tax.brackets, { upTo: null, rate: 0 }] } })}><Plus className="mr-1 h-4 w-4" />Thêm bậc</Button>
        </div>
        <div className="rounded-lg bg-muted p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">Thử tính với thu nhập <Input className="w-40" type="number" value={sample} onChange={(e) => setSample(num(e.target.value))} /> đ, không người phụ thuộc:</div>
          <div className="mt-1">Bảo hiểm <b>{vnd(sampleIns)}</b> · Thuế TNCN <b>{vnd(sampleTax)}</b> · Còn lại <b>{vnd(sample - sampleIns - sampleTax)}</b></div>
        </div>
      </Section>

      <Section title="Cách chấm công" desc="Nếu không bật cách nào, nhân viên chỉ cần bấm Vào ca / Ra ca.">
        <div className="grid gap-2 sm:grid-cols-2">
          {([["gps", "Định vị — phải đứng trong bán kính văn phòng"], ["wifi", "Wifi văn phòng — phải dùng mạng của văn phòng"], ["qr", "Mã QR — quét mã đổi liên tục tại văn phòng"], ["photo", "Hình ảnh — chụp ảnh khuôn mặt khi chấm"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
              <Switch checked={att.methods[k]} onCheckedChange={(v) => set({ attendance: { ...att, methods: { ...att.methods, [k]: v } } })} />{l}
            </label>
          ))}
        </div>
        <F label="Khi bật nhiều cách">
          <select className={selectCls + " max-w-sm"} value={att.match} onChange={(e) => set({ attendance: { ...att, match: e.target.value as any } })}>
            <option value="all">Phải đạt tất cả các cách đã bật</option><option value="any">Chỉ cần đạt một cách</option>
          </select>
        </F>

        {att.methods.gps && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="text-sm font-medium">Văn phòng được chấm công</div>
            {att.offices.map((o, i) => {
              const upd = (p: any) => { const of = [...att.offices]; of[i] = { ...o, ...p }; set({ attendance: { ...att, offices: of } }); };
              return (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_8rem_8rem_6rem_auto]">
                  <Input placeholder="Tên văn phòng" value={o.name} onChange={(e) => upd({ name: e.target.value })} />
                  <Input type="number" step="any" placeholder="Vĩ độ" value={o.lat} onChange={(e) => upd({ lat: num(e.target.value) })} />
                  <Input type="number" step="any" placeholder="Kinh độ" value={o.lng} onChange={(e) => upd({ lng: num(e.target.value) })} />
                  <Input type="number" placeholder="Bán kính m" value={o.radius} onChange={(e) => upd({ radius: num(e.target.value) })} />
                  <Button size="icon" variant="ghost" aria-label="Xoá văn phòng" onClick={() => set({ attendance: { ...att, offices: att.offices.filter((_, j) => j !== i) } })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              );
            })}
            <Button size="sm" variant="outline" onClick={() => {
              if (!navigator.geolocation) return toast.error("Trình duyệt không hỗ trợ định vị");
              navigator.geolocation.getCurrentPosition(
                (p) => set({ attendance: { ...att, offices: [...att.offices, { name: "Văn phòng", lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), radius: 150 }] } }),
                () => toast.error("Không lấy được vị trí — hãy cho phép truy cập vị trí"), { enableHighAccuracy: true, timeout: 15000 });
            }}><MapPin className="mr-1 h-4 w-4" />Thêm vị trí tôi đang đứng</Button>
          </div>
        )}

        {att.methods.wifi && (
          <div className="space-y-1 rounded-lg border p-3">
            <F label="Địa chỉ mạng của wifi văn phòng (mỗi dòng một địa chỉ, có thể dùng dấu * ở cuối)">
              <textarea className="min-h-20 rounded-md border bg-background p-2 text-sm" value={ipText} onChange={(e) => setIpText(e.target.value)} />
            </F>
            <p className="text-xs text-muted-foreground">Địa chỉ mạng bạn đang dùng: <b>{q.data?.myIp || "không xác định"}</b>
              {q.data?.myIp && <Button size="sm" variant="link" onClick={() => setIpText((t) => (t ? t + "\n" : "") + q.data!.myIp)}>Thêm địa chỉ này</Button>}
              — hãy mở trang này khi đang kết nối wifi văn phòng.</p>
          </div>
        )}

        {att.methods.qr && (
          <div className="space-y-2 rounded-lg border p-3">
            <F label="Mã QR đổi sau mỗi (phút)"><Input className="w-24" type="number" min={1} max={60} value={att.qr_minutes} onChange={(e) => set({ attendance: { ...att, qr_minutes: num(e.target.value) } })} /></F>
            {q.data?.config.attendance.qr_secret ? <QrScreen /> : <p className="text-xs text-muted-foreground">Lưu cấu hình để tạo mã QR.</p>}
          </div>
        )}
        {att.methods.photo && <p className="text-xs text-muted-foreground">Ảnh chấm công được lưu kín, chỉ người quản trị nhân sự xem được trong thẻ Chấm công.</p>}
      </Section>

      <div className="sticky bottom-2 flex justify-end">
        <Button size="lg" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Đang lưu…" : "Lưu cấu hình"}</Button>
      </div>
    </div>
  );
}

/** Màn hình QR đặt tại văn phòng — tự đổi mã. */
function QrScreen() {
  const fn = useServerFn(currentAttendanceQr);
  const [img, setImg] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true, timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const r = await fn();
        const url = `${window.location.origin}/admin/ca-nhan?qr=${r.code}`;
        const data = await QRCode.toDataURL(url, { margin: 1, width: 320 });
        if (!alive) return;
        setImg(data); setCode(r.code); setErr("");
        timer = setTimeout(tick, Math.min(r.expiresInMs + 500, 60000));
      } catch (e) { if (alive) setErr(errorMessage(e)); }
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [fn]);
  if (err) return <p className="text-sm text-destructive">{err}</p>;
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-background p-3">
      {img && <img src={img} alt="Mã QR chấm công" className="h-56 w-56" />}
      <div className="font-mono text-lg tracking-widest">{code}</div>
      <p className="text-center text-xs text-muted-foreground">Mở trang này trên máy tính/máy tính bảng đặt ở cửa văn phòng. Nhân viên quét bằng camera điện thoại để chấm công.</p>
    </div>
  );
}
