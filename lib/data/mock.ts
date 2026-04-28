/**
 * Mock data pro UI vývoj. Později nahradíme dotazy do Supabase.
 * Typy zde jsou už blízko cílovému DB schématu.
 */

export type BraceletLevel = {
  id: number; // 1..5
  name: string;
  color: string; // hex
  description: string;
  xpRequired: number;
};

export const BRACELET_LEVELS: BraceletLevel[] = [
  {
    id: 1,
    name: 'Bílý',
    color: '#F4F4F5',
    description: 'Začátečník – první kroky a pády bez bolesti.',
    xpRequired: 0,
  },
  {
    id: 2,
    name: 'Žlutý',
    color: '#FACC15',
    description: 'Základy parkouru – přeskoky, rovnováha, koordinace.',
    xpRequired: 500,
  },
  {
    id: 3,
    name: 'Oranžový',
    color: '#F97316',
    description: 'Pokročilejší triky a první kombinace.',
    xpRequired: 1500,
  },
  {
    id: 4,
    name: 'Zelený',
    color: '#22C55E',
    description: 'Plynulé flow, výškové překážky, speed vaulty.',
    xpRequired: 3500,
  },
  {
    id: 5,
    name: 'Černý',
    color: '#111827',
    description: 'Mistrovská úroveň – akrobacie, vlastní linie.',
    xpRequired: 7000,
  },
];

export type TrickStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

export type Trick = {
  id: string;
  name: string;
  description: string;
  xp: number;
  requiredBraceletLevel: number; // odemkne se od tohoto náramku
  prerequisites: string[]; // id jiných triků
  status: TrickStatus;
};

export const TRICKS: Trick[] = [
  // Bílý
  {
    id: 'safety-roll',
    name: 'Bezpečný pád (roll)',
    description: 'Základní kotoul přes rameno pro tlumení dopadu.',
    xp: 50,
    requiredBraceletLevel: 1,
    prerequisites: [],
    status: 'mastered',
  },
  {
    id: 'balance',
    name: 'Rovnováha na liště',
    description: 'Udrž se 10 s na úzké liště bez doteku země.',
    xp: 40,
    requiredBraceletLevel: 1,
    prerequisites: [],
    status: 'mastered',
  },
  {
    id: 'precision',
    name: 'Precision jump',
    description: 'Přesný skok ze stoje na vyznačené místo.',
    xp: 80,
    requiredBraceletLevel: 1,
    prerequisites: ['balance'],
    status: 'in_progress',
  },
  // Žlutý
  {
    id: 'speed-vault',
    name: 'Speed vault',
    description: 'Rychlé přeskočení překážky bokem s oporou jedné ruky.',
    xp: 120,
    requiredBraceletLevel: 2,
    prerequisites: ['precision'],
    status: 'available',
  },
  {
    id: 'lazy-vault',
    name: 'Lazy vault',
    description: 'Plynulé přehození nohou přes překážku.',
    xp: 100,
    requiredBraceletLevel: 2,
    prerequisites: ['precision'],
    status: 'available',
  },
  {
    id: 'cat-leap',
    name: 'Cat leap',
    description: 'Skok ze země nebo z překážky se zachycením za hranu.',
    xp: 140,
    requiredBraceletLevel: 2,
    prerequisites: ['precision'],
    status: 'locked',
  },
  // Oranžový
  {
    id: 'kong-vault',
    name: 'Kong vault',
    description: 'Přeskok překážky vpřed s oporou obou rukou (jako gorila).',
    xp: 200,
    requiredBraceletLevel: 3,
    prerequisites: ['speed-vault'],
    status: 'locked',
  },
  {
    id: 'wall-run',
    name: 'Wall run',
    description: 'Vyběhnutí na zeď a chycení horní hrany.',
    xp: 220,
    requiredBraceletLevel: 3,
    prerequisites: ['cat-leap'],
    status: 'locked',
  },
  // Zelený
  {
    id: 'dash-vault',
    name: 'Dash vault',
    description: 'Přeskok nohama napřed s dotykem rukama na konci.',
    xp: 320,
    requiredBraceletLevel: 4,
    prerequisites: ['kong-vault'],
    status: 'locked',
  },
  {
    id: 'palm-spin',
    name: 'Palm spin',
    description: 'Otočka kolem ruky přes překážku.',
    xp: 300,
    requiredBraceletLevel: 4,
    prerequisites: ['lazy-vault'],
    status: 'locked',
  },
  // Černý
  {
    id: 'wall-flip',
    name: 'Wall flip',
    description: 'Salto vzad odrazem ze zdi.',
    xp: 600,
    requiredBraceletLevel: 5,
    prerequisites: ['wall-run'],
    status: 'locked',
  },
  {
    id: 'double-kong',
    name: 'Double kong',
    description: 'Kong vault přes dvě překážky v řadě.',
    xp: 700,
    requiredBraceletLevel: 5,
    prerequisites: ['kong-vault', 'dash-vault'],
    status: 'locked',
  },
];

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji jako placeholder
  unlocked: boolean;
  reward?: {
    type: 'discount' | 'badge' | 'merch';
    label: string;
  };
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-trick',
    name: 'První trik',
    description: 'Zvládl jsi svůj první trik.',
    icon: '🎯',
    unlocked: true,
    reward: { type: 'badge', label: 'Odznak Začátečník' },
  },
  {
    id: 'five-tricks',
    name: '5 zvládnutých triků',
    description: 'Naučil ses 5 triků.',
    icon: '⭐',
    unlocked: false,
    reward: { type: 'discount', label: '10 % sleva na workshop' },
  },
  {
    id: 'ten-tricks',
    name: '10 zvládnutých triků',
    description: 'Naučil ses 10 triků.',
    icon: '🏅',
    unlocked: false,
    reward: { type: 'discount', label: '20 % sleva na workshop' },
  },
  {
    id: 'first-camp',
    name: 'Letní tábor',
    description: 'Zúčastnil ses tábora TeamVYS.',
    icon: '🏕️',
    unlocked: true,
  },
  {
    id: 'streak-10',
    name: '10 tréninků v řadě',
    description: 'Nevynechal jsi 10 tréninků za sebou.',
    icon: '🔥',
    unlocked: false,
    reward: { type: 'merch', label: 'TeamVYS tričko zdarma' },
  },
];

export type Purchase = {
  id: string;
  title: string;
  type: 'krouzek' | 'tabor' | 'workshop';
  date: string; // ISO
  status: 'active' | 'upcoming' | 'completed';
  price: number; // CZK
};

export const PURCHASES: Purchase[] = [
  {
    id: 'p1',
    title: 'Parkour kroužek – Praha, podzim 2026',
    type: 'krouzek',
    date: '2026-09-01',
    status: 'active',
    price: 3200,
  },
  {
    id: 'p2',
    title: 'Letní tábor 2026 – turnus 2',
    type: 'tabor',
    date: '2026-07-13',
    status: 'upcoming',
    price: 6900,
  },
  {
    id: 'p3',
    title: 'Workshop: Wall tricks',
    type: 'workshop',
    date: '2026-03-15',
    status: 'completed',
    price: 750,
  },
];

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  date: string; // ISO
  read: boolean;
};

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Odemčen nový trik!',
    body: 'Speed vault je teď dostupný k tréninku.',
    date: '2026-04-25T10:12:00Z',
    read: false,
  },
  {
    id: 'n2',
    title: 'Tábor se blíží',
    body: 'Za 11 týdnů začíná letní tábor – sbal si věci včas.',
    date: '2026-04-20T08:00:00Z',
    read: false,
  },
  {
    id: 'n3',
    title: 'Trénink zrušen',
    body: 'Páteční trénink (12. 4.) je zrušen, náhradní bude v sobotu.',
    date: '2026-04-10T17:30:00Z',
    read: true,
  },
];

export type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  age: number;
  city: string;
  group: string;
  xp: number;
  currentBraceletLevel: number; // 1..5
  joinedAt: string; // ISO
  avatarEmoji: string;
};

export const MOCK_PARTICIPANT: Participant = {
  id: 'mock-participant-1',
  firstName: 'Honza',
  lastName: 'Novák',
  nickname: 'Honzík',
  age: 10,
  city: 'Praha',
  group: 'Začátečníci – pondělí 16:00',
  xp: 740,
  currentBraceletLevel: 2,
  joinedAt: '2025-09-01',
  avatarEmoji: '🧒',
};

// ---- Pomocné selektory ----

export function masteredTricksCount(): number {
  return TRICKS.filter((t) => t.status === 'mastered').length;
}

export function unlockedAchievementsCount(): number {
  return ACHIEVEMENTS.filter((a) => a.unlocked).length;
}

export function currentBracelet(level: number): BraceletLevel {
  return BRACELET_LEVELS.find((b) => b.id === level) ?? BRACELET_LEVELS[0];
}

export function nextBracelet(level: number): BraceletLevel | null {
  return BRACELET_LEVELS.find((b) => b.id === level + 1) ?? null;
}

export function unreadNotificationsCount(): number {
  return NOTIFICATIONS.filter((n) => !n.read).length;
}
