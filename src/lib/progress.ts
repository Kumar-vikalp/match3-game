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
