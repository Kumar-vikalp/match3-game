import { BoardState, Cell, GemType, Position } from '@/engine/types';
import { CELL_SIZE, PADDING, BOARD_PADDING, GEM_COLORS, ANIMATION_DURATION } from './constants';

interface Particle { x: number; y: number; vx: number; vy: number; color: string; life: number }

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

  drawBoard(board: BoardState, selected: Position | null): void {
    const { ctx } = this;
    const w = this.cols * CELL_SIZE + BOARD_PADDING * 2;
    const h = this.rows * CELL_SIZE + BOARD_PADDING * 2;
    ctx.clearRect(0, 0, w, h);

    // Grid background
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = BOARD_PADDING + c * CELL_SIZE;
        const y = BOARD_PADDING + r * CELL_SIZE;
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#334155';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Gems
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = board[r]?.[c];
        if (cell) this.drawGem(cell, this.posToPixel({ row: r, col: c }));
      }
    }

    // Selection highlight
    if (selected) {
      const { x, y } = this.posToPixel(selected);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, CELL_SIZE / 2 - PADDING - 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Particles
    this.drawParticles();
  }

  private drawGem(cell: Cell, pos: { x: number; y: number }, scale = 1): void {
    const { ctx } = this;
    const radius = (CELL_SIZE / 2 - PADDING) * scale;
    const color = GEM_COLORS[cell.color];

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Special indicators
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    if (cell.type === GemType.LineClearH) {
      ctx.beginPath();
      ctx.moveTo(pos.x - radius * 0.7, pos.y);
      ctx.lineTo(pos.x + radius * 0.7, pos.y);
      ctx.stroke();
    } else if (cell.type === GemType.LineClearV) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - radius * 0.7);
      ctx.lineTo(pos.x, pos.y + radius * 0.7);
      ctx.stroke();
    } else if (cell.type === GemType.Bomb) {
      const s = radius * 0.5;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - s);
      ctx.lineTo(pos.x + s * 0.4, pos.y - s * 0.4);
      ctx.lineTo(pos.x + s, pos.y);
      ctx.lineTo(pos.x + s * 0.4, pos.y + s * 0.4);
      ctx.lineTo(pos.x, pos.y + s);
      ctx.lineTo(pos.x - s * 0.4, pos.y + s * 0.4);
      ctx.lineTo(pos.x - s, pos.y);
      ctx.lineTo(pos.x - s * 0.4, pos.y - s * 0.4);
      ctx.closePath();
      ctx.stroke();
    }
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    this.ctx.globalAlpha = 1;
  }

  private spawnParticles(positions: Position[], board: BoardState): void {
    for (const pos of positions) {
      const cell = board[pos.row]?.[pos.col];
      const color = cell ? GEM_COLORS[cell.color] : '#ffffff';
      const { x, y } = this.posToPixel(pos);
      const count = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        this.particles.push({ x, y, vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2, color, life: 1 });
      }
    }
  }

  private updateParticles(): void {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  animateSwap(board: BoardState, from: Position, to: Position): Promise<void> {
    return this.animate(ANIMATION_DURATION.swap, (t) => {
      this.drawBoard(board, null);
      // Overdraw swapping gems at interpolated positions
      const fromPx = this.posToPixel(from);
      const toPx = this.posToPixel(to);
      const cellA = board[from.row][from.col];
      const cellB = board[to.row][to.col];

      // Clear original positions
      const clearGem = (pos: { x: number; y: number }) => {
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(pos.x - CELL_SIZE / 2, pos.y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
      };
      clearGem(fromPx);
      clearGem(toPx);

      const ax = fromPx.x + (toPx.x - fromPx.x) * t;
      const ay = fromPx.y + (toPx.y - fromPx.y) * t;
      const bx = toPx.x + (fromPx.x - toPx.x) * t;
      const by = toPx.y + (fromPx.y - toPx.y) * t;

      if (cellA) this.drawGem(cellA, { x: ax, y: ay });
      if (cellB) this.drawGem(cellB, { x: bx, y: by });
    });
  }

  animateFall(board: BoardState, movements: { from: Position; to: Position }[]): Promise<void> {
    return this.animate(ANIMATION_DURATION.fall, (t) => {
      this.drawBoard(board, null);
      for (const m of movements) {
        const fromPx = this.posToPixel(m.from);
        const toPx = this.posToPixel(m.to);
        const cell = board[m.to.row]?.[m.to.col];
        if (!cell) continue;
        const x = fromPx.x + (toPx.x - fromPx.x) * t;
        const y = fromPx.y + (toPx.y - fromPx.y) * t;
        this.drawGem(cell, { x, y });
      }
    });
  }

  animateRemove(board: BoardState, positions: Position[]): Promise<void> {
    this.spawnParticles(positions, board);
    return this.animate(ANIMATION_DURATION.remove, (t) => {
      this.updateParticles();
      this.drawBoard(board, null);
      for (const pos of positions) {
        const { x, y } = this.posToPixel(pos);
        const cell = board[pos.row]?.[pos.col];
        if (cell) {
          this.ctx.globalAlpha = 1 - t;
          this.drawGem(cell, { x, y }, 1 - t);
          this.ctx.globalAlpha = 1;
        }
      }
    });
  }

  animateSpawn(board: BoardState, positions: Position[]): Promise<void> {
    return this.animate(ANIMATION_DURATION.spawn, (t) => {
      this.drawBoard(board, null);
      for (const pos of positions) {
        const { x, y } = this.posToPixel(pos);
        const cell = board[pos.row]?.[pos.col];
        if (cell) this.drawGem(cell, { x, y }, t);
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
