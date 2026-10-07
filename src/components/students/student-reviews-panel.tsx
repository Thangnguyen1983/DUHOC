import { errorMessage } from "@/lib/errors";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStudentReviews,
  upsertStudentReview,
  deleteStudentReview,
  addConductRecord,
  deleteConductRecord,
  PERIOD_LABEL,
  CONDUCT_LABEL,
} from "@/lib/training/reviews.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Award, Trash2 } from "lucide-react";

const emptyReview = {
  period_type: "week" as "week" | "month" | "stage" | "final",
  period_label: "",
  period_start: "",
  period_end: "",
  attendance_score: "",
  attitude_score: "",
  progress_score: "",
  speaking_score: "",
  comment: "",
  recommendation: "",
};

const num = (v: string) => (v.trim() === "" ? null : Number(v));

export function StudentReviewsPanel({ studentProfileId }: { studentProfileId: string }) {
  const qc = useQueryClient();
  const fetchData = useServerFn(getStudentReviews);
  const saveReview = useServerFn(upsertStudentReview);
  const delReview = useServerFn(deleteStudentReview);
  const addConduct = useServerFn(addConductRecord);
  const delConduct = useServerFn(deleteConductRecord);

  const q = useQuery({
    queryKey: ["student-reviews", studentProfileId],
    queryFn: () => fetchData({ data: { student_profile_id: studentProfileId } }),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["student-reviews", studentProfileId] });

  const [form, setForm] = useState(emptyReview);
  const [conduct, setConduct] = useState({ record_type: "reminder", severity: "info", title: "", detail: "" });

  const saveMut = useMutation({
    mutationFn: () =>
      saveReview({
        data: {
          student_profile_id: studentProfileId,
          period_type: form.period_type,
          period_label: form.period_label.trim(),
          period_start: form.period_start || null,
          period_end: form.period_end || null,
          attendance_score: num(form.attendance_score),
          attitude_score: num(form.attitude_score),
          progress_score: num(form.progress_score),
          speaking_score: num(form.speaking_score),
          comment: form.comment || null,
          recommendation: form.recommendation || null,
        },
      }),
    onSuccess: () => {
      toast.success("Đã lưu nhận xét");
      setForm(emptyReview);
      refresh();
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const conductMut = useMutation({
    mutationFn: () =>
      addConduct({
        data: {
          student_profile_id: studentProfileId,
          record_type: conduct.record_type as any,
          severity: conduct.severity as any,
          title: conduct.title.trim(),
          detail: conduct.detail || null,
        },
      }),
    onSuccess: () => {
      toast.success("Đã ghi nhận");
      setConduct({ record_type: "reminder", severity: "info", title: "", detail: "" });
      refresh();
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const delReviewMut = useMutation({
    mutationFn: (id: string) => delReview({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); refresh(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });
  const delConductMut = useMutation({
    mutationFn: (id: string) => delConduct({ data: { id } }),
    onSuccess: () => { toast.success("Đã xoá"); refresh(); },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nhận xét định kỳ mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={form.period_type}
              onChange={(e) => setForm({ ...form, period_type: e.target.value as any })}
            >
              {Object.entries(PERIOD_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Input
              placeholder="Kỳ (VD: Tuần 12/2026)"
              value={form.period_label}
              onChange={(e) => setForm({ ...form, period_label: e.target.value })}
            />
            <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
            <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {([
              ["attendance_score", "Chuyên cần (0-10)"],
              ["attitude_score", "Thái độ (0-10)"],
              ["progress_score", "Tiến bộ (0-10)"],
              ["speaking_score", "Kỹ năng nói (0-10)"],
            ] as const).map(([key, label]) => (
              <Input
                key={key}
                type="number"
                step="0.5"
                min={0}
                max={10}
                placeholder={label}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value } as any)}
              />
            ))}
          </div>
          <Textarea
            placeholder="Nhận xét chi tiết"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          <Textarea
            placeholder="Khuyến nghị cho học viên / gia đình"
            value={form.recommendation}
            onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
          />
          <Button onClick={() => saveMut.mutate()} disabled={!form.period_label.trim() || saveMut.isPending}>
            Lưu nhận xét
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Lịch sử nhận xét</h3>
        {q.isLoading && <div className="text-sm text-muted-foreground">Đang tải…</div>}
        {(q.data?.reviews ?? []).map((r: any) => (
          <div key={r.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="outline">{PERIOD_LABEL[r.period_type] ?? r.period_type}</Badge>
                <span className="ml-2 font-medium">{r.period_label}</span>
                {r.overall_score != null && (
                  <span className="ml-2 text-sm font-semibold text-primary">TB {r.overall_score}/10</span>
                )}
              </div>
              <Button size="icon" variant="ghost" onClick={() => delReviewMut.mutate(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Chuyên cần: {r.attendance_score ?? "—"}</span>
              <span>Thái độ: {r.attitude_score ?? "—"}</span>
              <span>Tiến bộ: {r.progress_score ?? "—"}</span>
              <span>Nói: {r.speaking_score ?? "—"}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm whitespace-pre-wrap">{r.comment}</p>}
            {r.recommendation && (
              <p className="mt-2 rounded-md bg-muted p-2 text-sm">Khuyến nghị: {r.recommendation}</p>
            )}
          </div>
        ))}
        {!q.isLoading && !(q.data?.reviews ?? []).length && (
          <p className="text-sm text-muted-foreground">Chưa có nhận xét nào.</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" /> Khen thưởng – Kỷ luật
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={conduct.record_type}
              onChange={(e) => setConduct({ ...conduct, record_type: e.target.value })}
            >
              {Object.entries(CONDUCT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={conduct.severity}
              onChange={(e) => setConduct({ ...conduct, severity: e.target.value })}
            >
              <option value="info">Thông tin</option>
              <option value="medium">Trung bình</option>
              <option value="high">Nghiêm trọng</option>
            </select>
            <Input
              className="md:col-span-2"
              placeholder="Tiêu đề"
              value={conduct.title}
              onChange={(e) => setConduct({ ...conduct, title: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="Nội dung chi tiết"
            value={conduct.detail}
            onChange={(e) => setConduct({ ...conduct, detail: e.target.value })}
          />
          <Button onClick={() => conductMut.mutate()} disabled={!conduct.title.trim() || conductMut.isPending}>
            Ghi nhận
          </Button>

          <ul className="divide-y">
            {(q.data?.conduct ?? []).map((c: any) => (
              <li key={c.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div>
                  <Badge
                    variant="outline"
                    className={
                      c.record_type === "reward"
                        ? "text-emerald-600"
                        : c.severity === "high"
                          ? "text-destructive"
                          : "text-amber-600"
                    }
                  >
                    {CONDUCT_LABEL[c.record_type] ?? c.record_type}
                  </Badge>
                  <span className="ml-2 font-medium">{c.title}</span>
                  {c.auto_generated && <span className="ml-2 text-xs text-muted-foreground">(tự động)</span>}
                  {c.detail && <div className="text-xs text-muted-foreground">{c.detail}</div>}
                  <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("vi-VN")}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => delConductMut.mutate(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
            {!(q.data?.conduct ?? []).length && (
              <li className="py-2 text-sm text-muted-foreground">Chưa có ghi nhận nào.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
