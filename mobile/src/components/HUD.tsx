import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Shuffle, Bomb, Plus, Hash, Target } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { PowerUpType, PowerUp } from "../engine";

interface Props {
  score: number;
  movesLeft: number;
  targetScore: number;
  combo: number;
  mode: "level" | "endless";
  powerUps: PowerUp[];
  destroyMode: boolean;
  onUsePowerUp: (type: PowerUpType) => void;
}

const POWERUP_ICONS: Record<PowerUpType, (color: string) => React.ReactElement> = {
  [PowerUpType.Shuffle]: (c) => <Shuffle size={22} color={c} strokeWidth={2.5} />,
  [PowerUpType.DestroyGem]: (c) => <Bomb size={22} color={c} strokeWidth={2.5} />,
  [PowerUpType.ExtraMoves]: (c) => <Plus size={22} color={c} strokeWidth={2.5} />,
};

const POWERUP_NAMES: Record<PowerUpType, string> = {
  [PowerUpType.Shuffle]: "Shuffle",
  [PowerUpType.DestroyGem]: "Destroy",
  [PowerUpType.ExtraMoves]: "+5 Moves",
};

export default function HUD({
  score,
  movesLeft,
  targetScore,
  combo,
  mode,
  powerUps,
  destroyMode,
  onUsePowerUp,
}: Props) {
  const progress = targetScore > 0 ? Math.min(score / targetScore, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.scoreRow}>
        <View>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>
        {mode === "level" ? (
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>MOVES</Text>
            <Text style={[styles.scoreValue, movesLeft <= 3 && movesLeft > 0 && styles.danger]}>
              {movesLeft}
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>MODE</Text>
            <Text style={styles.endlessLabel}>Endless</Text>
          </View>
        )}
      </View>

      {mode === "level" && targetScore > 0 && (
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      <View style={styles.banner}>
        {destroyMode && <Text style={styles.destroyHint}>Tap a gem to destroy 💥</Text>}
        {!destroyMode && combo > 1 && (
          <Text style={styles.comboText}>{combo}x COMBO!</Text>
        )}
      </View>

      <View style={styles.powerUps}>
        {powerUps.map((pu) => {
          const isActive = destroyMode && pu.type === PowerUpType.DestroyGem;
          const disabled = pu.uses <= 0;
          const iconColor = disabled ? "#6b5b95" : isActive ? "#fff" : "#e9d5ff";
          return (
            <Pressable
              key={pu.type}
              onPress={() => {
                if (!disabled) {
                  Haptics.selectionAsync();
                  onUsePowerUp(pu.type);
                }
              }}
              disabled={disabled}
              style={[
                styles.powerUpBtn,
                isActive && styles.powerUpActive,
                disabled && styles.powerUpDisabled,
              ]}
            >
              {POWERUP_ICONS[pu.type](iconColor)}
              <Text style={[styles.powerUpName, disabled && { color: "#6b5b95" }]}>
                {POWERUP_NAMES[pu.type]}
              </Text>
              <View style={[styles.usesBadge, disabled && styles.usesBadgeOff]}>
                <Text style={[styles.usesText, disabled && { color: "#94a3b8" }]}>{pu.uses}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 8, gap: 12 },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(31,19,66,0.6)",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },
  label: {
    fontSize: 10,
    color: "rgba(167,139,250,0.7)",
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  danger: { color: "#f87171" },
  endlessLabel: { fontSize: 16, color: "#22d3ee", fontWeight: "700" },
  progressBg: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 3,
    overflow: "hidden",
    marginHorizontal: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fbbf24",
    borderRadius: 3,
  },
  banner: { height: 24, alignItems: "center", justifyContent: "center" },
  destroyHint: { color: "#ec4899", fontWeight: "700", fontSize: 14 },
  comboText: {
    color: "#fbbf24",
    fontWeight: "800",
    fontSize: 16,
  },
  powerUps: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  powerUpBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    position: "relative",
    gap: 4,
  },
  powerUpActive: {
    backgroundColor: "rgba(236,72,153,0.25)",
    borderColor: "#ec4899",
  },
  powerUpDisabled: { opacity: 0.45 },
  powerUpName: { fontSize: 11, color: "#e9d5ff", fontWeight: "700", letterSpacing: 0.3 },
  usesBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fbbf24",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  usesBadgeOff: { backgroundColor: "#475569" },
  usesText: { fontSize: 11, fontWeight: "800", color: "#0f172a" },
});
