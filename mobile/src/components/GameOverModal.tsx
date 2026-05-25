import React, { useEffect } from "react";
import { Modal, View, Text, Image, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { calculateStars } from "../lib/progress";

const IMG_STAR = require("../../assets/icons/star.png");
const IMG_BANNER = require("../../assets/icons/win-banner.png");

interface Props {
  visible: boolean;
  won: boolean;
  score: number;
  targetScore?: number;
  movesLeft?: number;
  maxMoves?: number;
  hasNextLevel?: boolean;
  onRestart: () => void;
  onBack: () => void;
  onNext?: () => void;
}

export default function GameOverModal({
  visible,
  won,
  score,
  targetScore = 0,
  movesLeft = 0,
  maxMoves = 0,
  hasNextLevel = false,
  onRestart,
  onBack,
  onNext,
}: Props) {
  const stars = won && targetScore > 0 ? calculateStars(score, targetScore, movesLeft, maxMoves) : 0;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      );
    }
  }, [visible, won]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {won && (
            <Image source={IMG_BANNER} style={styles.banner} resizeMode="contain" />
          )}
          <Text style={[styles.title, won ? styles.winTitle : styles.loseTitle]}>
            {won ? "Level Complete!" : "Out of Moves"}
          </Text>

          {won && targetScore > 0 && (
            <View style={styles.starsRow}>
              {[1, 2, 3].map((s) => (
                <Image
                  key={s}
                  source={IMG_STAR}
                  style={[styles.starImg, s > stars && styles.starImgOff]}
                  resizeMode="contain"
                />
              ))}
            </View>
          )}

          {!won && (
            <Text style={styles.subtitle}>So close! Try a different approach.</Text>
          )}

          <Text style={styles.scoreLabel}>FINAL SCORE</Text>
          <Text style={styles.score}>{score.toLocaleString()}</Text>
          {targetScore > 0 && (
            <Text style={styles.target}>Target: {targetScore.toLocaleString()}</Text>
          )}

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.selectionAsync();
                onBack();
              }}
            >
              <Text style={styles.btnText}>Back</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.selectionAsync();
                onRestart();
              }}
            >
              <Text style={styles.btnText}>Retry</Text>
            </Pressable>
            {won && hasNextLevel && onNext && (
              <Pressable
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onNext();
                }}
              >
                <Text style={styles.btnTextPrimary}>Next →</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1f1342",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    borderRadius: 24,
    padding: 28,
    paddingTop: 32,
    alignItems: "center",
  },
  banner: { width: 280, height: 80, marginTop: -64, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginTop: 8 },
  winTitle: { color: "#fbbf24" },
  loseTitle: { color: "#a78bfa" },
  starsRow: { flexDirection: "row", marginTop: 20, gap: 14 },
  starImg: { width: 56, height: 56 },
  starImgOff: { opacity: 0.18 },
  subtitle: { color: "rgba(167,139,250,0.8)", marginTop: 12, textAlign: "center" },
  scoreLabel: {
    marginTop: 24,
    fontSize: 10,
    color: "rgba(167,139,250,0.7)",
    fontWeight: "700",
    letterSpacing: 2,
  },
  score: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    marginTop: 4,
  },
  target: { fontSize: 12, color: "rgba(167,139,250,0.7)", marginTop: 4 },
  buttons: { flexDirection: "row", gap: 8, marginTop: 24, width: "100%" },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  btnPrimary: {
    backgroundColor: "#8b5cf6",
    flex: 1.4,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  btnTextPrimary: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
