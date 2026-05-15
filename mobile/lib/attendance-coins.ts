// ─────────────────────────────────────────────────────────────────────────────
// Attendance → Coins → Crates → Mascots
//
// Coin economy design:
//   • Kid attends ~4×/month (1 course, weekly) → earns 40 coins/month
//   • Common crate  (60  coins) ≈ 1.5 months  — accessible
//   • Rare   crate  (150 coins) ≈ 3.75 months — meaningful effort
//   • Epic   crate  (360 coins) ≈ 9 months     — real achievement
//
// COINS_PER_SESSION = 10  (not 15 — keeps economy healthy)
// ─────────────────────────────────────────────────────────────────────────────

export const COINS_PER_SESSION = 10;

// ─── Rarity — mirrors bracelet color ladder ───────────────────────────────────

export type MascotRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const rarityLabel: Record<MascotRarity, string> = {
  common: 'Béžová',
  uncommon: 'Růžová',
  rare: 'Fialová',
  epic: 'Tmavě fialová',
  legendary: 'Černá',
};

export const rarityColor: Record<MascotRarity, string> = {
  common: '#B89A6E',
  uncommon: '#D84A8F',
  rare: '#7B1DDD',
  epic: '#4C1A9A',
  legendary: '#16151A',
};

// Short label for the loot modal badge
export const rarityShortLabel: Record<MascotRarity, string> = {
  common: 'Běžný',
  uncommon: 'Neobvyklý',
  rare: 'Vzácný',
  epic: 'Epický',
  legendary: 'Legendární',
};

// ─── Mascot types ─────────────────────────────────────────────────────────────

export type MascotPose = 'sit' | 'jump' | 'sleep' | 'wave' | 'run' | 'fly' | 'cool' | 'magic' | 'shadow';

export type OwnedMascot = {
  id: string;
  name: string;
  rarity: MascotRarity;
  colorHex: string;
  pose: MascotPose;
  poseLabel: string;
  equippedOnProfile: boolean;
};

// ─── All 15 mascots (5 rarities × 3 poses) ───────────────────────────────────

const makeMascot = (
  id: string, name: string, rarity: MascotRarity, colorHex: string,
  pose: MascotPose, poseLabel: string,
): OwnedMascot => ({ id, name, rarity, colorHex, pose, poseLabel, equippedOnProfile: false });

export const ALL_MASCOTS: OwnedMascot[] = [
  // Béžová — common
  makeMascot('beige-sit',   'Béžová',       'common',    '#C8A87A', 'sit',    'Sedí'),
  makeMascot('beige-sleep', 'Béžová',       'common',    '#C8A87A', 'sleep',  'Spí'),
  makeMascot('beige-wave',  'Béžová',       'common',    '#C8A87A', 'wave',   'Zdraví'),

  // Růžová — uncommon
  makeMascot('pink-sit',    'Růžová',       'uncommon',  '#F07AAE', 'sit',    'Sedí'),
  makeMascot('pink-jump',   'Růžová',       'uncommon',  '#F07AAE', 'jump',   'Skáče'),
  makeMascot('pink-wave',   'Růžová',       'uncommon',  '#F07AAE', 'wave',   'Zdraví'),

  // Fialová — rare
  makeMascot('purple-sit',  'Fialová',      'rare',      '#9B4FF0', 'sit',    'Sedí'),
  makeMascot('purple-run',  'Fialová',      'rare',      '#9B4FF0', 'run',    'Běží'),
  makeMascot('purple-cool', 'Fialová',      'rare',      '#9B4FF0', 'cool',   'Styl'),

  // Tmavě fialová — epic
  makeMascot('darkp-sit',   'Tmavě fialová','epic',      '#6B2FBF', 'sit',    'Sedí'),
  makeMascot('darkp-fly',   'Tmavě fialová','epic',      '#6B2FBF', 'fly',    'Letí'),
  makeMascot('darkp-magic', 'Tmavě fialová','epic',      '#6B2FBF', 'magic',  'Kouzlí'),

  // Černá — legendary
  makeMascot('black-sit',   'Černá',        'legendary', '#2E2A38', 'sit',    'Sedí'),
  makeMascot('black-shadow','Černá',        'legendary', '#2E2A38', 'shadow', 'Stín'),
  makeMascot('black-magic', 'Černá',        'legendary', '#2E2A38', 'magic',  'Kouzlí'),
];

const m = (id: string) => ALL_MASCOTS.find((x) => x.id === id)!;

// ─── Loot types ───────────────────────────────────────────────────────────────

export type LootResult =
  | { kind: 'mascot'; mascot: OwnedMascot }
  | { kind: 'coins'; amount: number }
  | { kind: 'discount'; percent: number; label: string };

// ─── Crate types ──────────────────────────────────────────────────────────────

export type CrateId = 'common' | 'rare' | 'epic';

export type CrateDefinition = {
  id: CrateId;
  name: string;
  subtitle: string;
  price: number;
  gradient: [string, string];
  borderColor: string;
  badgeColor: string;
  lootTable: Array<{ weight: number; result: LootResult }>;
};

// ─── Crate definitions ────────────────────────────────────────────────────────
// Common  → beige mascots + small coin refund
// Rare    → pink + purple mascots + medium coins
// Epic    → dark purple + legendary + big coins

export const crateDefinitions: CrateDefinition[] = [
  {
    id: 'common',
    name: 'Běžná bedna',
    subtitle: 'Béžová série • základní odměny',
    price: 60,
    gradient: ['#FFF5DC', '#FFE6B0'],
    borderColor: 'rgba(200,168,122,0.45)',
    badgeColor: '#B07820',
    lootTable: [
      { weight: 28, result: { kind: 'mascot', mascot: m('beige-sit') } },
      { weight: 24, result: { kind: 'mascot', mascot: m('beige-sleep') } },
      { weight: 20, result: { kind: 'mascot', mascot: m('beige-wave') } },
      { weight: 5,  result: { kind: 'mascot', mascot: m('pink-sit') } },
      { weight: 14, result: { kind: 'coins', amount: 20 } },
      { weight: 9,  result: { kind: 'discount', percent: 5, label: '5 % na workshop' } },
    ],
  },
  {
    id: 'rare',
    name: 'Vzácná bedna',
    subtitle: 'Růžová a fialová série',
    price: 150,
    gradient: ['#EDD6FF', '#D4B0FF'],
    borderColor: 'rgba(139,29,255,0.40)',
    badgeColor: '#7B1DDD',
    lootTable: [
      { weight: 8,  result: { kind: 'mascot', mascot: m('beige-wave') } },
      { weight: 20, result: { kind: 'mascot', mascot: m('pink-sit') } },
      { weight: 18, result: { kind: 'mascot', mascot: m('pink-jump') } },
      { weight: 16, result: { kind: 'mascot', mascot: m('pink-wave') } },
      { weight: 12, result: { kind: 'mascot', mascot: m('purple-sit') } },
      { weight: 8,  result: { kind: 'mascot', mascot: m('purple-cool') } },
      { weight: 13, result: { kind: 'coins', amount: 45 } },
      { weight: 5,  result: { kind: 'discount', percent: 5, label: '5 % na workshop' } },
    ],
  },
  {
    id: 'epic',
    name: 'Epická bedna',
    subtitle: 'Tmavá a černá série',
    price: 360,
    gradient: ['#FFD6F0', '#FFE0CC'],
    borderColor: 'rgba(241,43,179,0.40)',
    badgeColor: '#B71482',
    lootTable: [
      { weight: 10, result: { kind: 'mascot', mascot: m('purple-run') } },
      { weight: 8,  result: { kind: 'mascot', mascot: m('purple-cool') } },
      { weight: 16, result: { kind: 'mascot', mascot: m('darkp-sit') } },
      { weight: 14, result: { kind: 'mascot', mascot: m('darkp-fly') } },
      { weight: 12, result: { kind: 'mascot', mascot: m('darkp-magic') } },
      { weight: 8,  result: { kind: 'mascot', mascot: m('black-sit') } },
      { weight: 5,  result: { kind: 'mascot', mascot: m('black-shadow') } },
      { weight: 3,  result: { kind: 'mascot', mascot: m('black-magic') } },
      { weight: 18, result: { kind: 'coins', amount: 100 } },
      { weight: 6,  result: { kind: 'discount', percent: 5, label: '5 % na workshop' } },
    ],
  },
];

// ─── Attendance entry ─────────────────────────────────────────────────────────

export type AttendanceEntry = {
  id: string;
  date: string;
  label: string;
  converted: boolean;
};

export const demoAttendance: AttendanceEntry[] = [
  { id: 'a1', date: '2.4.2026',  label: 'Trénink',  converted: true },
  { id: 'a2', date: '9.4.2026',  label: 'Trénink',  converted: true },
  { id: 'a3', date: '16.4.2026', label: 'Workshop', converted: true },
  { id: 'a4', date: '23.4.2026', label: 'Trénink',  converted: true },
  { id: 'a5', date: '30.4.2026', label: 'Trénink',  converted: true },
  { id: 'a6', date: '7.5.2026',  label: 'Trénink',  converted: false },
  { id: 'a7', date: '14.5.2026', label: 'Trénink',  converted: false },
];

export const demoCoins = demoAttendance.filter((a) => a.converted).length * COINS_PER_SESSION; // 50

export const demoOwnedMascots: OwnedMascot[] = [
  { ...m('beige-sit'),   equippedOnProfile: true },
  { ...m('pink-jump'),   equippedOnProfile: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function rollCrate(crate: CrateDefinition): LootResult {
  const total = crate.lootTable.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of crate.lootTable) {
    roll -= entry.weight;
    if (roll <= 0) return entry.result;
  }
  return crate.lootTable[crate.lootTable.length - 1].result;
}
