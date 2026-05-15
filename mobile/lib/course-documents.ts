import { linkedParticipants, parentProfile, type ParentParticipant } from '@/lib/parent-content';

export type CourseDocumentKind = 'gdpr' | 'guardian-consent' | 'health' | 'departure' | 'infection-free' | 'packing';
export type CourseDocumentStatus = 'draft' | 'signed';
export type CourseDocumentValue = string | boolean;
export type CourseDocumentValues = Record<string, CourseDocumentValue>;
export type DocumentActivityType = 'Kroužek' | 'Tábor';

export type CourseDocumentEnrollment = {
  id: string;
  purchaseId: string;
  productId: string;
  participantId: string;
  participantName: string;
  title: string;
  place: string;
  activityType: DocumentActivityType;
  paidAt?: string;
  source: 'purchase' | 'active-profile';
};

export type StoredCourseDocument = {
  id: string;
  participantId: string;
  participantName: string;
  purchaseId: string;
  productId: string;
  activityType: DocumentActivityType;
  kind: CourseDocumentKind;
  title: string;
  status: CourseDocumentStatus;
  parentName: string;
  coursePlace: string;
  values: CourseDocumentValues;
  signedAt?: string;
  updatedAt: string;
};

export type CoursePurchaseLike = {
  id: string;
  productId: string;
  participantId: string;
  participantName: string;
  type: 'Kroužek' | 'Tábor' | 'Workshop';
  title: string;
  place: string;
  paidAt?: string;
};

type FieldRequirement = { fieldId: string; value: CourseDocumentValue };

export type CourseDocumentField = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'check' | 'choice';
  placeholder?: string;
  required?: boolean;
  requiredWhen?: FieldRequirement;
  options?: Array<{ label: string; value: string }>;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
};

export type CourseDocumentTemplate = {
  kind: CourseDocumentKind;
  activityType: DocumentActivityType;
  title: string;
  shortTitle: string;
  purpose: string;
  fields: CourseDocumentField[];
};

const commonFields: CourseDocumentField[] = [
  { id: 'parentName', label: 'Zákonný zástupce', type: 'text', required: true, placeholder: 'Jméno a příjmení rodiče' },
  { id: 'emergencyPhone', label: 'Telefon pro rychlý kontakt', type: 'text', required: true, placeholder: '+420 ...', keyboardType: 'phone-pad' },
  { id: 'signatureName', label: 'Podpis rodiče', type: 'text', required: true, placeholder: 'Jméno a příjmení jako elektronický podpis' },
];

export const courseDocumentTemplates: CourseDocumentTemplate[] = [
  {
    kind: 'gdpr',
    activityType: 'Kroužek',
    title: 'GDPR a ochrana osobních údajů',
    shortTitle: 'GDPR',
    purpose: 'Souhlas se zpracováním údajů nutných pro vedení účastníka, docházku, platby a bezpečnou komunikaci s rodičem.',
    fields: [
      ...commonFields,
      { id: 'gdprAttendance', label: 'Souhlasím se zpracováním údajů pro evidenci docházky, permanentky, plateb a zařazení do skupiny.', type: 'check', required: true },
      { id: 'gdprContact', label: 'Souhlasím s použitím kontaktů pro organizační zprávy ke kroužku a nenadálé situace na tréninku.', type: 'check', required: true },
      { id: 'gdprMedia', label: 'Souhlasím s použitím fotek a videí z tréninku pro interní týmovou galerii a komunikaci TeamVYS.', type: 'check' },
      { id: 'gdprNote', label: 'Poznámka k osobním údajům', type: 'textarea', placeholder: 'Např. omezení pro fotky, preferovaný kontakt...' },
    ],
  },
  {
    kind: 'guardian-consent',
    activityType: 'Kroužek',
    title: 'Souhlas zákonného zástupce a pravidla bezpečnosti',
    shortTitle: 'Souhlas rodiče',
    purpose: 'Potvrzení, že rodič rozumí povaze parkour tréninku, pravidlům bezpečnosti a souhlasí s účastí dítěte.',
    fields: [
      ...commonFields,
      { id: 'trainingConsent', label: 'Souhlasím s účastí dítěte na parkour/tricking kroužku TeamVYS ve vybrané lokalitě.', type: 'check', required: true },
      { id: 'riskConsent', label: 'Beru na vědomí, že trénink obsahuje skoky, dopady a překážky, a dítě bude postupovat podle pokynů trenéra.', type: 'check', required: true },
      { id: 'rulesConsent', label: 'Potvrzuji, že dítě zná základní pravidla: necvičí bez pokynu, neodchází ze skupiny a hlásí bolest nebo úraz.', type: 'check', required: true },
      { id: 'emergencyConsent', label: 'Souhlasím, aby trenér v akutní situaci kontaktoval záchrannou službu a ihned informoval rodiče.', type: 'check', required: true },
    ],
  },
  {
    kind: 'health',
    activityType: 'Kroužek',
    title: 'Zdravotní informace účastníka',
    shortTitle: 'Zdraví',
    purpose: 'Informace, které trenér potřebuje znát před tréninkem: alergie, omezení, léky, kontakt a potvrzení způsobilosti.',
    fields: [
      ...commonFields,
      { id: 'healthFit', label: 'Potvrzuji, že dítě je zdravotně způsobilé absolvovat běžný sportovní trénink přiměřený věku.', type: 'check', required: true },
      { id: 'allergies', label: 'Alergie', type: 'textarea', placeholder: 'Napište alergie, nebo „Bez alergií“.' },
      { id: 'healthLimits', label: 'Zdravotní omezení / úrazy', type: 'textarea', placeholder: 'Napište omezení, nebo „Bez omezení“.' },
      { id: 'medication', label: 'Léky a pokyny pro trenéra', type: 'textarea', placeholder: 'Např. inhalátor, pravidelná medikace, postup při potížích...' },
      { id: 'insuranceCompany', label: 'Zdravotní pojišťovna', type: 'text', placeholder: 'Např. VZP, OZP, ČPZP...' },
    ],
  },
  {
    kind: 'departure',
    activityType: 'Kroužek',
    title: 'Odchod z tréninku a vyzvedávání',
    shortTitle: 'Odchod',
    purpose: 'Určuje, kdo dítě po tréninku vyzvedává, nebo jestli může odejít samo. Trenér díky tomu ví, co je povolené.',
    fields: [
      ...commonFields,
      {
        id: 'departureMode',
        label: 'Způsob odchodu po tréninku',
        type: 'choice',
        required: true,
        options: [
          { label: 'Vyzvedne rodič', value: 'parent' },
          { label: 'Může odejít samo', value: 'alone' },
          { label: 'Pověřené osoby', value: 'authorized' },
        ],
      },
      { id: 'authorizedPeople', label: 'Pověřené osoby', type: 'textarea', placeholder: 'Jméno, telefon, vztah k dítěti', requiredWhen: { fieldId: 'departureMode', value: 'authorized' } },
      { id: 'departureNote', label: 'Poznámka k odchodu', type: 'textarea', placeholder: 'Např. dítě čeká u recepce, odchází na autobus v 17:45...' },
      { id: 'departureConsent', label: 'Potvrzuji, že uvedený způsob odchodu platí pro tento kroužek a změnu nahlásím trenérovi nebo administrátorovi.', type: 'check', required: true },
    ],
  },
];

export const campDocumentTemplates: CourseDocumentTemplate[] = [
  {
    kind: 'gdpr',
    activityType: 'Tábor',
    title: 'GDPR pro příměstský tábor',
    shortTitle: 'GDPR',
    purpose: 'Souhlas se zpracováním údajů nutných pro přihlášku, docházku, stravu, bezpečnost, QR vstup a kontakt s rodičem během tábora.',
    fields: [
      ...commonFields,
      { id: 'gdprCampRegistration', label: 'Souhlasím se zpracováním údajů pro přihlášku, platbu, QR vstup, docházku a táborovou organizaci.', type: 'check', required: true },
      { id: 'gdprHealth', label: 'Souhlasím se zpracováním zdravotních údajů uvedených v anamnéze pouze pro bezpečnost dítěte a práci trenérů.', type: 'check', required: true },
      { id: 'gdprFood', label: 'Souhlasím se zpracováním údajů o alergiích a dietě pro zajištění stravy a pitného režimu.', type: 'check', required: true },
      { id: 'gdprMedia', label: 'Souhlasím s použitím fotek a videí z tábora pro interní galerii a komunikaci TeamVYS.', type: 'check' },
      { id: 'gdprNote', label: 'Poznámka k osobním údajům', type: 'textarea', placeholder: 'Např. omezení pro fotky, preferovaný kontakt...' },
    ],
  },
  {
    kind: 'guardian-consent',
    activityType: 'Tábor',
    title: 'Souhlas zákonného zástupce s účastí na táboře',
    shortTitle: 'Souhlas rodiče',
    purpose: 'Potvrzení účasti dítěte na příměstském táboře, pravidel bezpečnosti, sportovního programu a řešení mimořádných situací.',
    fields: [
      ...commonFields,
      { id: 'campConsent', label: 'Souhlasím s účastí dítěte na příměstském táboře TeamVYS ve vybrané lokalitě a termínu.', type: 'check', required: true },
      { id: 'programConsent', label: 'Beru na vědomí, že program obsahuje parkour/tricking trénink, hry, venkovní aktivity, přesuny a sportovní soutěže.', type: 'check', required: true },
      { id: 'rulesConsent', label: 'Potvrzuji, že dítě zná pravidla: poslouchá trenéra, neodchází samo bez souhlasu, hlásí bolest, úraz i nevolnost.', type: 'check', required: true },
      { id: 'emergencyConsent', label: 'Souhlasím, aby tým v akutní situaci kontaktoval záchrannou službu a ihned informoval zákonného zástupce.', type: 'check', required: true },
    ],
  },
  {
    kind: 'health',
    activityType: 'Tábor',
    title: 'Zdravotní anamnéza a alergie',
    shortTitle: 'Anamnéza',
    purpose: 'Zdravotní informace, alergie, léky a omezení. Trenérský tým je uvidí v evidenci skenů a může podle nich rychle kontrolovat rizika.',
    fields: [
      ...commonFields,
      { id: 'healthFit', label: 'Potvrzuji, že dítě je zdravotně způsobilé absolvovat celodenní sportovní program přiměřený věku.', type: 'check', required: true },
      { id: 'allergies', label: 'Alergie / dieta', type: 'textarea', required: true, placeholder: 'Napište alergie a dietu, nebo „Bez alergií“.' },
      { id: 'healthLimits', label: 'Zdravotní omezení / prodělané úrazy', type: 'textarea', required: true, placeholder: 'Napište omezení, nebo „Bez omezení“.' },
      { id: 'medication', label: 'Léky, dávkování a postup při potížích', type: 'textarea', required: true, placeholder: 'Např. inhalátor, epi-pen, pravidelná medikace, nebo „Bez léků“.' },
      { id: 'insuranceCompany', label: 'Zdravotní pojišťovna', type: 'text', required: true, placeholder: 'Např. VZP, OZP, ČPZP...' },
      { id: 'doctorContact', label: 'Praktický lékař / další kontakt', type: 'text', placeholder: 'Jméno lékaře nebo kontakt, pokud ho chcete uvést.' },
      { id: 'canSwim', label: 'Dítě umí plavat bez dopomoci.', type: 'check' },
    ],
  },
  {
    kind: 'infection-free',
    activityType: 'Tábor',
    title: 'Čestné prohlášení o bezinfekčnosti',
    shortTitle: 'Bezinfekčnost',
    purpose: 'Prohlášení pro první den tábora, že dítě nejeví příznaky infekčního onemocnění a nebylo v rizikovém kontaktu.',
    fields: [
      ...commonFields,
      { id: 'infectionDate', label: 'Datum prohlášení', type: 'text', required: true, placeholder: 'např. 13. 7. 2026' },
      { id: 'noSymptoms', label: 'Dítě v den nástupu nemá horečku, průjem, zvracení, vyrážku ani jiné příznaky infekčního onemocnění.', type: 'check', required: true },
      { id: 'noQuarantine', label: 'Dítěti nebyla nařízena karanténa ani izolace a podle mých informací nebylo v rizikovém kontaktu.', type: 'check', required: true },
      { id: 'reportChanges', label: 'Zavazuji se ihned nahlásit změnu zdravotního stavu před nástupem i během tábora.', type: 'check', required: true },
    ],
  },
  {
    kind: 'departure',
    activityType: 'Tábor',
    title: 'Vyzvedávání a samostatný odchod z tábora',
    shortTitle: 'Vyzvedávání',
    purpose: 'Určuje, kdo dítě každý den vyzvedává, nebo jestli může odejít samo. Tým podle toho kontroluje odchody.',
    fields: [
      ...commonFields,
      {
        id: 'departureMode',
        label: 'Způsob odchodu z tábora',
        type: 'choice',
        required: true,
        options: [
          { label: 'Vyzvedne rodič', value: 'parent' },
          { label: 'Může odejít samo', value: 'alone' },
          { label: 'Pověřené osoby', value: 'authorized' },
        ],
      },
      { id: 'authorizedPeople', label: 'Pověřené osoby', type: 'textarea', placeholder: 'Jméno, telefon, vztah k dítěti', requiredWhen: { fieldId: 'departureMode', value: 'authorized' } },
      { id: 'pickupWindow', label: 'Poznámka k vyzvedávání', type: 'textarea', placeholder: 'Např. babička vyzvedává ve středu, dítě odchází na autobus v 16:10...' },
      { id: 'departureConsent', label: 'Potvrzuji, že uvedený způsob odchodu platí pro všechny dny tábora, dokud ho písemně nezměním.', type: 'check', required: true },
    ],
  },
  {
    kind: 'packing',
    activityType: 'Tábor',
    title: 'Co musí mít dítě první den s sebou',
    shortTitle: 'Věci s sebou',
    purpose: 'Kontrolní seznam povinných věcí na první den. Po potvrzení se uloží do profilu a trenér vidí, že je dítě připravené.',
    fields: [
      ...commonFields,
      { id: 'waterBottle', label: 'Láhev na pití alespoň 0,75 l.', type: 'check', required: true },
      { id: 'sportClothes', label: 'Pohodlné sportovní oblečení a náhradní tričko.', type: 'check', required: true },
      { id: 'indoorShoes', label: 'Čisté sálové boty do tělocvičny.', type: 'check', required: true },
      { id: 'outdoorShoes', label: 'Pevné venkovní boty na pohyb venku.', type: 'check', required: true },
      { id: 'capSunscreen', label: 'Kšiltovka / pokrývka hlavy a opalovací krém pro venkovní program.', type: 'check', required: true },
      { id: 'insuranceCardCopy', label: 'Kopie kartičky zdravotní pojišťovny nebo její fotka v telefonu rodiče.', type: 'check', required: true },
      { id: 'medicationPacked', label: 'Léky uvedené v anamnéze jsou označené jménem dítěte a předané trenérovi.', type: 'check' },
      { id: 'packingNote', label: 'Poznámka k věcem', type: 'textarea', placeholder: 'Např. vlastní chrániče, dioptrické brýle, léky předané trenérovi...' },
    ],
  },
];

export function documentTemplatesForActivity(activityType: DocumentActivityType) {
  return activityType === 'Tábor' ? campDocumentTemplates : courseDocumentTemplates;
}

export function documentTemplatesForEnrollment(enrollment: Pick<CourseDocumentEnrollment, 'activityType'>) {
  return documentTemplatesForActivity(enrollment.activityType);
}

export function buildCourseDocumentEnrollments(purchases: CoursePurchaseLike[], participants: ParentParticipant[] = linkedParticipants) {
  const coursePurchasesById = new Map<string, CourseDocumentEnrollment>();

  for (const purchase of purchases) {
    if (purchase.type !== 'Kroužek' && purchase.type !== 'Tábor') continue;
    const enrollment = courseDocumentEnrollmentFromPurchase(purchase);
    if (!coursePurchasesById.has(enrollment.id)) coursePurchasesById.set(enrollment.id, enrollment);
  }

  const coursePurchases = Array.from(coursePurchasesById.values());

  const activeProfileCourses = participants
    .flatMap((participant) => participant.activePurchases
      .filter((purchase) => purchase.type === 'Kroužek' && purchase.status !== 'Zatím nezakoupeno')
      .filter(() => !coursePurchasesById.has(activityEnrollmentId(participant.id, 'Kroužek', participant.activeCourse)))
      .map((purchase) => ({
        id: activityEnrollmentId(participant.id, 'Kroužek', participant.activeCourse),
        purchaseId: activityEnrollmentId(participant.id, 'Kroužek', participant.activeCourse),
        productId: `active-course-${participant.id}`,
        participantId: participant.id,
        participantName: `${participant.firstName} ${participant.lastName}`,
        title: purchase.title,
        place: participant.activeCourse,
        activityType: 'Kroužek' as const,
        source: 'active-profile' as const,
      })));

  return [...coursePurchases, ...activeProfileCourses];
}

export function courseDocumentEnrollmentFromPurchase(purchase: CoursePurchaseLike): CourseDocumentEnrollment {
  const activityType = purchase.type === 'Tábor' ? 'Tábor' : 'Kroužek';
  const id = activityEnrollmentId(purchase.participantId, activityType, activityType === 'Tábor' ? purchase.productId : purchase.place);

  return {
    id,
    purchaseId: id,
    productId: purchase.productId,
    participantId: purchase.participantId,
    participantName: purchase.participantName,
    title: purchase.title,
    place: purchase.place,
    activityType,
    paidAt: purchase.paidAt,
    source: 'purchase',
  };
}

function activityEnrollmentId(participantId: string, activityType: DocumentActivityType, value: string) {
  const valueSlug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'aktivita';
  const prefix = activityType === 'Tábor' ? 'camp' : 'course';

  return `${prefix}-${participantId}-${valueSlug}`;
}

export function documentIdFor(enrollment: CourseDocumentEnrollment, kind: CourseDocumentKind) {
  return `course-doc-${enrollment.participantId}-${enrollment.purchaseId}-${kind}`;
}

export function findCourseDocument(documents: StoredCourseDocument[], enrollment: CourseDocumentEnrollment, kind: CourseDocumentKind) {
  return documents.find((document) => document.participantId === enrollment.participantId && document.purchaseId === enrollment.purchaseId && document.kind === kind) ?? null;
}

export function getInitialDocumentValues(enrollment: CourseDocumentEnrollment): CourseDocumentValues {
  const values: CourseDocumentValues = {
    parentName: parentProfile.name,
    emergencyPhone: parentProfile.phone,
    signatureName: parentProfile.name,
    participantName: enrollment.participantName,
    coursePlace: enrollment.place,
    departureMode: 'parent',
    allergies: 'Bez alergií',
    healthLimits: 'Bez omezení',
  };

  if (enrollment.activityType === 'Tábor') {
    return {
      ...values,
      medication: 'Bez léků',
      insuranceCompany: 'VZP',
      infectionDate: new Date().toLocaleDateString('cs-CZ'),
    };
  }

  return values;
}

export function isDocumentReadyToSign(template: CourseDocumentTemplate, values: CourseDocumentValues) {
  return template.fields.every((field) => {
    if (!isFieldRequired(field, values)) return true;

    const value = values[field.id];
    if (field.type === 'check') return value === true;
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export function courseDocumentProgress(documents: StoredCourseDocument[], enrollment: CourseDocumentEnrollment) {
  const templates = documentTemplatesForEnrollment(enrollment);
  const signed = templates.filter((template) => findCourseDocument(documents, enrollment, template.kind)?.status === 'signed');
  const drafts = templates.filter((template) => findCourseDocument(documents, enrollment, template.kind)?.status === 'draft');
  const missing = templates.filter((template) => !findCourseDocument(documents, enrollment, template.kind));

  return {
    required: templates.length,
    signed: signed.length,
    draft: drafts.length,
    missing: missing.length,
    complete: signed.length === templates.length,
    missingTitles: [...drafts, ...missing].map((template) => template.shortTitle),
  };
}

export function documentStatusLabel(status: StoredCourseDocument['status'] | null) {
  if (status === 'signed') return 'Podepsáno';
  if (status === 'draft') return 'Rozpracováno';
  return 'Chybí';
}

function isFieldRequired(field: CourseDocumentField, values: CourseDocumentValues) {
  if (field.required) return true;
  if (!field.requiredWhen) return false;
  return values[field.requiredWhen.fieldId] === field.requiredWhen.value;
}