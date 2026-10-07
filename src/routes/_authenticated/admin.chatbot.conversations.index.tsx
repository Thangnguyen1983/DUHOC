import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listConversations } from "@/lib/chatbot/conversations.functions";
import { MessageSquare, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/chatbot/conversations/")({
  component: ConversationsList,
});

function ConversationsList() {
  const fetchList = useServerFn(listConversations);
  const { data, isLoading } = useQuery({
    queryKey: ["chatbot-conversations"],
    queryFn: () => fetchList(),
  });

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Hội thoại chatbot
        </h1>
        <p className="text-sm text-muted-foreground">
          200 phiên gần nhất. Phiên có biểu tượng ✓ đã thu được lead.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Thời gian cuối</th>
              <th className="px-4 py-3">IP (hash)</th>
              <th className="px-4 py-3">Số tin</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">User-Agent</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((c: any) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-xs">
                  {c.last_message_at
                    ? new Date(c.last_message_at).toLocaleString("vi-VN")
                    : new Date(c.started_at).toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.ip_hash || "—"}</td>
                <td className="px-4 py-3">{c.message_count}</td>
                <td className="px-4 py-3">
                  {c.lead_captured ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" /> Có
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[280px]">
                  {c.user_agent || "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/admin/chatbot/conversations/$id"
                    params={{ id: c.id }}
                    className="text-primary hover:underline"
                  >
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có hội thoại nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
