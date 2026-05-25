import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Play, RotateCcw, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface Props {
  visible: boolean;
  score: number;
  movesLeft: number;
  savedAtAgo: string;
  onResume: () => void;
  onNewGame: () => void;
  onQuit: () => void;
}

export default function ResumeModal({
  visible,
  score,
  movesLeft,
  savedAtAgo,
  onResume,
  onNewGame,
  onQuit,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Resume game?</Text>
          <Text style={styles.subtitle}>You have a game in progress</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>SCORE</Text>
              <Text style={styles.statValue}>{score.toLocaleString()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>MOVES</Text>
              <Text style={styles.statValue}>{movesLeft}</Text>
            </View>
          </View>

          <Text style={styles.savedAt}>Saved {savedAtAgo}</Text>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onResume();
            }}
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={["#a855f7", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnPrimary}
            >
              <Play size={18} color="#fff" fill="#fff" />
              <Text style={styles.btnPrimaryText}>Resume</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onNewGame();
            }}
            style={({ pressed }) => [
              styles.btnSecondary,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <RotateCcw size={16} color="#e9d5ff" />
            <Text style={styles.btnSecondaryText}>New game</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onQuit();
            }}
            style={({ pressed }) => [
              styles.btnGhost,
              pressed && { opacity: 0.6 },
            ]}
          >
            <X size={14} color="rgba(167, 139, 250, 0.7)" />
            <Text style={styles.btnGhostText}>Quit</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 1, 24, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1f1342",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    borderRadius: 24,
    padding: 24,
    alignItems: "stretch",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(167, 139, 250, 0.8)",
    textAlign: "center",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 18,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: {
    fontSize: 10,
    color: "rgba(167, 139, 250, 0.7)",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  statValue: {
    color: "#fbbf24",
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: "rgba(139, 92, 246, 0.2)" },
  savedAt: {
    fontSize: 11,
    color: "rgba(167, 139, 250, 0.55)",
    textAlign: "center",
    marginTop: 10,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  btnSecondaryText: { color: "#e9d5ff", fontWeight: "700", fontSize: 14 },
  btnGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  btnGhostText: {
    color: "rgba(167, 139, 250, 0.7)",
    fontWeight: "600",
    fontSize: 13,
  },
});
