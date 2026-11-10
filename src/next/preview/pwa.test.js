import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
const base = 'https://example.test/src/next/preview/';
function setup(fail = false) {
  const listeners = {}; const data = new Map(); let deleted = false;
  const cache = { async put(url, value) { data.set(url, value); }, async match(url) { return data.get(url); } };
  const caches = { async open() { return cache; }, async keys() { return []; }, async delete() { deleted = true; data.clear(); } };
  const fetch = async (url, opts) => {
    assert.equal(opts.credentials, 'omit');
    const u = new URL(url); const ext = u.pathname.split('.').pop();
    const types = { js: 'text/javascript', css: 'text/css', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
    return { ok: true, redirected: false, headers: { get: () => fail && ext === 'js' ? 'text/html' : (types[ext] || 'text/html') } };
  };
  vm.runInNewContext(code, { URL, Set, caches, fetch, self: { location: { href: base + 'sw.js' }, clients: { async claim() {} }, addEventListener(type, fn) { listeners[type] = fn; } } });
  return { listeners, data, deleted: () => deleted };
}
async function install(s) { let promise; s.listeners.install({ waitUntil(p) { promise = p; } }); return promise; }
test('shell allowlist caches no auth, account or arbitrary URLs', async () => {
  const s = setup(); await install(s); assert.equal(s.data.size, 12);
  assert.ok([...s.data.keys()].every(x => !/account|supabase|\/api\/|\?/.test(x)));
  for (const [url, method] of [[base + 'account.html', 'GET'], [base + 'index.html?token=x', 'GET'], [base + 'index.html', 'POST'], ['https://elsewhere.test/index.html', 'GET']]) {
    let intercepted = false; s.listeners.fetch({ request: { url, method }, respondWith() { intercepted = true; } }); assert.equal(intercepted, false);
  }
  let response; s.listeners.fetch({ request: { url: base + 'index.html', method: 'GET' }, respondWith(p) { response = p; } });
  assert.ok(await response);
});
test('bad shell content fails installation and removes incomplete cache', async () => {
  const s = setup(true); await assert.rejects(install(s), /Invalid preview shell asset/); assert.equal(s.deleted(), true); assert.equal(s.data.size, 0);
});
test('manifest is scoped to preview with two installable icons', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('./manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(new URL(manifest.start_url, base).href, base); assert.equal(new URL(manifest.scope, base).href, base);
  assert.ok(manifest.icons.some(x => x.sizes === '192x192')); assert.ok(manifest.icons.some(x => x.sizes === '512x512'));
});
