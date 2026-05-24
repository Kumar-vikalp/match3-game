export interface LevelConfig {
  id: number;
  name: string;
  targetScore: number;
  maxMoves: number;
  rows: number;
  cols: number;
  numColors: number;
}

export const LEVELS: LevelConfig[] = [
  { id: 1, name: "Getting Started", targetScore: 1000, maxMoves: 20, rows: 8, cols: 8, numColors: 5 },
  { id: 2, name: "Warming Up", targetScore: 2000, maxMoves: 18, rows: 8, cols: 8, numColors: 5 },
  { id: 3, name: "Color Burst", targetScore: 3500, maxMoves: 18, rows: 8, cols: 8, numColors: 6 },
  { id: 4, name: "Tight Squeeze", targetScore: 5000, maxMoves: 16, rows: 8, cols: 8, numColors: 6 },
  { id: 5, name: "Chain Reaction", targetScore: 7000, maxMoves: 15, rows: 8, cols: 8, numColors: 6 },
  { id: 6, name: "Under Pressure", targetScore: 9000, maxMoves: 14, rows: 8, cols: 8, numColors: 6 },
  { id: 7, name: "Expert Mode", targetScore: 12000, maxMoves: 13, rows: 8, cols: 8, numColors: 6 },
  { id: 8, name: "Grand Master", targetScore: 15000, maxMoves: 12, rows: 8, cols: 8, numColors: 6 },
];
