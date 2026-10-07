import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { listPrograms, upsertClass, deleteClass } from "@/lib/training/training.functions";
import { getClassesBoard, bulkUpdateClasses } from "@/lib/training/classes-board.functions";
import { CLASS_STATUSES, PROGRAM_TYPES, classStatusColor, classStatusLabel, programTypeLabel, suggestCohort } from "@/lib/training/classification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, BookOpen, Download, Users, AlertTriangle, CalendarDays, LayoutGrid } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/training/classes/")({
  component: ClassesPage,
});

const FILTER_KEY = "kaizen.classes.filters";
type Filters = {
  search: string; market: string; cohort: string; program_type: string;
  program_id: string; level: string; teacher_id: string; status: string;
  from: string; to: string;
};
const EMPTY: Filters = { search: "", market: "", cohort: "", program_type: "", program_id: "", level: "", teacher_id: "", status: "", from: "", to: "" };

function ClassesPage() {
  const fetchBoard = useServerFn(getClassesBoard);
  const fetchPrograms = useServerFn(listPrograms);
  const save = useServerFn(upsertClass);
  const remove = useServerFn(deleteClass);
  const bulk = useServerFn(bulkUpdateClasses);
  const qc = useQueryClient();

  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [groupBy, setGroupBy] = useState<"none" | "market" | "cohort" | "program_type">("none");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      if (raw) setFilters({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* bỏ qua */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(filters)); } catch { /* bỏ qua */ }
  }, [filters]);

  const set = (k: keyof Filters, v: string) => { setFilters((p) => ({ ...p, [k]: v })); setPage(1); setSelected([]); };

  const board = useQuery({
    queryKey: ["classes-board", filters, page, pageSize],
    queryFn: () => fetchBoard({ data: {
      ...Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, v || null])),
      page, pageSize,
    } as any }),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
  const programs = useQuery({ queryKey: ["training-programs"], queryFn: () => fetchPrograms(), staleTime: 60_000 });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["classes-board"] });

  const saveMut = useMutation({
    mutationFn: (data: any) => save({ data }),
    onSuccess: () => { toast.success("Đã lưu lớp học"); setEditing(null); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá lớp"); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const bulkMut = useMutation({
    mutationFn: (p: any) => bulk({ data: { ids: selected, ...p } }),
    onSuccess: (r: any) => { toast.success(`Đã cập nhật ${r.updated} lớp`); setSelected([]); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const data = board.data;
  const items: any[] = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  const grouped = useMemo(() => {
    if (groupBy === "none") return [{ label: "", rows: items }];
    const map = new Map<string, any[]>();
    for (const c of items) {
      const key =
        groupBy === "market" ? c.market ?? "Chưa gán thị trường"
        : groupBy === "cohort" ? c.cohort ?? "Chưa gán khoá"
        : programTypeLabel(c.program?.program_type);
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return [...map.entries()].map(([label, rows]) => ({ label, rows }));
  }, [items, groupBy]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(items.map((c) => ({
      "Mã lớp": c.code,
      "Tên lớp": c.name,
      "Chương trình": c.program?.name ?? "",
      "Loại": programTypeLabel(c.program?.program_type),
      "Thị trường": c.market ?? "",
      "Khoá": c.cohort ?? "",
      "Cấp độ": c.program?.level ?? "",
      "Giáo viên": c.teacher_name ?? "Chưa gán",
      "Học viên": c.students,
      "Sĩ số tối đa": c.max_students,
      "Khai giảng": c.start_date ?? "",
      "Kết thúc": c.end_date ?? "",
      "Trạng thái": classStatusLabel(c.status),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lop hoc");
    XLSX.writeFile(wb, `lop-hoc-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const ov = data?.overview;

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <BookOpen className="h-6 w-6 shrink-0" /> <span className="truncate">Lớp học</span>
          </h1>
          <p className="text-sm text-muted-foreground">Quản lý theo thị trường, khoá tuyển sinh và loại chương trình</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/training" className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted">Chương trình</Link>
          <Link to="/admin/training/oversight" className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted">Giám sát lớp</Link>
          <Button size="sm" variant="outline" onClick={exportExcel} disabled={!items.length}>
            <Download className="mr-1 h-4 w-4" /> Excel
          </Button>
          <Button size="sm" onClick={() => setEditing({ code: "", name: "", program_id: programs.data?.items[0]?.id, max_students: 30, status: "planning" })}>
            <Plus className="mr-1 h-4 w-4" /> Mở lớp mới
          </Button>
        </div>
      </div>

      {/* Tổng quan */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat icon={<LayoutGrid className="h-4 w-4" />} label="Lớp (đang lọc)" value={ov?.totalClasses ?? 0} />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="Đang học" value={ov?.activeClasses ?? 0} />
        <Stat icon={<CalendarDays className="h-4 w-4" />} label="Khai giảng 30 ngày" value={ov?.upcoming30 ?? 0} />
        <Stat icon={<Users className="h-4 w-4" />} label="Học viên" value={ov?.totalStudents ?? 0} />
        <Stat icon={<Users className="h-4 w-4" />} label="Chỗ trống" value={ov?.freeSeats ?? 0} />
        <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Chưa có giáo viên" value={ov?.noTeacher ?? 0} tone="warn" />
      </div>

      {/* Phân bố */}
      {data && (
        <div className="grid gap-3 lg:grid-cols-3">
          <Breakdown title="Học viên theo thị trường" rows={data.breakdown.byMarket} onPick={(l) => set("market", l === "Chưa phân loại" ? "" : l)} />
          <Breakdown title="Học viên theo loại chương trình" rows={data.breakdown.byProgramType} />
          <Breakdown title="Học viên theo khoá" rows={data.breakdown.byCohort} onPick={(l) => set("cohort", l === "Chưa phân loại" ? "" : l)} />
        </div>
      )}

      {/* Bộ lọc */}
      <div className="rounded-xl border bg-card p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Field label="Tìm kiếm"><Input value={filters.search} onChange={(e) => set("search", e.target.value)} placeholder="Mã lớp, tên lớp…" /></Field>
          <Field label="Thị trường">
            <Select value={filters.market} onChange={(v) => set("market", v)} options={(data?.facets.markets ?? []).map((m: string) => ({ value: m, label: m }))} />
          </Field>
          <Field label="Khoá">
            <Select value={filters.cohort} onChange={(v) => set("cohort", v)} options={(data?.facets.cohorts ?? []).map((c: string) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Loại chương trình">
            <Select value={filters.program_type} onChange={(v) => set("program_type", v)} options={PROGRAM_TYPES.map((p) => ({ value: p.value, label: p.label }))} />
          </Field>
          <Field label="Chương trình">
            <Select value={filters.program_id} onChange={(v) => set("program_id", v)} options={(programs.data?.items ?? []).map((p: any) => ({ value: p.id, label: `${p.code} · ${p.name}` }))} />
          </Field>
          <Field label="Giáo viên">
            <Select value={filters.teacher_id} onChange={(v) => set("teacher_id", v)} options={(data?.facets.teachers ?? []).map((t: any) => ({ value: t.user_id, label: t.name }))} />
          </Field>
          <Field label="Trạng thái">
            <Select value={filters.status} onChange={(v) => set("status", v)} options={CLASS_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
          </Field>
          <Field label="Khai giảng từ"><Input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} /></Field>
          <Field label="Đến"><Input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} /></Field>
          <Field label="Nhóm theo">
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
              <option value="none">Không nhóm</option>
              <option value="market">Thị trường</option>
              <option value="cohort">Khoá</option>
              <option value="program_type">Loại chương trình</option>
            </select>
          </Field>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={() => { setFilters(EMPTY); setPage(1); }}>Xoá bộ lọc</Button>
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 p-3 text-sm">
          <span className="font-semibold">Đã chọn {selected.length} lớp</span>
          <select className="h-9 rounded-md border bg-background px-2 text-sm" defaultValue=""
            onChange={(e) => { if (e.target.value) { bulkMut.mutate({ status: e.target.value }); e.target.value = ""; } }}>
            <option value="">Đổi trạng thái…</option>
            {CLASS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="h-9 rounded-md border bg-background px-2 text-sm" defaultValue=""
            onChange={(e) => { if (e.target.value) { bulkMut.mutate({ teacher_id: e.target.value }); e.target.value = ""; } }}>
            <option value="">Gán giáo viên…</option>
            {(data?.facets.teachers ?? []).map((t: any) => <option key={t.user_id} value={t.user_id}>{t.name}</option>)}
          </select>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Bỏ chọn</Button>
        </div>
      )}

      {editing && (
        <EditForm
          initial={editing}
          programs={programs.data?.items ?? []}
          markets={data?.facets.markets ?? []}
          onSave={(d: any) => saveMut.mutate(d)}
          onCancel={() => setEditing(null)}
          pending={saveMut.isPending}
        />
      )}

      {/* Bảng lớp */}
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border bg-card [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="w-8 px-2 py-2">
                <input type="checkbox" checked={items.length > 0 && selected.length === items.length}
                  onChange={(e) => setSelected(e.target.checked ? items.map((c) => c.id) : [])} />
              </th>
              {["Mã lớp", "Tên lớp", "Chương trình", "Thị trường", "Khoá", "Giáo viên", "Sĩ số", "Khai giảng", "Trạng thái", ""].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map((g) => (
              <Fragment key={g.label || "all"}>
                {g.label && (
                  <tr key={`g-${g.label}`} className="bg-primary/5">
                    <td colSpan={11} className="px-3 py-2 text-xs font-bold uppercase tracking-wide">
                      {g.label} — {g.rows.length} lớp · {g.rows.reduce((s: number, c: any) => s + c.students, 0)} học viên
                    </td>
                  </tr>
                )}
                {g.rows.map((c: any) => (
                  <tr key={c.id} className="border-t hover:bg-muted/30">
                    <td className="px-2 py-2">
                      <input type="checkbox" checked={selected.includes(c.id)}
                        onChange={(e) => setSelected((p) => e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id))} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{c.code}</td>
                    <td className="px-3 py-2">
                      <Link to="/admin/training/classes/$id" params={{ id: c.id }} className="font-semibold hover:text-primary">{c.name}</Link>
                      {c.schedule && <div className="text-xs text-muted-foreground">{c.schedule}{c.room ? ` · ${c.room}` : ""}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="truncate">{c.program?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{programTypeLabel(c.program?.program_type)}{c.program?.level ? ` · ${c.program.level}` : ""}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{c.market ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">{c.cohort ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">{c.teacher_name ?? <span className="text-amber-600">Chưa gán</span>}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className={c.students > c.max_students ? "font-bold text-red-600" : ""}>{c.students}</span>
                      <span className="text-muted-foreground">/{c.max_students}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{c.start_date ?? "—"}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${classStatusColor(c.status)}`}>{classStatusLabel(c.status)}</span></td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button onClick={() => setEditing(c)} className="mr-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm("Xoá lớp này?")) delMut.mutate(c.id); }} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {!board.isLoading && items.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">Không có lớp nào phù hợp bộ lọc.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {board.isLoading ? "Đang tải…" : `Trang ${page}/${totalPages} · ${data?.total ?? 0} lớp`}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
        </div>
      </div>

      {(data?.alerts.length ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="mb-1 flex items-center gap-2 font-semibold text-amber-800"><AlertTriangle className="h-4 w-4" /> Cảnh báo lớp học</p>
          <ul className="space-y-0.5 text-amber-900">
            {data!.alerts.slice(0, 8).map((a: any, i: number) => <li key={i}>• {a.detail}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: "warn" }) {
  return (
    <div className={`rounded-xl border bg-card p-3 shadow-sm ${tone === "warn" && value > 0 ? "border-amber-400" : ""}`}>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">{icon} <span className="truncate">{label}</span></p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Breakdown({ title, rows, onPick }: { title: string; rows: Array<{ label: string; classes: number; students: number }>; onPick?: (l: string) => void }) {
  const total = rows.reduce((s, r) => s + r.students, 0) || 1;
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1.5">
        {rows.slice(0, 6).map((r) => (
          <button key={r.label} onClick={() => onPick?.(r.label)} className="block w-full text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate">{r.label}</span>
              <span className="shrink-0 text-muted-foreground">{r.students} HV · {r.classes} lớp</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.round((r.students / total) * 100)}%` }} />
            </div>
          </button>
        ))}
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Chưa có dữ liệu.</p>}
      </div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Tất cả</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function EditForm({ initial, programs, markets, onSave, onCancel, pending }: any) {
  const [f, setF] = useState<any>(initial);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const program = programs.find((p: any) => p.id === f.program_id);
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5">
      <h3 className="font-bold">{f.id ? "Sửa lớp" : "Mở lớp mới"}</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Mã lớp *"><Input value={f.code ?? ""} onChange={(e) => set("code", e.target.value)} /></Field>
        <Field label="Tên lớp *" className="md:col-span-2"><Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Chương trình *">
          <select className="w-full rounded-md border bg-background p-2 text-sm" value={f.program_id ?? ""}
            onChange={(e) => {
              const p = programs.find((x: any) => x.id === e.target.value);
              setF((prev: any) => ({ ...prev, program_id: e.target.value, market: prev.market || p?.market || "" }));
            }}>
            <option value="">— Chọn —</option>
            {programs.map((p: any) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
          </select>
          {program && <p className="mt-1 text-[11px] text-muted-foreground">Loại: {programTypeLabel(program.program_type)}</p>}
        </Field>
        <Field label="Thị trường">
          <input list="market-list" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.market ?? ""} onChange={(e) => set("market", e.target.value)} />
          <datalist id="market-list">{markets.map((m: string) => <option key={m} value={m} />)}</datalist>
        </Field>
        <Field label="Khoá tuyển sinh">
          <Input value={f.cohort ?? ""} onChange={(e) => set("cohort", e.target.value)} placeholder={suggestCohort(f.start_date) || "2026-03"} />
        </Field>
        <Field label="Bắt đầu">
          <Input type="date" value={f.start_date ?? ""} onChange={(e) => {
            const v = e.target.value || null;
            setF((prev: any) => ({ ...prev, start_date: v, cohort: prev.cohort || suggestCohort(v) }));
          }} />
        </Field>
        <Field label="Kết thúc"><Input type="date" value={f.end_date ?? ""} onChange={(e) => set("end_date", e.target.value || null)} /></Field>
        <Field label="Lịch học"><Input value={f.schedule ?? ""} onChange={(e) => set("schedule", e.target.value)} placeholder="T2-4-6 18:00-20:00" /></Field>
        <Field label="Phòng"><Input value={f.room ?? ""} onChange={(e) => set("room", e.target.value)} /></Field>
        <Field label="Sĩ số tối đa"><Input type="number" value={f.max_students ?? 30} onChange={(e) => set("max_students", Number(e.target.value))} /></Field>
        <Field label="Trạng thái">
          <select className="w-full rounded-md border bg-background p-2 text-sm" value={f.status ?? "planning"} onChange={(e) => set("status", e.target.value)}>
            {CLASS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button disabled={pending} onClick={() => onSave({
          id: f.id, program_id: f.program_id, code: f.code, name: f.name,
          teacher_id: f.teacher_id ?? null, start_date: f.start_date || null, end_date: f.end_date || null,
          schedule: f.schedule ?? null, room: f.room ?? null,
          max_students: Number(f.max_students) || 30, status: f.status ?? "planning",
          cohort: f.cohort || null, market: f.market || null,
        })}>{pending ? "Đang lưu..." : "Lưu"}</Button>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: any) {
  return <label className={`block space-y-1 text-xs font-medium text-muted-foreground ${className}`}><div>{label}</div>{children}</label>;
}
