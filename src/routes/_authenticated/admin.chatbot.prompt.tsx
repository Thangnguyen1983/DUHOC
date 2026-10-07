import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listPrompts, savePrompt, activatePrompt } from "@/lib/chatbot/prompt.functions";
import { Save, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/chatbot/prompt")({
  component: PromptManager,
});

function PromptManager() {
  const fetchPrompts = useServerFn(listPrompts);
  const saveFn = useServerFn(savePrompt);
  const activateFn = useServerFn(activatePrompt);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["prompts"], queryFn: () => fetchPrompts() });
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data && !loaded) {
      const active = data.items.find((p: any) => p.is_active);
      setContent(active?.content ?? data.defaultPrompt);
      setLoaded(true);
    }
  }, [data, loaded]);

  async function handleSave(activate: boolean) {
    if (content.trim().length < 50) {
      toast.error("Prompt quá ngắn (tối thiểu 50 ký tự)");
      return;
    }
    try {
      const res = await saveFn({ data: { content, activate } });
      toast.success(`Đã lưu phiên bản v${res.version}${activate ? " và kích hoạt" : ""}`);
      qc.invalidateQueries({ queryKey: ["prompts"] });
    } catch (e: any) {
      toast.error(errorMessage(e, "Lỗi"));
    }
  }

  function handleRestoreDefault() {
    if (!confirm("Khôi phục prompt mặc định? (chưa lưu)")) return;
    setContent(data?.defaultPrompt ?? "");
  }

  async function handleActivate(id: string) {
    await activateFn({ data: { id } });
    toast.success("Đã kích hoạt phiên bản");
    qc.invalidateQueries({ queryKey: ["prompts"] });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">System prompt</h1>
        <p className="text-sm text-muted-foreground">Quy định persona, tone và luật ràng buộc pháp lý của bot.</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          Thay đổi prompt có thể ảnh hưởng tính nhất quán và tuân thủ pháp lý. Hãy kiểm thử trước khi kích hoạt.
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleSave(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Save className="h-4 w-4" /> Lưu & kích hoạt
          </button>
          <button onClick={() => handleSave(false)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium">
            <Save className="h-4 w-4" /> Lưu nháp
          </button>
          <button onClick={handleRestoreDefault} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
            <RotateCcw className="h-4 w-4" /> Khôi phục mặc định
          </button>
        </div>
        <div className="text-xs text-muted-foreground">{content.length} ký tự · Cache làm mới sau ~60 giây.</div>
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="border-b p-4 font-bold">Lịch sử phiên bản</div>
        <div className="divide-y">
          {(data?.items ?? []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium">v{p.version} {p.is_active && <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" /> đang chạy</span>}</div>
                <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("vi-VN")}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setContent(p.content); setLoaded(true); }} className="text-xs text-primary hover:underline">Tải vào editor</button>
                {!p.is_active && (
                  <button onClick={() => handleActivate(p.id)} className="text-xs text-green-600 hover:underline">Kích hoạt</button>
                )}
              </div>
            </div>
          ))}
          {data?.items.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa có phiên bản nào. Đang dùng prompt mặc định trong code.</div>
          )}
        </div>
      </div>
    </div>
  );
}
