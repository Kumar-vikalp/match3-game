import { BoardState, GemType, Match, Position } from './types';
import { cloneBoard } from './board';

export function processSpecials(board: BoardState, matches: Match[]): {
  board: BoardState;
  created: { pos: Position; type: GemType }[];
  activated: Position[];
  extraRemoved: Position[];
} {
  const b = cloneBoard(board);
  const created: { pos: Position; type: GemType }[] = [];
  const activated: Position[] = [];
  const extraRemoved: Position[] = [];

  for (const match of matches) {
    if (match.length >= 5) {
      const mid = match.positions[Math.floor(match.positions.length / 2)];
      created.push({ pos: mid, type: GemType.Bomb });
      b[mid.row][mid.col] = { color: b[mid.row][mid.col]!.color, type: GemType.Bomb, id: b[mid.row][mid.col]!.id };
    } else if (match.length === 4) {
      const mid = match.positions[Math.floor(match.positions.length / 2)];
      const type = match.direction === 'horizontal' ? GemType.LineClearH : GemType.LineClearV;
      created.push({ pos: mid, type });
      b[mid.row][mid.col] = { color: b[mid.row][mid.col]!.color, type, id: b[mid.row][mid.col]!.id };
    }
  }

  // Activate specials that are in matches
  for (const match of matches) {
    for (const pos of match.positions) {
      const cell = board[pos.row][pos.col];
      if (!cell || cell.type === GemType.Normal) continue;
      // Skip if this position just had a special created on it
      if (created.some(c => c.pos.row === pos.row && c.pos.col === pos.col)) continue;
      activated.push(pos);
      const rows = b.length;
      const cols = b[0].length;
      if (cell.type === GemType.LineClearH) {
        for (let c = 0; c < cols; c++) {
          if (b[pos.row][c]) extraRemoved.push({ row: pos.row, col: c });
        }
      } else if (cell.type === GemType.LineClearV) {
        for (let r = 0; r < rows; r++) {
          if (b[r][pos.col]) extraRemoved.push({ row: r, col: pos.col });
        }
      } else if (cell.type === GemType.Bomb) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = pos.row + dr, c = pos.col + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols && b[r][c]) {
              extraRemoved.push({ row: r, col: c });
            }
          }
        }
      }
    }
  }

  return { board: b, created, activated, extraRemoved };
}
