"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { GameConfig, Position } from "@/engine/types";
import { PowerUpType, createPowerUp } from "@/engine/powerups";
import { CanvasRenderer, preloadGemImages } from "@/renderer/renderer";
import { GameController, GameState } from "@/game/controller";
import { CELL_SIZE, BOARD_PADDING } from "@/renderer/constants";
import HUD from "./HUD";

interface Props {
  config: GameConfig;
  targetScore?: number;
  maxMoves?: number;
  mode: "level" | "endless";
  onGameEnd?: (won: boolean, score: number) => void;
  onScoreChange?: (score: number) => void;
}

const DRAG_THRESHOLD = 12; // pixels

export default function GameBoard({ config, targetScore = 0, maxMoves = -1, mode, onGameEnd, onScoreChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [gameState, setGameState] = useState<ReturnType<GameController["getState"]> | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  const gameEndedRef = useRef(false);

  // Stable refs so the effect doesn't re-create the controller on every parent render.
  const onScoreChangeRef = useRef(onScoreChange);
  const onGameEndRef = useRef(onGameEnd);
  useEffect(() => {
    onScoreChangeRef.current = onScoreChange;
    onGameEndRef.current = onGameEnd;
  }, [onScoreChange, onGameEnd]);

  // Drag tracking
  const dragStartRef = useRef<{ x: number; y: number; pos: Position } | null>(null);
  const dragHandledRef = useRef(false);

  useEffect(() => {
    preloadGemImages().then(() => setImagesReady(true));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesReady) return;

    gameEndedRef.current = false;

    const renderer = new CanvasRenderer(canvas, config.rows, config.cols);
    rendererRef.current = renderer;

    const controller = new GameController(config, renderer, () => {
      const s = controller.getState();
      setGameState({ ...s });
      onScoreChangeRef.current?.(s.score);
      if (s.state === GameState.GameOver && !gameEndedRef.current) {
        gameEndedRef.current = true;
        const won = mode === "level" && s.score >= targetScore;
        onGameEndRef.current?.(won, s.score);
      }
    });
    controller.movesLeft = maxMoves;
    controller.targetScore = targetScore;
    controller.powerUps = [
      createPowerUp(PowerUpType.Shuffle),
      createPowerUp(PowerUpType.DestroyGem),
      ...(mode === "level" ? [createPowerUp(PowerUpType.ExtraMoves)] : []),
    ];
    controllerRef.current = controller;
    setGameState(controller.getState());

    return () => { controllerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.rows, config.cols, config.numColors, maxMoves, targetScore, mode, imagesReady]);

  const eventToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = eventToCanvas(e.clientX, e.clientY);
    const renderer = rendererRef.current;
    if (!pt || !renderer) return;
    const pos = renderer.pixelToPos(pt.x, pt.y);
    if (pos) {
      dragStartRef.current = { x: pt.x, y: pt.y, pos };
      dragHandledRef.current = false;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStartRef.current || dragHandledRef.current) return;

    // In destroy mode, drag-to-swap is disabled — any tap (with or without
    // micro-movement) should fall through to handleClick on pointer up.
    // Without this, even a 12px finger drift would set dragHandledRef = true
    // and silently swallow the tap, making the powerup feel like it requires
    // a held press.
    if (controllerRef.current?.destroyMode) return;

    const pt = eventToCanvas(e.clientX, e.clientY);
    if (!pt) return;

    const dx = pt.x - dragStartRef.current.x;
    const dy = pt.y - dragStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < DRAG_THRESHOLD) return;

    // Determine drag direction
    let target: Position;
    if (Math.abs(dx) > Math.abs(dy)) {
      target = {
        row: dragStartRef.current.pos.row,
        col: dragStartRef.current.pos.col + (dx > 0 ? 1 : -1),
      };
    } else {
      target = {
        row: dragStartRef.current.pos.row + (dy > 0 ? 1 : -1),
        col: dragStartRef.current.pos.col,
      };
    }

    // Bounds check
    if (
      target.row >= 0 &&
      target.row < config.rows &&
      target.col >= 0 &&
      target.col < config.cols
    ) {
      dragHandledRef.current = true;
      controllerRef.current?.requestSwap(dragStartRef.current.pos, target);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    // If this was a tap (no drag movement registered), treat as click
    if (dragStartRef.current && !dragHandledRef.current) {
      controllerRef.current?.handleClick(dragStartRef.current.pos);
    }
    dragStartRef.current = null;
    dragHandledRef.current = false;
  };

  const handlePointerCancel = () => {
    dragStartRef.current = null;
    dragHandledRef.current = false;
  };

  const canvasWidth = config.cols * CELL_SIZE + BOARD_PADDING * 2;
  const canvasHeight = config.rows * CELL_SIZE + BOARD_PADDING * 2;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {gameState && (
        <HUD
          score={gameState.score}
          movesLeft={gameState.movesLeft}
          targetScore={gameState.targetScore}
          combo={gameState.combo}
          mode={mode}
          powerUps={gameState.powerUps}
          destroyMode={gameState.destroyMode}
          onUsePowerUp={(type) => controllerRef.current?.usePowerUp(type)}
        />
      )}

      <div className="relative">
        {!imagesReady && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <Loader2 size={32} className="animate-spin text-violet-400" />
            <span className="text-xs text-violet-400/70 uppercase tracking-widest font-semibold">
              Loading gems
            </span>
          </div>
        )}
        <motion.canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: imagesReady ? 1 : 0,
            scale: imagesReady ? 1 : 0.95,
            boxShadow: gameState?.destroyMode
              ? "0 0 0 2px rgba(236, 72, 153, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)"
              : undefined,
          }}
          transition={{ duration: 0.4 }}
          className="cursor-pointer max-w-full touch-none select-none"
          style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}
        />
      </div>
    </div>
  );
}
