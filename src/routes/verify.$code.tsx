import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { verifyCertificate } from "@/lib/training/lms.functions";
import { Award, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/verify/$code")({ component: Page });

function Page() {
  const { code } = Route.useParams();
  const fetch = useServerFn(verifyCertificate);
  const q = useQuery({ queryKey: ["verify", code], queryFn: () => fetch({ data: { code } }) });
  const cert = q.data?.cert;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border-2 border-red-200 bg-white p-8 shadow-xl">
          <div className="flex items-center justify-center mb-6"><Award className="h-16 w-16 text-red-600"/></div>
          <h1 className="text-2xl font-bold text-center mb-2">Tra cứu chứng chỉ KAIZEN</h1>
          <p className="text-center text-sm text-muted-foreground mb-6">Mã xác minh: <code className="font-mono">{code}</code></p>

          {q.isLoading && <div className="text-center text-muted-foreground">Đang kiểm tra...</div>}
          {!q.isLoading && !cert && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3"/>
              <div className="font-bold text-red-700">Không tìm thấy chứng chỉ</div>
              <div className="text-sm text-muted-foreground mt-1">Mã không hợp lệ hoặc đã bị thu hồi</div>
            </div>
          )}
          {cert && (
            <div className="space-y-3">
              <div className={`rounded-xl p-4 text-center ${cert.status === "issued" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                {cert.status === "issued" ? (
                  <><CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-1"/><div className="font-bold text-green-700">Chứng chỉ hợp lệ</div></>
                ) : (
                  <><XCircle className="h-8 w-8 text-red-600 mx-auto mb-1"/><div className="font-bold text-red-700">Chứng chỉ đã bị thu hồi</div></>
                )}
              </div>
              <Row label="Số chứng chỉ" value={cert.certificate_number}/>
              <Row label="Người được cấp" value={cert.recipient_name}/>
              <Row label="Tên chứng chỉ" value={cert.title}/>
              {cert.training_programs?.name && <Row label="Chương trình" value={cert.training_programs.name}/>}
              <Row label="Ngày cấp" value={new Date(cert.issued_at).toLocaleDateString("vi-VN")}/>
              {cert.expires_at && <Row label="Hết hạn" value={new Date(cert.expires_at).toLocaleDateString("vi-VN")}/>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-dashed">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
