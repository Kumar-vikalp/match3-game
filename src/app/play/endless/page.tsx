"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Infinity as InfinityIcon } from "lucide-react";
import GameBoard from "@/components/GameBoard";
import GameOverModal from "@/components/GameOverModal";
import { saveProgress, loadProgress } from "@/lib/progress";

export default function EndlessPage() {
  const router = useRouter();
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [boardKey, setBoardKey] = useState(0);

  const handleGameEnd = async (_won: boolean, finalScore: number) => {
    setScore(finalScore);
    setShowResult(true);
    const progress = await loadProgress();
    if (finalScore > progress.endlessHighScore) {
      progress.endlessHighScore = finalScore;
      await saveProgress(progress);
    }
  };

  const handleRestart = () => {
    setShowResult(false);
    setBoardKey((k) => k + 1);
  };

  return (
    <main className="relative min-h-dvh px-4 py-4 flex flex-col items-center max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center justify-between mb-4"
      >
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <InfinityIcon size={18} className="text-cyan-300" />
          <div className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Endless
          </div>
        </div>
        <div className="w-10" />
      </motion.div>

      <GameBoard
        key={boardKey}
        config={{ rows: 8, cols: 8, numColors: 6 }}
        mode="endless"
        onGameEnd={handleGameEnd}
      />

      {showResult && (
        <GameOverModal
          won={false}
          score={score}
          onRestart={handleRestart}
          onBack={() => router.push("/")}
        />
      )}
    </main>
  );
}
