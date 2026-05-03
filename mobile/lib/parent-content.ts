export type ParentPaymentStatus = 'paid' | 'due' | 'overdue';

export type ParentParticipant = {
  id: string;
  firstName: string;
  lastName: string;
  birthNumberMasked: string;
  level: number;
  bracelet: string;
  braceletColor: string;
  xp: number;
  nextBraceletXp: number;
  attendanceDone: number;
  attendanceTotal: number;
  activeCourse: string;
  nextTraining: string;
  paidStatus: ParentPaymentStatus;
  activePurchases: Array<{ type: 'Kroužek' | 'Tábor' | 'Workshop'; title: string; status: string }>;
};

export type ParentPayment = {
  id: string;
  title: string;
  participantName: string;
  amount: number;
  dueDate: string;
  status: ParentPaymentStatus;
  stripeReady: boolean;
};

export const parentProfile = {
  name: 'David Kropáč',
  email: 'rodic@example.cz',
  phone: '+420 605 324 417',
};

export const linkedParticipants: ParentParticipant[] = [
  {
    id: 'demo-child-1',
    firstName: 'Eliška',
    lastName: 'Nováková',
    birthNumberMasked: '******/1234',
    level: 7,
    bracelet: 'Růžová',
    braceletColor: '#F5A7C8',
    xp: 920,
    nextBraceletXp: 1400,
    attendanceDone: 14,
    attendanceTotal: 16,
    activeCourse: 'Vyškov · ZŠ Nádražní',
    nextTraining: 'Středa 16:30',
    paidStatus: 'paid',
    activePurchases: [
      { type: 'Kroužek', title: 'Parkour kroužek Vyškov', status: 'Zaplaceno' },
      { type: 'Tábor', title: 'Letní tábor Vyškov', status: 'Rezervováno' },
      { type: 'Workshop', title: 'Workshop se odemkne po přihlášení', status: 'Zatím nezakoupeno' },
    ],
  },
];

export const participantLookupCandidate = {
  firstName: 'Eliška',
  lastName: 'Nováková',
  birthNumberMasked: '******/1234',
  level: 7,
  bracelet: 'Růžová',
  activeCourse: 'Vyškov · ZŠ Nádražní',
};

export const parentPayments: ParentPayment[] = [
  {
    id: 'pay-course-1',
    title: 'Parkour kroužek Vyškov',
    participantName: 'Eliška Nováková',
    amount: 1790,
    dueDate: 'Zaplaceno',
    status: 'paid',
    stripeReady: true,
  },
  {
    id: 'pay-camp-1',
    title: 'Letní tábor Vyškov',
    participantName: 'Eliška Nováková',
    amount: 3890,
    dueDate: '30. 5. 2026',
    status: 'due',
    stripeReady: true,
  },
];

export function paymentStatusLabel(status: ParentPaymentStatus) {
  if (status === 'paid') return 'Zaplaceno';
  if (status === 'overdue') return 'Po splatnosti';
  return 'Čeká na platbu';
}

export function attendancePercent(participant: ParentParticipant) {
  return Math.round((participant.attendanceDone / participant.attendanceTotal) * 100);
}

export function duePaymentsTotal() {
  return parentPayments
    .filter((payment) => payment.status !== 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
}
