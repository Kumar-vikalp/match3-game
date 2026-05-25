import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BoardState, PowerUp } from "../engine";

const KEY_PREFIX = "@gemcrush:savedGame:";

export interface SavedGame {
  levelId: number;
  board: BoardState;
  score: number;
  combo: number;
  movesLeft: number;
  targetScore: number;
  powerUps: PowerUp[];
  savedAt: number;
}

const key = (levelId: number) => `${KEY_PREFIX}level_${levelId}`;

export async function getSavedGame(levelId: number): Promise<SavedGame | null> {
  try {
    const raw = await AsyncStorage.getItem(key(levelId));
    if (!raw) return null;
    return JSON.parse(raw) as SavedGame;
  } catch {
    return null;
  }
}

export async function saveGame(game: SavedGame): Promise<void> {
  try {
    await AsyncStorage.setItem(key(game.levelId), JSON.stringify(game));
  } catch {
    // ignore
  }
}

export async function clearSavedGame(levelId: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(levelId));
  } catch {
    // ignore
  }
}

export async function clearAllSavedGames(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) => k.startsWith(KEY_PREFIX));
    if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
  } catch {
    // ignore
  }
}
