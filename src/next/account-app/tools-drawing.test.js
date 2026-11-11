import { test } from 'node:test';
import assert from 'node:assert/strict';

test('drawing warning follows strokes and confirmed clear, not attempted downloads', async () => {
  class Element {
    constructor() { this.listeners = {}; this.value = ''; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute() {}
    replaceChildren() {}
    append() {}
    click() { this.clicked = true; }
  }
  const ids = ['board','game-status','game-reset','drawing','draw-status','drawing-undo','drawing-clear','drawing-save','colour','width'];
  const els = Object.fromEntries(ids.map(id => [id, new Element()]));
  els.colour.value = '#284b9b'; els.width.value = '4';
  const canvas = els.drawing; canvas.width = 900; canvas.height = 600;
  canvas.getBoundingClientRect = () => ({left:0,top:0,width:300,height:200});
  canvas.setPointerCapture = () => {};
  let cleared = 0, restored = 0, failCapture = false, failRestore = false;
  const snapshot = {pixels: 'before stroke'};
  canvas.getContext = () => ({beginPath(){},moveTo(){},lineTo(){},stroke(){},closePath(){},clearRect(){cleared++;}, getImageData(){if (failCapture) throw Error('unavailable'); return snapshot;}, putImageData(image){if (failRestore) throw Error('unavailable'); assert.equal(image, snapshot); restored++;}});
  canvas.toBlob = callback => callback(null);
  const handlers = new Set(); let confirm = false;
  const oldWindow = globalThis.window, oldDocument = globalThis.document;
  globalThis.window = {
    addEventListener(type, fn) { assert.equal(type, 'beforeunload'); handlers.add(fn); },
    removeEventListener(type, fn) { assert.equal(type, 'beforeunload'); handlers.delete(fn); },
    confirm() { return confirm; }
  };
  globalThis.document = { getElementById: id => els[id], createElement: () => new Element() };
  try {
    await import('./tools-prototype.js');
    assert.equal(handlers.size, 0);
    canvas.listeners.pointerdown({ button:0, pointerId:1, clientX:10, clientY:10, preventDefault(){} });
    assert.equal(handlers.size, 1);
    assert.equal(els['drawing-undo'].disabled, true);
    canvas.listeners.pointerup({pointerId:1});
    assert.equal(els['drawing-undo'].disabled, false);
    els['drawing-undo'].listeners.click();
    assert.equal(restored, 1); assert.equal(els['drawing-undo'].disabled, true);
    assert.equal(handlers.size, 1);
    els['drawing-undo'].listeners.click(); assert.equal(restored, 1);
    failCapture = true;
    canvas.listeners.pointerdown({ button:0, pointerId:2, clientX:10, clientY:10, preventDefault(){} });
    canvas.listeners.pointerup({pointerId:2});
    assert.equal(els['drawing-undo'].disabled, true);
    assert.match(els['draw-status'].textContent, /nie beskikbaar/);
    failCapture = false; failRestore = true;
    canvas.listeners.pointerdown({ button:0, pointerId:3, clientX:10, clientY:10, preventDefault(){} });
    canvas.listeners.pointerup({pointerId:3});
    els['drawing-undo'].listeners.click();
    assert.match(els['draw-status'].textContent, /Kon nie die streep/);
    assert.equal(els['drawing-undo'].disabled, true); assert.equal(handlers.size, 1);
    failRestore = false;
    canvas.listeners.pointerdown({ button:0, pointerId:4, clientX:10, clientY:10, preventDefault(){} });
    canvas.listeners.pointerup({pointerId:4});
    els['drawing-save'].listeners.click();
    assert.match(els['draw-status'].textContent, /Kon nie/);
    assert.equal(handlers.size, 1);
    els['drawing-clear'].listeners.click();
    assert.equal(cleared, 0); assert.equal(handlers.size, 1);
    confirm = true; els['drawing-clear'].listeners.click();
    assert.equal(cleared, 1); assert.equal(handlers.size, 0);
    assert.equal(els['drawing-undo'].disabled, true);
    els['drawing-undo'].listeners.click(); assert.equal(restored, 1);
    canvas.listeners.pointerdown({ button:0, pointerId:5, clientX:10, clientY:10, preventDefault(){} });
    els['drawing-clear'].listeners.click();
    canvas.listeners.pointermove({pointerId:5, clientX:12, clientY:12});
    canvas.listeners.pointerup({pointerId:5});
    assert.equal(handlers.size, 0); assert.equal(els['drawing-undo'].disabled, true);
  } finally {
    globalThis.window = oldWindow; globalThis.document = oldDocument;
  }
});
