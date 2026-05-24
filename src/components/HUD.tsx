"use client";

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

const POWER_UP_LABELS: Record<PowerUpType, string> = {
  [PowerUpType.Shuffle]: "🔀",
  [PowerUpType.DestroyGem]: "💥",
  [PowerUpType.ExtraMoves]: "➕",
};

const POWER_UP_NAMES: Record<PowerUpType, string> = {
  [PowerUpType.Shuffle]: "Shuffle",
  [PowerUpType.DestroyGem]: "Destroy",
  [PowerUpType.ExtraMoves]: "+5 Moves",
};

export default function HUD({ score, movesLeft, targetScore, combo, mode, powerUps, destroyMode, onUsePowerUp }: Props) {
  const progress = targetScore > 0 ? Math.min(score / targetScore, 1) : 0;

  return (
    <div className="w-full max-w-md flex flex-col gap-2 px-2">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-3xl font-bold tabular-nums">{score.toLocaleString()}</div>
          {mode === "level" && targetScore > 0 && (
            <div className="text-xs text-slate-500">Target: {targetScore.toLocaleString()}</div>
          )}
        </div>
        {mode === "level" && (
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{movesLeft}</div>
            <div className="text-xs text-slate-500">moves left</div>
          </div>
        )}
      </div>

      {mode === "level" && targetScore > 0 && (
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <div className="h-5 text-center">
        {destroyMode ? (
          <span className="text-pink-400 font-bold text-sm">Tap a gem to destroy</span>
        ) : combo > 1 ? (
          <span className="text-yellow-400 font-bold text-sm animate-pulse">{combo}x COMBO!</span>
        ) : null}
      </div>

      <div className="flex gap-2 justify-center">
        {powerUps.map((pu, i) => (
          <button
            key={i}
            onClick={() => onUsePowerUp(pu.type)}
            disabled={pu.uses <= 0}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-30 ${
              destroyMode && pu.type === PowerUpType.DestroyGem
                ? "bg-pink-600 border-pink-400"
                : "bg-slate-800 border-slate-600 hover:bg-slate-700"
            }`}
          >
            <span className="mr-1">{POWER_UP_LABELS[pu.type]}</span>
            <span className="text-xs">{POWER_UP_NAMES[pu.type]}</span>
            <span className="ml-1 text-slate-400">×{pu.uses}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
