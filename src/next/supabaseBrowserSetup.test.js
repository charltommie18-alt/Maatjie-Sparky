import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareSupabaseBrowserAccount } from './supabaseBrowserSetup.js';
const url = 'https://example.supabase.co';
const publishableKey = 'sb_publishable_test123';
function fakeClient(url, key, options) {
  assert.equal(url, 'https://example.supabase.co');
  assert.equal(key, publishableKey);
  assert.deepEqual(options.auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
  return { auth: {
    signUp: async () => ({ error: null }), signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null }), getUser: async () => ({ data: { user: { id: 'user', email_confirmed_at: 'today' } }, error: null })
  } };
}
test('prepares account boundary using only explicit public config', async () => {
  const account = prepareSupabaseBrowserAccount({ createClient: fakeClient, url, publishableKey });
  assert.equal((await account.signIn('u@example.test', 'pw')).ok, true);
  assert.deepEqual(await account.verifiedUser(), { id: 'user' });
});
test('fails closed on missing or invalid configuration and secrets', () => {
  let calls = 0; const createClient = () => { calls++; };
  for (const changes of [ { url: '' }, { url: 'http://example.supabase.co' }, { url: 'https://supabase.co.evil.test' }, { url: 'https://user@example.supabase.co' }, { url: 'https://example.supabase.co/path' }, { url: 'https://example.supabase.co?x=1' }, { publishableKey: 'sb_secret_test' }, { publishableKey: 'eyJ.fake.jwt' }, { publishableKey: '' } ]) {
    assert.equal(prepareSupabaseBrowserAccount({ createClient, url, publishableKey, ...changes }), null);
  }
  assert.equal(calls, 0);
  assert.equal(prepareSupabaseBrowserAccount(), null);
  assert.equal(prepareSupabaseBrowserAccount({ createClient: () => { throw Error('private'); }, url, publishableKey }), null);
  assert.equal(prepareSupabaseBrowserAccount({ createClient: () => ({}), url, publishableKey }), null);
});
