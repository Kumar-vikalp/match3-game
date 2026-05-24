"use client";

interface Props {
  won: boolean;
  score: number;
  onRestart: () => void;
  onBack: () => void;
}

export default function GameOverModal({ won, score, onRestart, onBack }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full border border-slate-700">
        <h2 className={`text-3xl font-bold ${won ? "text-green-400" : "text-red-400"}`}>
          {won ? "Level Complete!" : "Game Over"}
        </h2>
        <p className="text-4xl font-bold">{score.toLocaleString()}</p>
        <p className="text-slate-400">points</p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onRestart}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
