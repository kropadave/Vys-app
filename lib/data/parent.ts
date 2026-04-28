export type ParentChild = {
  id: string;
  name: string;
  age: number;
  city: string;
  group: string;
  bracelet: string;
  xp: number;
  nextGoal: string;
  attendanceRate: number;
};

export type ParentBooking = {
  id: string;
  title: string;
  childName: string;
  type: 'krouzek' | 'tabor' | 'workshop';
  dateLabel: string;
  price: number;
  status: 'active' | 'pending' | 'paid';
};

export type ParentPayment = {
  id: string;
  title: string;
  amount: number;
  dueLabel: string;
  status: 'paid' | 'due' | 'planned';
};

export const PARENT_CHILDREN: ParentChild[] = [
  {
    id: 'pc-1',
    name: 'Honza Novák',
    age: 10,
    city: 'Praha',
    group: 'Začátečníci – pondělí 16:00',
    bracelet: 'Žlutý',
    xp: 740,
    nextGoal: 'Speed vault',
    attendanceRate: 0.81,
  },
  {
    id: 'pc-2',
    name: 'Eliška Nováková',
    age: 8,
    city: 'Vyškov',
    group: 'ZŠ Purkyňova – pondělí 15:30',
    bracelet: 'Bílý',
    xp: 180,
    nextGoal: 'Rovnováha na liště',
    attendanceRate: 0.92,
  },
];

export const PARENT_BOOKINGS: ParentBooking[] = [
  {
    id: 'pb-1',
    title: 'Parkour kroužek – Vyškov, ZŠ Purkyňova',
    childName: 'Eliška Nováková',
    type: 'krouzek',
    dateLabel: 'Pondělí 15:30–16:30',
    price: 1790,
    status: 'active',
  },
  {
    id: 'pb-2',
    title: 'Letní tábor Vyškov – Orel jednota',
    childName: 'Honza Novák',
    type: 'tabor',
    dateLabel: 'léto 2026',
    price: 3890,
    status: 'pending',
  },
  {
    id: 'pb-3',
    title: 'Workshop Parkour fundamentals',
    childName: 'Honza Novák',
    type: 'workshop',
    dateLabel: '4 hodiny tréninku',
    price: 790,
    status: 'paid',
  },
];

export const PARENT_PAYMENTS: ParentPayment[] = [
  { id: 'pp-1', title: 'Kroužek Vyškov – Eliška', amount: 1790, dueLabel: 'zaplaceno', status: 'paid' },
  { id: 'pp-2', title: 'Tábor Vyškov – Honza', amount: 3890, dueLabel: 'splatnost do 15. 5.', status: 'due' },
  { id: 'pp-3', title: 'Workshop – Honza', amount: 790, dueLabel: 'zaplaceno', status: 'paid' },
];

export function duePaymentsTotal() {
  return PARENT_PAYMENTS.filter((p) => p.status === 'due').reduce((sum, p) => sum + p.amount, 0);
}
