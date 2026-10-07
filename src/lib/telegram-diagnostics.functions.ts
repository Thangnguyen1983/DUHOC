import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const checkTelegramConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const telegramKey = process.env.TELEGRAM_API_KEY;

    const env = {
      LOVABLE_API_KEY: !!lovableKey,
      TELEGRAM_API_KEY: !!telegramKey,
    };

    const user = {
      id: context.userId,
      email: (context.claims as any)?.email ?? null,
    };

    if (!lovableKey || !telegramKey) {
      return {
        env,
        user,
        verify: null,
        bot: null,
        chat: null,
        ok: false,
        reason:
          "Connector Telegram chưa được liên kết với runtime của project (thiếu LOVABLE_API_KEY hoặc TELEGRAM_API_KEY).",
      };
    }

    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    };

    // 1) verify_credentials
    let verify: any = null;
    try {
      const r = await fetch(
        "https://connector-gateway.lovable.dev/api/v1/verify_credentials",
        { method: "POST", headers },
      );
      verify = { status: r.status, body: await r.json().catch(() => null) };
    } catch (e) {
      verify = { error: String(e) };
    }

    // 2) getMe (bot identity)
    let bot: any = null;
    try {
      const r = await fetch("https://connector-gateway.lovable.dev/telegram/getMe", {
        method: "POST",
        headers,
        body: "{}",
      });
      bot = { status: r.status, body: await r.json().catch(() => null) };
    } catch (e) {
      bot = { error: String(e) };
    }

    // 3) getChat with lead chat id (verifies bot can reach the target)
    let chat: any = null;
    try {
      const r = await fetch("https://connector-gateway.lovable.dev/telegram/getChat", {
        method: "POST",
        headers,
        body: JSON.stringify({ chat_id: 8861273501 }),
      });
      chat = { status: r.status, body: await r.json().catch(() => null) };
    } catch (e) {
      chat = { error: String(e) };
    }

    const ok =
      verify?.status === 200 && bot?.status === 200 && chat?.status === 200;

    return { env, user, verify, bot, chat, ok };
  });
