export interface PlayerProgress {
  levelsCompleted: number[];
  highScores: Record<string, number>;
  stars: Record<string, number>;
  endlessHighScore: number;
}

export const DEFAULT_PROGRESS: PlayerProgress = {
  levelsCompleted: [],
  highScores: {},
  stars: {},
  endlessHighScore: 0,
};

/**
 * Stars are earned based on a "skill" score combining over-target scoring
 * and move efficiency:
 *
 *   skill = (score - target) / target + (movesLeft / maxMoves) * 0.5
 *
 * 0 stars: score < target (failed to hit goal)
 * 1 star : passed target
 * 2 stars: skill >= 0.3
 * 3 stars: skill >= 0.8
 */
export function calculateStars(
  score: number,
  target: number,
  movesLeft: number = 0,
  maxMoves: number = 0
): number {
  if (target <= 0) return 0;
  if (score < target) return 0;

  const overscore = (score - target) / target;
  const efficiency =
    maxMoves > 0 ? Math.max(0, Math.min(1, movesLeft / maxMoves)) * 0.5 : 0;
  const skill = overscore + efficiency;

  if (skill >= 0.8) return 3;
  if (skill >= 0.3) return 2;
  return 1;
}

export function getUserId(): string {
  let id = localStorage.getItem("match3_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("match3_user_id", id);
  }
  return id;
}

export async function saveProgress(progress: PlayerProgress): Promise<void> {
  await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: getUserId(), progress }),
  });
}

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const res = await fetch(`/api/load?userId=${getUserId()}`);
    if (!res.ok) return { ...DEFAULT_PROGRESS };
    const data = await res.json();
    return { ...DEFAULT_PROGRESS, ...data };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}
