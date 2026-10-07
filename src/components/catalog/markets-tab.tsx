import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMarkets, upsertMarket, deleteMarket } from "@/lib/catalog/markets.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errors";
import { Globe2, Plus, Trash2, Star } from "lucide-react";

const EMPTY = {
  slug: "", name: "", flag: "", region: "asia" as "asia" | "europe",
  tagline: "", description: "", highlights: [] as string[],
  sort_order: 0, is_active: true, is_featured: false,
};

/** Tab Thị trường — nội dung dùng chung cho trang chủ, du học và XKLĐ. */
export function MarketsTab({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listMarkets);
  const saveFn = useServerFn(upsertMarket);
  const delFn = useServerFn(deleteMarket);
  const [editing, setEditing] = useState<any | null>(null);

  const q = useQuery({ queryKey: ["catalog-markets"], queryFn: () => listFn() });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["catalog-markets"] });
    qc.invalidateQueries({ queryKey: ["public-markets"] });
  };

  const save = useMutation({
    mutationFn: (v: any) => saveFn({ data: v }),
    onSuccess: () => { toast.success("Đã lưu thị trường"); setEditing(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rows = (q.data ?? []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="text-sm">
          <p className="flex items-center gap-2 font-semibold"><Globe2 className="h-4 w-4" /> Thị trường</p>
          <p className="text-muted-foreground">
            {rows.length} thị trường — chỉnh tên, cờ, khu vực, mô tả, thứ tự và đánh dấu nổi bật trang chủ.
            Đường dẫn (slug) nên giữ nguyên để không hỏng liên kết đã có.
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
            <Plus className="mr-1 h-4 w-4" /> Thêm thị trường
          </Button>
        )}
      </div>

      {q.isLoading && <p className="text-sm text-muted-foreground">Đang tải danh mục...</p>}

      {editing && (
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Tên thị trường" value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Đường dẫn (slug)" value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <Input placeholder="Cờ (emoji)" value={editing.flag ?? ""}
              onChange={(e) => setEditing({ ...editing, flag: e.target.value })} />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={editing.region}
              onChange={(e) => setEditing({ ...editing, region: e.target.value })}>
              <option value="asia">Châu Á</option>
              <option value="europe">Châu Âu</option>
            </select>
          </div>
          <Input placeholder="Mô tả ngắn (tagline)" value={editing.tagline ?? ""}
            onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} />
          <Textarea rows={3} placeholder="Mô tả" value={editing.description ?? ""}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <Textarea rows={4} placeholder="Điểm nổi bật — mỗi dòng một ý"
            value={(editing.highlights ?? []).join("\n")}
            onChange={(e) => setEditing({ ...editing, highlights: e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean) })} />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              Thứ tự
              <Input type="number" className="w-24" value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Đang bật
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editing.is_featured}
                onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} /> Nổi bật trang chủ
            </label>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Huỷ</Button>
              <Button size="sm" disabled={save.isPending} onClick={() => save.mutate(editing)}>Lưu</Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Thị trường</th>
              <th className="p-3">Đường dẫn</th>
              <th className="p-3">Khu vực</th>
              <th className="p-3">Thứ tự</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3">
                  <span className="mr-2 text-lg">{m.flag}</span>
                  <span className="font-medium">{m.name}</span>
                  {m.is_featured && <Star className="ml-1 inline h-3.5 w-3.5 text-amber-500" />}
                  <p className="text-xs text-muted-foreground">{m.tagline}</p>
                </td>
                <td className="p-3 text-muted-foreground">{m.slug}</td>
                <td className="p-3">{m.region === "europe" ? "Châu Âu" : "Châu Á"}</td>
                <td className="p-3">{m.sort_order}</td>
                <td className="p-3">{m.is_active ? "Đang bật" : "Đã tắt"}</td>
                <td className="p-3 text-right">
                  {canManage && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing({ ...m, highlights: m.highlights ?? [] })}>Sửa</Button>
                      <Button variant="outline" size="sm" onClick={() => { if (confirm(`Xoá thị trường ${m.name}?`)) remove.mutate(m.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && !q.isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Chưa có thị trường nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
