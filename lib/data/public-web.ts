import { KROUZKY } from '@/lib/data/mock';

export const PUBLIC_KROUZKY = KROUZKY;

export const PUBLIC_CAMPS = [
  {
    id: 'vyskov-orel-2026',
    city: 'Vyškov',
    venue: 'Orel jednota Vyškov',
    season: '2025/2026',
    priceFrom: 3890,
    description: 'Příměstský tábor ve sportovním areálu Orel. Tělocvična, venkovní plochy a celodenní program.',
    url: 'https://www.teamvys.cz/tabory/4fa68247-02ff-4184-aa22-e459d26cb056',
  },
  {
    id: 'veliny-mlynek-2026',
    city: 'Veliny',
    venue: 'Tábor Mlýnek Veliny',
    season: '2025/2026',
    priceFrom: 3300,
    description: 'Letní mix pohybu, her a komunity v areálu s hřištěm a rybníkem.',
    url: 'https://www.teamvys.cz/tabory/0d831160-f45f-4bfa-9428-2131135789d0',
  },
];

export const CAMP_INCLUDES = [
  'Obědy, svačiny a pitný režim',
  'Designové tričko z letní kolekce',
  'Certifikovaní trenéři a animátoři',
  'Bohatý program: trénink, hry, překážky, výzvy',
];

export const CAMP_DAY = [
  { time: '08:00–09:00', title: 'Příchod & rozcvička', body: 'Sraz, zahřátí a příprava na den.' },
  { time: '09:00–12:00', title: 'Dopolední trénink', body: 'Nácvik prvků, hry a překážková dráha.' },
  { time: '12:00–13:30', title: 'Oběd & klid', body: 'Načerpání energie a odpočinek.' },
  { time: '13:30–16:00', title: 'Odpolední akce', body: 'Soutěže, venkovní aktivity a vyzvednutí.' },
];

export const PUBLIC_WORKSHOPS = [
  {
    id: 'parkour-fundamentals',
    tier: 'Tier 1',
    title: 'Parkour fundamentals',
    body: 'Základy bezpečného parkour pohybu: pády, přeskoky a přelézání.',
    price: 790,
    locked: false,
    requirement: 'Odemčeno',
    url: 'https://www.teamvys.cz/workshopy/parkour-fundamentals',
  },
  {
    id: 'tricking-intro',
    tier: 'Tier 1',
    title: 'Tricking intro',
    body: 'Úvod do martial arts trickingu: kopy, rotace a základní akrobacie.',
    price: 790,
    locked: false,
    requirement: 'Odemčeno',
    url: 'https://www.teamvys.cz/workshopy/tricking-intro',
  },
  {
    id: 'wall-mastery',
    tier: 'Tier 2',
    title: 'Wall mastery',
    body: 'Pokročilé techniky práce se zdí: wall flip, wall spin a dynamické combo.',
    price: 790,
    locked: true,
    requirement: 'Požadavek: LVL 3',
    url: 'https://www.teamvys.cz/workshopy',
  },
  {
    id: 'flip-foundations',
    tier: 'Tier 2',
    title: 'Flip foundations',
    body: 'Backflip, frontflip, sideflip a gainer: naučíme tě letět bezpečně.',
    price: 790,
    locked: true,
    requirement: 'Požadavek: LVL 3',
    url: 'https://www.teamvys.cz/workshopy',
  },
  {
    id: 'flow-master',
    tier: 'Tier 3',
    title: 'Flow master',
    body: 'Kreativní linie, double kongy a plynulé kombinace pro freestyle parkour.',
    price: 790,
    locked: true,
    requirement: 'Požadavek: LVL 5',
    url: 'https://www.teamvys.cz/workshopy',
  },
  {
    id: 'combo-king',
    tier: 'Tier 3',
    title: 'Combo king',
    body: 'B-Twist, Cork, Cheat 900 a ultimátní tricking combo workshop.',
    price: 790,
    locked: true,
    requirement: 'Požadavek: LVL 6',
    url: 'https://www.teamvys.cz/workshopy',
  },
];

export const PUBLIC_CONTACT = {
  email: 'info@teamvys.cz',
  phone: '605 324 417',
  ico: '17583241',
  bank: '3141309013/3030',
  instagram: 'https://instagram.com/teamvys',
  youtube: 'https://youtube.com/@teamvys',
  facebook: 'https://facebook.com/teamvys',
  whatsapp: 'https://chat.whatsapp.com/DiwJtXsZdHJEH57t6XF95L',
};
