"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Infinity as InfinityIcon, BookOpen, Star } from "lucide-react";
import FloatingGems from "@/components/FloatingGems";
import HowToPlayModal from "@/components/HowToPlayModal";
import { loadProgress, type PlayerProgress, DEFAULT_PROGRESS } from "@/lib/progress";

export default function Home() {
  const [howOpen, setHowOpen] = useState(false);
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <FloatingGems />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <h1
            className="text-7xl md:text-8xl font-extrabold tracking-tight gradient-text glow-text"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
          >
            GEM
            <br />
            CRUSH
          </h1>
          <p className="mt-4 text-violet-300/80 text-base md:text-lg font-medium">
            Match. Combo. Conquer.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
          }}
          className="mt-12 w-full flex flex-col gap-3"
        >
          <MenuButton href="/play/levels" icon={<Trophy size={20} />} primary>
            Campaign
          </MenuButton>
          <MenuButton href="/play/endless" icon={<InfinityIcon size={20} />}>
            Endless Mode
          </MenuButton>
          <MenuButton onClick={() => setHowOpen(true)} icon={<BookOpen size={20} />}>
            How to Play
          </MenuButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 w-full grid grid-cols-3 gap-3"
        >
          <Stat label="Stars" value={totalStars} icon={<Star size={14} className="text-yellow-400 fill-yellow-400" />} />
          <Stat label="Levels" value={progress.levelsCompleted.length} />
          <Stat label="Best" value={progress.endlessHighScore.toLocaleString()} small />
        </motion.div>
      </motion.div>

      <div className="absolute bottom-4 text-violet-500/40 text-xs">v1.0 — Made with ✨</div>

      <HowToPlayModal open={howOpen} onClose={() => setHowOpen(false)} />
    </main>
  );
}

function MenuButton({
  href,
  onClick,
  icon,
  children,
  primary,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const className = primary ? "btn-primary" : "btn-secondary";
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {href ? (
        <Link href={href} className={`${className} w-full`}>
          {content}
        </Link>
      ) : (
        <button onClick={onClick} className={`${className} w-full`}>
          {content}
        </button>
      )}
    </motion.div>
  );
}

function Stat({ label, value, icon, small }: { label: string; value: number | string; icon?: React.ReactNode; small?: boolean }) {
  return (
    <div className="card px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
        <span className={`font-bold tabular-nums text-white ${small ? "text-base" : "text-xl"}`} style={{ fontFamily: "var(--font-display)" }}>
          {value}
        </span>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-violet-400/70 font-semibold">{label}</div>
    </div>
  );
}
