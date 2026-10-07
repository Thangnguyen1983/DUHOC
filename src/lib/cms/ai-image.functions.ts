import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "cms-media";
const STAFF = ["admin", "editor", "content", "marketing", "seo", "market_head"] as const;

async function assertStaff(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role as string);
  if (!roles.some((r: string) => STAFF.includes(r as any))) throw new Error("Forbidden");
}

/** Sinh ảnh minh hoạ bằng AI rồi lưu vào Thư viện media của CMS. */
export const generateCmsImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        prompt: z.string().trim().min(5).max(1000),
        alt_text: z.string().trim().max(300).optional(),
        folder_id: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const apiKey = "kaizen-external-ai";
    if (!apiKey) throw new Error("Chưa cấu hình AI");

    const res = await (await import("@/lib/ai/external-ai.server")).aiFetch("/images/generations", {
      method: "POST",
      body: JSON.stringify({
        prompt: `Ảnh minh hoạ chuyên nghiệp cho bài viết giáo dục/du học/xuất khẩu lao động, phong cách hiện đại, sáng, không chứa chữ: ${data.prompt}`,
        size: "1536x1024",
        n: 1,
      }),
    });
    if (res.status === 429) throw new Error("Vượt giới hạn AI, thử lại sau ít phút.");
    if (res.status === 401 || res.status === 403) throw new Error("Khoá API AI không hợp lệ. Kiểm tra trong Cài đặt AI.");
    if (!res.ok) throw new Error("Tạo ảnh thất bại, vui lòng thử lại.");

    const json: any = await res.json();
    const b64png: string | undefined = json?.data?.[0]?.b64_json;
    if (!b64png) throw new Error("AI không trả về ảnh.");
    const dataUrl = `data:image/png;base64,${b64png}`;

    const [meta, b64] = dataUrl.split(",");
    const mime = meta.slice(5).split(";")[0] || "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = mime.includes("jpeg") ? "jpg" : "png";
    const fileName = `ai-${data.prompt.slice(0, 40).replace(/[^\w]+/g, "-").toLowerCase()}.${ext}`;
    const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}-${fileName}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: row, error: insErr } = await supabaseAdmin
      .from("cms_media_assets")
      .insert({
        file_name: fileName,
        storage_bucket: BUCKET,
        storage_path: path,
        mime_type: mime,
        size_bytes: bytes.length,
        alt_text: data.alt_text ?? data.prompt.slice(0, 200),
        folder_id: data.folder_id ?? null,
        uploaded_by: context.userId,
        is_public: false,
      })
      .select("id,file_name,storage_path,mime_type,alt_text")
      .single();
    if (insErr) throw insErr;

    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
    return { ...row, url: signed?.signedUrl ?? null };
  });
