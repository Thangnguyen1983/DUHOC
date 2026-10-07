import { errorMessage } from "@/lib/errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  listDossierReviews,
  runDossierReview,
  type DossierIssue,
  type DossierReview,
} from "@/lib/students/dossier-ai.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const RISK_LABEL: Record<string, string> = {
  low: "Rủi ro thấp",
  medium: "Cần chú ý",
  high: "Rủi ro cao",
};

const RISK_STYLE: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  high: "bg-destructive/15 text-destructive",
};

const SEVERITY_STYLE: Record<string, string> = {
  high: "text-destructive",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-muted-foreground",
};

function IssueIcon({ severity }: { severity: string }) {
  if (severity === "high") return <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />;
  if (severity === "medium") return <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />;
  return <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

export function DossierAiPanel({ studentProfileId }: { studentProfileId: string }) {
  const qc = useQueryClient();
  const fetchReviews = useServerFn(listDossierReviews);
  const run = useServerFn(runDossierReview);
  const key = ["dossier-reviews", studentProfileId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchReviews({ data: { student_profile_id: studentProfileId } }),
  });

  const runMut = useMutation({
    mutationFn: () => run({ data: { student_profile_id: studentProfileId } }),
    onSuccess: () => {
      toast.success("AI đã rà soát xong hồ sơ");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không rà soát được hồ sơ")),
  });

  const reviews = (data?.reviews ?? []) as DossierReview[];
  const latest = reviews[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI rà soát hồ sơ &amp; dự đoán visa
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Kiểm tra tính đầy đủ, đối chiếu thông tin giữa các giấy tờ và cảnh báo trước khi nộp.
          </p>
        </div>
        <Button size="sm" onClick={() => runMut.mutate()} disabled={runMut.isPending}>
          {runMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Rà soát bằng AI
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}

        {!isLoading && !latest && (
          <p className="text-sm text-muted-foreground">
            Chưa có lần rà soát nào. Bấm “Rà soát bằng AI” để hệ thống phân tích bộ hồ sơ hiện tại.
          </p>
        )}

        {latest && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Mức độ hoàn thiện</p>
                <p className="text-2xl font-semibold">{latest.completeness_percent}%</p>
                <Progress value={latest.completeness_percent} className="mt-2" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Khả năng đạt visa (ước lượng)</p>
                <p className="text-2xl font-semibold">{latest.visa_score}%</p>
                <Progress value={latest.visa_score} className="mt-2" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đánh giá rủi ro</p>
                <Badge className={`mt-2 ${RISK_STYLE[latest.risk_level] ?? RISK_STYLE.medium}`}>
                  {RISK_LABEL[latest.risk_level] ?? latest.risk_level}
                </Badge>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(latest.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            {latest.summary && <p className="text-sm leading-relaxed">{latest.summary}</p>}

            {latest.issues?.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Vấn đề phát hiện</h4>
                <ul className="space-y-2">
                  {latest.issues.map((it: DossierIssue, i: number) => (
                    <li key={i} className="flex gap-2 rounded-md border p-3">
                      <IssueIcon severity={it.severity} />
                      <div className="text-sm">
                        <p className={`font-medium ${SEVERITY_STYLE[it.severity] ?? ""}`}>
                          {it.title}
                          {it.doc_code ? <span className="ml-2 text-xs text-muted-foreground">({it.doc_code})</span> : null}
                        </p>
                        <p className="text-muted-foreground">{it.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {latest.suggestions?.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Việc cần làm tiếp</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {latest.suggestions.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {reviews.length > 1 && (
              <div className="text-xs text-muted-foreground">
                Lịch sử: {reviews.length} lần rà soát — gần nhất{" "}
                {new Date(latest.created_at).toLocaleDateString("vi-VN")}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
