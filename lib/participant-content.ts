export type BraceletId = 'beige' | 'pink' | 'purple' | 'darkPurple' | 'black';

export type BraceletStage = {
  id: BraceletId;
  title: string;
  xpRequired: number;
  color: string;
};

export const braceletStages: BraceletStage[] = [
  { id: 'beige', title: 'Béžová', xpRequired: 0, color: '#D8C2A3' },
  { id: 'pink', title: 'Růžová', xpRequired: 600, color: '#F5A7C8' },
  { id: 'purple', title: 'Fialová', xpRequired: 1400, color: '#8A62D6' },
  { id: 'darkPurple', title: 'Tmavě fialová', xpRequired: 2400, color: '#4C2B86' },
  { id: 'black', title: 'Černá', xpRequired: 3800, color: '#16151A' },
];

export const participantProfile = {
  name: 'Demo účastník',
  level: 7,
  xp: 920,
  nextBraceletXp: 1400,
  bracelet: braceletStages[1],
};

export const purchases = [
  { type: 'Kroužek', title: 'Aktivní kroužek', status: 'Probíhá' },
  { type: 'Tábor', title: 'Letní tábor', status: 'Rezervováno' },
  { type: 'Workshop', title: 'Workshop', status: 'Zamčeno do přihlášení' },
];

export const notifications = [
  'Nová zpráva od trenéra.',
  'Blíží se další trénink.',
  'Po naskenování QR se odemčený cvik propíše do skill tree.',
];

export const leaderboard = [
  { rank: 1, name: 'Alex', xp: 1320 },
  { rank: 2, name: 'Nela', xp: 1180 },
  { rank: 3, name: participantProfile.name, xp: participantProfile.xp },
  { rank: 4, name: 'Tobi', xp: 860 },
];

export const rewardPath = [
  { xp: 250, title: 'Malá odměna', unlocked: true },
  { xp: 700, title: 'Bonus do profilu', unlocked: true },
  { xp: 1200, title: '20% sleva na další workshop', unlocked: false },
  { xp: 1800, title: 'Speciální badge', unlocked: false },
];

export const skillSlots = braceletStages.flatMap((stage, stageIndex) => [
  { id: `${stage.id}-a`, stage, order: stageIndex * 2 + 1, xp: stage.xpRequired + 120, unlocked: stageIndex === 0 || stageIndex === 1 },
  { id: `${stage.id}-b`, stage, order: stageIndex * 2 + 2, xp: stage.xpRequired + 260, unlocked: stageIndex === 0 },
]);
