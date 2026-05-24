import { BoardState, GameConfig, CascadeStep } from './types';
import { cloneBoard, randomCell } from './board';
import { resolveCascade } from './cascade';

export enum PowerUpType { Shuffle, DestroyGem, ExtraMoves }
export interface PowerUp { type: PowerUpType; uses: number }

export function createPowerUp(type: PowerUpType): PowerUp {
  return { type, uses: 3 };
}

export function applyShuffle(board: BoardState): BoardState {
  const b = cloneBoard(board);
  const cells = b.flat().filter(c => c !== null);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  let idx = 0;
  for (let r = 0; r < b.length; r++) {
    for (let c = 0; c < b[0].length; c++) {
      if (b[r][c]) b[r][c] = cells[idx++];
    }
  }
  return b;
}

export function applyDestroyGem(board: BoardState, pos: import('./types').Position, config: GameConfig): { board: BoardState; steps: CascadeStep[] } {
  const b = cloneBoard(board);
  b[pos.row][pos.col] = null;
  return resolveCascade(b, config);
}
