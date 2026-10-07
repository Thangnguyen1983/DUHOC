import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const CHUNK_CHARS = 6000;
const VALID_CATEGORIES = [
  "du_hoc",
  "xkld",
  "ngoai_ngu",
  "outsourcing",
  "cong_ty",
  "phap_ly",
  "khac",
] as const;
type Category = (typeof VALID_CATEGORIES)[number];

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

function cleanText(s: string) {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text: string, size: number): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let buf = "";
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > size && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
    while (buf.length > size) {
      chunks.push(buf.slice(0, size));
      buf = buf.slice(size);
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

async function extractText(file: File, ext: string): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (ext === "txt" || ext === "md") {
    return new TextDecoder("utf-8").decode(buf);
  }
  if (ext === "pdf") {
    const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buf);
    const { text } = await pdfExtract(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n\n") : text;
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
    return value;
  }
  throw new Error("Định dạng không hỗ trợ. Chỉ chấp nhận .txt .md .pdf .docx");
}

export const importKnowledgeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Cần FormData");
    const file = data.get("file");
    const category = String(data.get("category") ?? "khac");
    const status = String(data.get("status") ?? "pending");
    if (!(file instanceof File)) throw new Error("Thiếu file");
    if (file.size === 0) throw new Error("File rỗng");
    if (file.size > MAX_FILE_BYTES) throw new Error("File vượt quá 10MB");
    if (!VALID_CATEGORIES.includes(category as Category))
      throw new Error("Danh mục không hợp lệ");
    if (!["draft", "pending", "approved"].includes(status))
      throw new Error("Trạng thái không hợp lệ");
    return { file, category: category as Category, status: status as "draft" | "pending" | "approved" };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { file, category, status } = data;
    const name = file.name || "upload";
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const raw = await extractText(file, ext);
    const text = cleanText(raw);
    if (text.length < 20) throw new Error("Không đọc được nội dung từ file");

    const chunks = chunkText(text, CHUNK_CHARS);
    const baseTitle = name.replace(/\.[^.]+$/, "").slice(0, 180);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = chunks.map((content, idx) => ({
      category,
      title: chunks.length > 1 ? `${baseTitle} (phần ${idx + 1}/${chunks.length})` : baseTitle,
      content,
      keywords: [],
      priority: 0,
      status,
      is_active: true,
      created_by: context.userId,
      ...(status === "approved"
        ? { approved_by: context.userId, approved_at: new Date().toISOString() }
        : {}),
    }));

    const { error } = await supabaseAdmin.from("chatbot_knowledge").insert(rows);
    if (error) throw error;

    return { ok: true, count: rows.length, chars: text.length };
  });
