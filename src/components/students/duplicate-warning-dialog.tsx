import { Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { DuplicateMatch } from "@/lib/students.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Cảnh báo trùng thông tin học viên: cho người dùng chọn
 * "Chỉnh sửa hồ sơ cũ" (mở hồ sơ đã có) hoặc "Vẫn tạo hồ sơ mới".
 */
export function DuplicateWarningDialog({
  open,
  matches,
  onCancel,
  onProceed,
  proceeding,
}: {
  open: boolean;
  matches: DuplicateMatch[];
  onCancel: () => void;
  onProceed: () => void;
  proceeding?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" /> Phát hiện {matches.length} hồ sơ có thông tin trùng
          </DialogTitle>
          <DialogDescription>
            Hệ thống tìm thấy hồ sơ đã tồn tại với cùng số điện thoại, email hoặc họ tên + ngày sinh.
            Hãy mở hồ sơ cũ để cập nhật thay vì tạo trùng; chỉ tạo mới nếu chắc chắn đây là người khác.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-auto rounded-lg border divide-y">
          {matches.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{m.full_name}</span>
                  {m.student_code && (
                    <span className="font-mono text-xs rounded bg-primary/10 text-primary px-1.5 py-0.5">{m.student_code}</span>
                  )}
                  {m.current_status && <Badge variant="outline" className="text-[11px]">{m.current_status}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {m.phone}{m.email ? ` · ${m.email}` : ""}{m.dob ? ` · ${m.dob}` : ""}
                  {m.country ? ` · ${m.country}` : ""}{m.program ? ` · ${m.program}` : ""}
                  {" · tạo "}{new Date(m.created_at).toLocaleDateString("vi-VN")}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.reasons.map((r) => (
                    <Badge key={r} className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-[11px]">{r}</Badge>
                  ))}
                </div>
              </div>
              <Link to="/admin/students/$id" params={{ id: m.id }}>
                <Button size="sm" variant="secondary">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Chỉnh sửa hồ sơ cũ
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onCancel}>Quay lại sửa thông tin</Button>
          <Button variant="destructive" onClick={onProceed} disabled={proceeding}>
            {proceeding ? "Đang tạo..." : "Vẫn tạo hồ sơ mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
