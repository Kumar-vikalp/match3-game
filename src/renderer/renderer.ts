import { BoardState, Cell, GemColor, GemType, Position } from '@/engine/types';
import { CELL_SIZE, PADDING, BOARD_PADDING, GEM_COLORS, ANIMATION_DURATION } from './constants';

interface Particle { x: number; y: number; vx: number; vy: number; color: string; life: number }

const posKey = (p: Position) => `${p.row},${p.col}`;

const COLOR_IMAGE: Record<GemColor, string> = {
  [GemColor.Red]: 'red',
  [GemColor.Blue]: 'blue',
  [GemColor.Green]: 'green',
  [GemColor.Yellow]: 'yellow',
  [GemColor.Purple]: 'purple',
  [GemColor.Orange]: 'orange',
};

const IMAGE_SOURCES: Record<string, string> = {
  red: '/gems/red.png',
  blue: '/gems/blue.png',
  green: '/gems/green.png',
  yellow: '/gems/yellow.png',
  purple: '/gems/purple.png',
  orange: '/gems/orange.png',
  thunder: '/gems/thunder.png',
  bomb: '/gems/bomb.png',
};

const imageCache: Record<string, HTMLImageElement> = {};
let preloadPromise: Promise<void> | null = null;

export function preloadGemImages(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadPromise = Promise.all(
    Object.entries(IMAGE_SOURCES).map(
      ([key, src]) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            imageCache[key] = img;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  ).then(() => undefined);
  return preloadPromise;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private rows: number;
  private cols: number;
  private particles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement, rows: number, cols: number) {
    this.ctx = canvas.getContext('2d')!;
    this.rows = rows;
    this.cols = cols;
    canvas.width = cols * CELL_SIZE + BOARD_PADDING * 2;
    canvas.height = rows * CELL_SIZE + BOARD_PADDING * 2;
  }

  posToPixel(pos: Position): { x: number; y: number } {
    return {
      x: BOARD_PADDING + pos.col * CELL_SIZE + CELL_SIZE / 2,
      y: BOARD_PADDING + pos.row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  pixelToPos(x: number, y: number): Position | null {
    const col = Math.floor((x - BOARD_PADDING) / CELL_SIZE);
    const row = Math.floor((y - BOARD_PADDING) / CELL_SIZE);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return { row, col };
  }

  drawBoard(board: BoardState, selected: Position | null, skipCells?: Set<string>): void {
    const { ctx } = this;
    const w = this.cols * CELL_SIZE + BOARD_PADDING * 2;
    const h = this.rows * CELL_SIZE + BOARD_PADDING * 2;
    ctx.clearRect(0, 0, w, h);

    // Outer board background with rounded corners and gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1a0b2e');
    bgGrad.addColorStop(1, '#0f0420');
    ctx.fillStyle = bgGrad;
    this.roundRect(0, 0, w, h, 16);
    ctx.fill();

    // Inner cells - subtle rounded squares with inset shadow feel
    const cellPad = 3;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = BOARD_PADDING + c * CELL_SIZE + cellPad;
        const y = BOARD_PADDING + r * CELL_SIZE + cellPad;
        const size = CELL_SIZE - cellPad * 2;

        // Cell background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.roundRect(x, y, size, size, 8);
        ctx.fill();

        // Subtle inner highlight (top-left)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        this.roundRect(x + 0.5, y + 0.5, size - 1, size - 1, 8);
        ctx.stroke();
      }
    }

    // Gems (skip those being animated)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (skipCells?.has(`${r},${c}`)) continue;
        const cell = board[r]?.[c];
        if (cell) this.drawGem(cell, this.posToPixel({ row: r, col: c }));
      }
    }

    // Selection highlight
    if (selected) {
      const x = BOARD_PADDING + selected.col * CELL_SIZE + cellPad;
      const y = BOARD_PADDING + selected.row * CELL_SIZE + cellPad;
      const size = CELL_SIZE - cellPad * 2;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.lineWidth = 3;
      this.roundRect(x, y, size, size, 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.lineWidth = 6;
      this.roundRect(x - 1, y - 1, size + 2, size + 2, 9);
      ctx.stroke();
    }

    this.drawParticles();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  private drawGem(cell: Cell, pos: { x: number; y: number }, scale = 1, alpha = 1): void {
    const { ctx } = this;
    const size = (CELL_SIZE - PADDING * 2) * scale;
    if (size <= 0) return;

    ctx.globalAlpha = alpha;

    // Bomb special: render bomb image only
    if (cell.type === GemType.Bomb) {
      const img = imageCache.bomb;
      if (img) {
        ctx.drawImage(img, pos.x - size / 2, pos.y - size / 2, size, size);
      } else {
        this.drawFallbackGem(cell, pos, scale);
      }
      ctx.globalAlpha = 1;
      return;
    }

    // Color gem
    const colorKey = COLOR_IMAGE[cell.color];
    const img = imageCache[colorKey];
    if (img) {
      ctx.drawImage(img, pos.x - size / 2, pos.y - size / 2, size, size);
    } else {
      this.drawFallbackGem(cell, pos, scale);
    }

    // Thunder overlay for line clears
    if (cell.type === GemType.LineClearH || cell.type === GemType.LineClearV) {
      const thunder = imageCache.thunder;
      if (thunder) {
        const tSize = size * 0.6;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        if (cell.type === GemType.LineClearV) ctx.rotate(Math.PI / 2);
        ctx.drawImage(thunder, -tSize / 2, -tSize / 2, tSize, tSize);
        ctx.restore();
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (cell.type === GemType.LineClearH) {
          ctx.moveTo(pos.x - size * 0.35, pos.y);
          ctx.lineTo(pos.x + size * 0.35, pos.y);
        } else {
          ctx.moveTo(pos.x, pos.y - size * 0.35);
          ctx.lineTo(pos.x, pos.y + size * 0.35);
        }
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  }

  private drawFallbackGem(cell: Cell, pos: { x: number; y: number }, scale: number): void {
    const { ctx } = this;
    const radius = (CELL_SIZE / 2 - PADDING) * scale;
    ctx.fillStyle = GEM_COLORS[cell.color];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      const size = 1.5 + p.life * 2;
      // Outer glow
      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      // Bright center
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private spawnParticles(positions: Position[], board: BoardState): void {
    for (const pos of positions) {
      const cell = board[pos.row]?.[pos.col];
      const color = cell ? GEM_COLORS[cell.color] : '#ffffff';
      const { x, y } = this.posToPixel(pos);
      const count = 8;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 1.8 + Math.random() * 1.5;
        this.particles.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          color,
          life: 1,
        });
      }
    }
  }

  private updateParticles(): void {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.vy += 0.15;
      p.life -= 0.06;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  animateSwap(board: BoardState, from: Position, to: Position): Promise<void> {
    const skip = new Set([posKey(from), posKey(to)]);
    const cellA = board[from.row][from.col];
    const cellB = board[to.row][to.col];
    return this.animate(ANIMATION_DURATION.swap, (t) => {
      this.drawBoard(board, null, skip);
      const fromPx = this.posToPixel(from);
      const toPx = this.posToPixel(to);
      const ax = fromPx.x + (toPx.x - fromPx.x) * t;
      const ay = fromPx.y + (toPx.y - fromPx.y) * t;
      const bx = toPx.x + (fromPx.x - toPx.x) * t;
      const by = toPx.y + (fromPx.y - toPx.y) * t;
      if (cellA) this.drawGem(cellA, { x: ax, y: ay });
      if (cellB) this.drawGem(cellB, { x: bx, y: by });
    });
  }

  animateFall(board: BoardState, movements: { from: Position; to: Position }[]): Promise<void> {
    const skip = new Set(movements.map(m => posKey(m.from)));
    return this.animate(ANIMATION_DURATION.fall, (t) => {
      this.drawBoard(board, null, skip);
      for (const m of movements) {
        const cell = board[m.from.row]?.[m.from.col];
        if (!cell) continue;
        const fromPx = this.posToPixel(m.from);
        const toPx = this.posToPixel(m.to);
        const x = fromPx.x + (toPx.x - fromPx.x) * t;
        const y = fromPx.y + (toPx.y - fromPx.y) * t;
        this.drawGem(cell, { x, y });
      }
    });
  }

  animateRemove(board: BoardState, positions: Position[]): Promise<void> {
    this.spawnParticles(positions, board);
    const skip = new Set(positions.map(posKey));
    return this.animate(ANIMATION_DURATION.remove, (t) => {
      this.updateParticles();
      this.drawBoard(board, null, skip);
      for (const pos of positions) {
        const cell = board[pos.row]?.[pos.col];
        if (cell) {
          const { x, y } = this.posToPixel(pos);
          this.drawGem(cell, { x, y }, 1 - t, 1 - t);
        }
      }
    });
  }

  animateSpawn(board: BoardState, positions: Position[]): Promise<void> {
    const skip = new Set(positions.map(posKey));
    return this.animate(ANIMATION_DURATION.spawn, (t) => {
      this.drawBoard(board, null, skip);
      for (const pos of positions) {
        const cell = board[pos.row]?.[pos.col];
        if (cell) {
          const { x, y } = this.posToPixel(pos);
          this.drawGem(cell, { x, y }, t);
        }
      }
    });
  }

  private animate(duration: number, draw: (t: number) => void): Promise<void> {
    return new Promise(resolve => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        draw(t);
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }
}
