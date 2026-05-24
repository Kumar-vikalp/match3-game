"use client";

import Image from "next/image";

const GEMS = ["red", "blue", "green", "yellow", "purple", "orange"];

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  gem: GEMS[i % GEMS.length],
  top: `${(i * 37) % 100}%`,
  left: `${(i * 53) % 100}%`,
  size: 32 + (i % 3) * 16,
  duration: 18 + (i % 5) * 4,
  delay: (i * 1.3) % 10,
  opacity: 0.08 + (i % 3) * 0.04,
}));

export default function FloatingGems() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute float-gem"
          style={
            {
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              "--dur": `${p.duration}s`,
              "--delay": `${p.delay}s`,
              filter: "blur(0.5px)",
            } as React.CSSProperties
          }
        >
          <Image
            src={`/gems/${p.gem}.png`}
            alt=""
            width={p.size}
            height={p.size}
            className="w-full h-full"
          />
        </div>
      ))}
    </div>
  );
}
