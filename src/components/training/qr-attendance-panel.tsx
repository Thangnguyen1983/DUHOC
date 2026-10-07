import { errorMessage } from "@/lib/errors";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { closeQrSession, getQrSessionState, openQrSession } from "@/lib/training/attendance-qr.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { QrCode, RefreshCw, ShieldCheck, StopCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Màn hình chiếu mã QR điểm danh cho một buổi học.
 * Mã tự đổi mỗi 30 giây; danh sách check-in cập nhật liên tục.
 */
export function QrAttendancePanel({ sessionId }: { sessionId: string }) {
  const openFn = useServerFn(openQrSession);
  const closeFn = useServerFn(closeQrSession);
  const stateFn = useServerFn(getQrSessionState);
  const qc = useQueryClient();

  const [lateAfter, setLateAfter] = useState(15);
  const [requireApproval, setRequireApproval] = useState(false);

  const state = useQuery({
    queryKey: ["qr-state", sessionId],
    queryFn: () => stateFn({ data: { session_id: sessionId } }),
    refetchInterval: 5000,
  });

  const open = useMutation({
    mutationFn: () =>
      openFn({ data: { session_id: sessionId, late_after_minutes: lateAfter, require_approval: requireApproval } }),
    onSuccess: () => {
      toast.success("Đã mở phiên điểm danh QR");
      qc.invalidateQueries({ queryKey: ["qr-state", sessionId] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không mở được phiên")),
  });

  const close = useMutation({
    mutationFn: () => closeFn({ data: { session_id: sessionId } }),
    onSuccess: (r: any) => {
      toast.success(`Đã đóng phiên${r?.approved ? ` · duyệt ${r.approved} lượt chờ` : ""}`);
      qc.invalidateQueries({ queryKey: ["qr-state", sessionId] });
      qc.invalidateQueries({ queryKey: ["attendance", sessionId] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const s = state.data as any;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <QrCode className="h-5 w-5 text-primary" /> Điểm danh bằng mã QR
        </div>
        {s?.open ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600">Đang mở</Badge>
            <Button size="sm" variant="destructive" onClick={() => close.mutate()} disabled={close.isPending}>
              <StopCircle className="mr-1 h-4 w-4" /> Đóng phiên
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => open.mutate()} disabled={open.isPending}>
            <QrCode className="mr-1 h-4 w-4" /> Mở phiên điểm danh
          </Button>
        )}
      </div>

      {!s?.open && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Tính "Trễ" sau (phút kể từ giờ vào học)</Label>
            <Input
              type="number"
              min={0}
              value={lateAfter}
              onChange={(e) => setLateAfter(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={requireApproval} onCheckedChange={setRequireApproval} id="req-approval" />
            <Label htmlFor="req-approval" className="text-xs">
              Cần giáo viên duyệt sau khi học viên quét
            </Label>
          </div>
        </div>
      )}

      {s?.open && (
        <div className="mt-5 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <QrCanvas token={s.token} expiresIn={s.expires_in} onTick={() => state.refetch()} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Đã điểm danh <strong>{s.checked_in}</strong>/{s.total} học viên
              {s.require_approval && <Badge variant="secondary">Cần duyệt</Badge>}
            </div>
            <div className="mt-3 max-h-72 divide-y overflow-auto rounded-lg border">
              {s.roster.map((r: any) => (
                <div key={r.enrollment_id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.student?.full_name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.student?.student_code ?? "—"}
                      {r.mark?.check_in_method === "qr" ? " · Học viên tự quét" : r.mark ? " · Giáo viên ghi" : ""}
                    </div>
                  </div>
                  {r.mark ? (
                    <Badge
                      variant={r.mark.status === "present" ? "default" : r.mark.status === "late" ? "secondary" : "destructive"}
                    >
                      {r.mark.pending ? "Chờ duyệt" : labelOf(r.mark.status)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Chưa điểm danh</span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Học viên mở Portal → <strong>Điểm danh</strong> → quét mã trên màn hình. Mã đổi mỗi 30 giây.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function labelOf(s: string) {
  return { present: "Có mặt", late: "Trễ", absent: "Vắng", excused: "Có phép" }[s] ?? s;
}

function QrCanvas({ token, expiresIn, onTick }: { token: string; expiresIn: number; onTick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [left, setLeft] = useState(expiresIn);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      if (cancelled || !ref.current) return;
      await QRCode.toCanvas(ref.current, token, { width: 280, margin: 1 });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => setLeft(expiresIn), [expiresIn, token]);
  useEffect(() => {
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          onTick();
          return 30;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl border bg-white p-3">
        <canvas ref={ref} className="h-[280px] w-[280px]" />
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" /> Mã đổi sau {left}s
      </div>
    </div>
  );
}
