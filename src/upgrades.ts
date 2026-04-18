import { Player } from './player';

export interface UpgradeOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  apply: (player: Player) => void;
}

const UPGRADE_POOL: UpgradeOption[] = [
  {
    id: 'multishot',
    emoji: '✨',
    label: 'Multishot',
    description: '+1 projectile',
    apply: p => { p.weapon = { ...p.weapon, projectileCount: p.weapon.projectileCount + 1 }; },
  },
  {
    id: 'pierce',
    emoji: '🗡️',
    label: 'Piercing',
    description: '+1 pierce',
    apply: p => { p.weapon = { ...p.weapon, pierce: p.weapon.pierce + 1 }; },
  },
  {
    id: 'fire_rate',
    emoji: '⚡',
    label: 'Rapid Fire',
    description: '+100% fire rate',
    apply: p => { p.weapon = { ...p.weapon, fireRate: p.weapon.fireRate * 2 }; },
  },
  {
    id: 'speed',
    emoji: '💨',
    label: 'Swift Feet',
    description: '+50% move speed',
    apply: p => { p.speedMult *= 1.5; },
  },
  {
    id: 'heal',
    emoji: '❤️',
    label: 'Vitality',
    description: '+5 max HP & heal',
    apply: p => { p.maxHp += 5; p.hp = Math.min(p.hp + 5, p.maxHp); },
  },
];

export function pickThreeUpgrades(): UpgradeOption[] {
  const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
