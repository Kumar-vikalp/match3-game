import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LEVELS } from "../src/game/levels";
import { loadProgress, type PlayerProgress, DEFAULT_PROGRESS } from "../src/lib/progress";

export default function Levels() {
  const router = useRouter();
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  const lastCompleted =
    progress.levelsCompleted.length > 0 ? Math.max(...progress.levelsCompleted) : 0;
  const unlockedThrough = lastCompleted + 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Campaign</Text>
          <Text style={styles.subtitle}>Choose your level</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {LEVELS.map((level) => {
          const stars = progress.stars[`level_${level.id}`] ?? 0;
          const isLocked = level.id > unlockedThrough;
          const isCompleted = progress.levelsCompleted.includes(level.id);

          if (isLocked) {
            return (
              <View key={level.id} style={[styles.card, styles.locked]}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.cardName}>Level {level.id}</Text>
              </View>
            );
          }

          return (
            <Link key={level.id} href={`/level/${level.id}` as any} asChild>
              <Pressable style={[styles.card, isCompleted && styles.cardCompleted]}>
                <Text style={styles.cardNum}>{level.id}</Text>
                <Text style={styles.cardName}>{level.name}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3].map((s) => (
                    <Text
                      key={s}
                      style={[styles.starSm, s <= stars ? styles.starSmOn : styles.starSmOff]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>{level.targetScore.toLocaleString()}</Text>
                  <Text style={styles.cardMeta}>{level.maxMoves} moves</Text>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0118" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#fff", fontSize: 24, marginTop: -2 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "rgba(167,139,250,0.7)", fontSize: 12 },
  grid: {
    padding: 16,
    gap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    width: "31.5%",
    aspectRatio: 1,
    backgroundColor: "rgba(31,19,66,0.6)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 4,
    position: "relative",
  },
  cardCompleted: { borderColor: "rgba(139,92,246,0.5)" },
  locked: { opacity: 0.4 },
  cardNum: { fontSize: 32, fontWeight: "900", color: "#fbbf24" },
  cardName: {
    color: "rgba(245,243,255,0.8)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  lockIcon: { fontSize: 24 },
  starsRow: { flexDirection: "row", gap: 2 },
  starSm: { fontSize: 12 },
  starSmOn: { color: "#fbbf24" },
  starSmOff: { color: "rgba(139,92,246,0.3)" },
  cardFooter: {
    position: "absolute",
    bottom: 6,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardMeta: { fontSize: 9, color: "rgba(167,139,250,0.6)" },
});
