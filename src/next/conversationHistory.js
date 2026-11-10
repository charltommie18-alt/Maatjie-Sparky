/* Foundation only: not yet connected to the application. Local storage is not encrypted. */
const DEFAULT_KEY = "maatjie_next_history_v1";
const MAX_MESSAGES = 500;
const MAX_TEXT_LENGTH = 20000;

function validate(messages) {
  if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
    throw new TypeError("Invalid or oversized conversation history");
  }
  return messages.map((message) => {
    if (!message || typeof message !== "object" ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.text !== "string" || message.text.length > MAX_TEXT_LENGTH ||
        typeof message.createdAt !== "string" || Number.isNaN(Date.parse(message.createdAt))) {
      throw new TypeError("Invalid conversation message");
    }
    return { role: message.role, text: message.text, createdAt: message.createdAt };
  });
}

export function createHistoryStore(storage, key = DEFAULT_KEY) {
  if (!storage || typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function" || typeof storage.removeItem !== "function") {
    throw new TypeError("A compatible storage object is required");
  }
  return {
    load() {
      const raw = storage.getItem(key);
      if (raw === null) return [];
      const envelope = JSON.parse(raw);
      if (!envelope || envelope.version !== 1) throw new TypeError("Unsupported conversation history version");
      return validate(envelope.messages);
    },
    save(messages, consent) {
      if (consent !== true) throw new Error("Saving requires explicit consent");
      const validated = validate(messages);
      storage.setItem(key, JSON.stringify({ version: 1, messages: validated }));
    },
    clear() {
      storage.removeItem(key);
    },
    exportJson() {
      return JSON.stringify({ version: 1, messages: this.load() }, null, 2);
    }
  };
}
