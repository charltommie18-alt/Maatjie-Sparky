import { createHistoryStore } from "./conversationHistory.js";
import { requestChatReply } from "./chatClient.js";

/* Not connected to the current app. Local history is unencrypted and device-specific. */
export function createChatSession(storage, request = requestChatReply) {
  const store = createHistoryStore(storage);
  let messages = [];
  let saving = false;
  let busy = false;
  const getMessages = () => messages.map((message) => ({ ...message }));
  const persist = () => { if (saving) store.save(messages, true); };
  const requireIdle = () => { if (busy) throw new Error("Chat request is in progress"); };
  return {
    getMessages,
    isSaving: () => saving,
    enableSaving() {
      requireIdle();
      const previous = store.load();
      if (messages.length && previous.length) {
        throw new Error("Existing saved history must be resolved before saving this session");
      }
      if (previous.length) messages = previous;
      store.save(messages, true);
      saving = true;
      return getMessages();
    },
    disableSaving() { requireIdle(); saving = false; },
    clear() {
      requireIdle();
      store.clear();
      messages = [];
    },
    exportJson() { return JSON.stringify({ version: 1, messages: getMessages() }, null, 2); },
    async send(text) {
      requireIdle();
      if (typeof text !== "string" || !text.trim() || text.length > 4000) throw new TypeError("Invalid message");
      if (messages.length > 498) throw new Error("Conversation limit reached; export or clear it first");
      busy = true;
      try {
        const outgoing = { role: "user", text: text.trim(), createdAt: new Date().toISOString() };
        messages = [...messages, outgoing];
        persist();
        const reply = await request(getMessages());
        if (!reply || reply.role !== "assistant" || typeof reply.text !== "string" || !reply.text.trim() || reply.text.length > 4000 || typeof reply.createdAt !== "string" || Number.isNaN(Date.parse(reply.createdAt))) {
          throw new Error("Invalid response from chat service");
        }
        messages = [...messages, { role: "assistant", text: reply.text.trim(), createdAt: reply.createdAt }];
        persist();
        return getMessages();
      } finally { busy = false; }
    }
  };
}
