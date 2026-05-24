import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@gemcrush:userId";

let cachedId: string | null = null;

function uuid(): string {
  // RFC4122 v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getUserId(): Promise<string> {
  if (cachedId) return cachedId;
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored) {
      cachedId = stored;
      return stored;
    }
    const id = uuid();
    await AsyncStorage.setItem(KEY, id);
    cachedId = id;
    return id;
  } catch {
    return uuid();
  }
}
