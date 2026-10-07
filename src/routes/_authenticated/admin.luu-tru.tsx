import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  canManageArchive,
  listArchiveLocations,
  upsertArchiveLocation,
} from "@/lib/students/archive.functions";
import { ArchivePanel, locationLabel } from "@/components/students/archive-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Archive, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/luu-tru")({
  head: () => ({ meta: [
    { title: "Kho hồ sơ giấy — KAIZEN" },
    { name: "description", content: "Tra cứu vị trí, in tem và bảng kiểm hồ sơ giấy KAIZEN." },
    { property: "og:title", content: "Kho hồ sơ giấy — KAIZEN" },
    { property: "og:description", content: "Tra cứu vị trí, in tem và bảng kiểm hồ sơ giấy KAIZEN." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ArchiveLibraryPage,
});

function ArchiveLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="h-6 w-6 text-primary" /> Thư viện lưu trữ hồ sơ vật lý
        </h1>
        <p className="text-sm text-muted-foreground">
          Ghi nhận vị trí cất giữ hồ sơ giấy ngoài đời thực (kho · phòng · tủ · kệ · hộp) để tra cứu
          và rút hồ sơ nhanh khi cần.
        </p>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Tra cứu hồ sơ</TabsTrigger>
          <TabsTrigger value="locations">Vị trí kho</TabsTrigger>
        </TabsList>
        <TabsContent value="records" className="pt-4">
          <ArchivePanel showSearch />
        </TabsContent>
        <TabsContent value="locations" className="pt-4">
          <LocationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LocationsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listArchiveLocations);
  const saveFn = useServerFn(upsertArchiveLocation);
  const permFn = useServerFn(canManageArchive);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const perm = useQuery({ queryKey: ["archive-perm"], queryFn: () => permFn({ data: {} as never }) });
  const q = useQuery({
    queryKey: ["archive-locations"],
    queryFn: () => listFn({ data: {} as never }),
  });
  const mut = useMutation({
    mutationFn: (payload: any) => saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("Đã lưu vị trí kho");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["archive-locations"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không lưu được")),
  });

  const items = (q.data?.items ?? []) as any[];
  const canWrite = perm.data?.canWrite === true;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{items.length} vị trí</Badge>
        {canWrite && (
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="ml-auto">
                <Plus className="h-4 w-4 mr-1" /> Thêm vị trí kho
              </Button>
            </DialogTrigger>
            <LocationDialog
              key={editing?.id ?? "new"}
              location={editing}
              saving={mut.isPending}
              onSubmit={(p) => mut.mutate(p)}
            />
          </Dialog>
        )}
      </div>

      <div className="rounded-lg border overflow-x-auto bg-card">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Tên vị trí</th>
              <th className="px-3 py-2">Chi tiết</th>
              <th className="px-3 py-2">Đang chứa</th>
              <th className="px-3 py-2">Sức chứa</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Đang tải…
                </td>
              </tr>
            )}
            {!q.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Chưa khai báo vị trí kho nào.
                </td>
              </tr>
            )}
            {items.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{l.code}</td>
                <td className="px-3 py-2 font-medium">{l.name}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{locationLabel(l)}</td>
                <td className="px-3 py-2">{l.used}</td>
                <td className="px-3 py-2">{l.capacity ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge variant={l.is_active ? "outline" : "secondary"}>
                    {l.is_active ? "Đang dùng" : "Ngừng dùng"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right">
                  {canWrite ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(l);
                        setOpen(true);
                      }}
                    >
                      Sửa
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Chỉ xem</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LocationDialog({
  location,
  saving,
  onSubmit,
}: {
  location: any;
  saving: boolean;
  onSubmit: (p: any) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({
    code: location?.code ?? "",
    name: location?.name ?? "",
    warehouse: location?.warehouse ?? "",
    room: location?.room ?? "",
    cabinet: location?.cabinet ?? "",
    shelf: location?.shelf ?? "",
    box: location?.box ?? "",
    capacity: location?.capacity ? String(location.capacity) : "",
    note: location?.note ?? "",
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const FIELDS: Array<[string, string]> = [
    ["code", "Mã vị trí *"],
    ["name", "Tên vị trí *"],
    ["warehouse", "Kho"],
    ["room", "Phòng"],
    ["cabinet", "Tủ"],
    ["shelf", "Kệ"],
    ["box", "Hộp / thùng"],
    ["capacity", "Sức chứa (bộ hồ sơ)"],
    ["note", "Ghi chú"],
  ];

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{location ? "Cập nhật vị trí kho" : "Thêm vị trí kho"}</DialogTitle>
      </DialogHeader>
      <div className="grid sm:grid-cols-2 gap-3">
        {FIELDS.map(([k, label]) => (
          <div key={k} className={k === "note" ? "sm:col-span-2" : ""}>
            <Label>{label}</Label>
            <Input
              type={k === "capacity" ? "number" : "text"}
              value={f[k] ?? ""}
              onChange={(e) => set(k, e.target.value)}
            />
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button
          disabled={saving}
          onClick={() => {
            if (!f['code']?.trim() || !f['name']?.trim())
              return toast.error("Nhập mã và tên vị trí kho");
            onSubmit({
              ...(location?.id ? { id: location.id } : {}),
              code: f['code'].trim(),
              name: f['name'].trim(),
              warehouse: f['warehouse'] || null,
              room: f['room'] || null,
              cabinet: f['cabinet'] || null,
              shelf: f['shelf'] || null,
              box: f['box'] || null,
              capacity: f['capacity'] ? Number(f['capacity']) : null,
              note: f['note'] || null,
            });
          }}
        >
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Lưu
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
