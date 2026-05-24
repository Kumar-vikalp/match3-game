// AUTO-GENERATED from /src/engine - do not edit. Run `npm run sync-engine` to refresh.
import { BoardState, Match, Position } from './types';

export function findMatches(board: BoardState): Match[] {
  const matches: Match[] = [];
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    let run: Position[] = [{ row: r, col: 0 }];
    for (let c = 1; c < cols; c++) {
      const prev = board[r][c - 1];
      const curr = board[r][c];
      if (prev && curr && prev.color === curr.color) {
        run.push({ row: r, col: c });
      } else {
        if (run.length >= 3) matches.push({ positions: run, length: run.length, direction: 'horizontal' });
        run = [{ row: r, col: c }];
      }
    }
    if (run.length >= 3) matches.push({ positions: run, length: run.length, direction: 'horizontal' });
  }

  for (let c = 0; c < cols; c++) {
    let run: Position[] = [{ row: 0, col: c }];
    for (let r = 1; r < rows; r++) {
      const prev = board[r - 1][c];
      const curr = board[r][c];
      if (prev && curr && prev.color === curr.color) {
        run.push({ row: r, col: c });
      } else {
        if (run.length >= 3) matches.push({ positions: run, length: run.length, direction: 'vertical' });
        run = [{ row: r, col: c }];
      }
    }
    if (run.length >= 3) matches.push({ positions: run, length: run.length, direction: 'vertical' });
  }

  return matches;
}
