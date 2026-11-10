/* Slim Maat chat transport. Development foundation only; the endpoint is not implemented yet. */
const MAX_CONTEXT_MESSAGES = 20;
const MAX_TEXT_LENGTH = 4000;
const TIMEOUT_MS = 30000;

function cleanMessage(message) {
  if (!message || !["user", "assistant"].includes(message.role) ||
      typeof message.text !== "string" || !message.text.trim() ||
      message.text.length > MAX_TEXT_LENGTH) {
    throw new TypeError("Invalid chat message");
  }
  return { role: message.role, text: message.text.trim() };
}

/** Send only the last 20 turns to a same-origin backend. Never fabricates a reply. */
export async function requestChatReply(messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new TypeError("A conversation is required");
  }
  const context = messages.slice(-MAX_CONTEXT_MESSAGES).map(cleanMessage);
  if (context[context.length - 1].role !== "user") {
    throw new TypeError("The last message must be from the user");
  }
  const request = options.fetch || globalThis.fetch;
  if (typeof request !== "function") throw new Error("Chat is unavailable");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await request("/api/slim-maat/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ messages: context }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error("Chat service unavailable");
    const data = await response.json();
    if (!data || typeof data.reply !== "string" || !data.reply.trim() || data.reply.length > 20000) {
      throw new Error("Invalid response from chat service");
    }
    return { role: "assistant", text: data.reply.trim(), createdAt: new Date().toISOString() };
  } finally {
    clearTimeout(timeout);
  }
}
