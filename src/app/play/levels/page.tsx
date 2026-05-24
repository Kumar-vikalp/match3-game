import Link from "next/link";
import { LEVELS } from "@/game/levels";

export default function LevelsPage() {
  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-12">
      <Link href="/" className="self-start text-slate-400 hover:text-white mb-8 ml-4">
        ← Back
      </Link>
      <h2 className="text-3xl font-bold mb-8">Select Level</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg">
        {LEVELS.map((level) => (
          <Link
            key={level.id}
            href={`/play/level/${level.id}`}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <span className="text-2xl font-bold text-blue-400">{level.id}</span>
            <span className="text-xs text-slate-400 mt-1">{level.targetScore} pts</span>
            <span className="text-xs text-slate-500">{level.maxMoves} moves</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
