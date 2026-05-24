"use client";

import { useRef, useEffect, useState } from "react";
import { GameConfig } from "@/engine/types";
import { PowerUpType, createPowerUp } from "@/engine/powerups";
import { CanvasRenderer, preloadGemImages } from "@/renderer/renderer";
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
  const [imagesReady, setImagesReady] = useState(false);
  const gameEndedRef = useRef(false);

  useEffect(() => {
    preloadGemImages().then(() => setImagesReady(true));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesReady) return;

    gameEndedRef.current = false;
    setShowModal(false);

    const renderer = new CanvasRenderer(canvas, config.rows, config.cols);
    rendererRef.current = renderer;

    const controller = new GameController(config, renderer, () => {
      const s = controller.getState();
      setGameState({ ...s });
      if (s.state === GameState.GameOver && !gameEndedRef.current) {
        gameEndedRef.current = true;
        setShowModal(true);
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

  const handleRestart = () => {
    setShowModal(false);
    gameEndedRef.current = false;
    const controller = controllerRef.current;
    if (!controller) return;
    controller.reset();
    controller.movesLeft = maxMoves;
    controller.targetScore = targetScore;
    controller.powerUps = [
      createPowerUp(PowerUpType.Shuffle),
      createPowerUp(PowerUpType.DestroyGem),
      ...(mode === "level" ? [createPowerUp(PowerUpType.ExtraMoves)] : []),
    ];
    setGameState(controller.getState());
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
          destroyMode={gameState.destroyMode}
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
      {!imagesReady && (
        <div className="text-slate-400 text-sm">Loading gems...</div>
      )}
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
