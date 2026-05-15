import { camps, courses } from '@/lib/public-content';

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

export type ParentProduct = {
  id: string;
  type: 'Kroužek' | 'Tábor' | 'Workshop';
  title: string;
  city: string;
  place: string;
  venue: string;
  price: number;
  priceLabel: string;
  originalPrice?: number;
  entriesTotal?: number;
  capacityTotal: number;
  primaryMeta: string;
  secondaryMeta: string;
  description: string;
  importantInfo: Array<{ label: string; value: string }>;
  badge: string;
  eventDate?: string;
  expiresAt?: string;
};

export type ParentProductFaq = {
  id: string;
  question: string;
  answer: string;
  categories: ParentProduct['type'][];
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
      { type: 'Kroužek', title: 'Permanentka 10 vstupů · Vyškov', status: 'Aktivní' },
      { type: 'Tábor', title: 'Letní tábor Vyškov', status: 'Rezervováno' },
      { type: 'Workshop', title: 'Workshop se odemkne po přihlášení', status: 'Zatím nezakoupeno' },
    ],
  },
];

export const parentProducts: ParentProduct[] = [
  ...courses.flatMap((course) => [
    {
      id: course.id,
      type: 'Kroužek' as const,
      title: `Kroužek ${course.city}`,
      city: course.city,
      place: `${course.city} · ${course.venue}`,
      venue: course.venue,
      price: course.priceAmount,
      priceLabel: `10 vstupů · ${course.priceAmount} Kč`,
      entriesTotal: 10,
      capacityTotal: course.capacityTotal,
      primaryMeta: `${course.day} ${course.from} - ${course.to}`,
      secondaryMeta: 'Digitální permanentka přes NFC čip',
      description: `Permanentka na 10 vstupů do parkour tréninku. Každý příchod se odečte po načtení NFC čipu.`,
      importantInfo: courseImportantInfo(course.city, course.venue, 10),
      badge: 'Kroužek',
    },
    {
      id: `${course.id}-15`,
      type: 'Kroužek' as const,
      title: `Kroužek ${course.city}`,
      city: course.city,
      place: `${course.city} · ${course.venue}`,
      venue: course.venue,
      price: 2590,
      priceLabel: '15 vstupů · 2590 Kč',
      originalPrice: 2685,
      entriesTotal: 15,
      capacityTotal: course.capacityTotal,
      primaryMeta: `${course.day} ${course.from} - ${course.to}`,
      secondaryMeta: 'Výhodnější digitální permanentka přes NFC čip',
      description: `Permanentka na 15 vstupů do parkour tréninku. Každý příchod se odečte po načtení NFC čipu.`,
      importantInfo: courseImportantInfo(course.city, course.venue, 15),
      badge: 'Kroužek',
    },
  ]),
  ...camps.map((camp) => ({
    id: camp.id,
    type: 'Tábor' as const,
    title: `Příměstský tábor ${camp.place}`,
    city: camp.place,
    place: `${camp.place} · ${camp.venue}`,
    venue: camp.venue,
    price: camp.priceAmount,
    priceLabel: camp.price,
    capacityTotal: camp.capacityTotal,
    primaryMeta: camp.season,
    secondaryMeta: 'Jídlo a tričko v ceně',
    description: `Týden pohybu, her a parkouru v lokalitě ${camp.place}. V ceně je program, jídlo, trenéři a táborové tričko.`,
    importantInfo: campImportantInfo(camp.id),
    badge: 'Táborový turnus',
  })),
  {
    id: 'workshop-praha-balkan',
    type: 'Workshop',
    title: 'Praha Balkan workshop',
    city: 'Praha',
    place: 'Praha · Balkan',
    venue: 'Balkan tréninková hala',
    price: 890,
    priceLabel: '890 Kč',
    capacityTotal: 40,
    primaryMeta: '14. 6. 2026 · 10:00',
    secondaryMeta: 'QR ticket po zaplacení',
    description: 'Jednorázový workshop pro růžovou cestu: parkour přeskoky, plynulost a první tricking kombinace.',
    importantInfo: [
      { label: 'Vstupenka', value: 'Po zaplacení se rodiči i účastníkovi zobrazí QR ticket.' },
      { label: 'Platnost', value: 'Ticket platí pouze pro workshop Praha · Balkan do 15. 6. 2026.' },
      { label: 'Kapacita', value: '40 účastníků.' },
      { label: 'Triky', value: 'Tic-tac, Kong vault, Lazy vault, Butterfly kick, Tornado kick a Macaco.' },
      { label: 'Kontrola', value: 'Trenér po skenu uvidí jméno, level, náramek, místo, platnost a workshopové triky.' },
    ],
    badge: 'Workshop',
    eventDate: '14. 6. 2026 · 10:00',
    expiresAt: '2026-06-15',
  },
];

export const parentProductFaq: ParentProductFaq[] = [
  {
    id: 'course-location-pass',
    categories: ['Kroužek'],
    question: 'Můžu jednu permanentku používat ve více lokalitách?',
    answer: 'Ne. Jedna permanentka platí pouze pro jednu vybranou lokaci. Je to kvůli docházce, kapacitě skupiny a správnému odečítání vstupů u trenéra.',
  },
  {
    id: 'course-attendance-chip',
    categories: ['Kroužek'],
    question: 'Jak se odečítají vstupy z permanentky?',
    answer: 'Vstup se odečte při příchodu na trénink po načtení NFC čipu. Rodič i účastník potom vidí, kolikrát už dítě bylo a kolik vstupů zbývá.',
  },
  {
    id: 'course-documents-required',
    categories: ['Kroužek'],
    question: 'Jaké dokumenty musím vyplnit před kroužkem?',
    answer: 'V rodičovském profilu je potřeba podepsat GDPR, souhlas zákonného zástupce, zdravotní informace a odchod z tréninku. Bez kompletních dokumentů trenér vidí, že profil není připravený pro pravidelnou účast.',
  },
  {
    id: 'camp-day-time',
    categories: ['Tábor'],
    question: 'V kolik děti na táboře začínají a končí?',
    answer: 'Typický den začíná příchodem mezi 8:00 a 9:00. Program běží přes dopolední trénink, oběd a odpolední aktivity, vyzvednutí je kolem 16:00.',
  },
  {
    id: 'camp-food',
    categories: ['Tábor'],
    question: 'Je v ceně jídlo a pitný režim?',
    answer: 'Ano. V ceně je dopolední i odpolední svačina, teplý oběd a celodenní pitný režim. Dietu nebo alergii je potřeba uvést do přihlášky.',
  },
  {
    id: 'camp-age-capacity',
    categories: ['Tábor'],
    question: 'Pro jak staré děti tábory jsou a kolik je míst?',
    answer: 'Vyškov je pro děti 6-14 let, Veliny pro děti 7-16 let. Kapacita uvedená na webu je 30 dětí na turnus.',
  },
  {
    id: 'camp-documents-qr',
    categories: ['Tábor'],
    question: 'Jak probíhá příchod 1. den tábora?',
    answer: 'Žádný QR ticket není potřeba. Stačí přijít, nahlásit jméno dítěte a trenér zkontroluje přihlášku a dokumenty přímo v systému. Podmínkou je mít zaplaceno a podepsané všechny dokumenty.',
  },
  {
    id: 'camp-medical-check',
    categories: ['Tábor'],
    question: 'Kdo uvidí alergie a anamnézu?',
    answer: 'Trenér má přístup k záznamu každého přihlášeného dítěte včetně alergií, léků, zdravotních omezení a povoleného vyzvedávání. Informace jsou dostupné přímo v systému.',
  },
  {
    id: 'registered-members',
    categories: ['Kroužek', 'Tábor', 'Workshop'],
    question: 'Musím mít dítě přidané v účtu?',
    answer: 'Ano. Nákup se váže na konkrétního účastníka, proto je potřeba mít dítě přidané v rodičovském profilu.',
  },
];

function courseImportantInfo(city: string, venue: string, entriesTotal: number) {
  return [
    { label: 'Platí pouze pro lokaci', value: `${city} · ${venue}` },
    { label: 'Důvod omezení', value: 'Permanentka je jen na jednu lokaci kvůli docházce a kapacitě konkrétní skupiny.' },
    { label: 'Četnost tréninku', value: '1x týdně podle vybraného dne a času.' },
    { label: 'Kapacita', value: '25 dětí ve skupině.' },
    { label: 'Zkušební lekce', value: 'První trénink je zdarma na zkoušku.' },
    { label: 'Dokumenty', value: 'Po zakoupení kroužku rodič vyplní GDPR, souhlas rodiče, zdravotní informace a odchod z tréninku.' },
    { label: 'Odečítání', value: `${entriesTotal} vstupů se odečítá přes NFC čip při příchodu na trénink.` },
  ];
}

function campImportantInfo(campId: string) {
  if (campId === 'camp-veliny-mlynek') {
    return [
      { label: 'Termíny', value: '20.7.-24.7. nebo 27.7.-31.7.' },
      { label: 'Čas', value: 'Příchod 8:00-9:00, vyzvednutí kolem 16:00.' },
      { label: 'Věk', value: '7-16 let.' },
      { label: 'Kapacita', value: '30 dětí na turnus.' },
      { label: 'Adresa', value: 'Veliny 31, 534 01 Holice.' },
      { label: 'Strava', value: 'Dopolední svačina, teplý oběd, odpolední svačina a pitný režim jsou v ceně.' },
      { label: 'Alergie', value: 'Dietu nebo alergii uveďte v přihlášce.' },
      { label: 'Dokumenty', value: 'Po zaplacení rodič podepíše GDPR, souhlas, anamnézu, bezinfekčnost, vyzvedávání a věci s sebou.' },
      { label: 'Příchod 1. den', value: 'Stačí přijít a nahlásit jméno — trenér zkontroluje přihlášku a dokumenty přímo v systému.' },
      { label: 'Co mít s sebou', value: 'Láhev, sportovní oblečení, sálové i venkovní boty, kšiltovku, opalovací krém, kopii kartičky pojišťovny a označené léky.' },
    ];
  }

  return [
    { label: 'Termíny', value: '13.7.-17.7. nebo 10.8.-14.8.' },
    { label: 'Čas', value: 'Příchod 8:00-9:00, vyzvednutí kolem 16:00.' },
    { label: 'Věk', value: '6-14 let.' },
    { label: 'Kapacita', value: '30 dětí na turnus.' },
    { label: 'Adresa', value: 'Hřbitovní 490/6, 682 01 Vyškov-Město.' },
    { label: 'Strava', value: 'Dopolední svačina, teplý oběd, odpolední svačina a pitný režim jsou v ceně.' },
    { label: 'Alergie', value: 'Dietu nebo alergii uveďte v přihlášce.' },
    { label: 'Dokumenty', value: 'Po zaplacení rodič podepíše GDPR, souhlas, anamnézu, bezinfekčnost, vyzvedávání a věci s sebou.' },
    { label: 'Příchod 1. den', value: 'Stačí přijít a nahlásit jméno — trenér zkontroluje přihlášku a dokumenty přímo v systému.' },
    { label: 'Co mít s sebou', value: 'Láhev, sportovní oblečení, sálové i venkovní boty, kšiltovku, opalovací krém, kopii kartičky pojišťovny a označené léky.' },
  ];
}

export const parentPayments: ParentPayment[] = [
  {
    id: 'pay-course-1',
    title: 'Permanentka 10 vstupů Vyškov',
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
