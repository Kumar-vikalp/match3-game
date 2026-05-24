export interface PlayerProgress {
  levelsCompleted: number[];
  highScores: Record<string, number>;
  endlessHighScore: number;
}

export const DEFAULT_PROGRESS: PlayerProgress = {
  levelsCompleted: [],
  highScores: {},
  endlessHighScore: 0,
};

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
  const res = await fetch(`/api/load?userId=${getUserId()}`);
  if (!res.ok) return DEFAULT_PROGRESS;
  return res.json();
}
