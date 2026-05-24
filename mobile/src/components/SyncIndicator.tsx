import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { subscribeSyncStatus, type SyncStatus } from "../lib/sync";

export default function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    online: true,
    syncing: false,
    pending: 0,
    lastSyncAt: null,
  });

  useEffect(() => subscribeSyncStatus(setStatus), []);

  let label = "Synced";
  let dotColor = "#22c55e";

  if (!status.online) {
    label = "Offline";
    dotColor = "#94a3b8";
  } else if (status.syncing) {
    label = "Syncing…";
    dotColor = "#fbbf24";
  } else if (status.pending > 0) {
    label = `Pending ${status.pending}`;
    dotColor = "#fbbf24";
  }

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(31,19,66,0.6)",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  text: { color: "rgba(245,243,255,0.8)", fontSize: 11, fontWeight: "600" },
});
