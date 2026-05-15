export type RewardKind = 'xp' | 'yarn' | 'discount' | 'chest' | 'bonus';
export type RewardDiscountTarget = 'Kroužek' | 'Workshop';
export type RewardChestRarity = 'common' | 'rare' | 'epic';

export type MonthlyReward = {
  id: string;
  xp: number;
  title: string;
  detail: string;
  kind: RewardKind;
  accent: string;
  yarnBalls?: number;
  chestRarity?: RewardChestRarity;
  bonusXp?: number;
  discountPercent?: number;
  discountTarget?: RewardDiscountTarget;
  discountCode?: string;
};

export const monthlyRewardPath: MonthlyReward[] = [
  {
    id: 'warmup-xp',
    xp: 120,
    title: 'Startovní XP boost',
    detail: '+50 XP za pravidelný start měsíce.',
    kind: 'xp',
    bonusXp: 50,
    accent: '#14C8FF',
  },
  {
    id: 'common-crate',
    xp: 260,
    title: 'Obyčejná bedna',
    detail: 'Startovní šance na nového maskota.',
    kind: 'chest',
    chestRarity: 'common',
    accent: '#B89A6E',
  },
  {
    id: 'course-five',
    xp: 420,
    title: '5 % na kroužek',
    detail: 'Sleva na další permanentku pro rodiče.',
    kind: 'discount',
    discountPercent: 5,
    discountTarget: 'Kroužek',
    discountCode: 'ELISKA-KROUZEK-5',
    accent: '#44E0B7',
  },
  {
    id: 'yarn-cache',
    xp: 620,
    title: '120 klubíček',
    detail: 'Klubíčka na otevírání beden.',
    kind: 'yarn',
    yarnBalls: 120,
    accent: '#F12BB3',
  },
  {
    id: 'workshop-ten',
    xp: 850,
    title: '10 % na workshop',
    detail: 'Rodič uvidí kód u plateb.',
    kind: 'discount',
    discountPercent: 10,
    discountTarget: 'Workshop',
    discountCode: 'ELISKA-WORKSHOP-10',
    accent: '#FFB21A',
  },
  {
    id: 'rare-crate',
    xp: 1050,
    title: 'Vzácná bedna',
    detail: 'Lepší šance na růžové a fialové maskoty.',
    kind: 'chest',
    chestRarity: 'rare',
    accent: '#8B1DFF',
  },
  {
    id: 'course-twelve',
    xp: 1250,
    title: '12 % na kroužek',
    detail: 'Silnější sleva na další permanentku.',
    kind: 'discount',
    discountPercent: 12,
    discountTarget: 'Kroužek',
    discountCode: 'ELISKA-KROUZEK-12',
    accent: '#8B1DFF',
  },
  {
    id: 'big-yarn-cache',
    xp: 1500,
    title: '180 klubíček',
    detail: 'Větší zásoba na další bednu.',
    kind: 'yarn',
    yarnBalls: 180,
    accent: '#44E0B7',
  },
  {
    id: 'workshop-fifteen',
    xp: 1750,
    title: '15 % na workshop',
    detail: 'Měsíční kód na další workshop.',
    kind: 'discount',
    discountPercent: 15,
    discountTarget: 'Workshop',
    discountCode: 'ELISKA-WORKSHOP-15',
    accent: '#F12BB3',
  },
  {
    id: 'late-yarn-cache',
    xp: 2050,
    title: '240 klubíček',
    detail: 'Klubíčka na otevření další bedny.',
    kind: 'yarn',
    yarnBalls: 240,
    accent: '#FFB21A',
  },
  {
    id: 'course-twenty',
    xp: 2350,
    title: '20 % na kroužek',
    detail: 'Největší sleva v měsíční cestě.',
    kind: 'discount',
    discountPercent: 20,
    discountTarget: 'Kroužek',
    discountCode: 'ELISKA-KROUZEK-20',
    accent: '#8B1DFF',
  },
  {
    id: 'epic-crate',
    xp: 2600,
    title: 'Epická bedna',
    detail: 'Nejvyšší měsíční šance na tmavé a černé maskoty.',
    kind: 'chest',
    chestRarity: 'epic',
    bonusXp: 200,
    accent: '#FFB21A',
  },
];

export function rewardPathMonthLabel(now = new Date()) {
  return now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
}

export function nextRewardPathReset(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function daysUntilRewardPathReset(now = new Date()) {
  const reset = nextRewardPathReset(now);
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((reset.getTime() - now.getTime()) / dayMs));
}

export function rewardPathGoalXp() {
  return monthlyRewardPath[monthlyRewardPath.length - 1]?.xp ?? 0;
}

export function rewardPathProgress(xp: number) {
  const goal = rewardPathGoalXp();
  if (goal <= 0) return 0;
  return Math.min(Math.max(xp / goal, 0), 1);
}

export function unlockedMonthlyRewards(xp: number) {
  return monthlyRewardPath.filter((reward) => xp >= reward.xp);
}

export function earnedYarnBalls(xp: number) {
  return unlockedMonthlyRewards(xp).reduce((sum, reward) => sum + (reward.yarnBalls ?? 0), 0);
}

export function unlockedChestRewards(xp: number) {
  return unlockedMonthlyRewards(xp).filter((reward) => reward.kind === 'chest');
}
