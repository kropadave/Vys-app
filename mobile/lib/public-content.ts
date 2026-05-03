export type Course = {
  city: string;
  venue: string;
  day: string;
  from: string;
  to: string;
  price: string;
};

export type Camp = {
  place: string;
  venue: string;
  season: string;
  price: string;
};

export const courses: Course[] = [
  { city: 'Blansko', venue: 'ZŠ Erbenova', day: 'Úterý', from: '17:30', to: '18:30', price: 'od 1790 Kč' },
  { city: 'Brandýs nad Labem', venue: 'ZŠ Na Výsluní', day: 'Úterý / Čtvrtek', from: '17:00', to: '18:00', price: 'od 1790 Kč' },
  { city: 'Jeseník', venue: 'Gymnázium Komenského', day: 'Pátek', from: '18:00', to: '19:00', price: 'od 1790 Kč' },
  { city: 'Vyškov', venue: 'ZŠ Nádražní', day: 'Středa', from: '16:30', to: '17:30', price: 'od 1790 Kč' },
  { city: 'Vyškov', venue: 'ZŠ Purkyňova', day: 'Pondělí', from: '15:30', to: '16:30', price: 'od 1790 Kč' },
];

export const camps: Camp[] = [
  { place: 'Veliny', venue: 'Tábor Mlýnek', season: 'Veliny 2025/2026', price: 'Turnusy od 3300 Kč' },
  { place: 'Vyškov', venue: 'Orel jednota Vyškov', season: 'Vyškov 2025/2026', price: 'Turnusy od 3890 Kč' },
];

export const campIncludes = [
  'Obědy & svačiny po celý den, zdravá a vydatná strava i pitný režim.',
  'Designové tričko z nové letní kolekce.',
  'Certifikovaní trenéři a animátoři s nadšením pro práci s dětmi.',
  'Bohatý program: trénink, hry, překážky a kreativní výzvy.',
];

export const campSchedule = [
  { time: '08:00 - 09:00', title: 'Příchod & rozcvička', text: 'Sraz, zahřátí a příprava na den.' },
  { time: '09:00 - 12:00', title: 'Dopolední trénink', text: 'Nácvik prvků, hry a překážková dráha.' },
  { time: '12:00 - 13:30', title: 'Oběd & polední klid', text: 'Načerpání energie a odpočinek.' },
  { time: '13:30 - 16:00', title: 'Odpolední akce', text: 'Soutěže, venkovní aktivity a vyzvednutí.' },
];

export const aboutText = 'Jsme komunita nadšenců do pohybu. Učíme parkour, pořádáme tábory a tvoříme zážitky pro děti i dospělé.';

export const contacts = {
  phone: '605 324 417',
  email: 'info@teamvys.cz',
  ico: '17583241',
  bank: '3141309013/3030',
  social: ['Instagram', 'YouTube', 'Facebook', 'WhatsApp'],
};
