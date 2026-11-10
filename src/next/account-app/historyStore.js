// Unconnected development foundation. Data is private only if the server enforces RLS.
// Never use a service-role client in a browser. All failures are intentionally generic.
export function createConversationStore(client) {
  if (!client || typeof client.from !== 'function') throw new TypeError('A configured client is required');
  const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
  async function query(run) {
    try {
      const result = await run();
      if (!result || result.error) throw new Error();
      return result.data;
    } catch { throw new Error('Conversation storage unavailable'); }
  }
  return {
    async list() {
      return query(() => client.from('slim_conversations').select('id,title,created_at').order('created_at', { ascending: false }).limit(100));
    },
    async create(title) {
      if (!text(title, 120)) throw new TypeError('Invalid title');
      return query(() => client.from('slim_conversations').insert({ title: title.trim() }).select('id,title,created_at').single());
    },
    async messages(id) {
      if (!uuid(id)) throw new TypeError('Invalid conversation');
      return query(() => client.from('slim_messages').select('id,role,body,created_at').eq('conversation_id', id).order('created_at', { ascending: true }).order('id', { ascending: true }).limit(500));
    },
    async addUserMessage(id, body) {
      if (!uuid(id) || !text(body, 4000)) throw new TypeError('Invalid message');
      return query(() => client.from('slim_messages').insert({ conversation_id: id, role: 'user', body: body.trim() }).select('id,role,body,created_at').single());
    },
    async remove(id) {
      if (!uuid(id)) throw new TypeError('Invalid conversation');
      const rows = await query(() => client.from('slim_conversations').delete().eq('id', id).select('id'));
      // RLS makes an inaccessible or absent row look identical; do not claim it was deleted.
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Conversation could not be deleted');
    }
  };
}
