import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Plane,
  Users,
  CalendarClock,
  CheckCircle2,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorMessage } from "@/lib/errors";
import { GeoPicker } from "@/components/catalog/geo-picker";
import {
  listDepartures,
  getDepartureStats,
  getOrientationWarnings,
  saveDeparture,
  deleteDeparture,
  markDeparted,
  searchStudentsForDeparture,
  prefillFromStudent,
  previewImport,
  commitImport,
  exportTemplate,
  downloadBlankTemplate,
} from "@/lib/departure/departure.functions";
import {
  DEPARTURE_STATUS,
  GENDER_LABEL,
  MARITAL_LABEL,
  TEMPLATE_HEADERS,
  PROGRAM_TYPE_LABEL,
  CONTRACT_TYPE_LABEL,
  type DepartureRecord,
} from "@/lib/departure/fields";

export const Route = createFileRoute("/_authenticated/admin/xuat-canh")({
  component: DeparturePage,
  head: () => ({ meta: [
    { title: "Quản lý xuất cảnh — KAIZEN" },
    { name: "description", content: "Theo dõi hồ sơ và tình trạng giáo dục định hướng trước xuất cảnh tại KAIZEN." },
    { property: "og:title", content: "Quản lý xuất cảnh — KAIZEN" },
    { property: "og:description", content: "Theo dõi hồ sơ và tình trạng giáo dục định hướng trước xuất cảnh tại KAIZEN." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

const COLORS = ["#C92026", "#3F7D3A", "#2563EB", "#D97706", "#7C3AED", "#0891B2", "#DB2777", "#65A30D"];

const emptyForm = {
  id: undefined as string | undefined,
  student_profile_id: null as string | null,
  id_no: "",
  id_issue_date: "",
  passport_no: "",
  passport_issue_date: "",
  full_name: "",
  gender: "male",
  dob: "",
  marital_status: "",
  place_of_birth: "",
  phone: "",
  current_address: "",
  province: "",
  ward: "",
  ethnicity: "",
  religion: "",
  education_level: "",
  worked_abroad: false,
  land_lost: false,
  poor_household: false,
  veteran: false,
  ethnic_minority: false,
  destination_country: "",
  program_type: "",
  contract_type: "",
  occupation: "",
  employer_name: "",
  planned_departure_date: "",
  actual_departure_date: "",
  flight_no: "",
  departure_airport: "",
  arrival_airport: "",
  status: "planned",
  note: "",
};
type Form = typeof emptyForm;

function clean(form: Form) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(form)) {
    if (v === "" ) out[k] = k === "id" ? undefined : null;
    else out[k] = v;
  }
  if (!form.id) delete out["id"];
  if (!form.marital_status) out["marital_status"] = null;
  return out;
}

function downloadBase64(name: string, base64: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function DeparturePage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    country: "",
    from: "",
    to: "",
    date_field: "planned" as "planned" | "actual",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const listFn = useServerFn(listDepartures);
  const statsFn = useServerFn(getDepartureStats);
  const orientationFn = useServerFn(getOrientationWarnings);
  const saveFn = useServerFn(saveDeparture);
  const delFn = useServerFn(deleteDeparture);
  const departFn = useServerFn(markDeparted);
  const exportFn = useServerFn(exportTemplate);
  const blankFn = useServerFn(downloadBlankTemplate);

  const query = useMemo(
    () => ({
      q: filters.q || undefined,
      status: filters.status || undefined,
      country: filters.country || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      date_field: filters.date_field,
    }),
    [filters],
  );

  const list = useQuery({
    queryKey: ["departures", query],
    queryFn: () => listFn({ data: query }),
    staleTime: 20_000,
  });
  const stats = useQuery({
    queryKey: ["departure-stats", query],
    queryFn: () => statsFn({ data: query }),
    staleTime: 20_000,
  });

  const items = (list.data?.items ?? []) as DepartureRecord[];
  const orientationIds = useMemo(() => [...new Set(items.filter((r) => r.status === "planned").map((r) => r.student_profile_id).filter((id): id is string => Boolean(id)))], [items]);
  const orientation = useQuery({
    queryKey: ["departure-orientation-warnings", orientationIds],
    queryFn: () => orientationFn({ data: { student_ids: orientationIds } }),
    enabled: orientationIds.length > 0,
    staleTime: 30_000,
  });
  const s = stats.data;

  const countries = useMemo(
    () => Array.from(new Set(items.map((r) => r.destination_country).filter(Boolean))) as string[],
    [items],
  );

  function refresh() {
    qc.invalidateQueries({ queryKey: ["departures"] });
    qc.invalidateQueries({ queryKey: ["departure-stats"] });
    qc.invalidateQueries({ queryKey: ["departure-orientation-warnings"] });
  }

  async function submit() {
    setBusy(true);
    try {
      await saveFn({ data: clean(form) as never });
      toast.success("Đã lưu hồ sơ xuất cảnh");
      setFormOpen(false);
      setForm(emptyForm);
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Xoá bản ghi xuất cảnh của "${name}"?`)) return;
    try {
      await delFn({ data: { id } });
      toast.success("Đã xoá");
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function confirmDeparted() {
    const date = prompt("Ngày xuất cảnh thực tế (yyyy-mm-dd):", new Date().toISOString().slice(0, 10));
    if (!date) return;
    try {
      const r = await departFn({ data: { ids: selected, date } });
      toast.success(`Đã ghi nhận ${r.count} người xuất cảnh`);
      setSelected([]);
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function doExport() {
    setBusy(true);
    try {
      const r = await exportFn({
        data: selected.length ? { ids: selected } : query,
      });
      downloadBase64(r.filename, r.base64);
      toast.success(`Đã xuất ${r.count} bản ghi theo mẫu 21 cột`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function doDownloadBlank() {
    setBusy(true);
    try {
      const r = await blankFn({ data: {} as never });
      downloadBase64(r.filename, r.base64);
      toast.success("Đã tải file Excel mẫu chuẩn 21 cột");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  /** Khoảng thời gian nhanh: tháng này, tháng trước, quý, năm, 30 ngày tới. */
  function setRange(kind: string) {
    const d = new Date();
    const iso = (x: Date) => x.toISOString().slice(0, 10);
    const first = (y: number, m: number) => iso(new Date(Date.UTC(y, m, 1)));
    const last = (y: number, m: number) => iso(new Date(Date.UTC(y, m + 1, 0)));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    if (kind === "") return setFilters((f) => ({ ...f, from: "", to: "" }));
    if (kind === "this-month")
      return setFilters((f) => ({ ...f, from: first(y, m), to: last(y, m) }));
    if (kind === "last-month")
      return setFilters((f) => ({ ...f, from: first(y, m - 1), to: last(y, m - 1) }));
    if (kind === "quarter") {
      const q = Math.floor(m / 3) * 3;
      return setFilters((f) => ({ ...f, from: first(y, q), to: last(y, q + 2) }));
    }
    if (kind === "year") return setFilters((f) => ({ ...f, from: first(y, 0), to: last(y, 11) }));
    if (kind === "next30")
      return setFilters((f) => ({
        ...f,
        date_field: "planned",
        from: iso(d),
        to: iso(new Date(d.getTime() + 30 * 86400000)),
      }));
  }

  const pie = (obj: Record<string, number> | undefined) =>
    Object.entries(obj ?? {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý xuất cảnh</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi học viên và người lao động xuất cảnh, thống kê theo thời điểm và xuất danh sách
            đúng mẫu 21 cột của cơ quan quản lý.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" /> Nhập từ Excel
          </Button>
          <Button variant="outline" onClick={doDownloadBlank} disabled={busy}>
            <Download className="mr-1.5 h-4 w-4" /> Tải file Excel mẫu
          </Button>
          <Button variant="outline" onClick={doExport} disabled={busy}>
            <Download className="mr-1.5 h-4 w-4" /> Xuất mẫu 21 cột
          </Button>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Thêm người xuất cảnh
          </Button>
        </div>
      </header>

      {orientationIds.length > 0 && (
        <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          {orientation.isLoading
            ? "Đang đối chiếu giáo dục định hướng trước xuất cảnh…"
            : orientation.isError
              ? "Chưa thể đối chiếu giáo dục định hướng; vui lòng kiểm tra hồ sơ đào tạo."
              : (orientation.data?.missing.length ?? 0) > 0
                ? `${orientation.data?.missing.length} học viên dự kiến xuất cảnh chưa có đủ thông tin lớp học và chứng chỉ Giáo dục định hướng. Vui lòng kiểm tra trước khi xác nhận; hiện chỉ cảnh báo, không chặn nghiệp vụ.`
                : "Các học viên có hồ sơ liên kết trong danh sách hiện tại đã có thông tin lớp học và chứng chỉ Giáo dục định hướng."}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} tone="text-primary" label="Tổng hồ sơ xuất cảnh" value={s?.total} />
        <Kpi icon={CheckCircle2} tone="text-emerald-600" label="Đã xuất cảnh" value={s?.departed}
          hint={`Trong năm nay: ${s?.departedThisYear ?? 0} · Tháng này: ${s?.departedThisMonth ?? 0}`} />
        <Kpi icon={CalendarClock} tone="text-amber-600" label="Dự kiến xuất cảnh" value={s?.planned}
          hint={`Trong 30 ngày tới: ${s?.upcoming30 ?? 0}`} />
        <Kpi icon={Plane} tone="text-blue-600" label="Hoãn / huỷ" value={s?.postponed} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Donut title="Theo nước đến" note="Số người xuất cảnh phân theo thị trường tiếp nhận." data={pie(s?.byCountry)} />
        <Donut title="Theo trạng thái" note="Tỷ lệ hồ sơ dự kiến / đã đi / hoãn." data={pie(
          Object.fromEntries(Object.entries(s?.byStatus ?? {}).map(([k, v]) => [DEPARTURE_STATUS[k] ?? k, v])),
        )} />
        <Donut title="Nguồn hồ sơ" note="Học viên nội bộ được kéo dữ liệu từ hồ sơ; còn lại nhập ngoài." data={pie(s?.bySource)} />
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-bold">Số lượt xuất cảnh theo tháng (12 tháng gần nhất)</h2>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.entries(s?.byMonth ?? {}).map(([m, v]) => ({ m: m.slice(5) + "/" + m.slice(2, 4), v }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="m" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="v" name="Lượt xuất cảnh" fill="#C92026" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Tìm theo tên, căn cước, hộ chiếu, điện thoại"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <select
            className="h-10 rounded-md border bg-background px-2 text-sm"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(DEPARTURE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-2 text-sm"
            value={filters.country}
            onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
          >
            <option value="">Tất cả nước đến</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {selected.length > 0 && (
            <Button size="sm" onClick={confirmDeparted}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Xác nhận đã xuất cảnh ({selected.length})
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 p-3">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Khoảng thời gian
          </span>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={filters.date_field}
            onChange={(e) =>
              setFilters((f) => ({ ...f, date_field: e.target.value as "planned" | "actual" }))
            }
          >
            <option value="planned">Theo ngày dự kiến</option>
            <option value="actual">Theo ngày xuất cảnh thực tế</option>
          </select>
          <Input
            type="date"
            className="h-9 w-[150px]"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
          <span className="text-sm text-muted-foreground">đến</span>
          <Input
            type="date"
            className="h-9 w-[150px]"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value=""
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="">Chọn nhanh…</option>
            <option value="this-month">Tháng này</option>
            <option value="last-month">Tháng trước</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm nay</option>
            <option value="next30">30 ngày tới</option>
          </select>
          {(filters.from || filters.to) && (
            <Button size="sm" variant="ghost" onClick={() => setRange("")}>
              Xoá lọc thời gian
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-10 p-3"></th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3">Căn cước / Hộ chiếu</th>
                <th className="p-3">Nước đến · Ngành nghề</th>
                <th className="p-3">Dự kiến</th>
                <th className="p-3">Thực tế · Chuyến bay</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Đang tải...</td></tr>
              )}
              {!list.isLoading && items.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Chưa có hồ sơ xuất cảnh nào.</td></tr>
              )}
              {items.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={(e) =>
                        setSelected((prev) => (e.target.checked ? [...prev, r.id] : prev.filter((x) => x !== r.id)))
                      }
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{r.full_name}</div>
                    {r.dossier_code ? (
                      <div className="font-mono text-[11px] text-primary">{r.dossier_code}</div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      {GENDER_LABEL[r.gender] ?? r.gender}
                      {r.dob ? ` · ${r.dob}` : ""}
                      {r.student_profiles?.student_code ? ` · HV ${r.student_profiles.student_code}` : " · Ngoài hệ thống"}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <div>CC: {r.id_no}</div>
                    <div className="text-muted-foreground">HC: {r.passport_no || "—"}</div>
                  </td>
                  <td className="p-3 text-xs">
                    <div>{r.destination_country || "—"}</div>
                    <div className="text-muted-foreground">{r.occupation || "—"}</div>
                  </td>
                  <td className="p-3 text-xs">{r.planned_departure_date || "—"}</td>
                  <td className="p-3 text-xs">
                    <div>{r.actual_departure_date || "—"}</div>
                    <div className="text-muted-foreground">{r.flight_no || ""}</div>
                  </td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      r.status === "departed" ? "bg-emerald-100 text-emerald-800"
                        : r.status === "planned" ? "bg-amber-100 text-amber-900"
                        : "bg-muted text-muted-foreground"}`}>
                      {DEPARTURE_STATUS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setForm({ ...emptyForm, ...(Object.fromEntries(
                          Object.entries(r).filter(([k]) => k in emptyForm).map(([k, v]) => [k, v ?? (typeof (emptyForm as any)[k] === "boolean" ? false : "")]),
                        ) as Partial<Form>) } as Form);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id, r.full_name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <RecordDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        form={form}
        setForm={setForm}
        onSubmit={submit}
        busy={busy}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onDone={refresh} />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint, tone }: { icon: any; label: string; value?: number; hint?: string; tone: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className={`h-4 w-4 ${tone}`} /> {label}
      </div>
      <div className="mt-2 text-3xl font-bold">{value ?? "—"}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Donut({ title, note, data }: { title: string; note: string; data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="rounded-xl border-2 bg-card p-4 shadow-sm transition hover:shadow-md">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="h-48">
        {total === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} người (${Math.round((Number(v) / total) * 100)}%)`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="font-semibold">{d.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function RecordDialog({
  open, onOpenChange, form, setForm, onSubmit, busy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: Form;
  setForm: (f: Form) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const [term, setTerm] = useState("");
  const searchFn = useServerFn(searchStudentsForDeparture);
  const prefillFn = useServerFn(prefillFromStudent);
  const students = useQuery({
    queryKey: ["departure-student-search", term],
    queryFn: () => searchFn({ data: { q: term } }),
    enabled: open,
  });
  const set = (k: keyof Form, v: any) => setForm({ ...form, [k]: v });

  async function pick(id: string) {
    try {
      const p = await prefillFn({ data: { student_profile_id: id } });
      setForm({ ...form, ...(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ""])) as Partial<Form>) } as Form);
      toast.success("Đã kéo dữ liệu từ hồ sơ học viên");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Cập nhật hồ sơ xuất cảnh" : "Thêm người xuất cảnh"}</DialogTitle>
          <DialogDescription>
            Chọn học viên có sẵn để tự động kéo dữ liệu, hoặc nhập thủ công cho người lao động ngoài hệ thống.
          </DialogDescription>
        </DialogHeader>

        {!form.id && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <Label className="text-xs">Lấy dữ liệu từ hồ sơ học viên</Label>
            <Input
              className="mt-1"
              placeholder="Tìm theo mã học viên, họ tên hoặc số điện thoại"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
              {(students.data?.items ?? []).map((st: any) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => pick(st.id)}
                  className="flex w-full items-center justify-between rounded border bg-background px-2 py-1.5 text-left text-xs hover:bg-accent"
                >
                  <span className="font-medium">{st.full_name}</span>
                  <span className="text-muted-foreground">{st.student_code} · {st.phone ?? "—"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Họ và tên (*)"><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
          <Field label="Số căn cước (*)"><Input value={form.id_no} onChange={(e) => set("id_no", e.target.value)} /></Field>
          <Field label="Ngày cấp căn cước"><Input type="date" value={form.id_issue_date} onChange={(e) => set("id_issue_date", e.target.value)} /></Field>
          <Field label="Số hộ chiếu"><Input value={form.passport_no} onChange={(e) => set("passport_no", e.target.value)} /></Field>
          <Field label="Ngày cấp hộ chiếu"><Input type="date" value={form.passport_issue_date} onChange={(e) => set("passport_issue_date", e.target.value)} /></Field>
          <Field label="Giới tính (*)">
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              {Object.entries(GENDER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Ngày sinh (*)"><Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
          <Field label="Hôn nhân">
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={form.marital_status} onChange={(e) => set("marital_status", e.target.value)}>
              <option value="">— Chưa rõ —</option>
              {Object.entries(MARITAL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Nơi sinh (*)"><Input value={form.place_of_birth} onChange={(e) => set("place_of_birth", e.target.value)} /></Field>
          <Field label="Số điện thoại (*)"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Nơi ở hiện tại (*)"><Input value={form.current_address} onChange={(e) => set("current_address", e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <GeoPicker
              province={form.province}
              ward={form.ward}
              onChange={(v) => setForm({ ...form, province: v.province, ward: v.ward })}
            />
          </div>
          <Field label="Dân tộc"><Input value={form.ethnicity} onChange={(e) => set("ethnicity", e.target.value)} /></Field>
          <Field label="Tôn giáo"><Input value={form.religion} onChange={(e) => set("religion", e.target.value)} /></Field>
          <Field label="Trình độ chuyên môn"><Input value={form.education_level} onChange={(e) => set("education_level", e.target.value)} /></Field>
        </div>

        <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          {([
            ["worked_abroad", "Đã từng làm việc ở nước ngoài"],
            ["land_lost", "Mất đất"],
            ["poor_household", "Hộ nghèo, cận nghèo"],
            ["veteran", "Bộ đội xuất ngũ"],
            ["ethnic_minority", "Dân tộc thiểu số"],
          ] as Array<[keyof Form, string]>).map(([k, label]) => (
            <label key={String(k)} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(form[k])} onChange={(e) => set(k, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nước đến"><Input value={form.destination_country} onChange={(e) => set("destination_country", e.target.value)} /></Field>
          <Field label="Loại chương trình">
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={form.program_type} onChange={(e) => set("program_type", e.target.value)}>
              <option value="">— Chưa xác định —</option>
              {Object.entries(PROGRAM_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Loại hợp đồng">
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={form.contract_type} onChange={(e) => set("contract_type", e.target.value)}>
              <option value="">— Chưa xác định —</option>
              {Object.entries(CONTRACT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Ngành nghề"><Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} /></Field>
          <Field label="Chủ sử dụng lao động"><Input value={form.employer_name} onChange={(e) => set("employer_name", e.target.value)} /></Field>
          <Field label="Trạng thái">
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(DEPARTURE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Ngày dự kiến xuất cảnh"><Input type="date" value={form.planned_departure_date} onChange={(e) => set("planned_departure_date", e.target.value)} /></Field>
          <Field label="Ngày xuất cảnh thực tế"><Input type="date" value={form.actual_departure_date} onChange={(e) => set("actual_departure_date", e.target.value)} /></Field>
          <Field label="Số hiệu chuyến bay"><Input value={form.flight_no} onChange={(e) => set("flight_no", e.target.value)} /></Field>
          <Field label="Sân bay đi"><Input value={form.departure_airport} onChange={(e) => set("departure_airport", e.target.value)} /></Field>
          <Field label="Sân bay đến"><Input value={form.arrival_airport} onChange={(e) => set("arrival_airport", e.target.value)} /></Field>
        </div>
        <Field label="Ghi chú"><Textarea rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} /></Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={onSubmit} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const previewFn = useServerFn(previewImport);
  const commitFn = useServerFn(commitImport);

  async function onFile(f: File) {
    setBusy(true);
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      let bin = "";
      buf.forEach((b) => (bin += String.fromCharCode(b)));
      const r = await previewFn({ data: { file_base64: btoa(bin) } });
      setRows(r.rows);
      toast.success(`Đọc được ${r.rows.length} dòng`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    const valid = rows.filter((r) => r.errors.length === 0).map((r) => r.values);
    if (valid.length === 0) return toast.error("Không có dòng hợp lệ để nhập");
    setBusy(true);
    try {
      const r = await commitFn({ data: { rows: valid as never, update_existing: true } });
      toast.success(`Đã thêm mới ${r.created}, cập nhật ${r.updated} bản ghi`);
      setRows([]);
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const bad = rows.filter((r) => r.errors.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nhập danh sách từ file Excel mẫu</DialogTitle>
          <DialogDescription>
            File cần có đủ {TEMPLATE_HEADERS.length} cột theo mẫu Người lao động (hỗ trợ .xls và .xlsx).
            Dòng trùng số căn cước sẽ được cập nhật thay vì tạo mới.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx"
          className="text-sm"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0]!)}
        />

        {rows.length > 0 && (
          <>
            <div className="text-sm">
              Tổng <strong>{rows.length}</strong> dòng · hợp lệ <strong className="text-emerald-700">{rows.length - bad}</strong>
              {bad > 0 && <> · lỗi <strong className="text-destructive">{bad}</strong></>}
            </div>
            <div className="max-h-64 overflow-auto rounded border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50"><tr><th className="p-2 text-left">Dòng</th><th className="p-2 text-left">Họ tên</th><th className="p-2 text-left">Căn cước</th><th className="p-2 text-left">Ghi chú</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.row} className="border-t">
                      <td className="p-2">{r.row}</td>
                      <td className="p-2">{String(r.values.full_name ?? "")}</td>
                      <td className="p-2">{String(r.values.id_no ?? "")}</td>
                      <td className="p-2">
                        {r.errors.length > 0 ? <span className="text-destructive">{r.errors.join(", ")}</span>
                          : r.duplicate ? <span className="text-amber-700">Đã có — sẽ cập nhật</span>
                          : <span className="text-emerald-700">Hợp lệ</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={commit} disabled={busy || rows.length === 0}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Nhập vào hệ thống
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
