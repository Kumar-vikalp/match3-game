"use client";

import Link from "next/link";
import GameBoard from "@/components/GameBoard";
import { saveProgress, loadProgress } from "@/lib/progress";

export default function EndlessPage() {
  const handleGameEnd = async (_won: boolean, score: number) => {
    const progress = await loadProgress();
    if (score > progress.endlessHighScore) {
      progress.endlessHighScore = score;
      await saveProgress(progress);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-8">
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <Link href="/" className="text-slate-400 hover:text-white">
          ← Menu
        </Link>
        <h2 className="text-lg font-semibold">Endless Mode</h2>
      </div>
      <GameBoard
        config={{ rows: 8, cols: 8, numColors: 6 }}
        mode="endless"
        onGameEnd={handleGameEnd}
      />
    </main>
  );
}
