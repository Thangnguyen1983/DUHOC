import { createServerFn } from "@tanstack/react-start";

export const testTelegramBot = createServerFn({ method: "POST" })
  .handler(async () => {
    const { sendTelegramMessage } = await import("./telegram.server");
    const result = await sendTelegramMessage(
      "🧪 <b>Tin nhắn thử nghiệm</b>\nBot đã được kết nối và hoạt động bình thường.",
    );
    if (!result.ok) {
      throw new Error(result.error || "Gửi tin nhắn thất bại");
    }
    return { ok: true };
  });
