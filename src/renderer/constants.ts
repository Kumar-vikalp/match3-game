import { GemColor } from '@/engine/types';

export const CELL_SIZE = 64;
export const PADDING = 4;
export const BOARD_PADDING = 16;

export const GEM_COLORS: Record<GemColor, string> = {
  [GemColor.Red]: '#EF4444',
  [GemColor.Blue]: '#3B82F6',
  [GemColor.Green]: '#22C55E',
  [GemColor.Yellow]: '#EAB308',
  [GemColor.Purple]: '#A855F7',
  [GemColor.Orange]: '#F97316',
};

export const ANIMATION_DURATION = { swap: 200, fall: 150, remove: 150, spawn: 100 };
