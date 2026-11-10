import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function setup({ fetcher } = {}) {
  const listeners = {}; const stored = new Map(); const calls = [];
  const cache = { put: async (k, v) => stored.set(k, v), match: async k => stored.get(k) };
  const ctx = { URL, Response, self: { registration: { scope: 'https://app.test/slim/' }, clients: { claim: async () => {} }, addEventListener: (k, f) => listeners[k] = f }, caches: { open: async () => cache, keys: async () => [], delete: async () => {} }, fetch: fetcher || (async (url, opts) => { calls.push({url, opts}); return new Response('<title>Slim Maat is vanlyn</title>', { headers: { 'content-type': 'text/html' } }); }) };
  vm.runInNewContext(await readFile(new URL('./public/sw.js', import.meta.url), 'utf8'), ctx);
  return { listeners, stored, calls };
}
function fireWait(handler) { let promise; handler({ waitUntil: p => { promise = p; } }); return promise; }
function fireFetch(handler, request) { let promise; handler({ request, respondWith: p => { promise = p; } }); return promise; }

test('install only stores the verified static offline page', async () => {
  const { listeners, stored, calls } = await setup(); await fireWait(listeners.install);
  assert.deepEqual([...stored.keys()], ['https://app.test/slim/offline.html']);
  assert.equal(calls[0].opts.credentials, 'same-origin'); assert.equal(calls[0].opts.redirect, 'error');
});
test('rejects login or unexpected HTML instead of caching it', async () => {
  const s = await setup({ fetcher: async () => new Response('<title>Sign in</title>', {headers:{'content-type':'text/html'}}) });
  await assert.rejects(fireWait(s.listeners.install)); assert.equal(s.stored.size, 0);
});
test('ignores authentication, other requests and unrelated URLs', async () => {
  const { listeners } = await setup();
  for (const r of [
    { method: 'POST', mode: 'navigate', url: 'https://app.test/slim/' },
    { method: 'GET', mode: 'cors', url: 'https://api.test/auth/v1/token' },
    { method: 'GET', mode: 'navigate', url: 'https://other.test/slim/' },
    { method: 'GET', mode: 'navigate', url: 'https://app.test/other/' },
    { method: 'GET', mode: 'same-origin', url: 'https://app.test/slim/user-data' }
  ]) assert.equal(fireFetch(listeners.fetch, r), undefined);
});
test('navigation uses the network then shows only generic page on network failure', async () => {
  let failed = false;
  const s = await setup({ fetcher: async () => { if (failed) throw Error('offline'); return new Response('<title>Slim Maat is vanlyn</title>', {headers:{'content-type':'text/html'}}); } });
  await fireWait(s.listeners.install); failed = true;
  const response = await fireFetch(s.listeners.fetch, { method:'GET', mode:'navigate', url:'https://app.test/slim/' });
  assert.match(await response.text(), /Slim Maat is vanlyn/); assert.equal(s.stored.size, 1);
});
test('manifest stays scoped to app', async () => {
  const m = JSON.parse(await readFile(new URL('./public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(m.scope, './'); assert.equal(m.start_url, './'); assert.equal(m.icons.length, 2);
});
