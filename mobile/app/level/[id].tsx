import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LEVELS } from "../../src/game/levels";
import { useGameEngine } from "../../src/game/useGameEngine";
import GameBoard from "../../src/components/GameBoard";
import HUD from "../../src/components/HUD";
import GameOverModal from "../../src/components/GameOverModal";
import { calculateStars, recordLevelComplete } from "../../src/lib/progress";

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const levelId = Number(id);
  const level = LEVELS.find((l) => l.id === levelId);
  const nextLevel = LEVELS.find((l) => l.id === levelId + 1);

  const [showResult, setShowResult] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [resultData, setResultData] = useState<{ won: boolean; score: number } | null>(null);

  const handleEnd = useCallback(
    async (info: { won: boolean; score: number; movesLeft: number; maxMoves: number }) => {
      if (!level) return;
      setResultData({ won: info.won, score: info.score });
      setShowResult(true);

      if (info.won) {
        const stars = calculateStars(info.score, level.targetScore, info.movesLeft, info.maxMoves);
        await recordLevelComplete(level.id, info.score, stars);
      }
    },
    [level]
  );

  if (!level) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Level not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>LEVEL {level.id}</Text>
          <Text style={styles.headerName}>{level.name}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.gameArea}>
        <Game
          key={resetKey}
          level={level}
          onEnd={handleEnd}
        />
      </View>

      <GameOverModal
        visible={showResult}
        won={!!resultData?.won}
        score={resultData?.score ?? 0}
        targetScore={level.targetScore}
        hasNextLevel={!!resultData?.won && !!nextLevel}
        onRestart={() => {
          setShowResult(false);
          setResetKey((k) => k + 1);
        }}
        onBack={() => router.back()}
        onNext={() => {
          if (nextLevel) {
            router.replace(`/level/${nextLevel.id}` as any);
          }
        }}
      />
    </SafeAreaView>
  );
}

function Game({
  level,
  onEnd,
}: {
  level: (typeof LEVELS)[number];
  onEnd: (info: { won: boolean; score: number; movesLeft: number; maxMoves: number }) => void;
}) {
  const { snapshot, handleClick, requestSwap, usePowerUp } = useGameEngine({
    config: { rows: level.rows, cols: level.cols, numColors: level.numColors },
    targetScore: level.targetScore,
    maxMoves: level.maxMoves,
    mode: "level",
    onGameEnd: onEnd,
  });

  return (
    <>
      <HUD
        score={snapshot.score}
        movesLeft={snapshot.movesLeft}
        targetScore={snapshot.targetScore}
        combo={snapshot.combo}
        mode="level"
        powerUps={snapshot.powerUps}
        destroyMode={snapshot.destroyMode}
        onUsePowerUp={usePowerUp}
      />
      <View style={{ marginTop: 16 }}>
        <GameBoard snapshot={snapshot} onClick={handleClick} onSwap={requestSwap} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0118" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerLabel: {
    fontSize: 10,
    color: "rgba(167,139,250,0.7)",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  gameArea: { flex: 1, paddingHorizontal: 8, paddingVertical: 8 },
  notFound: { color: "#fff", textAlign: "center", marginTop: 100 },
});
