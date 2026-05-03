import { courseGallery, courseHero } from '@/lib/photos';
import { camps, courses, workshops } from '@shared/content';

export type ActivityType = 'Krouzek' | 'Tabor' | 'Workshop';
export type PaymentStatus = 'paid' | 'due' | 'overdue';
export type DocumentStatus = 'signed' | 'draft' | 'missing';
export type CoachDppStatus = 'signed' | 'sent' | 'draft' | 'missing';
export type RequiredDocumentKind = 'gdpr' | 'guardian-consent' | 'health' | 'departure' | 'infection-free' | 'packing' | 'workshop-terms';

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
  activePurchases: Array<{ type: ActivityType; title: string; status: string }>;
};

export type ParentProduct = {
  id: string;
  type: ActivityType;
  title: string;
  city: string;
  place: string;
  venue: string;
  price: number;
  priceLabel: string;
  originalPrice?: number;
  entriesTotal?: number;
  capacityTotal: number;
  capacityCurrent: number;
  primaryMeta: string;
  secondaryMeta: string;
  description: string;
  badge: string;
  heroImage: string;
  gallery: string[];
  coachIds?: string[];
  importantInfo: Array<{ label: string; value: string }>;
  trainingFocus: string[];
};

export type RequiredDocumentTemplate = {
  kind: RequiredDocumentKind;
  title: string;
  description: string;
  requiredFor: ActivityType[];
};

export type ParentPayment = {
  id: string;
  title: string;
  participantName: string;
  amount: number;
  dueDate: string;
  paidAt: string;
  method: string;
  status: PaymentStatus;
};

export type ParentDocument = {
  id: string;
  participantName: string;
  activityTitle: string;
  activityType: ActivityType;
  title: string;
  status: DocumentStatus;
  updatedAt: string;
};

export type AdminCoachSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  bankAccount: string;
  iban?: string;
  status: 'Aktivni' | 'Ceka na klic' | 'Pozastaveny';
  locations: string[];
  loggedHours: number;
  baseAmount: number;
  approvedBonuses: number;
  pendingBonuses: number;
  nextPayout: string;
  lastAttendance: string;
  childrenLogged: number;
  qrTricksApproved: number;
  profilePhotoUrl?: string;
  stripeAccountId?: string;
};

export type ParentProductTrainer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  locations: string[];
  qrTricksApproved: number;
  profilePhotoUrl: string;
};

export type AdminCoachDppDocument = {
  id: string;
  coachId: string;
  coachName: string;
  title: string;
  status: CoachDppStatus;
  validFrom: string;
  validTo: string;
  hourlyRate: number;
  role: string;
  workplace: string;
  scope: string;
  digitalEnvelopeId?: string;
  signedAt?: string;
  updatedAt: string;
  clauses: string[];
};

export const requiredDocumentTemplates: RequiredDocumentTemplate[] = [
  { kind: 'gdpr', title: 'GDPR souhlas', description: 'Souhlas se zpracováním osobních údajů dítěte a zákonného zástupce.', requiredFor: ['Krouzek', 'Tabor', 'Workshop'] },
  { kind: 'guardian-consent', title: 'Souhlas zákonného zástupce', description: 'Potvrzení účasti na aktivitě, pravidel TeamVYS a odpovědné osoby.', requiredFor: ['Krouzek', 'Tabor'] },
  { kind: 'health', title: 'Zdravotní prohlášení', description: 'Alergie, léky, omezení a potvrzení zdravotní způsobilosti dítěte.', requiredFor: ['Krouzek', 'Tabor', 'Workshop'] },
  { kind: 'departure', title: 'Samostatný odchod dítěte', description: 'Souhlas rodiče, že dítě může po skončení aktivity odejít samo bez vyzvednutí.', requiredFor: ['Krouzek', 'Tabor'] },
  { kind: 'infection-free', title: 'Bezinfekčnost', description: 'Čestné prohlášení pro táborový turnus před nástupem.', requiredFor: ['Tabor'] },
  { kind: 'packing', title: 'Věci s sebou', description: 'Potvrzení výbavy, léků, kartičky pojišťovny a táborových pokynů.', requiredFor: ['Tabor'] },
  { kind: 'workshop-terms', title: 'Přihláška a podmínky', description: 'Souhlas zákonného zástupce s fyzicky náročnou aktivitou, souhlas s focením a natáčením a storno podmínky TeamVYS Parkour school.', requiredFor: ['Workshop'] },
];

export type AdminActivityRow = {
  id: string;
  type: ActivityType;
  title: string;
  place: string;
  capacityTotal: number;
  registered: number;
  visits: number;
  revenue: number;
  pendingRevenue: number;
  documentsMissing: number;
};

export type AdminProductTemplate = {
  type: ActivityType;
  title: string;
  description: string;
  defaults: Array<{ label: string; value: string }>;
  checklist: string[];
};

export const parentProfile = {
  name: 'David Kropac',
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
    activePurchases: [
      { type: 'Krouzek', title: 'Permanentka 10 vstupů · Vyškov', status: 'Aktivní' },
      { type: 'Tabor', title: 'Příměstský tábor Vyškov · 1. turnus', status: 'Zaplaceno' },
    ],
  },
  {
    id: 'demo-child-2',
    firstName: 'Alex',
    lastName: 'Svoboda',
    birthNumberMasked: '******/7788',
    level: 4,
    bracelet: 'Béžová',
    braceletColor: '#D8C2A3',
    xp: 570,
    nextBraceletXp: 600,
    attendanceDone: 7,
    attendanceTotal: 10,
    activeCourse: 'Prostějov · ZŠ Melantrichova',
    nextTraining: 'Sobota 10:00',
    activePurchases: [],
  },
];

export const parentProducts: ParentProduct[] = [
  ...courses.flatMap((course) => [
    {
      id: course.id,
      type: 'Krouzek' as const,
      title: `Kroužek ${course.city}`,
      city: course.city,
      place: `${course.city} · ${course.venue}`,
      venue: course.venue,
      price: course.priceAmount,
      priceLabel: `10 vstupů · ${course.priceAmount} Kč`,
      entriesTotal: 10,
      capacityTotal: course.capacityTotal,
      capacityCurrent: course.capacityCurrent,
      primaryMeta: `${course.day} ${course.from}-${course.to}`,
      secondaryMeta: 'Digitální permanentka přes NFC čip',
      description: 'Pravidelný parkour trénink s metodickým postupem od dopadů přes přeskoky až po flow. Docházka se odečítá přes NFC čip a rodič vidí progres i historii vstupů.',
      badge: 'Kroužek',
      heroImage: courseHero[course.id] ?? '/courses/prostejov_Prostejov_parkour_main.webp',
      gallery: courseGallery[course.id] ?? [],
      importantInfo: [
        { label: 'Permanentka', value: '10 vstupů na vybranou lokalitu' },
        { label: 'Docházka', value: 'Odečítání přes NFC čip při příchodu' },
        { label: 'Kapacita', value: `${course.capacityCurrent}/${course.capacityTotal} dětí aktuálně přihlášeno` },
      ],
      trainingFocus: ['bezpečné dopady', 'přeskoky', 'koordinace', 'skill tree a QR triky'],
    },
    {
      id: `${course.id}-15`,
      type: 'Krouzek' as const,
      title: `Kroužek ${course.city}`,
      city: course.city,
      place: `${course.city} · ${course.venue}`,
      venue: course.venue,
      price: 2590,
      priceLabel: '15 vstupů · 2590 Kč',
      originalPrice: course.priceAmount ? course.priceAmount + Math.round(course.priceAmount / 2) : undefined,
      entriesTotal: 15,
      capacityTotal: course.capacityTotal,
      capacityCurrent: course.capacityCurrent,
      primaryMeta: `${course.day} ${course.from}-${course.to}`,
      secondaryMeta: 'Výhodnější digitální permanentka',
      description: 'Výhodnější permanentka pro dítě, které chodí pravidelně. Stejná lokalita, stejní trenéři, více vstupů a přehled v rodičovském portálu.',
      badge: 'Kroužek',
      heroImage: courseHero[course.id] ?? '/courses/prostejov_Prostejov_parkour_main.webp',
      gallery: courseGallery[course.id] ?? [],
      importantInfo: [
        { label: 'Permanentka', value: '15 vstupů na vybranou lokalitu' },
        { label: 'Výhoda', value: 'Lepší cena za vstup pro pravidelnou docházku' },
        { label: 'Kapacita', value: `${course.capacityCurrent}/${course.capacityTotal} dětí aktuálně přihlášeno` },
      ],
      trainingFocus: ['pravidelný progres', 'přeskoky', 'flow', 'QR potvrzení triků'],
    },
  ]),
  ...camps.flatMap((camp) => {
    const terms = camp.terms ?? [{ id: 't1', label: camp.season, dates: camp.season }];
    return terms.map((term) => ({
      id: `${camp.id}-${term.id}`,
      type: 'Tabor' as const,
      title: `Příměstský tábor ${camp.place}`,
      city: camp.place,
      place: `${camp.place} · ${camp.venue}`,
      venue: camp.venue,
      price: camp.priceAmount,
      priceLabel: camp.price,
      capacityTotal: camp.capacityTotal,
      capacityCurrent: Math.ceil(camp.capacityCurrent / terms.length),
      primaryMeta: `${term.label} · ${term.dates}`,
      secondaryMeta: 'Jídlo a tričko v ceně',
      description: `Týden pohybu, her a parkouru v lokalitě ${camp.place}. Tábor má denní režim, trenérský dohled, dokumenty pro rodiče a QR ticket pro první den.`,
      badge: 'Táborový turnus',
      heroImage: camp.place === 'Vyškov' ? '/courses/nadrazka_ZS-Nadrazka-Foto3.webp' : '/courses/brandys_BR4.webp',
      gallery: camp.place === 'Vyškov' ? ['/courses/nadrazka_ZS-Nadrazka-Foto3.webp', '/courses/nadrazka_ZS-Nadrazka-Foto1.webp', '/courses/nadrazka_ZS-Nadrazka-Foto2.webp'] : ['/courses/brandys_BR4.webp', '/courses/brandys_BR5.webp', '/courses/brandys_BR6.webp'],
      importantInfo: [
        { label: 'Turnus', value: `${term.label} · ${term.dates}` },
        { label: 'Dokumenty', value: 'GDPR, souhlas, anamnéza, bezinfekčnost, vyzvedávání a věci s sebou' },
        { label: 'Nástup', value: 'QR ticket se odemkne až po zaplacení a kompletních dokumentech' },
        { label: 'V ceně', value: 'jídlo, pitný režim a táborové tričko' },
      ],
      trainingFocus: ['parkour základy', 'týmové hry', 'venkovní výzvy', 'bezpečný režim dne'],
    }));
  }),
  ...workshops.map((workshop) => ({
    id: workshop.id,
    type: 'Workshop' as const,
    title: workshop.place,
    city: workshop.city,
    place: workshop.place,
    venue: workshop.place,
    price: Number.parseInt(workshop.price, 10),
    priceLabel: workshop.price,
    capacityTotal: workshop.capacityTotal,
    capacityCurrent: workshop.capacityCurrent,
    primaryMeta: workshop.date,
    secondaryMeta: 'QR ticket po zaplacení',
    description: `${workshop.body} Workshop je jednorázový, intenzivní a rodič po zaplacení dostane QR ticket pro kontrolu na místě.`,
    badge: 'Workshop',
    heroImage: '/courses/brandys_BR2.webp',
    gallery: ['/courses/brandys_BR2.webp', '/courses/brandys_BR3.webp', '/courses/brandys_BR4.webp'],
    importantInfo: [
      { label: 'Ticket', value: 'QR ticket po zaplacení' },
      { label: 'Platnost', value: 'Pouze pro uvedený termín workshopu' },
      { label: 'Zaměření', value: 'Konkrétní triky, flow a bezpečný progres' },
    ],
    trainingFocus: ['tic-tac', 'kong vault', 'lazy vault', 'butterfly kick', 'macaco'],
  })),
];

export const parentPayments: ParentPayment[] = [
  { id: 'pay-course-1', title: 'Permanentka 10 vstupů · Vyškov', participantName: 'Eliška Nováková', amount: 1790, dueDate: '24. 4. 2026', paidAt: '24. 4. 2026', method: 'Stripe karta', status: 'paid' },
  { id: 'pay-camp-1', title: 'Letní tábor Vyškov', participantName: 'Eliška Nováková', amount: 3890, dueDate: '25. 4. 2026', paidAt: '25. 4. 2026', method: 'Stripe karta', status: 'paid' },
  { id: 'pay-course-2', title: 'Permanentka 10 vstupů · Prostějov', participantName: 'Alex Svoboda', amount: 1790, dueDate: '27. 4. 2026', paidAt: '27. 4. 2026', method: 'Stripe karta', status: 'paid' },
];

export const parentNotifications = [
  { id: 'note-1', text: 'Eliška dorazila na kroužek Vyškov · ZŠ Nádražní.', createdAt: '24. 4. 2026', method: '16:34' },
  { id: 'note-2', text: 'Alex dorazil na kroužek Prostějov · ZŠ Melantrichova.', createdAt: '27. 4. 2026', method: '10:06' },
];

export const parentDigitalPasses = [
  { id: 'pass-1', participantId: 'demo-child-1', title: 'Permanentka 10 vstupů · Vyškov', location: 'Vyškov · ZŠ Nádražní', usedEntries: 6, totalEntries: 10, nfcChipId: 'NFC-VYS-0142', lastScanAt: '24. 4. 2026 · 16:34' },
  { id: 'pass-2', participantId: 'demo-child-2', title: 'Permanentka 10 vstupů · Prostějov', location: 'Prostějov · ZŠ Melantrichova', usedEntries: 2, totalEntries: 10, nfcChipId: 'NFC-PV-0098', lastScanAt: '27. 4. 2026 · 10:06' },
];

export const parentAttendanceHistory = [
  { id: 'att-1', participantName: 'Eliška Nováková', date: '24. 4. 2026', location: 'Vyškov · ZŠ Nádražní', time: '16:34', method: 'NFC' },
  { id: 'att-2', participantName: 'Eliška Nováková', date: '17. 4. 2026', location: 'Vyškov · ZŠ Nádražní', time: '16:31', method: 'NFC' },
  { id: 'att-3', participantName: 'Alex Svoboda', date: '27. 4. 2026', location: 'Prostějov · ZŠ Melantrichova', time: '10:06', method: 'NFC' },
];

export const parentDocuments: ParentDocument[] = [
  { id: 'doc-course-gdpr', participantName: 'Eliška Nováková', activityTitle: 'Permanentka 10 vstupů · Vyškov', activityType: 'Krouzek', title: 'GDPR souhlas', status: 'signed', updatedAt: '24. 4. 2026' },
  { id: 'doc-course-health', participantName: 'Eliška Nováková', activityTitle: 'Permanentka 10 vstupů · Vyškov', activityType: 'Krouzek', title: 'Zdravotní informace', status: 'draft', updatedAt: 'Čeká na rodiče' },
  { id: 'doc-camp-gdpr', participantName: 'Eliška Nováková', activityTitle: 'Příměstský tábor Vyškov', activityType: 'Tabor', title: 'GDPR souhlas', status: 'signed', updatedAt: '25. 4. 2026' },
];

export const reviewableCoaches = [
  { id: 'coach-demo', name: 'Filip Trenér', locations: ['Vyškov · ZŠ Nádražní'] },
  { id: 'coach-marek', name: 'Marek Hlaváč', locations: ['Blansko · ZŠ Erbenova'] },
  { id: 'coach-anna', name: 'Anna Králová', locations: ['Brandýs · ZŠ Na Výsluní'] },
];

export const coachReviews = [
  { id: 'review-1', coachId: 'coach-demo', coachName: 'Filip Trenér', parentName: 'David Kropáč', participantName: 'Eliška Nováková', rating: 5, comment: 'Bezpečný přístup a dobrá komunikace po tréninku.', createdAt: '28. 4. 2026' },
];

export const adminCoachSummaries: AdminCoachSummary[] = [
  { id: 'coach-demo', name: 'Filip Trenér', email: 'filip@teamvys.cz', phone: '+420 605 324 417', bankAccount: '2902345671/2010', iban: 'CZ65 2010 0000 0029 0234 5671', status: 'Aktivni', locations: ['Vyskov · ZS Nadrazni', 'Vyskov · ZS Purkynova', 'Prostejov · ZS Melantrichova'], loggedHours: 3, baseAmount: 1500, approvedBonuses: 600, pendingBonuses: 0, nextPayout: '15. 5. 2026', lastAttendance: '24. 4. 2026', childrenLogged: 22, qrTricksApproved: 184, profilePhotoUrl: '/vys-logo-mark.png', stripeAccountId: 'acct_demo_filip' },
  { id: 'coach-marek', name: 'Marek Hlaváč', email: 'marek@teamvys.cz', phone: '+420 777 904 118', bankAccount: '2201849034/5500', iban: 'CZ28 5500 0000 0022 0184 9034', status: 'Aktivni', locations: ['Blansko · ZS Erbenova', 'Jesenik · Gymnazium Komenskeho'], loggedHours: 7.5, baseAmount: 3750, approvedBonuses: 1000, pendingBonuses: 0, nextPayout: '15. 5. 2026', lastAttendance: '29. 4. 2026', childrenLogged: 38, qrTricksApproved: 126, profilePhotoUrl: '/vys-logo-mark.png' },
  { id: 'coach-anna', name: 'Anna Králová', email: 'anna@teamvys.cz', phone: '+420 775 441 903', bankAccount: '2500441903/0800', iban: 'CZ40 0800 0000 0025 0044 1903', status: 'Aktivni', locations: ['Brandys · ZS Na Vysluni', 'Praha · Balkan'], loggedHours: 5, baseAmount: 2500, approvedBonuses: 300, pendingBonuses: 0, nextPayout: '15. 5. 2026', lastAttendance: '28. 4. 2026', childrenLogged: 24, qrTricksApproved: 97, profilePhotoUrl: '/vys-logo-mark.png' },
  { id: 'coach-tereza', name: 'Tereza Novotná', email: 'tereza@teamvys.cz', phone: '+420 733 210 665', bankAccount: '2107330665/2700', iban: 'CZ41 2700 0000 0021 0733 0665', status: 'Ceka na klic', locations: ['Vyskov · Orel jednota Vyskov', 'Veliny · Tabor Mlynek'], loggedHours: 0, baseAmount: 0, approvedBonuses: 0, pendingBonuses: 0, nextPayout: 'Po aktivaci', lastAttendance: 'Zatim netrenovala', childrenLogged: 0, qrTricksApproved: 0, profilePhotoUrl: '/vys-logo-mark.png' },
];

export const coachDppTemplateClauses = [
  'Trenér zajišťuje vedení parkourových lekcí, přípravu prostoru, evidenci docházky a bezpečné předání informací administrátorovi.',
  'Rozsah práce se řídí domluveným rozpisem lekcí a nepřekročí zákonný limit pro DPP v daném kalendářním roce.',
  'Odměna se počítá podle schválené hodinové sazby a potvrzené docházky v administraci TeamVYS.',
  'Trenér potvrzuje mlčenlivost o osobních údajích dětí, rodičů a interních provozních informacích.',
  'Digitální podpis trenéra a zástupce TeamVYS je považovaný za potvrzení vyplněných údajů a uložení dokumentu do evidence.',
];

export const adminCoachDppDocuments: AdminCoachDppDocument[] = [
  {
    id: 'dpp-coach-demo-2026',
    coachId: 'coach-demo',
    coachName: 'Filip Trenér',
    title: 'DPP 2026 · Filip Trenér',
    status: 'signed',
    validFrom: '1. 4. 2026',
    validTo: '31. 12. 2026',
    hourlyRate: 500,
    role: 'Trenér parkour kroužků',
    workplace: 'Vyškov · Prostějov',
    scope: 'Vedení pravidelných lekcí, evidence docházky a bezpečnostní dohled.',
    digitalEnvelopeId: 'DPP-VYS-2026-0001',
    signedAt: '1. 4. 2026 · 09:14',
    updatedAt: '1. 4. 2026',
    clauses: coachDppTemplateClauses,
  },
  {
    id: 'dpp-coach-marek-2026',
    coachId: 'coach-marek',
    coachName: 'Marek Hlaváč',
    title: 'DPP 2026 · Marek Hlaváč',
    status: 'sent',
    validFrom: '1. 4. 2026',
    validTo: '31. 12. 2026',
    hourlyRate: 500,
    role: 'Trenér parkour kroužků',
    workplace: 'Blansko · Jeseník',
    scope: 'Vedení lekcí, kontrola docházky a potvrzování QR triků.',
    digitalEnvelopeId: 'DPP-VYS-2026-0002',
    updatedAt: '28. 4. 2026',
    clauses: coachDppTemplateClauses,
  },
  {
    id: 'dpp-coach-anna-2026',
    coachId: 'coach-anna',
    coachName: 'Anna Králová',
    title: 'DPP 2026 · Anna Králová',
    status: 'draft',
    validFrom: '1. 5. 2026',
    validTo: '31. 12. 2026',
    hourlyRate: 500,
    role: 'Trenérka workshopů a kroužků',
    workplace: 'Brandýs · Praha',
    scope: 'Vedení workshopů, kroužků a kontrola digitálních ticketů.',
    updatedAt: '30. 4. 2026',
    clauses: coachDppTemplateClauses,
  },
  {
    id: 'dpp-coach-tereza-2026',
    coachId: 'coach-tereza',
    coachName: 'Tereza Novotná',
    title: 'DPP 2026 · Tereza Novotná',
    status: 'missing',
    validFrom: '1. 6. 2026',
    validTo: '31. 8. 2026',
    hourlyRate: 450,
    role: 'Asistentka příměstských táborů',
    workplace: 'Vyškov · Veliny',
    scope: 'Asistence u táborového programu, evidence příchodů a dohled u aktivit.',
    updatedAt: 'Čeká na vytvoření',
    clauses: coachDppTemplateClauses,
  },
];

export function requiredDocumentsForProduct(product: ParentProduct) {
  return requiredDocumentTemplates.filter((document) => document.requiredFor.includes(product.type));
}

export function trainersForProduct(product: ParentProduct): ParentProductTrainer[] {
  const normalizedPlace = normalizeLocation(product.place);

  return adminCoachSummaries
    .filter((coach) => coach.status === 'Aktivni' || coach.status === 'Ceka na klic')
    .filter((coach) => coach.locations.some((location) => {
      const normalizedLocation = normalizeLocation(location);
      return normalizedLocation === normalizedPlace || normalizedPlace.includes(normalizedLocation);
    }))
    .map((coach) => ({
      id: coach.id,
      name: coach.name,
      email: coach.email,
      phone: coach.phone,
      locations: coach.locations,
      qrTricksApproved: coach.qrTricksApproved,
      profilePhotoUrl: coach.profilePhotoUrl ?? '/vys-logo-mark.png',
    }));
}

function normalizeLocation(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/zs/g, 'zš')
    .replace(/tabor/g, 'tábor')
    .trim();
}

export const adminCoachAccessRequests = [
  { id: 'request-tereza-vyskov', name: 'Tereza Novotna', email: 'tereza@teamvys.cz', phone: '+420 733 210 665', requestedLocation: 'Vyskov · Orel jednota Vyskov', requestedAt: '30. 4. 2026 · 09:20', note: 'Chce pomahat u primestskych taboru a pozdeji prevzit pondelni skupinu.' },
  { id: 'request-daniel-brandys', name: 'Daniel Svetlik', email: 'daniel@teamvys.cz', phone: '+420 724 511 809', requestedLocation: 'Brandys · ZS Na Vysluni', requestedAt: '29. 4. 2026 · 18:42', note: 'Doporuceni od Marka, ceka na kontrolu dokumentu a vydani klice.' },
];

export const adminProductTemplates: AdminProductTemplate[] = [
  { type: 'Krouzek', title: 'Novy krouzek / permanentka', description: 'Pravidelny tydenni krouzek s NFC permanentkou a kapacitou skupiny.', defaults: [{ label: 'Kapacita', value: '25 deti' }, { label: 'Vstupy', value: '10 nebo 15' }, { label: 'Dokumenty', value: 'GDPR, souhlas, zdravi' }], checklist: ['Mesto a telocvicna', 'Den a cas', 'Trener', 'Cena', 'Kapacita'] },
  { type: 'Workshop', title: 'Jednorazovy workshop', description: 'Workshop s QR ticketem, mistem a platnosti ticketu.', defaults: [{ label: 'Kapacita', value: '40 ucastniku' }, { label: 'Ticket', value: 'QR po zaplaceni' }, { label: 'Platnost', value: 'Do dne po akci' }], checklist: ['Datum a cas', 'Misto', 'Cena', 'Platnost QR', 'Seznam triku'] },
  { type: 'Tabor', title: 'Primestsky tabor', description: 'Taborovy turnus s dokumenty, anamnezou a prvnim QR skenem u vstupu.', defaults: [{ label: 'Kapacita', value: '30 deti' }, { label: 'Dokumenty', value: 'GDPR, anamneza, bezinfekcnost' }, { label: 'Strava', value: 'Svaciny, obed, pitny rezim' }], checklist: ['Terminy', 'Adresa', 'Vek', 'Cena', 'Strava', 'Treneri'] },
];

export const adminAttendanceAdjustments = [
  { id: 'adjust-1', coachName: 'Filip Trener', sessionTitle: 'Vyskov · ZS Nadrazni', date: '30. 4. 2026', present: '12/14', durationHours: 1, amount: 500, reason: 'Doplneno administratorem podle prezencni listiny.' },
];

export const adminCoachAttendance = [
  { id: 'coach-att-1', coachName: 'Filip Trener', sessionTitle: 'Vyskov · ZS Nadrazni', date: '24. 4. 2026', present: '10/14', durationHours: 1, amount: 500, reason: 'Standardni zapis trenera.' },
  { id: 'coach-att-2', coachName: 'Marek Hlavac', sessionTitle: 'Blansko · ZS Erbenova', date: '29. 4. 2026', present: '13/15', durationHours: 1.5, amount: 750, reason: 'Standardni zapis trenera.' },
];

export const adminIssuedCoachKeys = [
  { id: 'key-1', code: 'VYS-MAREK-4821', coachName: 'Marek Hlavac', email: 'marek@teamvys.cz', phone: '+420 777 904 118', location: 'Blansko · ZS Erbenova', status: 'Vydan', createdAt: '21. 4. 2026', note: 'Vydano po overeni adminem.' },
];

export function adminActivityRows(products: ParentProduct[] = parentProducts): AdminActivityRow[] {
  return products.map((product, index) => {
    const registered = Math.min(product.capacityTotal, Math.max(1, Math.round(product.capacityTotal * (0.32 + (index % 4) * 0.13))));
    const visits = product.type === 'Krouzek' ? registered * (4 + (index % 3)) : product.type === 'Workshop' ? registered : registered * 5;
    const revenue = registered * product.price;
    const pendingRevenue = index % 3 === 0 ? Math.round(product.price * 0.7) : 0;

    return {
      id: product.id,
      type: product.type,
      title: product.title,
      place: product.place,
      capacityTotal: product.capacityTotal,
      registered,
      visits,
      revenue,
      pendingRevenue,
      documentsMissing: product.type === 'Workshop' ? 0 : index % 4,
    };
  });
}

export function adminPaymentRows() {
  return parentPayments.map((payment) => ({
    id: payment.id,
    participantName: payment.participantName,
    title: payment.title,
    amount: payment.amount,
    status: 'Zaplaceno',
    dueDate: payment.dueDate,
  }));
}

export function currency(value: number) {
  return `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
}

export function paymentStatusLabel(status: PaymentStatus) {
  if (status === 'paid') return 'Zaplaceno';
  if (status === 'overdue') return 'Nezaplaceno';
  return 'Nezaplaceno';
}

export function documentStatusLabel(status: DocumentStatus) {
  if (status === 'signed') return 'Podepsano';
  if (status === 'draft') return 'Rozpracovano';
  return 'Chybi';
}

export function activityLabel(type: ActivityType) {
  if (type === 'Krouzek') return 'Kroužek';
  if (type === 'Tabor') return 'Tábor';
  return 'Workshop';
}

export function attendancePercent(participant: ParentParticipant) {
  if (!participant.attendanceTotal) return 0;
  return Math.round((participant.attendanceDone / participant.attendanceTotal) * 100);
}

export function duePaymentsTotal() {
  return parentPayments.filter((payment) => payment.status !== 'paid').reduce((sum, payment) => sum + payment.amount, 0);
}

export function remainingEntries(pass: { usedEntries: number; totalEntries: number }) {
  return Math.max(pass.totalEntries - pass.usedEntries, 0);
}

export function documentStats() {
  const signed = parentDocuments.filter((document) => document.status === 'signed').length;
  const missing = parentDocuments.filter((document) => document.status !== 'signed').length;
  return { signed, missing, total: parentDocuments.length };
}