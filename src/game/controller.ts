import {
  BoardState, CascadeStep, GameConfig, Position,
  createBoard, swap, isAdjacent, findMatches, resolveCascade, calculateScore,
  hasValidMoves, PowerUpType, PowerUp, applyShuffle,
  applyGravity, refillBoard,
} from '@/engine';
import { CanvasRenderer } from '@/renderer/renderer';

export enum GameState { Idle, Selected, Animating, GameOver }

export class GameController {
  board: BoardState;
  state = GameState.Idle;
  selected: Position | null = null;
  score = 0;
  combo = 0;
  movesLeft: number;
  targetScore: number;
  powerUps: PowerUp[];
  destroyMode = false;
  private config: GameConfig;
  private renderer: CanvasRenderer;
  private onUpdate: () => void;

  constructor(config: GameConfig, renderer: CanvasRenderer, onUpdate: () => void) {
    this.config = config;
    this.renderer = renderer;
    this.onUpdate = onUpdate;
    this.board = createBoard(config);
    this.movesLeft = -1;
    this.targetScore = 0;
    this.powerUps = [];
    this.render();
  }

  handleClick(pos: Position): void {
    if (this.state === GameState.Animating || this.state === GameState.GameOver) return;

    if (this.destroyMode) {
      this.executeDestroy(pos);
      return;
    }

    if (this.state === GameState.Idle) {
      this.selected = pos;
      this.state = GameState.Selected;
      this.render();
    } else if (this.state === GameState.Selected) {
      if (pos.row === this.selected!.row && pos.col === this.selected!.col) {
        this.selected = null;
        this.state = GameState.Idle;
        this.render();
      } else if (isAdjacent(this.selected!, pos)) {
        this.executeSwap(this.selected!, pos);
      } else {
        this.selected = pos;
        this.render();
      }
    }
  }

  // Used by drag-to-swap: directly attempt a swap between two adjacent cells
  requestSwap(a: Position, b: Position): void {
    if (this.state === GameState.Animating || this.state === GameState.GameOver) return;
    if (this.destroyMode) return;
    if (!isAdjacent(a, b)) return;
    this.executeSwap(a, b);
  }

  async executeSwap(a: Position, b: Position): Promise<void> {
    this.state = GameState.Animating;
    this.selected = null;
    this.onUpdate();

    await this.renderer.animateSwap(this.board, a, b);
    const swapped = swap(this.board, a, b);
    const matches = findMatches(swapped);

    if (matches.length === 0) {
      // Swap back
      await this.renderer.animateSwap(swapped, b, a);
      this.state = GameState.Idle;
      this.render();
      this.onUpdate();
      return;
    }

    this.board = swapped;
    if (this.movesLeft > 0) this.movesLeft--;
    this.combo = 0;

    const { board, steps } = resolveCascade(this.board, this.config);
    for (const step of steps) {
      await this.animateCascadeStep(step);
      this.combo++;
      this.score += calculateScore(step, this.combo);
      this.onUpdate();
    }

    this.board = board;
    this.state = this.isGameOver() ? GameState.GameOver : GameState.Idle;
    this.render();
    this.onUpdate();
  }

  private async executeDestroy(pos: Position): Promise<void> {
    const pu = this.powerUps.find(p => p.type === PowerUpType.DestroyGem && p.uses > 0);
    if (!pu) {
      this.destroyMode = false;
      this.onUpdate();
      return;
    }
    // Guard: don't waste a use on an empty cell
    if (!this.board[pos.row]?.[pos.col]) {
      this.destroyMode = false;
      this.onUpdate();
      return;
    }
    pu.uses--;
    this.destroyMode = false;
    this.state = GameState.Animating;
    this.onUpdate();

    // Animate the single removal
    await this.renderer.animateRemove(this.board, [pos]);
    this.board[pos.row][pos.col] = null;

    // CRITICAL: After nulling a single cell, there are no matches yet, so
    // resolveCascade would exit immediately and leave a permanent hole.
    // We must explicitly apply gravity + refill first to fill the gap.
    await this.applyGravityAndRefill();

    // Now resolve any chain matches that may have appeared from the new gems.
    const { board, steps } = resolveCascade(this.board, this.config);
    this.combo = 0;
    for (const step of steps) {
      await this.animateCascadeStep(step);
      this.combo++;
      this.score += calculateScore(step, this.combo);
      this.onUpdate();
    }
    this.board = board;
    this.state = this.isGameOver() ? GameState.GameOver : GameState.Idle;
    this.render();
    this.onUpdate();
  }

  /**
   * Applies gravity + refill once and animates the result.
   * Used by powerups that create holes without producing matches.
   */
  private async applyGravityAndRefill(): Promise<void> {
    const { board: afterGravity, fell } = applyGravity(this.board);
    const { spawned } = refillBoard(afterGravity, this.config);

    if (fell.length) {
      await this.renderer.animateFall(this.board, fell);
      const sortedFell = [...fell].sort((a, b) => b.to.row - a.to.row);
      for (const m of sortedFell) {
        this.board[m.to.row][m.to.col] = this.board[m.from.row][m.from.col];
        this.board[m.from.row][m.from.col] = null;
      }
    }

    if (spawned.length) {
      for (const s of spawned) {
        this.board[s.pos.row][s.pos.col] = s.cell;
      }
      await this.renderer.animateSpawn(this.board, spawned.map(s => s.pos));
    }
    this.render();
  }

  private async animateCascadeStep(step: CascadeStep): Promise<void> {
    // 1. Animate fade-out of removed cells
    await this.renderer.animateRemove(this.board, step.removed);

    // 2. Apply removals to board, but preserve cells where specials were just created
    const createdSet = new Set(step.specialsCreated.map(s => `${s.pos.row},${s.pos.col}`));
    for (const pos of step.removed) {
      const key = `${pos.row},${pos.col}`;
      if (!createdSet.has(key)) this.board[pos.row][pos.col] = null;
    }

    // 3. Apply specials (set the type on the existing cell)
    for (const s of step.specialsCreated) {
      const cell = this.board[s.pos.row]?.[s.pos.col];
      if (cell) cell.type = s.type;
    }
    this.render();

    // 4. Animate fall (board still has cells at their `from` positions)
    if (step.fell.length) {
      await this.renderer.animateFall(this.board, step.fell);

      // Apply gravity to controller's board
      // Iterate in correct order: from top of `from` to bottom (so we don't overwrite)
      // Actually since each `from` and `to` is unique within a column and `to.row > from.row`,
      // we should process from bottom up to avoid clobbering.
      const sortedFell = [...step.fell].sort((a, b) => b.to.row - a.to.row);
      for (const m of sortedFell) {
        this.board[m.to.row][m.to.col] = this.board[m.from.row][m.from.col];
        this.board[m.from.row][m.from.col] = null;
      }
    }

    // 5. Apply spawns and animate
    if (step.spawned.length) {
      for (const s of step.spawned) {
        this.board[s.pos.row][s.pos.col] = s.cell;
      }
      await this.renderer.animateSpawn(this.board, step.spawned.map(s => s.pos));
    }
    this.render();
  }

  isGameOver(): boolean {
    if (this.targetScore > 0 && this.score >= this.targetScore) return true;
    if (this.movesLeft === 0) return true;
    if (this.movesLeft === -1 && !hasValidMoves(this.board)) return true;
    return false;
  }

  usePowerUp(type: PowerUpType): void {
    if (this.state === GameState.Animating || this.state === GameState.GameOver) return;

    // Allow toggling off destroy mode by clicking the button again.
    if (type === PowerUpType.DestroyGem && this.destroyMode) {
      this.destroyMode = false;
      this.onUpdate();
      return;
    }

    const pu = this.powerUps.find(p => p.type === type && p.uses > 0);
    if (!pu) return;

    if (type === PowerUpType.DestroyGem) {
      // Enter destroy mode — wait for next click
      this.destroyMode = true;
      this.selected = null;
      this.state = GameState.Idle;
      this.onUpdate();
      return;
    }

    pu.uses--;

    if (type === PowerUpType.Shuffle) {
      this.board = applyShuffle(this.board);
      // Re-resolve in case shuffle creates matches
      const { board, steps } = resolveCascade(this.board, this.config);
      this.board = board;
      this.combo = 0;
      for (const step of steps) {
        this.combo++;
        this.score += calculateScore(step, this.combo);
      }
    } else if (type === PowerUpType.ExtraMoves && this.movesLeft > 0) {
      this.movesLeft += 5;
    }

    this.state = this.isGameOver() ? GameState.GameOver : GameState.Idle;
    this.render();
    this.onUpdate();
  }

  reset(config?: GameConfig): void {
    if (config) this.config = config;
    this.board = createBoard(this.config);
    this.score = 0;
    this.combo = 0;
    this.state = GameState.Idle;
    this.selected = null;
    this.destroyMode = false;
    this.render();
    this.onUpdate();
  }

  getState() {
    return {
      board: this.board,
      score: this.score,
      combo: this.combo,
      movesLeft: this.movesLeft,
      targetScore: this.targetScore,
      state: this.state,
      powerUps: this.powerUps,
      destroyMode: this.destroyMode,
    };
  }

  private render(): void {
    this.renderer.drawBoard(this.board, this.selected);
  }
}
