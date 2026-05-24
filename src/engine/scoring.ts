import { CascadeStep, GemType } from './types';

export function calculateScore(step: CascadeStep, comboLevel: number): number {
  const base = step.removed.length * 10;
  const multiplier = comboLevel * 1.5;
  let specialBonus = 0;
  for (const s of step.specialsCreated) {
    if (s.type === GemType.Bomb) specialBonus += 100;
    else specialBonus += 50;
  }
  for (const _ of step.specialsActivated) {
    specialBonus += 50;
  }
  return base * multiplier + specialBonus;
}
