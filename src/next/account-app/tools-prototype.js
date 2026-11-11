import { newGame, move } from './tools-game.js';
import { createDrawingGuard } from './drawing-guard.js';
import { downloadDrawing } from './drawing-download.js';
const $ = id => document.getElementById(id);
const board = $('board'), status = $('game-status');
let state = newGame();
const squares = state.board.map((_, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.addEventListener('click', () => {
    const next = move(state, index);
    if (next === state) return;
    state = next;
    renderGame();
    // A played square becomes disabled; move focus to a playable square or reset.
    const nextSquare = squares.find(square => !square.disabled);
    (nextSquare || $('game-reset')).focus();
  });
  board.append(button);
  return button;
});
function renderGame() {
  state.board.forEach((mark, index) => {
    const button = squares[index];
    button.textContent = mark || ' ';
    button.disabled = !!mark || !!state.winner || state.draw;
    button.setAttribute('aria-label', `Blokkie ${index + 1}: ${mark || 'leeg'}`);
  });
  status.textContent = state.winner ? `${state.winner} wen` : state.draw ? 'Gelykop' : `${state.turn} se beurt`;
}
$('game-reset').addEventListener('click', () => { state = newGame(); renderGame(); squares[0].focus(); });
renderGame();
const canvas = $('drawing'), ctx = canvas.getContext('2d'), drawStatus = $('draw-status');
const undo = $('drawing-undo'), drawingGuard = createDrawingGuard(window);
let drawing = false, pointer, previousImage = null, captured = false;
function point(event) {
  const r = canvas.getBoundingClientRect();
  if (!(r.width > 0 && r.height > 0) || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;
  return { x: (event.clientX-r.left)*canvas.width/r.width, y: (event.clientY-r.top)*canvas.height/r.height };
}
if (!ctx) { drawStatus.textContent = 'Die tekenbord is nie op hierdie toestel beskikbaar nie.'; $('drawing-clear').disabled = true; $('drawing-save').disabled = true; }
else {
  canvas.addEventListener('pointerdown', event => {
    if (drawing || event.button !== 0) return;
    const p = point(event);
    if (!p) { drawStatus.textContent = 'Die tekenbord is tans nie beskikbaar nie.'; return; }
    event.preventDefault();
    try { canvas.setPointerCapture(event.pointerId); captured = true; }
    catch { drawStatus.textContent = 'Kon nie begin teken nie. Probeer weer.'; return; }
    // Keep only one pre-stroke image, in memory, never persistent storage.
    previousImage = null;
    try { previousImage = ctx.getImageData(0, 0, canvas.width, canvas.height); }
    catch { drawStatus.textContent = 'Ongedaan maak is nie beskikbaar vir hierdie streep nie.'; }
    undo.disabled = true;
    drawing = true; pointer = event.pointerId;
    ctx.strokeStyle = $('colour').value; ctx.lineWidth = Number($('width').value);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(p.x,p.y);
    ctx.lineTo(p.x+0.01,p.y+0.01); ctx.stroke(); drawingGuard.markChanged();
  });
  canvas.addEventListener('pointermove', event => { if (!drawing || event.pointerId !== pointer) return; const p = point(event); if (!p) return; ctx.lineTo(p.x,p.y); ctx.stroke(); drawingGuard.markChanged(); });
  const stop = event => { if (drawing && event.pointerId === pointer) { drawing = false; pointer = undefined; captured = false; ctx.closePath(); undo.disabled = !previousImage; } };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop); canvas.addEventListener('lostpointercapture', stop);
  undo.addEventListener('click', () => {
    if (drawing || !previousImage) return;
    try { ctx.putImageData(previousImage, 0, 0); previousImage = null; undo.disabled = true; drawStatus.textContent = 'Laaste streep ongedaan gemaak.'; }
    catch { previousImage = null; undo.disabled = true; drawStatus.textContent = 'Kon nie die streep ongedaan maak nie.'; }
    // Stay conservative: the restored image may still contain unsaved work.
  });
  $('drawing-clear').addEventListener('click', () => {
    if (!window.confirm('Vee die tekening uit? Dit kan nie ongedaan gemaak word nie.')) return;
    if (drawing) {
      const activePointer = pointer;
      drawing = false; pointer = undefined; ctx.closePath();
      if (captured) { try { canvas.releasePointerCapture(activePointer); } catch {} captured = false; }
    }
    ctx.clearRect(0,0,canvas.width,canvas.height); previousImage = null; undo.disabled = true; drawingGuard.clear(); drawStatus.textContent = 'Tekening uitgevee.';
  });
  $('drawing-save').addEventListener('click', () => downloadDrawing(canvas, () => document.createElement('a'), URL, setTimeout, message => { drawStatus.textContent = message; }));
}
