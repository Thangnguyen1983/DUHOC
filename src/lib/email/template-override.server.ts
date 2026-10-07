// Server-only: đọc override do admin cấu hình cho template email + helpers.

export type TemplateOverride = {
  subject: string;
  introMarkdown: string;
  version: number;
  id: string;
};

/** Đọc bản override đang active mới nhất cho một template. */
export async function getActiveOverride(templateName: string): Promise<TemplateOverride | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("email_template_overrides")
      .select("id, subject, intro_markdown, version")
      .eq("template_name", templateName)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return { id: data.id, subject: data.subject, introMarkdown: data.intro_markdown ?? "", version: data.version };
  } catch (e) {
    console.error("[email-override] fetch failed", e);
    return null;
  }
}

/** Thay biến {{key}} trong chuỗi bằng giá trị từ data (nested via dot chưa hỗ trợ). */
export function interpolate(input: string, data: Record<string, any>): string {
  if (!input) return "";
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
    const v = data?.[key];
    if (v === undefined || v === null) return "";
    return String(v);
  });
}

/** Markdown tối giản (đoạn, xuống dòng, **đậm**, *nghiêng*, [text](url)) → HTML an toàn. */
export function tinyMarkdownToHtml(md: string): string {
  if (!md) return "";
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = md.replace(/\r\n/g, "\n").split(/\n{2,}/).map((block) => {
    let html = escape(block.trim());
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#3F7D3A;">$1</a>');
    html = html.replace(/\n/g, "<br/>");
    return `<p style="color:#1f2937;font-size:14px;line-height:22px;margin:0 0 12px;">${html}</p>`;
  });
  return paragraphs.join("");
}
