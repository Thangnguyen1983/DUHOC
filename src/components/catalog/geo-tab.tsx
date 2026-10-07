import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProvinces, listWards, upsertProvince, upsertWard, setGeoActive, syncStandardGeo, getGeoSyncStatus,
} from "@/lib/catalog/geo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errors";
import { MapPin, RefreshCw, Plus } from "lucide-react";

/** Tab Địa danh hành chính (Tỉnh/Thành phố → Xã/Phường, mô hình 2 cấp). */
export function GeoTab({ canManage, canSync }: { canManage: boolean; canSync: boolean }) {
  const qc = useQueryClient();
  const provFn = useServerFn(listProvinces);
  const wardFn = useServerFn(listWards);
  const saveProvFn = useServerFn(upsertProvince);
  const saveWardFn = useServerFn(upsertWard);
  const toggleFn = useServerFn(setGeoActive);
  const syncFn = useServerFn(syncStandardGeo);
  const syncStatusFn = useServerFn(getGeoSyncStatus);

  const [selected, setSelected] = useState<string | null>(null);
  const [provSearch, setProvSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  const provinces = useQuery({ queryKey: ["geo-provinces"], queryFn: () => provFn() });
  const wards = useQuery({
    queryKey: ["geo-wards", selected],
    queryFn: () => wardFn({ data: { provinceCode: selected! } }),
    enabled: !!selected,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["geo-provinces"] });
    qc.invalidateQueries({ queryKey: ["geo-wards"] });
    qc.invalidateQueries({ queryKey: ["geo-sync-status"] });
  };

  const sync = useMutation({
    mutationFn: () => syncFn(),
    onSuccess: (r: any) => {
      toast.success(`Đã cập nhật ${r.provinces} tỉnh/thành và ${r.wards} xã/phường theo danh sách chuẩn`);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: (v: { kind: "province" | "ward"; id: string; is_active: boolean }) => toggleFn({ data: v }),
    onSuccess: () => { toast.success("Đã cập nhật"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const save = useMutation({
    mutationFn: (v: any) =>
      v.kind === "province"
        ? saveProvFn({ data: { ...v, kind: undefined } as any })
        : saveWardFn({ data: { ...v, kind: undefined } as any }),
    onSuccess: () => { toast.success("Đã lưu"); setEditing(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const provList = useMemo(
    () => (provinces.data ?? []).filter((p: any) =>
      !provSearch || p.name.toLowerCase().includes(provSearch.toLowerCase())),
    [provinces.data, provSearch],
  );
  const wardList = useMemo(
    () => (wards.data ?? []).filter((w: any) =>
      !wardSearch || w.name.toLowerCase().includes(wardSearch.toLowerCase())),
    [wards.data, wardSearch],
  );

  const syncLogs = useQuery({ queryKey: ["geo-sync-status"], queryFn: () => syncStatusFn() });
  const last = (syncLogs.data ?? [])[0] as any | undefined;
  const lastSync = last?.started_at ?? (provinces.data ?? []).find((p: any) => p.synced_at)?.synced_at;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4 text-primary" /> Địa danh hành chính (2 cấp: Tỉnh/Thành phố → Xã/Phường)
          </div>
          <div className="text-xs text-muted-foreground">
            {(provinces.data ?? []).length} tỉnh/thành
            {lastSync ? ` • đồng bộ gần nhất: ${new Date(lastSync).toLocaleString("vi-VN")}` : ""}
            {last?.status === "success" && ` (${last.trigger_source === "cron" ? "tự động" : "thủ công"}, ${last.provinces_count} tỉnh / ${last.wards_count} xã)`}
            {last?.status === "error" && <span className="text-destructive"> — lỗi: {last.error}</span>}
            {last?.status === "running" && " — đang chạy…"}
          </div>
          <div className="text-xs text-muted-foreground">
            Hệ thống tự cập nhật danh sách chuẩn mỗi tuần (Chủ nhật 2h sáng); phần đã chỉnh tay không bị ghi đè.
          </div>
        </div>
        {canSync && (
          <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
            {sync.isPending ? "Đang cập nhật…" : "Cập nhật danh sách chuẩn"}
          </Button>
        )}
      </div>

      {editing && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="text-sm font-semibold">
            {editing.kind === "province" ? "Tỉnh / Thành phố" : "Xã / Phường"}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="Tên" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Mã" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
            <Input placeholder="Loại (tỉnh, phường, xã…)" value={editing.division_type ?? ""} onChange={(e) => setEditing({ ...editing, division_type: e.target.value })} />
          </div>
          <Input placeholder="Ghi chú gộp / đổi tên (nếu có)" value={editing.merged_note ?? ""} onChange={(e) => setEditing({ ...editing, merged_note: e.target.value })} />
          <div className="flex gap-2">
            <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>Lưu</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Tỉnh / Thành phố */}
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center gap-2 border-b p-3">
            <Input placeholder="Tìm tỉnh / thành phố" value={provSearch} onChange={(e) => setProvSearch(e.target.value)} />
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => setEditing({ kind: "province", code: "", name: "", division_type: "tỉnh", sort_order: 999, is_active: true })}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {provinces.isLoading && <p className="p-4 text-sm text-muted-foreground">Đang tải…</p>}
            {provList.map((p: any) => (
              <div
                key={p.code}
                onClick={() => { setSelected(p.code); setWardSearch(""); }}
                className={`flex cursor-pointer items-center justify-between gap-2 border-t px-3 py-2 text-sm hover:bg-muted/40 ${selected === p.code ? "bg-primary/10 font-semibold" : ""}`}
              >
                <span className={p.is_active ? "" : "text-muted-foreground line-through"}>{p.name}</span>
                {canManage && (
                  <span className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing({ ...p, kind: "province" }); }}>Sửa</Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); toggle.mutate({ kind: "province", id: p.id, is_active: !p.is_active }); }}>
                      {p.is_active ? "Ẩn" : "Hiện"}
                    </Button>
                  </span>
                )}
              </div>
            ))}
            {!provinces.isLoading && provList.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Không tìm thấy.</p>
            )}
          </div>
        </div>

        {/* Xã / Phường */}
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center gap-2 border-b p-3">
            <Input placeholder="Tìm xã / phường" value={wardSearch} onChange={(e) => setWardSearch(e.target.value)} disabled={!selected} />
            <div className="whitespace-nowrap text-xs text-muted-foreground">{wardList.length} đơn vị</div>
            {canManage && selected && (
              <Button size="sm" variant="outline" onClick={() => setEditing({ kind: "ward", code: "", name: "", province_code: selected, division_type: "phường", sort_order: 999, is_active: true })}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {!selected && <p className="p-6 text-sm text-muted-foreground">Chọn một tỉnh/thành phố để xem danh sách xã/phường.</p>}
            {selected && wards.isLoading && <p className="p-4 text-sm text-muted-foreground">Đang tải…</p>}
            {wardList.map((w: any) => (
              <div key={w.code} className="flex items-center justify-between gap-2 border-t px-3 py-2 text-sm">
                <span>
                  <span className={w.is_active ? "" : "text-muted-foreground line-through"}>{w.name}</span>
                  {w.merged_note && <span className="ml-2 text-xs text-muted-foreground">({w.merged_note})</span>}
                </span>
                {canManage && (
                  <span className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...w, kind: "ward" })}>Sửa</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ kind: "ward", id: w.id, is_active: !w.is_active })}>
                      {w.is_active ? "Ẩn" : "Hiện"}
                    </Button>
                  </span>
                )}
              </div>
            ))}
            {selected && !wards.isLoading && wardList.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Không tìm thấy.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
