import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameEngine } from "../src/game/useGameEngine";
import GameBoard from "../src/components/GameBoard";
import HUD from "../src/components/HUD";
import GameOverModal from "../src/components/GameOverModal";
import { recordEndlessScore } from "../src/lib/progress";

export default function EndlessScreen() {
  const router = useRouter();
  const [showResult, setShowResult] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [score, setScore] = useState(0);

  const handleEnd = useCallback(async (info: { won: boolean; score: number; movesLeft: number; maxMoves: number }) => {
    setScore(info.score);
    setShowResult(true);
    await recordEndlessScore(info.score);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>♾ Endless</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.gameArea}>
        <EndlessGame key={resetKey} onEnd={handleEnd} />
      </View>

      <GameOverModal
        visible={showResult}
        won={false}
        score={score}
        onRestart={() => {
          setShowResult(false);
          setResetKey((k) => k + 1);
        }}
        onBack={() => router.back()}
      />
    </SafeAreaView>
  );
}

function EndlessGame({ onEnd }: { onEnd: (info: { won: boolean; score: number; movesLeft: number; maxMoves: number }) => void }) {
  const { snapshot, handleClick, requestSwap, usePowerUp } = useGameEngine({
    config: { rows: 8, cols: 8, numColors: 6 },
    mode: "endless",
    onGameEnd: onEnd,
  });

  return (
    <>
      <HUD
        score={snapshot.score}
        movesLeft={snapshot.movesLeft}
        targetScore={snapshot.targetScore}
        combo={snapshot.combo}
        mode="endless"
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
  headerName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  gameArea: { flex: 1, paddingHorizontal: 8, paddingVertical: 8 },
});
