import { test } from 'node:test';
import assert from 'node:assert/strict';

test('game keeps controls stable and moves focus after a move, win and reset', async () => {
  let focused;
  class Element {
    constructor() { this.listeners = {}; this.children = []; this.attrs = {}; this.disabled = false; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute(name, value) { this.attrs[name] = value; }
    append(child) { this.children.push(child); }
    focus() { focused = this; }
    click() { if (!this.disabled) this.listeners.click?.(); }
  }
  const ids = ['board','game-status','game-reset','drawing','draw-status','drawing-undo','drawing-clear','drawing-save','colour','width'];
  const els = Object.fromEntries(ids.map(id => [id, new Element()]));
  els.drawing.getContext = () => null;
  const oldWindow = globalThis.window, oldDocument = globalThis.document;
  globalThis.window = { addEventListener(){}, removeEventListener(){} };
  globalThis.document = { getElementById: id => els[id], createElement: () => new Element() };
  try {
    await import('./tools-prototype.js?game-ui-test');
    const squares = els.board.children;
    const firstSquare = squares[0];
    assert.equal(squares.length, 9);
    assert.equal(squares[0].attrs['aria-label'], 'Blokkie 1: leeg');
    squares[0].click();
    assert.equal(squares[0].attrs['aria-label'], 'Blokkie 1: X');
    assert.equal(squares[0].disabled, true);
    assert.equal(focused, squares[1]);
    assert.equal(els['game-status'].textContent, 'O se beurt');
    for (const i of [3,1,4,2]) squares[i].click();
    assert.equal(els['game-status'].textContent, 'X wen');
    assert.ok(squares.every(square => square.disabled));
    assert.equal(focused, els['game-reset']);
    els['game-reset'].click();
    assert.equal(focused, squares[0]);
    assert.equal(els.board.children.length, 9);
    assert.equal(els.board.children[0], firstSquare);
    assert.equal(squares[0].attrs['aria-label'], 'Blokkie 1: leeg');
    assert.equal(els['game-status'].textContent, 'X se beurt');
  } finally { globalThis.window = oldWindow; globalThis.document = oldDocument; }
});
