import { drawEmoji } from './renderer';
import { EMOJI, COIN_SIZE } from './constants';

export class Coin {
  x: number;
  y: number;
  dead = false;
  readonly size = COIN_SIZE;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get radius(): number { return this.size * 0.4; }

  draw(ctx: CanvasRenderingContext2D): void {
    drawEmoji(ctx, EMOJI.coin, this.x, this.y, this.size);
  }
}
