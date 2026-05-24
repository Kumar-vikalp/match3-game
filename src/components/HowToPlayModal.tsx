"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Bomb } from "lucide-react";
import Image from "next/image";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="card max-w-md w-full p-6 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                How to Play
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 text-sm">
              <Section icon={<Sparkles size={18} className="text-yellow-400" />} title="Match 3 or more">
                Tap two adjacent gems to swap them. Match 3+ of the same color in a row or column to clear them and earn points.
              </Section>

              <Section icon={<Zap size={18} className="text-cyan-400" />} title="Special Pieces">
                <div className="flex gap-3 mt-2">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="relative w-12 h-12">
                      <Image src="/gems/red.png" alt="" fill className="object-contain" />
                      <Image src="/gems/thunder.png" alt="" fill className="object-contain p-1" />
                    </div>
                    <span className="text-xs text-violet-300">Match 4 → Line Clear</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <Image src="/gems/bomb.png" alt="" width={48} height={48} />
                    <span className="text-xs text-violet-300">Match 5 → Bomb (3×3)</span>
                  </div>
                </div>
              </Section>

              <Section icon={<Bomb size={18} className="text-pink-400" />} title="Power-ups">
                <ul className="space-y-1.5 mt-1">
                  <li>🔀 <span className="text-white">Shuffle</span> — rearrange the board</li>
                  <li>💥 <span className="text-white">Destroy</span> — tap any gem to remove it</li>
                  <li>➕ <span className="text-white">+5 Moves</span> — extra moves (campaign only)</li>
                </ul>
              </Section>

              <Section icon={<Sparkles size={18} className="text-amber-400" />} title="Combos &amp; Stars">
                Chain reactions multiply your score. Earn up to <span className="text-yellow-400 font-semibold">3 stars</span> per level by exceeding the target score.
              </Section>
            </div>

            <button
              onClick={onClose}
              className="btn-primary w-full mt-6"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="text-violet-200/80 leading-relaxed pl-7">{children}</div>
    </div>
  );
}
