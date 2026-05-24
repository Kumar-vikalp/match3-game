import {
  BoardState, CascadeStep, GameConfig, Position,
  createBoard, swap, isAdjacent, findMatches, resolveCascade, calculateScore,
  hasValidMoves, PowerUpType, PowerUp, applyShuffle, applyDestroyGem,
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

  async executeSwap(a: Position, b: Position): Promise<void> {
    this.state = GameState.Animating;
    this.selected = null;

    await this.renderer.animateSwap(this.board, a, b);
    const swapped = swap(this.board, a, b);
    const matches = findMatches(swapped);

    if (matches.length === 0) {
      // Swap back
      await this.renderer.animateSwap(swapped, b, a);
      this.state = GameState.Idle;
      this.render();
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

  private async animateCascadeStep(step: CascadeStep): Promise<void> {
    await this.renderer.animateRemove(this.board, step.removed);
    // Apply removals to board for fall animation
    for (const pos of step.removed) this.board[pos.row][pos.col] = null;
    // Apply specials created
    for (const s of step.specialsCreated) {
      if (this.board[s.pos.row]?.[s.pos.col]) {
        this.board[s.pos.row][s.pos.col]!.type = s.type;
      }
    }
    this.render();

    if (step.fell.length) {
      await this.renderer.animateFall(this.board, step.fell);
    }

    // Apply gravity
    for (const m of step.fell) {
      this.board[m.to.row][m.to.col] = this.board[m.from.row][m.from.col];
      this.board[m.from.row][m.from.col] = null;
    }

    // Apply spawns
    const spawnPositions = step.spawned.map(s => s.pos);
    for (const s of step.spawned) {
      this.board[s.pos.row][s.pos.col] = s.cell;
    }

    if (spawnPositions.length) {
      await this.renderer.animateSpawn(this.board, spawnPositions);
    }
    this.render();
  }

  isGameOver(): boolean {
    if (this.movesLeft > 0 && this.score >= this.targetScore) return true;
    if (this.movesLeft === 0) return true;
    if (this.movesLeft === -1 && !hasValidMoves(this.board)) return true;
    return false;
  }

  usePowerUp(type: PowerUpType, pos?: Position): void {
    const pu = this.powerUps.find(p => p.type === type && p.uses > 0);
    if (!pu) return;
    pu.uses--;

    if (type === PowerUpType.Shuffle) {
      this.board = applyShuffle(this.board);
    } else if (type === PowerUpType.DestroyGem && pos) {
      const { board, steps } = applyDestroyGem(this.board, pos, this.config);
      this.board = board;
      for (const step of steps) {
        this.score += calculateScore(step, 1);
      }
    } else if (type === PowerUpType.ExtraMoves && this.movesLeft > 0) {
      this.movesLeft += 3;
    }

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
    };
  }

  private render(): void {
    this.renderer.drawBoard(this.board, this.selected);
  }
}
