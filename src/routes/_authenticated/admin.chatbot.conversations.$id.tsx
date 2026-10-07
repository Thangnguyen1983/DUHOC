import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getConversation } from "@/lib/chatbot/conversations.functions";
import { ArrowLeft, User, Bot, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/chatbot/conversations/$id")({
  component: ConversationDetail,
});

function ConversationDetail() {
  const { id } = Route.useParams();
  const fetchOne = useServerFn(getConversation);
  const { data, isLoading } = useQuery({
    queryKey: ["chatbot-conversation", id],
    queryFn: () => fetchOne({ data: { id } }),
  });

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (!data?.conversation) return <div className="text-muted-foreground">Không tìm thấy phiên này.</div>;

  return (
    <div className="space-y-4">
      <Link
        to="/admin/chatbot/conversations"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Danh sách hội thoại
      </Link>

      <div className="rounded-2xl border bg-card p-4">
        <h2 className="font-bold">Hội thoại #{id.slice(0, 8)}</h2>
        <p className="text-xs text-muted-foreground">
          Bắt đầu: {new Date(data.conversation.started_at).toLocaleString("vi-VN")} ·{" "}
          Tin: {data.conversation.message_count}
        </p>

        {data.leads.length > 0 && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
            <div className="font-semibold text-green-900">Đã thu được lead:</div>
            <ul className="mt-1 space-y-1">
              {data.leads.map((l: any) => (
                <li key={l.id} className="flex items-center gap-2 text-green-900">
                  <Phone className="h-3 w-3" />
                  <span className="font-medium">{l.full_name}</span> —{" "}
                  <a href={`tel:${l.phone}`} className="text-primary">{l.phone}</a>
                  {l.program && <span className="text-xs text-muted-foreground">({l.program})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {data.messages.map((m: any) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`grid h-8 w-8 place-items-center rounded-full shrink-0 ${
                m.role === "user" ? "bg-muted" : "bg-primary/10 text-primary"
              }`}
            >
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              <div className="mt-1 text-[10px] opacity-70">
                {new Date(m.created_at).toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
        ))}
        {data.messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">Chưa có tin nhắn nào được lưu.</div>
        )}
      </div>
    </div>
  );
}
