export type RewardActivityType = 'Krouzek' | 'Workshop';
export type RewardKind = 'xp' | 'badge' | 'discount' | 'bonus';

export type MonthlyReward = {
  id: string;
  xp: number;
  title: string;
  detail: string;
  kind: RewardKind;
  accent: string;
  badge?: string;
  bonusXp?: number;
  discountPercent?: number;
  discountTarget?: RewardActivityType;
  discountCode?: string;
};

export type RewardParticipant = {
  id: string;
  firstName: string;
  lastName: string;
  xp: number;
};

export type RewardDiscountCode = {
  id: string;
  rewardId: string;
  participantId: string;
  participantName: string;
  code: string;
  title: string;
  detail: string;
  percent: number;
  appliesTo: RewardActivityType;
  accent: string;
  xp: number;
};

export const USED_REWARD_CODES_STORAGE_KEY = 'teamvys.usedRewardDiscountCodes';

export const monthlyRewardPath: MonthlyReward[] = [
  { id: 'warmup-xp', xp: 120, title: 'Startovní XP boost', detail: '+50 XP za pravidelný start měsíce.', kind: 'xp', bonusXp: 50, accent: '#14C8FF' },
  { id: 'brave-badge', xp: 260, title: 'Badge Odvaha', detail: 'První měsíční badge do profilu.', kind: 'badge', badge: 'Odvaha', accent: '#8B1DFF' },
  { id: 'course-five', xp: 420, title: '5 % na kroužek', detail: 'Sleva na další permanentku pro rodiče.', kind: 'discount', discountPercent: 5, discountTarget: 'Krouzek', discountCode: 'ELISKA-KROUZEK-5', accent: '#44E0B7' },
  { id: 'flow-badge', xp: 620, title: 'Badge Flow', detail: 'Za plynulost a hezký pohyb.', kind: 'badge', badge: 'Flow', accent: '#F12BB3' },
  { id: 'workshop-ten', xp: 850, title: '10 % na workshop', detail: 'Rodič uvidí kód u plateb.', kind: 'discount', discountPercent: 10, discountTarget: 'Workshop', discountCode: 'ELISKA-WORKSHOP-10', accent: '#FFB21A' },
  { id: 'team-badge', xp: 1050, title: 'Badge Týmovost', detail: 'Za pomoc parťákům na tréninku.', kind: 'badge', badge: 'Týmovost', accent: '#14C8FF' },
  { id: 'course-twelve', xp: 1250, title: '12 % na kroužek', detail: 'Silnější sleva na další permanentku.', kind: 'discount', discountPercent: 12, discountTarget: 'Krouzek', discountCode: 'ELISKA-KROUZEK-12', accent: '#8B1DFF' },
  { id: 'fair-play-badge', xp: 1500, title: 'Badge Fair play', detail: 'Za respekt, bezpečnost a podporu ostatních.', kind: 'badge', badge: 'Fair play', accent: '#44E0B7' },
  { id: 'workshop-fifteen', xp: 1750, title: '15 % na workshop', detail: 'Měsíční kód na další workshop.', kind: 'discount', discountPercent: 15, discountTarget: 'Workshop', discountCode: 'ELISKA-WORKSHOP-15', accent: '#F12BB3' },
  { id: 'legend-badge', xp: 2050, title: 'Badge Legenda měsíce', detail: 'Speciální sběratelský badge.', kind: 'badge', badge: 'Legenda', accent: '#FFB21A' },
  { id: 'course-twenty', xp: 2350, title: '20 % na kroužek', detail: 'Největší sleva v měsíční cestě.', kind: 'discount', discountPercent: 20, discountTarget: 'Krouzek', discountCode: 'ELISKA-KROUZEK-20', accent: '#8B1DFF' },
  { id: 'finish-bonus', xp: 2600, title: 'Finální poklad', detail: '+200 XP a zlatý měsíční rámeček.', kind: 'bonus', bonusXp: 200, badge: 'Zlatý měsíc', accent: '#FFB21A' },
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

export function rewardDiscountCodesForParticipant(participant: RewardParticipant | undefined | null, usedCodeIds: string[] = []): RewardDiscountCode[] {
  if (!participant) return [];

  return monthlyRewardPath
    .filter((reward) => reward.kind === 'discount' && reward.discountPercent && reward.discountTarget && reward.discountCode && participant.xp >= reward.xp)
    .map((reward) => ({
      id: rewardDiscountId(reward.id, participant.id),
      rewardId: reward.id,
      participantId: participant.id,
      participantName: `${participant.firstName} ${participant.lastName}`,
      code: reward.discountCode as string,
      title: reward.title,
      detail: reward.detail,
      percent: reward.discountPercent as number,
      appliesTo: reward.discountTarget as RewardActivityType,
      accent: reward.accent,
      xp: reward.xp,
    }))
    .filter((discount) => !usedCodeIds.includes(discount.id));
}

export function rewardDiscountCodesForParticipants(participants: RewardParticipant[], usedCodeIds: string[] = []) {
  return participants.flatMap((participant) => rewardDiscountCodesForParticipant(participant, usedCodeIds));
}

export function findRewardDiscountByCode(code: string, productType: string, participant: RewardParticipant | undefined, usedCodeIds: string[] = []) {
  const target = normalizeRewardProductType(productType);
  const normalizedCode = normalizeDiscountCode(code);
  if (!target || !normalizedCode || !participant) return null;

  return rewardDiscountCodesForParticipant(participant, usedCodeIds).find(
    (discount) => normalizeDiscountCode(discount.code) === normalizedCode && discount.appliesTo === target,
  ) ?? null;
}

export function applyRewardDiscount(amount: number, discount: Pick<RewardDiscountCode, 'percent'> | null) {
  if (!discount) return { discountAmount: 0, finalAmount: amount };
  const discountAmount = Math.max(0, Math.round((amount * discount.percent) / 100));
  return { discountAmount, finalAmount: Math.max(0, amount - discountAmount) };
}

export function normalizeRewardProductType(productType: string): RewardActivityType | null {
  const normalized = productType
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('krouzek')) return 'Krouzek';
  if (normalized.includes('workshop')) return 'Workshop';
  return null;
}

export function readUsedRewardDiscountIds() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USED_REWARD_CODES_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function markRewardDiscountUsed(codeId: string) {
  const next = Array.from(new Set([...readUsedRewardDiscountIds(), codeId]));
  if (typeof window !== 'undefined') window.localStorage.setItem(USED_REWARD_CODES_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function rewardDiscountId(rewardId: string, participantId: string) {
  return `${participantId}:${rewardId}`;
}

function normalizeDiscountCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}
