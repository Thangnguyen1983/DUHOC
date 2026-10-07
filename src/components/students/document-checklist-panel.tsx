import { errorMessage } from "@/lib/errors";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getStudentChecklist,
  syncStudentChecklist,
  updateChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
  checklistProgress,
  CHECKLIST_STATUS,
  CHECKLIST_STATUS_LABEL,
  CHECKLIST_STAGES,
  CHECKLIST_STAGE_LABEL,
  type ChecklistStatus,
  type ChecklistStage,
} from "@/lib/students/checklist.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLE: Record<ChecklistStatus, string> = {
  missing: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  rejected: "bg-destructive/15 text-destructive",
  na: "bg-muted text-muted-foreground line-through",
};

function dueClass(due: string | null | undefined, status: string) {
  if (!due || status === "verified" || status === "na") return "";
  const d = new Date(due + "T00:00:00").getTime();
  const days = Math.floor((d - Date.now()) / 86400000);
  if (days < 0) return "border-destructive text-destructive";
  if (days <= 7) return "border-amber-500 text-amber-700 dark:text-amber-300";
  return "";
}

export function DocumentChecklistPanel({ studentProfileId }: { studentProfileId: string }) {
  const qc = useQueryClient();
  const fetchList = useServerFn(getStudentChecklist);
  const sync = useServerFn(syncStudentChecklist);
  const update = useServerFn(updateChecklistItem);
  const add = useServerFn(addChecklistItem);
  const remove = useServerFn(deleteChecklistItem);

  const key = ["student-checklist", studentProfileId];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchList({ data: { student_profile_id: studentProfileId } }),
  });

  // Cập nhật tiến độ theo thời gian thực
  useEffect(() => {
    const channel = supabase
      .channel(`checklist-${studentProfileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_document_checklist",
          filter: `student_profile_id=eq.${studentProfileId}`,
        },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfileId]);

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const syncMut = useMutation({
    mutationFn: () => sync({ data: { student_profile_id: studentProfileId } }),
    onSuccess: (r: any) => {
      toast.success(r?.added ? `Đã bổ sung ${r.added} loại giấy tờ theo thị trường` : "Checklist đã đầy đủ theo danh mục");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không đồng bộ được")),
  });

  const updateMut = useMutation({
    mutationFn: (v: any) => update({ data: v }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi cập nhật")),
  });

  const addMut = useMutation({
    mutationFn: (v: any) => add({ data: v }),
    onSuccess: () => {
      toast.success("Đã thêm giấy tờ");
      setNewName("");
      setNewCode("");
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi thêm giấy tờ")),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
  });

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newStage, setNewStage] = useState<ChecklistStage>("dang_ky");

  const items = (data?.items ?? []) as any[];
  const p = checklistProgress(items);

  const groups = CHECKLIST_STAGES.map((stage) => ({
    stage,
    items: items.filter((i) => (i.stage ?? "dang_ky") === stage),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Tiến độ hoàn thiện hồ sơ</CardTitle>
          <Button size="sm" variant="outline" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
            {syncMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Đồng bộ theo thị trường</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={p.percent} className="h-3" />
            <span className="text-sm font-semibold tabular-nums">{p.percent}%</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Bắt buộc: {p.total}</Badge>
            <Badge className={STATUS_STYLE.verified}>Đã duyệt: {p.done}</Badge>
            <Badge className={STATUS_STYLE.submitted}>Đã nộp: {p.submitted}</Badge>
            <Badge className={STATUS_STYLE.rejected}>Cần bổ sung: {p.rejected}</Badge>
            <Badge className={STATUS_STYLE.missing}>Còn thiếu: {p.missing}</Badge>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="rounded-lg border p-4 text-sm text-muted-foreground">Đang tải…</div>}
      {!isLoading && items.length === 0 && (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Chưa có checklist. Bấm “Đồng bộ theo thị trường” để sinh danh sách giấy tờ theo danh mục.
        </div>
      )}

      {groups.map((g) => {
        const gp = checklistProgress(g.items);
        return (
          <Card key={g.stage}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
              <CardTitle className="text-sm">
                {CHECKLIST_STAGE_LABEL[g.stage]}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {gp.done}/{gp.total} giấy tờ bắt buộc
                </span>
              </CardTitle>
              <div className="flex w-40 items-center gap-2">
                <Progress value={gp.percent} className="h-2" />
                <span className="text-xs font-semibold tabular-nums">{gp.percent}%</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t">
                {g.items.map((it) => (
                  <div key={it.id} className="flex flex-wrap items-center gap-3 p-3">
                    <div className="min-w-[200px] flex-1">
                      <div className="text-sm font-medium">
                        {it.doc_name}
                        {it.is_required && <span className="ml-1 text-destructive">*</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {it.doc_code}
                        {it.market ? ` · ${it.market}` : " · chung"}
                        {it.verified_at ? ` · duyệt ${new Date(it.verified_at).toLocaleDateString("vi-VN")}` : ""}
                      </div>
                    </div>

                    <Badge className={STATUS_STYLE[it.status as ChecklistStatus]}>
                      {CHECKLIST_STATUS_LABEL[it.status as ChecklistStatus]}
                    </Badge>

                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={it.status}
                      onChange={(e) => updateMut.mutate({ id: it.id, status: e.target.value })}
                    >
                      {CHECKLIST_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {CHECKLIST_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>

                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={it.stage ?? "dang_ky"}
                      onChange={(e) => updateMut.mutate({ id: it.id, stage: e.target.value })}
                    >
                      {CHECKLIST_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {CHECKLIST_STAGE_LABEL[s]}
                        </option>
                      ))}
                    </select>

                    <Input
                      type="date"
                      className={`h-9 w-40 ${dueClass(it.due_date, it.status)}`}
                      defaultValue={it.due_date ?? ""}
                      title="Hạn nộp"
                      onChange={(e) => updateMut.mutate({ id: it.id, due_date: e.target.value || null })}
                    />

                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={!!it.hard_copy_received}
                        onChange={(e) => updateMut.mutate({ id: it.id, hard_copy_received: e.target.checked })}
                      />
                      Đã nhận bản giấy
                    </label>

                    <Input
                      className="h-9 w-48"
                      placeholder="Ghi chú"
                      defaultValue={it.note ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (it.note ?? "")) updateMut.mutate({ id: it.id, note: e.target.value || null });
                      }}
                    />

                    <Button size="icon" variant="ghost" onClick={() => delMut.mutate(it.id)} aria-label="Xoá">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex flex-wrap items-end gap-2">
        <Input
          className="w-40"
          placeholder="Mã (vd: hop_dong)"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
        />
        <Input
          className="w-64"
          placeholder="Tên giấy tờ bổ sung"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <select
          className="h-10 rounded-md border bg-background px-2 text-sm"
          value={newStage}
          onChange={(e) => setNewStage(e.target.value as ChecklistStage)}
        >
          {CHECKLIST_STAGES.map((s) => (
            <option key={s} value={s}>
              {CHECKLIST_STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          disabled={!newCode.trim() || !newName.trim() || addMut.isPending}
          onClick={() =>
            addMut.mutate({
              student_profile_id: studentProfileId,
              doc_code: newCode.trim(),
              doc_name: newName.trim(),
              is_required: true,
              stage: newStage,
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Thêm giấy tờ
        </Button>
      </div>
    </div>
  );
}
