import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listKnowledge } from "@/lib/chatbot/knowledge.functions";
import { listPrompts } from "@/lib/chatbot/prompt.functions";
import { Bot, BookOpen, Sparkles, CheckCircle2, GraduationCap, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/chatbot/")({
  component: ChatbotOverview,
});

function ChatbotOverview() {
  const fetchKB = useServerFn(listKnowledge);
  const fetchPrompts = useServerFn(listPrompts);
  const kb = useQuery({ queryKey: ["kb"], queryFn: () => fetchKB() });
  const prompts = useQuery({ queryKey: ["prompts"], queryFn: () => fetchPrompts() });

  const total = kb.data?.items.length ?? 0;
  const approved = kb.data?.items.filter((i: any) => i.status === "approved" && i.is_active).length ?? 0;
  const pending = kb.data?.items.filter((i: any) => i.status === "pending").length ?? 0;
  const activePrompt = prompts.data?.items.find((p: any) => p.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6 text-primary" /> Quản trị Chatbot</h1>
        <p className="text-sm text-muted-foreground">Tổng quan hệ thống trợ lý ảo Kaizen.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Mục tri thức" value={total} hint="Tổng cộng" />
        <Stat label="Đã duyệt & dùng" value={approved} accent />
        <Stat label="Chờ duyệt" value={pending} />
        <Stat label="Phiên bản prompt" value={prompts.data?.items.length ?? 0} hint={activePrompt ? `v${activePrompt.version} đang chạy` : "Đang dùng prompt mặc định"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/chatbot/knowledge" className="rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
          <BookOpen className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">Quản lý tri thức</h3>
          <p className="mt-1 text-sm text-muted-foreground">Thêm/sửa/duyệt mục tri thức cho chatbot. Chỉ mục được duyệt mới được bot dùng.</p>
        </Link>
        <Link to="/admin/chatbot/training" className="rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">Huấn luyện chatbot</h3>
          <p className="mt-1 text-sm text-muted-foreground">Cài đặt ngữ cảnh nghiệp vụ, đối tượng khách và giọng điệu tư vấn.</p>
        </Link>
        <Link to="/admin/chatbot/prompt" className="rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
          <Sparkles className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">System prompt</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tùy chỉnh persona, tone và luật ràng buộc pháp lý của bot.</p>
        </Link>
        <Link to="/admin/chatbot/conversations" className="rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-bold">Hội thoại & Lead</h3>
          <p className="mt-1 text-sm text-muted-foreground">Xem lại toàn bộ phiên chat khách đã trò chuyện và lead bot thu được.</p>
        </Link>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h3 className="font-bold">Cách hoạt động</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Bot luôn có sẵn KB tĩnh từ website (du học, XKLĐ, công ty).</li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Mục tri thức admin nạp vào sẽ <strong>chỉ được dùng khi trạng thái = approved</strong>.</li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Bot không tự bịa số liệu phí/lương/visa nếu KB không có.</li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Cache KB ~60 giây — thay đổi có hiệu lực sau 1 phút.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "gradient-brand text-white" : "bg-card"}`}>
      <div className={`text-xs uppercase ${accent ? "text-white/80" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-2 text-3xl font-extrabold">{value}</div>
      {hint && <div className={`text-xs ${accent ? "text-white/80" : "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}
