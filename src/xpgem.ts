import { drawEmoji } from './renderer';
import { EMOJI, XP_GEM_SIZE } from './constants';

export class XpGem {
  x: number;
  y: number;
  readonly value: number;
  dead = false;
  readonly size = XP_GEM_SIZE;

  constructor(x: number, y: number, value: number) {
    this.x = x;
    this.y = y;
    this.value = value;
  }

  get radius(): number { return this.size * 0.4; }

  draw(ctx: CanvasRenderingContext2D): void {
    drawEmoji(ctx, EMOJI.xpGem, this.x, this.y, this.size);
  }
}
