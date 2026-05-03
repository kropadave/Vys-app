'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Bell,
    Camera,
    Check,
    CheckCircle2,
    ChevronDown,
    CreditCard,
    FileCheck2,
    History,
    LayoutDashboard,
    MapPin,
    MessageSquareText,
    PackageCheck,
    Phone,
    Plus,
    QrCode,
    RefreshCw,
    Search,
    ShieldCheck,
    Star,
    UserPlus,
    Users,
    WalletCards,
    X,
} from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { TeamVysLogo } from '@/components/brand/team-vys-logo';
import { VysMaskotImage } from '@/components/brand/vys-maskot';
import { isAdminCreatedProduct, useAdminCreatedProducts } from '@/lib/admin-created-products';
import { createCheckoutSession, createManualParticipantProfile, saveCourseDocuments } from '@/lib/api-client';
import {
    activityLabel,
    coachReviews,
    linkedParticipants,
    parentAttendanceHistory,
    parentDigitalPasses,
    parentDocuments,
    parentNotifications,
    parentPayments,
    parentProducts,
    paymentStatusLabel,
    requiredDocumentsForProduct,
    trainersForProduct,
    type ActivityType,
    type DocumentStatus,
    type ParentDocument,
    type ParentParticipant,
    type ParentPayment,
    type ParentProduct,
    type ParentProductTrainer,
    type RequiredDocumentTemplate,
} from '@/lib/portal-content';
import { createBrowserSupabaseClient, hasSupabaseBrowserConfig } from '@/lib/supabase/browser';

type SectionKey = 'overview' | 'participants' | 'payments' | 'documents' | 'profile';
type ProductGroup = {
  id: string;
  type: ActivityType;
  title: string;
  city: string;
  place: string;
  venue: string;
  primaryMeta: string;
  secondaryMeta: string;
  description: string;
  badge: string;
  heroImage: string;
  gallery: string[];
  capacityTotal: number;
  capacityCurrent: number;
  importantInfo: ParentProduct['importantInfo'];
  trainingFocus: string[];
  trainers: ParentProductTrainer[];
  variants: ParentProduct[];
};

type DocumentFormValues = {
  parentName: string;
  emergencyPhone: string;
  insuranceCompany: string;
  healthLimits: string;
  allergies: string;
  medication: string;
  pickupPeople: string;
  notes: string;
  gdprConsent: boolean;
  guardianConsent: boolean;
  healthAccuracy: boolean;
  departureConsent: boolean;
  infectionFree: boolean;
  packingConfirmed: boolean;
  photoConsent: boolean;
  workshopTermsAccepted: boolean;
};

type PurchaseFlow = {
  mode: 'purchase' | 'documents';
  group: ProductGroup;
  selectedProductId: string;
  participantId: string;
  documentValues: DocumentFormValues;
  isSubmitting: boolean;
  message: string | null;
};

type ParentPortalDashboardProps = {
  displayName: string;
  displayEmail: string;
};

const sections: Array<{ key: SectionKey; label: string; icon: React.ReactNode; description: string }> = [
  { key: 'overview', label: 'Přehled', icon: <LayoutDashboard size={18} />, description: 'stav rodiny' },
  { key: 'participants', label: 'Účastníci', icon: <Users size={18} />, description: 'děti a docházka' },
  { key: 'payments', label: 'Platby', icon: <WalletCards size={18} />, description: 'kroužky, tábory, workshopy' },
  { key: 'documents', label: 'Dokumenty', icon: <FileCheck2 size={18} />, description: 'povinné souhlasy' },
  { key: 'profile', label: 'Profil', icon: <UserPlus size={18} />, description: 'rodič a hodnocení' },
];

const paymentTypes: Array<{ key: ActivityType; label: string }> = [
  { key: 'Krouzek', label: 'Kroužky' },
  { key: 'Tabor', label: 'Tábory' },
  { key: 'Workshop', label: 'Workshopy' },
];

export function ParentPortalDashboard({ displayName, displayEmail }: ParentPortalDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [selectedParticipantId, setSelectedParticipantId] = useState(linkedParticipants[0]?.id ?? '');
  const [activeProductType, setActiveProductType] = useState<ActivityType>('Krouzek');
  const [purchaseFlow, setPurchaseFlow] = useState<PurchaseFlow | null>(null);
  const { products: adminCreatedProducts } = useAdminCreatedProducts();

  const availableProducts = useMemo(() => [...parentProducts, ...adminCreatedProducts], [adminCreatedProducts]);
  const productGroups = useMemo(() => buildProductGroups(availableProducts), [availableProducts]);
  const selectedParticipant = linkedParticipants.find((participant) => participant.id === selectedParticipantId) ?? linkedParticipants[0];
  const activeParticipantName = selectedParticipant ? `${selectedParticipant.firstName} ${selectedParticipant.lastName}` : 'účastník';

  function openPurchaseFlow(group: ProductGroup) {
    const defaultProduct = group.variants.find((variant) => variant.entriesTotal === 10) ?? group.variants[0];
    const defaultParticipant = selectedParticipant?.id ?? linkedParticipants[0]?.id ?? '';

    setPurchaseFlow({
      mode: 'purchase',
      group,
      selectedProductId: defaultProduct.id,
      participantId: defaultParticipant,
      documentValues: defaultDocumentValues(displayName),
      isSubmitting: false,
      message: null,
    });
  }

  function openDocumentFlow(document: ParentDocument) {
    const target = findDocumentTarget(document, productGroups);
    if (!target) {
      setActiveSection('payments');
      return;
    }

    setSelectedParticipantId(target.participant.id);
    setPurchaseFlow({
      mode: 'documents',
      group: target.group,
      selectedProductId: target.product.id,
      participantId: target.participant.id,
      documentValues: defaultDocumentValues(displayName),
      isSubmitting: false,
      message: null,
    });
  }

  async function handleCheckout() {
    if (!purchaseFlow) return;

    const selectedProduct = purchaseFlow.group.variants.find((variant) => variant.id === purchaseFlow.selectedProductId);
    const participant = linkedParticipants.find((item) => item.id === purchaseFlow.participantId);

    if (!selectedProduct || !participant) {
      setPurchaseFlow({ ...purchaseFlow, message: 'Vyber prosím variantu i účastníka.' });
      return;
    }

    const requiredDocuments = requiredDocumentsForProduct(selectedProduct);
    const documentError = validateRequiredDocuments(selectedProduct, purchaseFlow.documentValues, requiredDocuments);
    if (documentError) {
      setPurchaseFlow({ ...purchaseFlow, message: documentError });
      return;
    }

    setPurchaseFlow({ ...purchaseFlow, isSubmitting: true, message: null });

    try {
      await saveRequiredDocuments(selectedProduct, participant, purchaseFlow.documentValues, requiredDocuments);

      if (purchaseFlow.mode === 'documents') {
        setPurchaseFlow({
          ...purchaseFlow,
          isSubmitting: false,
          message: 'Dokumenty jsou uložené. Po napojení na živá data se stav rovnou propíše v seznamu.',
        });
        return;
      }

      if (isAdminCreatedProduct(selectedProduct)) {
        setPurchaseFlow({
          ...purchaseFlow,
          isSubmitting: false,
          message: 'Produkt vytvořený adminem je v rodičovské nabídce. Živý Stripe checkout se k němu připojí po uložení produktů do backendu/Supabase.',
        });
        return;
      }

      const origin = window.location.origin;
      const session = await createCheckoutSession({
        productId: selectedProduct.id,
        participantId: participant.id,
        participantName: `${participant.firstName} ${participant.lastName}`,
        successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/rodic?checkout=cancelled`,
      });

      if (!session.url) throw new Error('Stripe nevrátil URL checkoutu.');
      window.location.assign(session.url);
    } catch (error) {
      setPurchaseFlow({
        ...purchaseFlow,
        isSubmitting: false,
        message: error instanceof Error ? friendlyBackendError(error.message) : 'Platbu se nepodařilo připravit.',
      });
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
      <section className="fixed inset-x-2 bottom-2 z-50 self-start rounded-[22px] border border-brand-purple/12 bg-white/72 p-1.5 shadow-brand ring-1 ring-white/55 backdrop-blur-2xl xl:sticky xl:inset-x-auto xl:bottom-auto xl:top-3 xl:p-2 xl:self-start">
        <div className="flex items-center gap-2 xl:block">
          <div className="hidden h-16 w-full shrink-0 items-center gap-3 rounded-[18px] bg-brand-purple-light px-3 xl:flex">
            <TeamVysLogo size={36} priority />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase leading-none text-brand-purple-deep">Rodičovský portál</p>
              <p className="mt-0.5 truncate text-[13px] font-black leading-tight text-brand-ink">{displayName}</p>
            </div>
          </div>

          <nav className="grid min-w-0 flex-1 grid-cols-5 gap-1.5 xl:mt-2 xl:grid-cols-1">
          {sections.map((section) => {
            const isActive = activeSection === section.key;
            return (
              <button
                key={section.key}
                type="button"
                aria-label={section.label}
                title={section.label}
                onClick={() => setActiveSection(section.key)}
                className={`flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-[16px] border px-1.5 text-left transition-all duration-300 sm:h-12 sm:gap-2 sm:px-2.5 xl:h-11 xl:justify-start xl:px-3 ${
                  isActive
                    ? 'border-brand-purple bg-brand-purple text-white shadow-brand'
                    : 'border-brand-purple/10 bg-white/68 text-brand-ink shadow-sm backdrop-blur-xl hover:border-brand-purple/24 hover:bg-white hover:shadow-brand-soft'
                }`}
              >
                <span className={`shrink-0 ${isActive ? 'text-white' : 'text-brand-purple'}`}>{section.icon}</span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-[11px] font-black sm:text-xs lg:text-[13px]">{section.label}</span>
                </span>
              </button>
            );
          })}
          </nav>
        </div>
      </section>

      <main className="min-w-0 space-y-5 pb-36 xl:pb-0">
        <Header activeSection={activeSection} />

        {activeSection === 'overview' ? <OverviewSection onNavigate={setActiveSection} /> : null}
        {activeSection === 'participants' ? (
          <ParticipantsSection
            selectedParticipantId={selectedParticipantId}
            displayName={displayName}
            availableProducts={availableProducts}
            onSelectParticipant={setSelectedParticipantId}
            onOpenDocument={openDocumentFlow}
          />
        ) : null}
        {activeSection === 'payments' ? (
          <PaymentsSection
            activeProductType={activeProductType}
            productGroups={productGroups}
            selectedParticipant={selectedParticipant}
            onProductTypeChange={setActiveProductType}
            onStartPurchase={openPurchaseFlow}
          />
        ) : null}
        {activeSection === 'documents' ? <DocumentsSection onOpenDocument={openDocumentFlow} onGoToPayments={() => setActiveSection('payments')} /> : null}
        {activeSection === 'profile' ? <ProfileSection displayName={displayName} displayEmail={displayEmail} participantName={activeParticipantName} /> : null}
      </main>

      {purchaseFlow ? (
        <PurchaseWizard
          flow={purchaseFlow}
          onChange={setPurchaseFlow}
          onClose={() => setPurchaseFlow(null)}
          onCheckout={handleCheckout}
        />
      ) : null}
    </div>
  );
}

function Header({ activeSection }: { activeSection: SectionKey }) {
  const section = sections.find((item) => item.key === activeSection) ?? sections[0];
  const signedDocuments = parentDocuments.filter((document) => document.status === 'signed').length;

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-brand-purple/12 bg-white px-4 py-4 shadow-brand-soft sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-brand-purple-light">
            <TeamVysLogo size={38} priority />
            <span className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan text-white shadow-sm">
              {section.icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase text-brand-cyan">{section.label}</p>
            <h1 className="truncate text-base font-black text-brand-ink md:text-lg">{headlineForSection(activeSection)}</h1>
          </div>
        </div>
        <div className="flex h-24 w-20 shrink-0 items-center justify-end sm:h-28 sm:w-24">
          <VysMaskotImage className="h-24 w-16 sm:h-28 sm:w-[76px]" priority sizes="76px" />
        </div>
      </div>
      <div className="mt-3 hidden grid-cols-3 gap-2 text-center sm:grid">
        <Metric value={`${linkedParticipants.length}`} label="účastníci" />
        <Metric value={`${signedDocuments}/${parentDocuments.length}`} label="dokumenty" />
        <Metric value={`${parentDigitalPasses.length}`} label="aktivní passy" />
      </div>
    </div>
  );
}

function OverviewSection({ onNavigate }: { onNavigate: (section: SectionKey) => void }) {
  const missingDocuments = parentDocuments.filter((document) => document.status !== 'signed');

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <Panel className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ActionTile icon={<Users size={18} />} label="Účastníci" value={`${linkedParticipants.length} profily`} onClick={() => onNavigate('participants')} />
            <ActionTile icon={<WalletCards size={18} />} label="Platby" value="historie + nový nákup" onClick={() => onNavigate('payments')} />
            <ActionTile icon={<FileCheck2 size={18} />} label="Dokumenty" value={`${missingDocuments.length} chybí`} onClick={() => onNavigate('documents')} />
            <ActionTile icon={<MessageSquareText size={18} />} label="Hodnocení" value="hvězdičky" onClick={() => onNavigate('profile')} />
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle icon={<Users size={18} />} title="Děti v rodině" subtitle="rychlý stav produktů, QR a docházky" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {linkedParticipants.map((participant) => (
              <div key={participant.id} className="rounded-[16px] border border-brand-purple/10 bg-brand-paper p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-brand-ink">{participant.firstName} {participant.lastName}</h3>
                    <p className="mt-1 text-xs font-bold text-brand-ink-soft">{participant.activeCourse}</p>
                  </div>
                  <span className="rounded-[16px] bg-white px-3 py-2 text-xs font-black text-brand-purple">Level {participant.level}</span>
                </div>
                <ProgressBar value={participant.xp} max={participant.nextBraceletXp} />
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-brand-ink">
                  <InfoPill label="Náramek" value={participant.bracelet} />
                  <InfoPill label="Docházka" value={`${participant.attendanceDone}/${participant.attendanceTotal}`} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionTitle icon={<Bell size={18} />} title="Upozornění" subtitle="poslední příchody zapsané přes NFC" />
        <div className="mt-4 space-y-3">
          {parentNotifications.map((notification) => (
            <div key={notification.id} className="rounded-[16px] border border-brand-purple/10 bg-white p-4">
              <p className="text-sm font-black leading-6 text-brand-ink">{notification.text}</p>
              <p className="mt-1 text-xs font-bold text-brand-ink-soft">{notification.createdAt} · {notification.method}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ParticipantsSection({
  selectedParticipantId,
  displayName,
  availableProducts,
  onSelectParticipant,
  onOpenDocument,
}: {
  selectedParticipantId: string;
  displayName: string;
  availableProducts: ParentProduct[];
  onSelectParticipant: (id: string) => void;
  onOpenDocument: (document: ParentDocument) => void;
}) {
  const participant = linkedParticipants.find((item) => item.id === selectedParticipantId) ?? linkedParticipants[0];
  const participantName = `${participant.firstName} ${participant.lastName}`;
  const normalizedParticipantName = normalizePersonName(participantName);
  const participantDocuments = parentDocuments.filter((document) => normalizePersonName(document.participantName) === normalizedParticipantName);
  const participantPayments = parentPayments.filter((payment) => normalizePersonName(payment.participantName) === normalizedParticipantName);
  const participantPasses = parentDigitalPasses.filter((pass) => pass.participantId === participant.id);
  const participantAttendance = parentAttendanceHistory.filter((record) => normalizePersonName(record.participantName) === normalizedParticipantName);

  return (
    <div className="space-y-5">
      <AddParticipantPanel displayName={displayName} products={availableProducts} />

      <div className="grid items-stretch gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Panel className="p-4">
          <SectionTitle icon={<Users size={18} />} title="Účastník" subtitle="vyber dítě" />
          <div className="mt-4 grid gap-2">
            {linkedParticipants.map((item) => {
              const active = item.id === participant.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectParticipant(item.id)}
                  className={`rounded-[16px] border p-3 text-left transition-all duration-300 ${active ? 'border-brand-purple bg-brand-purple text-white shadow-brand-soft' : 'border-brand-purple/10 bg-white text-brand-ink hover:-translate-y-0.5 hover:border-brand-purple/24 hover:bg-brand-paper hover:shadow-brand-soft'}`}
                >
                  <span className="block text-sm font-black">{item.firstName} {item.lastName}</span>
                  <span className={`mt-1 block text-xs font-bold ${active ? 'text-white/80' : 'text-brand-ink-soft'}`}>{item.activeCourse}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-brand-purple">{participant.birthNumberMasked}</p>
              <h2 className="mt-1 text-2xl font-black text-brand-ink">{participant.firstName} {participant.lastName}</h2>
              <p className="mt-2 text-sm font-bold text-brand-ink-soft">Další trénink: {participant.nextTraining}</p>
            </div>
            <div className="grid min-w-[220px] grid-cols-2 gap-2">
              <Metric value={`${participant.level}`} label="level" />
              <Metric value={participant.bracelet} label="náramek" />
            </div>
          </div>
          <ProgressBar value={participant.xp} max={participant.nextBraceletXp} />
        </Panel>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <AccordionPanel icon={<PackageCheck size={18} />} title="Aktivní produkty" count={participant.activePurchases.length}>
            {participant.activePurchases.length > 0
              ? participant.activePurchases.map((purchase) => (
                  <Row key={`${purchase.type}-${purchase.title}`} label={purchase.title} value={purchase.status} tone={purchase.status === 'Aktivní' || purchase.status === 'Zaplaceno' ? 'green' : 'purple'} />
                ))
              : <EmptyState text="Žádný aktivní produkt. Novou registraci spustíš v sekci Platby a zaplatíš ji rovnou." />}
          </AccordionPanel>
          <AccordionPanel icon={<WalletCards size={18} />} title="Platby" count={participantPayments.length}>
            {participantPayments.map((payment) => (
              <Row key={payment.id} label={payment.title} value={`${formatCurrency(payment.amount)} · ${payment.dueDate}`} tone={payment.status === 'paid' ? 'green' : 'pink'} />
            ))}
          </AccordionPanel>
        </div>

        <div className="space-y-5">
          <AccordionPanel icon={<FileCheck2 size={18} />} title="Dokumenty" count={participantDocuments.length}>
            {participantDocuments.map((document) => (
              <ParticipantDocumentRow key={document.id} document={document} onOpenDocument={onOpenDocument} />
            ))}
          </AccordionPanel>
          <AccordionPanel icon={<QrCode size={18} />} title="Digitální passy" count={participantPasses.length}>
            {participantPasses.map((pass) => (
              <Row key={pass.id} label={pass.title} value={`${pass.usedEntries}/${pass.totalEntries} vstupů`} tone="cyan" />
            ))}
          </AccordionPanel>
        </div>
      </div>

      <Panel className="p-5">
        <SectionTitle icon={<History size={18} />} title="Docházka" subtitle="záznamy seřazené po měsíciích" />
        <div className="mt-4 grid gap-4">
          {groupByMonthWeb(participantAttendance, (r) => r.date).map(({ label, items }) => (
            <div key={label}>
              <p className="mb-2 border-b border-brand-purple/10 pb-1 text-xs font-black uppercase tracking-wide text-brand-purple">{label}</p>
              <div className="grid gap-2">
                {items.map((record) => (
                  <div key={record.id} className="grid gap-2 rounded-[16px] border border-brand-purple/10 bg-white p-3 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/24 hover:shadow-brand-soft md:grid-cols-[1fr_auto_auto] md:items-center">
                    <span className="font-black text-brand-ink">{record.location}</span>
                    <span className="font-bold text-brand-ink-soft">{record.date} · {record.time}</span>
                    <span className="rounded-[16px] bg-brand-cyan/10 px-3 py-1 text-xs font-black text-brand-cyan">{record.method}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {participantAttendance.length === 0 && <p className="text-sm text-brand-ink-soft">Zatím žádné záznamy docházky.</p>}
        </div>
      </Panel>
    </div>
  );
}

function AddParticipantPanel({ displayName, products }: { displayName: string; products: ParentProduct[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'link' | 'manual'>('link');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthNumber, setBirthNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const courseOptions = useMemo(() => Array.from(new Set(products.filter((product) => product.type === 'Krouzek').map((product) => product.place))), [products]);
  const [preferredCourse, setPreferredCourse] = useState(courseOptions[0] ?? 'Vyškov · ZŠ Nádražní');
  const [parentName, setParentName] = useState(displayName);
  const [parentPhone, setParentPhone] = useState('+420 605 324 417');
  const [emergencyPhone, setEmergencyPhone] = useState('+420 605 324 417');
  const [address, setAddress] = useState('');
  const [departureMode, setDepartureMode] = useState('parent');
  const [authorizedPeople, setAuthorizedPeople] = useState('');
  const [allergies, setAllergies] = useState('Bez známých alergií');
  const [healthLimits, setHealthLimits] = useState('Bez omezení');
  const [medicationNote, setMedicationNote] = useState('Bez pravidelných léků');
  const [coachNote, setCoachNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function lookupParticipant() {
    const normalizedName = normalizePersonName(`${firstName} ${lastName}`);
    const birthSuffix = birthNumber.replace(/\D/g, '').slice(-4);
    const found = linkedParticipants.find((participant) => {
      const participantName = normalizePersonName(`${participant.firstName} ${participant.lastName}`);
      const birthMatches = birthSuffix.length >= 4 && participant.birthNumberMasked.endsWith(birthSuffix);
      return participantName === normalizedName && birthMatches;
    });

    if (found) {
      setMessage(`${found.firstName} ${found.lastName} je v demo databázi nalezený účastník. V produkci se po ověření bezpečně připojí k rodiči.`);
      return;
    }

    setMessage('Účastník se podle jména, příjmení a rodného čísla nenašel. Pokud dítě ještě nemá účet v aplikaci, použij režim bez telefonu a doplň údaje ručně.');
  }

  async function submitManualParticipant() {
    const requiredFields: Array<[string, string]> = [
      ['jméno', firstName],
      ['příjmení', lastName],
      ['datum narození', dateOfBirth],
      ['školní ročník', schoolYear],
      ['jméno rodiče', parentName],
      ['telefon rodiče', parentPhone],
      ['nouzový telefon', emergencyPhone],
      ['adresa', address],
      ['preferovaná lokalita', preferredCourse],
      ['zdravotní omezení', healthLimits],
      ['alergie', allergies],
      ['léky', medicationNote],
    ];
    if (departureMode === 'authorized') requiredFields.push(['pověřené osoby', authorizedPeople]);

    const missing = requiredFields.filter(([, value]) => value.trim().length === 0).map(([label]) => label);
    if (missing.length > 0) {
      setMessage(`Doplň prosím údaje pro profil bez telefonu: ${missing.join(', ')}.`);
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const result = await createManualParticipantProfile({
        firstName,
        lastName,
        birthNumberMasked: birthNumber,
        dateOfBirth,
        schoolYear,
        parentName,
        parentPhone,
        emergencyPhone,
        address,
        preferredCourse,
        departureMode,
        authorizedPeople,
        allergies,
        healthLimits,
        medicationNote,
        coachNote,
      });
      setMessage(`${result.participant.first_name} ${result.participant.last_name} je uložený jako profil bez telefonu pro ${result.participant.active_course}.`);
    } catch (error) {
      setMessage(error instanceof Error ? friendlyBackendError(error.message) : 'Profil bez telefonu se nepodařilo uložit.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel className="overflow-hidden p-3 transition-all duration-300">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-brand-paper/80 p-2.5 text-left transition hover:bg-brand-purple-light"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] transition-colors ${isOpen ? 'bg-brand-purple text-white' : 'bg-white text-brand-purple shadow-sm'}`}>
            <Plus size={24} className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black text-brand-ink sm:text-lg">Přidat účastníka</span>
            <span className="hidden truncate text-xs font-bold text-brand-ink-soft sm:block">Propojit dítě z aplikace nebo vytvořit profil bez telefonu</span>
          </span>
        </span>
        <span className="hidden rounded-[16px] bg-white px-3 py-2 text-xs font-black text-brand-purple shadow-sm sm:inline-flex">
          {isOpen ? 'Skrýt' : 'Otevřít'}
        </span>
      </button>

      <CollapsibleContent open={isOpen} className="pt-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-[16px] border border-brand-purple/10 bg-brand-paper p-1">
            <button type="button" onClick={() => { setMode('link'); setMessage(null); }} className={`rounded-[7px] px-3 py-2 text-xs font-black transition ${mode === 'link' ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-ink-soft hover:text-brand-purple'}`}>
              Propojit účet z aplikace
            </button>
            <button type="button" onClick={() => { setMode('manual'); setMessage(null); }} className={`rounded-[7px] px-3 py-2 text-xs font-black transition ${mode === 'manual' ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-ink-soft hover:text-brand-purple'}`}>
              Vytvořit bez telefonu
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <MiniInput label="Jméno" value={firstName} onChange={setFirstName} placeholder="Eliška" />
            <MiniInput label="Příjmení" value={lastName} onChange={setLastName} placeholder="Nováková" />
            <MiniInput label={mode === 'manual' ? 'Rodné číslo / identifikátor' : 'Rodné číslo'} value={birthNumber} onChange={setBirthNumber} placeholder="****** / 1234" />
            {mode === 'manual' ? <MiniInput label="Datum narození" type="date" value={dateOfBirth} onChange={setDateOfBirth} placeholder="" /> : null}
            {mode === 'manual' ? <MiniInput label="Školní ročník" value={schoolYear} onChange={setSchoolYear} placeholder="5. třída" /> : null}
            {mode === 'manual' ? <MiniSelect label="Preferovaná lokalita" value={preferredCourse} onChange={setPreferredCourse} options={courseOptions.map((course) => ({ value: course, label: course }))} /> : null}
            {mode === 'manual' ? <MiniInput label="Jméno rodiče" value={parentName} onChange={setParentName} placeholder="David Kropáč" /> : null}
            {mode === 'manual' ? <MiniInput label="Telefon rodiče" type="tel" value={parentPhone} onChange={setParentPhone} placeholder="+420 605 324 417" /> : null}
            {mode === 'manual' ? <MiniInput label="Nouzový telefon" type="tel" value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+420 605 324 417" /> : null}
            {mode === 'manual' ? <MiniInput label="Adresa" value={address} onChange={setAddress} placeholder="Ulice, město" /> : null}
            {mode === 'manual' ? <MiniSelect label="Odchod po tréninku" value={departureMode} onChange={setDepartureMode} options={[{ value: 'parent', label: 'Pouze s rodičem' }, { value: 'alone', label: 'Může odejít samo' }, { value: 'authorized', label: 'Jen s pověřenou osobou' }]} /> : null}
            {mode === 'manual' && departureMode === 'authorized' ? <MiniInput label="Pověřené osoby" value={authorizedPeople} onChange={setAuthorizedPeople} placeholder="Jména a telefon" /> : null}
          </div>

          {mode === 'manual' ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <MiniTextarea label="Zdravotní omezení" value={healthLimits} onChange={setHealthLimits} />
              <MiniTextarea label="Alergie" value={allergies} onChange={setAllergies} />
              <MiniTextarea label="Léky" value={medicationNote} onChange={setMedicationNote} />
              <MiniTextarea label="Poznámka pro trenéra" value={coachNote} onChange={setCoachNote} placeholder="Na co si dát pozor, motivace, zkušenosti..." />
            </div>
          ) : null}

          <button type="button" disabled={saving} onClick={mode === 'link' ? lookupParticipant : submitManualParticipant} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-brand-purple px-4 py-3 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {mode === 'link' ? <Search size={17} /> : <UserPlus size={17} />}
            {mode === 'link' ? 'Vyhledat v databázi' : saving ? 'Ukládám profil...' : 'Uložit profil bez telefonu'}
          </button>
          {message ? <p className="mt-3 rounded-[16px] bg-brand-paper p-3 text-sm font-bold leading-6 text-brand-ink-soft">{message}</p> : null}
        </div>

        {mode === 'link' ? (
          <div className="rounded-[16px] border border-brand-cyan/20 bg-brand-cyan/10 p-4">
            <p className="text-xs font-black uppercase text-brand-cyan">Doporučený postup</p>
            <h3 className="mt-2 text-lg font-black text-brand-ink">Nejdřív aplikace, potom propojení</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-brand-ink-soft">Dítě musí mít staženou aplikaci a vlastní registraci. Rodič ho potom dohledá podle jména, příjmení a rodného čísla; pokud záznam existuje, účastník se připojí do rodiny.</p>
          </div>
        ) : (
          <div className="rounded-[16px] border border-brand-pink/20 bg-brand-pink/10 p-4">
            <p className="text-xs font-black uppercase text-brand-pink">Profil bez telefonu</p>
            <h3 className="mt-2 text-lg font-black text-brand-ink">Potřebujeme údaje pro trenéra i dokumenty</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-brand-ink-soft">Bez dětského app účtu se progres a QR triky nebudou zapisovat automaticky, ale trenér pořád potřebuje bezpečnostní, zdravotní a kontaktní údaje.</p>
            <div className="mt-4 grid gap-2 text-sm font-bold leading-6 text-brand-ink-soft">
              <span>Datum narození a školní ročník</span>
              <span>Rodič, telefon a nouzový kontakt</span>
              <span>Zdraví, alergie, léky a odchod z tréninku</span>
              <span>Poznámka pro trenéra před první lekcí</span>
            </div>
          </div>
        )}
      </div>
      </CollapsibleContent>
    </Panel>
  );
}

function PaymentsSection({
  activeProductType,
  productGroups,
  selectedParticipant,
  onProductTypeChange,
  onStartPurchase,
}: {
  activeProductType: ActivityType;
  productGroups: ProductGroup[];
  selectedParticipant?: ParentParticipant;
  onProductTypeChange: (type: ActivityType) => void;
  onStartPurchase: (group: ProductGroup) => void;
}) {
  const visibleGroups = productGroups
    .filter((group) => group.type === activeProductType)
    .sort((a, b) => productSortScore(a, selectedParticipant) - productSortScore(b, selectedParticipant) || a.place.localeCompare(b.place, 'cs'));
  const totalPaid = parentPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <SectionTitle icon={<WalletCards size={18} />} title="Platby a nové produkty" subtitle="aktuální nabídka, lokality a varianty permanentek" />
          <div className="grid grid-cols-3 rounded-[16px] border border-brand-purple/10 bg-brand-paper p-1">
            {paymentTypes.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => onProductTypeChange(type.key)}
                className={`rounded-[7px] px-3 py-2 text-xs font-black transition ${activeProductType === type.key ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-ink-soft hover:text-brand-purple'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        {visibleGroups.map((group) => (
          <ProductGroupCard key={group.id} group={group} onStartPurchase={() => onStartPurchase(group)} />
        ))}
      </div>

      <PaymentHistoryPanel totalPaid={totalPaid} />
    </div>
  );
}

function PaymentHistoryPanel({ totalPaid }: { totalPaid: number }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className={`rounded-[16px] border border-brand-purple/12 bg-white p-5 shadow-brand transition-all duration-300 ${isOpen ? 'shadow-brand-float' : ''}`}>
      <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-4 rounded-[16px] text-left transition-colors hover:bg-brand-paper/60">
        <SectionTitle icon={<History size={18} />} title="Historie plateb" subtitle="úplně dole, můžeš ji kdykoliv skrýt" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[16px] bg-brand-paper px-3 py-2 text-xs font-black text-brand-ink">{parentPayments.length} platby</span>
          <span className="rounded-[16px] bg-brand-paper px-3 py-2 text-xs font-black text-brand-ink">{formatCurrency(totalPaid)}</span>
          <ChevronDown className={`text-brand-purple transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={19} />
        </div>
      </button>
      <CollapsibleContent open={isOpen} className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
        <div className="grid gap-2">
          {parentPayments.map((payment) => (
            <PaymentHistoryRow key={payment.id} payment={payment} />
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <Metric value={`${parentPayments.length}`} label="zaplacené platby" />
          <Metric value={formatCurrency(totalPaid)} label="celkem uhrazeno" />
        </div>
      </CollapsibleContent>
    </section>
  );
}

function groupByMonthWeb<T>(items: T[], getDate: (item: T) => string): { label: string; items: T[] }[] {
  const groups: { key: string; label: string; items: T[] }[] = [];
  for (const item of items) {
    const m = getDate(item).match(/(\d{1,2})\.(\s*)(\d{1,2})\.(\s*)(\d{4})/);
    const key = m ? `${m[5]}-${m[3].padStart(2, '0')}` : 'unknown';
    const label = m
      ? new Date(Number(m[5]), Number(m[3]) - 1, 1).toLocaleString('cs-CZ', { month: 'long', year: 'numeric' })
      : 'Neznámé datum';
    const existing = groups.find((g) => g.key === key);
    if (existing) { existing.items.push(item); }
    else { groups.push({ key, label, items: [item] }); }
  }
  return groups;
}

function PaymentHistoryRow({ payment }: { payment: ParentPayment }) {
  return (
    <div className="grid gap-2 rounded-[16px] border border-brand-purple/10 bg-brand-paper p-3 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/24 hover:bg-white hover:shadow-brand-soft md:grid-cols-[minmax(0,1fr)_140px_120px_110px] md:items-center">
      <div className="min-w-0">
        <p className="truncate font-black text-brand-ink">{payment.title}</p>
        <p className="mt-1 text-xs font-bold text-brand-ink-soft">{payment.participantName} · {payment.method}</p>
      </div>
      <span className="font-black text-brand-ink">{formatCurrency(payment.amount)}</span>
      <span className="text-xs font-bold text-brand-ink-soft">{payment.paidAt}</span>
      <span className="inline-flex justify-center rounded-[16px] bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{paymentStatusLabel(payment.status)}</span>
    </div>
  );
}

function DocumentsSection({ onOpenDocument, onGoToPayments }: { onOpenDocument: (document: ParentDocument) => void; onGoToPayments: () => void }) {
  const missingDocuments = parentDocuments.filter((document) => document.status !== 'signed');

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_0.9fr]">
      <Panel className="p-5">
        <SectionTitle icon={<FileCheck2 size={18} />} title="Povinné dokumenty" subtitle="souhlasy, zdraví, vyzvedávání a táborová potvrzení" />
        <div className="mt-4 grid gap-3">
          {parentDocuments.map((document) => (
            <button
              key={document.id}
              type="button"
              disabled={document.status === 'signed'}
              onClick={() => onOpenDocument(document)}
              className={`grid gap-3 rounded-[16px] border p-4 text-left transition md:grid-cols-[1fr_auto] md:items-center ${document.status === 'signed' ? 'border-brand-purple/10 bg-white' : 'border-brand-purple/20 bg-white hover:border-brand-purple hover:bg-brand-paper'}`}
            >
              <div>
                <p className="text-sm font-black text-brand-ink">{document.title}</p>
                <p className="mt-1 text-xs font-bold text-brand-ink-soft">{document.participantName} · {document.activityTitle} · {activityLabel(document.activityType)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <StatusBadge status={document.status} />
                {document.status !== 'signed' ? <span className="text-xs font-black text-brand-purple">Vyplnit</span> : null}
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<ShieldCheck size={18} />} title="Co je nutné vyplnit" subtitle="kroužek a tábor mají odlišný balíček dokumentů" />
        <div className="mt-4 space-y-4">
          <DocumentChecklist title="Kroužek" productType="Krouzek" />
          <DocumentChecklist title="Tábor" productType="Tabor" />
        </div>
        {missingDocuments.length > 0 ? (
          <button type="button" onClick={() => onOpenDocument(missingDocuments[0])} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-brand-purple px-4 py-3 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep">
            Vyplnit chybějící dokumenty
            <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" onClick={onGoToPayments} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[16px] border border-brand-purple/15 bg-white px-4 py-3 text-sm font-black text-brand-purple transition hover:bg-brand-purple-light">
            Přejít na nabídku aktivit
            <ArrowRight size={17} />
          </button>
        )}
      </Panel>
    </div>
  );
}

function ProfileSection({ displayName, displayEmail, participantName }: { displayName: string; displayEmail: string; participantName: string }) {
  const [selectedCoachId, setSelectedCoachId] = useState(coachReviews[0]?.coachId ?? 'coach-demo');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const reviewableCoaches = useMemo(() => uniqueCoachesFromProducts(), []);
  const selectedCoach = reviewableCoaches.find((coach) => coach.id === selectedCoachId) ?? reviewableCoaches[0];

  async function submitReview() {
    if (!selectedCoach) return;
    setSaving(true);
    setMessage(null);

    try {
      if (hasSupabaseBrowserConfig()) {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from('coach_reviews').insert({
          id: `web-review-${selectedCoach.id}-${Date.now()}`,
          coach_id: selectedCoach.id,
          coach_name: selectedCoach.name,
          parent_id: parentIdFromEmail(displayEmail),
          parent_name: displayName,
          participant_name: participantName,
          rating,
          comment: comment.trim() || `Hodnocení ${rating}/5 z rodičovského portálu.`,
          created_at_text: new Date().toLocaleString('cs-CZ'),
        });
        if (error) throw error;
        setMessage('Hodnocení trenéra je uložené v databázi.');
      } else {
        setMessage('Demo režim: hvězdičkové hodnocení je připravené, po doplnění Supabase env se zapíše do databáze.');
      }
      setComment('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Hodnocení se nepodařilo uložit.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel className="p-5">
        <SectionTitle icon={<UserPlus size={18} />} title="Profil rodiče" subtitle="kontaktní údaje pro platby a dokumenty" />
        <div className="mt-5 space-y-3">
          <ProfileRow label="Jméno" value={displayName} />
          <ProfileRow label="E-mail" value={displayEmail} />
          <ProfileRow label="Telefon" value="+420 605 324 417" />
          <ProfileRow label="Adresa" value="Vyškov, Brněnská 12" />
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<MessageSquareText size={18} />} title="Hodnocení trenéra" subtitle="klikni na hvězdičky a odešli zpětnou vazbu" />
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-black text-brand-ink">
            Trenér
            <select value={selectedCoachId} onChange={(event) => setSelectedCoachId(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-purple">
              {reviewableCoaches.map((coach) => (
                <option key={coach.id} value={coach.id}>{coach.name}</option>
              ))}
            </select>
          </label>
          {selectedCoach ? <CoachReviewProfile coach={selectedCoach} /> : null}
          <StarRating value={rating} onChange={setRating} />
          <label className="grid gap-2 text-sm font-black text-brand-ink">
            Poznámka
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} className="rounded-[16px] border border-brand-purple/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-purple" placeholder="Co se trenérovi povedlo, co zlepšit..." />
          </label>
          <button type="button" disabled={saving} onClick={submitReview} className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-brand-purple px-5 py-3 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:cursor-not-allowed disabled:opacity-60">
            <Star size={17} fill="currentColor" />
            {saving ? 'Ukládám...' : 'Uložit hodnocení'}
          </button>
          {message ? <p className="rounded-[16px] bg-brand-paper px-4 py-3 text-sm font-bold text-brand-ink-soft">{message}</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function ProductGroupCard({ group, onStartPurchase }: { group: ProductGroup; onStartPurchase: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const firstVariant = group.variants[0];
  const priceLabel = group.variants.length > 1
    ? `${formatCurrency(Math.min(...group.variants.map((variant) => variant.price)))} - ${formatCurrency(Math.max(...group.variants.map((variant) => variant.price)))}`
    : firstVariant.priceLabel;
  const remainingSeats = Math.max(group.capacityTotal - group.capacityCurrent, 0);
  const capacityPercent = Math.min(100, Math.round((group.capacityCurrent / group.capacityTotal) * 100));

  return (
    <section className="scroll-mt-6 self-start [perspective:1800px]">
      <div className={`relative transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d] [will-change:transform] ${expanded ? '[transform:rotateY(180deg)]' : ''}`}>
        <div className={`overflow-hidden rounded-[16px] border border-brand-purple/12 bg-white shadow-brand [backface-visibility:hidden] ${expanded ? 'pointer-events-none' : ''}`} aria-hidden={expanded}>
          <div className="relative h-44 bg-brand-purple-light">
            <Image src={group.heroImage} alt={group.title} fill className="object-cover" sizes="(min-width: 1280px) 38vw, 100vw" />
            <div className="absolute left-3 top-3 rounded-[16px] bg-white/95 px-3 py-2 text-xs font-black uppercase text-brand-purple shadow-sm">{activityLabel(group.type)}</div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-brand-ink">{group.title}</h3>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-brand-ink-soft"><MapPin size={16} /> {group.place}</p>
              </div>
              <p className="shrink-0 text-right text-sm font-black text-brand-purple">{priceLabel}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-brand-ink-soft">{group.description}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <InfoPill label="Termín" value={group.primaryMeta} />
              <InfoPill label="Živá kapacita" value={`${group.capacityCurrent}/${group.capacityTotal} dětí`} />
            </div>
            <CapacityBar current={group.capacityCurrent} total={group.capacityTotal} />
            <div className="mt-4 flex flex-wrap gap-2">
              {group.trainingFocus.slice(0, 4).map((focus) => (
                <span key={focus} className="rounded-[16px] bg-brand-cyan/10 px-3 py-2 text-xs font-black text-brand-cyan">{focus}</span>
              ))}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <button type="button" onClick={() => setExpanded(true)} className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-brand-purple/15 px-4 py-3 text-sm font-black text-brand-purple transition hover:bg-brand-purple-light">
                <Camera size={17} />
                Fotky, info a trenéři
                <RefreshCw size={16} />
              </button>
              <button type="button" onClick={onStartPurchase} className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-brand-purple px-4 py-3 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep">
                Zaplatit
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>

        <div className={`absolute inset-0 flex flex-col overflow-hidden rounded-[16px] border border-brand-purple/12 bg-brand-paper shadow-brand [backface-visibility:hidden] [transform:rotateY(180deg)] ${expanded ? '' : 'pointer-events-none'}`} aria-hidden={!expanded}>
          <div className="relative h-32 shrink-0 overflow-hidden bg-brand-purple-light">
            <div className="grid h-full grid-cols-3 gap-1.5 p-1.5">
              {group.gallery.slice(0, 3).map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative overflow-hidden rounded-[16px] bg-white shadow-sm">
                  <Image src={photo} alt={`${group.title} ${index + 1}`} fill className="object-cover" sizes="(min-width: 1280px) 12vw, 33vw" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-purple/10 bg-white p-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-brand-purple">Fotky, info a trenéři</p>
              <h3 className="truncate text-base font-black text-brand-ink">{group.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-brand-ink-soft"><MapPin size={13} /> {group.place}</p>
              <p className="mt-0.5 truncate text-[11px] font-black text-brand-ink-soft">{group.primaryMeta} · {priceLabel}</p>
            </div>
            <button type="button" onClick={() => setExpanded(false)} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[16px] bg-brand-purple px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-brand-purple-deep">
              <RefreshCw size={14} />
              Zpět
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
              <div>
                <h4 className="text-[11px] font-black uppercase text-brand-purple">Důležité informace</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  {group.importantInfo.map((item) => (
                    <DetailInfoCard key={`${item.label}-${item.value}`} label={item.label} value={item.value} />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase text-brand-purple">Trenéři na místě</h4>
                <div className="mt-2 grid gap-2">
                  {group.trainers.length > 0 ? group.trainers.map((trainer) => <TrainerRow key={trainer.id} trainer={trainer} />) : <p className="rounded-[16px] bg-white p-3 text-xs font-bold leading-5 text-brand-ink-soft shadow-sm">Trenér se doplní automaticky po registraci a výběru lokality.</p>}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {group.trainingFocus.slice(0, 4).map((focus) => (
                <span key={focus} className="rounded-[16px] bg-brand-cyan/10 px-2.5 py-1.5 text-[11px] font-black text-brand-cyan">{focus}</span>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-brand-purple/10 bg-white/95 p-3">
            <div className="flex items-center justify-between gap-3 text-xs font-black">
              <span className="text-brand-ink">Aktuálně {group.capacityCurrent}/{group.capacityTotal} dětí</span>
              <span className="text-brand-cyan">{remainingSeats} volných míst</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-purple-light">
              <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${capacityPercent}%` }} />
            </div>
            <button type="button" onClick={onStartPurchase} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-brand-purple px-4 py-3 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep">
              Zaplatit
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PurchaseWizard({ flow, onChange, onClose, onCheckout }: { flow: PurchaseFlow; onChange: (flow: PurchaseFlow) => void; onClose: () => void; onCheckout: () => void }) {
  const selectedProduct = flow.group.variants.find((variant) => variant.id === flow.selectedProductId) ?? flow.group.variants[0];
  const participant = linkedParticipants.find((item) => item.id === flow.participantId) ?? linkedParticipants[0];
  const requiredDocuments = requiredDocumentsForProduct(selectedProduct);
  const isDocumentOnly = flow.mode === 'documents';

  function updateDocuments(values: Partial<DocumentFormValues>) {
    onChange({ ...flow, documentValues: { ...flow.documentValues, ...values }, message: null });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-ink/50 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex max-h-[calc(100dvh-48px)] max-w-5xl flex-col rounded-[16px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-brand-purple/10 p-5">
          <div>
            <p className="text-xs font-black uppercase text-brand-purple">{isDocumentOnly ? 'Doplnění dokumentů' : 'Průvodce platbou'}</p>
            <h2 className="mt-1 text-2xl font-black text-brand-ink">{flow.group.title}</h2>
            <p className="mt-1 text-sm font-bold text-brand-ink-soft">{flow.group.place}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-[16px] p-2 text-brand-ink-soft transition hover:bg-brand-paper hover:text-brand-purple" aria-label="Zavřít">
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {isDocumentOnly ? (
              <WizardBlock number="1" title="Aktivita">
                <div className="rounded-[16px] border border-brand-purple/10 bg-white p-4">
                  <p className="text-sm font-black text-brand-ink">{selectedProduct.title}</p>
                  <p className="mt-1 text-xs font-bold text-brand-ink-soft">{selectedProduct.place} · {selectedProduct.priceLabel}</p>
                </div>
              </WizardBlock>
            ) : (
              <WizardBlock number="1" title="Varianta">
                <div className="grid gap-3 sm:grid-cols-2">
                  {flow.group.variants.map((variant) => {
                    const selected = variant.id === flow.selectedProductId;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => onChange({ ...flow, selectedProductId: variant.id, message: null })}
                        className={`rounded-[16px] border p-4 text-left transition ${selected ? 'border-brand-purple bg-brand-purple text-white' : 'border-brand-purple/10 bg-white text-brand-ink hover:bg-brand-paper'}`}
                      >
                        <span className="block text-sm font-black">{variant.priceLabel}</span>
                        <span className={`mt-1 block text-xs font-bold ${selected ? 'text-white/80' : 'text-brand-ink-soft'}`}>{variant.secondaryMeta}</span>
                      </button>
                    );
                  })}
                </div>
              </WizardBlock>
            )}

            <WizardBlock number="2" title="Účastník">
              <div className="grid gap-3 sm:grid-cols-2">
                {linkedParticipants.map((item) => {
                  const selected = item.id === flow.participantId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChange({ ...flow, participantId: item.id, message: null })}
                      className={`rounded-[16px] border p-4 text-left transition ${selected ? 'border-brand-cyan bg-brand-cyan text-white' : 'border-brand-purple/10 bg-white text-brand-ink hover:bg-brand-paper'}`}
                    >
                      <span className="block text-sm font-black">{item.firstName} {item.lastName}</span>
                      <span className={`mt-1 block text-xs font-bold ${selected ? 'text-white/80' : 'text-brand-ink-soft'}`}>{item.activeCourse}</span>
                    </button>
                  );
                })}
              </div>
            </WizardBlock>

            <WizardBlock number="3" title="Dokumenty">
              {requiredDocuments.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {requiredDocuments.map((document) => (
                      <div key={document.kind} className="rounded-[16px] border border-brand-purple/10 bg-white p-3">
                        <p className="text-xs font-black text-brand-ink">{document.title}</p>
                        <p className="mt-1 text-[11px] leading-4 text-brand-ink-soft">{document.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Jméno rodiče" value={flow.documentValues.parentName} onChange={(value) => updateDocuments({ parentName: value })} />
                    <TextField label="Nouzový telefon" value={flow.documentValues.emergencyPhone} onChange={(value) => updateDocuments({ emergencyPhone: value })} />
                    {selectedProduct.type !== 'Workshop' ? <TextField label="Zdravotní pojišťovna" value={flow.documentValues.insuranceCompany} onChange={(value) => updateDocuments({ insuranceCompany: value })} /> : null}
                    <TextField label="Alergie" value={flow.documentValues.allergies} onChange={(value) => updateDocuments({ allergies: value })} />
                    <TextField label="Léky" value={flow.documentValues.medication} onChange={(value) => updateDocuments({ medication: value })} />
                  </div>
                  <TextareaField label="Zdravotní omezení" value={flow.documentValues.healthLimits} onChange={(value) => updateDocuments({ healthLimits: value })} />
                  {selectedProduct.type !== 'Workshop' ? <TextareaField label="Vyzvedávání a samostatný odchod" value={flow.documentValues.pickupPeople} onChange={(value) => updateDocuments({ pickupPeople: value })} /> : null}
                  <TextareaField label="Poznámka" value={flow.documentValues.notes} onChange={(value) => updateDocuments({ notes: value })} />
                  <div className="grid gap-3">
                    <CheckboxRow label="Potvrzuji GDPR souhlas se zpracováním osobních údajů dítěte a zákonného zástupce." checked={flow.documentValues.gdprConsent} onChange={(checked) => updateDocuments({ gdprConsent: checked })} />
                    {selectedProduct.type !== 'Workshop' ? <CheckboxRow label="Souhlasím jako zákonný zástupce s pravidly, účastí a odpovědností TeamVYS." checked={flow.documentValues.guardianConsent} onChange={(checked) => updateDocuments({ guardianConsent: checked })} /> : null}
                    <CheckboxRow label="Potvrzuji, že zdravotní informace, alergie, léky a nouzový kontakt jsou pravdivé a aktuální." checked={flow.documentValues.healthAccuracy} onChange={(checked) => updateDocuments({ healthAccuracy: checked })} />
                    {selectedProduct.type !== 'Workshop' ? <CheckboxRow label="Potvrzuji pravidla vyzvedávání a případného samostatného odchodu dítěte." checked={flow.documentValues.departureConsent} onChange={(checked) => updateDocuments({ departureConsent: checked })} /> : null}
                    {selectedProduct.type === 'Workshop' ? <CheckboxRow label="Jako zákonný zástupce souhlasím s účastí dítěte na fyzicky náročné aktivitě, s pravidly TeamVYS a storno podmínkami Parkour school." checked={flow.documentValues.workshopTermsAccepted} onChange={(checked) => updateDocuments({ workshopTermsAccepted: checked })} /> : null}
                    {selectedProduct.type === 'Workshop' ? <CheckboxRow label="Zákonný zástupce souhlasí se zveřejněním fotografii a záznamů dítěte z lekcí na internetu a v propagačních materiálech TeamVYS Parkour school." checked={flow.documentValues.photoConsent} onChange={(checked) => updateDocuments({ photoConsent: checked })} /> : null}
                    {selectedProduct.type === 'Tabor' ? <CheckboxRow label="Potvrzuji bezinfekčnost dítěte pro táborový turnus." checked={flow.documentValues.infectionFree} onChange={(checked) => updateDocuments({ infectionFree: checked })} /> : null}
                    {selectedProduct.type === 'Tabor' ? <CheckboxRow label="Potvrzuji, že dítě má táborové věci, kartičku pojišťovny a všechny pokyny jsou přečtené." checked={flow.documentValues.packingConfirmed} onChange={(checked) => updateDocuments({ packingConfirmed: checked })} /> : null}
                  </div>
                </div>
              ) : (
                <p className="rounded-[16px] bg-brand-paper p-4 text-sm font-bold text-brand-ink-soft">Tento produkt nemá před platbou povinný dokumentový balíček. Po zaplacení se vytvoří QR ticket.</p>
              )}
            </WizardBlock>
          </div>

          <aside className="self-start rounded-[16px] border border-brand-purple/10 bg-brand-paper p-4">
            <h3 className="text-sm font-black uppercase text-brand-purple">Souhrn</h3>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Produkt" value={selectedProduct.title} />
              <SummaryRow label="Varianta" value={selectedProduct.priceLabel} />
              <SummaryRow label="Účastník" value={`${participant.firstName} ${participant.lastName}`} />
              <SummaryRow label="Dokumenty" value={requiredDocuments.length ? `${requiredDocuments.length} povinné` : 'bez povinných'} />
            </div>
            {requiredDocuments.length > 0 ? (
              <div className="mt-5 space-y-2">
                {requiredDocuments.map((document) => (
                  <div key={document.kind} className="flex items-start gap-2 rounded-[16px] bg-white p-3">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-brand-cyan" size={17} />
                    <div>
                      <p className="text-xs font-black text-brand-ink">{document.title}</p>
                      <p className="mt-1 text-[11px] leading-4 text-brand-ink-soft">{document.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {flow.message ? <p className="mt-4 rounded-[16px] bg-brand-pink/10 p-3 text-sm font-bold text-brand-pink">{flow.message}</p> : null}
            <button type="button" disabled={flow.isSubmitting} onClick={onCheckout} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-brand-purple px-5 py-3 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:cursor-not-allowed disabled:opacity-60">
              {isDocumentOnly ? <FileCheck2 size={17} /> : <CreditCard size={17} />}
              {flow.isSubmitting ? (isDocumentOnly ? 'Ukládám dokumenty...' : 'Připravuji platbu...') : (isDocumentOnly ? 'Uložit dokumenty' : 'Uložit dokumenty a zaplatit')}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`self-start rounded-[22px] border border-brand-purple/12 bg-white shadow-brand ${className}`}>{children}</section>;
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-[16px] bg-brand-purple-light p-2 text-brand-purple">{icon}</span>
      <div>
        <h2 className="text-lg font-black text-brand-ink">{title}</h2>
        <p className="mt-1 text-sm font-bold text-brand-ink-soft">{subtitle}</p>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[16px] bg-brand-paper px-3 py-3">
      <p className="text-base font-black text-brand-ink">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-brand-ink-soft">{label}</p>
    </div>
  );
}

function ActionTile({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4 text-left transition hover:border-brand-purple/30 hover:bg-white">
      <span className="inline-flex rounded-[14px] bg-white p-2 text-brand-purple">{icon}</span>
      <span className="mt-3 block text-sm font-black text-brand-ink">{label}</span>
      <span className="mt-1 block text-xs font-bold text-brand-ink-soft">{value}</span>
    </button>
  );
}

function MiniInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-black text-brand-ink">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none transition focus:border-brand-purple" />
    </label>
  );
}

function MiniSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="grid gap-2 text-sm font-black text-brand-ink">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none transition focus:border-brand-purple">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function MiniTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-black text-brand-ink">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none transition focus:border-brand-purple" />
    </label>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white px-3 py-3">
      <p className="text-[11px] font-black uppercase text-brand-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-black text-brand-ink">{value}</p>
    </div>
  );
}

function CapacityBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const remaining = Math.max(0, total - current);

  return (
    <div className="mt-3 rounded-[16px] bg-white p-3">
      <div className="flex items-center justify-between gap-3 text-xs font-black">
        <span className="text-brand-ink">Aktuálně {current}/{total} dětí</span>
        <span className="text-brand-cyan">{remaining} volných míst</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-purple-light">
        <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function DetailInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[72px] rounded-[16px] border border-brand-purple/10 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase text-brand-purple">{label}</p>
      <p className="mt-1 text-[13px] font-black leading-5 text-brand-ink">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-[16px] border border-brand-purple/10 bg-white p-3 text-sm font-bold leading-6 text-brand-ink-soft">{text}</p>;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const width = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs font-black text-brand-ink-soft">
        <span>XP {value}</span>
        <span>{max}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function AccordionPanel({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className={`self-start rounded-[22px] border border-brand-purple/12 bg-white p-5 shadow-brand transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-purple/22 hover:shadow-brand-float ${isOpen ? 'shadow-brand' : ''}`}>
      <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[16px] text-left transition-colors duration-300 hover:bg-brand-paper/60">
        <SectionTitle icon={icon} title={title} subtitle={`${count} položek`} />
        <ChevronDown className={`shrink-0 text-brand-purple transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={18} />
      </button>
      <CollapsibleContent open={isOpen} className="mt-4 space-y-2">{children}</CollapsibleContent>
    </section>
  );
}

function CollapsibleContent({ open, children, className = '' }: { open: boolean; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0, y: -8 }}
          animate={{ height: 'auto', opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.985 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={className}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: 'green' | 'pink' | 'purple' | 'cyan' }) {
  const toneClass = {
    green: 'bg-emerald-50 text-emerald-700',
    pink: 'bg-brand-pink/10 text-brand-pink',
    purple: 'bg-brand-purple-light text-brand-purple',
    cyan: 'bg-brand-cyan/10 text-brand-cyan',
  }[tone];

  return (
    <div className="grid gap-2 rounded-[16px] border border-brand-purple/10 bg-white p-3 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/24 hover:shadow-brand-soft sm:grid-cols-[1fr_auto] sm:items-center">
      <span className="font-black text-brand-ink">{label}</span>
      <span className={`rounded-[999px] px-3 py-1 text-xs font-black ${toneClass}`}>{value}</span>
    </div>
  );
}

function ParticipantDocumentRow({ document, onOpenDocument }: { document: ParentDocument; onOpenDocument: (document: ParentDocument) => void }) {
  const isSigned = document.status === 'signed';
  const toneClass = isSigned ? 'bg-emerald-50 text-emerald-700' : document.status === 'draft' ? 'bg-brand-pink/10 text-brand-pink' : 'bg-brand-pink/10 text-brand-pink';
  const content = (
    <>
      <span className="font-black text-brand-ink">{document.title}</span>
      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`rounded-[999px] px-3 py-1 text-xs font-black ${toneClass}`}>{documentStatusLabel(document.status)}</span>
        {!isSigned ? <span className="rounded-[999px] bg-brand-purple-light px-3 py-1 text-xs font-black text-brand-purple">Doplnit</span> : null}
      </span>
    </>
  );

  if (isSigned) {
    return (
      <div className="grid gap-2 rounded-[16px] border border-brand-purple/10 bg-white p-3 text-sm transition-all duration-300 sm:grid-cols-[1fr_auto] sm:items-center">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenDocument(document)}
      className="grid w-full gap-2 rounded-[16px] border border-brand-purple/10 bg-white p-3 text-left text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple hover:bg-brand-paper hover:shadow-brand-soft sm:grid-cols-[1fr_auto] sm:items-center"
    >
      {content}
    </button>
  );
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const classes = status === 'signed'
    ? 'bg-emerald-50 text-emerald-700'
    : status === 'draft'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-brand-pink/10 text-brand-pink';
  return <span className={`inline-flex items-center justify-center rounded-[999px] px-3 py-2 text-xs font-black ${classes}`}>{documentStatusLabel(status)}</span>;
}

function DocumentChecklist({ title, productType }: { title: string; productType: ActivityType }) {
  const sampleProduct = parentProducts.find((product) => product.type === productType);
  const documents = sampleProduct ? requiredDocumentsForProduct(sampleProduct) : [];

  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-white p-4">
      <h3 className="text-sm font-black text-brand-ink">{title}</h3>
      <div className="mt-3 grid gap-2">
        {documents.map((document) => (
          <div key={document.kind} className="flex gap-2 rounded-[16px] bg-brand-paper px-3 py-2 text-xs leading-5 text-brand-ink-soft">
            <Check size={15} className="mt-0.5 shrink-0 text-brand-cyan" />
            <span><strong className="text-brand-ink">{document.title}</strong> · {document.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainerRow({ trainer }: { trainer: ParentProductTrainer }) {
  return (
    <div className="grid items-center gap-3 rounded-[16px] bg-white p-3 shadow-sm sm:grid-cols-[42px_minmax(0,1fr)_auto]">
      <Image src={trainer.profilePhotoUrl} alt={trainer.name} width={42} height={42} className="h-[42px] w-[42px] rounded-[14px] bg-brand-purple-light object-contain p-1.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-5 text-brand-ink">{trainer.name}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-brand-ink-soft"><Phone size={13} /> <span className="truncate">{trainer.phone}</span></p>
      </div>
      <div className="w-full rounded-[16px] bg-brand-cyan/10 px-3 py-2 text-left sm:w-auto sm:min-w-[82px] sm:text-center">
        <p className="text-sm font-black text-brand-cyan">{trainer.qrTricksApproved}</p>
        <p className="text-[9px] font-black uppercase text-brand-cyan">QR triků</p>
      </div>
    </div>
  );
}

function CoachReviewProfile({ coach }: { coach: ParentProductTrainer }) {
  return (
    <div className="grid items-center gap-3 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4 sm:grid-cols-[64px_minmax(0,1fr)_auto]">
      <Image src={coach.profilePhotoUrl} alt={coach.name} width={64} height={64} className="h-16 w-16 rounded-[18px] bg-white object-contain p-2 shadow-sm" />
      <div className="min-w-0">
        <p className="text-base font-black text-brand-ink">{coach.name}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-brand-ink-soft"><Phone size={13} /> <span>{coach.phone}</span></p>
        <p className="mt-1 truncate text-xs font-bold text-brand-ink-soft">{coach.locations.join(' · ')}</p>
      </div>
      <div className="rounded-[16px] bg-white px-3 py-2 text-left shadow-sm sm:text-center">
        <p className="text-sm font-black text-brand-cyan">{coach.qrTricksApproved}</p>
        <p className="text-[9px] font-black uppercase text-brand-cyan">QR triků</p>
      </div>
    </div>
  );
}

function WizardBlock({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-[12px] bg-brand-purple text-xs font-black text-white">{number}</span>
        <h3 className="text-base font-black text-brand-ink">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-brand-ink">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-purple" />
    </label>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-brand-ink">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="rounded-[16px] border border-brand-purple/15 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-brand-purple" />
    </label>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-brand-purple/10 bg-white p-4 text-sm font-bold text-brand-ink-soft">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 accent-brand-purple" />
      <span>{label}</span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-brand-purple/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-black uppercase text-brand-ink-soft">{label}</span>
      <span className="text-right text-sm font-black text-brand-ink">{value}</span>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
      <p className="text-sm font-black text-brand-ink">Hodnocení</p>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <button key={item} type="button" onClick={() => onChange(item)} className="rounded-[14px] bg-white p-2 text-brand-purple transition hover:scale-105" aria-label={`${item} hvězdiček`}>
            <Star size={28} fill={item <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
      <p className="text-xs font-black uppercase text-brand-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-black text-brand-ink">{value}</p>
    </div>
  );
}

function buildProductGroups(products: ParentProduct[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();

  for (const product of products) {
    const id = product.type === 'Krouzek' ? product.id.replace(/-15$/, '') : product.id;
    const existing = groups.get(id);

    if (existing) {
      existing.variants.push(product);
      existing.gallery = Array.from(new Set([...existing.gallery, ...product.gallery]));
      continue;
    }

    groups.set(id, {
      id,
      type: product.type,
      title: product.type === 'Krouzek' ? `${product.title} · ${product.venue}` : product.title,
      city: product.city,
      place: product.place,
      venue: product.venue,
      primaryMeta: product.primaryMeta,
      secondaryMeta: product.secondaryMeta,
      description: product.description,
      badge: product.badge,
      heroImage: product.heroImage,
      gallery: product.gallery.length ? product.gallery : [product.heroImage],
      capacityTotal: product.capacityTotal,
      capacityCurrent: product.capacityCurrent,
      importantInfo: product.importantInfo,
      trainingFocus: product.trainingFocus,
      trainers: trainersForProduct(product),
      variants: [product],
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    variants: group.variants.sort((a, b) => (a.entriesTotal ?? a.price) - (b.entriesTotal ?? b.price)),
  }));
}

function productSortScore(group: ProductGroup, participant?: ParentParticipant) {
  if (!participant) return group.type === 'Krouzek' && normalizeLocation(group.city) === 'vyskov' ? 1 : 2;

  const participantCourse = normalizeLocation(participant.activeCourse);
  const groupPlace = normalizeLocation(group.place);
  const groupCity = normalizeLocation(group.city);

  if (participantCourse && groupPlace === participantCourse) return 0;
  if (participantCourse && participantCourse.includes(groupCity)) return 1;
  if (groupCity === 'vyskov') return 2;
  return 3;
}

function findDocumentTarget(document: ParentDocument, groups: ProductGroup[]) {
  const participant = linkedParticipants.find((item) => normalizePersonName(`${item.firstName} ${item.lastName}`) === normalizePersonName(document.participantName)) ?? linkedParticipants[0];
  const participantCourse = normalizeLocation(participant.activeCourse);
  const activityTitle = normalizeLocation(document.activityTitle);

  const matchingGroup = groups.find((group) => {
    if (group.type !== document.activityType) return false;
    const groupPlace = normalizeLocation(group.place);
    const groupTitle = normalizeLocation(group.title);
    const groupCity = normalizeLocation(group.city);

    if (document.activityType === 'Krouzek' && participantCourse && groupPlace === participantCourse) return true;
    return activityTitle.includes(groupCity) || groupTitle.includes(activityTitle) || activityTitle.includes(groupTitle);
  }) ?? groups.find((group) => group.type === document.activityType);

  if (!matchingGroup || !participant) return null;

  const product = matchingGroup.variants.find((variant) => {
    if (document.activityType === 'Krouzek') return variant.entriesTotal === 10;
    return true;
  }) ?? matchingGroup.variants[0];

  return { group: matchingGroup, product, participant };
}

async function saveRequiredDocuments(product: ParentProduct, participant: { id: string; firstName: string; lastName: string }, values: DocumentFormValues, documents: RequiredDocumentTemplate[]) {
  if (documents.length === 0) return;
  if (isAdminCreatedProduct(product)) return;

  const participantName = `${participant.firstName} ${participant.lastName}`;
  await saveCourseDocuments({
    productId: product.id,
    participantId: participant.id,
    participantName,
    participantFirstName: participant.firstName,
    participantLastName: participant.lastName,
    birthNumberMasked: linkedParticipants.find((item) => item.id === participant.id)?.birthNumberMasked,
    documents: documents.map((document) => ({
      kind: document.kind,
      title: document.title,
      parentName: values.parentName,
      payload: documentPayload(document, product, participantName, values),
    })),
  });
}

function validateRequiredDocuments(product: ParentProduct, values: DocumentFormValues, documents: RequiredDocumentTemplate[]) {
  if (documents.length === 0) return null;

  const isWorkshop = product.type === 'Workshop';
  const requiredFields: Array<[string, string]> = isWorkshop
    ? [
        ['jméno rodiče', values.parentName],
        ['nouzový telefon', values.emergencyPhone],
        ['alergie', values.allergies],
        ['léky', values.medication],
        ['zdravotní omezení', values.healthLimits],
      ]
    : [
        ['jméno rodiče', values.parentName],
        ['nouzový telefon', values.emergencyPhone],
        ['zdravotní pojišťovna', values.insuranceCompany],
        ['alergie', values.allergies],
        ['léky', values.medication],
        ['zdravotní omezení', values.healthLimits],
        ['vyzvedávání a odchod', values.pickupPeople],
      ];
  const missing = requiredFields.filter(([, value]) => value.trim().length === 0).map(([label]) => label);
  if (missing.length > 0) return `Vyplň prosím všechny dokumenty: ${missing.join(', ')}.`;

  const requiredKinds = new Set(documents.map((document) => document.kind));
  if (requiredKinds.has('gdpr') && !values.gdprConsent) return 'Potvrď prosím GDPR souhlas.';
  if (requiredKinds.has('guardian-consent') && !values.guardianConsent) return 'Potvrď prosím souhlas zákonného zástupce.';
  if (requiredKinds.has('health') && !values.healthAccuracy) return 'Potvrď prosím pravdivost zdravotních informací.';
  if (requiredKinds.has('departure') && !values.departureConsent) return 'Potvrď prosím pravidla vyzvedávání a odchodu.';
  if (product.type === 'Tabor' && requiredKinds.has('infection-free') && !values.infectionFree) return 'U tábora je potřeba potvrdit bezinfekčnost.';
  if (product.type === 'Tabor' && requiredKinds.has('packing') && !values.packingConfirmed) return 'U tábora je potřeba potvrdit věci s sebou a pokyny.';
  if (isWorkshop && requiredKinds.has('workshop-terms') && !values.workshopTermsAccepted) return 'Potvrď prosím přihlášku a podmínky workshopu.';
  if (isWorkshop && requiredKinds.has('workshop-terms') && !values.photoConsent) return 'Potvrď prosím souhlas s focením a natáčením.';

  return null;
}

function documentPayload(document: RequiredDocumentTemplate, product: ParentProduct, participantName: string, values: DocumentFormValues) {
  const common = {
    documentKind: document.kind,
    documentTitle: document.title,
    productId: product.id,
    productTitle: product.title,
    activityType: product.type,
    productPlace: product.place,
    participantName,
    parentName: values.parentName,
    emergencyPhone: values.emergencyPhone,
    notes: values.notes,
  };

  if (document.kind === 'gdpr') {
    return {
      ...common,
      dataProcessingConsent: values.gdprConsent,
      scope: 'osobní údaje dítěte a zákonného zástupce pro TeamVYS aktivitu',
    };
  }

  if (document.kind === 'guardian-consent') {
    return {
      ...common,
      guardianConsent: values.guardianConsent,
      rulesAccepted: values.guardianConsent,
      activityConsent: values.guardianConsent,
    };
  }

  if (document.kind === 'health') {
    return {
      ...common,
      insuranceCompany: values.insuranceCompany,
      healthLimits: values.healthLimits,
      allergies: values.allergies,
      medication: values.medication,
      healthAccuracy: values.healthAccuracy,
    };
  }

  if (document.kind === 'departure') {
    return {
      ...common,
      pickupPeople: values.pickupPeople,
      departureConsent: values.departureConsent,
    };
  }

  if (document.kind === 'infection-free') {
    return {
      ...common,
      infectionFree: values.infectionFree,
      declaredFor: product.title,
    };
  }

  if (document.kind === 'packing') {
    return {
      ...common,
      packingConfirmed: values.packingConfirmed,
      medication: values.medication,
      insuranceCompany: values.insuranceCompany,
    };
  }

  if (document.kind === 'workshop-terms') {
    return {
      ...common,
      workshopTermsAccepted: values.workshopTermsAccepted,
      photoConsent: values.photoConsent,
      guardianConsent: values.workshopTermsAccepted,
      stornoConditions: 'Storno podmínky TeamVYS Parkour school · bez nároku na náhradu při odhlašování do 48 h před začátkem.',
    };
  }

  return common;
}

function defaultDocumentValues(displayName: string): DocumentFormValues {
  return {
    parentName: displayName,
    emergencyPhone: '+420 605 324 417',
    insuranceCompany: 'VZP 111',
    healthLimits: 'Bez omezení',
    allergies: 'Žádné známé alergie',
    medication: 'Bez pravidelných léků',
    pickupPeople: displayName,
    notes: '',
    gdprConsent: false,
    guardianConsent: false,
    healthAccuracy: false,
    departureConsent: false,
    infectionFree: false,
    packingConfirmed: false,
    photoConsent: false,
    workshopTermsAccepted: false,
  };
}

function uniqueCoachesFromProducts() {
  const coaches = new Map<string, ParentProductTrainer>();
  for (const product of parentProducts) {
    for (const trainer of trainersForProduct(product)) coaches.set(trainer.id, trainer);
  }
  return Array.from(coaches.values());
}

function parentIdFromEmail(email: string) {
  return `web-parent-${email.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'demo'}`;
}

function friendlyBackendError(message: string) {
  if (message.includes('Missing SUPABASE_URL') || message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return 'Backend nemá nastavené Supabase klíče, takže dokumenty teď nejdou zapsat do databáze. Doplň SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY v server/.env.';
  }

  if (message.includes('Missing STRIPE_SECRET_KEY')) {
    return 'Backend nemá nastavený Stripe secret key, takže po uložení dokumentů nejde vytvořit platební checkout.';
  }

  return message;
}

function normalizeLocation(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/zs/g, 'zs')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizePersonName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value);
}

function documentStatusLabel(status: DocumentStatus) {
  if (status === 'signed') return 'Podepsáno';
  if (status === 'draft') return 'Rozepsáno';
  return 'Chybí';
}

function headlineForSection(section: SectionKey) {
  switch (section) {
    case 'participants':
      return 'Účastníci, docházka a aktivní produkty';
    case 'payments':
      return 'Platby rozdělené podle typu produktu';
    case 'documents':
      return 'Dokumenty, které musí být v pořádku';
    case 'profile':
      return 'Profil rodiče a hodnocení trenérů';
    default:
      return 'Rodinný přehled TeamVYS';
  }
}

function subheadlineForSection(section: SectionKey, participantName: string) {
  switch (section) {
    case 'participants':
      return `${participantName}: aktivní permanentky, dokumenty, passy a poslední docházka bez dlouhé jedné stránky.`;
    case 'payments':
      return 'Kroužky, tábory a workshopy jsou oddělené do přehledných nabídek s dokumenty a platbou v návaznosti.';
    case 'documents':
      return 'Povinné souhlasy a zdravotní údaje jsou svázané s konkrétním dítětem i aktivitou.';
    case 'profile':
      return 'Rodič může upravit kontakty a ohodnotit trenéra hvězdičkami.';
    default:
      return 'Krátké akce, upozornění a stav všech dětí na jednom místě.';
  }
}
