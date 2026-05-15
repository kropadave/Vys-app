import type { ParentParticipant, ParentProduct } from '@/lib/parent-content';
import { linkedParticipants, parentProducts } from '@/lib/parent-content';
import { skillTreeTricks } from '@/lib/participant-content';

export type WorkshopTicketPurchase = {
  id: string;
  productId: string;
  participantId: string;
  participantName: string;
  type: ParentProduct['type'];
  title: string;
  amount: number;
  priceLabel: string;
  place: string;
  status: 'Zaplaceno';
  paidAt: string;
  eventDate?: string;
  expiresAt?: string;
};

export type WorkshopTicketPayload = {
  code: string;
  purchaseId: string;
  productId: string;
  participantId: string;
  title: string;
  participantName: string;
  participantLevel: number | null;
  participantBracelet: string | null;
  participantXp: number | null;
  place: string;
  eventDate: string;
  expiresAt: string;
  paidAt: string;
  priceLabel: string;
  tricks: string[];
};

const workshopSkillIds: Record<string, string[]> = {
  'workshop-praha-balkan': ['tic-tac', 'kong-vault', 'lazy-vault', 'butterfly-kick', 'tornado-kick', 'macaco'],
};

export function workshopTicketCode(purchase: WorkshopTicketPurchase) {
  return `VYS-WS-${purchase.productId}-${purchase.participantId}-${purchase.id}`.toUpperCase();
}

export function workshopTicketSkills(productId: string) {
  const skillIds = workshopSkillIds[productId] ?? workshopSkillIds['workshop-praha-balkan'];
  return skillIds.map((id) => skillTreeTricks.find((trick) => trick.id === id)).filter((trick): trick is NonNullable<typeof trick> => Boolean(trick));
}

export function workshopProductForPurchase(purchase: WorkshopTicketPurchase) {
  return parentProducts.find((product) => product.id === purchase.productId && product.type === 'Workshop');
}

export function participantForTicket(purchase: WorkshopTicketPurchase, participants: ParentParticipant[] = linkedParticipants) {
  return participants.find((participant) => participant.id === purchase.participantId) ?? null;
}

export function workshopTicketPayload(purchase: WorkshopTicketPurchase, participant = participantForTicket(purchase)): WorkshopTicketPayload {
  const product = workshopProductForPurchase(purchase);
  const skills = workshopTicketSkills(purchase.productId);

  return {
    code: workshopTicketCode(purchase),
    purchaseId: purchase.id,
    productId: purchase.productId,
    participantId: purchase.participantId,
    title: product?.title ?? purchase.title,
    participantName: participant ? `${participant.firstName} ${participant.lastName}` : purchase.participantName,
    participantLevel: participant?.level ?? null,
    participantBracelet: participant?.bracelet ?? null,
    participantXp: participant?.xp ?? null,
    place: product?.place ?? purchase.place,
    eventDate: purchase.eventDate ?? product?.eventDate ?? '14. 6. 2026 · 10:00',
    expiresAt: purchase.expiresAt ?? product?.expiresAt ?? '2026-06-15',
    paidAt: purchase.paidAt,
    priceLabel: purchase.priceLabel,
    tricks: skills.map((skill) => skill.title),
  };
}

export function formatTicketExpiry(expiresAt: string) {
  const [year, month, day] = expiresAt.split('-');
  if (!year || !month || !day) return expiresAt;
  return `${Number(day)}. ${Number(month)}. ${year}`;
}

export function isWorkshopTicketExpired(expiresAt: string, now = new Date()) {
  const expiryDate = new Date(`${expiresAt}T23:59:59`);
  return Number.isFinite(expiryDate.getTime()) && expiryDate < now;
}