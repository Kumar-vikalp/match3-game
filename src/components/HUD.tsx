"use client";

import { PowerUp, PowerUpType } from "@/engine/powerups";

interface Props {
  score: number;
  movesLeft: number;
  targetScore: number;
  combo: number;
  mode: "level" | "endless";
  powerUps: PowerUp[];
  onUsePowerUp: (type: PowerUpType) => void;
}

const POWER_UP_LABELS: Record<PowerUpType, string> = {
  [PowerUpType.Shuffle]: "🔀",
  [PowerUpType.DestroyGem]: "💥",
  [PowerUpType.ExtraMoves]: "➕",
};

export default function HUD({ score, movesLeft, targetScore, combo, mode, powerUps, onUsePowerUp }: Props) {
  const progress = targetScore > 0 ? Math.min(score / targetScore, 1) : 0;

  return (
    <div className="w-full max-w-md flex flex-col gap-2 px-2">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold">{score.toLocaleString()}</div>
        {mode === "level" && (
          <div className="text-slate-400 text-sm">
            Moves: <span className="text-white font-bold">{movesLeft}</span>
          </div>
        )}
      </div>

      {mode === "level" && (
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {combo > 1 && (
        <div className="text-center text-yellow-400 font-bold text-sm animate-pulse">
          {combo}x COMBO!
        </div>
      )}

      <div className="flex gap-2 justify-center">
        {powerUps.map((pu, i) => (
          <button
            key={i}
            onClick={() => onUsePowerUp(pu.type)}
            disabled={pu.uses <= 0}
            className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-600 text-sm disabled:opacity-30 hover:bg-slate-700 transition-colors"
          >
            {POWER_UP_LABELS[pu.type]} {pu.uses}
          </button>
        ))}
      </div>
    </div>
  );
}
