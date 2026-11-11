import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function setup({ fetcher, cacheNames = [] } = {}) {
  const listeners = {}; const stored = new Map(); const calls = []; const deleted = [];
  const cache = { put: async (k, v) => stored.set(k, v), match: async k => stored.get(k) };
  const ctx = { URL, Response, self: { registration: { scope: 'https://app.test/slim/' }, clients: { claim: async () => {} }, addEventListener: (k, f) => listeners[k] = f }, caches: { open: async () => cache, keys: async () => cacheNames, delete: async k => { deleted.push(k); } }, fetch: fetcher || (async (url, opts) => { calls.push({url, opts}); return new Response('<title>Slim Maat is vanlyn</title>', { headers: { 'content-type': 'text/html' } }); }) };
  vm.runInNewContext(await readFile(new URL('./public/sw.js', import.meta.url), 'utf8'), ctx);
  return { listeners, stored, calls, deleted };
}
function fireWait(handler) { let promise; handler({ waitUntil: p => { promise = p; } }); return promise; }
function fireFetch(handler, request) { let promise; handler({ request, respondWith: p => { promise = p; } }); return promise; }

test('install stores only a fixed generic offline page without fetching user data', async () => {
  let fetches = 0;
  const s = await setup({ fetcher: async () => { fetches++; return new Response('<title>Slim Maat is vanlyn</title><p>PRIVATE USER DATA</p>', { headers: { 'content-type': 'text/html' } }); } });
  await fireWait(s.listeners.install);
  assert.deepEqual([...s.stored.keys()], ['https://app.test/slim/offline.html']);
  assert.equal(fetches, 0);
  const html = await s.stored.get('https://app.test/slim/offline.html').text();
  assert.match(html, /Slim Maat is vanlyn/);
  assert.doesNotMatch(html, /PRIVATE USER DATA/);
});
test('activation removes only old versions of this app offline cache', async () => {
  const s = await setup({ cacheNames: ['slim-maat-account-offline-v1', 'slim-maat-account-offline-v2', 'other-app-cache'] });
  await fireWait(s.listeners.activate);
  assert.deepEqual(s.deleted, ['slim-maat-account-offline-v1']);
});
test('online navigation returns network response without caching private data', async () => {
  const calls = [];
  const s = await setup({ fetcher: async (request, options) => { calls.push({ request, options }); return new Response('PRIVATE USER DATA'); } });
  await fireWait(s.listeners.install);
  const request = { method:'GET', mode:'navigate', url:'https://app.test/slim/' };
  const response = await fireFetch(s.listeners.fetch, request);
  assert.equal(await response.text(), 'PRIVATE USER DATA');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].request, request);
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(s.stored.size, 1);
  assert.doesNotMatch(await s.stored.get('https://app.test/slim/offline.html').text(), /PRIVATE USER DATA/);
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
