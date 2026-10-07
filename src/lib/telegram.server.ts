const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

export const LEAD_CHAT_ID = 8861273501;

export async function sendTelegramMessage(
  text: string,
  chatId: number = LEAD_CHAT_ID,
): Promise<{ ok: boolean; error?: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const telegramKey = process.env.TELEGRAM_API_KEY;
  if (!lovableKey || !telegramKey) {
    const msg = "[telegram] missing LOVABLE_API_KEY or TELEGRAM_API_KEY";
    console.error(msg);
    return { ok: false, error: msg };
  }
  try {
    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": telegramKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      const msg = `[telegram] sendMessage failed [${res.status}]: ${body}`;
      console.error(msg);
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (err) {
    const msg = `[telegram] sendMessage error: ${err}`;
    console.error(msg);
    return { ok: false, error: msg };
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatLeadMessage(data: {
  full_name: string;
  phone: string;
  email?: string | null;
  program: string;
  market?: string | null;
  message?: string | null;
  source?: string | null;
  conversation_id?: string | null;
}) {
  const lines = [
    "🔔 <b>Đăng ký tư vấn mới</b>",
    `👤 <b>${escapeHtml(data.full_name)}</b>`,
    `📞 ${escapeHtml(data.phone)}`,
  ];
  if (data.email) lines.push(`✉️ ${escapeHtml(data.email)}`);
  lines.push(
    `🎯 Chương trình: ${escapeHtml(data.program)}${data.market ? ` — ${escapeHtml(data.market)}` : ""}`,
  );
  if (data.message) lines.push(`📝 ${escapeHtml(data.message)}`);
  if (data.source) lines.push(`🛰️ Nguồn: ${escapeHtml(data.source)}`);
  if (data.conversation_id)
    lines.push(`💬 Hội thoại: /admin/chatbot/conversations/${escapeHtml(data.conversation_id)}`);
  return lines.join("\n");
}
