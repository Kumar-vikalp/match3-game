"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { GameConfig } from "@/engine/types";
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
}

export default function GameBoard({ config, targetScore = 0, maxMoves = -1, mode, onGameEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [gameState, setGameState] = useState<ReturnType<GameController["getState"]> | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  const gameEndedRef = useRef(false);

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
      if (s.state === GameState.GameOver && !gameEndedRef.current) {
        gameEndedRef.current = true;
        const won = mode === "level" && s.score >= targetScore;
        onGameEnd?.(won, s.score);
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const controller = controllerRef.current;
    const renderer = rendererRef.current;
    if (!controller || !renderer) return;

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const pos = renderer.pixelToPos(x, y);
    if (pos) controller.handleClick(pos);
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
          onClick={handleCanvasClick}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: imagesReady ? 1 : 0,
            scale: imagesReady ? 1 : 0.95,
            boxShadow: gameState?.destroyMode
              ? "0 0 0 2px rgba(236, 72, 153, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)"
              : undefined,
          }}
          transition={{ duration: 0.4 }}
          className="cursor-pointer max-w-full touch-none"
          style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}
        />
      </div>
    </div>
  );
}
