import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        GEM CRUSH
      </h1>
      <p className="text-slate-400 text-lg">Match 3 or more to score!</p>
      <div className="flex flex-col gap-4 w-64">
        <Link
          href="/play/levels"
          className="block text-center py-4 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-colors"
        >
          Campaign
        </Link>
        <Link
          href="/play/endless"
          className="block text-center py-4 px-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-colors"
        >
          Endless Mode
        </Link>
      </div>
    </main>
  );
}
