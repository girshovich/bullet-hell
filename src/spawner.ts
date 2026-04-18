import { Enemy, EnemyType, createChaser, createTank, createSwarmer, createShooter } from './enemy';
import {
  SPAWN_INTERVAL_START, SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_RAMP, SPAWN_MARGIN,
  WAVE_TIER_INTERVAL, WAVE_HP_SCALE, WAVE_SPEED_SCALE,
} from './constants';

export class EnemySpawner {
  private timer = 0;
  private elapsed = 0;

  update(dt: number, worldW: number, worldH: number): Enemy[] {
    this.elapsed += dt;
    this.timer += dt;

    const interval = Math.max(
      SPAWN_INTERVAL_MIN,
      SPAWN_INTERVAL_START - this.elapsed * SPAWN_INTERVAL_RAMP,
    );

    if (this.timer < interval) return [];
    this.timer = 0;

    const tier = Math.floor(this.elapsed / WAVE_TIER_INTERVAL);
    const hpMult  = 1 + tier * WAVE_HP_SCALE;
    const spMult  = 1 + tier * WAVE_SPEED_SCALE;

    const types: EnemyType[] = ['chaser'];
    if (this.elapsed >= 30) types.push('swarmer');
    if (this.elapsed >= 60) types.push('tank');
    if (this.elapsed >= 90) types.push('shooter');

    // Occasionally spawn 2 at once after 30 s
    const count = this.elapsed >= 30 && Math.random() < 0.3 ? 2 : 1;
    const batch: Enemy[] = [];
    for (let i = 0; i < count; i++) {
      const [x, y] = randomEdgePoint(SPAWN_MARGIN, worldW, worldH);
      const type = types[Math.floor(Math.random() * types.length)];
      batch.push(makeEnemy(type, x, y, hpMult, spMult));
    }
    return batch;
  }

  reset(): void {
    this.timer = 0;
    this.elapsed = 0;
  }
}

function makeEnemy(type: EnemyType, x: number, y: number, hpMult: number, spMult: number): Enemy {
  switch (type) {
    case 'tank':    return createTank(x, y, hpMult, spMult);
    case 'swarmer': return createSwarmer(x, y, hpMult, spMult);
    case 'shooter': return createShooter(x, y, hpMult, spMult);
    default:        return createChaser(x, y, hpMult, spMult);
  }
}

function randomEdgePoint(margin: number, w: number, h: number): [number, number] {
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0: return [Math.random() * w, -margin];
    case 1: return [Math.random() * w, h + margin];
    case 2: return [-margin, Math.random() * h];
    default: return [w + margin, Math.random() * h];
  }
}
