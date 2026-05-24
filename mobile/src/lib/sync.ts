import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { AppState, AppStateStatus } from "react-native";
import { getUserId } from "./userId";
import { loadProgress, saveProgress, type PlayerProgress } from "./progress";

const QUEUE_KEY = "@gemcrush:syncQueue";
const LAST_SYNC_KEY = "@gemcrush:lastSyncAt";

// Server endpoint - point this at your Cloudflare Workers deploy
// You can override via app.json `expo.extra.syncBaseUrl`
const DEFAULT_BASE = "https://match3-game.kumarvikalp.workers.dev";

import Constants from "expo-constants";
const BASE_URL: string =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.syncBaseUrl ??
  DEFAULT_BASE;

// ---- Sync queue types -----------------------------------------------------

export type SyncOp =
  | { type: "level_complete"; levelId: number; ts: number }
  | { type: "level_score"; levelId: number; score: number; stars: number; ts: number }
  | { type: "endless_score"; score: number; ts: number };

interface QueuedOp {
  id: string; // local op id
  op: SyncOp;
  attempts: number;
}

// ---- Queue persistence ----------------------------------------------------

async function readQueue(): Promise<QueuedOp[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedOp[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export async function enqueueSync(op: SyncOp): Promise<void> {
  const queue = await readQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    op,
    attempts: 0,
  });
  await writeQueue(queue);
  // Trigger a sync attempt soon (debounced)
  scheduleSync();
}

// ---- Sync manager state ---------------------------------------------------

let syncInFlight = false;
let scheduleTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = 1000; // grows on failure
const BATCH_SIZE = 25; // chunk size sent per request
const MAX_ATTEMPTS = 5;
const SYNC_DEBOUNCE_MS = 1500;

type Listener = (status: SyncStatus) => void;
const listeners = new Set<Listener>();

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  pending: number;
  lastSyncAt: number | null;
}

let currentStatus: SyncStatus = {
  online: true,
  syncing: false,
  pending: 0,
  lastSyncAt: null,
};

function notifyListeners() {
  listeners.forEach((l) => l(currentStatus));
}

export function subscribeSyncStatus(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentStatus);
  return () => {
    listeners.delete(listener);
  };
}

async function refreshStatus(partial?: Partial<SyncStatus>) {
  const queue = await readQueue();
  const lastSyncRaw = await AsyncStorage.getItem(LAST_SYNC_KEY).catch(() => null);
  currentStatus = {
    online: currentStatus.online,
    syncing: syncInFlight,
    pending: queue.length,
    lastSyncAt: lastSyncRaw ? Number(lastSyncRaw) : null,
    ...partial,
  };
  notifyListeners();
}

// ---- Sync execution -------------------------------------------------------

/**
 * Schedule a sync attempt after a short debounce. Multiple rapid enqueues
 * will collapse into a single network round-trip.
 */
export function scheduleSync(delayMs = SYNC_DEBOUNCE_MS) {
  if (scheduleTimer) clearTimeout(scheduleTimer);
  scheduleTimer = setTimeout(() => {
    scheduleTimer = null;
    flushQueue().catch(() => {});
  }, delayMs);
}

async function postBatch(userId: string, ops: SyncOp[], snapshot: PlayerProgress) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${BASE_URL}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ops, snapshot }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { progress: PlayerProgress };
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Process the queue:
 * - If offline, no-op (will retry when connection returns)
 * - Send up to BATCH_SIZE ops at a time
 * - On success, drop those ops from the queue, save merged remote state locally
 * - On failure, increment attempts; if MAX_ATTEMPTS exceeded, drop op (last write wins)
 */
export async function flushQueue(): Promise<void> {
  if (syncInFlight) return;
  if (!currentStatus.online) return;

  const queue = await readQueue();
  if (queue.length === 0) return;

  syncInFlight = true;
  await refreshStatus({ syncing: true });

  try {
    const userId = await getUserId();

    // Process in chunks to avoid blocking and to keep request payloads small
    while (true) {
      const remaining = await readQueue();
      if (remaining.length === 0) break;
      const batch = remaining.slice(0, BATCH_SIZE);
      const ops = batch.map((q) => q.op);
      const snapshot = await loadProgress();

      try {
        const { progress: merged } = await postBatch(userId, ops, snapshot);

        // Save merged result locally (server is source of truth for sync)
        await saveProgress(merged);

        // Drop the synced batch from the queue
        const after = remaining.slice(batch.length);
        await writeQueue(after);

        backoffMs = 1000; // reset on success
        await AsyncStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
        await refreshStatus();

        // Yield between batches so JS thread isn't held
        await new Promise((r) => setTimeout(r, 50));
      } catch {
        // Network/server error - increment attempts, apply backoff, exit loop
        const updated = remaining.map((q, i) =>
          i < batch.length ? { ...q, attempts: q.attempts + 1 } : q
        );
        // Drop ops that have exceeded max attempts (server may also drop, that's ok)
        const filtered = updated.filter((q) => q.attempts < MAX_ATTEMPTS);
        await writeQueue(filtered);

        backoffMs = Math.min(backoffMs * 2, 60_000);
        scheduleSync(backoffMs);
        break;
      }
    }
  } finally {
    syncInFlight = false;
    await refreshStatus({ syncing: false });
  }
}

/**
 * Pull remote state without sending ops. Useful on app cold start to merge
 * remote-only changes (e.g. user played on web) into local storage.
 */
export async function pullRemote(): Promise<void> {
  if (!currentStatus.online) return;
  try {
    const userId = await getUserId();
    const local = await loadProgress();
    const { progress } = await postBatch(userId, [], local);
    await saveProgress(progress);
    await AsyncStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    await refreshStatus();
  } catch {
    // ignore
  }
}

// ---- Lifecycle hooks ------------------------------------------------------

let initialized = false;
let netUnsub: (() => void) | null = null;
let appUnsub: { remove: () => void } | null = null;

export function initSyncManager() {
  if (initialized) return;
  initialized = true;

  // Network status
  netUnsub = NetInfo.addEventListener((state: NetInfoState) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    const wasOffline = !currentStatus.online;
    currentStatus.online = online;
    notifyListeners();
    if (online && wasOffline) {
      // Back online - flush after small delay
      scheduleSync(500);
    }
  });

  // Foreground transition - flush
  appUnsub = AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") {
      scheduleSync(800);
    }
  });

  // Initial pull + flush
  refreshStatus().then(() => {
    pullRemote().finally(() => scheduleSync(2000));
  });
}

export function disposeSyncManager() {
  if (netUnsub) netUnsub();
  if (appUnsub) appUnsub.remove();
  if (scheduleTimer) clearTimeout(scheduleTimer);
  initialized = false;
}
