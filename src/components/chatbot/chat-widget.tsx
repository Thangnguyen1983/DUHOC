import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, RotateCw, Send, Phone } from "lucide-react";
import { COMPANY } from "@/lib/markets";
import { loadMessages, saveMessages, clearMessages, getOrCreateConversationId } from "@/lib/chatbot/storage";
import { parseCTAs, type CTA } from "@/lib/chatbot/parse-cta";

const QUICK_STARTS = [
  "Tư vấn du học Nhật",
  "Đơn hàng XKLĐ Đức 2026",
  "Học IELTS tại Kaizen",
  "Tuyển nhân sự outsourcing",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  // Hide on admin/auth
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const check = () => {
      const p = window.location.pathname;
      setHidden(p.startsWith("/admin") || p.startsWith("/auth"));
    };
    check();
    window.addEventListener("popstate", check);
    return () => window.removeEventListener("popstate", check);
  }, []);

  useEffect(() => {
    setInitial(loadMessages());
  }, []);

  if (hidden) return null;
  if (initial === null) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-44 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform md:bottom-48 md:right-6"
          aria-label="Mở chatbot Kaizen"
        >
          <MessageCircle className="h-6 w-6" />
        </button>

      )}
      {open && <ChatPanel initial={initial} onClose={() => setOpen(false)} />}
    </>
  );
}

function ChatPanel({ initial, onClose }: { initial: UIMessage[]; onClose: () => void }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationId = getOrCreateConversationId();
  const { messages, sendMessage, status, setMessages } = useChat({
    id: "kaizen-chat",
    messages: initial,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId },
    }),
  });

  // Persist
  useEffect(() => {
    if (messages.length > 0) saveMessages(messages);
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isLoading = status === "submitted" || status === "streaming";

  async function handleSend(text: string) {
    const v = text.trim();
    if (!v || isLoading) return;
    setInput("");
    await sendMessage({ text: v });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleReset() {
    if (!confirm("Bắt đầu cuộc trò chuyện mới?")) return;
    clearMessages();
    setMessages([]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end md:inset-auto md:bottom-6 md:right-6">
      <div
        className="absolute inset-0 bg-black/20 md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full w-full flex-col bg-card shadow-2xl md:h-[600px] md:w-[400px] md:rounded-2xl border">
        {/* Header */}
        <div className="flex items-center gap-3 border-b p-3 gradient-brand text-white md:rounded-t-2xl">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 font-bold">K</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold">Trợ lý Kaizen</div>
            <div className="text-xs text-white/80">Tư vấn 24/7 — thông tin tham khảo</div>
          </div>
          <button
            onClick={handleReset}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20"
            aria-label="Cuộc trò chuyện mới"
            title="Cuộc trò chuyện mới"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="border-b bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          Thông tin do trợ lý ảo cung cấp chỉ mang tính tham khảo. Chi tiết và cam kết do tư vấn viên Kaizen xác nhận.
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && <QuickStarts onPick={handleSend} />}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {status === "submitted" && (
            <div className="flex gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">K</div>
              <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="border-t p-2"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              rows={1}
              placeholder="Nhập câu hỏi cho Kaizen..."
              className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary max-h-24"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
              aria-label="Gửi"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
            <span>Enter để gửi · Shift+Enter xuống dòng</span>
            <a
              href={`tel:${COMPANY.phoneRaw}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Phone className="h-3 w-3" /> {COMPANY.phone}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickStarts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-muted/50 p-3 text-sm">
        Xin chào! Kaizen có thể tư vấn anh/chị về <strong>Du học, XKLĐ, Ngoại ngữ, Outsourcing</strong>. Anh/chị quan tâm chủ đề nào?
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_STARTS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-full border bg-background px-3 py-1.5 text-xs hover:bg-accent hover:text-primary"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const rawText = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  const { text, ctas } = isUser ? { text: rawText, ctas: [] as CTA[] } : parseCTAs(rawText);

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
          K
        </div>
      )}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{text}</span>
          ) : (
            <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
        </div>
        {ctas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ctas.map((c, i) => (
              <a
                key={i}
                href={c.href}
                target={c.href?.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                {c.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
