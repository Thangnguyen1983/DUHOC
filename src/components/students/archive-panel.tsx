import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ARCHIVE_STATUS,
  archiveRecordAction,
  canManageArchive,
  listArchiveLocations,
  listArchiveRecords,
  upsertArchiveRecord,
} from "@/lib/students/archive.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Archive, Boxes, Loader2, PackageOpen, Plus, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { StudentPicker, type PickedStudent } from "@/components/students/student-picker";
import { errorMessage } from "@/lib/errors";
import { ArchivePrint } from "@/components/students/archive-print";

export function locationLabel(l: any): string {
  if (!l) return "Chưa xếp vị trí";
  const parts = [
    l.warehouse && `Kho ${l.warehouse}`,
    l.room && `Phòng ${l.room}`,
    l.cabinet && `Tủ ${l.cabinet}`,
    l.shelf && `Kệ ${l.shelf}`,
    l.box && `Hộp ${l.box}`,
  ].filter(Boolean);
  return `${l.code} — ${l.name}${parts.length ? ` · ${parts.join(" · ")}` : ""}`;
}

const STATUS_CLASS: Record<string, string> = {
  stored: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  borrowed: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  returned: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  removed: "bg-muted text-muted-foreground",
};

function fmt(v?: string | null) {
  if (!v) return "—";
  const d = new Date(`${String(v).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("vi-VN");
}

export function ArchivePanel({
  studentProfileId,
  showSearch = false,
}: {
  studentProfileId?: string;
  showSearch?: boolean;
}) {
  const qc = useQueryClient();
  const listFn = useServerFn(listArchiveRecords);
  const locFn = useServerFn(listArchiveLocations);
  const saveFn = useServerFn(upsertArchiveRecord);
  const actionFn = useServerFn(archiveRecordAction);
  const permFn = useServerFn(canManageArchive);

  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const perm = useQuery({ queryKey: ["archive-perm"], queryFn: () => permFn({ data: {} as never }) });
  const canWrite = perm.data?.canWrite === true;

  const locations = useQuery({
    queryKey: ["archive-locations"],
    queryFn: () => locFn({ data: {} as never }),
  });

  const key = ["archive-records", studentProfileId ?? "all", term, status];
  const records = useQuery({
    queryKey: key,
    queryFn: () =>
      listFn({
        data: {
          ...(studentProfileId ? { student_profile_id: studentProfileId } : {}),
          ...(term ? { q: term } : {}),
          ...(status ? { status } : {}),
        },
      }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["archive-records"] });

  const saveMut = useMutation({
    mutationFn: (payload: any) => saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("Đã lưu phiếu lưu trữ");
      setOpen(false);
      setEditing(null);
      invalidate();
      qc.invalidateQueries({ queryKey: ["archive-locations"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không lưu được")),
  });

  const actMut = useMutation({
    mutationFn: (payload: any) => actionFn({ data: payload }),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái hồ sơ trong kho");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Thao tác thất bại")),
  });

  const items = (records.data?.items ?? []) as any[];
  const locs = (locations.data?.items ?? []) as any[];

  const summary = useMemo(() => {
    const s = { stored: 0, borrowed: 0, removed: 0 };
    for (const r of items) {
      if (r.status === "borrowed") s.borrowed++;
      else if (r.status === "removed") s.removed++;
      else s.stored++;
    }
    return s;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <Archive className="h-4 w-4 text-primary" /> Thư viện lưu trữ hồ sơ vật lý
        </div>
        <Badge variant="outline">Đang lưu: {summary.stored}</Badge>
        <Badge variant="outline">Đang mượn: {summary.borrowed}</Badge>
        <Badge variant="outline">Đã rút: {summary.removed}</Badge>
        <div className="ml-auto flex items-center gap-2">
          {canWrite && (
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) setEditing(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Nhập kho hồ sơ
                </Button>
              </DialogTrigger>
              <RecordDialog
                key={editing?.id ?? "new"}
                record={editing}
                locations={locs}
                studentProfileId={studentProfileId}
                saving={saveMut.isPending}
                onSubmit={(payload) => saveMut.mutate(payload)}
              />
            </Dialog>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Tìm theo mã học viên, họ tên, SĐT, mã phiếu, tên tài liệu…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setTerm(q.trim());
              }}
            />
          </div>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(ARCHIVE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => setTerm(q.trim())}>
            Tìm kiếm
          </Button>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto bg-card">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-muted/50 text-left">
            <tr>
              {!studentProfileId && <th className="px-3 py-2">Học viên</th>}
              <th className="px-3 py-2">Mã phiếu</th>
              <th className="px-3 py-2">Tài liệu</th>
              <th className="px-3 py-2">Vị trí kho</th>
              <th className="px-3 py-2">SL</th>
              <th className="px-3 py-2">Nhập kho</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {records.isLoading && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Đang tải…
                </td>
              </tr>
            )}
            {!records.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                  Chưa có hồ sơ giấy nào được ghi nhận trong kho.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                {!studentProfileId && (
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.student_profiles?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.student_profiles?.student_code ?? "—"}
                    </div>
                  </td>
                )}
                <td className="px-3 py-2 font-mono text-xs">{r.item_code ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.doc_kind ?? ""}</div>
                </td>
                <td className="px-3 py-2 text-xs">{locationLabel(r.archive_locations)}</td>
                <td className="px-3 py-2">{r.quantity}</td>
                <td className="px-3 py-2 text-xs">{fmt(r.stored_at)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs ${STATUS_CLASS[r.status] ?? ""}`}
                  >
                    {ARCHIVE_STATUS[r.status] ?? r.status}
                  </span>
                  {r.status === "borrowed" && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {r.borrower_name ?? "—"} · hạn {fmt(r.due_date)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {canWrite ? (
                    <div className="inline-flex gap-1">
                      <ArchivePrint record={r} />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(r);
                          setOpen(true);
                        }}
                      >
                        Sửa
                      </Button>
                      {r.status !== "borrowed" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const who = window.prompt("Người mượn hồ sơ?");
                            if (!who) return;
                            const due = window.prompt("Hạn trả (YYYY-MM-DD), bỏ trống nếu chưa rõ") || null;
                            actMut.mutate({ id: r.id, action: "borrow", borrower_name: who, due_date: due });
                          }}
                        >
                          <PackageOpen className="h-3.5 w-3.5 mr-1" /> Mượn
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => actMut.mutate({ id: r.id, action: "return" })}
                        >
                          <Undo2 className="h-3.5 w-3.5 mr-1" /> Trả kho
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ArchivePrint record={r} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Boxes className="h-3.5 w-3.5" /> Mỗi phiếu gắn với một vị trí kho thật (kho · phòng · tủ ·
        kệ · hộp) và mã phiếu dán trên bìa hồ sơ để tra cứu, rút hồ sơ nhanh.
      </p>
    </div>
  );
}

function RecordDialog({
  record,
  locations,
  studentProfileId,
  saving,
  onSubmit,
}: {
  record: any;
  locations: any[];
  studentProfileId?: string;
  saving: boolean;
  onSubmit: (payload: any) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    title: record?.title ?? "",
    doc_kind: record?.doc_kind ?? "",
    item_code: record?.item_code ?? "",
    quantity: String(record?.quantity ?? 1),
    condition: record?.condition ?? "",
    stored_at: record?.stored_at ?? new Date().toISOString().slice(0, 10),
    location_id: record?.location_id ?? "",
    note: record?.note ?? "",
    student_profile_id: record?.student_profile_id ?? studentProfileId ?? "",
  });
  const [picked, setPicked] = useState<PickedStudent | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{record ? "Cập nhật phiếu lưu trữ" : "Nhập kho hồ sơ giấy"}</DialogTitle>
      </DialogHeader>
      <div className="grid sm:grid-cols-2 gap-3">
        {!studentProfileId && !record && (
          <div className="sm:col-span-2">
            <StudentPicker
              label="Học viên *"
              value={picked}
              onChange={(s) => {
                setPicked(s);
                set("student_profile_id", s?.id ?? "");
              }}
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <Label>Tên tài liệu *</Label>
          <Input value={form['title']} onChange={(e) => set("title", e.target.value)} placeholder="VD: Bộ hồ sơ visa D-4-1 bản gốc" />
        </div>
        <div>
          <Label>Loại giấy tờ</Label>
          <Input value={form['doc_kind']} onChange={(e) => set("doc_kind", e.target.value)} placeholder="Hộ chiếu, bằng cấp, hợp đồng…" />
        </div>
        <div>
          <Label>Mã phiếu / tem dán</Label>
          <Input value={form['item_code']} onChange={(e) => set("item_code", e.target.value)} placeholder="VD: HS-2026-0001" />
        </div>
        <div>
          <Label>Vị trí kho</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={form['location_id']}
            onChange={(e) => set("location_id", e.target.value)}
          >
            <option value="">— Chưa xếp vị trí —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {locationLabel(l)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Số lượng</Label>
          <Input type="number" min={1} value={form['quantity']} onChange={(e) => set("quantity", e.target.value)} />
        </div>
        <div>
          <Label>Tình trạng vật lý</Label>
          <Input value={form['condition']} onChange={(e) => set("condition", e.target.value)} placeholder="Bản gốc / bản sao công chứng…" />
        </div>
        <div>
          <Label>Ngày nhập kho</Label>
          <Input type="date" value={form['stored_at']} onChange={(e) => set("stored_at", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Ghi chú</Label>
          <Textarea rows={2} value={form['note']} onChange={(e) => set("note", e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={saving}
          onClick={() => {
            if (!form['title']?.trim()) return toast.error("Chưa nhập tên tài liệu.");
            if (!form['student_profile_id'])
              return toast.error("Vui lòng chọn học viên từ danh sách gợi ý.");
            onSubmit({
              ...(record?.id ? { id: record.id } : {}),
              student_profile_id: form['student_profile_id'],
              title: form['title'].trim(),
              doc_kind: form['doc_kind'] || null,
              item_code: form['item_code'] || null,
              location_id: form['location_id'] || null,
              quantity: Number(form['quantity'] || 1),
              condition: form['condition'] || null,
              stored_at: form['stored_at'] || null,
              note: form['note'] || null,
            });
          }}
        >
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Lưu
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
