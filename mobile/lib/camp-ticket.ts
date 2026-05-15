import {
  courseDocumentEnrollmentFromPurchase,
  courseDocumentProgress,
  findCourseDocument,
  type CourseDocumentValues,
  type StoredCourseDocument,
} from '@/lib/course-documents';
import { linkedParticipants, parentProducts, type ParentParticipant, type ParentProduct } from '@/lib/parent-content';

export type CampTicketPurchase = {
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

export type CampMedicalSummary = {
  documentsComplete: boolean;
  signedDocuments: number;
  requiredDocuments: number;
  missingDocuments: string[];
  allergies: string;
  healthLimits: string;
  medication: string;
  insuranceCompany: string;
  emergencyPhone: string;
  departureMode: string;
  authorizedPeople: string;
  pickupNote: string;
  infectionDate: string;
  requiredItemsConfirmed: boolean;
};

export type CampTicketPayload = CampMedicalSummary & {
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
  terms: string;
  firstDay: string;
  dayTime: string;
  paidAt: string;
  priceLabel: string;
  requiredItems: string[];
};

const campDetails: Record<string, { terms: string; firstDay: string; dayTime: string; requiredItems: string[] }> = {
  'camp-veliny-mlynek': {
    terms: '20.7.-24.7. nebo 27.7.-31.7.',
    firstDay: '20. 7. 2026 / 27. 7. 2026',
    dayTime: 'Příchod 8:00-9:00 · vyzvednutí kolem 16:00',
    requiredItems: ['Láhev na pití', 'Sportovní oblečení', 'Čisté sálové boty', 'Pevné venkovní boty', 'Kšiltovka a opalovací krém', 'Kopie kartičky pojišťovny', 'Označené léky podle anamnézy'],
  },
  'camp-vyskov-orel': {
    terms: '13.7.-17.7. nebo 10.8.-14.8.',
    firstDay: '13. 7. 2026 / 10. 8. 2026',
    dayTime: 'Příchod 8:00-9:00 · vyzvednutí kolem 16:00',
    requiredItems: ['Láhev na pití', 'Sportovní oblečení', 'Čisté sálové boty', 'Pevné venkovní boty', 'Kšiltovka a opalovací krém', 'Kopie kartičky pojišťovny', 'Označené léky podle anamnézy'],
  },
};

export function campTicketCode(purchase: CampTicketPurchase) {
  return `VYS-CAMP-${purchase.productId}-${purchase.participantId}-${purchase.id}`.toUpperCase();
}

export function campProductForPurchase(purchase: CampTicketPurchase) {
  return parentProducts.find((product) => product.id === purchase.productId && product.type === 'Tábor');
}

export function participantForCampTicket(purchase: CampTicketPurchase, participants: ParentParticipant[] = linkedParticipants) {
  return participants.find((participant) => participant.id === purchase.participantId) ?? null;
}

export function campDocumentSummary(purchase: CampTicketPurchase, documents: StoredCourseDocument[]): CampMedicalSummary {
  const enrollment = courseDocumentEnrollmentFromPurchase(purchase);
  const progress = courseDocumentProgress(documents, enrollment);
  const health = findCourseDocument(documents, enrollment, 'health');
  const departure = findCourseDocument(documents, enrollment, 'departure');
  const infection = findCourseDocument(documents, enrollment, 'infection-free');
  const packing = findCourseDocument(documents, enrollment, 'packing');
  const healthValues = health?.values ?? {};
  const departureValues = departure?.values ?? {};
  const infectionValues = infection?.values ?? {};
  const packingValues = packing?.values ?? {};

  return {
    documentsComplete: progress.complete,
    signedDocuments: progress.signed,
    requiredDocuments: progress.required,
    missingDocuments: progress.missingTitles,
    allergies: textValue(healthValues, 'allergies', 'Nevyplněno'),
    healthLimits: textValue(healthValues, 'healthLimits', 'Nevyplněno'),
    medication: textValue(healthValues, 'medication', 'Nevyplněno'),
    insuranceCompany: textValue(healthValues, 'insuranceCompany', 'Nevyplněno'),
    emergencyPhone: textValue(healthValues, 'emergencyPhone', 'Nevyplněno'),
    departureMode: departureModeLabel(textValue(departureValues, 'departureMode', 'parent')),
    authorizedPeople: textValue(departureValues, 'authorizedPeople', 'Neuvedeno'),
    pickupNote: textValue(departureValues, 'pickupWindow', textValue(departureValues, 'departureNote', 'Bez poznámky')),
    infectionDate: textValue(infectionValues, 'infectionDate', 'Nevyplněno'),
    requiredItemsConfirmed: requiredPackingItems.every((fieldId) => packingValues[fieldId] === true),
  };
}

export function campTicketPayload(purchase: CampTicketPurchase, participant = participantForCampTicket(purchase), documents: StoredCourseDocument[] = []): CampTicketPayload {
  const product = campProductForPurchase(purchase);
  const details = campDetails[purchase.productId] ?? campDetails['camp-vyskov-orel'];
  const summary = campDocumentSummary(purchase, documents);

  return {
    ...summary,
    code: campTicketCode(purchase),
    purchaseId: purchase.id,
    productId: purchase.productId,
    participantId: purchase.participantId,
    title: product?.title ?? purchase.title,
    participantName: participant ? `${participant.firstName} ${participant.lastName}` : purchase.participantName,
    participantLevel: participant?.level ?? null,
    participantBracelet: participant?.bracelet ?? null,
    participantXp: participant?.xp ?? null,
    place: product?.place ?? purchase.place,
    terms: details.terms,
    firstDay: details.firstDay,
    dayTime: details.dayTime,
    paidAt: purchase.paidAt,
    priceLabel: purchase.priceLabel,
    requiredItems: details.requiredItems,
  };
}

function textValue(values: CourseDocumentValues, fieldId: string, fallback: string) {
  const value = values[fieldId];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function departureModeLabel(value: string) {
  if (value === 'alone') return 'Může odejít samo';
  if (value === 'authorized') return 'Pověřené osoby';
  return 'Vyzvedne rodič';
}

const requiredPackingItems = ['waterBottle', 'sportClothes', 'indoorShoes', 'outdoorShoes', 'capSunscreen', 'insuranceCardCopy'];