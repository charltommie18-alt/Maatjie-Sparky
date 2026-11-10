/* Isolated server-side building block only. Not a mounted route or access system. */
export const MAX_MESSAGES = 20;
export const MAX_TEXT = 4000;
const SYSTEM = "You are Slim Maat, a helpful South African assistant for adults. Respond in the user’s language, naturally and respectfully. Do not impersonate a real person or claim actions you cannot perform.";
export function validateChatMessages(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_MESSAGES) throw new TypeError("Invalid conversation");
  const clean = input.map(message => {
    if (!message || typeof message !== "object" || !["user", "assistant"].includes(message.role) || typeof message.text !== "string" || !message.text.trim() || message.text.length > MAX_TEXT) throw new TypeError("Invalid message");
    return { role: message.role, text: message.text.trim() };
  });
  if (clean.at(-1).role !== "user") throw new TypeError("Last message must be from user");
  return clean;
}
/* Caller must implement server-side authentication, verified adult eligibility, CSRF protection and rate limiting. Context must come from the trusted server. */
export function createChatService({ authorize, generate } = {}) {
  if (typeof authorize !== "function" || typeof generate !== "function") throw new TypeError("Explicit authorization and provider are required");
  return async function chat({ context, messages } = {}) {
    try { if (await authorize(context) !== true) return { status: 403, error: "Access denied" }; }
    catch { return { status: 403, error: "Access denied" }; }
    let cleaned;
    try { cleaned = validateChatMessages(messages); }
    catch { return { status: 400, error: "Invalid conversation" }; }
    try {
      const reply = await generate({ system: SYSTEM, messages: cleaned });
      if (typeof reply !== "string" || !reply.trim() || reply.length > MAX_TEXT) throw new Error("Invalid provider response");
      return { status: 200, reply: reply.trim() };
    } catch { return { status: 503, error: "Chat service unavailable" }; }
  };
}
