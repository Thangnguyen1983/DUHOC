// Nhà cung cấp mô hình. Thật: API Anthropic Messages. Giả (cho kiểm thử): kịch bản định sẵn.
const API = 'https://api.anthropic.com/v1/messages';

export function anthropicProvider({ apiKey, model, workspaceId = null }) {
  return {
    name: 'anthropic',
    model,
    async complete({ system, tools, messages, maxTokens, signal }) {
      // Prompt caching: ngữ cảnh lặp lại mỗi vòng chỉ tính ~10% giá khi đã nằm trong bộ nhớ đệm.
      const sys = [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }];
      const msgs = messages.map((m, i) => {
        if (i !== messages.length - 1) return m;
        const blocks = typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : m.content.map((b) => ({ ...b }));
        if (blocks.length) blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], cache_control: { type: 'ephemeral' } };
        return { ...m, content: blocks };
      });
      const res = await fetch(API, {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', ...(workspaceId ? { 'anthropic-workspace-id': workspaceId } : {}) },
        body: JSON.stringify({ model, max_tokens: maxTokens, system: sys, tools, messages: msgs }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
      return { content: body.content || [], stopReason: body.stop_reason, usage: { input: body.usage?.input_tokens || 0, output: body.usage?.output_tokens || 0, cacheWrite: body.usage?.cache_creation_input_tokens || 0, cacheRead: body.usage?.cache_read_input_tokens || 0 } };
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
