import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getStudentActivity,
  listAssignableStaff,
  reassignStudent,
  ACTION_LABEL,
} from "@/lib/students/activity.functions";
import { errorMessage } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, UserCheck } from "lucide-react";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

const ROLE_VI: Record<string, string> = {
  admin: "Quản trị",
  training_manager: "Quản lý đào tạo",
  consultant: "Tư vấn",
  cskh: "CSKH",
  visa_officer: "Visa",
  departure_coordinator: "Xuất cảnh",
  teacher: "Giáo viên",
  market_head: "Trưởng thị trường",
};

export function ActivityTimeline({ studentProfileId }: { studentProfileId: string }) {
  const fetchActivity = useServerFn(getStudentActivity);
  const fetchStaff = useServerFn(listAssignableStaff);
  const doReassign = useServerFn(reassignStudent);
  const qc = useQueryClient();

  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const q = useQuery({
    queryKey: ["student-activity", studentProfileId],
    queryFn: () => fetchActivity({ data: { student_profile_id: studentProfileId } }),
  });

  useRealtimeRefresh(
    ["student_activity_logs", "student_status_history", "workflow_step_logs"],
    ["student-activity"],
    `student-activity-${studentProfileId}`,
  );


  const staff = useQuery({ queryKey: ["assignable-staff"], queryFn: () => fetchStaff() });

  const [open, setOpen] = useState(false);
  const [toUser, setToUser] = useState("");
  const [reason, setReason] = useState("");

  const reassign = useMutation({
    mutationFn: () =>
      doReassign({
        data: { student_profile_id: studentProfileId, to_user_id: toUser, reason },
      }),
    onSuccess: () => {
      toast.success("Đã bàn giao và ghi vào nhật ký");
      setOpen(false);
      setReason("");
      qc.invalidateQueries({ queryKey: ["student-activity", studentProfileId] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const items = useMemo(() => {
    let list = q.data?.items ?? [];
    if (actor) list = list.filter((i: any) => i.actor_id === actor);
    if (action) list = list.filter((i: any) => i.action === action);
    if (from) list = list.filter((i: any) => String(i.created_at) >= from);
    if (to) list = list.filter((i: any) => String(i.created_at) <= to + "T23:59:59");
    return list;
  }, [q.data, actor, action, from, to]);

  const actions = useMemo(
    () => [...new Set((q.data?.items ?? []).map((i: any) => i.action))],
    [q.data],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-3">
        <div className="grow min-w-40">
          <label className="text-xs text-muted-foreground">Người xử lý</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          >
            <option value="">Tất cả</option>
            {(q.data?.actors ?? []).map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grow min-w-40">
          <label className="text-xs text-muted-foreground">Loại việc</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">Tất cả</option>
            {actions.map((a: any) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a] ?? a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Từ ngày</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Đến ngày</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-9 gap-2">
              <UserCheck className="h-4 w-4" /> Bàn giao phụ trách
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bàn giao người phụ trách hồ sơ</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Người nhận</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                  value={toUser}
                  onChange={(e) => setToUser(e.target.value)}
                >
                  <option value="">— Chọn nhân sự —</option>
                  {(staff.data?.items ?? []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roles.map((r: string) => ROLE_VI[r] ?? r).join(", ")})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">Lý do bàn giao</label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!toUser || reason.trim().length < 3 || reassign.isPending}
                onClick={() => reassign.mutate()}
              >
                {reassign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận bàn giao
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="divide-y rounded-lg border bg-card">
        {q.isLoading && (
          <div className="p-6 text-center text-muted-foreground">Đang tải nhật ký…</div>
        )}
        {!q.isLoading && items.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">Chưa có hoạt động nào</div>
        )}
        {items.map((i: any) => (
          <div key={i.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <div className="w-40 shrink-0 text-xs text-muted-foreground">
              {new Date(i.created_at).toLocaleString("vi-VN")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{i.action_label}</Badge>
                <span className="font-medium">{i.actor_name}</span>
                {(i.actor_role_list ?? []).slice(0, 2).map((r: string) => (
                  <Badge key={r} variant="outline" className="text-[10px]">
                    {ROLE_VI[r] ?? r}
                  </Badge>
                ))}
              </div>
              {(i.field || i.new_value) && (
                <div className="mt-1 break-words text-sm">
                  {i.field && <span className="text-muted-foreground">{i.field}: </span>}
                  {i.old_value && <span className="line-through opacity-60">{i.old_value}</span>}
                  {i.old_value && i.new_value && <span className="mx-1">→</span>}
                  {i.new_value && <span className="font-medium">{i.new_value}</span>}
                </div>
              )}
              {i.note && <div className="mt-1 text-sm text-muted-foreground">{i.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
