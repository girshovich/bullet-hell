import { Entity, Weapon } from './types';
import {
  PLAYER_SPEED, PLAYER_SIZE, PLAYER_MAX_HP, PLAYER_INVINCIBILITY_TIME, PLAYER_PICKUP_RADIUS,
  WEAPON_DAMAGE, WEAPON_FIRE_RATE, WEAPON_PROJECTILE_COUNT, WEAPON_RANGE, WEAPON_PIERCE,
  XP_BASE, XP_SCALE, EMOJI,
} from './constants';
import { JoystickState } from './input';
import { drawEmoji } from './renderer';

export class Player implements Entity {
  x: number;
  y: number;
  readonly sprite = EMOJI.player;
  readonly size = PLAYER_SIZE;

  hp: number;
  maxHp: number;
  weapon: Weapon;
  fireCooldown = 0;
  invincibilityTimer = 0;

  xp = 0;
  level = 1;
  xpToNextLevel: number;
  speedMult = 1.0;
  pickupRadiusBonus = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.xpToNextLevel = XP_BASE;
    this.weapon = {
      damage: WEAPON_DAMAGE,
      fireRate: WEAPON_FIRE_RATE,
      projectileCount: WEAPON_PROJECTILE_COUNT,
      range: WEAPON_RANGE,
      pierce: WEAPON_PIERCE,
    };
  }

  update(dt: number, joystick: Readonly<JoystickState>, worldW: number, worldH: number): void {
    if (joystick.active && joystick.magnitude > 0) {
      const speed = PLAYER_SPEED * this.speedMult * joystick.magnitude;
      const half = this.size / 2;
      this.x = Math.max(half, Math.min(worldW - half, this.x + joystick.dx * speed * dt));
      this.y = Math.max(half, Math.min(worldH - half, this.y + joystick.dy * speed * dt));
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.invincibilityTimer > 0) this.invincibilityTimer -= dt;
  }

  /** Returns true if this gain triggered a level-up. */
  addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level++;
      this.xpToNextLevel = Math.round(XP_BASE * Math.pow(XP_SCALE, this.level - 1));
      return true;
    }
    return false;
  }

  takeDamage(amount: number): void {
    if (this.invincibilityTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invincibilityTimer = PLAYER_INVINCIBILITY_TIME;
    navigator.vibrate?.(40);
  }

  get isDead(): boolean { return this.hp <= 0; }
  get radius(): number { return this.size * 0.35; }
  get pickupRadius(): number { return PLAYER_PICKUP_RADIUS + this.pickupRadiusBonus; }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.invincibilityTimer > 0 && Math.floor(this.invincibilityTimer / 0.1) % 2 === 0) return;
    drawEmoji(ctx, this.sprite, this.x, this.y, this.size);
  }
}
