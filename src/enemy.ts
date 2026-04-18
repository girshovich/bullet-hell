import { Entity } from './types';
import {
  EMOJI,
  ENEMY_CHASER_SIZE, ENEMY_CHASER_SPEED, ENEMY_CHASER_HP, ENEMY_CHASER_DAMAGE, ENEMY_CHASER_XP,
  ENEMY_TANK_SIZE, ENEMY_TANK_SPEED, ENEMY_TANK_HP, ENEMY_TANK_DAMAGE, ENEMY_TANK_XP,
  ENEMY_SWARMER_SIZE, ENEMY_SWARMER_SPEED, ENEMY_SWARMER_HP, ENEMY_SWARMER_DAMAGE, ENEMY_SWARMER_XP,
  ENEMY_SHOOTER_SIZE, ENEMY_SHOOTER_SPEED, ENEMY_SHOOTER_HP, ENEMY_SHOOTER_DAMAGE, ENEMY_SHOOTER_XP,
  ENEMY_SHOOTER_FIRE_RATE, ENEMY_SHOOTER_PREFERRED_DIST, ENEMY_SHOOTER_RANGE,
  ENEMY_SHOOTER_PROJ_SPEED, ENEMY_SHOOTER_PROJ_DAMAGE,
} from './constants';
import { drawEmoji } from './renderer';

export type EnemyType = 'chaser' | 'tank' | 'swarmer' | 'shooter';

export interface PendingShot {
  x: number;
  y: number;
  angle: number;
  damage: number;
  speed: number;
  range: number;
}

export class Enemy implements Entity {
  x: number;
  y: number;
  sprite: string;
  size: number;
  hp: number;
  maxHp: number;
  readonly speed: number;
  readonly damage: number;
  readonly xpValue: number;
  readonly type: EnemyType;
  dead = false;

  private shootCooldown = 0;
  readonly shootRate: number;
  readonly preferredDist: number;
  readonly shootRange: number;
  readonly projSpeed: number;
  readonly projDamage: number;
  pendingShots: PendingShot[] = [];

  constructor(
    x: number, y: number,
    sprite: string, size: number,
    speed: number, hp: number,
    damage: number, xpValue: number,
    type: EnemyType = 'chaser',
    shootRate = 0,
    preferredDist = 0,
    shootRange = 0,
    projSpeed = 0,
    projDamage = 0,
  ) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.size = size;
    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.damage = damage;
    this.xpValue = xpValue;
    this.type = type;
    this.shootRate = shootRate;
    this.preferredDist = preferredDist;
    this.shootRange = shootRange;
    this.projSpeed = projSpeed;
    this.projDamage = projDamage;
  }

  update(dt: number, targetX: number, targetY: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    switch (this.type) {
      case 'shooter': {
        if (dist > 1 && Math.abs(dist - this.preferredDist) > 30) {
          const approach = dist > this.preferredDist ? 1 : -1;
          this.x += (dx / dist) * this.speed * dt * approach;
          this.y += (dy / dist) * this.speed * dt * approach;
        }
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0 && dist <= this.shootRange) {
          this.pendingShots.push({
            x: this.x, y: this.y,
            angle: Math.atan2(dy, dx),
            damage: this.projDamage,
            speed: this.projSpeed,
            range: this.shootRange,
          });
          this.shootCooldown = 1 / this.shootRate;
        }
        break;
      }
      case 'swarmer': {
        if (dist < 1) return;
        const jitter = (Math.random() - 0.5) * 0.6;
        const angle = Math.atan2(dy, dx) + jitter;
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
        break;
      }
      default: {
        if (dist < 1) return;
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
      }
    }
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) this.dead = true;
  }

  get radius(): number { return this.size * 0.4; }

  draw(ctx: CanvasRenderingContext2D): void {
    drawEmoji(ctx, this.sprite, this.x, this.y, this.size);
  }
}

export function createChaser(x: number, y: number, hpMult = 1, speedMult = 1): Enemy {
  return new Enemy(x, y, EMOJI.enemyChaser, ENEMY_CHASER_SIZE,
    ENEMY_CHASER_SPEED * speedMult, Math.ceil(ENEMY_CHASER_HP * hpMult),
    ENEMY_CHASER_DAMAGE, ENEMY_CHASER_XP, 'chaser');
}

export function createTank(x: number, y: number, hpMult = 1, speedMult = 1): Enemy {
  return new Enemy(x, y, EMOJI.enemyTank, ENEMY_TANK_SIZE,
    ENEMY_TANK_SPEED * speedMult, Math.ceil(ENEMY_TANK_HP * hpMult),
    ENEMY_TANK_DAMAGE, ENEMY_TANK_XP, 'tank');
}

export function createSwarmer(x: number, y: number, hpMult = 1, speedMult = 1): Enemy {
  return new Enemy(x, y, EMOJI.enemySwarmer, ENEMY_SWARMER_SIZE,
    ENEMY_SWARMER_SPEED * speedMult, Math.ceil(ENEMY_SWARMER_HP * hpMult),
    ENEMY_SWARMER_DAMAGE, ENEMY_SWARMER_XP, 'swarmer');
}

export function createShooter(x: number, y: number, hpMult = 1, speedMult = 1): Enemy {
  return new Enemy(x, y, EMOJI.enemyShooter, ENEMY_SHOOTER_SIZE,
    ENEMY_SHOOTER_SPEED * speedMult, Math.ceil(ENEMY_SHOOTER_HP * hpMult),
    ENEMY_SHOOTER_DAMAGE, ENEMY_SHOOTER_XP, 'shooter',
    ENEMY_SHOOTER_FIRE_RATE, ENEMY_SHOOTER_PREFERRED_DIST, ENEMY_SHOOTER_RANGE,
    ENEMY_SHOOTER_PROJ_SPEED, ENEMY_SHOOTER_PROJ_DAMAGE);
}
