import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDrawingGuard } from './drawing-guard.js';

test('registers one browser leave warning on drawing, removed only on explicit clear', () => {
  const handlers = new Set(); let adds = 0, removes = 0;
  const target = {
    addEventListener(type, handler) { assert.equal(type, 'beforeunload'); adds++; handlers.add(handler); },
    removeEventListener(type, handler) { assert.equal(type, 'beforeunload'); removes++; handlers.delete(handler); }
  };
  const guard = createDrawingGuard(target);
  guard.clear(); assert.equal(removes, 0);
  guard.markChanged(); guard.markChanged();
  assert.equal(adds, 1); assert.equal(handlers.size, 1);
  let prevented = false;
  const event = { returnValue: undefined, preventDefault() { prevented = true; } };
  [...handlers][0](event);
  assert.equal(prevented, true); assert.equal(event.returnValue, true);
  guard.clear(); guard.clear(); assert.equal(removes, 1); assert.equal(handlers.size, 0);
  guard.markChanged(); assert.equal(adds, 2); assert.equal(handlers.size, 1);
});
