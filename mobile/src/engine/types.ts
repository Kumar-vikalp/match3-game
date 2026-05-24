// AUTO-GENERATED from /src/engine - do not edit. Run `npm run sync-engine` to refresh.
export enum GemColor { Red, Blue, Green, Yellow, Purple, Orange }
export enum GemType { Normal, LineClearH, LineClearV, Bomb }

export interface Cell { color: GemColor; type: GemType; id: number }
export interface Position { row: number; col: number }
export interface Match { positions: Position[]; length: number; direction: 'horizontal' | 'vertical' }

export interface CascadeStep {
  removed: Position[];
  fell: { from: Position; to: Position }[];
  spawned: { pos: Position; cell: Cell }[];
  matches: Match[];
  specialsCreated: { pos: Position; type: GemType }[];
  specialsActivated: Position[];
}

export type BoardState = (Cell | null)[][];
export interface GameConfig { rows: number; cols: number; numColors: number }
