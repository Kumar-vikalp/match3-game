// AUTO-GENERATED from /src/engine - do not edit. Run `npm run sync-engine` to refresh.
import { BoardState } from './types';
import { swap } from './board';
import { findMatches } from './matcher';

export function hasValidMoves(board: BoardState): boolean {
  const rows = board.length;
  const cols = board[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) {
        const swapped = swap(board, { row: r, col: c }, { row: r, col: c + 1 });
        if (findMatches(swapped).length > 0) return true;
      }
      if (r + 1 < rows) {
        const swapped = swap(board, { row: r, col: c }, { row: r + 1, col: c });
        if (findMatches(swapped).length > 0) return true;
      }
    }
  }
  return false;
}
