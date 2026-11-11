import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = name => readFile(new URL(name, import.meta.url), 'utf8');

test('account and local tools preview link to each other without claiming account protection', async () => {
  const [account, tools] = await Promise.all([source('./index.html'), source('./tools-prototype.html')]);
  assert.match(account, /href="\.\/tools-prototype\.html#game"/);
  assert.match(account, /href="\.\/tools-prototype\.html#drawing-section"/);
  assert.match(account, /href="#account"/);
  assert.match(account, /nie aan jou rekening gekoppel nie/);
  assert.match(account, /word nog gebou en is nie beskikbaar nie/);
  assert.match(tools, /id="game"/);
  assert.match(tools, /id="drawing-section"/);
  assert.match(tools, /href="\.\/index\.html"/);
  assert.match(tools, /Niks word outomaties gestoor of gesinkroniseer nie/);
  assert.match(tools, /Internet is nodig/);
  assert.match(tools, /AI en WhatsApp-integrasie is nie hier gekoppel nie/);
});

test('device-local tools do not use network, browser storage, or account APIs', async () => {
  const code = (await Promise.all([source('./tools-prototype.js'), source('./tools-game.js'), source('./drawing-guard.js'), source('./drawing-download.js')])).join('\n');
  assert.doesNotMatch(code, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|supabase)\b/i);
  assert.doesNotMatch(code, /https?:\/\//i);
});
