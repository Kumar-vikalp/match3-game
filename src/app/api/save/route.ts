import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PlayerProgress } from "@/lib/progress";

export async function POST(request: Request) {
  const { userId, progress } = (await request.json()) as {
    userId: string;
    progress: PlayerProgress;
  };

  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as Record<string, { put: (k: string, v: string) => Promise<void> }>).GAME_KV;
    await kv.put(`progress:${userId}`, JSON.stringify(progress));
  } catch {
    // KV not available (local dev) — mock success
  }

  return NextResponse.json({ ok: true });
}
