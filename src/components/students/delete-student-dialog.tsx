import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteStudent } from "@/lib/students.functions";
import { errorMessage } from "@/lib/errors";
import { Can } from "@/lib/rbac/use-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Xoá vĩnh viễn hồ sơ học viên — chỉ hiện khi có quyền `students.delete`.
 * Yêu cầu gõ đúng mã học viên (hoặc chữ XOA) và nêu lý do; vết xoá ghi vào nhật ký chung.
 */
export function DeleteStudentDialog({
  studentId,
  studentCode,
  fullName,
  onDeleted,
  size = "sm",
  iconOnly = false,
}: {
  studentId: string;
  studentCode?: string | null;
  fullName: string;
  onDeleted?: () => void;
  size?: "sm" | "default" | "icon";
  iconOnly?: boolean;
}) {
  const deleteFn = useServerFn(deleteStudent);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const expected = (studentCode || "XOA").trim();
  const ok = confirm.trim().toUpperCase() === expected.toUpperCase() && reason.trim().length >= 5;

  const mut = useMutation({
    mutationFn: () => deleteFn({ data: { id: studentId, reason: reason.trim() } }),
    onSuccess: () => {
      toast.success(`Đã xoá hồ sơ ${studentCode ?? fullName}`);
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      setOpen(false);
      onDeleted?.();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không xoá được hồ sơ")),
  });

  return (
    <Can permission="students.delete">
      <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setConfirm(""); setReason(""); } }}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size={iconOnly ? "icon" : size}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            title="Xoá hồ sơ (vĩnh viễn)"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
            {!iconOnly && <span className="ml-1">Xoá hồ sơ</span>}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Xoá vĩnh viễn hồ sơ học viên?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Hồ sơ <b>{fullName}</b>{studentCode ? <> (mã <b className="font-mono">{studentCode}</b>)</> : null} sẽ bị xoá
                  cùng toàn bộ dữ liệu đi kèm: workflow, checklist, tài liệu, ghi chú chăm sóc, ghi danh lớp, điểm, chứng chỉ,
                  phiếu lưu trữ và nhật ký trách nhiệm. <b>Không thể hoàn tác.</b>
                </p>
                <p className="text-muted-foreground">
                  Lead tư vấn và bản ghi xuất cảnh liên quan được giữ lại nhưng không còn liên kết tới hồ sơ này.
                  Thao tác xoá được ghi vào nhật ký hệ thống kèm người thực hiện và lý do.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Lý do xoá <span className="text-destructive">*</span></Label>
              <Textarea
                rows={2}
                placeholder="VD: Hồ sơ trùng với KZ26xxxxxx, tạo nhầm..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Gõ <b className="font-mono">{expected}</b> để xác nhận
              </Label>
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={expected} autoComplete="off" />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={mut.isPending}>Huỷ</Button>
            <Button variant="destructive" onClick={() => mut.mutate()} disabled={!ok || mut.isPending}>
              {mut.isPending ? "Đang xoá..." : "Xoá vĩnh viễn"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Can>
  );
}
