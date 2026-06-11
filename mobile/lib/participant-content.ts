import { monthlyRewardPath } from '@/lib/monthly-rewards';

export type BraceletId = 'beige' | 'pink' | 'purple' | 'darkPurple' | 'black';

export type BraceletStage = {
  id: BraceletId;
  title: string;
  xpRequired: number;
  color: string;
};

export type SkillDiscipline = 'Parkour' | 'Tricking' | 'Parkour/Tricking' | 'Tricking/Parkour';

export type SkillTreeLevel = {
  id: string;
  level: number;
  title: string;
  stage: BraceletStage;
  requiredTricksToUnlockNext: number;
  tricks: Array<{
    id: string;
    title: string;
    discipline: SkillDiscipline;
    description: string;
    xp: number;
  }>;
};

export type SkillTreeTrick = SkillTreeLevel['tricks'][number] & {
  level: number;
  levelTitle: string;
  stage: BraceletStage;
  order: number;
  unlocked: boolean;
};

export type ParticipantProfile = {
  id: string;
  name: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  homeCourse: string;
  nextTraining: string;
  level: number;
  xp: number;
  nextBraceletXp: number;
  bracelet: BraceletStage;
  claimCode: string | null;
  /** IDs of tricks the participant has explicitly completed via QR scan. */
  completedTrickIds: string[];
};

// Leveling thresholds are based on cumulative XP available in completed arenas.
// That means "next bracelet" requires the sum of all trick XP from previous levels.
const LEVEL_1_TOTAL_XP = 1880;
const LEVEL_2_TOTAL_XP = 5800;
const LEVEL_3_TOTAL_XP = 13050;
const LEVEL_4_TOTAL_XP = 24550;

const XP_TO_PINK = LEVEL_1_TOTAL_XP;
const XP_TO_PURPLE = XP_TO_PINK + LEVEL_2_TOTAL_XP;
const XP_TO_DARK_PURPLE = XP_TO_PURPLE + LEVEL_3_TOTAL_XP;
const XP_TO_BLACK = XP_TO_DARK_PURPLE + LEVEL_4_TOTAL_XP;

export const braceletStages: BraceletStage[] = [
  { id: 'beige',      title: 'Béžová',         xpRequired: 0,    color: '#D8C2A3' },
  { id: 'pink',       title: 'Růžová',         xpRequired: XP_TO_PINK,        color: '#F5A7C8' },
  { id: 'purple',     title: 'Fialová',        xpRequired: XP_TO_PURPLE,      color: '#8A62D6' },
  { id: 'darkPurple', title: 'Tmavě fialová',  xpRequired: XP_TO_DARK_PURPLE, color: '#4C2B86' },
  { id: 'black',      title: 'Černá',          xpRequired: XP_TO_BLACK,       color: '#16151A' },
];

export const participantProfile: ParticipantProfile = {
  // Sjednoceno s rodičovským portálem (linkedParticipants[0]) — stejná demo identita.
  id: 'demo-child-1',
  name: 'Eliška Nováková',
  parentName: 'David Kropáč',
  parentEmail: 'rodic@example.cz',
  parentPhone: '+420 605 324 417',
  homeCourse: 'Vyškov · ZŠ Nádražní',
  nextTraining: 'Středa 16:30',
  level: 7,
  xp: 920,
  nextBraceletXp: 1800,
  bracelet: braceletStages[2],
  claimCode: null,
  completedTrickIds: [],
};

export const purchases = [
  { type: 'Kroužek', title: 'Permanentka 10 vstupů', status: 'Aktivní' },
  { type: 'Tábor', title: 'Letní tábor', status: 'Rezervováno' },
  { type: 'Workshop', title: 'Workshop', status: 'Zamčeno do přihlášení' },
];

export const notifications = [
  'Nová zpráva od trenéra.',
  'Blíží se další trénink.',
  'Po načtení NFC čipu se z digitální permanentky odečte jeden vstup.',
  'Po naskenování QR se odemčený cvik propíše do skill tree.',
];

export const leaderboard = [
  { rank: 1, name: 'Alex', xp: 1320, mascotId: 'beige-wave' },
  { rank: 2, name: 'Nela', xp: 1180, mascotId: 'pink-jump' },
  { rank: 3, name: participantProfile.name, xp: participantProfile.xp, mascotId: 'beige-sit' },
  { rank: 4, name: 'Tobi', xp: 860, mascotId: 'purple-cool' },
];

export function braceletForXp(xp: number, fallbackTitle?: string | null, fallbackColor?: string | null) {
  const byXp = braceletStages.reduce((current, stage) => (xp >= stage.xpRequired ? stage : current), braceletStages[0]);
  if (!fallbackTitle) return byXp;

  const byTitle = braceletStages.find((stage) => stage.title === fallbackTitle);
  if (!byTitle) return byXp;

  return fallbackColor ? { ...byTitle, color: fallbackColor } : byTitle;
}

export function nextBraceletXpForXp(xp: number, fallback?: number | null) {
  const next = braceletStages.find((stage) => stage.xpRequired > xp);
  if (next) return next.xpRequired;
  return Math.max(fallback ?? xp, xp);
}

export function rewardPathForXp(xp: number) {
  return monthlyRewardPath.map((reward) => ({
    ...reward,
    unlocked: xp >= reward.xp,
  }));
}

export function leaderboardForParticipant(profile: ParticipantProfile) {
  const withoutCurrent = leaderboard.filter((item) => item.name !== participantProfile.name && item.name !== profile.name);
  return [
    ...withoutCurrent,
    { rank: 0, name: profile.name, xp: profile.xp, mascotId: 'beige-sit' },
  ]
    .sort((left, right) => right.xp - left.xp)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export const rewardPath = rewardPathForXp(participantProfile.xp);

export const legacyRewardPath = monthlyRewardPath.map((reward) => ({
  ...reward,
  unlocked: participantProfile.xp >= reward.xp,
}));

export type ArenaStage = {
  id: string;
  level: number;
  title: string;
  /** Cumulative XP needed to unlock the arena. */
  requiredXp: number;
};

// Cesta arén — druhá postupová cesta vedle náramků. 10 arén, prahy jsou
// navržené tak, aby poslední aréna zhruba odpovídala černému náramku.
// Obrázky arén 6–10 se doplní později (zatím se cyklí stávající podklady).
export const arenaPath: ArenaStage[] = [
  { id: 'arena-1', level: 1, title: 'Dvorek', requiredXp: 0 },
  { id: 'arena-2', level: 2, title: 'Park', requiredXp: 1500 },
  { id: 'arena-3', level: 3, title: 'Hřiště', requiredXp: 4000 },
  { id: 'arena-4', level: 4, title: 'Tělocvična', requiredXp: 7500 },
  { id: 'arena-5', level: 5, title: 'Skatepark', requiredXp: 12000 },
  { id: 'arena-6', level: 6, title: 'Střechy', requiredXp: 17500 },
  { id: 'arena-7', level: 7, title: 'Věž', requiredXp: 24000 },
  { id: 'arena-8', level: 8, title: 'Noční město', requiredXp: 31500 },
  { id: 'arena-9', level: 9, title: 'Citadela', requiredXp: 40000 },
  { id: 'arena-10', level: 10, title: 'Vrchol', requiredXp: 49500 },
];

export const skillTreeLevels: SkillTreeLevel[] = [
  {
    id: 'level-1',
    level: 1,
    title: 'Základy',
    stage: braceletStages[0],
    requiredTricksToUnlockNext: 6,
    tricks: [
      { id: 'safety-roll',      title: 'Safety roll',      discipline: 'Parkour',           description: 'Bezpečný dopad přes rameno.',                    xp: 50  },
      { id: 'safety-vault',     title: 'Safety vault',     discipline: 'Parkour',           description: 'Přeskok s oporou ruky a nohy.',                  xp: 100 },
      { id: 'precision-jump',   title: 'Precision jump',   discipline: 'Parkour',           description: 'Skok snožmo na přesnost.',                       xp: 150 },
      { id: 'wall-run',         title: 'Wall run',         discipline: 'Parkour',           description: 'Výběh na zeď a výlez nahoru.',                   xp: 200 },
      { id: 'cartwheel',        title: 'Cartwheel',        discipline: 'Tricking',          description: 'Klasická hvězda.',                               xp: 250 },
      { id: 'roundhouse-kick',  title: 'Roundhouse kick',  discipline: 'Tricking',          description: 'Základní obloukový kop.',                        xp: 300 },
      { id: 'backward-roll',    title: 'Backward roll',    discipline: 'Parkour',           description: 'Kotoul vzad pro orientaci.',                     xp: 380 },
      { id: 'reverse-vault',    title: 'Reverse vault',    discipline: 'Parkour',           description: 'Přeskok s otočkou o 360 stupňů.',               xp: 450 },
    ],
  },
  {
    id: 'level-2',
    level: 2,
    title: 'Mírně pokročilý',
    stage: braceletStages[1],
    requiredTricksToUnlockNext: 6,
    tricks: [
      { id: 'tic-tac',          title: 'Tic-tac',          discipline: 'Parkour',           description: 'Odraz od stěny do dálky nebo výšky.',            xp: 500 },
      { id: 'kong-vault',       title: 'Kong vault',       discipline: 'Parkour',           description: 'Přeskok opičák oběma rukama najednou.',          xp: 560 },
      { id: 'lazy-vault',       title: 'Lazy vault',       discipline: 'Parkour',           description: 'Přeskok překážky z úhlu.',                       xp: 620 },
      { id: 'butterfly-kick',   title: 'Butterfly kick',   discipline: 'Tricking',          description: 'Horizontální skok s nohama do nůžek.',           xp: 680 },
      { id: 'tornado-kick',     title: 'Tornado kick',     discipline: 'Tricking',          description: 'Výskok s otočkou a kopem vnější nohou.',         xp: 740 },
      { id: 'macaco',           title: 'Macaco',           discipline: 'Tricking',          description: 'Přemet vzad přes jednu ruku z dřepu.',           xp: 800 },
      { id: 'wall-spin',        title: 'Wall spin',        discipline: 'Parkour',           description: 'Rotace o 360 stupňů dlaněmi o zeď.',             xp: 900 },
      { id: 'frontflip',        title: 'Frontflip',        discipline: 'Tricking/Parkour',  description: 'Salto vpřed.',                                   xp: 1000 },
    ],
  },
  {
    id: 'level-3',
    level: 3,
    title: 'Pokročilý',
    stage: braceletStages[2],
    requiredTricksToUnlockNext: 6,
    tricks: [
      { id: 'backflip',         title: 'Backflip',         discipline: 'Tricking',          description: 'Salto vzad z místa.',                            xp: 1050 },
      { id: 'full-twist',       title: 'Full twist',       discipline: 'Tricking',          description: 'Salto vzad s celou vrutovou rotací 360°.',       xp: 1200 },
      { id: 'sideflip',         title: 'Sideflip',         discipline: 'Parkour/Tricking',  description: 'Salto stranou.',                                 xp: 1350 },
      { id: 'wall-flip',        title: 'Wall flip',        discipline: 'Parkour',           description: 'Salto vzad s odrazem od zdi.',                   xp: 1500 },
      { id: 'aerial',           title: 'Aerial',           discipline: 'Tricking',          description: 'Hvězda bez rukou.',                              xp: 1650 },
      { id: '540-kick',         title: '540 kick',         discipline: 'Tricking',          description: 'Kop s dopadem na kopající nohu.',                xp: 1800 },
      { id: 'dash-vault',       title: 'Dash vault',       discipline: 'Parkour',           description: 'Přeskok nohama napřed.',                         xp: 2100 },
      { id: 'webster',          title: 'Webster',          discipline: 'Tricking/Parkour',  description: 'Salto vpřed z jedné nohy.',                      xp: 2400 },
    ],
  },
  {
    id: 'level-4',
    level: 4,
    title: 'Expert',
    stage: braceletStages[3],
    requiredTricksToUnlockNext: 6,
    tricks: [
      { id: 'corkscrew',        title: 'Corkscrew',        discipline: 'Tricking',          description: 'Salto vzad s vrutem z rozběhu a švihem nohy.',   xp: 2500 },
      { id: 'shuriken-twist',   title: 'Shuriken twist',   discipline: 'Tricking',          description: 'B-twist, kde ve vzduchu proběhne kop shuriken.',  xp: 2700 },
      { id: 'butterfly-twist',  title: 'Butterfly twist',  discipline: 'Tricking',          description: 'B-kick s plnou rotací vrutem.',                  xp: 2900 },
      { id: 'raiz',             title: 'Raiz',             discipline: 'Tricking',          description: 'Horizontální rotace těla se švihem nohou.',      xp: 3050 },
      { id: 'gainer',           title: 'Gainer',           discipline: 'Parkour/Tricking',  description: 'Salto vzad při pohybu vpřed.',                   xp: 3150 },
      { id: 'cheat-720-kick',   title: 'Cheat 720 kick',   discipline: 'Tricking',          description: 'Rotace o 720 stupňů zakončená kopem.',           xp: 3250 },
      { id: 'double-kong',      title: 'Double Kong',      discipline: 'Parkour',           description: 'Dlouhý skok se dvěma dotyky rukou o překážku.',   xp: 3400 },
      { id: 'flashkick',        title: 'Flashkick',        discipline: 'Tricking',          description: 'Salto vzad s kopem ve vzduchu.',                 xp: 3600 },
    ],
  },
  {
    id: 'level-5',
    level: 5,
    title: 'Master',
    stage: braceletStages[4],
    requiredTricksToUnlockNext: 10,
    tricks: [
      { id: 'double-full',        title: 'Double Full',          discipline: 'Tricking', description: 'Salto vzad se dvěma vruty.',                                   xp: 3700 },
      { id: 'double-cork',        title: 'Double Cork',          discipline: 'Tricking', description: 'Cork se dvěma vruty.',                                          xp: 3900 },
      { id: 'touchdown-raiz-tdr', title: 'Touchdown Raiz / TDR', discipline: 'Tricking', description: 'Raiz s dotykem ruky pro extrémní švih.',                        xp: 4100 },
      { id: 'double-b-twist',     title: 'Double B-twist',       discipline: 'Tricking', description: 'Butterfly twist se dvěma vruty.',                               xp: 4300 },
      { id: 'cheat-1080-kick',    title: 'Cheat 1080 kick',      discipline: 'Tricking', description: 'Tři plné rotace ve vzduchu s kopem.',                          xp: 4500 },
      { id: 'jackknife',          title: 'Jackknife',            discipline: 'Tricking', description: '540 kick s přidaným kopem druhou nohou ve vzduchu.',            xp: 4700 },
      { id: 'snapuswipe',         title: 'Snapuswipe',           discipline: 'Tricking', description: '540 kick s horizontální rotací navíc.',                         xp: 4900 },
      { id: 'palm-flip',          title: 'Palm flip',            discipline: 'Parkour',  description: 'Salto vzad pouze z odrazu dlaněmi o svislou zeď.',               xp: 5100 },
      { id: 'double-backflip',    title: 'Double Backflip',      discipline: 'Tricking', description: 'Dvojité salto vzad.',                                           xp: 5300 },
      { id: 'cartwheel-full',     title: 'Cartwheel Full',       discipline: 'Tricking', description: 'Hvězda následovaná okamžitým saltem s vrutem.',                 xp: 5500 },
    ],
  },
];

export const skillTreeTricks: SkillTreeTrick[] = skillTreeLevels.flatMap((level) =>
  level.tricks.map((trick, index) => ({
    ...trick,
    level: level.level,
    levelTitle: level.title,
    stage: level.stage,
    order: index + 1,
    unlocked: participantProfile.xp >= trick.xp,
  }))
);

export const skillSlots = skillTreeTricks;
