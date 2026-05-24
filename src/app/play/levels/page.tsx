"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Star } from "lucide-react";
import { LEVELS } from "@/game/levels";
import FloatingGems from "@/components/FloatingGems";
import { loadProgress, type PlayerProgress, DEFAULT_PROGRESS } from "@/lib/progress";

export default function LevelsPage() {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  const lastCompleted = progress.levelsCompleted.length > 0 ? Math.max(...progress.levelsCompleted) : 0;
  const unlockedThrough = lastCompleted + 1;

  return (
    <main className="relative min-h-dvh px-4 py-6 max-w-lg mx-auto">
      <FloatingGems />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Campaign
          </h1>
          <p className="text-xs text-violet-400/70">Choose your level</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LEVELS.map((level, i) => {
          const stars = progress.stars[`level_${level.id}`] ?? 0;
          const isLocked = level.id > unlockedThrough;
          const isCompleted = progress.levelsCompleted.includes(level.id);

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              {isLocked ? (
                <div className="card p-4 aspect-square flex flex-col items-center justify-center opacity-40">
                  <Lock size={24} className="text-violet-400/60" />
                  <span className="text-xs mt-2 text-violet-400/60">Level {level.id}</span>
                </div>
              ) : (
                <Link
                  href={`/play/level/${level.id}`}
                  className={`card relative block p-4 aspect-square flex flex-col items-center justify-center transition-all hover:scale-[1.03] hover:border-violet-400/40 ${
                    isCompleted ? "ring-1 ring-violet-400/30" : ""
                  }`}
                >
                  <div
                    className="text-3xl font-extrabold gradient-text"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                  >
                    {level.id}
                  </div>
                  <div className="text-[10px] text-violet-300/80 mt-1 font-medium text-center leading-tight">
                    {level.name}
                  </div>
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={
                          s <= stars
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-violet-700/50"
                        }
                      />
                    ))}
                  </div>
                  <div className="absolute bottom-1.5 left-2 right-2 flex justify-between text-[9px] text-violet-400/60">
                    <span>{level.targetScore.toLocaleString()}</span>
                    <span>{level.maxMoves} moves</span>
                  </div>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
