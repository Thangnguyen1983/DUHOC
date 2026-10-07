import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getStaffProfile, upsertStaffProfile,
  listDepartmentScope, upsertDepartmentScope, deleteDepartmentScope,
  ACCESS_LEVEL_LABEL,
} from "@/lib/staff/staff.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errors";
import { Plus, Trash2 } from "lucide-react";

type Form = {
  id_no: string;
  dob: string;
  phone: string;
  education_level: string;
  pro_certificate_du_hoc: string;
  pro_certificate_xkld: string;
  department_id: string;
  job_title_id: string;
};

const EMPTY: Form = {
  id_no: "", dob: "", phone: "", education_level: "",
  pro_certificate_du_hoc: "", pro_certificate_xkld: "",
  department_id: "", job_title_id: "",
};

export function StaffDialog({
  user, departments, jobTitles, onDone,
}: {
  user: { id: string; email: string; full_name: string };
  departments: any[];
  jobTitles: any[];
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getStaffProfile);
  const saveFn = useServerFn(upsertStaffProfile);
  const scopeListFn = useServerFn(listDepartmentScope);
  const scopeSaveFn = useServerFn(upsertDepartmentScope);
  const scopeDelFn = useServerFn(deleteDepartmentScope);

  const [form, setForm] = useState<Form>(EMPTY);
  const [newDept, setNewDept] = useState("");
  const [newLevel, setNewLevel] = useState("read");

  const profileQ = useQuery({
    queryKey: ["staff-profile", user.id],
    queryFn: () => getFn({ data: { user_id: user.id } }),
  });
  const scopeQ = useQuery({
    queryKey: ["staff-scope", user.id],
    queryFn: () => scopeListFn({ data: { user_id: user.id } }),
  });

  useEffect(() => {
    const p: any = profileQ.data;
    if (!p) return;
    setForm({
      id_no: p.id_no ?? "",
      dob: p.dob ?? "",
      phone: p.phone ?? "",
      education_level: p.education_level ?? "",
      pro_certificate_du_hoc: p.pro_certificate_du_hoc ?? "",
      pro_certificate_xkld: p.pro_certificate_xkld ?? "",
      department_id: p.department_id ?? "",
      job_title_id: p.job_title_id ?? "",
    });
  }, [profileQ.data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { user_id: user.id, ...form } }),
    onSuccess: () => {
      toast.success("Đã lưu hồ sơ cán bộ");
      qc.invalidateQueries({ queryKey: ["staff-profile", user.id] });
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, "Không lưu được hồ sơ")),
  });

  const addScope = useMutation({
    mutationFn: () => scopeSaveFn({ data: { user_id: user.id, department_id: newDept, access_level: newLevel as any } }),
    onSuccess: () => {
      toast.success("Đã phân công phòng ban");
      setNewDept("");
      qc.invalidateQueries({ queryKey: ["staff-scope", user.id] });
    },
    onError: (e) => toast.error(errorMessage(e, "Không phân công được")),
  });

  const delScope = useMutation({
    mutationFn: (id: string) => scopeDelFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã gỡ phân công");
      qc.invalidateQueries({ queryKey: ["staff-scope", user.id] });
    },
    onError: (e) => toast.error(errorMessage(e, "Không gỡ được phân công")),
  });

  const scopes = (scopeQ.data ?? []) as any[];
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Hồ sơ cán bộ — {user.full_name || user.email}</DialogTitle>
        <DialogDescription>
          Thông tin nhân sự và phạm vi phụ trách theo phòng ban. Mức quyền áp dụng cho hồ sơ xuất cảnh và báo cáo tháng.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Mã nhân sự</Label>
          <Input value={(profileQ.data as { staff_code?: string } | null)?.staff_code ?? "Tự cấp khi lưu lần đầu"} readOnly className="mt-1" />
        </div>
        <div>
          <Label>Số căn cước công dân</Label>
          <Input value={form.id_no} onChange={(e) => set("id_no", e.target.value)} placeholder="12 số" />
        </div>
        <div>
          <Label>Ngày sinh</Label>
          <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </div>
        <div>
          <Label>Số điện thoại</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09xxxxxxxx" />
        </div>
        <div>
          <Label>Trình độ chuyên môn</Label>
          <Input value={form.education_level} onChange={(e) => set("education_level", e.target.value)} placeholder="Đại học, Cao đẳng…" />
        </div>
        <div>
          <Label>Chứng chỉ nghiệp vụ du học</Label>
          <Input value={form.pro_certificate_du_hoc} onChange={(e) => set("pro_certificate_du_hoc", e.target.value)} placeholder="Số hiệu, ngày cấp" />
        </div>
        <div>
          <Label>Chứng chỉ nghiệp vụ xuất khẩu lao động</Label>
          <Input value={form.pro_certificate_xkld} onChange={(e) => set("pro_certificate_xkld", e.target.value)} placeholder="Số hiệu, ngày cấp" />
        </div>
        <div>
          <Label>Phòng ban chính</Label>
          <select
            className="mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm"
            value={form.department_id}
            onChange={(e) => set("department_id", e.target.value)}
          >
            <option value="">— Chưa gán —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <Label>Chức danh</Label>
          <select
            className="mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm"
            value={form.job_title_id}
            onChange={(e) => set("job_title_id", e.target.value)}
          >
            <option value="">— Chưa gán —</option>
            {jobTitles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-2 space-y-3 rounded-xl border bg-muted/30 p-4">
        <p className="text-sm font-semibold">Phạm vi phụ trách theo phòng ban</p>
        <div className="space-y-2">
          {scopes.length === 0 && <p className="text-sm text-muted-foreground">Chưa phân công phòng ban nào.</p>}
          {scopes.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
              <span>
                {s.catalog_departments?.name ?? s.department_id}
                <span className="ml-2 text-xs text-muted-foreground">{ACCESS_LEVEL_LABEL[s.access_level] ?? s.access_level}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => delScope.mutate(s.id)} disabled={delScope.isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select
            className="h-10 min-w-48 flex-1 rounded-md border bg-background px-2 text-sm"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
          >
            <option value="">— Chọn phòng ban —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-2 text-sm"
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value)}
          >
            {Object.entries(ACCESS_LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Button size="sm" disabled={!newDept || addScope.isPending} onClick={() => addScope.mutate()}>
            <Plus className="mr-1 h-4 w-4" /> Thêm
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button disabled={save.isPending} onClick={() => save.mutate()}>Lưu hồ sơ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
