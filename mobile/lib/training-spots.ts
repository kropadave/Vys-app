// Hardcoded verified training spots — also seeded to Supabase via migration.
export type TrainingSpot = {
  id: string;
  name: string;
  description: string | null;
  city: string;
  address: string | null;
  lat: number;
  lng: number;
  website: string | null;
  entry_fee: string | null;
  tags: string[];
  is_verified: boolean;
  added_by: string | null;
  created_at: string;
};

export const HARDCODED_SPOTS: TrainingSpot[] = [
  // ─── PRAHA ─────────────────────────────────────────────────────────────────
  {
    id: 'hc-01',
    name: 'SK Hradčany',
    description:
      'Gymnastická tělocvična vybavená nářadím pro mužskou i ženskou sportovní gymnastiku, molitanovou jámou i trampolínou, vhodná pro parkour i freerun, s možností samostatného tréninku.',
    city: 'Praha',
    address: 'Praha 6 – Dejvice',
    lat: 50.0877,
    lng: 14.4000,
    website: 'skhradcany.cz',
    entry_fee: 'Vstup 200 Kč + 50 Kč za každou další půlhodinu',
    tags: ['gymnastics', 'parkour', 'trampoline', 'foam-pit'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'hc-02',
    name: 'In Motion Academy Praha',
    description:
      'Volné tréninky bez instruktora, otevřené dětem i dospělým. Parkourové překážky, molitanová jáma, hrazdy.',
    city: 'Praha',
    address: 'Na Jarově, Praha 3',
    lat: 50.0840,
    lng: 14.4625,
    website: 'imacademy.cz',
    entry_fee: null,
    tags: ['parkour', 'foam-pit'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'hc-03',
    name: 'Jungle Sport Park Letňany',
    description:
      'Parkourová zóna, airtrack, trampolína, jáma, hrazda, gymnastický koberec, s „pohybovým plavčíkem" pro veřejnost.',
    city: 'Praha',
    address: 'Letňany, Praha 18',
    lat: 50.1215,
    lng: 14.5250,
    website: 'jungleletnany.cz',
    entry_fee: null,
    tags: ['parkour', 'trampoline', 'foam-pit'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'hc-04',
    name: 'Jojo Gym',
    description:
      '3 plně vybavené sportovní haly, gymnastika, parkour, tricking, trampolíny.',
    city: 'Praha',
    address: 'Praha-západ, u Berounky',
    lat: 49.9350,
    lng: 14.2100,
    website: 'kudyznudy.cz',
    entry_fee: null,
    tags: ['gymnastics', 'parkour', 'tricking', 'trampoline'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── BRNO ──────────────────────────────────────────────────────────────────
  {
    id: 'hc-05',
    name: 'In Motion Academy Brno',
    description:
      'Volné tréninky bez instruktora, parkourové zdi, tyče, gymnastický koberec, molitanová jáma.',
    city: 'Brno',
    address: 'Vídeňská 297/99',
    lat: 49.1814,
    lng: 16.6111,
    website: 'imacademy.cz',
    entry_fee: null,
    tags: ['parkour', 'foam-pit', 'gymnastics'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'hc-06',
    name: 'TJ Sokol Brno I',
    description:
      'Otevřený trénink ve čtvrtek v gymnastické tělocvičně, probíhá individuálně bez trenéra. Taky se tu koná parkour (inBalance kroužky).',
    city: 'Brno',
    address: 'Kounicova 20/22',
    lat: 49.2004,
    lng: 16.6056,
    website: 'cviceni.tjsokolbrno1.cz',
    entry_fee: 'Vstup 150 Kč',
    tags: ['gymnastics', 'parkour'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'hc-07',
    name: 'Jump Academy Brno',
    description:
      'Multisportovní komplex s parkourovými kroužky a trampolínami.',
    city: 'Brno',
    address: 'Brno',
    lat: 49.2100,
    lng: 16.6200,
    website: 'jumpacademy.cz',
    entry_fee: null,
    tags: ['parkour', 'trampoline'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── OSTRAVA ───────────────────────────────────────────────────────────────
  {
    id: 'hc-08',
    name: 'UM Park / UM Parkour Park',
    description:
      'Nově otevřený v květnu 2025, přes 2000 m², trampolíny, parkourové překážky, foam pit. Volné vstupy i kroužky.',
    city: 'Ostrava',
    address: 'Lihovarská, Ostrava-Radvanice',
    lat: 49.7821,
    lng: 18.3101,
    website: 'umparkourpark.cz',
    entry_fee: null,
    tags: ['parkour', 'trampoline', 'foam-pit'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'hc-09',
    name: 'SAREZA – Parkour aréna',
    description:
      '600 m² s překážkami stavebnicového systému, stěnové a trubkové prvky.',
    city: 'Ostrava',
    address: 'Areál U Cementárny',
    lat: 49.7999,
    lng: 18.2544,
    website: 'sareza.cz',
    entry_fee: null,
    tags: ['parkour'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── PLZEŇ ─────────────────────────────────────────────────────────────────
  {
    id: 'hc-10',
    name: 'In Motion Academy Plzeň',
    description:
      'Volné tréninky bez instruktora, stejný formát jako Praha/Brno.',
    city: 'Plzeň',
    address: 'Plzeň',
    lat: 49.7478,
    lng: 13.3773,
    website: 'imacademy.cz',
    entry_fee: null,
    tags: ['parkour', 'foam-pit'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── KLADNO ────────────────────────────────────────────────────────────────
  {
    id: 'hc-11',
    name: 'In Motion Academy Kladno',
    description: 'Volné tréninky a kroužky.',
    city: 'Kladno',
    address: 'Kladno',
    lat: 50.1440,
    lng: 14.1033,
    website: 'imacademy.cz',
    entry_fee: null,
    tags: ['parkour', 'foam-pit'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── FRÝDEK-MÍSTEK ─────────────────────────────────────────────────────────
  {
    id: 'hc-12',
    name: 'Improve Yourself – Parkourová hala FM',
    description:
      'Parkourová hala s kroužky, volnými tréninky pro veřejnost, workshopy.',
    city: 'Frýdek-Místek',
    address: 'Křižíkova 1774',
    lat: 49.6830,
    lng: 18.3643,
    website: 'parkourhala.cz',
    entry_fee: null,
    tags: ['parkour', 'freerun'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── JIHLAVA ───────────────────────────────────────────────────────────────
  {
    id: 'hc-13',
    name: 'SpaceTown',
    description:
      'První parkourové/trampolínové centrum na Vysočině. Trampolínová zóna, molitanová jáma, gymnastická podlaha, simulace parkourového města, workout zóna. Každou sobotu otevřeno pro veřejnost 10:00–16:00.',
    city: 'Jihlava',
    address: 'Jihlava',
    lat: 49.3961,
    lng: 15.5858,
    website: 'spacetown.cz',
    entry_fee: null,
    tags: ['parkour', 'trampoline', 'foam-pit', 'workout'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── ZLÍN ──────────────────────────────────────────────────────────────────
  {
    id: 'hc-14',
    name: 'Gymnastika Zlín',
    description: 'Gymnastická tělocvična s parkourovými kurzy a workshopy.',
    city: 'Zlín',
    address: 'Zlín',
    lat: 49.2204,
    lng: 17.6645,
    website: 'gymnastikazlin.cz',
    entry_fee: null,
    tags: ['gymnastics', 'parkour'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── ČESKÉ BUDĚJOVICE ──────────────────────────────────────────────────────
  {
    id: 'hc-15',
    name: 'ZOHIR parkour kroužky',
    description:
      'Tréninky v tělocvičnách, spíše kroužky než volný vstup.',
    city: 'České Budějovice',
    address: 'České Budějovice',
    lat: 48.9745,
    lng: 14.4741,
    website: 'zohir.cz',
    entry_fee: null,
    tags: ['parkour'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },

  // ─── OLOMOUC ───────────────────────────────────────────────────────────────
  {
    id: 'hc-16',
    name: 'Jump Academy / ZOHIR Olomouc',
    description:
      'Parkourové kroužky v místních tělocvičnách. Samostatná parkourová hala s volným vstupem zatím chybí.',
    city: 'Olomouc',
    address: 'Olomouc',
    lat: 49.5938,
    lng: 17.2509,
    website: 'zohir.cz',
    entry_fee: null,
    tags: ['parkour'],
    is_verified: true,
    added_by: null,
    created_at: '2025-01-01T00:00:00Z',
  },
];
