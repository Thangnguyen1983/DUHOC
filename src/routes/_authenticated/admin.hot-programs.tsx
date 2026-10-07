import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Plane,
  Languages,
  Globe2,
  Handshake,
  Building2,
  Users,
  MapPin,
  ShieldCheck,
  Award,
  Pencil,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";
import {
  listAllHotPrograms,
  createHotProgram,
  updateHotProgram,
  deleteHotProgram,
  reorderHotPrograms,
  HOT_PROGRAM_ICONS,
  type HotProgram,
  type HotProgramIcon,
} from "@/lib/hot-programs.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/hot-programs")({
  component: AdminHotPrograms,
});

const ICON_MAP: Record<HotProgramIcon, LucideIcon> = {
  Sparkles,
  GraduationCap,
  Briefcase,
  Plane,
  Languages,
  Globe2,
  Handshake,
  Building2,
  Users,
  MapPin,
  ShieldCheck,
  Award,
};

type FormState = {
  id?: string;
  title: string;
  href: string;
  badge: string;
  icon: HotProgramIcon;
  active: boolean;
};

const EMPTY: FormState = {
  title: "",
  href: "/",
  badge: "",
  icon: "Sparkles",
  active: true,
};

function AdminHotPrograms() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAllHotPrograms);
  const create = useServerFn(createHotProgram);
  const update = useServerFn(updateHotProgram);
  const remove = useServerFn(deleteHotProgram);
  const reorder = useServerFn(reorderHotPrograms);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "hot-programs"],
    queryFn: () => fetchAll(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin", "hot-programs"] });
    qc.invalidateQueries({ queryKey: ["hot-programs", "active"] });
  }

  const createMut = useMutation({
    mutationFn: (payload: FormState) =>
      create({
        data: {
          title: payload.title,
          href: payload.href,
          badge: payload.badge,
          icon: payload.icon,
          active: payload.active,
        },
      }),
    onSuccess: () => {
      toast.success("Đã thêm chương trình");
      setOpen(false);
      setForm(EMPTY);
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const updateMut = useMutation({
    mutationFn: (payload: FormState & { id: string }) =>
      update({
        data: {
          id: payload.id,
          title: payload.title,
          href: payload.href,
          badge: payload.badge,
          icon: payload.icon,
          active: payload.active,
        },
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật");
      setOpen(false);
      setForm(EMPTY);
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => reorder({ data: { ids } }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const toggleActiveMut = useMutation({
    mutationFn: (row: HotProgram) =>
      update({
        data: {
          id: row.id,
          title: row.title,
          href: row.href,
          badge: row.badge,
          icon: row.icon,
          active: !row.active,
        },
      }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  function openCreate() {
    setForm(EMPTY);
    setOpen(true);
  }
  function openEdit(row: HotProgram) {
    setForm({
      id: row.id,
      title: row.title,
      href: row.href,
      badge: row.badge ?? "",
      icon: row.icon,
      active: row.active,
    });
    setOpen(true);
  }

  function move(idx: number, dir: -1 | 1) {
    if (!data) return;
    const next = [...data];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorderMut.mutate(next.map((r) => r.id));
  }

  function submit() {
    if (form.id) updateMut.mutate(form as FormState & { id: string });
    else createMut.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Chương trình hot</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý dải băng chạy dưới hero trang chủ.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Thêm chương trình
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {form.id ? "Sửa chương trình" : "Thêm chương trình"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <Field label="Tên chương trình">
                <Input
                  value={form.title}
                  maxLength={80}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Vd: Kỹ sư Nhật Bản"
                />
              </Field>
              <Field label="Đường dẫn (bắt đầu bằng /)">
                <Input
                  value={form.href}
                  maxLength={200}
                  onChange={(e) => setForm({ ...form, href: e.target.value })}
                  placeholder="/xkld/nhat-ban"
                />
              </Field>
              <Field label="Nhãn (tuỳ chọn)">
                <Input
                  value={form.badge}
                  maxLength={16}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="HOT / Mới"
                />
              </Field>
              <Field label="Icon">
                <Select
                  value={form.icon}
                  onValueChange={(v) =>
                    setForm({ ...form, icon: v as HotProgramIcon })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOT_PROGRAM_ICONS.map((name) => {
                      const Icon = ICON_MAP[name];
                      return (
                        <SelectItem key={name} value={name}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
                <Label>Hiển thị công khai</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Huỷ
              </Button>
              <Button
                onClick={submit}
                disabled={createMut.isPending || updateMut.isPending}
              >
                {form.id ? "Lưu" : "Thêm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chưa có chương trình nào.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 w-24">Thứ tự</th>
                <th className="px-3 py-2">Chương trình</th>
                <th className="px-3 py-2">Đường dẫn</th>
                <th className="px-3 py-2">Nhãn</th>
                <th className="px-3 py-2">Hiển thị</th>
                <th className="px-3 py-2 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const Icon = ICON_MAP[row.icon] ?? Sparkles;
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => move(idx, 1)}
                          disabled={idx === data.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 font-medium">
                        <Icon className="h-4 w-4 text-primary" />
                        {row.title}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.href}
                    </td>
                    <td className="px-3 py-2">
                      {row.badge && (
                        <span className="inline-flex items-center bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                          {row.badge}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Switch
                        checked={row.active}
                        onCheckedChange={() => toggleActiveMut.mutate(row)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Xoá "${row.title}"?`))
                            deleteMut.mutate(row.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
