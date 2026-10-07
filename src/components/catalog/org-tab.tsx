import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listDepartments, upsertDepartment, deleteDepartment,
  listJobTitles, upsertJobTitle, deleteJobTitle,
} from "@/lib/catalog/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errors";
import { Building2, Briefcase, Plus, Trash2 } from "lucide-react";

type SubTab = "departments" | "job_titles";

const DEPT_PROGRAM_LABEL: Record<string, string> = {
  du_hoc: "Du học",
  xkld: "Xuất khẩu lao động",
  dao_tao: "Đào tạo",
  ho_tro: "Hỗ trợ / vận hành",
};

interface OrgTabProps {
  canManage: boolean;
}

export function OrgTab({ canManage }: OrgTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("departments");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([
          ["departments", "Phòng ban", Building2],
          ["job_titles", "Chức danh", Briefcase],
        ] as [SubTab, string, typeof Building2][]).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setSubTab(k)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ${subTab === k ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-muted"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {subTab === "departments" ? <DepartmentsPanel canManage={canManage} /> : <JobTitlesPanel canManage={canManage} />}
    </div>
  );
}

function DepartmentsPanel({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listDepartments);
  const saveFn = useServerFn(upsertDepartment);
  const delFn = useServerFn(deleteDepartment);
  const [editing, setEditing] = useState<any | null>(null);

  const q = useQuery({ queryKey: ["catalog-departments"], queryFn: () => listFn() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["catalog-departments"] });

  const save = useMutation({
    mutationFn: (v: any) => saveFn({ data: v }),
    onSuccess: () => { toast.success("Đã lưu phòng ban"); setEditing(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Đã tắt phòng ban"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rows = (q.data ?? []) as any[];
  const byParent = new Map<string | null, any[]>();
  rows.forEach((d) => {
    const key = d.parent_id ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(d);
  });

  const renderTree = (parentId: string | null, depth = 0) => {
    const children = byParent.get(parentId) ?? [];
    return children.sort((a, b) => a.sort_order - b.sort_order).map((d) => (
      <tr key={d.id} className="border-t">
        <td className="p-3">
          <div className="font-medium" style={{ paddingLeft: `${depth * 24}px` }}>
            {d.name}
          </div>
          <div className="text-xs text-muted-foreground">{d.code}</div>
        </td>
        <td className="p-3 text-xs text-muted-foreground">
          {d.description || "—"}
          {d.program_type ? <div className="mt-0.5 text-[11px]">Loại hình: {DEPT_PROGRAM_LABEL[d.program_type] ?? d.program_type}</div> : null}
          {d.function_note ? <div className="text-[11px]">Chức năng: {d.function_note}</div> : null}
          {d.market_code ? <div className="text-[11px]">Thị trường: {d.market_code}</div> : null}
        </td>
        <td className="p-3 text-xs">{d.sort_order}</td>
        <td className="p-3 text-xs">{d.is_active ? "Đang bật" : "Đã tắt"}</td>
        <td className="p-3 text-right">
          {canManage && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing({ ...d })}>Sửa</Button>
              <Button variant="outline" size="sm" onClick={() => { if (confirm(`Tắt phòng ban ${d.name}?`)) remove.mutate(d.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="text-sm">
          <p className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" /> Phòng ban</p>
          <p className="text-muted-foreground">Dùng để gán thông tin nhân sự cho tài khoản. Không ảnh hưởng phân quyền.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setEditing({ code: "", name: "", description: "", parent_id: "", sort_order: rows.length + 1, is_active: true })}>
            <Plus className="mr-1 h-4 w-4" /> Thêm phòng ban
          </Button>
        )}
      </div>

      {editing && (
        <OrgItemForm
          item={editing}
          setItem={setEditing}
          parents={rows}
          isDepartment
          onSave={() => save.mutate(editing)}
          onCancel={() => setEditing(null)}
          isPending={save.isPending}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Phòng ban / Mã</th>
              <th className="p-3">Mô tả</th>
              <th className="p-3">Thứ tự</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {renderTree(null)}
            {rows.length === 0 && !q.isLoading && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Chưa có phòng ban</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobTitlesPanel({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listJobTitles);
  const saveFn = useServerFn(upsertJobTitle);
  const delFn = useServerFn(deleteJobTitle);
  const [editing, setEditing] = useState<any | null>(null);

  const q = useQuery({ queryKey: ["catalog-job-titles"], queryFn: () => listFn() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["catalog-job-titles"] });

  const save = useMutation({
    mutationFn: (v: any) => saveFn({ data: v }),
    onSuccess: () => { toast.success("Đã lưu chức danh"); setEditing(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Đã tắt chức danh"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rows = (q.data ?? []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="text-sm">
          <p className="flex items-center gap-2 font-semibold"><Briefcase className="h-4 w-4" /> Chức danh</p>
          <p className="text-muted-foreground">Dùng để gán thông tin nhân sự cho tài khoản. Không ảnh hưởng phân quyền.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setEditing({ code: "", name: "", description: "", sort_order: rows.length + 1, is_active: true })}>
            <Plus className="mr-1 h-4 w-4" /> Thêm chức danh
          </Button>
        )}
      </div>

      {editing && (
        <OrgItemForm
          item={editing}
          setItem={setEditing}
          parents={[]}
          isDepartment={false}
          onSave={() => save.mutate(editing)}
          onCancel={() => setEditing(null)}
          isPending={save.isPending}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Chức danh / Mã</th>
              <th className="p-3">Mô tả</th>
              <th className="p-3">Thứ tự</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.sort((a, b) => a.sort_order - b.sort_order).map((j) => (
              <tr key={j.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{j.name}</div>
                  <div className="text-xs text-muted-foreground">{j.code}</div>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{j.description || "—"}</td>
                <td className="p-3 text-xs">{j.sort_order}</td>
                <td className="p-3 text-xs">{j.is_active ? "Đang bật" : "Đã tắt"}</td>
                <td className="p-3 text-right">
                  {canManage && (
                    <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing({ ...j })}>Sửa</Button>
                  <Button variant="outline" size="sm" onClick={() => { if (confirm(`Tắt chức danh ${j.name}?`)) remove.mutate(j.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !q.isLoading && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Chưa có chức danh</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrgItemForm({
  item, setItem, parents, isDepartment, onSave, onCancel, isPending,
}: {
  item: any;
  setItem: (v: any) => void;
  parents: any[];
  isDepartment: boolean;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const parentOptions = isDepartment ? parents.filter((p) => p.id !== item.id) : [];

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Input placeholder={isDepartment ? "Tên phòng ban" : "Tên chức danh"} value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} />
        <Input placeholder="Mã (VD: dao_tao)" value={item.code} onChange={(e) => setItem({ ...item, code: e.target.value })} />
        <Input type="number" placeholder="Thứ tự" value={item.sort_order} onChange={(e) => setItem({ ...item, sort_order: Number(e.target.value) || 0 })} />
      </div>
      <Textarea placeholder="Mô tả ngắn" value={item.description ?? ""} onChange={(e) => setItem({ ...item, description: e.target.value })} />
      {isDepartment && (
        <label className="block text-sm text-muted-foreground">
          Thuộc phòng ban cấp trên
          <select
            className="mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm text-foreground"
            value={item.parent_id ?? ""}
            onChange={(e) => setItem({ ...item, parent_id: e.target.value || null })}
          >
            <option value="">— Không cấp trên —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      )}
      {isDepartment && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm text-muted-foreground">
            Thị trường phụ trách (mã)
            <Input className="mt-1" placeholder="VD: nhat-ban, han-quoc — để trống nếu phụ trách chung" value={item.market_code ?? ""} onChange={(e) => setItem({ ...item, market_code: e.target.value || null })} />
          </label>
          <label className="block text-sm text-muted-foreground">
            Chức năng chính
            <Input className="mt-1" placeholder="VD: Quản lý hồ sơ xuất cảnh thị trường Nhật" value={item.function_note ?? ""} onChange={(e) => setItem({ ...item, function_note: e.target.value || null })} />
          </label>
          <label className="block text-sm text-muted-foreground">
            Loại hình nghiệp vụ
            <select
              className="mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm text-foreground"
              value={item.program_type ?? ""}
              onChange={(e) => setItem({ ...item, program_type: e.target.value || null })}
            >
              <option value="">— Chưa xác định —</option>
              {Object.entries(DEPT_PROGRAM_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!item.is_active} onChange={(e) => setItem({ ...item, is_active: e.target.checked })} /> Đang bật
        </label>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Huỷ</Button>
          <Button size="sm" disabled={isPending} onClick={onSave}>Lưu</Button>
        </div>
      </div>
    </div>
  );
}
