// Isolated development fixture, NOT persistent storage or an authentication boundary.
// No network, device storage, AI, account data or automatic activation.
// Only use synthetic data. Each instance is separate and disappears when discarded.
export function createMemoryHistoryDemo({ makeId = () => globalThis.crypto.randomUUID(), now = () => new Date().toISOString() } = {}) {
  const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
  const conversations = new Map();
  const issuedIds = new Set();
  function freshId() {
    const id = makeId();
    if (!uuid(id) || issuedIds.has(id.toLowerCase())) throw new Error('Demo unavailable');
    issuedIds.add(id.toLowerCase());
    return id;
  }
  function get(id) {
    if (!uuid(id)) throw new TypeError('Invalid conversation');
    const item = conversations.get(id);
    if (!item) throw new Error('Conversation unavailable');
    return item;
  }
  return {
    async list() {
      return Array.from(conversations.values(), ({ id, title, created_at }) => ({ id, title, created_at })).reverse();
    },
    async create(title) {
      if (!text(title, 120)) throw new TypeError('Invalid title');
      if (conversations.size >= 100) throw new Error('Demo conversation limit reached');
      const item = { id: freshId(), title: title.trim(), created_at: now(), messages: [] };
      conversations.set(item.id, item);
      return { id: item.id, title: item.title, created_at: item.created_at };
    },
    async messages(id) {
      return get(id).messages.map(message => ({ ...message }));
    },
    async addUserMessage(id, body) {
      if (!uuid(id) || !text(body, 4000)) throw new TypeError('Invalid message');
      const item = get(id);
      if (item.messages.length >= 500) throw new Error('Demo message limit reached');
      const message = { id: freshId(), role: 'user', body: body.trim(), created_at: now() };
      item.messages.push(message);
      return { ...message };
    },
    async remove(id) {
      get(id);
      conversations.delete(id);
    }
  };
}
