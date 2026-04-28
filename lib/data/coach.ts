/**
 * Mock data pro trenérský modul.
 * Až bude DB, přemapujeme 1:1 (sessions, attendance, ward_progress, payouts, coach_badges).
 */

export type CoachSessionType = 'krouzek' | 'workshop' | 'tabor';

export type CoachSession = {
  id: string;
  type: CoachSessionType;
  title: string;       // "Parkour kroužek – Vyškov"
  venue: string;       // "ZŠ Purkyňova"
  city: string;
  startsAt: string;    // ISO – dnešní čas pro mock
  endsAt: string;
  enrolledCount: number;
  expectedCount: number; // očekávaná docházka (přihlášení dnes)
  status: 'upcoming' | 'live' | 'done';
};

export type WardSummary = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  group: string;
  braceletLevel: number;
  xp: number;
  attendanceRate: number; // 0..1
  masteredTricks: number;
  inProgressTricks: number;
  readyForBraceletUp?: boolean; // splnil podmínky → možno udělit
  presentToday?: boolean;       // pro live attendance
};

export type AttendanceEntry = {
  wardId: string;
  status: 'present' | 'absent' | 'late';
  method?: 'nfc' | 'qr' | 'manual';
  at?: string; // ISO
};

export type Payout = {
  id: string;
  periodLabel: string; // "Březen 2026"
  hours: number;
  ratePerHour: number; // CZK
  amount: number;      // hours*rate
  status: 'paid' | 'pending';
  paidAt?: string;
};

export type CoachBadge = {
  id: string;
  name: string;
  description: string;
  emoji?: string; // jen interně, v UI použijeme 3D ikony podle id
  unlocked: boolean;
};

export type LeaderboardRow = {
  coachId: string;
  name: string;
  city: string;
  unlocksThisMonth: number;
  rating: number; // 0..5
};

export type Coach = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  city: string;
  groups: string[];
  rating: number; // 0..5
  unlocksTotal: number;
  unlocksThisMonth: number;
  hoursThisMonth: number;
  ratePerHour: number;
};

export const MOCK_COACH: Coach = {
  id: 'coach-1',
  firstName: 'Vašek',
  lastName: 'Skočil',
  nickname: 'Vašek',
  city: 'Vyškov',
  groups: ['Začátečníci PO 16:00', 'Pokročilí ST 17:00', 'Workshop – Wall tricks'],
  rating: 4.8,
  unlocksTotal: 213,
  unlocksThisMonth: 24,
  hoursThisMonth: 36,
  ratePerHour: 320,
};

// Dnešní rozvrh – časy generujeme relativně k aktuálnímu dni
function todayAt(h: number, m = 0): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const COACH_TODAY_SESSIONS: CoachSession[] = [
  {
    id: 's-today-1',
    type: 'krouzek',
    title: 'Parkour kroužek – Začátečníci',
    venue: 'ZŠ Purkyňova',
    city: 'Vyškov',
    startsAt: todayAt(15, 30),
    endsAt: todayAt(16, 30),
    enrolledCount: 14,
    expectedCount: 12,
    status: 'done',
  },
  {
    id: 's-today-2',
    type: 'krouzek',
    title: 'Parkour kroužek – Pokročilí',
    venue: 'ZŠ Nádražní',
    city: 'Vyškov',
    startsAt: todayAt(17, 0),
    endsAt: todayAt(18, 0),
    enrolledCount: 16,
    expectedCount: 15,
    status: 'live',
  },
  {
    id: 's-today-3',
    type: 'workshop',
    title: 'Workshop – Wall tricks',
    venue: 'Hala Sokol',
    city: 'Vyškov',
    startsAt: todayAt(18, 30),
    endsAt: todayAt(20, 0),
    enrolledCount: 9,
    expectedCount: 9,
    status: 'upcoming',
  },
];

export const WARDS: WardSummary[] = [
  {
    id: 'w1',
    firstName: 'Marek',
    lastName: 'Dvořák',
    age: 11,
    group: 'Pokročilí ST 17:00',
    braceletLevel: 2,
    xp: 1480,
    attendanceRate: 0.94,
    masteredTricks: 7,
    inProgressTricks: 2,
    readyForBraceletUp: true,
    presentToday: true,
  },
  {
    id: 'w2',
    firstName: 'Eliška',
    lastName: 'Horáková',
    age: 9,
    group: 'Začátečníci PO 16:00',
    braceletLevel: 1,
    xp: 320,
    attendanceRate: 0.88,
    masteredTricks: 3,
    inProgressTricks: 1,
    presentToday: true,
  },
  {
    id: 'w3',
    firstName: 'Honza',
    lastName: 'Novák',
    age: 10,
    group: 'Začátečníci PO 16:00',
    braceletLevel: 2,
    xp: 740,
    attendanceRate: 0.81,
    masteredTricks: 5,
    inProgressTricks: 1,
    presentToday: false,
  },
  {
    id: 'w4',
    firstName: 'Tomáš',
    lastName: 'Procházka',
    age: 12,
    group: 'Pokročilí ST 17:00',
    braceletLevel: 3,
    xp: 2100,
    attendanceRate: 0.97,
    masteredTricks: 11,
    inProgressTricks: 2,
    readyForBraceletUp: false,
    presentToday: true,
  },
  {
    id: 'w5',
    firstName: 'Anička',
    lastName: 'Veselá',
    age: 8,
    group: 'Začátečníci PO 16:00',
    braceletLevel: 1,
    xp: 180,
    attendanceRate: 0.72,
    masteredTricks: 2,
    inProgressTricks: 1,
    presentToday: false,
  },
  {
    id: 'w6',
    firstName: 'Kuba',
    lastName: 'Malý',
    age: 11,
    group: 'Workshop – Wall tricks',
    braceletLevel: 2,
    xp: 980,
    attendanceRate: 0.9,
    masteredTricks: 6,
    inProgressTricks: 3,
    readyForBraceletUp: true,
    presentToday: false,
  },
];

export const PAYOUTS: Payout[] = [
  {
    id: 'pay-1',
    periodLabel: 'Březen 2026',
    hours: 38,
    ratePerHour: 320,
    amount: 38 * 320,
    status: 'paid',
    paidAt: '2026-04-05',
  },
  {
    id: 'pay-2',
    periodLabel: 'Únor 2026',
    hours: 34,
    ratePerHour: 320,
    amount: 34 * 320,
    status: 'paid',
    paidAt: '2026-03-05',
  },
  {
    id: 'pay-3',
    periodLabel: 'Duben 2026 (probíhá)',
    hours: 36,
    ratePerHour: 320,
    amount: 36 * 320,
    status: 'pending',
  },
];

export const COACH_BADGES: CoachBadge[] = [
  { id: 'cb-mentor', name: 'Mentor', description: 'Odemkl 100+ triků svěřencům.', unlocked: true },
  { id: 'cb-streak', name: 'Bez výpadku', description: '3 měsíce bez zrušeného tréninku.', unlocked: true },
  { id: 'cb-camp',   name: 'Táborák',  description: 'Vedl alespoň jeden letní turnus.', unlocked: true },
  { id: 'cb-top10',  name: 'Top 10',   description: 'Skončil v měsíčním top 10 trenérů.', unlocked: false },
  { id: 'cb-rookie', name: 'Nováček',  description: 'První odemčený trik.', unlocked: true },
];

export const LEADERBOARD: LeaderboardRow[] = [
  { coachId: 'coach-9', name: 'Petr Hladík',   city: 'Praha',  unlocksThisMonth: 41, rating: 4.9 },
  { coachId: 'coach-3', name: 'Lucie Bártová', city: 'Brno',   unlocksThisMonth: 33, rating: 4.8 },
  { coachId: 'coach-1', name: 'Vašek Skočil',  city: 'Vyškov', unlocksThisMonth: 24, rating: 4.8 },
  { coachId: 'coach-7', name: 'Mára Jelínek',  city: 'Plzeň',  unlocksThisMonth: 22, rating: 4.6 },
  { coachId: 'coach-4', name: 'Tereza Malá',   city: 'Ostrava',unlocksThisMonth: 18, rating: 4.7 },
];

// ---- Helpers ----

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function presentCount(wards: WardSummary[]): number {
  return wards.filter((w) => w.presentToday).length;
}

export function readyForBraceletCount(wards: WardSummary[]): number {
  return wards.filter((w) => w.readyForBraceletUp).length;
}

export function nextSession(sessions: CoachSession[]): CoachSession | null {
  const live = sessions.find((s) => s.status === 'live');
  if (live) return live;
  return sessions.find((s) => s.status === 'upcoming') ?? null;
}

export function totalEarnedThisMonth(c: Coach = MOCK_COACH): number {
  return c.hoursThisMonth * c.ratePerHour;
}
