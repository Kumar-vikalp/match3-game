import { BoardState, GemType, Match, Position } from './types';
import { cloneBoard } from './board';

/**
 * Process matches: create new specials (match-4 → line clear, match-5 → bomb),
 * and activate any specials that participated in a match. Activations chain —
 * if a bomb's blast catches another special, that special detonates too.
 */
export function processSpecials(board: BoardState, matches: Match[]): {
  board: BoardState;
  created: { pos: Position; type: GemType }[];
  activated: Position[];
  extraRemoved: Position[];
} {
  const b = cloneBoard(board);
  const rows = b.length;
  const cols = b[0].length;
  const created: { pos: Position; type: GemType }[] = [];
  const activated: Position[] = [];
  const extraRemovedSet = new Set<string>();

  // 1. Create new specials from match length.
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

  const createdKey = (p: Position) => `${p.row},${p.col}`;
  const createdSet = new Set(created.map(c => createdKey(c.pos)));

  // BFS-style queue: any special caught in a blast also fires.
  const visited = new Set<string>();
  const queue: Position[] = [];

  // Seed: specials sitting in the original match positions.
  for (const match of matches) {
    for (const pos of match.positions) {
      const cell = board[pos.row][pos.col];
      if (!cell || cell.type === GemType.Normal) continue;
      const key = createdKey(pos);
      // Skip a cell where we just CREATED a new special this turn.
      if (createdSet.has(key)) continue;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(pos);
    }
  }

  while (queue.length) {
    const pos = queue.shift()!;
    const cell = board[pos.row]?.[pos.col] ?? b[pos.row]?.[pos.col];
    if (!cell) continue;
    activated.push(pos);
    extraRemovedSet.add(createdKey(pos));

    let blast: Position[] = [];
    if (cell.type === GemType.LineClearH) {
      for (let c = 0; c < cols; c++) blast.push({ row: pos.row, col: c });
    } else if (cell.type === GemType.LineClearV) {
      for (let r = 0; r < rows; r++) blast.push({ row: r, col: pos.col });
    } else if (cell.type === GemType.Bomb) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = pos.row + dr, c = pos.col + dc;
          if (r >= 0 && r < rows && c >= 0 && c < cols) blast.push({ row: r, col: c });
        }
      }
    } else {
      blast = [];
    }

    for (const bp of blast) {
      const key = createdKey(bp);
      if (!b[bp.row][bp.col]) continue;
      extraRemovedSet.add(key);
      // Chain: if the blasted cell is a special we haven't fired yet, queue it.
      const blastedCell = b[bp.row][bp.col]!;
      if (blastedCell.type !== GemType.Normal && !visited.has(key) && !createdSet.has(key)) {
        visited.add(key);
        queue.push(bp);
      }
    }
  }

  const extraRemoved: Position[] = Array.from(extraRemovedSet).map(s => {
    const [r, c] = s.split(',').map(Number);
    return { row: r, col: c };
  });

  return { board: b, created, activated, extraRemoved };
}
