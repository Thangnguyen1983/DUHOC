// Nhà cung cấp mô hình. Thật: API Anthropic Messages. Giả (cho kiểm thử): kịch bản định sẵn.
const API = 'https://api.anthropic.com/v1/messages';

export function anthropicProvider({ apiKey, model }) {
  return {
    name: 'anthropic',
    model,
    async complete({ system, tools, messages, maxTokens, signal }) {
      const res = await fetch(API, {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, tools, messages }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
      return { content: body.content || [], stopReason: body.stop_reason, usage: { input: body.usage?.input_tokens || 0, output: body.usage?.output_tokens || 0 } };
    },
  };
}

export function noKeyProvider() {
  return {
    name: 'none',
    model: null,
    async complete() {
      throw new Error('Chưa cấu hình ANTHROPIC_API_KEY. Đặt biến môi trường rồi khởi động lại máy chủ.');
    },
  };
}

// script: mảng hàm (messages) => content[]; dùng cho test.
export function scriptedProvider(script) {
  let i = 0;
  return {
    name: 'scripted',
    model: 'scripted',
    async complete({ messages }) {
      const step = script[i++];
      if (!step) throw new Error('Hết kịch bản');
      return { content: typeof step === 'function' ? step(messages) : step, usage: { input: 1000, output: 200 } };
    },
  };
}
