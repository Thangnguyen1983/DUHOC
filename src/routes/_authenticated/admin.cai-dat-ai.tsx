import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { getAiSettings, saveAiSettings, testAiSettings } from "@/lib/ai/ai-settings.functions";

export const Route = createFileRoute("/_authenticated/admin/cai-dat-ai")({
  head: () => ({
    meta: [
      { title: "Cài đặt AI — KAIZEN" },
      { name: "description", content: "Chọn hãng AI và khoá API riêng của Kaizen cho toàn hệ thống." },
      { property: "og:title", content: "Cài đặt AI — KAIZEN" },
      { property: "og:description", content: "Chọn hãng AI và khoá API riêng của Kaizen cho toàn hệ thống." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiSettingsPage,
});

type Provider = "openai" | "gemini" | "anthropic";

function AiSettingsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getAiSettings);
  const saveFn = useServerFn(saveAiSettings);
  const testFn = useServerFn(testAiSettings);
  const { data, isLoading } = useQuery({ queryKey: ["ai-settings"], queryFn: () => getFn() });
  const [f, setF] = useState({ mode: "lovable" as "lovable" | "external", provider: "gemini" as Provider, model: "", image_provider: "gemini" as "openai" | "gemini", image_model: "" });
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (data) setF({ mode: data.config.mode, provider: data.config.provider, model: data.config.model, image_provider: data.config.image_provider === "anthropic" ? "openai" : data.config.image_provider, image_model: data.config.image_model });
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: f }),
    onSuccess: () => { toast.success("Đã lưu cài đặt AI"); setTest(null); qc.invalidateQueries({ queryKey: ["ai-settings"] }); },
    onError: (e) => toast.error(errorMessage(e, "Không lưu được")),
  });
  const runTest = useMutation({ mutationFn: () => testFn(), onSuccess: setTest });

  if (isLoading || !data) return <p className="text-muted-foreground">Đang tải…</p>;
  const info = (id: string) => data.providers.find((p) => p.id === id)!;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt AI</h1>
        <p className="text-sm text-muted-foreground">Chọn nguồn AI cho toàn hệ thống: trợ lý ảo, chatbot website, viết bài, đọc giấy tờ, thẩm định hồ sơ, dịch và tạo ảnh.</p>
      </div>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Khoá API đã nhập</h2>
        <ul className="space-y-2">
          {data.providers.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
              {p.hasKey ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
              <span className="font-medium">{p.label}</span>
              <span className="text-muted-foreground">{p.hasKey ? "Đã có khoá" : "Chưa có khoá"}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Khoá được cất an toàn trên máy chủ, không hiển thị lại. Để thêm hoặc đổi khoá, nhắn cho trợ lý xây dựng hệ thống: “nhập khoá OpenAI/Gemini/Claude”.</p>
      </section>

      <form className="rounded-lg border p-4 space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <h2 className="font-semibold">Nguồn AI đang dùng</h2>
        <div role="radiogroup" aria-label="Nguồn AI" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([
            { id: "lovable", label: "AI của Lovable", desc: "Dùng ngay, không cần khoá riêng. Phí tính vào gói Lovable." },
            { id: "external", label: "Khoá riêng của Kaizen", desc: "Dùng khoá OpenAI / Gemini / Claude của công ty, tự quản chi phí." },
          ] as const).map((o) => (
            <label key={o.id} className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 ${f.mode === o.id ? "border-primary bg-primary/5" : ""}`}>
              <input type="radio" name="ai-mode" className="mt-1" checked={f.mode === o.id} onChange={() => setF({ ...f, mode: o.id })} />
              <span>
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.desc}</span>
              </span>
            </label>
          ))}
        </div>
        {f.mode === "external" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="ai-provider">Hãng cho trò chuyện & soạn thảo</Label>
            <select id="ai-provider" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.provider}
              onChange={(e) => { const p = e.target.value as Provider; setF({ ...f, provider: p, model: info(p).defaultModel }); }}>
              {data.providers.map((p) => <option key={p.id} value={p.id}>{p.label}{p.hasKey ? "" : " (chưa có khoá)"}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="ai-model">Tên mẫu AI</Label>
            <Input id="ai-model" value={f.model} placeholder={info(f.provider).defaultModel} onChange={(e) => setF({ ...f, model: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="ai-image-provider">Hãng tạo ảnh</Label>
            <select id="ai-image-provider" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.image_provider}
              onChange={(e) => { const p = e.target.value as "openai" | "gemini"; setF({ ...f, image_provider: p, image_model: info(p).defaultImageModel ?? "" }); }}>
              <option value="openai">OpenAI{info("openai").hasKey ? "" : " (chưa có khoá)"}</option>
              <option value="gemini">Google Gemini{info("gemini").hasKey ? "" : " (chưa có khoá)"}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="ai-image-model">Tên mẫu tạo ảnh</Label>
            <Input id="ai-image-model" value={f.image_model} onChange={(e) => setF({ ...f, image_model: e.target.value })} />
          </div>
        </div>
        )}
        {f.mode === "external" ? (
          <p className="text-xs text-muted-foreground">Claude không tạo được ảnh, nên tạo ảnh luôn dùng OpenAI hoặc Gemini.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Khi dùng AI của Lovable, hệ thống tự chọn mẫu phù hợp; không cần nhập khoá.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>Lưu cài đặt</Button>
          <Button type="button" variant="outline" disabled={runTest.isPending} onClick={() => runTest.mutate()}>{runTest.isPending ? "Đang kiểm tra…" : "Kiểm tra kết nối"}</Button>
        </div>
        {test && <p role="status" className={test.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{test.message}</p>}
      </form>
    </div>
  );
}
