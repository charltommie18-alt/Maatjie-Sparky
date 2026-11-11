import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createMemoryHistoryDemo } from './history-memory-demo.js';

class Element {
  constructor() { this.children = []; this.textContent = ''; this.disabled = false; this.handlers = {}; this.attributes = {}; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(node) { this.children.push(node); }
  replaceChildren() { this.children = []; }
  click() { if (!this.disabled) this.handlers.click?.(); }
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
test('example screen creates, selects and confirms deletion using in-memory data', async () => {
  const ids = ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'];
  const els = Object.fromEntries(['list','messages','status','selected-title','sample','remove'].map(id => [id, new Element()]));
  let confirmed = false;
  const document = { getElementById: id => els[id], createElement: () => new Element() };
  const raw = await readFile(new URL('./history-demo-entry.js', import.meta.url), 'utf8');
  const code = raw.replace("import { createMemoryHistoryDemo } from './history-memory-demo.js';", '');
  runInNewContext(code, { document, window: { confirm: () => confirmed }, createMemoryHistoryDemo: () => createMemoryHistoryDemo({ makeId: () => ids.shift() }) });
  els.sample.click(); await tick();
  assert.equal(els.list.children.length, 1);
  assert.equal(els['selected-title'].textContent, 'Voorbeeldgesprek');
  assert.equal(els.messages.children[0].textContent, 'Hierdie is ’n voorafbepaalde toetsboodskap.');
  assert.equal(els.remove.disabled, false);
  els.remove.click(); await tick(); assert.equal(els.list.children.length, 1);
  confirmed = true; els.remove.click(); await tick();
  assert.equal(els.list.children.length, 0);
  assert.equal(els.messages.children.length, 0);
  assert.equal(els.remove.disabled, true);
  assert.equal(els.status.textContent, 'Voorbeeld uitgevee.');
});
