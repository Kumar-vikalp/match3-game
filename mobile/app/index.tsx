import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Infinity as InfinityIcon, Star, ChevronRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { loadProgress, type PlayerProgress, DEFAULT_PROGRESS } from "../src/lib/progress";
import SyncIndicator from "../src/components/SyncIndicator";
import { LEVELS } from "../src/game/levels";

export default function Home() {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);
  const maxStars = LEVELS.length * 3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <SyncIndicator />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.sparkleRow}>
            <Sparkles size={18} color="#fbbf24" />
            <Text style={styles.eyebrow}>MATCH-3 PUZZLE</Text>
            <Sparkles size={18} color="#fbbf24" />
          </View>
          <Text style={styles.titleTop}>GEM</Text>
          <Text style={styles.titleBottom}>CRUSH</Text>
          <Text style={styles.tagline}>Match · Combo · Conquer</Text>
        </View>

        <View style={styles.buttons}>
          <Link href="/levels" asChild>
            <Pressable
              onPress={() => Haptics.selectionAsync()}
              style={({ pressed }) => [pressed && styles.btnPressed]}
            >
              <LinearGradient
                colors={["#a855f7", "#7c3aed", "#5b21b6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnGradient}
              >
                <Trophy size={26} color="#fff" strokeWidth={2.5} />
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitle}>Campaign</Text>
                  <Text style={styles.btnSubtitle}>{progress.levelsCompleted.length} / {LEVELS.length} levels</Text>
                </View>
                <ChevronRight size={22} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </Pressable>
          </Link>

          <Link href="/endless" asChild>
            <Pressable
              onPress={() => Haptics.selectionAsync()}
              style={({ pressed }) => [pressed && styles.btnPressed]}
            >
              <LinearGradient
                colors={["#0891b2", "#155e75"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnGradient}
              >
                <InfinityIcon size={26} color="#fff" strokeWidth={2.5} />
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitle}>Endless</Text>
                  <Text style={styles.btnSubtitle}>Best · {progress.endlessHighScore.toLocaleString()}</Text>
                </View>
                <ChevronRight size={22} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </Pressable>
          </Link>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <View style={styles.statIcon}>
                <Star size={16} color="#fbbf24" fill="#fbbf24" />
              </View>
              <Text style={styles.statValue}>{totalStars}</Text>
              <Text style={styles.statMax}>/ {maxStars}</Text>
              <Text style={styles.statLabel}>Stars</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBlock}>
              <View style={styles.statIcon}>
                <Trophy size={16} color="#a78bfa" />
              </View>
              <Text style={styles.statValue}>{progress.levelsCompleted.length}</Text>
              <Text style={styles.statMax}>/ {LEVELS.length}</Text>
              <Text style={styles.statLabel}>Levels</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBlock}>
              <View style={styles.statIcon}>
                <InfinityIcon size={16} color="#22d3ee" />
              </View>
              <Text style={styles.statValue}>
                {progress.endlessHighScore > 999
                  ? `${(progress.endlessHighScore / 1000).toFixed(1)}k`
                  : progress.endlessHighScore}
              </Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Text style={styles.footer}>v1.0 · Made with ✨</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0118" },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: "center",
    gap: 36,
  },
  heroSection: { alignItems: "center", marginTop: 24 },
  sparkleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
  },
  titleTop: {
    fontSize: 88,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -4,
    lineHeight: 88,
    marginTop: 8,
    textShadowColor: "rgba(168, 85, 247, 0.55)",
    textShadowRadius: 35,
    textShadowOffset: { width: 0, height: 0 },
  },
  titleBottom: {
    fontSize: 88,
    fontWeight: "900",
    color: "#fbbf24",
    letterSpacing: -4,
    lineHeight: 88,
    marginTop: -12,
    textShadowColor: "rgba(251, 191, 36, 0.5)",
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
  },
  tagline: {
    color: "rgba(167, 139, 250, 0.85)",
    fontSize: 14,
    marginTop: 14,
    fontWeight: "600",
    letterSpacing: 2,
  },
  buttons: { width: "100%", gap: 14 },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  btnTextWrap: { flex: 1, gap: 2 },
  btnTitle: { color: "#fff", fontWeight: "800", fontSize: 19, letterSpacing: -0.3 },
  btnSubtitle: { color: "rgba(255, 255, 255, 0.7)", fontSize: 12, fontWeight: "500" },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  statsCard: {
    backgroundColor: "rgba(31, 19, 66, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.25)",
    borderRadius: 20,
    padding: 4,
  },
  statsRow: { flexDirection: "row", paddingVertical: 14 },
  statBlock: { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statMax: {
    color: "rgba(167, 139, 250, 0.6)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: -2,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(167, 139, 250, 0.7)",
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  divider: { width: 1, backgroundColor: "rgba(139, 92, 246, 0.15)" },
  footer: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    color: "rgba(167, 139, 250, 0.3)",
    fontSize: 10,
  },
});
