import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { aiFetch } from "@/lib/ai/external-ai.server";

/**
 * Giữ tên cũ để các tính năng hiện có không phải đổi, nhưng mọi lời gọi
 * được chuyển sang AI ngoài bằng khoá riêng của Kaizen (xem external-ai.server.ts).
 * Tham số khoá và mã chạy cũ bị bỏ qua; mẫu do Cài đặt AI quyết định.
 */
export function createLovableAiGatewayProvider(_unused?: string, _runId?: string) {
  const provider = createOpenAICompatible({
    name: "kaizen-ai",
    baseURL: "https://external.invalid/v1",
    fetch: (input, init) => aiFetch(String(input), init as RequestInit),
  });
  return Object.assign(provider, {
    getRunId: () => undefined as string | undefined,
    waitForRunId: () => Promise.resolve(undefined as string | undefined),
  });
}

export function getLovableAiGatewayRunId(_request: Request) {
  return undefined;
}
