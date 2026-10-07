import { errorMessage } from "@/lib/errors";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClass, enrollStudent, removeEnrollment, updateEnrollment,
  upsertSession, deleteSession,
} from "@/lib/training/training.functions";
import { searchStudentsForEnroll, bulkEnrollStudents } from "@/lib/training/classes-board.functions";
import { checkAndIssueClassCertificates } from "@/lib/training/lms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus, Trash2, Plus, Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/training/classes/$id")({
  component: ClassDetail,
});

function ClassDetail() {
  const { id } = Route.useParams();
  const fetchClass = useServerFn(getClass);
  const enroll = useServerFn(enrollStudent);
  const remove = useServerFn(removeEnrollment);
  const updateE = useServerFn(updateEnrollment);
  const saveSession = useServerFn(upsertSession);
  const delSession = useServerFn(deleteSession);
  const issueClassCerts = useServerFn(checkAndIssueClassCertificates);
  const qc = useQueryClient();

  const data = useQuery({ queryKey: ["training-class", id], queryFn: () => fetchClass({ data: { id } }) });

  const [search, setSearch] = useState("");
  const searchStudents = useServerFn(searchStudentsForEnroll);
  const bulkEnroll = useServerFn(bulkEnrollStudents);
  const students = useQuery({
    queryKey: ["enrollable-students", id, search],
    queryFn: () => searchStudents({ data: { class_id: id, search: search || null, limit: 30 } }),
    staleTime: 15_000,
  });
  const filtered: any[] = students.data?.items ?? [];
  const [pick, setPick] = useState<string[]>([]);

  // Danh sách đã ghi danh: lọc + tìm kiếm tại chỗ
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollStatus, setEnrollStatus] = useState("");
  const enrolledRows = useMemo(() => {
    const s = enrollSearch.trim().toLowerCase();
    return (data.data?.enrollments ?? []).filter((e: any) => {
      if (enrollStatus && e.status !== enrollStatus) return false;
      if (!s) return true;
      const p = e.student_profiles ?? {};
      return `${p.full_name ?? ""} ${p.phone ?? ""} ${p.student_code ?? ""}`.toLowerCase().includes(s);
    });
  }, [data.data, enrollSearch, enrollStatus]);

  const inv = () => qc.invalidateQueries({ queryKey: ["training-class", id] });
  const enrollMut = useMutation({
    mutationFn: (sid: string) => enroll({ data: { class_id: id, student_profile_id: sid } }),
    onSuccess: () => { toast.success("Đã thêm học viên"); inv(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const removeMut = useMutation({
    mutationFn: (eid: string) => remove({ data: { id: eid } }),
    onSuccess: () => { toast.success("Đã gỡ"); inv(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const bulkMut = useMutation({
    mutationFn: (ids: string[]) => bulkEnroll({ data: { class_id: id, student_profile_ids: ids } }),
    onSuccess: (r: any) => { toast.success(`Đã ghi danh ${r.added} học viên`); setPick([]); inv(); qc.invalidateQueries({ queryKey: ["enrollable-students"] }); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const updMut = useMutation({
    mutationFn: (payload: any) => updateE({ data: payload }),
    onSuccess: () => { toast.success("Đã cập nhật"); inv(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const [newSession, setNewSession] = useState<any | null>(null);
  const sessionMut = useMutation({
    mutationFn: (d: any) => saveSession({ data: d }),
    onSuccess: () => { toast.success("Đã lưu buổi học"); setNewSession(null); inv(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delSessionMut = useMutation({
    mutationFn: (sid: string) => delSession({ data: { id: sid } }),
    onSuccess: () => { toast.success("Đã xoá"); inv(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const issueClassMut = useMutation({
    mutationFn: () => issueClassCerts({ data: { class_id: id } }),
    onSuccess: (r: any) => {
      toast.success(r.issued > 0 ? `Đã cấp ${r.issued} chứng chỉ` : "Đã kiểm tra, chưa có chứng chỉ mới");
      inv();
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const cls = data.data?.cls;
  const nextSessionNo = (data.data?.sessions?.length ?? 0) + 1;

  return (
    <div className="space-y-6">
      <Link to="/admin/training/classes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4"/> Quay lại danh sách lớp
      </Link>

      {!cls ? <div className="text-muted-foreground">Đang tải...</div> : (
        <>
          <div className="rounded-2xl border bg-card p-5">
            <div className="font-mono text-xs text-muted-foreground">{cls.code}</div>
            <h1 className="text-2xl font-bold">{cls.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground">{cls.training_programs?.name} · {cls.schedule ?? "Chưa có lịch"}</div>
            <div className="mt-3 flex gap-2">
              <Link to="/admin/training/classes/$id/attendance" params={{ id }} className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:opacity-90">📋 Điểm danh</Link>
              <Link to="/admin/training/classes/$id/grades" params={{ id }} className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted">📊 Bảng điểm</Link>
              <Button size="sm" variant="outline" onClick={() => issueClassMut.mutate()} disabled={issueClassMut.isPending}>
                {issueClassMut.isPending ? "Đang kiểm tra..." : "🎓 Kiểm tra cấp chứng chỉ"}
              </Button>
            </div>
          </div>

          {/* Học viên */}
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-bold">Học viên ({data.data?.enrollments.length ?? 0})</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {/* Đã ghi danh */}
              <div className="min-w-0 space-y-2">
                <div className="text-xs uppercase text-muted-foreground">Đã ghi danh</div>
                <div className="flex gap-2">
                  <Input placeholder="Tìm tên / SĐT / mã học viên" value={enrollSearch} onChange={(e) => setEnrollSearch(e.target.value)} />
                  <select className="h-10 rounded-md border bg-background px-2 text-sm" value={enrollStatus} onChange={(e) => setEnrollStatus(e.target.value)}>
                    <option value="">Tất cả</option>
                    {["active", "completed", "dropped", "suspended"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                  {enrolledRows.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.student_profiles?.full_name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {e.student_profiles?.student_code ? `${e.student_profiles.student_code} • ` : ""}{e.student_profiles?.phone}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <select
                          className="rounded-md border bg-background p-1 text-xs"
                          value={e.status}
                          onChange={(ev) => updMut.mutate({ id: e.id, status: ev.target.value })}
                        >
                          {["active","completed","dropped","suspended"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => { if (confirm("Gỡ học viên?")) removeMut.mutate(e.id); }} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                      </div>
                    </div>
                  ))}
                  {enrolledRows.length === 0 && <div className="text-xs text-muted-foreground">Không có học viên phù hợp.</div>}
                </div>
              </div>
              {/* Thêm học viên */}
              <div className="min-w-0 space-y-2">
                <div className="text-xs uppercase text-muted-foreground">Thêm học viên từ kho hồ sơ</div>
                <Input placeholder="Tìm theo tên / SĐT / mã học viên / email" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {filtered.map((s: any) => (
                    <label key={s.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-2 text-sm hover:bg-muted/40">
                      <span className="flex min-w-0 items-center gap-2">
                        <input type="checkbox" checked={pick.includes(s.id)}
                          onChange={(ev) => setPick((p) => ev.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id))} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{s.full_name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{s.student_code ? `${s.student_code} • ` : ""}{s.phone}</span>
                        </span>
                      </span>
                      <Button size="sm" variant="outline" onClick={(ev) => { ev.preventDefault(); enrollMut.mutate(s.id); }} disabled={enrollMut.isPending}>
                        <UserPlus className="mr-1 h-3 w-3"/> Thêm
                      </Button>
                    </label>
                  ))}
                  {students.isLoading && <div className="text-xs text-muted-foreground">Đang tìm…</div>}
                  {!students.isLoading && filtered.length === 0 && <div className="text-xs text-muted-foreground">Không có hồ sơ phù hợp.</div>}
                </div>
                {pick.length > 0 && (
                  <Button size="sm" onClick={() => bulkMut.mutate(pick)} disabled={bulkMut.isPending}>
                    {bulkMut.isPending ? "Đang ghi danh…" : `Ghi danh ${pick.length} học viên đã chọn`}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Buổi học */}
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><Calendar className="h-5 w-5"/> Lịch buổi học ({data.data?.sessions.length})</h2>
              <Button size="sm" onClick={() => setNewSession({ class_id: id, session_no: nextSessionNo, session_date: new Date().toISOString().slice(0,10), status: "scheduled" })}>
                <Plus className="h-4 w-4 mr-1"/> Thêm buổi
              </Button>
            </div>
            {newSession && (
              <div className="mt-3 rounded-lg border bg-muted/30 p-3 grid gap-2 md:grid-cols-5">
                <Input type="number" value={newSession.session_no} onChange={(e) => setNewSession({ ...newSession, session_no: Number(e.target.value) })} placeholder="Số thứ tự" />
                <Input type="date" value={newSession.session_date} onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })} />
                <Input value={newSession.title ?? ""} onChange={(e) => setNewSession({ ...newSession, title: e.target.value })} placeholder="Tiêu đề" />
                <Input value={newSession.topic ?? ""} onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })} placeholder="Chủ đề" />
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => sessionMut.mutate(newSession)} disabled={sessionMut.isPending}>Lưu</Button>
                  <Button size="sm" variant="outline" onClick={() => setNewSession(null)}>Huỷ</Button>
                </div>
              </div>
            )}
            <div className="mt-3 divide-y">
              {data.data?.sessions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-mono text-xs mr-2">#{s.session_no}</span>
                    <span className="font-medium">{s.title ?? `Buổi ${s.session_no}`}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{s.session_date}</span>
                    {s.topic && <span className="ml-2 text-xs text-muted-foreground">— {s.topic}</span>}
                  </div>
                  <button onClick={() => { if (confirm("Xoá buổi học?")) delSessionMut.mutate(s.id); }} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                </div>
              ))}
              {data.data?.sessions.length === 0 && <div className="py-4 text-xs text-muted-foreground">Chưa có buổi học nào.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
