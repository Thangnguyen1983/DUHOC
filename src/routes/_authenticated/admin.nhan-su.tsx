import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { errorMessage } from "@/lib/errors";
import { useMyAccess } from "@/lib/rbac/use-access";
import { StaffDialog } from "@/components/admin/staff-dialog";
import { HrConfigTab } from "@/components/hr/hr-config-tab";
import {
  listHrStaff, listCollaborators, listContracts, upsertContract, deleteContract,
  listLeaveRequests, reviewLeave, attendanceMonth, upsertAttendance,
  listKpi, upsertKpi, deleteKpi, listPayroll, generatePayroll, updatePayrollItem, approvePayroll, setLeaveBalance,
} from "@/lib/hr/hr.functions";
import {
  vnd, CONTRACT_TYPE_LABEL, LEAVE_TYPE_LABEL, LEAVE_STATUS_LABEL, ATTENDANCE_LABEL,
  fmtDate, fmtTime, currentPeriod, daysUntil, downloadCsv, selectCls,
} from "@/components/hr/hr-shared";

export const Route = createFileRoute("/_authenticated/admin/nhan-su")({
  head: () => ({
    meta: [
      { title: "Quản trị nhân sự — KAIZEN" },
      { name: "description", content: "Nhân sự, phòng ban, hợp đồng, nghỉ phép, chấm công, KPI, lương và cộng tác viên Kaizen." },
      { property: "og:title", content: "Quản trị nhân sự — KAIZEN" },
      { property: "og:description", content: "Nhân sự, phòng ban, hợp đồng, nghỉ phép, chấm công, KPI, lương và cộng tác viên Kaizen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HrPage,
});

type StaffRow = Awaited<ReturnType<typeof listHrStaff>>["rows"][number];

function HrPage() {
  const { can } = useMyAccess();
  const fn = useServerFn(listHrStaff);
  const q = useQuery({ queryKey: ["hr-staff"], queryFn: () => fn() });
  const staff = q.data?.rows ?? [];
  const tabs: Array<[string, string, boolean]> = [
    ["staff", "Nhân sự", true],
    ["org", "Phòng ban & Chức danh", true],
    ["contracts", "Hợp đồng", can("hr.view")],
    ["leave", "Nghỉ phép", true],
    ["attendance", "Chấm công", can("hr.view")],
    ["kpi", "KPI", can("hr.view")],
    ["payroll", "Lương", can("payroll.view")],
    ["ctv", "Cộng tác viên", can("hr.view") || can("commissions.view")],
    ["config", "Cấu hình", can("hr.manage")],
  ];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Quản trị nhân sự</h1>
        <p className="text-sm text-muted-foreground">
          Một nơi cho toàn bộ nhân sự và cộng tác viên. Trưởng phòng chỉ thấy nhân sự phòng mình phụ trách.
        </p>
      </div>
      {q.error && <p className="text-sm text-destructive">{errorMessage(q.error)}</p>}
      <Tabs defaultValue="staff">
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            {tabs.filter((t) => t[2]).map(([k, label]) => <TabsTrigger key={k} value={k}>{label}</TabsTrigger>)}
          </TabsList>
        </div>
        <TabsContent value="staff"><StaffTab data={q.data} loading={q.isLoading} /></TabsContent>
        <TabsContent value="org"><OrgTab data={q.data} /></TabsContent>
        <TabsContent value="contracts"><ContractsTab staff={staff} canManage={!!q.data?.canManage} /></TabsContent>
        <TabsContent value="leave"><LeaveTab staff={staff} canManage={!!q.data?.canManage} /></TabsContent>
        <TabsContent value="attendance"><AttendanceTab staff={staff} /></TabsContent>
        <TabsContent value="kpi"><KpiTab staff={staff} /></TabsContent>
        <TabsContent value="payroll"><PayrollTab /></TabsContent>
        <TabsContent value="ctv"><CtvTab /></TabsContent>
        <TabsContent value="config"><HrConfigTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border bg-card">{children}</div>;
}
const th = "px-3 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap";
const td = "px-3 py-2 align-top";

/* ───── Nhân sự ───── */
function StaffTab({ data, loading }: { data?: Awaited<ReturnType<typeof listHrStaff>>; loading: boolean }) {
  const [dep, setDep] = useState("");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<StaffRow | null>(null);
  const deps = data?.departments ?? [];
  const titles = data?.jobTitles ?? [];
  const name = (list: any[], id: string | null) => list.find((x) => x.id === id)?.name ?? "—";
  const rows = (data?.rows ?? []).filter((r) =>
    (!dep || (dep === "none" ? !r.department_id : r.department_id === dep)) &&
    (!search || `${r.name} ${r.email} ${r.staff_code ?? ""}`.toLowerCase().includes(search.toLowerCase())));
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Tìm tên, email, mã KZ-NV…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <select className={`${selectCls} sm:max-w-xs`} value={dep} onChange={(e) => setDep(e.target.value)} aria-label="Lọc phòng ban">
          <option value="">Tất cả phòng ban</option>
          <option value="none">Chưa gán phòng ban</option>
          {deps.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <Box>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className={th}>Mã</th><th className={th}>Họ tên</th><th className={th}>Phòng ban</th>
            <th className={th}>Chức danh</th><th className={th}>Hợp đồng</th><th className={th}></th>
          </tr></thead>
          <tbody>
            {loading && <tr><td className={td} colSpan={6}>Đang tải…</td></tr>}
            {!loading && rows.length === 0 && <tr><td className={td} colSpan={6}>Chưa có nhân sự phù hợp.</td></tr>}
            {rows.map((r) => {
              const left = daysUntil(r.contract_end);
              return (
                <tr key={r.user_id} className="border-b last:border-0">
                  <td className={`${td} font-mono text-xs whitespace-nowrap`}>{r.staff_code ?? <span className="text-muted-foreground">Chưa lập hồ sơ</span>}</td>
                  <td className={td}><div className="font-medium">{r.name || r.email}</div><div className="text-xs text-muted-foreground break-all">{r.email}</div></td>
                  <td className={td}>{name(deps, r.department_id)}</td>
                  <td className={td}>{name(titles, r.job_title_id)}</td>
                  <td className={td}>
                    {r.contract_type ? CONTRACT_TYPE_LABEL[r.contract_type] : <span className="text-muted-foreground">Chưa có</span>}
                    {left !== null && left <= 30 && <Badge variant="destructive" className="ml-1">{left < 0 ? "Đã hết hạn" : `Còn ${left} ngày`}</Badge>}
                  </td>
                  <td className={td}>{data?.canManage && <Button size="sm" variant="outline" onClick={() => setSel(r)}>Hồ sơ</Button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        {sel && <StaffDialog user={{ id: sel.user_id, email: sel.email, full_name: sel.name }} departments={deps} jobTitles={titles} onDone={() => setSel(null)} />}
      </Dialog>
    </div>
  );
}

/* ───── Phòng ban & chức danh ───── */
function OrgTab({ data }: { data?: Awaited<ReturnType<typeof listHrStaff>> }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Dùng chung một danh mục với Danh mục hệ thống. Muốn thêm/sửa phòng ban, chức danh:{" "}
        <Link to="/admin/catalog" className="text-primary underline">mở Danh mục hệ thống → Phòng ban & chức danh</Link>.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {([["Phòng ban", data?.departments ?? []], ["Chức danh", data?.jobTitles ?? []]] as const).map(([label, list]) => (
          <Box key={label}>
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40"><tr><th className={th}>{label}</th><th className={th}>Số nhân sự</th><th className={th}>Trạng thái</th></tr></thead>
              <tbody>{list.map((d: any) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className={td}>{d.name}</td><td className={td}>{d.staff_count}</td>
                  <td className={td}>{d.is_active ? "Đang dùng" : <span className="text-muted-foreground">Ngừng dùng</span>}</td>
                </tr>))}</tbody>
            </table>
          </Box>
        ))}
      </div>
    </div>
  );
}

/* ───── Hợp đồng ───── */
const emptyContract = { user_id: "", contract_no: "", contract_type: "fixed_term", start_date: "", end_date: "", base_salary: 0, allowance: 0, file_url: "", status: "active", note: "" };

function ContractsTab({ staff, canManage }: { staff: StaffRow[]; canManage: boolean }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listContracts);
  const saveFn = useServerFn(upsertContract);
  const delFn = useServerFn(deleteContract);
  const q = useQuery({ queryKey: ["hr-contracts"], queryFn: () => listFn() });
  const [form, setForm] = useState<any | null>(null);
  const save = useMutation({
    mutationFn: (f: any) => saveFn({ data: { ...f, base_salary: Number(f.base_salary), allowance: Number(f.allowance), end_date: f.end_date || null } }),
    onSuccess: () => { toast.success("Đã lưu hợp đồng"); setForm(null); qc.invalidateQueries({ queryKey: ["hr-contracts"] }); qc.invalidateQueries({ queryKey: ["hr-staff"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); qc.invalidateQueries({ queryKey: ["hr-contracts"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const rows = q.data ?? [];
  const expiring = rows.filter((r: any) => r.status === "active" && (daysUntil(r.end_date) ?? 999) <= 30);
  return (
    <div className="space-y-3">
      {expiring.length > 0 && (
        <div role="status" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {expiring.length} hợp đồng hết hạn trong 30 ngày tới hoặc đã hết hạn — cần gia hạn hoặc kết thúc.
        </div>
      )}
      {canManage && <Button onClick={() => setForm({ ...emptyContract })}><Plus className="mr-1 h-4 w-4" />Thêm hợp đồng</Button>}
      <Box>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className={th}>Số HĐ</th><th className={th}>Nhân sự</th><th className={th}>Loại</th><th className={th}>Thời hạn</th>
            <th className={th}>Lương cơ bản</th><th className={th}>Phụ cấp</th><th className={th}>Trạng thái</th><th className={th}></th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td className={td} colSpan={8}>{q.isLoading ? "Đang tải…" : "Chưa có hợp đồng."}</td></tr>}
            {rows.map((r: any) => {
              const left = daysUntil(r.end_date);
              return (
                <tr key={r.id} className="border-b last:border-0">
                  <td className={`${td} font-mono text-xs`}>{r.file_url ? <a className="text-primary underline" href={r.file_url} target="_blank" rel="noreferrer">{r.contract_no}</a> : r.contract_no}</td>
                  <td className={td}>{r.name}</td>
                  <td className={td}>{CONTRACT_TYPE_LABEL[r.contract_type]}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDate(r.start_date)} → {r.end_date ? fmtDate(r.end_date) : "Không thời hạn"}
                    {r.status === "active" && left !== null && left <= 30 && <Badge variant="destructive" className="ml-1">{left < 0 ? "Hết hạn" : `${left} ngày`}</Badge>}</td>
                  <td className={td}>{vnd(r.base_salary)}</td><td className={td}>{vnd(r.allowance)}</td>
                  <td className={td}>{r.status === "active" ? "Hiệu lực" : "Đã kết thúc"}</td>
                  <td className={`${td} whitespace-nowrap`}>{canManage && <>
                    <Button size="icon" variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...emptyContract, ...r, end_date: r.end_date ?? "", file_url: r.file_url ?? "", note: r.note ?? "" })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Xoá" onClick={() => confirm(`Xoá hợp đồng ${r.contract_no}?`) && del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Sửa hợp đồng" : "Thêm hợp đồng"}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nhân sự" full>
                <select className={selectCls} value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
                  <option value="">— Chọn —</option>
                  {staff.map((s) => <option key={s.user_id} value={s.user_id}>{s.name || s.email}{s.staff_code ? ` (${s.staff_code})` : ""}</option>)}
                </select>
              </Field>
              <Field label="Số hợp đồng"><Input value={form.contract_no} onChange={(e) => setForm({ ...form, contract_no: e.target.value })} /></Field>
              <Field label="Loại hợp đồng">
                <select className={selectCls} value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
                  {Object.entries(CONTRACT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Ngày bắt đầu"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
              <Field label="Ngày kết thúc (bỏ trống nếu không thời hạn)"><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
              <Field label="Lương cơ bản (đ/tháng)"><Input type="number" min={0} value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} /></Field>
              <Field label="Phụ cấp (đ/tháng)"><Input type="number" min={0} value={form.allowance} onChange={(e) => setForm({ ...form, allowance: e.target.value })} /></Field>
              <Field label="Đường dẫn bản scan" full><Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://…" /></Field>
              <Field label="Trạng thái">
                <select className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Hiệu lực</option><option value="ended">Đã kết thúc</option>
                </select>
              </Field>
              <Field label="Ghi chú"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Huỷ</Button>
            <Button disabled={save.isPending || !form?.user_id || !form?.contract_no || !form?.start_date} onClick={() => save.mutate(form)}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`grid gap-1 text-sm ${full ? "sm:col-span-2" : ""}`}><span className="font-medium">{label}</span>{children}</label>;
}

/* ───── Nghỉ phép ───── */
function LeaveTab({ staff, canManage }: { staff: StaffRow[]; canManage: boolean }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const listFn = useServerFn(listLeaveRequests);
  const reviewFn = useServerFn(reviewLeave);
  const balFn = useServerFn(setLeaveBalance);
  const q = useQuery({ queryKey: ["hr-leave", status], queryFn: () => listFn({ data: { status: status || undefined } }) });
  const review = useMutation({
    mutationFn: (v: { id: string; approve: boolean; note?: string }) => reviewFn({ data: v }),
    onSuccess: () => { toast.success("Đã xử lý đơn"); qc.invalidateQueries({ queryKey: ["hr-leave"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const [bal, setBal] = useState({ user_id: "", annual_days: 12 });
  const saveBal = useMutation({
    mutationFn: () => balFn({ data: { ...bal, annual_days: Number(bal.annual_days), year: new Date().getFullYear() } }),
    onSuccess: () => toast.success("Đã cập nhật số ngày phép năm"),
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[["pending", "Chờ duyệt"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"], ["", "Tất cả"]].map(([v, l]) => (
          <Button key={v} size="sm" variant={status === v ? "default" : "outline"} onClick={() => setStatus(v)}>{l}</Button>
        ))}
      </div>
      <Box>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className={th}>Nhân sự</th><th className={th}>Loại</th><th className={th}>Thời gian</th><th className={th}>Số ngày</th>
            <th className={th}>Lý do</th><th className={th}>Trạng thái</th><th className={th}></th>
          </tr></thead>
          <tbody>
            {(q.data?.rows ?? []).length === 0 && <tr><td className={td} colSpan={7}>{q.isLoading ? "Đang tải…" : "Không có đơn."}</td></tr>}
            {(q.data?.rows ?? []).map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className={td}>{r.name}</td><td className={td}>{LEAVE_TYPE_LABEL[r.leave_type]}</td>
                <td className={`${td} whitespace-nowrap`}>{fmtDate(r.start_date)} → {fmtDate(r.end_date)}</td>
                <td className={td}>{r.days}</td><td className={td}>{r.reason}</td>
                <td className={td}>{LEAVE_STATUS_LABEL[r.status]}{r.review_note ? <div className="text-xs text-muted-foreground">{r.review_note}</div> : null}</td>
                <td className={`${td} whitespace-nowrap`}>{q.data?.canApprove && r.status === "pending" && <>
                  <Button size="sm" onClick={() => review.mutate({ id: r.id, approve: true })}>Duyệt</Button>{" "}
                  <Button size="sm" variant="outline" onClick={() => { const note = prompt("Lý do từ chối:") ?? ""; if (note) review.mutate({ id: r.id, approve: false, note }); }}>Từ chối</Button>
                </>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
      {canManage && (
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-2 text-sm font-semibold">Số ngày phép năm {new Date().getFullYear()} (mặc định 12 ngày)</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className={`${selectCls} sm:max-w-xs`} value={bal.user_id} onChange={(e) => setBal({ ...bal, user_id: e.target.value })} aria-label="Nhân sự">
              <option value="">— Chọn nhân sự —</option>
              {staff.map((s) => <option key={s.user_id} value={s.user_id}>{s.name || s.email}</option>)}
            </select>
            <Input type="number" min={0} className="sm:w-32" value={bal.annual_days} onChange={(e) => setBal({ ...bal, annual_days: Number(e.target.value) })} aria-label="Số ngày" />
            <Button disabled={!bal.user_id || saveBal.isPending} onClick={() => saveBal.mutate()}>Lưu</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Chấm công ───── */
function AttendanceTab({ staff }: { staff: StaffRow[] }) {
  const qc = useQueryClient();
  const [period, setPeriod] = useState(currentPeriod());
  const fn = useServerFn(attendanceMonth);
  const saveFn = useServerFn(upsertAttendance);
  const q = useQuery({ queryKey: ["hr-attendance", period], queryFn: () => fn({ data: { period } }) });
  const [edit, setEdit] = useState({ user_id: "", work_date: "", status: "present", note: "" });
  const save = useMutation({
    mutationFn: () => saveFn({ data: edit as any }),
    onSuccess: () => { toast.success("Đã sửa chấm công"); setEdit({ ...edit, note: "" }); qc.invalidateQueries({ queryKey: ["hr-attendance"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const s = q.data?.summary ?? [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44" aria-label="Tháng" />
        <Button variant="outline" onClick={() => downloadCsv(`bang-cong-${period}.csv`, [["Nhân sự", "Ngày đúng giờ", "Đi muộn", "Nghỉ có lương", "Tổng công"], ...s.map((r) => [r.name, r.present, r.late, r.paid_leave, r.work_days])])}>
          <Download className="mr-1 h-4 w-4" />Xuất bảng công
        </Button>
      </div>
      <Box>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr><th className={th}>Nhân sự</th><th className={th}>Đúng giờ</th><th className={th}>Đi muộn</th><th className={th}>Nghỉ có lương</th><th className={th}>Tổng công</th></tr></thead>
          <tbody>
            {s.length === 0 && <tr><td className={td} colSpan={5}>{q.isLoading ? "Đang tải…" : "Chưa có dữ liệu chấm công tháng này."}</td></tr>}
            {s.map((r) => <tr key={r.user_id} className="border-b last:border-0"><td className={td}>{r.name}</td><td className={td}>{r.present}</td><td className={td}>{r.late}</td><td className={td}>{r.paid_leave}</td><td className={`${td} font-semibold`}>{r.work_days}</td></tr>)}
          </tbody>
        </table>
      </Box>
      {q.data?.canManage && (
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-2 text-sm font-semibold">Sửa chấm công (bắt buộc ghi lý do)</div>
          <div className="grid gap-2 sm:grid-cols-5">
            <select className={selectCls} value={edit.user_id} onChange={(e) => setEdit({ ...edit, user_id: e.target.value })} aria-label="Nhân sự">
              <option value="">— Nhân sự —</option>
              {staff.map((x) => <option key={x.user_id} value={x.user_id}>{x.name || x.email}</option>)}
            </select>
            <Input type="date" value={edit.work_date} onChange={(e) => setEdit({ ...edit, work_date: e.target.value })} aria-label="Ngày" />
            <select className={selectCls} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} aria-label="Trạng thái">
              {Object.entries(ATTENDANCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Input placeholder="Lý do" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} />
            <Button disabled={!edit.user_id || !edit.work_date || edit.note.trim().length < 3 || save.isPending} onClick={() => save.mutate()}>Lưu</Button>
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-muted-foreground">Chi tiết từng ngày ({q.data.days.length})</summary>
            <div className="mt-2 max-h-72 overflow-auto">
              {q.data.days.map((d: any) => (
                <div key={d.id} className="flex flex-wrap gap-x-3 border-b py-1">
                  <span>{fmtDate(d.work_date)}</span><span className="font-medium">{d.name}</span>
                  <span>{ATTENDANCE_LABEL[d.status]}</span><span>{fmtTime(d.check_in)} – {fmtTime(d.check_out)}</span>
                  {d.note && <span className="text-muted-foreground">{d.note}</span>}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

/* ───── KPI ───── */
function KpiTab({ staff }: { staff: StaffRow[] }) {
  const qc = useQueryClient();
  const [period, setPeriod] = useState(currentPeriod());
  const fn = useServerFn(listKpi);
  const saveFn = useServerFn(upsertKpi);
  const delFn = useServerFn(deleteKpi);
  const q = useQuery({ queryKey: ["hr-kpi", period], queryFn: () => fn({ data: { period } }) });
  const empty = { user_id: "", metric: "", target: 0, actual: 0, auto_source: "", bonus_amount: 0 };
  const [form, setForm] = useState<any>(empty);
  const save = useMutation({
    mutationFn: () => saveFn({ data: { ...form, period, target: Number(form.target), actual: Number(form.actual), bonus_amount: Number(form.bonus_amount), auto_source: form.auto_source || null } }),
    onSuccess: () => { toast.success("Đã lưu KPI"); setForm(empty); qc.invalidateQueries({ queryKey: ["hr-kpi"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-kpi"] }) });
  return (
    <div className="space-y-3">
      <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44" aria-label="Tháng" />
      <Box>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr><th className={th}>Nhân sự</th><th className={th}>Chỉ tiêu</th><th className={th}>Mục tiêu</th><th className={th}>Thực đạt</th><th className={th}>Kết quả</th><th className={th}>Thưởng khi đạt</th><th className={th}></th></tr></thead>
          <tbody>
            {(q.data?.rows ?? []).length === 0 && <tr><td className={td} colSpan={7}>{q.isLoading ? "Đang tải…" : "Chưa đặt KPI tháng này."}</td></tr>}
            {(q.data?.rows ?? []).map((r: any) => {
              const ok = Number(r.target) > 0 && Number(r.actual) >= Number(r.target);
              return (
                <tr key={r.id} className="border-b last:border-0">
                  <td className={td}>{r.name}</td>
                  <td className={td}>{r.metric}{r.auto_source && <div className="text-xs text-muted-foreground">Tự lấy: khách đã chốt</div>}</td>
                  <td className={td}>{r.target}</td><td className={td}>{r.actual}</td>
                  <td className={td}>{ok ? <Badge>Đạt</Badge> : <Badge variant="outline">Chưa đạt</Badge>}</td>
                  <td className={td}>{vnd(r.bonus_amount)}</td>
                  <td className={`${td} whitespace-nowrap`}>{q.data?.canManage && <>
                    <Button size="icon" variant="ghost" aria-label="Sửa" onClick={() => setForm({ id: r.id, user_id: r.user_id, metric: r.metric, target: r.target, actual: r.actual, auto_source: r.auto_source ?? "", bonus_amount: r.bonus_amount })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Xoá" onClick={() => confirm("Xoá chỉ tiêu này?") && del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
      {q.data?.canManage && (
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-2 text-sm font-semibold">{form.id ? "Sửa chỉ tiêu" : "Thêm chỉ tiêu"} tháng {period}</div>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <select className={selectCls} value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} aria-label="Nhân sự">
              <option value="">— Nhân sự —</option>
              {staff.map((x) => <option key={x.user_id} value={x.user_id}>{x.name || x.email}</option>)}
            </select>
            <Input placeholder="Tên chỉ tiêu" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} />
            <select className={selectCls} value={form.auto_source} onChange={(e) => setForm({ ...form, auto_source: e.target.value, metric: e.target.value && !form.metric ? "Số khách chốt" : form.metric })} aria-label="Nguồn số liệu">
              <option value="">Nhập tay</option><option value="leads_done">Tự lấy: khách đã chốt</option>
            </select>
            <Input type="number" min={0} placeholder="Mục tiêu" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} aria-label="Mục tiêu" />
            <Input type="number" min={0} placeholder="Thực đạt" disabled={!!form.auto_source} value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} aria-label="Thực đạt" />
            <Input type="number" min={0} placeholder="Thưởng (đ)" value={form.bonus_amount} onChange={(e) => setForm({ ...form, bonus_amount: e.target.value })} aria-label="Thưởng" />
          </div>
          <div className="mt-2 flex gap-2">
            <Button disabled={!form.user_id || !form.metric || save.isPending} onClick={() => save.mutate()}>Lưu</Button>
            {form.id && <Button variant="outline" onClick={() => setForm(empty)}>Huỷ sửa</Button>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Lương ───── */
function PayrollTab() {
  const qc = useQueryClient();
  const { isAdmin } = useMyAccess() as any;
  const [period, setPeriod] = useState(currentPeriod());
  const fn = useServerFn(listPayroll);
  const genFn = useServerFn(generatePayroll);
  const updFn = useServerFn(updatePayrollItem);
  const apprFn = useServerFn(approvePayroll);
  const q = useQuery({ queryKey: ["hr-payroll", period], queryFn: () => fn({ data: { period } }) });
  const inv = () => qc.invalidateQueries({ queryKey: ["hr-payroll"] });
  const gen = useMutation({ mutationFn: () => genFn({ data: { period } }), onSuccess: (r) => { toast.success(`Đã tính: ${r.created} mới, ${r.updated} cập nhật${r.locked ? `, ${r.locked} đã khoá` : ""}`); inv(); }, onError: (e) => toast.error(errorMessage(e)) });
  const appr = useMutation({ mutationFn: () => apprFn({ data: { period } }), onSuccess: (r) => { toast.success(`Đã duyệt và khoá ${r.approved} phiếu lương`); inv(); }, onError: (e) => toast.error(errorMessage(e)) });
  const [edit, setEdit] = useState<any | null>(null);
  const upd = useMutation({
    mutationFn: () => updFn({ data: { id: edit.id, standard_days: Number(edit.standard_days), work_days: Number(edit.work_days), other_bonus: Number(edit.other_bonus), dependents: Number(edit.dependents ?? 0), insurance: Number(edit.insurance), tax: Number(edit.tax), deductions: Number(edit.deductions), note: edit.note || null } }),
    onSuccess: () => { toast.success("Đã cập nhật phiếu lương"); setEdit(null); inv(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const rows = q.data?.rows ?? [];
  const total = useMemo(() => rows.reduce((s: number, r: any) => s + Number(r.net_pay), 0), [rows]);
  const hasDraft = rows.some((r: any) => r.status === "draft");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44" aria-label="Tháng" />
        {q.data?.canManage && <Button onClick={() => gen.mutate()} disabled={gen.isPending}>Tính lương tháng</Button>}
        {q.data?.canManage && hasDraft && <Button variant="outline" onClick={() => confirm("Duyệt và khoá toàn bộ bảng lương tháng này? Sau khi khoá không sửa được.") && appr.mutate()} disabled={appr.isPending}>Duyệt & khoá (Ban Giám đốc)</Button>}
        <Button variant="outline" onClick={() => downloadCsv(`bang-luong-${period}.csv`, [["Nhân sự", "Công chuẩn", "Công thực tế", "Lương cơ bản", "Phụ cấp", "Thưởng KPI", "Thưởng khác", "Bảo hiểm", "Thuế TNCN", "Khấu trừ", "Thực lĩnh", "Trạng thái"], ...rows.map((r: any) => [r.name, r.standard_days, r.work_days, r.base_salary, r.allowance, r.kpi_bonus, r.other_bonus, r.insurance, r.tax, r.deductions, r.net_pay, r.status === "approved" ? "Đã khoá" : "Nháp"])])}>
          <Download className="mr-1 h-4 w-4" />Xuất Excel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Lương = Lương cơ bản × công thực tế ÷ công chuẩn + phụ cấp + thưởng KPI + thưởng khác − bảo hiểm − thuế − khấu trừ. Bảo hiểm và thuế TNCN đang nhập tay cho tới khi Kaizen ban hành quy định.</p>
      <Box>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr>
            <th className={th}>Nhân sự</th><th className={th}>Công</th><th className={th}>Lương CB</th><th className={th}>Phụ cấp</th>
            <th className={th}>KPI</th><th className={th}>Khấu trừ</th><th className={th}>Thực lĩnh</th><th className={th}>Trạng thái</th><th className={th}></th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td className={td} colSpan={9}>{q.isLoading ? "Đang tải…" : "Chưa tính lương tháng này. Cần có hợp đồng hiệu lực để tính."}</td></tr>}
            {rows.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className={td}>{r.name}</td><td className={td}>{r.work_days}/{r.standard_days}</td>
                <td className={td}>{vnd(r.base_salary)}</td><td className={td}>{vnd(r.allowance)}</td><td className={td}>{vnd(r.kpi_bonus)}</td>
                <td className={td}>{vnd(Number(r.insurance) + Number(r.tax) + Number(r.deductions))}</td>
                <td className={`${td} font-semibold`}>{vnd(r.net_pay)}</td>
                <td className={td}>{r.status === "approved" ? <Badge>Đã khoá</Badge> : <Badge variant="outline">Nháp</Badge>}</td>
                <td className={td}>{q.data?.canManage && r.status === "draft" && <Button size="icon" variant="ghost" aria-label="Sửa" onClick={() => setEdit({ ...r, note: r.note ?? "" })}><Pencil className="h-4 w-4" /></Button>}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && <tfoot><tr className="border-t bg-muted/40"><td className={`${td} font-semibold`} colSpan={6}>Tổng thực lĩnh</td><td className={`${td} font-bold`} colSpan={3}>{vnd(total)}</td></tr></tfoot>}
        </table>
      </Box>
      {!isAdmin && hasDraft && <p className="text-xs text-muted-foreground">Chỉ Ban Giám đốc (quản trị viên) bấm được "Duyệt & khoá".</p>}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Phiếu lương — {edit?.name}</DialogTitle></DialogHeader>
          {edit && <div className="grid gap-3 sm:grid-cols-2">
            {([["standard_days", "Công chuẩn"], ["work_days", "Công thực tế"], ["other_bonus", "Thưởng khác (đ)"], ["dependents", "Số người phụ thuộc"], ["insurance", "Bảo hiểm (đ) — tự tính nếu bật trong Cấu hình"], ["tax", "Thuế TNCN (đ) — tự tính nếu bật trong Cấu hình"], ["deductions", "Khấu trừ khác (đ)"]] as const).map(([k, l]) => (
              <Field key={k} label={l}><Input type="number" min={0} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></Field>
            ))}
            <Field label="Ghi chú" full><Input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Huỷ</Button><Button onClick={() => upd.mutate()} disabled={upd.isPending}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───── Cộng tác viên ───── */
function CtvTab() {
  const fn = useServerFn(listCollaborators);
  const q = useQuery({ queryKey: ["hr-ctv"], queryFn: () => fn() });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Mã KZ-CTV tự cấp khi tạo nhân viên sale/CTV trong hàng phân lead. Duyệt và chi trả tại{" "}
        <Link to="/admin/hoa-hong" className="text-primary underline">Hoa hồng cộng tác viên</Link>.
      </p>
      {q.error && <p className="text-sm text-destructive">{errorMessage(q.error)}</p>}
      <Box>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40"><tr><th className={th}>Mã CTV</th><th className={th}>Họ tên</th><th className={th}>Thị trường</th><th className={th}>Hồ sơ giới thiệu</th><th className={th}>Tổng hoa hồng</th><th className={th}>Đã trả</th><th className={th}>Trạng thái</th></tr></thead>
          <tbody>
            {(q.data ?? []).length === 0 && <tr><td className={td} colSpan={7}>{q.isLoading ? "Đang tải…" : "Chưa có cộng tác viên."}</td></tr>}
            {(q.data ?? []).map((c: any) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className={`${td} font-mono text-xs whitespace-nowrap`}>{c.code}</td>
                <td className={td}><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground break-all">{c.email}</div></td>
                <td className={td}>{c.markets.join(", ") || "—"}</td><td className={td}>{c.referred}</td>
                <td className={td}>{vnd(c.total)}</td><td className={td}>{vnd(c.paid)}</td>
                <td className={td}>{c.is_active ? "Hoạt động" : <span className="text-muted-foreground">Tạm ngừng</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </div>
  );
}
