import { useCallback, useEffect, useRef, useState } from "react";
import {
  BoardState,
  GameConfig,
  Position,
  CascadeStep,
  createBoard,
  swap,
  isAdjacent,
  findMatches,
  resolveCascade,
  calculateScore,
  hasValidMoves,
  PowerUpType,
  PowerUp,
  applyShuffle,
} from "../../../src/engine";

export type GameStateValue = "idle" | "selected" | "animating" | "gameover";

export interface AnimationFrame {
  type: "swap" | "swap-back" | "remove" | "fall" | "spawn" | "settle";
  duration: number;
  data?: any;
}

export interface GameSnapshot {
  board: BoardState;
  score: number;
  combo: number;
  movesLeft: number;
  targetScore: number;
  state: GameStateValue;
  powerUps: PowerUp[];
  destroyMode: boolean;
  selected: Position | null;
  // Animation state - what's currently animating
  currentAnim: AnimationFrame | null;
  animStartTime: number;
}

interface Options {
  config: GameConfig;
  maxMoves?: number;
  targetScore?: number;
  mode: "level" | "endless";
  onGameEnd?: (won: boolean, score: number) => void;
}

const SWAP_MS = 200;
const REMOVE_MS = 220;
const FALL_MS = 200;
const SPAWN_MS = 180;

function createPowerUp(type: PowerUpType): PowerUp {
  return { type, uses: 3 };
}

export function useGameEngine({ config, maxMoves = -1, targetScore = 0, mode, onGameEnd }: Options) {
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => ({
    board: createBoard(config),
    score: 0,
    combo: 0,
    movesLeft: maxMoves,
    targetScore,
    state: "idle",
    powerUps: [
      createPowerUp(PowerUpType.Shuffle),
      createPowerUp(PowerUpType.DestroyGem),
      ...(mode === "level" ? [createPowerUp(PowerUpType.ExtraMoves)] : []),
    ],
    destroyMode: false,
    selected: null,
    currentAnim: null,
    animStartTime: 0,
  }));

  // Mutable refs for the running game (avoid stale closures during async loops)
  const stateRef = useRef(snapshot);
  stateRef.current = snapshot;

  const gameEndedRef = useRef(false);
  const animQueueRef = useRef<AnimationFrame[]>([]);
  const animRunningRef = useRef(false);

  const update = useCallback((patch: Partial<GameSnapshot>) => {
    setSnapshot((s) => {
      const next = { ...s, ...patch };
      stateRef.current = next;
      return next;
    });
  }, []);

  const isGameOver = useCallback((s: GameSnapshot): boolean => {
    if (s.targetScore > 0 && s.score >= s.targetScore) return true;
    if (s.movesLeft === 0) return true;
    if (s.movesLeft === -1 && !hasValidMoves(s.board)) return true;
    return false;
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const playAnim = async (frame: AnimationFrame) => {
    update({ currentAnim: frame, animStartTime: Date.now() });
    await sleep(frame.duration);
  };

  const runCascade = async (startBoard: BoardState) => {
    const { board: finalBoard, steps } = resolveCascade(startBoard, config);
    let curBoard = startBoard;
    let combo = 0;
    let scoreGain = 0;

    for (const step of steps) {
      // Animate remove
      await playAnim({ type: "remove", duration: REMOVE_MS, data: { positions: step.removed } });

      // Apply remove + specials to board
      const createdSet = new Set(step.specialsCreated.map((s) => `${s.pos.row},${s.pos.col}`));
      const newBoard: BoardState = curBoard.map((row) => row.map((c) => (c ? { ...c } : null)));
      for (const pos of step.removed) {
        if (!createdSet.has(`${pos.row},${pos.col}`)) newBoard[pos.row][pos.col] = null;
      }
      for (const s of step.specialsCreated) {
        const cell = newBoard[s.pos.row]?.[s.pos.col];
        if (cell) cell.type = s.type;
      }
      curBoard = newBoard;
      update({ board: curBoard });

      // Animate fall
      if (step.fell.length > 0) {
        await playAnim({ type: "fall", duration: FALL_MS, data: { movements: step.fell } });
        const sortedFell = [...step.fell].sort((a, b) => b.to.row - a.to.row);
        const fallBoard: BoardState = curBoard.map((r) => r.slice());
        for (const m of sortedFell) {
          fallBoard[m.to.row][m.to.col] = fallBoard[m.from.row][m.from.col];
          fallBoard[m.from.row][m.from.col] = null;
        }
        curBoard = fallBoard;
        update({ board: curBoard });
      }

      // Animate spawn
      if (step.spawned.length > 0) {
        const spawnBoard: BoardState = curBoard.map((r) => r.slice());
        for (const s of step.spawned) {
          spawnBoard[s.pos.row][s.pos.col] = s.cell;
        }
        curBoard = spawnBoard;
        update({ board: curBoard });
        await playAnim({ type: "spawn", duration: SPAWN_MS, data: { positions: step.spawned.map((s) => s.pos) } });
      }

      combo++;
      scoreGain += calculateScore(step, combo);
      update({ combo, score: stateRef.current.score + calculateScore(step, combo) });
    }

    // Final state
    update({ board: finalBoard, currentAnim: null });
  };

  const handleClick = useCallback(
    async (pos: Position) => {
      const s = stateRef.current;
      if (s.state === "animating" || s.state === "gameover") return;

      if (s.destroyMode) {
        // Use destroy power-up
        const pu = s.powerUps.find((p) => p.type === PowerUpType.DestroyGem && p.uses > 0);
        if (!pu) {
          update({ destroyMode: false });
          return;
        }
        const newPowerUps = s.powerUps.map((p) =>
          p.type === PowerUpType.DestroyGem ? { ...p, uses: p.uses - 1 } : p
        );
        update({
          state: "animating",
          destroyMode: false,
          powerUps: newPowerUps,
        });

        await playAnim({ type: "remove", duration: REMOVE_MS, data: { positions: [pos] } });
        const b: BoardState = stateRef.current.board.map((r) => r.slice());
        b[pos.row][pos.col] = null;
        update({ board: b, combo: 0 });
        await runCascade(b);

        const newState = isGameOver(stateRef.current) ? "gameover" : "idle";
        update({ state: newState });
        if (newState === "gameover" && !gameEndedRef.current) {
          gameEndedRef.current = true;
          const won = mode === "level" && stateRef.current.score >= targetScore;
          onGameEnd?.(won, stateRef.current.score);
        }
        return;
      }

      if (s.state === "idle") {
        update({ selected: pos, state: "selected" });
      } else if (s.state === "selected") {
        if (s.selected && pos.row === s.selected.row && pos.col === s.selected.col) {
          update({ selected: null, state: "idle" });
        } else if (s.selected && isAdjacent(s.selected, pos)) {
          await executeSwap(s.selected, pos);
        } else {
          update({ selected: pos });
        }
      }
    },
    [config, mode, targetScore, isGameOver, onGameEnd]
  );

  const requestSwap = useCallback(
    async (a: Position, b: Position) => {
      const s = stateRef.current;
      if (s.state === "animating" || s.state === "gameover" || s.destroyMode) return;
      if (!isAdjacent(a, b)) return;
      await executeSwap(a, b);
    },
    []
  );

  const executeSwap = async (a: Position, b: Position) => {
    update({ state: "animating", selected: null });

    await playAnim({ type: "swap", duration: SWAP_MS, data: { from: a, to: b } });

    const swapped = swap(stateRef.current.board, a, b);
    const matches = findMatches(swapped);

    if (matches.length === 0) {
      // Swap back
      await playAnim({ type: "swap-back", duration: SWAP_MS, data: { from: b, to: a } });
      update({ state: "idle", currentAnim: null });
      return;
    }

    let cur = stateRef.current;
    update({
      board: swapped,
      movesLeft: cur.movesLeft > 0 ? cur.movesLeft - 1 : cur.movesLeft,
      combo: 0,
    });

    await runCascade(swapped);

    const newState = isGameOver(stateRef.current) ? "gameover" : "idle";
    update({ state: newState });
    if (newState === "gameover" && !gameEndedRef.current) {
      gameEndedRef.current = true;
      const won = mode === "level" && stateRef.current.score >= targetScore;
      onGameEnd?.(won, stateRef.current.score);
    }
  };

  const usePowerUp = useCallback(
    async (type: PowerUpType) => {
      const s = stateRef.current;
      if (s.state === "animating" || s.state === "gameover") return;
      const pu = s.powerUps.find((p) => p.type === type && p.uses > 0);
      if (!pu) return;

      if (type === PowerUpType.DestroyGem) {
        update({ destroyMode: true, selected: null, state: "idle" });
        return;
      }

      const newPowerUps = s.powerUps.map((p) => (p.type === type ? { ...p, uses: p.uses - 1 } : p));
      update({ powerUps: newPowerUps });

      if (type === PowerUpType.Shuffle) {
        const shuffled = applyShuffle(s.board);
        update({ board: shuffled, combo: 0, state: "animating" });
        await sleep(150);
        await runCascade(shuffled);
        const newState = isGameOver(stateRef.current) ? "gameover" : "idle";
        update({ state: newState });
      } else if (type === PowerUpType.ExtraMoves && s.movesLeft > 0) {
        update({ movesLeft: s.movesLeft + 5 });
      }
    },
    [isGameOver]
  );

  const reset = useCallback(() => {
    gameEndedRef.current = false;
    setSnapshot({
      board: createBoard(config),
      score: 0,
      combo: 0,
      movesLeft: maxMoves,
      targetScore,
      state: "idle",
      powerUps: [
        createPowerUp(PowerUpType.Shuffle),
        createPowerUp(PowerUpType.DestroyGem),
        ...(mode === "level" ? [createPowerUp(PowerUpType.ExtraMoves)] : []),
      ],
      destroyMode: false,
      selected: null,
      currentAnim: null,
      animStartTime: 0,
    });
  }, [config, maxMoves, targetScore, mode]);

  return {
    snapshot,
    handleClick,
    requestSwap,
    usePowerUp,
    reset,
  };
}
