import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCatalogs,
  upsertLanguage, deleteLanguage,
  upsertDocumentType, deleteDocumentType,
  upsertStage, deleteStage,
} from "@/lib/catalog/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Library, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GeoTab } from "@/components/catalog/geo-tab";
import { MarketsTab } from "@/components/catalog/markets-tab";
import { OrgTab } from "@/components/catalog/org-tab";
import { OrientationTab } from "@/components/catalog/orientation-tab";
import { useMyAccess } from "@/lib/rbac/use-access";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/catalog")({ component: Page });

type Tab = "geo" | "markets" | "org" | "languages" | "docs" | "stages" | "orientation";

function Page() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getCatalogs);
  const { can } = useMyAccess();
  const [tab, setTab] = useState<Tab>("geo");
  const q = useQuery({ queryKey: ["catalogs"], queryFn: () => fetchAll() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["catalogs"] });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Library className="h-6 w-6" /> Danh mục hệ thống</h1>
        <p className="text-sm text-muted-foreground">Địa danh hành chính, thị trường, phòng ban & chức danh, ngoại ngữ đào tạo, loại hồ sơ theo thị trường và giai đoạn đào tạo.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="h-auto flex-wrap">
          {([["geo", "Địa danh"], ["markets", "Thị trường"], ["org", "Phòng ban & chức danh"], ["languages", "Ngoại ngữ"], ["docs", "Loại hồ sơ"], ["stages", "Giai đoạn đào tạo"], ["orientation", "Giáo dục định hướng"]] as [Tab, string][]).map(([k, label]) => (
            <TabsTrigger key={k} value={k}>{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab !== "geo" && tab !== "markets" && tab !== "orientation" && q.isLoading && <p className="text-sm text-muted-foreground">Đang tải danh mục...</p>}
      {tab !== "geo" && tab !== "markets" && tab !== "orientation" && q.error && <p className="text-sm text-destructive">{(q.error as any).message}</p>}

      {tab === "markets" && <MarketsTab canManage={can("catalog.manage")} />}
      {tab === "org" && <OrgTab canManage={can("catalog.manage")} />}
      {tab === "orientation" && <OrientationTab canManage={can("catalog.manage")} />}
      {tab === "geo" && <GeoTab canManage={can("catalog.manage")} canSync={can("catalog.geo.manage")} />}
      {tab === "languages" && <LanguagesTab items={q.data?.languages ?? []} onDone={invalidate} />}
      {tab === "docs" && <DocTypesTab items={q.data?.documentTypes ?? []} onDone={invalidate} />}
      {tab === "stages" && <StagesTab items={q.data?.stages ?? []} onDone={invalidate} />}
    </div>
  );
}

function useCrud(saveFn: any, delFn: any, onDone: () => void, setEditing: (v: any) => void) {
  const save = useServerFn(saveFn);
  const remove = useServerFn(delFn);
  const saveMut = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); onDone(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); onDone(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  return { saveMut, delMut };
}

function LanguagesTab({ items, onDone }: { items: any[]; onDone: () => void }) {
  const [editing, setEditing] = useState<any | null>(null);
  const { saveMut, delMut } = useCrud(upsertLanguage, deleteLanguage, onDone, setEditing);

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({ slug: "", name: "", flag: "", tagline: "", description: "", levels: [], sort_order: items.length + 1, is_active: true })}>
        <Plus className="mr-1 h-4 w-4" /> Thêm ngoại ngữ
      </Button>

      {editing && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Tên (VD: Tiếng Nhật)" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Slug (VD: tieng-nhat)" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <Input placeholder="Cờ (emoji)" value={editing.flag ?? ""} onChange={(e) => setEditing({ ...editing, flag: e.target.value })} />
            <Input placeholder="Mô tả ngắn" value={editing.tagline ?? ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} />
            <Input placeholder="Cấp độ, cách nhau bởi dấu phẩy (N5,N4,N3)" value={(editing.levels ?? []).join(",")} onChange={(e) => setEditing({ ...editing, levels: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            <Input type="number" placeholder="Thứ tự" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <Textarea placeholder="Mô tả chi tiết" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Đang hiển thị
          </label>
          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate(editing)} disabled={saveMut.isPending}>Lưu</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left"><tr><th className="p-3">Ngoại ngữ</th><th className="p-3">Slug</th><th className="p-3">Cấp độ</th><th className="p-3">Trạng thái</th><th /></tr></thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3 font-medium">{l.flag} {l.name}<div className="text-xs text-muted-foreground">{l.tagline}</div></td>
                <td className="p-3 font-mono text-xs">{l.slug}</td>
                <td className="p-3 text-xs">{(l.levels ?? []).join(", ") || "—"}</td>
                <td className="p-3 text-xs">{l.is_active ? "Đang bật" : "Đã ẩn"}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(l)}>Sửa</Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Xoá ngoại ngữ này?") && delMut.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Chưa có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocTypesTab({ items, onDone }: { items: any[]; onDone: () => void }) {
  const [editing, setEditing] = useState<any | null>(null);
  const { saveMut, delMut } = useCrud(upsertDocumentType, deleteDocumentType, onDone, setEditing);

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({ code: "", name: "", market: "", description: "", is_required: true, sort_order: items.length + 1, is_active: true, program_type: "", stage: "dang_ky", default_validity_months: "" })}>
        <Plus className="mr-1 h-4 w-4" /> Thêm loại hồ sơ
      </Button>

      {editing && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Tên hồ sơ" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Mã (VD: ho_chieu)" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
            <Input placeholder="Thị trường (để trống = áp dụng chung)" value={editing.market ?? ""} onChange={(e) => setEditing({ ...editing, market: e.target.value })} />
            <Input type="number" placeholder="Thứ tự" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-muted-foreground">
              Loại chương trình
              <select
                className="mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm text-foreground"
                value={editing.program_type ?? ""}
                onChange={(e) => setEditing({ ...editing, program_type: e.target.value })}
              >
                <option value="">Áp dụng mọi chương trình</option>
                <option value="du_hoc">Du học</option>
                <option value="xkld">XKLĐ</option>
                <option value="thuc_tap_sinh">Thực tập sinh</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Giai đoạn hồ sơ
              <select
                className="mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm text-foreground"
                value={editing.stage ?? "dang_ky"}
                onChange={(e) => setEditing({ ...editing, stage: e.target.value })}
              >
                <option value="dang_ky">Đăng ký</option>
                <option value="dao_tao">Đào tạo</option>
                <option value="visa">Visa</option>
                <option value="xuat_canh">Xuất cảnh</option>
                <option value="sau_xuat_canh">Sau xuất cảnh</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Số tháng hiệu lực mặc định
              <Input
                className="mt-1"
                type="number"
                placeholder="VD: 6"
                value={editing.default_validity_months ?? ""}
                onChange={(e) => setEditing({ ...editing, default_validity_months: e.target.value })}
              />
            </label>
          </div>
          <Textarea placeholder="Hướng dẫn chuẩn bị hồ sơ" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_required} onChange={(e) => setEditing({ ...editing, is_required: e.target.checked })} /> Bắt buộc</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Đang dùng</label>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                saveMut.mutate({
                  ...editing,
                  program_type: editing.program_type || null,
                  stage: editing.stage || "dang_ky",
                  default_validity_months:
                    editing.default_validity_months === "" || editing.default_validity_months == null
                      ? null
                      : Number(editing.default_validity_months),
                })
              }
              disabled={saveMut.isPending}
            >
              Lưu
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left"><tr><th className="p-3">Hồ sơ</th><th className="p-3">Mã</th><th className="p-3">Thị trường</th><th className="p-3">Chương trình</th><th className="p-3">Giai đoạn</th><th className="p-3">Bắt buộc</th><th /></tr></thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3 font-medium">{d.name}<div className="text-xs text-muted-foreground">{d.description}</div></td>
                <td className="p-3 font-mono text-xs">{d.code}</td>
                <td className="p-3 text-xs">{d.market ?? "Chung"}</td>
                <td className="p-3 text-xs">
                  {d.program_type === "du_hoc" ? "Du học" : d.program_type === "xkld" ? "XKLĐ" : d.program_type === "thuc_tap_sinh" ? "Thực tập sinh" : "Mọi loại"}
                </td>
                <td className="p-3 text-xs">
                  {{ dang_ky: "Đăng ký", dao_tao: "Đào tạo", visa: "Visa", xuat_canh: "Xuất cảnh", sau_xuat_canh: "Sau xuất cảnh" }[(d.stage ?? "dang_ky") as string]}
                  {d.default_validity_months ? ` · ${d.default_validity_months} tháng` : ""}
                </td>
                <td className="p-3 text-xs">{d.is_required ? "Có" : "Không"}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(d)}>Sửa</Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Xoá loại hồ sơ này?") && delMut.mutate(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Chưa có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StagesTab({ items, onDone }: { items: any[]; onDone: () => void }) {
  const [editing, setEditing] = useState<any | null>(null);
  const { saveMut, delMut } = useCrud(upsertStage, deleteStage, onDone, setEditing);

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({ code: "", name: "", description: "", order_index: items.length + 1, is_active: true })}>
        <Plus className="mr-1 h-4 w-4" /> Thêm giai đoạn
      </Button>

      {editing && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="Tên giai đoạn" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Mã (VD: so_cap)" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
            <Input type="number" placeholder="Thứ tự" value={editing.order_index} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} />
          </div>
          <Textarea placeholder="Mô tả nội dung giai đoạn" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Đang dùng
          </label>
          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate(editing)} disabled={saveMut.isPending}>Lưu</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left"><tr><th className="p-3">#</th><th className="p-3">Giai đoạn</th><th className="p-3">Mã</th><th /></tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 text-xs">{s.order_index}</td>
                <td className="p-3 font-medium">{s.name}<div className="text-xs text-muted-foreground">{s.description}</div></td>
                <td className="p-3 font-mono text-xs">{s.code}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>Sửa</Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Xoá giai đoạn này?") && delMut.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Chưa có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
