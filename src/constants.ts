// ─── Tuning knobs ────────────────────────────────────────────────────────────

// Player
export const PLAYER_SIZE = 24;          // was 48 — 50% of original
export const PLAYER_SPEED = 300;        // was 450 — 1.5× slower
export const PLAYER_PICKUP_RADIUS = 30;

// Virtual joystick
export const JOYSTICK_DEAD_ZONE = 8;
export const JOYSTICK_MAX_DIST = 80;
export const JOYSTICK_VISUAL_RADIUS = 60;

// Player combat
export const PLAYER_MAX_HP = 10;
export const PLAYER_INVINCIBILITY_TIME = 0.8;

// Default weapon stats
export const WEAPON_DAMAGE = 1;
export const WEAPON_FIRE_RATE = 3.0;
export const WEAPON_PROJECTILE_COUNT = 1;
export const WEAPON_RANGE = 350;
export const WEAPON_PIERCE = 1;
export const PROJECTILE_SPEED = 333;    // was 500 — 1.5× slower
export const PROJECTILE_SIZE = 12;      // was 24 — 50% of original

// Enemies — chaser
export const ENEMY_CHASER_SIZE = 20;    // was 40
export const ENEMY_CHASER_SPEED = 80;   // was 120
export const ENEMY_CHASER_HP = 3;
export const ENEMY_CHASER_DAMAGE = 1;
export const ENEMY_CHASER_XP = 1;

// Enemies — tank
export const ENEMY_TANK_SIZE = 28;      // was 56
export const ENEMY_TANK_SPEED = 43;     // was 65
export const ENEMY_TANK_HP = 12;
export const ENEMY_TANK_DAMAGE = 2;
export const ENEMY_TANK_XP = 4;

// Enemies — swarmer
export const ENEMY_SWARMER_SIZE = 14;   // was 28
export const ENEMY_SWARMER_SPEED = 123; // was 185
export const ENEMY_SWARMER_HP = 1;
export const ENEMY_SWARMER_DAMAGE = 0.5;
export const ENEMY_SWARMER_XP = 1;

// Enemies — shooter
export const ENEMY_SHOOTER_SIZE = 20;   // was 38
export const ENEMY_SHOOTER_SPEED = 53;  // was 80
export const ENEMY_SHOOTER_HP = 5;
export const ENEMY_SHOOTER_DAMAGE = 0.5;
export const ENEMY_SHOOTER_XP = 3;
export const ENEMY_SHOOTER_FIRE_RATE = 0.45;
export const ENEMY_SHOOTER_PREFERRED_DIST = 260;
export const ENEMY_SHOOTER_PROJ_SPEED = 200; // was 300
export const ENEMY_SHOOTER_PROJ_DAMAGE = 0.5;
export const ENEMY_SHOOTER_RANGE = 420;

// Wave scaling
export const WAVE_TIER_INTERVAL = 45;
export const WAVE_HP_SCALE = 0.25;
export const WAVE_SPEED_SCALE = 0.10;

// Spawner
export const SPAWN_INTERVAL_START = 2.0;
export const SPAWN_INTERVAL_MIN = 0.4;
export const SPAWN_INTERVAL_RAMP = 0.04;
export const SPAWN_MARGIN = 80;

// XP / levelling
export const XP_GEM_SIZE = 12;          // was 22
export const XP_BASE = 5;
export const XP_SCALE = 1.35;

// Coins
export const COIN_SIZE = 10;            // was 20

// Game loop
export const FIXED_STEP = 1 / 60;

// ─── Emoji palette ───────────────────────────────────────────────────────────
export const EMOJI = {
  player:          '🧙',
  projectile:      '✨',
  enemyChaser:     '👹',
  enemyTank:       '👾',
  enemySwarmer:    '🦟',
  enemyShooter:    '👽',
  enemyProjectile: '💥',
  xpGem:           '💎',
  healthPickup:    '❤️',
  coin:            '🪙',
  deathParticle:   '💀',
  levelUpSparkle:  '⭐',
} as const;
