import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 365 * 10; // 10 years

async function assertEditor(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    rpc: (n: "has_role", a: { _user_id: string; _role: "admin" | "editor" }) => Promise<{ data: unknown }>;
  };
  const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
  ]);
  if (!isAdmin && !isEditor) throw new Error("Chỉ admin/editor được dùng chức năng này");
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function signPath(path: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from("post-images")
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data) throw error ?? new Error("Không tạo được link ảnh");
  return data.signedUrl;
}

const UploadInput = z.object({
  base64: z.string().min(1).max(3_500_000, "Ảnh quá lớn, tối đa 2MB"),
  mime: z.enum(["image/png", "image/jpeg", "image/jpg", "image/webp"]),
});

export const uploadPostCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UploadInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const bytes = decodeBase64(data.base64);
    if (bytes.length > MAX_UPLOAD_BYTES) throw new Error("Ảnh quá lớn, tối đa 2MB");

    const ext = MIME_EXT[data.mime];
    const path = `uploads/${crypto.randomUUID()}.${ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("post-images")
      .upload(path, bytes, { contentType: data.mime, upsert: false });
    if (error) throw new Error(error.message);
    const url = await signPath(path);
    return { url };
  });

const GenInput = z.object({
  prompt: z.string().min(4).max(500),
});

export const generatePostCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const key = "kaizen-external-ai";
    if (!key) throw new Error("Thiếu LOVABLE_API_KEY");

    const fullPrompt =
      `Cinematic editorial photograph for a blog cover, 16:9, photorealistic, ` +
      `professional lighting, no text, no watermarks. Subject: ${data.prompt}`;

    const res = await (await import("@/lib/ai/external-ai.server")).aiFetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: fullPrompt,
        size: "1536x1024",
        quality: "low",
        n: 1,
      }),
    });
    if (res.status === 429) throw new Error("AI đang quá tải, thử lại sau vài giây.");
    if (res.status === 402) throw new Error("Hết credit AI. Vui lòng nạp thêm trong Settings.");
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`AI gateway lỗi ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const b64: string | undefined = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("AI không trả về ảnh hợp lệ");

    const bytes = decodeBase64(b64);
    const path = `ai/${crypto.randomUUID()}.png`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("post-images")
      .upload(path, bytes, { contentType: "image/png", upsert: false });
    if (error) throw new Error(error.message);
    const url = await signPath(path);
    return { url };
  });
