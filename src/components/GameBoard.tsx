"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { GameConfig } from "@/engine/types";
import { PowerUpType, createPowerUp } from "@/engine/powerups";
import { CanvasRenderer } from "@/renderer/renderer";
import { GameController, GameState } from "@/game/controller";
import { CELL_SIZE, BOARD_PADDING } from "@/renderer/constants";
import HUD from "./HUD";
import GameOverModal from "./GameOverModal";

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
  const [showModal, setShowModal] = useState(false);

  const update = useCallback(() => {
    if (controllerRef.current) {
      const s = controllerRef.current.getState();
      setGameState({ ...s });
      if (s.state === GameState.GameOver && !showModal) {
        setShowModal(true);
        const won = mode === "level" && s.score >= targetScore;
        onGameEnd?.(won, s.score);
      }
    }
  }, [mode, targetScore, onGameEnd, showModal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas, config.rows, config.cols);
    rendererRef.current = renderer;
    const controller = new GameController(config, renderer, update);
    controller.movesLeft = maxMoves;
    controller.targetScore = targetScore;
    controller.powerUps = [
      createPowerUp(PowerUpType.Shuffle),
      createPowerUp(PowerUpType.DestroyGem),
      ...(mode === "level" ? [createPowerUp(PowerUpType.ExtraMoves)] : []),
    ];
    controllerRef.current = controller;
    update();

    return () => { controllerRef.current = null; };
  }, [config, maxMoves, targetScore, mode, update]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const controller = controllerRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !controller || !renderer) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const pos = renderer.pixelToPos(x, y);
    if (pos) controller.handleClick(pos);
  };

  const handleRestart = () => {
    setShowModal(false);
    controllerRef.current?.reset();
    if (controllerRef.current) {
      controllerRef.current.movesLeft = maxMoves;
      controllerRef.current.targetScore = targetScore;
      controllerRef.current.powerUps = [
        createPowerUp(PowerUpType.Shuffle),
        createPowerUp(PowerUpType.DestroyGem),
        ...(mode === "level" ? [createPowerUp(PowerUpType.ExtraMoves)] : []),
      ];
    }
    update();
  };

  const canvasWidth = config.cols * CELL_SIZE + BOARD_PADDING * 2;
  const canvasHeight = config.rows * CELL_SIZE + BOARD_PADDING * 2;

  return (
    <div className="flex flex-col items-center gap-4">
      {gameState && (
        <HUD
          score={gameState.score}
          movesLeft={gameState.movesLeft}
          targetScore={gameState.targetScore}
          combo={gameState.combo}
          mode={mode}
          powerUps={gameState.powerUps}
          onUsePowerUp={(type) => controllerRef.current?.usePowerUp(type)}
        />
      )}
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleCanvasClick}
        className="cursor-pointer max-w-full"
        style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}
      />
      {showModal && gameState && (
        <GameOverModal
          won={mode === "level" && gameState.score >= targetScore}
          score={gameState.score}
          onRestart={handleRestart}
          onBack={() => window.history.back()}
        />
      )}
    </div>
  );
}
