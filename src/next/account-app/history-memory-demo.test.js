import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMemoryHistoryDemo } from './history-memory-demo.js';

let serial = 0;
const makeId = () => `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}`;
const make = () => createMemoryHistoryDemo({ makeId, now: () => '2026-01-01T00:00:00.000Z' });

test('synthetic conversations can be created, listed, read and deleted', async () => {
  const demo = make();
  const first = await demo.create('  Voorbeeld  ');
  const second = await demo.create('Tweede');
  assert.equal(first.title, 'Voorbeeld');
  assert.deepEqual((await demo.list()).map(c => c.id), [second.id, first.id]);
  const message = await demo.addUserMessage(first.id, '  Toetsboodskap  ');
  assert.equal(message.role, 'user');
  assert.equal(message.body, 'Toetsboodskap');
  assert.deepEqual(await demo.messages(first.id), [message]);
  await demo.remove(first.id);
  await assert.rejects(demo.messages(first.id), /unavailable/);
  assert.equal((await demo.list()).length, 1);
});

test('separate instances share nothing and returned objects cannot mutate the store', async () => {
  const a = make(), b = make();
  const c = await a.create('A');
  const msg = await a.addUserMessage(c.id, 'hello');
  msg.body = 'changed';
  const list = await a.list(); list[0].title = 'changed';
  const messages = await a.messages(c.id); messages[0].body = 'changed again';
  assert.equal((await a.list())[0].title, 'A');
  assert.equal((await a.messages(c.id))[0].body, 'hello');
  assert.deepEqual(await b.list(), []);
  await assert.rejects(b.messages(c.id), /unavailable/);
  await assert.rejects(b.remove(c.id), /unavailable/);
});

test('rejects invalid inputs and duplicate generated ids', async () => {
  const fixed = '00000000-0000-4000-8000-000000000001';
  const demo = createMemoryHistoryDemo({makeId: () => fixed});
  await assert.rejects(demo.create('  '), TypeError);
  await assert.rejects(demo.create('x'.repeat(121)), TypeError);
  const c = await demo.create('ok');
  await assert.rejects(demo.create('another'), /unavailable/);
  await assert.rejects(demo.addUserMessage(c.id, 'x'.repeat(4001)), TypeError);
  await assert.rejects(demo.messages('not a uuid'), TypeError);
});

test('enforces explicit memory bounds without silently dropping entries', async () => {
  const demo = make(), c = await demo.create('a');
  for (let i = 0; i < 500; i++) await demo.addUserMessage(c.id, `message ${i}`);
  await assert.rejects(demo.addUserMessage(c.id, 'overflow'), /limit/);
  assert.equal((await demo.messages(c.id)).length, 500);
  for (let i = 1; i < 100; i++) await demo.create(`c${i}`);
  await assert.rejects(demo.create('overflow'), /limit/);
  assert.equal((await demo.list()).length, 100);
});

test('isolated demo is not wired to app or network or persistent device storage', async () => {
  const code = await readFile(new URL('./history-memory-demo.js', import.meta.url), 'utf8');
  assert.doesNotMatch(code, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|supabase)\b/i);
  for (const filename of ['index.html', 'main.js', 'controller.js', 'tools-prototype.js', 'vite.config.js']) {
    const source = await readFile(new URL(filename, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /history-memory-demo/);
  }
});
