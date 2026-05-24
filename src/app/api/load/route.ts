import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DEFAULT_PROGRESS } from "@/lib/progress";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json(DEFAULT_PROGRESS);

  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as Record<string, { get: (k: string) => Promise<string | null> }>).GAME_KV;
    const data = await kv.get(`progress:${userId}`);
    if (data) return NextResponse.json(JSON.parse(data));
  } catch {
    // KV not available (local dev)
  }

  return NextResponse.json(DEFAULT_PROGRESS);
}
