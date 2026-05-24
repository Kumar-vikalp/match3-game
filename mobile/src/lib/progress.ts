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

export function calculateStars(score: number, target: number): number {
  if (score < target) return 0;
  if (score >= target * 2) return 3;
  if (score >= target * 1.5) return 2;
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
