"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { LEVELS } from "@/game/levels";
import GameBoard from "@/components/GameBoard";
import GameOverModal from "@/components/GameOverModal";
import { saveProgress, loadProgress, calculateStars } from "@/lib/progress";

export default function LevelPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const level = LEVELS.find((l) => l.id === id);
  const nextLevel = LEVELS.find((l) => l.id === id + 1);

  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ won: boolean; score: number } | null>(null);
  const [boardKey, setBoardKey] = useState(0);

  if (!level) {
    return (
      <main className="flex items-center justify-center min-h-dvh">
        <p className="text-violet-300">Level not found</p>
      </main>
    );
  }

  const handleGameEnd = async (won: boolean, score: number) => {
    setResult({ won, score });
    setShowResult(true);

    if (won) {
      const progress = await loadProgress();
      if (!progress.levelsCompleted.includes(id)) {
        progress.levelsCompleted = [...progress.levelsCompleted, id];
      }
      const key = `level_${id}`;
      const stars = calculateStars(score, level.targetScore);
      if ((progress.highScores[key] ?? 0) < score) progress.highScores[key] = score;
      if ((progress.stars[key] ?? 0) < stars) progress.stars[key] = stars;
      await saveProgress(progress);
    }
  };

  const handleRestart = () => {
    setShowResult(false);
    setResult(null);
    setBoardKey((k) => k + 1);
  };

  const handleNext = () => {
    if (nextLevel) router.push(`/play/level/${nextLevel.id}`);
  };

  return (
    <main className="relative min-h-dvh px-4 py-4 flex flex-col items-center max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center justify-between mb-4"
      >
        <Link
          href="/play/levels"
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-violet-400/70 font-semibold">
            Level {level.id}
          </div>
          <div className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {level.name}
          </div>
        </div>
        <div className="w-10" />
      </motion.div>

      <GameBoard
        key={boardKey}
        config={{ rows: level.rows, cols: level.cols, numColors: level.numColors }}
        targetScore={level.targetScore}
        maxMoves={level.maxMoves}
        mode="level"
        onGameEnd={handleGameEnd}
      />

      {showResult && result && (
        <GameOverModal
          won={result.won}
          score={result.score}
          targetScore={level.targetScore}
          hasNextLevel={result.won && !!nextLevel}
          onRestart={handleRestart}
          onBack={() => router.push("/play/levels")}
          onNext={handleNext}
        />
      )}
    </main>
  );
}
