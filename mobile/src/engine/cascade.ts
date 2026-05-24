// AUTO-GENERATED from /src/engine - do not edit. Run `npm run sync-engine` to refresh.
import { BoardState, CascadeStep, GameConfig, Position } from './types';
import { cloneBoard, randomCell } from './board';
import { findMatches } from './matcher';
import { processSpecials } from './specials';

export function applyGravity(board: BoardState): { board: BoardState; fell: { from: Position; to: Position }[] } {
  const b = cloneBoard(board);
  const fell: { from: Position; to: Position }[] = [];
  const cols = b[0].length;
  const rows = b.length;

  for (let c = 0; c < cols; c++) {
    let writeRow = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (b[r][c]) {
        if (r !== writeRow) {
          fell.push({ from: { row: r, col: c }, to: { row: writeRow, col: c } });
          b[writeRow][c] = b[r][c];
          b[r][c] = null;
        }
        writeRow--;
      }
    }
  }
  return { board: b, fell };
}

export function refillBoard(board: BoardState, config: GameConfig): { board: BoardState; spawned: { pos: Position; cell: import('./types').Cell }[] } {
  const b = cloneBoard(board);
  const spawned: { pos: Position; cell: import('./types').Cell }[] = [];
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      if (!b[r][c]) {
        const cell = randomCell(config.numColors);
        b[r][c] = cell;
        spawned.push({ pos: { row: r, col: c }, cell });
      }
    }
  }
  return { board: b, spawned };
}

export function resolveCascade(board: BoardState, config: GameConfig): { board: BoardState; steps: CascadeStep[] } {
  let b = cloneBoard(board);
  const steps: CascadeStep[] = [];

  while (true) {
    const matches = findMatches(b);
    if (matches.length === 0) break;

    const { board: afterSpecials, created, activated, extraRemoved } = processSpecials(b, matches);
    b = afterSpecials;

    // Collect all positions to remove
    const removeSet = new Set<string>();
    for (const m of matches) for (const p of m.positions) removeSet.add(`${p.row},${p.col}`);
    for (const p of extraRemoved) removeSet.add(`${p.row},${p.col}`);

    const removed: Position[] = Array.from(removeSet).map(s => { const [r, c] = s.split(',').map(Number); return { row: r, col: c }; });

    // Don't remove positions where specials were just created
    const createdSet = new Set(created.map(c => `${c.pos.row},${c.pos.col}`));
    for (const pos of removed) {
      const key = `${pos.row},${pos.col}`;
      if (!createdSet.has(key)) b[pos.row][pos.col] = null;
    }

    const { board: afterGravity, fell } = applyGravity(b);
    b = afterGravity;
    const { board: afterRefill, spawned } = refillBoard(b, config);
    b = afterRefill;

    steps.push({ removed, fell, spawned, matches, specialsCreated: created, specialsActivated: activated });
  }

  return { board: b, steps };
}
