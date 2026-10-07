import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { checkTelegramConnection } from "@/lib/telegram-diagnostics.functions";
import { testTelegramBot } from "@/lib/telegram.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/telegram")({
  component: TelegramAdmin,
});

function Row({ label, ok, detail }: { label: string; ok: boolean | null; detail?: string }) {
  const color =
    ok === true ? "bg-green-500" : ok === false ? "bg-red-500" : "bg-muted-foreground";
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0">
      <span className={`mt-1.5 inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        {detail && <div className="text-xs text-muted-foreground break-all">{detail}</div>}
      </div>
    </div>
  );
}

function TelegramAdmin() {
  const fetchStatus = useServerFn(checkTelegramConnection);
  const sendTest = useServerFn(testTelegramBot);
  const q = useQuery({ queryKey: ["telegram-status"], queryFn: () => fetchStatus() });

  const test = useMutation({
    mutationFn: () => sendTest(),
    onSuccess: () => toast.success("Đã gửi tin nhắn thử"),
    onError: (e) => toast.error(errorMessage(e, "Lỗi gửi")),
  });

  const d = q.data;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Trạng thái connector Telegram (Kaizen)</h1>
        <p className="text-sm text-muted-foreground">
          Kiểm tra xem tài khoản đang đăng nhập có thể sử dụng bot Telegram của project không.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Tài khoản hiện tại</h2>
          <Button size="sm" variant="outline" onClick={() => q.refetch()} disabled={q.isFetching}>
            {q.isFetching ? "Đang kiểm tra..." : "Kiểm tra lại"}
          </Button>
        </div>
        {q.isLoading && <div className="text-sm text-muted-foreground">Đang tải...</div>}
        {q.error && (
          <div className="text-sm text-red-600">
            {q.error instanceof Error ? q.error.message : "Lỗi"}
          </div>
        )}
        {d && (
          <>
            <Row label="User ID" ok={null} detail={d.user.id} />
            <Row label="Email" ok={null} detail={d.user.email ?? "(không có)"} />
          </>
        )}
      </div>

      {d && (
        <>
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold mb-2">Biến môi trường (runtime server)</h2>
            <Row label="LOVABLE_API_KEY" ok={d.env.LOVABLE_API_KEY} />
            <Row label="TELEGRAM_API_KEY" ok={d.env.TELEGRAM_API_KEY} />
            <p className="text-xs text-muted-foreground mt-3">
              Đây là biến phía server của ứng dụng đã publish — KHÔNG liên quan đến quyền truy cập
              connector trong Lovable Editor. Nếu cả hai = đỏ, chủ workspace cần liên kết connector
              Kaizen vào project này.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold mb-2">Kiểm tra gateway</h2>
            <Row
              label="verify_credentials"
              ok={d.verify ? d.verify.status === 200 : null}
              detail={d.verify ? `HTTP ${d.verify.status} · ${JSON.stringify(d.verify.body)}` : "—"}
            />
            <Row
              label="getMe (thông tin bot)"
              ok={d.bot ? d.bot.status === 200 : null}
              detail={
                d.bot?.body?.result
                  ? `@${d.bot.body.result.username} (${d.bot.body.result.first_name})`
                  : d.bot
                    ? `HTTP ${d.bot.status} · ${JSON.stringify(d.bot.body)}`
                    : "—"
              }
            />
            <Row
              label="getChat 8861273501 (đích nhận lead)"
              ok={d.chat ? d.chat.status === 200 : null}
              detail={
                d.chat?.body?.ok
                  ? `OK — ${d.chat.body.result?.type ?? ""} ${d.chat.body.result?.first_name ?? d.chat.body.result?.title ?? ""}`
                  : d.chat
                    ? `HTTP ${d.chat.status} · ${JSON.stringify(d.chat.body)} — Nếu lỗi "chat not found", chat ID 8861273501 chưa từng nhắn cho bot.`
                    : "—"
              }
            />
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Tổng kết</h2>
                <p className="text-sm text-muted-foreground">
                  {d.ok
                    ? "✅ Tài khoản này dùng được Telegram bot bình thường."
                    : d.reason ||
                      "⚠️ Có vấn đề với kết nối — xem chi tiết phía trên."}
                </p>
              </div>
              <Button onClick={() => test.mutate()} disabled={test.isPending || !d.ok}>
                {test.isPending ? "Đang gửi..." : "Gửi tin nhắn thử"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
