import { newGame, move } from './tools-game.js';
const $ = id => document.getElementById(id);
const board = $('board'), status = $('game-status');
let state = newGame();
function renderGame() {
  board.replaceChildren();
  state.board.forEach((mark, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = mark || ' '; button.disabled = !!mark || !!state.winner || state.draw;
    button.setAttribute('aria-label', `Blokkie ${index + 1}: ${mark || 'leeg'}`);
    button.addEventListener('click', () => { state = move(state, index); renderGame(); });
    board.append(button);
  });
  status.textContent = state.winner ? `${state.winner} wen` : state.draw ? 'Gelykop' : `${state.turn} se beurt`;
}
$('game-reset').addEventListener('click', () => { state = newGame(); renderGame(); });
renderGame();
const canvas = $('drawing'), ctx = canvas.getContext('2d'), drawStatus = $('draw-status');
let drawing = false, pointer;
function point(event) { const r = canvas.getBoundingClientRect(); return { x: (event.clientX-r.left)*canvas.width/r.width, y: (event.clientY-r.top)*canvas.height/r.height }; }
if (!ctx) { drawStatus.textContent = 'Die tekenbord is nie op hierdie toestel beskikbaar nie.'; $('drawing-clear').disabled = true; $('drawing-save').disabled = true; }
else {
  canvas.addEventListener('pointerdown', event => { if (drawing || event.button !== 0) return; event.preventDefault(); drawing = true; pointer = event.pointerId; canvas.setPointerCapture(pointer); const p = point(event); ctx.strokeStyle = $('colour').value; ctx.lineWidth = Number($('width').value); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+0.01,p.y+0.01); ctx.stroke(); });
  canvas.addEventListener('pointermove', event => { if (!drawing || event.pointerId !== pointer) return; const p = point(event); ctx.lineTo(p.x,p.y); ctx.stroke(); });
  const stop = event => { if (event.pointerId === pointer) { drawing = false; pointer = undefined; ctx.closePath(); } };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop); canvas.addEventListener('lostpointercapture', stop);
  $('drawing-clear').addEventListener('click', () => { if (!window.confirm('Vee die tekening uit? Dit kan nie ongedaan gemaak word nie.')) return; ctx.clearRect(0,0,canvas.width,canvas.height); drawStatus.textContent = 'Tekening uitgevee.'; });
  $('drawing-save').addEventListener('click', () => { try { canvas.toBlob(blob => { if (!blob) { drawStatus.textContent = 'Kon nie die prent aflaai nie.'; return; } const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'slim-maat-tekening.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); drawStatus.textContent = 'Aflaai van die prent is begin.'; }, 'image/png'); } catch { drawStatus.textContent = 'Kon nie die prent aflaai nie.'; } });
}
