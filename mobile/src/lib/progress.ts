import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@gemcrush:progress";

export interface PlayerProgress {
  levelsCompleted: number[];
  highScores: Record<string, number>;
  stars: Record<string, number>;
  endlessHighScore: number;
  // Last server-known timestamp per field for conflict resolution
  updatedAt?: number;
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
 * 2 stars: skill >= 0.3  (e.g. 30% over target, OR finished with 60% moves left)
 * 3 stars: skill >= 0.8  (e.g. 80% over target, OR 50% over + half moves left)
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

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const data = JSON.parse(raw);
    return { ...DEFAULT_PROGRESS, ...data };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export async function saveProgress(progress: PlayerProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

// ---- Mutations: write locally + enqueue sync op (offline-first) ----

async function withProgress(updater: (p: PlayerProgress) => PlayerProgress) {
  const current = await loadProgress();
  const next = updater({ ...current });
  next.updatedAt = Date.now();
  await saveProgress(next);
  return next;
}

/**
 * Mark a level as completed and record the score. Writes locally immediately,
 * then enqueues a sync operation that will batch-flush to the server in the
 * background.
 */
export async function recordLevelComplete(
  levelId: number,
  score: number,
  stars: number
): Promise<void> {
  const ts = Date.now();
  await withProgress((p) => {
    if (!p.levelsCompleted.includes(levelId)) {
      p.levelsCompleted = [...p.levelsCompleted, levelId];
    }
    const key = `level_${levelId}`;
    if ((p.highScores[key] ?? 0) < score) p.highScores[key] = score;
    if ((p.stars[key] ?? 0) < stars) p.stars[key] = stars;
    return p;
  });
  // Enqueue sync (lazy import to avoid cycle)
  const { enqueueSync } = await import("./sync");
  await enqueueSync({ type: "level_complete", levelId, ts });
  await enqueueSync({ type: "level_score", levelId, score, stars, ts });
}

export async function recordEndlessScore(score: number): Promise<void> {
  const ts = Date.now();
  await withProgress((p) => {
    if (score > p.endlessHighScore) p.endlessHighScore = score;
    return p;
  });
  const { enqueueSync } = await import("./sync");
  await enqueueSync({ type: "endless_score", score, ts });
}
