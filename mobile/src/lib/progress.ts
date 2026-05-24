import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@gemcrush:progress";

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
