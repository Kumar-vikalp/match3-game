import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadProgress, type PlayerProgress, DEFAULT_PROGRESS } from "../src/lib/progress";

export default function Home() {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroSection}>
          <Text style={styles.title}>GEM</Text>
          <Text style={styles.title}>CRUSH</Text>
          <Text style={styles.tagline}>Match. Combo. Conquer.</Text>
        </View>

        <View style={styles.buttons}>
          <Link href="/levels" asChild>
            <Pressable style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnText}>🏆  Campaign</Text>
            </Pressable>
          </Link>
          <Link href="/endless" asChild>
            <Pressable style={[styles.btn, styles.btnSecondary]}>
              <Text style={styles.btnText}>♾  Endless</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.stats}>
          <Stat label="Stars" value={`⭐ ${totalStars}`} />
          <Stat label="Levels" value={progress.levelsCompleted.length} />
          <Stat label="Best" value={progress.endlessHighScore.toLocaleString()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0118" },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
  },
  heroSection: { alignItems: "center", marginTop: 40 },
  title: {
    fontSize: 72,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -3,
    lineHeight: 78,
    textShadowColor: "rgba(139,92,246,0.6)",
    textShadowRadius: 30,
  },
  tagline: {
    color: "rgba(167,139,250,0.7)",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "500",
  },
  buttons: { width: "100%", maxWidth: 320, gap: 12 },
  btn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  btnSecondary: {
    backgroundColor: "rgba(31,19,66,0.7)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 17 },
  stats: { flexDirection: "row", gap: 12, width: "100%", maxWidth: 320 },
  stat: {
    flex: 1,
    backgroundColor: "rgba(31,19,66,0.6)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: {
    fontSize: 10,
    color: "rgba(167,139,250,0.7)",
    fontWeight: "600",
    letterSpacing: 1.2,
    marginTop: 2,
  },
});
