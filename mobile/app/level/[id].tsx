import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, AppState, BackHandler } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LEVELS } from "../../src/game/levels";
import { useGameEngine, type GameSnapshot } from "../../src/game/useGameEngine";
import GameBoard from "../../src/components/GameBoard";
import HUD from "../../src/components/HUD";
import GameOverModal from "../../src/components/GameOverModal";
import ResumeModal from "../../src/components/ResumeModal";
import { calculateStars, recordLevelComplete } from "../../src/lib/progress";
import {
  getSavedGame,
  saveGame,
  clearSavedGame,
  type SavedGame,
} from "../../src/lib/savedGame";

type Phase = "loading" | "ask-resume" | "playing";

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const levelId = Number(id);
  const level = LEVELS.find((l) => l.id === levelId);
  const nextLevel = LEVELS.find((l) => l.id === levelId + 1);

  const [phase, setPhase] = useState<Phase>("loading");
  const [resumeData, setResumeData] = useState<SavedGame | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [resultData, setResultData] = useState<{ won: boolean; score: number } | null>(null);

  // On mount, check for a saved game
  useEffect(() => {
    if (!level) return;
    let cancelled = false;
    (async () => {
      const saved = await getSavedGame(level.id);
      if (cancelled) return;
      if (saved) {
        setResumeData(saved);
        setPhase("ask-resume");
      } else {
        setPhase("playing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [level?.id]);

  const handleEnd = useCallback(
    async (info: { won: boolean; score: number; movesLeft: number; maxMoves: number }) => {
      if (!level) return;
      // Game ended - clear saved snapshot for this level
      await clearSavedGame(level.id);

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
          <Text style={styles.headerLabel}>LEVEL {level.id}</Text>
          <Text style={styles.headerName}>{level.name}</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      {phase === "playing" && (
        <View style={styles.gameArea}>
          <Game
            key={resetKey}
            level={level}
            initial={resumeData ? toInitial(resumeData) : undefined}
            onEnd={handleEnd}
          />
        </View>
      )}

      <ResumeModal
        visible={phase === "ask-resume" && !!resumeData}
        score={resumeData?.score ?? 0}
        movesLeft={resumeData?.movesLeft ?? 0}
        savedAtAgo={resumeData ? timeAgo(resumeData.savedAt) : ""}
        onResume={() => {
          setPhase("playing");
        }}
        onNewGame={async () => {
          await clearSavedGame(level.id);
          setResumeData(null);
          setResetKey((k) => k + 1);
          setPhase("playing");
        }}
        onQuit={() => {
          router.back();
        }}
      />

      <GameOverModal
        visible={showResult}
        won={!!resultData?.won}
        score={resultData?.score ?? 0}
        targetScore={level.targetScore}
        hasNextLevel={!!resultData?.won && !!nextLevel}
        onRestart={async () => {
          await clearSavedGame(level.id);
          setResumeData(null);
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

function toInitial(saved: SavedGame) {
  return {
    board: saved.board,
    score: saved.score,
    combo: saved.combo,
    movesLeft: saved.movesLeft,
    powerUps: saved.powerUps,
  };
}

function Game({
  level,
  initial,
  onEnd,
}: {
  level: (typeof LEVELS)[number];
  initial?: ReturnType<typeof toInitial>;
  onEnd: (info: { won: boolean; score: number; movesLeft: number; maxMoves: number }) => void;
}) {
  const { snapshot, handleClick, requestSwap, usePowerUp } = useGameEngine({
    config: { rows: level.rows, cols: level.cols, numColors: level.numColors },
    targetScore: level.targetScore,
    maxMoves: level.maxMoves,
    mode: "level",
    initial,
    onGameEnd: onEnd,
  });

  // Keep latest snapshot in a ref for save-on-unmount
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  // Persist on background / unmount, but only if game is in progress (not over, not pristine)
  useEffect(() => {
    const persistIfNeeded = () => {
      const s = snapshotRef.current;
      if (s.state === "gameover") return;
      // Only save if user has actually played (score > 0 or used moves)
      const usedMoves = level.maxMoves > 0 && s.movesLeft < level.maxMoves;
      if (s.score === 0 && !usedMoves) return;
      void saveGame({
        levelId: level.id,
        board: s.board,
        score: s.score,
        combo: s.combo,
        movesLeft: s.movesLeft,
        targetScore: s.targetScore,
        powerUps: s.powerUps,
        savedAt: Date.now(),
      });
    };

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") persistIfNeeded();
    });

    return () => {
      sub.remove();
      persistIfNeeded();
    };
  }, [level.id, level.maxMoves]);

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
  headerCenter: { flex: 1, alignItems: "center" },
  headerLabel: {
    fontSize: 10,
    color: "rgba(167, 139, 250, 0.7)",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  gameArea: { flex: 1, paddingHorizontal: 8, paddingVertical: 8 },
  notFound: { color: "#fff", textAlign: "center", marginTop: 100 },
});
