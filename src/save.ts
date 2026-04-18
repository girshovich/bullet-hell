export interface PerkDef {
  id: string;
  emoji: string;
  label: string;
  descPerLevel: string;
  costs: number[];
  maxLevel: number;
  /** Returns a human-readable string of the total current bonus at the given level. */
  totalEffect: (lv: number) => string;
}

export const PERK_DEFS: PerkDef[] = [
  {
    id: 'perm_damage', emoji: '💥', label: 'Arcane Power', descPerLevel: '+8% dmg/lv',
    costs: [5, 8, 12, 18, 25], maxLevel: 5,
    totalEffect: lv => lv > 0 ? `+${lv * 8}% damage` : '',
  },
  {
    id: 'perm_hp', emoji: '❤️', label: 'Vitality', descPerLevel: '+2 max HP/lv',
    costs: [4, 7, 11, 16, 22], maxLevel: 5,
    totalEffect: lv => lv > 0 ? `+${lv * 2} max HP` : '',
  },
  {
    id: 'perm_speed', emoji: '💨', label: 'Agility', descPerLevel: '+6% speed/lv',
    costs: [4, 7, 11, 16, 22], maxLevel: 5,
    totalEffect: lv => lv > 0 ? `+${lv * 6}% speed` : '',
  },
  {
    id: 'perm_fire_rate', emoji: '⚡', label: 'Focus', descPerLevel: '+8% fire rate/lv',
    costs: [5, 8, 12, 18, 25], maxLevel: 5,
    totalEffect: lv => lv > 0 ? `+${lv * 8}% fire rate` : '',
  },
  {
    id: 'perm_pickup', emoji: '🔮', label: 'Magnetism', descPerLevel: '+15px pickup/lv',
    costs: [3, 5, 8, 12, 17], maxLevel: 5,
    totalEffect: lv => lv > 0 ? `+${lv * 15}px pickup` : '',
  },
];

export interface LeaderboardEntry {
  name: string;
  score: number;
  kills: number;
  time: number;  // seconds
}

export interface SaveData {
  coins: number;
  perks: Record<string, number>;
  leaderboard: LeaderboardEntry[];
}

function defaultSave(): SaveData {
  return { coins: 0, perks: {}, leaderboard: [] };
}

export const SaveManager = {
  KEY: 'bullet-heaven-save',

  load(): SaveData {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveData>;
        return {
          coins: parsed.coins ?? 0,
          perks: parsed.perks ?? {},
          leaderboard: parsed.leaderboard ?? [],
        };
      }
    } catch { /* ignore */ }
    return defaultSave();
  },

  save(data: SaveData): void {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch { /* ignore */ }
  },

  reset(): void {
    try { localStorage.removeItem(this.KEY); } catch { /* ignore */ }
  },
};
