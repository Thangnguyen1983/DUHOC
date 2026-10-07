import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyCertificates, getSignedMaterialUrl } from "@/lib/training/lms.functions";
import { Button } from "@/components/ui/button";
import { Award, Download } from "lucide-react";

export const Route = createFileRoute("/hoc-vien/chung-chi")({ component: Page });

function Page() {
  const fetch = useServerFn(listMyCertificates);
  const sign = useServerFn(getSignedMaterialUrl);
  const q = useQuery({ queryKey: ["my-certs"], queryFn: () => fetch() });

  async function dl(path: string) {
    const { url } = await sign({ data: { path, bucket: "certificates" } });
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6"/> Chứng chỉ của tôi</h1>
        <p className="text-sm text-muted-foreground">Tải xuống chứng chỉ đã được cấp</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(q.data?.items ?? []).map((c: any) => (
          <div key={c.id} className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-6">
            <Award className="h-10 w-10 text-red-600 mb-2"/>
            <h3 className="font-bold">{c.title}</h3>
            <div className="text-xs text-muted-foreground mt-1">{c.training_programs?.name}</div>
            <div className="mt-3 text-xs space-y-1">
              <div>Số: <span className="font-mono">{c.certificate_number}</span></div>
              <div>Mã XM: <span className="font-mono">{c.verify_code}</span></div>
              <div>Ngày cấp: {new Date(c.issued_at).toLocaleDateString("vi-VN")}</div>
            </div>
            {c.pdf_path && <Button size="sm" className="mt-3" onClick={() => dl(c.pdf_path)}><Download className="h-4 w-4 mr-1"/>Tải PDF</Button>}
          </div>
        ))}
        {(q.data?.items ?? []).length === 0 && <div className="col-span-2 text-center text-muted-foreground py-12 border rounded-2xl">Chưa có chứng chỉ</div>}
      </div>
    </div>
  );
}
