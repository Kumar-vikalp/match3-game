import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface PlayerProgress {
  levelsCompleted: number[];
  highScores: Record<string, number>;
  stars: Record<string, number>;
  endlessHighScore: number;
  updatedAt?: number;
}

type SyncOp =
  | { type: "level_complete"; levelId: number; ts: number }
  | { type: "level_score"; levelId: number; score: number; stars: number; ts: number }
  | { type: "endless_score"; score: number; ts: number };

interface SyncRequest {
  userId: string;
  ops: SyncOp[];
  // Client snapshot to merge against (helps when ops are missing/lossy)
  snapshot?: PlayerProgress;
}

const DEFAULT: PlayerProgress = {
  levelsCompleted: [],
  highScores: {},
  stars: {},
  endlessHighScore: 0,
};

function isValidUserId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9-]{8,128}$/.test(id);
}

/**
 * Last-write-wins per-field merge. Numeric fields take MAX of values
 * (high scores can only go up). Set fields union. Never decrease values.
 */
function mergeProgress(a: PlayerProgress, b: PlayerProgress): PlayerProgress {
  const levels = new Set<number>([...a.levelsCompleted, ...b.levelsCompleted]);
  const highScores: Record<string, number> = { ...a.highScores };
  for (const [k, v] of Object.entries(b.highScores)) {
    highScores[k] = Math.max(highScores[k] ?? 0, v);
  }
  const stars: Record<string, number> = { ...a.stars };
  for (const [k, v] of Object.entries(b.stars)) {
    stars[k] = Math.max(stars[k] ?? 0, v);
  }
  return {
    levelsCompleted: Array.from(levels).sort((x, y) => x - y),
    highScores,
    stars,
    endlessHighScore: Math.max(a.endlessHighScore, b.endlessHighScore),
    updatedAt: Math.max(a.updatedAt ?? 0, b.updatedAt ?? 0, Date.now()),
  };
}

function applyOp(progress: PlayerProgress, op: SyncOp): PlayerProgress {
  const next = { ...progress };
  if (op.type === "level_complete") {
    if (!next.levelsCompleted.includes(op.levelId)) {
      next.levelsCompleted = [...next.levelsCompleted, op.levelId].sort((a, b) => a - b);
    }
  } else if (op.type === "level_score") {
    const key = `level_${op.levelId}`;
    next.highScores = {
      ...next.highScores,
      [key]: Math.max(next.highScores[key] ?? 0, op.score),
    };
    next.stars = {
      ...next.stars,
      [key]: Math.max(next.stars[key] ?? 0, op.stars),
    };
  } else if (op.type === "endless_score") {
    next.endlessHighScore = Math.max(next.endlessHighScore, op.score);
  }
  next.updatedAt = Math.max(next.updatedAt ?? 0, op.ts);
  return next;
}

export async function POST(request: Request) {
  let body: SyncRequest;
  try {
    body = (await request.json()) as SyncRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!isValidUserId(body.userId)) {
    return NextResponse.json({ error: "invalid userId" }, { status: 400 });
  }

  if (!Array.isArray(body.ops) || body.ops.length > 200) {
    return NextResponse.json({ error: "invalid ops" }, { status: 400 });
  }

  // Add CORS headers - mobile clients hit this directly
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  let stored: PlayerProgress = { ...DEFAULT };
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as Record<string, { get: (k: string) => Promise<string | null>; put: (k: string, v: string) => Promise<void> }>).GAME_KV;
    if (kv) {
      const raw = await kv.get(`progress:${body.userId}`);
      if (raw) {
        try {
          stored = { ...DEFAULT, ...JSON.parse(raw) };
        } catch {
          stored = { ...DEFAULT };
        }
      }
    }

    // Merge incoming snapshot first
    if (body.snapshot) {
      stored = mergeProgress(stored, { ...DEFAULT, ...body.snapshot });
    }

    // Apply ops in chronological order
    const sortedOps = [...body.ops].sort((a, b) => a.ts - b.ts);
    for (const op of sortedOps) {
      stored = applyOp(stored, op);
    }

    // Persist merged result
    if (kv) {
      await kv.put(`progress:${body.userId}`, JSON.stringify(stored));
    }
  } catch (err) {
    // KV might be unavailable in dev - still return merged in-memory result
    if (body.snapshot) {
      stored = mergeProgress(stored, { ...DEFAULT, ...body.snapshot });
    }
    for (const op of [...body.ops].sort((a, b) => a.ts - b.ts)) {
      stored = applyOp(stored, op);
    }
  }

  return NextResponse.json({ progress: stored }, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
