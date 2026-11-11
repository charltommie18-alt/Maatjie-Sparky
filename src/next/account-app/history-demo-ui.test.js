import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = name => readFile(new URL(name, import.meta.url), 'utf8');

test('development screen is clearly temporary and only accepts fixed example data', async () => {
  const [html, code] = await Promise.all([source('./history-demo.html'), source('./history-demo-entry.js')]);
  assert.match(html, /Geen rekening, AI of databasis is gekoppel nie/);
  assert.match(html, /verdwyn wanneer hierdie bladsy herlaai of toegemaak word/);
  assert.doesNotMatch(html, /<(?:input|textarea|form)\b/i);
  assert.match(code, /confirm\(/);
  assert.match(code, /\.textContent\s*=/);
  assert.doesNotMatch(code, /innerHTML|outerHTML|insertAdjacentHTML/);
  assert.doesNotMatch(code, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|supabase)\b/i);
});

test('private preview links synthetic demo without connecting account or AI', async () => {
  const [account, demo, config] = await Promise.all([source('./index.html'), source('./history-demo.html'), source('./vite.config.js')]);
  assert.match(account, /href="\.\/history-demo\.html"/);
  assert.match(account, /gebruik net vaste voorbeelde en stoor niks nie/);
  assert.match(demo, /href="\.\/index\.html"/);
  assert.match(config, /historyDemo:.*history-demo\.html/);
  for (const filename of ['main.js', 'controller.js', 'tools-prototype.html', 'tools-prototype.js', 'public/sw.js']) {
    assert.doesNotMatch(await source(`./${filename}`), /history-demo(?:\.html|-entry|\.css)/);
  }
});
