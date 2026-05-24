import { BoardState, Cell, GameConfig, GemColor, GemType, Position } from './types';
import { findMatches } from './matcher';

let nextId = 0;

export function randomCell(numColors: number): Cell {
  return { color: Math.floor(Math.random() * numColors) as GemColor, type: GemType.Normal, id: nextId++ };
}

export function cloneBoard(board: BoardState): BoardState {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

export function getCell(board: BoardState, pos: Position): Cell | null {
  return board[pos.row]?.[pos.col] ?? null;
}

export function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function swap(board: BoardState, a: Position, b: Position): BoardState {
  const b2 = cloneBoard(board);
  [b2[a.row][a.col], b2[b.row][b.col]] = [b2[b.row][b.col], b2[a.row][a.col]];
  return b2;
}

export function createBoard(config: GameConfig): BoardState {
  let board: BoardState;
  do {
    board = Array.from({ length: config.rows }, () =>
      Array.from({ length: config.cols }, () => randomCell(config.numColors))
    );
  } while (findMatches(board).length > 0);
  return board;
}
