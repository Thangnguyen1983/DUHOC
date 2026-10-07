import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { studentCheckIn } from "@/lib/training/attendance-qr.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraOff, CheckCircle2, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hoc-vien/diem-danh")({ component: CheckInPage });

function CheckInPage() {
  const checkIn = useServerFn(studentCheckIn);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const busyRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<any>(null);
  const [camError, setCamError] = useState<string | null>(null);

  async function submit(token: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const r = await checkIn({
        data: {
          token,
          device_info: { ua: navigator.userAgent, at: new Date().toISOString() },
        },
      });
      setResult(r);
      stop();
      toast.success(r.pending ? "Đã gửi, chờ giáo viên duyệt" : "Điểm danh thành công");
    } catch (e: any) {
      toast.error(errorMessage(e, "Điểm danh thất bại"));
    } finally {
      setTimeout(() => (busyRef.current = false), 1200);
    }
  }

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  async function start() {
    setCamError(null);
    setResult(null);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (res) => {
        if (res) submit(res.getText());
      });
      controlsRef.current = controls;
      setScanning(true);
    } catch (e: any) {
      setCamError(e?.message ?? "Không truy cập được camera");
    }
  }

  useEffect(() => () => stop(), []);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Điểm danh</h1>
        <p className="text-sm text-muted-foreground">
          Quét mã QR giáo viên chiếu trên lớp. Mã đổi mỗi 30 giây nên cần quét trực tiếp tại lớp.
        </p>
      </div>

      {result ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <div className="mt-3 text-lg font-semibold">
            {result.pending ? "Đã gửi — chờ giáo viên duyệt" : result.status === "late" ? "Đã ghi nhận: Trễ" : "Đã ghi nhận: Có mặt"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {result.student_name} {result.student_code ? `· ${result.student_code}` : ""}
          </div>
          <div className="text-sm text-muted-foreground">
            {result.class_name} {result.session_title ? `· ${result.session_title}` : ""}
          </div>
          <Button className="mt-4" variant="outline" onClick={() => setResult(null)}>
            Điểm danh buổi khác
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-5">
          <div className="overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
          </div>
          <div className="mt-3 flex gap-2">
            {scanning ? (
              <Button variant="outline" onClick={stop} className="flex-1">
                <CameraOff className="mr-1 h-4 w-4" /> Dừng quét
              </Button>
            ) : (
              <Button onClick={start} className="flex-1">
                <QrCode className="mr-1 h-4 w-4" /> Bật camera quét mã
              </Button>
            )}
          </div>
          {camError && <p className="mt-2 text-xs text-red-600">{camError}</p>}

          <div className="mt-5 border-t pt-4">
            <div className="text-xs text-muted-foreground">Không dùng được camera? Nhập mã hiển thị dưới QR:</div>
            <div className="mt-2 flex gap-2">
              <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Dán mã điểm danh" />
              <Button variant="secondary" onClick={() => manual && submit(manual)}>
                Gửi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
