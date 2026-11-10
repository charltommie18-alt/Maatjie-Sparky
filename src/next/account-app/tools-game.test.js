import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, move } from './tools-game.js';
test('game starts empty and alternates turns without mutating previous state', () => {
 const a = newGame(), b = move(a, 0); assert.equal(a.board[0], null); assert.equal(b.board[0], 'X'); assert.equal(b.turn, 'O'); assert.equal(move(b, 0), b); assert.equal(move(b, 9), b);
});
test('a winning line ends play', () => {
 let s = newGame(); for (const i of [0,3,1,4,2]) s = move(s,i); assert.equal(s.winner,'X'); assert.equal(s.draw,false); assert.equal(move(s,5),s);
});
test('a full board without a winner is a draw', () => {
 let s = newGame(); for (const i of [0,1,2,4,3,5,7,6,8]) s = move(s,i); assert.equal(s.winner,null); assert.equal(s.draw,true); assert.equal(move(s,0),s);
});
