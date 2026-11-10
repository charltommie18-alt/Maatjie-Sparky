// Local two-player game. No account, network or persistence.
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function newGame() { return { board: Array(9).fill(null), turn: 'X', winner: null, draw: false }; }
export function move(state, index) {
  if (!state || !Array.isArray(state.board) || state.board.length !== 9 || !Number.isInteger(index) || index < 0 || index > 8 || state.board[index] !== null || state.winner || state.draw) return state;
  const board = state.board.slice();
  board[index] = state.turn;
  const winner = lines.some(line => line.every(i => board[i] === state.turn)) ? state.turn : null;
  const draw = !winner && board.every(Boolean);
  return { board, turn: winner || draw ? state.turn : (state.turn === 'X' ? 'O' : 'X'), winner, draw };
}
