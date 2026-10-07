import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, Fragment } from "react";
import {
  listUsers, setUserRoles, inviteUser, sendResetLink, setUserBanned, deleteUser,
  createUserWithPassword, setUserPassword, updateUserProfile, AVAILABLE_ROLES,
} from "@/lib/users.functions";
import {
  listDepartments, listJobTitles,
} from "@/lib/catalog/catalog.functions";
import { ROLE_CATALOG, ROLE_GROUP_LABEL, ROLE_META, groupRoles, roleLabel } from "@/lib/rbac/catalog";
import { permissionsForRoles, PERMISSION_LABEL, PERMISSION_GROUPS, type Permission } from "@/lib/rbac/permissions";
import { getRolePermissionMatrix, setRolePermission, resetRolePermissions } from "@/lib/rbac/role-permissions.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { UserPlus, KeyRound, Ban, ShieldCheck, Trash2, Pencil, Copy, UserCog, Lock, Grid3x3, List, MoreHorizontal, ShieldHalf, RotateCcw, IdCard } from "lucide-react";
import { publicUrl } from "@/lib/site-url";
import { StaffDialog } from "@/components/admin/staff-dialog";
import { OperationalSignatories } from "@/components/admin/operational-signatories";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  roles: string[];
  department_id: string | null;
  job_title_id: string | null;
};

function AdminUsers() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const fetchDepartments = useServerFn(listDepartments);
  const fetchJobTitles = useServerFn(listJobTitles);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const { data: departments = [] } = useQuery({ queryKey: ["catalog-departments"], queryFn: () => fetchDepartments() });
  const { data: jobTitles = [] } = useQuery({ queryKey: ["catalog-job-titles"], queryFn: () => fetchJobTitles() });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"matrix" | "list" | "roles">("matrix");

  const deptById = useMemo(() => {
    const map = new Map<string, string>();
    (departments as any[]).forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    (jobTitles as any[]).forEach((t) => map.set(t.id, t.name));
    return map;
  }, [jobTitles]);

  const filtered = useMemo(() => {
    const items: UserRow[] = (data?.items ?? []) as any;
    return items.filter((u) => {
      const matchSearch = !search ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all"
        ? true
        : roleFilter === "none"
          ? u.roles.length === 0
          : u.roles.includes(roleFilter);
      const matchDept = departmentFilter === "all"
        ? true
        : departmentFilter === "none"
          ? !u.department_id
          : u.department_id === departmentFilter;
      return matchSearch && matchRole && matchDept;
    });
  }, [data, search, roleFilter, departmentFilter]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tài khoản & Quyền (RBAC)</h1>
          <p className="text-sm text-muted-foreground">
            {data?.items.length ?? 0} tài khoản — {ROLE_CATALOG.length} vai trò được định nghĩa. Mọi enforcement đi qua RLS + <code>has_role()</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><UserCog className="mr-2 h-4 w-4" /> Tạo tài khoản</Button>
            </DialogTrigger>
            <CreateUserDialog onDone={() => { setCreateOpen(false); refresh(); }} departments={departments as any[]} jobTitles={jobTitles as any[]} />
          </Dialog>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" /> Mời qua email</Button>
            </DialogTrigger>
            <InviteDialog onDone={() => { setInviteOpen(false); refresh(); }} departments={departments as any[]} jobTitles={jobTitles as any[]} />
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Tìm theo email hoặc tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="none">Chưa có vai trò</SelectItem>
            {ROLE_CATALOG.map((r) => (
              <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phòng ban</SelectItem>
            <SelectItem value="none">Chưa gán phòng ban</SelectItem>
            {(departments as any[]).filter((d) => d.is_active).sort((a, b) => a.sort_order - b.sort_order).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto inline-flex rounded-md border bg-card p-0.5 text-xs">

          <button
            onClick={() => setViewMode("matrix")}
            className={`rounded px-3 py-1.5 font-medium ${viewMode === "matrix" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Grid3x3 className="mr-1 inline h-3.5 w-3.5" /> Ma trận phân quyền
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded px-3 py-1.5 font-medium ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <List className="mr-1 inline h-3.5 w-3.5" /> Danh sách
          </button>
          <button
            onClick={() => setViewMode("roles")}
            className={`rounded px-3 py-1.5 font-medium ${viewMode === "roles" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <ShieldHalf className="mr-1 inline h-3.5 w-3.5" /> Vai trò × Quyền
          </button>
        </div>
      </div>

      <OperationalSignatories people={(data?.items ?? []) as UserRow[]} />

      {viewMode === "roles" ? (
        <RolePermissionMatrix />
      ) : viewMode === "matrix" ? (
        <RoleMatrixTable
          users={filtered}
          isLoading={isLoading}
          currentUserId={data?.currentUserId ?? ""}
          onChanged={refresh}
          departments={departments as any[]}
          jobTitles={jobTitles as any[]}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Phòng ban / Chức danh</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Đăng nhập gần nhất</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Không có tài khoản phù hợp.</td></tr>
              )}
              {filtered.map((u) => (
                <UserRowItem
                  key={u.id}
                  user={u}
                  currentUserId={data?.currentUserId ?? ""}
                  onChanged={refresh}
                  departments={departments as any[]}
                  jobTitles={jobTitles as any[]}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Ma trận Tài khoản × Vai trò — tick ô là lưu ngay. */
function RoleMatrixTable({
  users, isLoading, currentUserId, onChanged, departments, jobTitles,
}: { users: UserRow[]; isLoading: boolean; currentUserId: string; onChanged: () => void; departments: any[]; jobTitles: any[] }) {
  const qc = useQueryClient();
  const groups = groupRoles();
  const groupKeys = (Object.keys(groups) as Array<keyof typeof groups>).filter((g) => groups[g].length > 0);
  const columns = groupKeys.flatMap((g) => groups[g].map((r) => ({ ...r, group: g })));
  const [saving, setSaving] = useState<string | null>(null);

  const saveRoles = useServerFn(setUserRoles);
  const mut = useMutation({
    mutationFn: (vars: { user_id: string; roles: string[] }) =>
      saveRoles({ data: { user_id: vars.user_id, roles: vars.roles as any } }),
    onSuccess: () => { toast.success("Đã cập nhật phân quyền"); onChanged(); },
    onError: (e) => {
      toast.error(errorMessage(e, "Không lưu được phân quyền"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onSettled: () => setSaving(null),
  });

  function toggle(u: UserRow, roleKey: string) {
    const has = u.roles.includes(roleKey);
    if (has && roleKey === "admin" && u.id === currentUserId) {
      toast.error("Không thể tự gỡ quyền Quản trị viên của chính bạn");
      return;
    }
    const next = has ? u.roles.filter((r) => r !== roleKey) : [...u.roles, roleKey];
    setSaving(`${u.id}:${roleKey}`);
    // optimistic
    qc.setQueryData(["admin-users"], (old: any) =>
      old ? { ...old, items: old.items.map((it: UserRow) => (it.id === u.id ? { ...it, roles: next } : it)) } : old,
    );
    mut.mutate({ user_id: u.id, roles: next });
  }

  if (isLoading) {
    return <div className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">Đang tải...</div>;
  }
  if (users.length === 0) {
    return <div className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">Không có tài khoản phù hợp.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-20 border-b border-r bg-muted/60 px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground"
            >
              Tài khoản
            </th>
            {groupKeys.map((g) => (
              <th
                key={g}
                colSpan={groups[g].length}
                className="border-b border-l bg-muted/60 px-2 py-1.5 text-center text-[11px] font-semibold uppercase text-muted-foreground"
              >
                {ROLE_GROUP_LABEL[g]}
              </th>
            ))}
            <th rowSpan={2} className="border-b border-l bg-muted/60 px-3 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">
              Thao tác
            </th>
          </tr>
          <tr>
            {columns.map((c, i) => (
              <th
                key={c.key}
                title={`${c.label} — ${c.description}`}
                className={`h-36 border-b bg-muted/30 px-0 align-bottom ${i > 0 && c.group !== columns[i - 1]!.group ? "border-l" : ""}`}
              >
                <div className="mx-auto flex h-full w-8 items-end justify-center pb-2">
                  <span
                    className="whitespace-nowrap text-[11px] font-medium text-foreground/80"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                  >
                    {c.label}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
            const permCount = permissionsForRoles(u.roles).length;
            const deptName = departments.find((d) => d.id === u.department_id)?.name;
            const titleName = jobTitles.find((t) => t.id === u.job_title_id)?.name;
            return (
              <tr key={u.id} className="hover:bg-muted/20">
                <td className="sticky left-0 z-10 max-w-[260px] border-b border-r bg-card px-4 py-2">
                  <div className="truncate font-medium" title={u.email}>
                    {u.email}
                    {u.id === currentUserId && <span className="ml-1 text-xs text-muted-foreground">(bạn)</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">{u.full_name || "—"}</span>
                    {isBanned ? <Badge variant="destructive" className="h-4 px-1 text-[10px]">Khoá</Badge> : null}
                    <span title="Số quyền hiệu lực">· {permCount} quyền</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {deptName && <span className="rounded bg-muted px-1.5 py-0.5" title="Phòng ban">{deptName}</span>}
                    {titleName && <span className="rounded bg-muted px-1.5 py-0.5" title="Chức danh">{titleName}</span>}
                  </div>
                </td>
                {columns.map((c, i) => {
                  const checked = u.roles.includes(c.key);
                  const cellKey = `${u.id}:${c.key}`;
                  return (
                    <td
                      key={c.key}
                      className={`border-b p-0 text-center ${i > 0 && c.group !== columns[i - 1]!.group ? "border-l" : ""} ${checked ? "bg-primary/5" : ""}`}
                    >
                      <label className="flex h-10 w-8 cursor-pointer items-center justify-center" title={`${c.label} — ${u.email}`}>
                        <Checkbox
                          checked={checked}
                          disabled={saving === cellKey}
                          onCheckedChange={() => toggle(u, c.key)}
                        />
                      </label>
                    </td>
                  );
                })}
                <td className="border-b border-l px-2 py-2">
                  <MatrixRowActions user={u} currentUserId={currentUserId} onChanged={onChanged} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MatrixRowActions({ user, currentUserId, onChanged }: { user: UserRow; currentUserId: string; onChanged: () => void }) {
  const [pwOpen, setPwOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isSelf = user.id === currentUserId;
  const isBanned = !!user.banned_until && new Date(user.banned_until) > new Date();

  const resetMut = useMutation({
    mutationFn: useServerFn(sendResetLink),
    onSuccess: () => toast.success("Đã gửi email đặt lại mật khẩu"),
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });
  const banMut = useMutation({
    mutationFn: useServerFn(setUserBanned),
    onSuccess: () => { toast.success("Đã cập nhật trạng thái"); onChanged(); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });
  const delMut = useMutation({
    mutationFn: useServerFn(deleteUser),
    onSuccess: () => { toast.success("Đã xoá tài khoản"); onChanged(); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  return (
    <div className="flex justify-end">
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <SetPasswordDialog user={user} onDone={() => { setPwOpen(false); onChanged(); }} />
      </Dialog>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" title="Thao tác"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => { setDropdownOpen(false); setPwOpen(true); }}>
            <Lock className="mr-2 h-4 w-4" /> Đặt mật khẩu mới
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => { setDropdownOpen(false); resetMut.mutate({ data: { user_id: user.id, redirect_to: publicUrl("/reset-password") } }); }}
            disabled={resetMut.isPending}
          >
            <KeyRound className="mr-2 h-4 w-4" /> Gửi link đặt lại mật khẩu
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => { setDropdownOpen(false); banMut.mutate({ data: { user_id: user.id, banned: !isBanned } }); }}
            disabled={isSelf || banMut.isPending}
          >
            {isBanned ? <ShieldCheck className="mr-2 h-4 w-4 text-green-600" /> : <Ban className="mr-2 h-4 w-4 text-amber-600" />}
            {isBanned ? "Mở khoá tài khoản" : "Khoá tài khoản"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onSelect={() => {
              setDropdownOpen(false);
              if (confirm(`Xoá vĩnh viễn tài khoản ${user.email}?`)) delMut.mutate({ data: { user_id: user.id } });
            }}
            disabled={isSelf || delMut.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Xoá tài khoản
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}


function UserRowItem({ user, currentUserId, onChanged, departments, jobTitles }: {
  user: UserRow; currentUserId: string; onChanged: () => void; departments: any[]; jobTitles: any[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
  const isSelf = user.id === currentUserId;
  const deptName = departments.find((d) => d.id === user.department_id)?.name;
  const titleName = jobTitles.find((t) => t.id === user.job_title_id)?.name;

  const resetMut = useMutation({
    mutationFn: useServerFn(sendResetLink),
    onSuccess: () => toast.success("Đã gửi email đặt lại mật khẩu"),
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });
  const banMut = useMutation({
    mutationFn: useServerFn(setUserBanned),
    onSuccess: () => { toast.success("Đã cập nhật trạng thái"); onChanged(); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });
  const delMut = useMutation({
    mutationFn: useServerFn(deleteUser),
    onSuccess: () => { toast.success("Đã xoá tài khoản"); onChanged(); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3 font-medium">{user.email}{isSelf && <span className="ml-2 text-xs text-muted-foreground">(bạn)</span>}</td>
      <td className="px-4 py-3 text-muted-foreground">{user.full_name || "—"}</td>
      <td className="px-4 py-3">
        <div className="space-y-1 text-xs text-muted-foreground">
          {deptName ? <div><span className="text-[10px] uppercase tracking-wide text-foreground/60">PB:</span> {deptName}</div> : null}
          {titleName ? <div><span className="text-[10px] uppercase tracking-wide text-foreground/60">CD:</span> {titleName}</div> : null}
          {!deptName && !titleName && <span className="text-xs">—</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {user.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          {user.roles.map((r) => (
            <Badge key={r} variant={r === "admin" ? "default" : "secondary"} title={ROLE_META[r as keyof typeof ROLE_META]?.description ?? r}>{roleLabel(r)}</Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        {isBanned ? <Badge variant="destructive">Bị khoá</Badge>
          : !user.email_confirmed_at ? <Badge variant="outline">Chưa xác minh</Badge>
            : <Badge variant="secondary">Active</Badge>}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("vi-VN") : "Chưa từng"}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <EditAccountDialog user={user} onDone={() => { setEditOpen(false); onChanged(); }} departments={departments} jobTitles={jobTitles} />
          </Dialog>
          <Dialog open={pwOpen} onOpenChange={setPwOpen}>
            <SetPasswordDialog user={user} onDone={() => { setPwOpen(false); onChanged(); }} />
          </Dialog>
          <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
            {staffOpen && (
              <StaffDialog
                user={user}
                departments={departments}
                jobTitles={jobTitles}
                onDone={() => setStaffOpen(false)}
              />
            )}
          </Dialog>

          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" title="Thao tác"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => { setDropdownOpen(false); setEditOpen(true); }}>
                <Pencil className="mr-2 h-4 w-4" /> Sửa tài khoản
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { setDropdownOpen(false); setStaffOpen(true); }}>
                <IdCard className="mr-2 h-4 w-4" /> Hồ sơ cán bộ & phòng ban
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { setDropdownOpen(false); setPwOpen(true); }}>
                <Lock className="mr-2 h-4 w-4" /> Đặt mật khẩu mới
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => { setDropdownOpen(false); resetMut.mutate({ data: { user_id: user.id, redirect_to: publicUrl("/reset-password") } }); }}
                disabled={resetMut.isPending}
              >
                <KeyRound className="mr-2 h-4 w-4" /> Gửi link đặt lại mật khẩu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => { setDropdownOpen(false); banMut.mutate({ data: { user_id: user.id, banned: !isBanned } }); }}
                disabled={isSelf || banMut.isPending}
              >
                {isBanned ? <ShieldCheck className="mr-2 h-4 w-4 text-green-600" /> : <Ban className="mr-2 h-4 w-4 text-amber-600" />}
                {isBanned ? "Mở khoá tài khoản" : "Khoá tài khoản"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onSelect={() => {
                  setDropdownOpen(false);
                  if (confirm(`Xoá vĩnh viễn tài khoản ${user.email}?`)) delMut.mutate({ data: { user_id: user.id } });
                }}
                disabled={isSelf || delMut.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Xoá tài khoản
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

function RoleCheckboxGrid({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const groups = groupRoles();
  const toggle = (r: string) =>
    onChange(value.includes(r) ? value.filter((x) => x !== r) : [...value, r]);
  return (
    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
      {(Object.keys(groups) as Array<keyof typeof groups>).map((g) => (
        <div key={g}>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {ROLE_GROUP_LABEL[g]}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {groups[g].map((r) => (
              <label key={r.key} className={`flex cursor-pointer gap-2 rounded-md border p-2 text-sm hover:bg-accent ${value.includes(r.key) ? "border-primary bg-primary/5" : ""}`}>
                <Checkbox checked={value.includes(r.key)} onCheckedChange={() => toggle(r.key)} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2">{r.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tóm tắt ngắn: chỉ hiện số quyền, chi tiết xem khi rê chuột. */
function PermissionPreview({ roles }: { roles: string[] }) {
  const perms = useMemo(() => permissionsForRoles(roles), [roles]);
  if (perms.length === 0) {
    return <p className="text-xs text-muted-foreground">Chưa có quyền nào — tài khoản không vào được bảng điều hành.</p>;
  }
  return (
    <p className="text-xs text-muted-foreground" title={perms.map((p) => PERMISSION_LABEL[p]).join(", ")}>
      Đang có <strong>{perms.length}</strong> quyền hiệu lực (rê chuột để xem chi tiết).
    </p>
  );
}


function EditAccountDialog({ user, onDone, departments, jobTitles }: {
  user: UserRow; onDone: () => void; departments: any[]; jobTitles: any[];
}) {
  const [fullName, setFullName] = useState(user.full_name);
  const [departmentId, setDepartmentId] = useState<string | "">(user.department_id ?? "");
  const [jobTitleId, setJobTitleId] = useState<string | "">(user.job_title_id ?? "");
  const [roles, setRoles] = useState<string[]>(user.roles);

  const profileMut = useMutation({
    mutationFn: useServerFn(updateUserProfile),
    onSuccess: () => { toast.success("Đã cập nhật hồ sơ"); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi cập nhật hồ sơ")),
  });
  const rolesMut = useMutation({
    mutationFn: useServerFn(setUserRoles),
    onSuccess: () => { toast.success("Đã cập nhật vai trò"); onDone(); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi cập nhật vai trò")),
  });

  const activeDepartments = departments.filter((d) => d.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const activeTitles = jobTitles.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);

  const handleSave = () => {
    profileMut.mutate({
      data: {
        user_id: user.id,
        full_name: fullName.trim() || user.full_name,
        department_id: departmentId || null,
        job_title_id: jobTitleId || null,
      },
    }, {
      onSuccess: () => {
        rolesMut.mutate({ data: { user_id: user.id, roles: roles as any } });
      },
    });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Sửa tài khoản — {user.email}</DialogTitle>
        <DialogDescription>Thông tin nhân sự và vai trò được lưu riêng biệt. Phòng ban & chức danh không ảnh hưởng phân quyền.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Họ tên</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Phòng ban</label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger><SelectValue placeholder="Chọn phòng ban" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Không chọn —</SelectItem>
                {activeDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Chức danh</label>
            <Select value={jobTitleId} onValueChange={setJobTitleId}>
              <SelectTrigger><SelectValue placeholder="Chọn chức danh" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Không chọn —</SelectItem>
                {activeTitles.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <RoleCheckboxGrid value={roles} onChange={setRoles} />
        <PermissionPreview roles={roles} />
      </div>
      <DialogFooter>
        <Button
          onClick={handleSave}
          disabled={profileMut.isPending || rolesMut.isPending}
        >
          {profileMut.isPending || rolesMut.isPending ? "Đang lưu..." : "Lưu"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}


function InviteDialog({ onDone, departments, jobTitles }: {
  onDone: () => void; departments: any[]; jobTitles: any[];
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [jobTitleId, setJobTitleId] = useState<string>("");
  const mut = useMutation({
    mutationFn: useServerFn(inviteUser),
    onSuccess: () => { toast.success("Đã gửi lời mời qua email"); onDone(); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });
  const activeDepartments = departments.filter((d) => d.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const activeTitles = jobTitles.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Mời thành viên mới</DialogTitle>
        <DialogDescription>Gửi magic link, người dùng tự đặt mật khẩu.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Họ tên (tuỳ chọn)</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Phòng ban (tuỳ chọn)</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger><SelectValue placeholder="Chọn phòng ban" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Không chọn —</SelectItem>
                {activeDepartments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Chức danh (tuỳ chọn)</Label>
            <Select value={jobTitleId} onValueChange={setJobTitleId}>
              <SelectTrigger><SelectValue placeholder="Chọn chức danh" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Không chọn —</SelectItem>
                {activeTitles.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Vai trò</Label>
          <div className="mt-1"><RoleCheckboxGrid value={roles} onChange={setRoles} /></div>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!email || mut.isPending}
          onClick={() => mut.mutate({ data: {
            email,
            full_name: fullName,
            roles: roles as any,
            department_id: departmentId || null,
            job_title_id: jobTitleId || null,
          } })}
        >
          {mut.isPending ? "Đang gửi..." : "Gửi lời mời"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function genTempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = new Uint32Array(12);
  crypto.getRandomValues(rnd);
  return "K@" + Array.from(rnd).map((n) => chars[n % chars.length]).join("") + "1";
}

function CreateUserDialog({ onDone, departments, jobTitles }: {
  onDone: () => void; departments: any[]; jobTitles: any[];
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState(() => genTempPassword());
  const [roles, setRoles] = useState<string[]>([]);
  const [confirmEmail, setConfirmEmail] = useState(true);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [jobTitleId, setJobTitleId] = useState<string>("");

  const mut = useMutation({
    mutationFn: useServerFn(createUserWithPassword),
    onSuccess: (r: any) => {
      toast.success(r.existed ? "Đã cập nhật mật khẩu & quyền" : "Đã tạo tài khoản mới");
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  const activeDepartments = departments.filter((d) => d.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const activeTitles = jobTitles.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Tạo tài khoản + mật khẩu tạm</DialogTitle>
        <DialogDescription>
          Nếu email đã tồn tại, thao tác này sẽ đặt lại mật khẩu và thay bộ vai trò hiện tại.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Họ tên</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Phòng ban (tuỳ chọn)</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger><SelectValue placeholder="Chọn phòng ban" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Không chọn —</SelectItem>
                {activeDepartments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Chức danh (tuỳ chọn)</Label>
            <Select value={jobTitleId} onValueChange={setJobTitleId}>
              <SelectTrigger><SelectValue placeholder="Chọn chức danh" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Không chọn —</SelectItem>
                {activeTitles.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Mật khẩu tạm *</Label>
          <div className="flex gap-2">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
            <Button type="button" variant="outline" onClick={() => setPassword(genTempPassword())}>Tạo mới</Button>
            <Button type="button" variant="ghost" onClick={() => { navigator.clipboard.writeText(password); toast.success("Đã copy"); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Copy và chuyển cho người dùng qua kênh an toàn. Yêu cầu họ đổi mật khẩu ngay khi đăng nhập lần đầu.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={confirmEmail} onCheckedChange={(v) => setConfirmEmail(!!v)} />
          Đánh dấu email đã xác thực (bỏ qua bước confirm)
        </label>
        <div>
          <Label>Vai trò</Label>
          <div className="mt-1"><RoleCheckboxGrid value={roles} onChange={setRoles} /></div>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!email || password.length < 8 || mut.isPending}
          onClick={() =>
            mut.mutate({
              data: {
                email,
                password,
                full_name: fullName,
                roles: roles as any,
                email_confirm: confirmEmail,
                department_id: departmentId || null,
                job_title_id: jobTitleId || null,
              },
            })
          }
        >
          {mut.isPending ? "Đang xử lý..." : "Tạo tài khoản"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function randomPassword(len = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  const bytes = new Uint32Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function SetPasswordDialog({ user, onDone }: { user: UserRow; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [show, setShow] = useState(false);
  const [emailConfirm, setEmailConfirm] = useState(true);
  const [signOutOthers, setSignOutOthers] = useState(true);

  const mut = useMutation({
    mutationFn: useServerFn(setUserPassword),
    onSuccess: () => { toast.success(`Đã đặt mật khẩu mới cho ${user.email}`); onDone(); },
    onError: (e) => toast.error(errorMessage(e, "Lỗi đặt mật khẩu")),
  });

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirmPw.length > 0 && confirmPw !== password;
  const canSubmit = password.length >= 8 && confirmPw === password && !mut.isPending;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Đặt mật khẩu — {user.email}</DialogTitle>
        <DialogDescription>
          Mật khẩu được đổi ngay lập tức. Hãy gửi mật khẩu mới cho người dùng qua kênh an toàn và yêu cầu họ đổi lại sau khi đăng nhập.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <Label>Mật khẩu mới (tối thiểu 8 ký tự)</Label>
          <div className="mt-1 flex gap-2">
            <Input
              type={show ? "text" : "password"}
              value={password}
              maxLength={128}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={() => setShow((s) => !s)}>
              {show ? "Ẩn" : "Hiện"}
            </Button>
            <Button
              type="button"
              variant="outline"
              title="Tạo mật khẩu ngẫu nhiên"
              onClick={() => {
                const p = randomPassword();
                setPassword(p);
                setConfirmPw(p);
                setShow(true);
              }}
            >
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              title="Sao chép"
              disabled={!password}
              onClick={() => {
                navigator.clipboard.writeText(password);
                toast.success("Đã sao chép mật khẩu");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {tooShort && <p className="mt-1 text-xs text-destructive">Mật khẩu tối thiểu 8 ký tự.</p>}
        </div>

        <div>
          <Label>Nhập lại mật khẩu</Label>
          <Input
            className="mt-1"
            type={show ? "text" : "password"}
            value={confirmPw}
            maxLength={128}
            autoComplete="new-password"
            onChange={(e) => setConfirmPw(e.target.value)}
          />
          {mismatch && <p className="mt-1 text-xs text-destructive">Hai mật khẩu chưa khớp.</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={emailConfirm} onCheckedChange={(v) => setEmailConfirm(!!v)} />
          Xác minh email luôn (cho phép đăng nhập ngay)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={signOutOthers} onCheckedChange={(v) => setSignOutOthers(!!v)} />
          Đăng xuất tất cả phiên đang mở của tài khoản này
        </label>
      </div>

      <DialogFooter>
        <Button
          disabled={!canSubmit}
          onClick={() =>
            mut.mutate({
              data: {
                user_id: user.id,
                password,
                email_confirm: emailConfirm,
                sign_out_other_sessions: signOutOthers,
              },
            })
          }
        >
          {mut.isPending ? "Đang lưu..." : "Đặt mật khẩu"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}


/** Ma trận Vai trò × Quyền — tick ô là lưu ngay, áp dụng cho mọi tài khoản mang vai trò đó. */
function RolePermissionMatrix() {
  const qc = useQueryClient();
  const fetchMatrix = useServerFn(getRolePermissionMatrix);
  const saveCell = useServerFn(setRolePermission);
  const resetFn = useServerFn(resetRolePermissions);

  const { data, isLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: () => fetchMatrix() as Promise<{
      effective: Record<string, Permission[]>;
      defaults: Record<string, Permission[]>;
      customizedRoles: string[];
    }>,
  });

  const mutate = useMutation({
    mutationFn: (v: { role: string; permission: Permission; enabled: boolean }) =>
      saveCell({ data: v as any }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["role-permissions"] });
      const prev = qc.getQueryData(["role-permissions"]) as any;
      if (prev) {
        const next = { ...prev, effective: { ...prev.effective } };
        const list = new Set<Permission>(next.effective[v.role] ?? []);
        if (v.enabled) list.add(v.permission); else list.delete(v.permission);
        next.effective[v.role] = [...list];
        qc.setQueryData(["role-permissions"], next);
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["role-permissions"], ctx.prev);
      toast.error(errorMessage(e));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-roles"] });
    },
  });

  const doReset = async (role?: string) => {
    try {
      await resetFn({ data: { role } as any });
      qc.invalidateQueries({ queryKey: ["role-permissions"] });
      qc.invalidateQueries({ queryKey: ["my-roles"] });
      toast.success("Đã đặt lại về mặc định hệ thống.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const roles = ROLE_CATALOG;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Tick chọn để cấp quyền cho từng vai trò. Thay đổi áp dụng ngay cho mọi tài khoản mang vai trò đó.
          Vai trò <strong>Quản trị viên</strong> luôn có toàn quyền.
        </p>
        <Button variant="outline" size="sm" onClick={() => doReset(undefined)}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Đặt lại toàn bộ về mặc định
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-10 min-w-[260px] bg-muted/50 px-4 py-3 text-left uppercase text-muted-foreground">
                Quyền
              </th>
              {roles.map((r) => (
                <th key={r.key} className="border-l px-2 py-3 align-bottom">
                  <div className="mx-auto h-32 whitespace-nowrap text-left font-medium [writing-mode:vertical-rl] [transform:rotate(180deg)]" title={r.description}>
                    {r.label}
                  </div>
                </th>
              ))}
              <th className="w-12 border-l" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={roles.length + 2} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
            )}
            {!isLoading && PERMISSION_GROUPS.map((group) => (
              <Fragment key={group.label}>
                <tr className="bg-muted/30">
                  <td colSpan={roles.length + 2} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </td>
                </tr>
                {group.items.map((perm) => (
                  <tr key={perm} className="hover:bg-muted/20">
                    <td className="sticky left-0 z-10 bg-card px-4 py-2">
                      <div className="font-medium">{PERMISSION_LABEL[perm]}</div>
                      <div className="text-[10px] text-muted-foreground">{perm}</div>
                    </td>
                    {roles.map((r) => {
                      const isAdminRole = r.key === "admin";
                      const on = isAdminRole || !!data?.effective?.[r.key]?.includes(perm);
                      const isDefault = isAdminRole || (data?.defaults?.[r.key] ?? []).includes(perm) === on;
                      return (
                        <td key={r.key} className="border-l px-2 py-2 text-center">
                          <span className="relative inline-flex">
                            <Checkbox
                              checked={on}
                              disabled={isAdminRole || mutate.isPending}
                              onCheckedChange={(v) =>
                                mutate.mutate({ role: r.key, permission: perm, enabled: !!v })
                              }
                              aria-label={`${r.label} — ${PERMISSION_LABEL[perm]}`}
                            />
                            {!isDefault && (
                              <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-amber-500" title="Khác mặc định hệ thống" />
                            )}
                          </span>
                        </td>
                      );
                    })}
                    <td className="border-l" />
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.filter((r) => r.key !== "admin" && data?.customizedRoles?.includes(r.key)).map((r) => (
          <Button key={r.key} variant="ghost" size="sm" onClick={() => doReset(r.key)}>
            <RotateCcw className="mr-1 h-3 w-3" /> Đặt lại: {r.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
