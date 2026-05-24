"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Bomb, Plus, Target, Hash } from "lucide-react";
import { PowerUp, PowerUpType } from "@/engine/powerups";

interface Props {
  score: number;
  movesLeft: number;
  targetScore: number;
  combo: number;
  mode: "level" | "endless";
  powerUps: PowerUp[];
  destroyMode?: boolean;
  onUsePowerUp: (type: PowerUpType) => void;
}

const POWER_UP_ICONS: Record<PowerUpType, React.ReactNode> = {
  [PowerUpType.Shuffle]: <Shuffle size={20} />,
  [PowerUpType.DestroyGem]: <Bomb size={20} />,
  [PowerUpType.ExtraMoves]: <Plus size={20} />,
};

const POWER_UP_NAMES: Record<PowerUpType, string> = {
  [PowerUpType.Shuffle]: "Shuffle",
  [PowerUpType.DestroyGem]: "Destroy",
  [PowerUpType.ExtraMoves]: "+5 Moves",
};

export default function HUD({
  score,
  movesLeft,
  targetScore,
  combo,
  mode,
  powerUps,
  destroyMode,
  onUsePowerUp,
}: Props) {
  const progress = targetScore > 0 ? Math.min(score / targetScore, 1) : 0;

  return (
    <div className="w-full max-w-md flex flex-col gap-3 px-1">
      {/* Score + Moves */}
      <div className="card px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-violet-400/70 font-semibold">
            Score
          </div>
          <motion.div
            key={score}
            initial={{ scale: 1.15, color: "#fbbf24" }}
            animate={{ scale: 1, color: "#ffffff" }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-extrabold tabular-nums"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {score.toLocaleString()}
          </motion.div>
        </div>

        {mode === "level" ? (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-violet-400/70 font-semibold flex items-center justify-end gap-1">
              <Hash size={10} /> Moves
            </div>
            <div
              className={`text-3xl font-extrabold tabular-nums ${
                movesLeft <= 3 && movesLeft > 0 ? "text-red-400" : "text-white"
              }`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {movesLeft}
            </div>
          </div>
        ) : (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-violet-400/70 font-semibold">
              Mode
            </div>
            <div className="text-base font-bold text-cyan-300">Endless</div>
          </div>
        )}
      </div>

      {/* Target progress */}
      {mode === "level" && targetScore > 0 && (
        <div className="px-2">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-violet-400/70 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Target size={10} /> Target
            </span>
            <span className="text-violet-300 tabular-nums">{targetScore.toLocaleString()}</span>
          </div>
          <div className="relative w-full h-2 bg-black/30 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-pink-500 to-violet-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {progress >= 1 && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/50 to-pink-500/50 animate-pulse rounded-full" />
            )}
          </div>
        </div>
      )}

      {/* Combo / hint banner */}
      <div className="h-7 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {destroyMode && (
            <motion.div
              key="destroy"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-pink-400 font-bold text-sm flex items-center gap-2"
            >
              <Bomb size={14} className="animate-pulse" />
              Tap any gem to destroy
            </motion.div>
          )}
          {!destroyMode && combo > 1 && (
            <motion.div
              key={combo}
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="font-extrabold text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="gradient-text">{combo}x COMBO!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Power-ups */}
      <div className="flex gap-2 justify-center">
        {powerUps.map((pu) => {
          const isActive = destroyMode && pu.type === PowerUpType.DestroyGem;
          const disabled = pu.uses <= 0;
          return (
            <button
              key={pu.type}
              onClick={() => onUsePowerUp(pu.type)}
              disabled={disabled}
              className={`relative group flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl border transition-all ${
                isActive
                  ? "bg-pink-500/30 border-pink-400 ring-2 ring-pink-400/50"
                  : disabled
                  ? "bg-white/5 border-white/5 opacity-30 cursor-not-allowed"
                  : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-violet-400/40 hover:scale-105 active:scale-95"
              }`}
            >
              <div className={isActive ? "text-pink-300" : "text-violet-200"}>
                {POWER_UP_ICONS[pu.type]}
              </div>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-violet-300/80">
                {POWER_UP_NAMES[pu.type]}
              </span>
              <span
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  disabled ? "bg-slate-700 text-slate-500" : "bg-amber-400 text-slate-900"
                }`}
              >
                {pu.uses}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
