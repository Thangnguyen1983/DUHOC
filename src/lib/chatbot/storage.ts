import type { UIMessage } from "ai";

const KEY = "kaizen_chat_v1";
const CONV_KEY = "kaizen_chat_conv_id_v1";

export function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages: UIMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(messages));
  } catch {
    /* ignore quota */
  }
}

export function clearMessages() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(CONV_KEY);
}

export function getOrCreateConversationId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(CONV_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(CONV_KEY, id);
  }
  return id;
}
