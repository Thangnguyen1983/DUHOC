import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Printer, PlayCircle, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runSystemDiagnostics, type CheckResult } from "@/lib/diagnostics/diagnostics.functions";
import { errorMessage } from "@/lib/errors";
import { getOperationalSignatories } from "@/lib/operational-signatories.functions";

export const Route = createFileRoute("/_authenticated/admin/kiem-nghiem")({
  head: () => ({
    meta: [
      { title: "Kiểm nghiệm & Bàn giao hệ thống — KAIZEN" },
      { name: "description", content: "Tự kiểm nghiệm phân quyền, mã định danh, lưu kho, giáo dục định hướng và xuất biên bản bàn giao." },
      { property: "og:title", content: "Kiểm nghiệm & Bàn giao hệ thống — KAIZEN" },
      { property: "og:description", content: "Tự kiểm nghiệm hệ thống và in biên bản bàn giao A4." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiagnosticsPage,
});

const STATUS = {
  pass: { label: "Đạt", icon: CheckCircle2, cls: "text-primary" },
  warn: { label: "Cần lưu ý", icon: AlertTriangle, cls: "text-muted-foreground" },
  fail: { label: "Không đạt", icon: XCircle, cls: "text-destructive" },
} as const;

type Report = Awaited<ReturnType<typeof runSystemDiagnostics>>;

function DiagnosticsPage() {
  const runFn = useServerFn(runSystemDiagnostics);
  const fetchSignatories = useServerFn(getOperationalSignatories);
  const { data: signatories } = useQuery({ queryKey: ["operational-signatories"], queryFn: () => fetchSignatories() });
  const [report, setReport] = useState<Report | null>(null);
  const run = useMutation({
    mutationFn: () => runFn(),
    onSuccess: (r) => { setReport(r); toast.success("Đã chạy xong kiểm nghiệm"); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const groups = report
    ? report.results.reduce<Record<string, CheckResult[]>>((acc, r) => {
        (acc[r.group] ??= []).push(r);
        return acc;
      }, {})
    : {};
  const ready = report && report.summary.fail === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 print:max-w-none print:p-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6 text-primary" /> Kiểm nghiệm & Bàn giao</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hệ thống tự tạo hồ sơ thử, kiểm tra từng luồng rồi xóa ngay. Hồ sơ thật không bị thay đổi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run.mutate()} disabled={run.isPending} className="min-h-11">
            <PlayCircle className="mr-2 h-4 w-4" />{run.isPending ? "Đang kiểm nghiệm…" : "Bắt đầu kiểm nghiệm"}
          </Button>
          <Button variant="outline" onClick={() => window.print()} disabled={!report} className="min-h-11">
            <Printer className="mr-2 h-4 w-4" />In biên bản bàn giao
          </Button>
        </div>
      </header>

      {!report && !run.isPending && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground print:hidden">
          Bấm “Bắt đầu kiểm nghiệm” để chạy 5 nhóm kiểm tra.
        </div>
      )}

      {report && (
        <article className="space-y-5">
          <div className="hidden text-center print:block">
            <p className="text-sm font-semibold">CÔNG TY KAIZEN</p>
            <h2 className="mt-2 text-xl font-bold">BIÊN BẢN KIỂM NGHIỆM VÀ BÀN GIAO HỆ THỐNG</h2>
            <p className="text-sm">Thời điểm kiểm nghiệm: {new Date(report.ranAt).toLocaleString("vi-VN")}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(["pass", "warn", "fail"] as const).map((k) => {
              const S = STATUS[k];
              return (
                <div key={k} className="rounded-lg border p-3 text-center">
                  <S.icon className={`mx-auto h-5 w-5 ${S.cls}`} aria-hidden />
                  <div className="mt-1 text-2xl font-bold">{report.summary[k]}</div>
                  <div className="text-xs text-muted-foreground">{S.label}</div>
                </div>
              );
            })}
          </div>

          <p role="status" className={`rounded-lg border p-3 text-sm ${ready ? "border-primary" : "border-destructive text-destructive"}`}>
            {ready
              ? "Không có mục không đạt. Hệ thống đủ điều kiện bàn giao; các mục “Cần lưu ý” cần người phụ trách xử lý tiếp."
              : "Còn mục không đạt. Chưa đủ điều kiện bàn giao — xử lý rồi chạy lại kiểm nghiệm."}
          </p>

          {Object.entries(groups).map(([g, rows]) => (
            <section key={g} className="break-inside-avoid">
              <h3 className="mb-2 font-semibold">{g}</h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr><th className="px-3 py-2">Nội dung</th><th className="px-3 py-2 w-28">Kết quả</th><th className="px-3 py-2">Chi tiết</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const S = STATUS[r.status];
                      return (
                        <tr key={i} className="border-t align-top">
                          <td className="px-3 py-2">{r.name}</td>
                          <td className={`px-3 py-2 font-medium ${S.cls}`}>
                            <span className="inline-flex items-center gap-1"><S.icon className="h-4 w-4" aria-hidden />{S.label}</span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{r.detail}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section className="hidden break-inside-avoid pt-6 print:block">
            <p className="text-sm">Biên bản được lập từ kết quả kiểm nghiệm tự động, không thay thế chữ ký số pháp lý.</p>
            <div className="mt-6 grid grid-cols-2 gap-8 text-center text-sm">
              <div><p className="font-semibold">ĐẠI DIỆN BÊN BÀN GIAO</p><p className="mt-20">(Ký, ghi rõ họ tên)</p></div>
              <div><p className="font-semibold">ĐẠI DIỆN BAN GIÁM ĐỐC</p><p className="mt-20">{signatories?.handover_signer_name ?? "(Ký, ghi rõ họ tên)"}</p></div>
            </div>
          </section>
        </article>
      )}
    </div>
  );
}
