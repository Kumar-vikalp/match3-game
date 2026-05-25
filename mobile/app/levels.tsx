import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Lock, Star, Target, Hash, Trophy } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LEVELS } from "../src/game/levels";
import { loadProgress, type PlayerProgress, DEFAULT_PROGRESS } from "../src/lib/progress";

export default function Levels() {
  const router = useRouter();
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const lastCompleted =
    progress.levelsCompleted.length > 0 ? Math.max(...progress.levelsCompleted) : 0;
  const unlockedThrough = lastCompleted + 1;
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);
  const maxStars = LEVELS.length * 3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Campaign</Text>
          <Text style={styles.subtitle}>{progress.levelsCompleted.length} of {LEVELS.length} levels</Text>
        </View>
        <View style={styles.starCounter}>
          <Star size={14} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.starCount}>
            {totalStars}<Text style={styles.starMax}>/{maxStars}</Text>
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {LEVELS.map((level) => {
            const stars = progress.stars[`level_${level.id}`] ?? 0;
            const isLocked = level.id > unlockedThrough;
            const isCompleted = progress.levelsCompleted.includes(level.id);
            const highScore = progress.highScores[`level_${level.id}`];

            if (isLocked) {
              return (
                <View key={level.id} style={[styles.card, styles.locked]}>
                  <Lock size={28} color="rgba(167, 139, 250, 0.4)" />
                  <Text style={styles.lockedNum}>{level.id}</Text>
                </View>
              );
            }

            return (
              <Link key={level.id} href={`/level/${level.id}` as any} asChild>
                <Pressable
                  onPress={() => Haptics.selectionAsync()}
                  style={({ pressed }) => [
                    styles.cardWrap,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <LinearGradient
                    colors={
                      isCompleted
                        ? ["rgba(139, 92, 246, 0.4)", "rgba(31, 19, 66, 0.7)"]
                        : ["rgba(31, 19, 66, 0.7)", "rgba(15, 4, 32, 0.7)"]
                    }
                    style={[
                      styles.card,
                      isCompleted && styles.cardCompleted,
                    ]}
                  >
                    <Text style={styles.cardNum}>{level.id}</Text>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {level.name}
                    </Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          color={s <= stars ? "#fbbf24" : "rgba(139, 92, 246, 0.25)"}
                          fill={s <= stars ? "#fbbf24" : "transparent"}
                        />
                      ))}
                    </View>
                    {highScore && (
                      <Text style={styles.highScore}>
                        Best · {highScore.toLocaleString()}
                      </Text>
                    )}
                    <View style={styles.cardFooter}>
                      <View style={styles.footerItem}>
                        <Target size={9} color="rgba(167, 139, 250, 0.65)" />
                        <Text style={styles.footerText}>
                          {level.targetScore >= 1000
                            ? `${level.targetScore / 1000}k`
                            : level.targetScore}
                        </Text>
                      </View>
                      <View style={styles.footerItem}>
                        <Hash size={9} color="rgba(167, 139, 250, 0.65)" />
                        <Text style={styles.footerText}>{level.maxMoves}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0118" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(167, 139, 250, 0.7)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  starCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
    borderRadius: 100,
  },
  starCount: {
    color: "#fbbf24",
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  starMax: {
    color: "rgba(251, 191, 36, 0.5)",
    fontSize: 11,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  cardWrap: {
    width: "47%",
    aspectRatio: 1,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cardCompleted: {
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  locked: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "rgba(31, 19, 66, 0.4)",
    opacity: 0.55,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  lockedNum: {
    color: "rgba(167, 139, 250, 0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  cardNum: {
    fontSize: 44,
    fontWeight: "900",
    color: "#fbbf24",
    letterSpacing: -2,
    textShadowColor: "rgba(251, 191, 36, 0.4)",
    textShadowRadius: 16,
  },
  cardName: {
    color: "rgba(245, 243, 255, 0.85)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.2,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  highScore: {
    color: "rgba(34, 211, 238, 0.85)",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  cardFooter: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  footerText: {
    fontSize: 9,
    color: "rgba(167, 139, 250, 0.7)",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
