import { Entity } from './types';
import { EMOJI, PROJECTILE_SPEED, PROJECTILE_SIZE } from './constants';
import { drawEmoji } from './renderer';
import { Enemy } from './enemy';

export class Projectile implements Entity {
  x: number;
  y: number;
  readonly sprite: string;
  readonly size = PROJECTILE_SIZE;

  readonly vx: number;
  readonly vy: number;
  readonly damage: number;
  pierceLeft: number;
  /** Tracks which enemies were already hit so pierce doesn't double-dip */
  readonly hitEnemies = new Set<Enemy>();
  dead = false;

  private distTraveled = 0;
  private readonly maxDist: number;
  private readonly speed: number;

  constructor(
    x: number, y: number,
    angle: number,
    damage: number,
    range: number,
    pierce: number,
    speed = PROJECTILE_SPEED,
    sprite: string = EMOJI.projectile,
  ) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.sprite = sprite;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.pierceLeft = pierce;
    this.maxDist = range;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.distTraveled += this.speed * dt;
    if (this.distTraveled >= this.maxDist) this.dead = true;
  }

  get radius(): number { return this.size * 0.3; }
  get angle(): number { return Math.atan2(this.vy, this.vx); }

  draw(ctx: CanvasRenderingContext2D): void {
    drawEmoji(ctx, this.sprite, this.x, this.y, this.size, this.angle);
  }
}
