import { errorMessage } from "@/lib/errors";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, FileArchive, FileSpreadsheet, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getExportHistory } from "@/lib/students/export360.functions";

const FORMATS = [
  { value: "pdf", label: "PDF bản in", desc: "Hồ sơ tổng hợp, có chữ ký & số trang", icon: FileText },
  { value: "xlsx", label: "Excel nhiều sheet", desc: "Dữ liệu chi tiết, dễ lọc đối chiếu", icon: FileSpreadsheet },
  { value: "zip", label: "Gói ZIP đầy đủ", desc: "PDF + Excel + ảnh giấy tờ đã tải lên", icon: FileArchive },
] as const;

const PURPOSES = [
  { value: "archive", label: "Lưu trữ nội bộ" },
  { value: "inspection", label: "Phục vụ thanh tra / kiểm tra" },
  { value: "handover", label: "Bàn giao đối tác" },
  { value: "student", label: "Cung cấp cho học viên" },
];

function fmt(v: string) {
  const d = new Date(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function Export360Dialog({ studentProfileId }: { studentProfileId: string }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<string>("pdf");
  const [purpose, setPurpose] = useState<string>("archive");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const historyFn = useServerFn(getExportHistory);
  const { data, refetch } = useQuery({
    queryKey: ["student-export-logs", studentProfileId],
    queryFn: () => historyFn({ data: { student_profile_id: studentProfileId } }),
    enabled: open,
  });

  async function run() {
    if (!note.trim()) {
      toast.error("Vui lòng ghi lý do xuất hồ sơ");
      return;
    }
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn");
      const res = await fetch("/api/students-export-360", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_profile_id: studentProfileId, format, purpose, note }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Không xuất được hồ sơ");
      }
      const blob = await res.blob();
      const name = res.headers.get("X-Export-Filename") || "ho-so-360";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${name}`);
      setNote("");
      void refetch();
    } catch (e: any) {
      toast.error(errorMessage(e, "Không xuất được hồ sơ"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1.5" /> Xuất hồ sơ 360°
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xuất hồ sơ 360° học viên</DialogTitle>
          <DialogDescription>
            Kết xuất toàn bộ dữ liệu học viên theo chuẩn lưu trữ và thanh tra. Mỗi lần xuất đều được
            ghi nhật ký kèm mã kiểm tra tính toàn vẹn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Định dạng file</Label>
            <div className="grid sm:grid-cols-3 gap-2">
              {FORMATS.map((f) => {
                const Icon = f.icon;
                const active = format === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormat(f.value)}
                    className={`rounded-lg border p-3 text-left transition ${
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1.5 text-primary" />
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="export-purpose">Mục đích xuất</Label>
            <select
              id="export-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
            >
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="export-note">Lý do / ghi chú (bắt buộc)</Label>
            <Textarea
              id="export-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="VD: Cung cấp cho đoàn kiểm tra Sở LĐTBXH ngày 12/09"
            />
          </div>

          <Button onClick={run} disabled={busy} className="w-full">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang tạo file...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" /> Xuất file
              </>
            )}
          </Button>

          <div className="rounded-lg border">
            <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" /> Nhật ký xuất hồ sơ
            </div>
            <div className="max-h-56 overflow-y-auto divide-y text-xs">
              {(data?.items ?? []).length === 0 && (
                <div className="p-3 text-muted-foreground">Chưa có lần xuất nào.</div>
              )}
              {(data?.items ?? []).map((r: any) => (
                <div key={r.id} className="p-3 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono uppercase text-[10px] rounded bg-muted px-1.5 py-0.5">
                      {r.format}
                    </span>
                    <span className="font-medium">{fmt(r.created_at)}</span>
                    <span className="text-muted-foreground">· {r.exported_by_email || "—"}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {PURPOSES.find((p) => p.value === r.purpose)?.label ?? r.purpose}
                    {r.note ? ` — ${r.note}` : ""}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground break-all">
                    {r.file_name} · SHA-256: {String(r.checksum ?? "").slice(0, 24)}…
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
