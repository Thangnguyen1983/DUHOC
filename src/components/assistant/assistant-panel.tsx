import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { useRouterState } from "@tanstack/react-router";
import { Bot, Copy, Loader2, Send, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SUGGEST = [
  "Hướng dẫn tôi tạo hồ sơ học viên mới",
  "Tổng quan số liệu phòng tôi hôm nay",
  "Soạn tin nhắc học viên nộp giấy tờ gốc",
];

/** Trợ lý ảo nội bộ: một cuộc trò chuyện, không lưu lại khi tải lại trang. */
export function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pageRef = useRef(pathname);
  pageRef.current = pathname;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/assistant",
    headers: async () => {
      const { data } = await supabase.auth.getSession();
      return { Authorization: `Bearer ${data.session?.access_token ?? ""}` } as Record<string, string>;
    },
    body: () => ({ page: pageRef.current }),
  }), []);
  const { messages, sendMessage, status, stop, setMessages, error } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, status]);
  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <>
      {!open && (
        <Button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-40 h-12 rounded-full px-4 shadow-lg print:hidden" aria-label="Mở Trợ lý Kaizen">
          <Bot className="mr-2 h-5 w-5" /> Trợ lý
        </Button>
      )}
      {open && (
        <section aria-label="Trợ lý Kaizen" className="fixed inset-x-2 bottom-2 z-50 flex h-[min(640px,85vh)] flex-col rounded-xl border bg-background shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[420px] print:hidden">
          <header className="flex items-center gap-2 border-b px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Trợ lý Kaizen</div>
              <div className="truncate text-xs text-muted-foreground">Hướng dẫn · Tra cứu · Soạn thảo</div>
            </div>
            <Button size="icon" variant="ghost" aria-label="Xoá cuộc trò chuyện" onClick={() => setMessages([])}><Trash2 className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Đóng trợ lý" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {!messages.length && (
              <div className="space-y-2">
                <p className="text-muted-foreground">Anh/chị cần hỗ trợ gì? Trợ lý chỉ xem được dữ liệu trong phạm vi quyền của anh/chị.</p>
                {SUGGEST.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="block w-full rounded-md border px-3 py-2 text-left hover:bg-muted">{s}</button>
                ))}
              </div>
            )}
            {messages.map((m) => {
              const text = m.parts.filter((p) => p.type === "text").map((p: any) => p.text).join("");
              const tools = m.parts.filter((p) => p.type.startsWith("tool-"));
              return (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                  {m.role === "user" ? (
                    <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-primary-foreground">{text}</div>
                  ) : (
                    <div className="space-y-1">
                      {tools.length > 0 && <div className="text-xs text-muted-foreground">Đã tra cứu: {tools.map((t) => t.type.replace("tool-", "").replace(/_/g, " ")).join(", ")}</div>}
                      {text && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{text}</ReactMarkdown>
                        </div>
                      )}
                      {text && status !== "streaming" && (
                        <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => { navigator.clipboard.writeText(text); toast.success("Đã sao chép"); }}>
                          <Copy className="h-3 w-3" /> Sao chép
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {status === "submitted" && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang suy nghĩ…</div>}
            {error && <div role="alert" className="rounded-md border border-destructive/40 p-2 text-destructive">Trợ lý chưa trả lời được. Quản trị viên cần kiểm tra Cài đặt AI.</div>}
            <div ref={endRef} />
          </div>

          <form className="flex items-end gap-2 border-t p-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <label htmlFor="assistant-input" className="sr-only">Nhập câu hỏi</label>
            <textarea id="assistant-input" ref={inputRef} rows={2} value={input} placeholder="Hỏi trợ lý…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              className="min-h-[44px] flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm" />
            {busy ? (
              <Button type="button" size="icon" className="h-11 w-11" variant="outline" aria-label="Dừng" onClick={() => stop()}><Square className="h-4 w-4" /></Button>
            ) : (
              <Button type="submit" size="icon" className="h-11 w-11" aria-label="Gửi" disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
            )}
          </form>
        </section>
      )}
    </>
  );
}
