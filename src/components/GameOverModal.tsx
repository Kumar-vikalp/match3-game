"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, RotateCcw, Home, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import { calculateStars } from "@/lib/progress";

interface Props {
  won: boolean;
  score: number;
  targetScore?: number;
  hasNextLevel?: boolean;
  mode?: "level" | "endless";
  onRestart: () => void;
  onBack: () => void;
  onNext?: () => void;
}

export default function GameOverModal({
  won,
  score,
  targetScore = 0,
  hasNextLevel = false,
  mode = "level",
  onRestart,
  onBack,
  onNext,
}: Props) {
  const stars = won && targetScore > 0 ? calculateStars(score, targetScore) : 0;

  const title = won
    ? "Level Complete!"
    : mode === "endless"
    ? "No More Moves"
    : "Out of Moves";

  const subtitle = won
    ? null
    : mode === "endless"
    ? "The board is locked — restart for a fresh run."
    : "So close! Try a different strategy.";

  useEffect(() => {
    if (!won) return;
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#fbbf24", "#ec4899", "#8b5cf6", "#22d3ee"];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.6 },
        colors,
        startVelocity: 50,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.6 },
        colors,
        startVelocity: 50,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [won]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.85, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.35 }}
          className="card max-w-sm w-full p-7 text-center"
        >
          <motion.h2
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring" }}
            className={`text-3xl font-extrabold tracking-tight ${
              won ? "gradient-text" : "text-violet-200"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </motion.h2>

          {won && targetScore > 0 && (
            <div className="flex justify-center gap-2 mt-5">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={
                    s <= stars
                      ? { scale: 1, rotate: 0, opacity: 1 }
                      : { scale: 1, rotate: 0, opacity: 0.3 }
                  }
                  transition={{
                    delay: 0.4 + s * 0.15,
                    type: "spring",
                    bounce: 0.5,
                  }}
                >
                  <Star
                    size={48}
                    className={
                      s <= stars
                        ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                        : "text-violet-700"
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}

          {!won && (
            <p className="text-violet-300/80 mt-3 text-sm">
              {subtitle}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: won ? 0.9 : 0.3 }}
            className="mt-6"
          >
            <div className="text-[10px] uppercase tracking-widest text-violet-400/70 font-semibold">
              Final Score
            </div>
            <div
              className="text-5xl font-extrabold tabular-nums mt-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {score.toLocaleString()}
            </div>
            {targetScore > 0 && (
              <div className="text-xs text-violet-400/60 mt-1">
                Target: {targetScore.toLocaleString()}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: won ? 1.1 : 0.5 }}
            className="flex gap-2 mt-7"
          >
            <button
              onClick={onBack}
              className="btn-secondary flex-1 !py-3"
              aria-label="Back to menu"
            >
              <Home size={18} />
            </button>
            <button onClick={onRestart} className="btn-secondary flex-1 !py-3">
              <RotateCcw size={18} />
              <span className="text-sm">Retry</span>
            </button>
            {won && hasNextLevel && onNext && (
              <button onClick={onNext} className="btn-primary flex-[1.5] !py-3">
                <span className="text-sm">Next</span>
                <ChevronRight size={18} />
              </button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
