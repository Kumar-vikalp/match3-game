"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { LEVELS } from "@/game/levels";
import GameBoard from "@/components/GameBoard";
import { saveProgress, loadProgress, getUserId } from "@/lib/progress";

export default function LevelPage() {
  const params = useParams();
  const id = Number(params.id);
  const level = LEVELS.find((l) => l.id === id);

  if (!level) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p>Level not found</p>
      </main>
    );
  }

  const handleGameEnd = async (won: boolean, score: number) => {
    if (won) {
      const progress = await loadProgress();
      if (!progress.levelsCompleted.includes(id)) {
        progress.levelsCompleted.push(id);
      }
      const key = `level_${id}`;
      if (!progress.highScores[key] || score > progress.highScores[key]) {
        progress.highScores[key] = score;
      }
      await saveProgress(progress);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-8">
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <Link href="/play/levels" className="text-slate-400 hover:text-white">
          ← Levels
        </Link>
        <h2 className="text-lg font-semibold">{level.name}</h2>
      </div>
      <GameBoard
        config={{ rows: level.rows, cols: level.cols, numColors: level.numColors }}
        targetScore={level.targetScore}
        maxMoves={level.maxMoves}
        mode="level"
        onGameEnd={handleGameEnd}
      />
    </main>
  );
}
