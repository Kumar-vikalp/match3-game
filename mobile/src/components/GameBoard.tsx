import React, { useMemo, useState, useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
import {
  Canvas,
  Image as SkiaImage,
  RoundedRect,
  Group,
  useImage,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { GemColor, GemType, Position } from "../engine";
import type { GameSnapshot } from "../game/useGameEngine";
import GameLoading from "./GameLoading";

interface Props {
  snapshot: GameSnapshot;
  onClick: (pos: Position) => void;
  onSwap: (a: Position, b: Position) => void;
}

const COLOR_TO_NAME: Record<GemColor, string> = {
  [GemColor.Red]: "red",
  [GemColor.Blue]: "blue",
  [GemColor.Green]: "green",
  [GemColor.Yellow]: "yellow",
  [GemColor.Purple]: "purple",
  [GemColor.Orange]: "orange",
};

const PADDING = 12;
const CELL_GAP = 4;
const DRAG_THRESHOLD = 12;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function GameBoard({ snapshot, onClick, onSwap }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const { board } = snapshot;
  const rows = board.length;
  const cols = board[0]?.length ?? 8;

  // Calculate sizes responsive to screen width
  const boardWidth = Math.min(screenWidth - 24, 380);
  const cellSize = (boardWidth - PADDING * 2) / cols;

  // Load images
  const redImg = useImage(require("../../assets/gems/red.png"));
  const blueImg = useImage(require("../../assets/gems/blue.png"));
  const greenImg = useImage(require("../../assets/gems/green.png"));
  const yellowImg = useImage(require("../../assets/gems/yellow.png"));
  const purpleImg = useImage(require("../../assets/gems/purple.png"));
  const orangeImg = useImage(require("../../assets/gems/orange.png"));
  const thunderImg = useImage(require("../../assets/gems/thunder.png"));
  const bombImg = useImage(require("../../assets/gems/bomb.png"));

  const colorImages = useMemo(
    () => ({
      red: redImg,
      blue: blueImg,
      green: greenImg,
      yellow: yellowImg,
      purple: purpleImg,
      orange: orangeImg,
    }),
    [redImg, blueImg, greenImg, yellowImg, purpleImg, orangeImg]
  );

  const allImagesLoaded =
    !!redImg && !!blueImg && !!greenImg && !!yellowImg && !!purpleImg && !!orangeImg && !!thunderImg && !!bombImg;

  const boardHeight = rows * cellSize + PADDING * 2;
  const totalWidth = cols * cellSize + PADDING * 2;

  // Force re-render during animations so we can interpolate over time
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!snapshot.currentAnim) return;
    let raf: number;
    const loop = () => {
      setTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [snapshot.currentAnim, snapshot.animStartTime]);

  // Compute animation progress (recalculated each render so it interpolates over time)
  const animState = (() => {
    const anim = snapshot.currentAnim;
    if (!anim) return null;
    const elapsed = Date.now() - snapshot.animStartTime;
    const t = Math.min(elapsed / anim.duration, 1);
    return { anim, t };
  })();

  // Helpers
  const cellCenter = (row: number, col: number) => ({
    x: PADDING + col * cellSize + cellSize / 2,
    y: PADDING + row * cellSize + cellSize / 2,
  });

  const positionToCell = (x: number, y: number): Position | null => {
    const col = Math.floor((x - PADDING) / cellSize);
    const row = Math.floor((y - PADDING) / cellSize);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    return { row, col };
  };

  // --- Gesture: drag-to-swap or tap ---
  const dragStartRef = React.useRef<{ x: number; y: number; pos: Position } | null>(null);
  const dragHandledRef = React.useRef(false);

  const onDragStartJs = (x: number, y: number) => {
    const pos = positionToCell(x, y);
    if (pos) {
      dragStartRef.current = { x, y, pos };
      dragHandledRef.current = false;
    }
  };

  const onDragMoveJs = (x: number, y: number) => {
    const start = dragStartRef.current;
    if (!start || dragHandledRef.current) return;
    const dx = x - start.x;
    const dy = y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DRAG_THRESHOLD) return;

    let target: Position;
    if (Math.abs(dx) > Math.abs(dy)) {
      target = { row: start.pos.row, col: start.pos.col + (dx > 0 ? 1 : -1) };
    } else {
      target = { row: start.pos.row + (dy > 0 ? 1 : -1), col: start.pos.col };
    }
    if (target.row >= 0 && target.row < rows && target.col >= 0 && target.col < cols) {
      dragHandledRef.current = true;
      onSwap(start.pos, target);
    }
  };

  const onDragEndJs = () => {
    const start = dragStartRef.current;
    if (start && !dragHandledRef.current) {
      onClick(start.pos);
    }
    dragStartRef.current = null;
    dragHandledRef.current = false;
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(onDragStartJs)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(onDragMoveJs)(e.x, e.y);
    })
    .onEnd(() => {
      runOnJS(onDragEndJs)();
    });

  // --- Render ---
  // Compute display info for each cell
  const cellsToRender: Array<{
    row: number;
    col: number;
    cell: NonNullable<typeof board[0][0]>;
    x: number;
    y: number;
    scale: number;
    opacity: number;
  }> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r]?.[c];
      if (!cell) continue;

      let { x, y } = cellCenter(r, c);
      let scale = 1;
      let opacity = 1;

      if (animState) {
        const { anim, t } = animState;
        const eased = easeInOut(t);

        if (anim.type === "swap" || anim.type === "swap-back") {
          const { from, to } = anim.data as { from: Position; to: Position };
          if (r === from.row && c === from.col) {
            const fromPx = cellCenter(from.row, from.col);
            const toPx = cellCenter(to.row, to.col);
            x = lerp(fromPx.x, toPx.x, eased);
            y = lerp(fromPx.y, toPx.y, eased);
          } else if (r === to.row && c === to.col) {
            const fromPx = cellCenter(from.row, from.col);
            const toPx = cellCenter(to.row, to.col);
            x = lerp(toPx.x, fromPx.x, eased);
            y = lerp(toPx.y, fromPx.y, eased);
          }
        } else if (anim.type === "remove") {
          const positions = (anim.data as { positions: Position[] }).positions;
          if (positions.some((p) => p.row === r && p.col === c)) {
            scale = 1 - t;
            opacity = 1 - t;
          }
        } else if (anim.type === "fall") {
          const movements = (anim.data as { movements: { from: Position; to: Position }[] }).movements;
          const m = movements.find((mv) => mv.from.row === r && mv.from.col === c);
          if (m) {
            const fromPx = cellCenter(m.from.row, m.from.col);
            const toPx = cellCenter(m.to.row, m.to.col);
            x = lerp(fromPx.x, toPx.x, eased);
            y = lerp(fromPx.y, toPx.y, eased);
          }
        } else if (anim.type === "spawn") {
          const positions = (anim.data as { positions: Position[] }).positions;
          if (positions.some((p) => p.row === r && p.col === c)) {
            scale = t;
            opacity = t;
          }
        }
      }

      cellsToRender.push({ row: r, col: c, cell, x, y, scale, opacity });
    }
  }

  const gemSize = cellSize - CELL_GAP * 2;

  const getImage = (cell: { color: GemColor; type: GemType }) => {
    if (cell.type === GemType.Bomb) return bombImg;
    return colorImages[COLOR_TO_NAME[cell.color] as keyof typeof colorImages];
  };

  if (!allImagesLoaded) {
    return <GameLoading width={totalWidth} height={boardHeight} />;
  }

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width: totalWidth, height: boardHeight, alignSelf: "center" }}>
        <Canvas style={{ width: totalWidth, height: boardHeight }}>
          {/* Outer board background */}
          <RoundedRect x={0} y={0} width={totalWidth} height={boardHeight} r={20} color="#1a0b2e" />

          {/* Cell backgrounds */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => (
              <RoundedRect
                key={`bg-${r}-${c}`}
                x={PADDING + c * cellSize + 2}
                y={PADDING + r * cellSize + 2}
                width={cellSize - 4}
                height={cellSize - 4}
                r={8}
                color="rgba(0,0,0,0.25)"
              />
            ))
          )}

          {/* Selection highlight */}
          {snapshot.selected && (
            <RoundedRect
              x={PADDING + snapshot.selected.col * cellSize}
              y={PADDING + snapshot.selected.row * cellSize}
              width={cellSize}
              height={cellSize}
              r={10}
              color="rgba(251,191,36,0.25)"
              style="stroke"
              strokeWidth={3}
            />
          )}

          {/* Gems */}
          {cellsToRender.map(({ row, col, cell, x, y, scale, opacity }) => {
            const img = getImage(cell);
            if (!img) return null;
            const size = gemSize * scale;
            return (
              <Group
                key={`gem-${cell.id}`}
                opacity={opacity}
                transform={[{ translateX: x - size / 2 }, { translateY: y - size / 2 }]}
              >
                <SkiaImage image={img} x={0} y={0} width={size} height={size} fit="contain" />
                {(cell.type === GemType.LineClearH || cell.type === GemType.LineClearV) && thunderImg && (
                  <Group
                    transform={
                      cell.type === GemType.LineClearV
                        ? [
                            { translateX: size / 2 },
                            { translateY: size / 2 },
                            { rotate: Math.PI / 2 },
                            { translateX: -size / 2 },
                            { translateY: -size / 2 },
                          ]
                        : []
                    }
                  >
                    <SkiaImage
                      image={thunderImg}
                      x={size * 0.2}
                      y={size * 0.2}
                      width={size * 0.6}
                      height={size * 0.6}
                      fit="contain"
                    />
                  </Group>
                )}
              </Group>
            );
          })}
        </Canvas>
      </View>
    </GestureDetector>
  );
}
