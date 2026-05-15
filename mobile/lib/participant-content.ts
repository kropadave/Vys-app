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
  birthNumberMasked: string | null;
};

export const braceletStages: BraceletStage[] = [
  { id: 'beige', title: 'Béžová', xpRequired: 0, color: '#D8C2A3' },
  { id: 'pink', title: 'Růžová', xpRequired: 600, color: '#F5A7C8' },
  { id: 'purple', title: 'Fialová', xpRequired: 1400, color: '#8A62D6' },
  { id: 'darkPurple', title: 'Tmavě fialová', xpRequired: 2400, color: '#4C2B86' },
  { id: 'black', title: 'Černá', xpRequired: 3800, color: '#16151A' },
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
  nextBraceletXp: 1400,
  bracelet: braceletStages[1],
  birthNumberMasked: null,
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

export const skillTreeLevels: SkillTreeLevel[] = [
  {
    id: 'level-1',
    level: 1,
    title: 'Základy',
    stage: braceletStages[0],
    requiredTricksToUnlockNext: 7,
    tricks: [
      { id: 'safety-roll', title: 'Safety roll', discipline: 'Parkour', description: 'Bezpečný dopad přes rameno.', xp: 80 },
      { id: 'safety-vault', title: 'Safety vault', discipline: 'Parkour', description: 'Přeskok s oporou ruky a nohy.', xp: 150 },
      { id: 'precision-jump', title: 'Precision jump', discipline: 'Parkour', description: 'Skok snožmo na přesnost.', xp: 220 },
      { id: 'wall-run', title: 'Wall run', discipline: 'Parkour', description: 'Výběh na zeď a výlez nahoru.', xp: 290 },
      { id: 'cartwheel', title: 'Cartwheel', discipline: 'Tricking', description: 'Klasická hvězda.', xp: 360 },
      { id: 'roundhouse-kick', title: 'Roundhouse kick', discipline: 'Tricking', description: 'Základní obloukový kop.', xp: 430 },
      { id: 'backward-roll', title: 'Backward roll', discipline: 'Parkour', description: 'Kotoul vzad pro orientaci.', xp: 500 },
      { id: 'reverse-vault', title: 'Reverse vault', discipline: 'Parkour', description: 'Přeskok s otočkou o 360 stupňů.', xp: 570 },
    ],
  },
  {
    id: 'level-2',
    level: 2,
    title: 'Mírně pokročilý',
    stage: braceletStages[1],
    requiredTricksToUnlockNext: 7,
    tricks: [
      { id: 'tic-tac', title: 'Tic-tac', discipline: 'Parkour', description: 'Odraz od stěny do dálky nebo výšky.', xp: 680 },
      { id: 'kong-vault', title: 'Kong vault', discipline: 'Parkour', description: 'Přeskok opičák oběma rukama najednou.', xp: 760 },
      { id: 'lazy-vault', title: 'Lazy vault', discipline: 'Parkour', description: 'Přeskok překážky z úhlu.', xp: 840 },
      { id: 'butterfly-kick', title: 'Butterfly kick', discipline: 'Tricking', description: 'Horizontální skok s nohama do nůžek.', xp: 920 },
      { id: 'tornado-kick', title: 'Tornado kick', discipline: 'Tricking', description: 'Výskok s otočkou a kopem vnější nohou.', xp: 1000 },
      { id: 'macaco', title: 'Macaco', discipline: 'Tricking', description: 'Přemet vzad přes jednu ruku z dřepu.', xp: 1080 },
      { id: 'wall-spin', title: 'Wall spin', discipline: 'Parkour', description: 'Rotace o 360 stupňů dlaněmi o zeď.', xp: 1160 },
      { id: 'frontflip', title: 'Frontflip', discipline: 'Tricking/Parkour', description: 'Salto vpřed.', xp: 1240 },
    ],
  },
  {
    id: 'level-3',
    level: 3,
    title: 'Pokročilý',
    stage: braceletStages[2],
    requiredTricksToUnlockNext: 8,
    tricks: [
      { id: 'backflip', title: 'Backflip', discipline: 'Tricking', description: 'Salto vzad z místa.', xp: 1500 },
      { id: 'full-twist', title: 'Full twist', discipline: 'Tricking', description: 'Salto vzad s jednou celou vrutovou rotací 360 stupňů.', xp: 1580 },
      { id: 'sideflip', title: 'Sideflip', discipline: 'Parkour/Tricking', description: 'Salto stranou.', xp: 1660 },
      { id: 'wall-flip', title: 'Wall flip', discipline: 'Parkour', description: 'Salto vzad s odrazem od zdi.', xp: 1740 },
      { id: 'aerial', title: 'Aerial', discipline: 'Tricking', description: 'Hvězda bez rukou.', xp: 1820 },
      { id: '540-kick', title: '540 kick', discipline: 'Tricking', description: 'Kop s dopadem na kopající nohu.', xp: 1900 },
      { id: 'pop-360-kick', title: 'Pop 360 kick', discipline: 'Tricking', description: 'Kop z odrazu snožmo s rotací.', xp: 1980 },
      { id: 'scoot', title: 'Scoot', discipline: 'Tricking', description: 'Setupový prvek, odraz z ruky a nohy do švihu.', xp: 2060 },
      { id: 'dash-vault', title: 'Dash vault', discipline: 'Parkour', description: 'Přeskok nohama napřed.', xp: 2140 },
      { id: 'webster', title: 'Webster', discipline: 'Tricking/Parkour', description: 'Salto vpřed z jedné nohy.', xp: 2220 },
    ],
  },
  {
    id: 'level-4',
    level: 4,
    title: 'Expert',
    stage: braceletStages[3],
    requiredTricksToUnlockNext: 9,
    tricks: [
      { id: 'corkscrew', title: 'Corkscrew', discipline: 'Tricking', description: 'Salto vzad s vrutem z rozběhu a švihem nohy.', xp: 2500 },
      { id: 'scoot-full', title: 'Scoot Full', discipline: 'Tricking', description: 'Kombinace scootu a salta s vrutem.', xp: 2580 },
      { id: 'shuriken-twist', title: 'Shuriken twist', discipline: 'Tricking', description: 'B-twist, kde ve vzduchu proběhne kop shuriken.', xp: 2660 },
      { id: 'butterfly-twist', title: 'Butterfly twist', discipline: 'Tricking', description: 'B-kick s plnou rotací vrutem.', xp: 2740 },
      { id: 'raiz', title: 'Raiz', discipline: 'Tricking', description: 'Horizontální rotace těla se švihem nohou.', xp: 2820 },
      { id: 'gainer', title: 'Gainer', discipline: 'Parkour/Tricking', description: 'Salto vzad při pohybu vpřed.', xp: 2900 },
      { id: 'cheat-720-kick', title: 'Cheat 720 kick', discipline: 'Tricking', description: 'Rotace o 720 stupňů zakončená kopem.', xp: 2980 },
      { id: 'castaway', title: 'Castaway', discipline: 'Parkour', description: 'Salto vzad z odrazu rukama o překážku.', xp: 3060 },
      { id: 'double-kong', title: 'Double Kong', discipline: 'Parkour', description: 'Dlouhý skok se dvěma dotyky rukou o překážku.', xp: 3140 },
      { id: 'flashkick', title: 'Flashkick', discipline: 'Tricking', description: 'Salto vzad s kopem ve vzduchu.', xp: 3220 },
    ],
  },
  {
    id: 'level-5',
    level: 5,
    title: 'Master',
    stage: braceletStages[4],
    requiredTricksToUnlockNext: 10,
    tricks: [
      { id: 'double-full', title: 'Double Full', discipline: 'Tricking', description: 'Salto vzad se dvěma vruty.', xp: 3900 },
      { id: 'double-cork', title: 'Double Cork', discipline: 'Tricking', description: 'Cork se dvěma vruty.', xp: 4000 },
      { id: 'touchdown-raiz-tdr', title: 'Touchdown Raiz / TDR', discipline: 'Tricking', description: 'Raiz s dotykem ruky pro extrémní švih.', xp: 4100 },
      { id: 'double-b-twist', title: 'Double B-twist', discipline: 'Tricking', description: 'Butterfly twist se dvěma vruty.', xp: 4200 },
      { id: 'cheat-1080-kick', title: 'Cheat 1080 kick', discipline: 'Tricking', description: 'Tři plné rotace ve vzduchu s kopem.', xp: 4300 },
      { id: 'jackknife', title: 'Jackknife', discipline: 'Tricking', description: '540 kick s přidaným kopem druhou nohou ve vzduchu.', xp: 4400 },
      { id: 'snapuswipe', title: 'Snapuswipe', discipline: 'Tricking', description: '540 kick s horizontální rotací navíc.', xp: 4500 },
      { id: 'palm-flip', title: 'Palm flip', discipline: 'Parkour', description: 'Salto vzad pouze z odrazu dlaněmi o svislou zeď.', xp: 4600 },
      { id: 'double-backflip', title: 'Double Backflip', discipline: 'Tricking', description: 'Dvojité salto vzad.', xp: 4700 },
      { id: 'cartwheel-full', title: 'Cartwheel Full', discipline: 'Tricking', description: 'Hvězda následovaná okamžitým saltem s vrutem.', xp: 4800 },
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
