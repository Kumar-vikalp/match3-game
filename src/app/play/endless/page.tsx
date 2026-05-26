"use client";

import { useEffect, useRef, useState } from "react";
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

  // Always-current score so we can persist on quit/unmount.
  const currentScoreRef = useRef(0);
  // Avoid double-saving when GameOver flow already saved and component unmounts shortly after.
  const persistedRef = useRef(false);

  const persistScore = async () => {
    const finalScore = currentScoreRef.current;
    if (finalScore <= 0 || persistedRef.current) return;
    persistedRef.current = true;
    try {
      const progress = await loadProgress();
      let dirty = false;
      if (finalScore > progress.endlessHighScore) {
        progress.endlessHighScore = finalScore;
        dirty = true;
      }
      if (finalScore !== progress.endlessLastScore) {
        progress.endlessLastScore = finalScore;
        dirty = true;
      }
      if (dirty) await saveProgress(progress);
    } catch {
      // best-effort persistence; never block navigation
    }
  };

  // Persist on tab close / page hide (covers refresh, close, mobile background).
  useEffect(() => {
    const onHide = () => {
      // Fire and forget — beforeunload can't await but the request usually flushes.
      void persistScore();
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, []);

  // Persist on unmount (covers Next.js client-side navigation away).
  useEffect(() => {
    return () => {
      void persistScore();
    };
  }, []);

  const handleScoreChange = (s: number) => {
    currentScoreRef.current = s;
    // Reset persisted flag if a new run started (score went back to 0 from > 0).
    if (s === 0) persistedRef.current = false;
  };

  const handleGameEnd = async (_won: boolean, finalScore: number) => {
    setScore(finalScore);
    setShowResult(true);
    currentScoreRef.current = finalScore;
    await persistScore();
  };

  const handleRestart = () => {
    setShowResult(false);
    persistedRef.current = false;
    currentScoreRef.current = 0;
    setBoardKey((k) => k + 1);
  };

  const handleBack = async () => {
    await persistScore();
    router.push("/");
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
          onClick={() => void persistScore()}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          aria-label="Back to menu"
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
        onScoreChange={handleScoreChange}
      />

      {showResult && (
        <GameOverModal
          won={false}
          mode="endless"
          score={score}
          onRestart={handleRestart}
          onBack={handleBack}
        />
      )}
    </main>
  );
}
