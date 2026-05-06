'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Banknote,
    BarChart2,
    Bell,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Eye,
    FileCheck2,
    FileText,
    Film,
    Gauge,
    History,
    ImagePlus,
    LayoutDashboard,
    ListChecks,
    Mail,
    MapPin,
    Menu,
    PackagePlus,
    Pencil,
    Phone,
    Plus,
    Receipt,
    Search,
    Send,
    ShieldCheck,
    SlidersHorizontal,
    Trash2,
    TrendingDown,
    TrendingUp,
    Trophy,
    UserCheck,
    Users,
    X
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { TeamVysLogo } from '@/components/brand/team-vys-logo';
import { useAdminCreatedProducts, type AdminProductInput } from '@/lib/admin-created-products';
import { createCoachStripeOnboarding, saveCoachAttendance, sendTrainerPayout, type TrainerPayoutTransfer } from '@/lib/api-client';
import {
    CAMP_DAILY_RATE,
    CAMP_MAX_COACHES,
    WORKSHOP_HOURLY_RATE,
    WORKSHOP_MAX_COACHES,
    activityLabel,
    adminActivityRows,
    adminAttendanceAdjustments,
    adminCoachAccessRequests,
    adminCoachAttendance,
    adminCoachDppDocuments,
    adminCoachSummaries,
    adminPaymentRows,
    campTurnusy,
    coachDppTemplateClauses,
    courseEnrollments,
    currency,
    documentStatusLabel,
    linkedParticipants,
    parentAttendanceHistory,
    parentDocuments,
    parentPayments,
    parentProducts,
    parentProfile,
    requiredDocumentsForProduct,
    sharedTrainingCalendar,
    trainersForProduct,
    workshopAttendanceRecords,
    workshopCalendar,
    type ActivityType,
    type AdminCoachDppDocument,
    type AdminCoachSummary,
    type CampTurnus,
    type CoachDppStatus,
    type DocumentStatus,
    type ParentDocument,
    type ParentParticipant,
    type ParentProduct,
    type SharedTrainingSlot,
    type WorkshopAttendanceRecord,
    type WorkshopCity,
    type WorkshopSlot
} from '@/lib/portal-content';

export type AdminFinanceResponse = {
  purchases?: Array<{ id: string; title: string; participant_name: string; amount: number; status: string; paid_at: string }>;
  payoutTransfers?: AdminFinanceTransfer[];
  coaches?: Array<{ id: string; level: number; xp: number; qr_tricks_approved: number; stripe_account_id: string | null }>;
};

type AdminFinanceTransfer = {
  id: string;
  coach_id?: string;
  coach_name: string;
  amount: number;
  period_key: string;
  status: string;
  created_at_text?: string;
  stripe_transfer_id?: string | null;
};

type AdminDashboardProps = {
  finance: AdminFinanceResponse | null;
  financeError: string | null;
  showSignOut: boolean;
  devMode: boolean;
};

type SectionKey = 'overview' | 'attendance' | 'participants' | 'products' | 'coaches' | 'payouts' | 'invoices' | 'finance';

type Invoice = {
  id: string;
  supplier: string;
  description: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
  category: 'Tělocvična' | 'Vybavení' | 'Marketing' | 'Ostatní';
};

const demoInvoices: Invoice[] = [
  { id: 'inv-001', supplier: 'ZŠ Nádražní Vyškov', description: 'Pronájem tělocvičny – duben 2026', amount: 3200, issuedDate: '2026-04-30', dueDate: '2026-05-14', paid: false, category: 'Tělocvična' },
  { id: 'inv-002', supplier: 'ZŠ Nádražní Vyškov', description: 'Pronájem tělocvičny – březen 2026', amount: 3200, issuedDate: '2026-03-31', dueDate: '2026-04-14', paid: true, paidDate: '2026-04-10', category: 'Tělocvična' },
  { id: 'inv-003', supplier: 'Orel jednota Vyškov', description: 'Pronájem haly – tábor léto 2026', amount: 8500, issuedDate: '2026-04-15', dueDate: '2026-05-01', paid: false, category: 'Tělocvična' },
  { id: 'inv-004', supplier: 'Sportovní sklad Praha', description: 'Nákup matrací a překážek', amount: 14200, issuedDate: '2026-04-01', dueDate: '2026-04-15', paid: true, paidDate: '2026-04-14', category: 'Vybavení' },
  { id: 'inv-005', supplier: 'ZŠ Prostějov', description: 'Pronájem tělocvičny – duben 2026', amount: 2800, issuedDate: '2026-04-30', dueDate: '2026-05-14', paid: false, category: 'Tělocvična' },
];
type AdminPaymentRow = {
  id: string;
  title: string;
  participantName: string;
  amount: number;
  status: string;
  dueDate: string;
};

type CoachAttendanceRecord = {
  id: string;
  coachId?: string;
  coachName: string;
  sessionTitle: string;
  date: string;
  present?: string;
  durationHours: number;
  amount: number;
  reason: string;
  source: 'coach' | 'admin';
};

type ManualCoachAttendanceInput = {
  coachId: string;
  coachName: string;
  sessionTitle: string;
  date: string;
  present?: string;
  durationHours: number;
  hourlyRate: number;
  reason: string;
};

type ParticipantGroup = {
  key: string;
  type: ActivityType;
  title: string;
  place: string;
  product: ParentProduct;
  participants: ParentParticipant[];
};

type ParticipantCityGroup = {
  key: string;
  city: string;
  groups: ParticipantGroup[];
  participantCount: number;
  missingDocuments: number;
};

type ParticipantTermGroup = {
  key: string;
  term: string;
  groups: ParticipantGroup[];
  participantCount: number;
  missingDocuments: number;
};

type ParticipantDetailState = {
  participant: ParentParticipant;
  activityType: ActivityType;
  place: string;
};

type ParticipantDetailTab = 'documents' | 'attendance' | 'skills' | 'contacts' | 'products';

type ActivityParticipantRecord = {
  id: string;
  name: string;
  subtitle: string;
  level: string;
  attendance: string;
  documents: string;
  parentContact: string;
  participant?: ParentParticipant;
};

type CoachPlacementGroup = {
  key: string;
  type: ActivityType;
  title: string;
  place: string;
  primaryMeta: string;
  coaches: AdminCoachSummary[];
};

type SharedTrainingState = Record<string, Pick<SharedTrainingSlot, 'assignedCoachId' | 'assignedCoachName' | 'secondCoachId' | 'secondCoachName' | 'releasedBy' | 'releaseReason' | 'updatedAt'>>;

const sections: Array<{ key: SectionKey; label: string; description: string; icon: ReactNode }> = [
  { key: 'overview', label: 'Přehled', description: 'co hoří', icon: <LayoutDashboard size={18} /> },
  { key: 'attendance', label: 'Docházka', description: 'kroužky a děti', icon: <ClipboardList size={18} /> },
  { key: 'participants', label: 'Účastníci', description: 'celý seznam', icon: <Users size={18} /> },
  { key: 'products', label: 'Produkty', description: 'nabídka webu', icon: <PackagePlus size={18} /> },
  { key: 'coaches', label: 'Trenéři', description: 'data a výkon', icon: <UserCheck size={18} /> },
  { key: 'payouts', label: 'Výplaty', description: 'Stripe sandbox', icon: <Banknote size={18} /> },
  { key: 'invoices', label: 'Faktury', description: 'výdaje a platby', icon: <Receipt size={18} /> },
  { key: 'finance', label: 'Finance', description: 'cash flow přehled', icon: <TrendingUp size={18} /> },
];

const payoutPeriod = {
  key: '2026-04',
  label: 'duben 2026',
  periodStart: '2026-04-01',
  periodEnd: '2026-04-30',
};

export function AdminDashboard({ finance, financeError, showSignOut, devMode }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceQuery, setAttendanceQuery] = useState('');
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payingCoachId, setPayingCoachId] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<TrainerPayoutTransfer[]>(() => normalizeFinanceTransfers(finance?.payoutTransfers ?? []));
  const [onboardingLinks, setOnboardingLinks] = useState<Record<string, string>>({});
  const [generatingOnboarding, setGeneratingOnboarding] = useState<string | null>(null);
  const [coachAttendanceRecords, setCoachAttendanceRecords] = useState<CoachAttendanceRecord[]>(() => buildInitialCoachAttendanceRecords());
  const [coachDppDocuments, setCoachDppDocuments] = useState<AdminCoachDppDocument[]>(() => adminCoachDppDocuments);
  const [sharedTrainingState, setSharedTrainingState] = useState<SharedTrainingState>(() => buildInitialSharedTrainingState());
  const [workshopSlots, setWorkshopSlots] = useState<WorkshopSlot[]>(workshopCalendar);
  const [campTurnusyState, setCampTurnusyState] = useState<CampTurnus[]>(campTurnusy);
  const [keyRequests, setKeyRequests] = useState(() => adminCoachAccessRequests);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<ReturnType<typeof adminActivityRows>[number] | null>(null);
  const [selectedParticipantDetail, setSelectedParticipantDetail] = useState<ParticipantDetailState | null>(null);
  const { products: adminCreatedProducts, addProduct: addAdminCreatedProduct, removeProduct: removeAdminCreatedProduct } = useAdminCreatedProducts();
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);

  const allProducts = useMemo(() => [...parentProducts, ...adminCreatedProducts], [adminCreatedProducts]);
  const paymentRows = useMemo(() => buildPaymentRows(finance), [finance]);
  const activityRows = useMemo(() => adminActivityRows(allProducts), [allProducts]);
  const coaches = useMemo(() => mergeCoachData(finance), [finance]);
  const sharedTrainingSlots = useMemo(() => resolveSharedTrainingSlots(sharedTrainingState), [sharedTrainingState]);
  const totals = useMemo(() => buildTotals(paymentRows, activityRows, coaches, transfers, coachAttendanceRecords), [paymentRows, activityRows, coaches, transfers, coachAttendanceRecords]);
  const currentSection = sections.find((section) => section.key === activeSection) ?? sections[0];

  function selectSection(section: SectionKey) {
    setActiveSection(section);
    setMobileMenuOpen(false);
  }

  function handleAddCoachAttendance(input: ManualCoachAttendanceInput) {
    const record: CoachAttendanceRecord = {
      id: `admin-att-${input.coachId}-${Date.now()}`,
      coachId: input.coachId,
      coachName: input.coachName,
      sessionTitle: input.sessionTitle,
      date: input.date,
      present: input.present,
      durationHours: input.durationHours,
      amount: Math.round(input.durationHours * input.hourlyRate),
      reason: input.reason || 'Doplněno administrátorem po zapomenutém zápisu trenéra.',
      source: 'admin',
    };

    setCoachAttendanceRecords((current) => [record, ...current]);
    return record;
  }

  function handleCreateCoachDpp(coach: AdminCoachSummary) {
    const existing = coachDppDocuments.find((document) => document.coachId === coach.id);
    const document = existing ? { ...existing, status: 'sent' as const, updatedAt: '1. 5. 2026', digitalEnvelopeId: existing.digitalEnvelopeId ?? `DPP-VYS-2026-${coach.id.toUpperCase()}` } : buildCoachDppDocument(coach, 'sent');

    setCoachDppDocuments((current) => [document, ...current.filter((item) => item.coachId !== coach.id)]);
    return document;
  }

  function handleMarkCoachDppSigned(coachId: string) {
    setCoachDppDocuments((current) => current.map((document) => document.coachId === coachId ? { ...document, status: 'signed', signedAt: '1. 5. 2026 · digitálně', updatedAt: '1. 5. 2026' } : document));
  }

  function handleReleaseSharedTraining(slot: SharedTrainingSlot, position: 'first' | 'second' = 'first') {
    const coachName = position === 'first' ? (slot.assignedCoachName ?? slot.regularCoachName) : (slot.secondCoachName ?? '');
    setSharedTrainingState((current) => ({
      ...current,
      [slot.id]: {
        ...current[slot.id],
        ...(position === 'first'
          ? { assignedCoachId: undefined, assignedCoachName: undefined }
          : { secondCoachId: undefined, secondCoachName: undefined }),
        releasedBy: coachName,
        releaseReason: `${coachName} nemůže dorazit. Slot čeká na náhradního trenéra.`,
        updatedAt: `dnes ${new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`,
      },
    }));
  }

  function handleAssignSharedTraining(slot: SharedTrainingSlot, coach: AdminCoachSummary) {
    const hasFirst = Boolean(slot.assignedCoachId);
    setSharedTrainingState((current) => ({
      ...current,
      [slot.id]: {
        ...current[slot.id],
        ...(hasFirst
          ? { secondCoachId: coach.id, secondCoachName: coach.name }
          : { assignedCoachId: coach.id, assignedCoachName: coach.name }),
        releasedBy: undefined,
        releaseReason: undefined,
        updatedAt: `přiřazeno dnes ${new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`,
      },
    }));
  }

  function handleAddWorkshopCoach(slot: WorkshopSlot, coach: AdminCoachSummary) {
    if (slot.coaches.length >= slot.maxCoaches) return;
    if (slot.coaches.some((c) => c.coachId === coach.id)) return;
    setWorkshopSlots((prev) => prev.map((s) => s.id !== slot.id ? s : {
      ...s,
      coaches: [...s.coaches, { coachId: coach.id, coachName: coach.name }],
      updatedAt: new Date().toLocaleDateString('cs-CZ'),
    }));
  }
  function handleRemoveWorkshopCoach(slot: WorkshopSlot, coachId: string) {
    setWorkshopSlots((prev) => prev.map((s) => s.id !== slot.id ? s : {
      ...s,
      coaches: s.coaches.filter((c) => c.coachId !== coachId),
      updatedAt: new Date().toLocaleDateString('cs-CZ'),
    }));
  }
  function handleAddWorkshopSlot(date: string, city: WorkshopCity) {
    const id = `ws-${city.toLowerCase()}-${date}-${Date.now()}`;
    const d = new Date(date); d.setDate(d.getDate() + 1);
    const dateTo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setWorkshopSlots((prev) => [...prev, { id, date, dateTo, time: '10:00 - 17:00', city, venue: `TBD – ${city} centrum`, coaches: [], maxCoaches: WORKSHOP_MAX_COACHES, updatedAt: new Date().toLocaleDateString('cs-CZ') }]);
  }

  function handleAddCampCoach(turnus: CampTurnus, coach: AdminCoachSummary) {
    if (turnus.coaches.length >= turnus.maxCoaches) return;
    if (turnus.coaches.some((c) => c.coachId === coach.id)) return;
    setCampTurnusyState((prev) => prev.map((t) => t.id !== turnus.id ? t : {
      ...t,
      coaches: [...t.coaches, { coachId: coach.id, coachName: coach.name }],
    }));
  }
  function handleRemoveCampCoach(turnus: CampTurnus, coachId: string) {
    setCampTurnusyState((prev) => prev.map((t) => t.id !== turnus.id ? t : {
      ...t,
      coaches: t.coaches.filter((c) => c.coachId !== coachId),
    }));
  }

  function openParticipantDetail(participant: ParentParticipant, activityType: ActivityType = 'Krouzek', place = participant.activeCourse) {
    setSelectedActivityDetail(null);
    setSelectedParticipantDetail({ participant, activityType, place });
    setActiveSection('participants');
  }

  async function handlePayout(coach: AdminCoachSummary) {
    const amount = payoutAmountForCoach(coach, coachAttendanceRecords);
    const stripeAccountId = coach.stripeAccountId?.trim() ?? '';

    if (!stripeAccountId.startsWith('acct_')) {
      setPayoutMessage(`${coach.name} ještě nemá dokončený Stripe onboarding.`);
      return;
    }

    if (amount <= 0) {
      setPayoutMessage(`${coach.name} nemá za ${payoutPeriod.label} nic k výplatě.`);
      return;
    }

    const confirmed = window.confirm(`Odeslat Stripe transfer ${currency(amount)} pro ${coach.name} za ${payoutPeriod.label}?`);
    if (!confirmed) return;

    setPayingCoachId(coach.id);
    setPayoutMessage(null);

    try {
      const result = await sendTrainerPayout({
        coachId: coach.id,
        coachName: coach.name,
        periodKey: payoutPeriod.key,
        periodStart: payoutPeriod.periodStart,
        periodEnd: payoutPeriod.periodEnd,
        stripeAccountId,
        amount,
      });

      setTransfers((current) => [
        result.transfer,
        ...current.filter((transfer) => !(transfer.coachId === coach.id && transfer.periodKey === payoutPeriod.key)),
      ]);
      setPayoutMessage(`Výplata pro ${coach.name} za ${payoutPeriod.label} je odeslaná.`);
    } catch (error) {
      setPayoutMessage(friendlyPayoutError(error instanceof Error ? error.message : 'Výplatu se nepodařilo odeslat.'));
    } finally {
      setPayingCoachId(null);
    }
  }

  async function handleStartOnboarding(coach: AdminCoachSummary) {
    setGeneratingOnboarding(coach.id);
    setPayoutMessage(null);
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const result = await createCoachStripeOnboarding(
        coach.id,
        `${base}/admin?onboarding=complete&coach=${coach.id}`,
        `${base}/admin?onboarding=refresh&coach=${coach.id}`,
      );
      setOnboardingLinks((current) => ({ ...current, [coach.id]: result.onboardingUrl }));
    } catch (error) {
      setPayoutMessage(error instanceof Error ? error.message : 'Nepodařilo se vygenerovat onboarding odkaz.');
    } finally {
      setGeneratingOnboarding(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[232px_minmax(0,1fr)]">
      <button
        type="button"
        aria-label="Otevřít menu administrace"
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen(true)}
        className="fixed right-3 top-3 z-50 inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/20 bg-[#2B1247]/86 text-brand-cyan shadow-brand ring-1 ring-white/10 backdrop-blur-xl lg:hidden"
      >
        <Menu size={22} />
      </button>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] overflow-y-auto bg-[#1D0D31] px-5 py-5 text-white shadow-[inset_0_0_120px_rgba(86,33,140,0.34)] backdrop-blur-xl lg:hidden"
            style={{ background: 'linear-gradient(180deg, #241039 0%, #2D144A 46%, #180A28 100%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mx-auto flex min-h-full max-w-[420px] flex-col justify-center py-8">
              <div className="flex items-center justify-between gap-4 rounded-[22px] border border-white/14 bg-[#442160]/82 p-4 shadow-[0_18px_50px_rgba(10,5,22,0.34)] backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3">
                  <TeamVysLogo size={42} priority />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-brand-cyan">Admin centrum</p>
                    <p className="mt-0.5 text-base font-black leading-tight text-white">TeamVYS provoz</p>
                  </div>
                </div>
                <button type="button" aria-label="Zavřít menu" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/14 text-white transition hover:bg-white/24">
                  <X size={21} />
                </button>
              </div>

              <nav className="mt-4 grid gap-2">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.key;
                  return (
                    <motion.button
                      key={section.key}
                      type="button"
                      onClick={() => selectSection(section.key)}
                      className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border px-4 py-3 text-left shadow-brand-soft backdrop-blur-xl transition ${
                        isActive
                          ? 'border-brand-purple bg-brand-purple text-white'
                          : 'border-white/14 bg-[#3A1A56]/86 text-white/92 hover:border-white/24 hover:bg-[#4A2370]'
                      }`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.025 }}
                    >
                      <span className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${isActive ? 'bg-white/16 text-white' : 'bg-white/10 text-brand-cyan'}`}>{section.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-base font-black leading-tight">{section.label}</span>
                        <span className={`mt-0.5 block text-xs font-bold ${isActive ? 'text-white/72' : 'text-white/68'}`}>{section.description}</span>
                      </span>
                        <ChevronDown className={`-rotate-90 ${isActive ? 'text-white/72' : 'text-white/58'}`} size={18} />
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="hidden p-2 lg:sticky lg:top-3 lg:block lg:self-start rounded-[22px] border border-brand-purple/20 bg-[#2B1247]/95 shadow-brand ring-1 ring-brand-purple/20 backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-2 lg:block">
          <div className="hidden h-16 w-full shrink-0 items-center gap-3 rounded-[18px] bg-white/10 px-3 ring-1 ring-white/10 lg:flex">
            <TeamVysLogo size={36} priority />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase leading-none text-brand-cyan">Admin centrum</p>
              <p className="mt-0.5 text-[13px] font-black leading-tight text-white">TeamVYS provoz</p>
            </div>
          </div>

          <nav className="grid w-full min-w-0 flex-1 grid-cols-4 gap-1.5 md:grid-cols-7 lg:mt-2 lg:grid-cols-1">
            {sections.map((section) => {
              const isActive = activeSection === section.key;
              return (
                <button
                  key={section.key}
                  type="button"
                  aria-label={section.label}
                  title={section.label}
                  onClick={() => selectSection(section.key)}
                  className={`flex h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[14px] border px-1 text-center transition-all duration-300 md:h-14 lg:h-11 lg:flex-row lg:justify-start lg:gap-2 lg:px-3 lg:text-left ${
                    isActive
                      ? 'border-brand-purple bg-brand-purple text-white shadow-brand'
                      : 'border-brand-purple/20 bg-white/10 text-white/80 hover:border-brand-purple/30 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-white' : 'text-brand-cyan'}`}>{section.icon}</span>
                  <span className="min-w-0">
                    <span className="block max-w-full text-[10px] font-black leading-tight sm:text-xs md:text-[11px] lg:whitespace-nowrap lg:text-[13px]">{section.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="min-w-0 space-y-5 pb-8 lg:pb-0">
        <AdminHeader activeSection={currentSection} devMode={devMode} showSignOut={showSignOut} totals={totals} />

        {financeError ? <BackendNotice error={financeError} /> : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeSection === 'overview' ? <OverviewSection totals={totals} coaches={coaches} coachAttendanceRecords={coachAttendanceRecords} dppDocuments={coachDppDocuments} keyRequests={keyRequests} onApproveKeyRequest={(id) => setKeyRequests((current) => current.filter((r) => r.id !== id))} onNavigate={setActiveSection} /> : null}
            {activeSection === 'attendance' ? <AttendanceSection query={attendanceQuery} onQueryChange={setAttendanceQuery} activityRows={activityRows} workshopSlots={workshopSlots} workshopAttendanceRecords={workshopAttendanceRecords} coaches={coaches} coachAttendanceRecords={coachAttendanceRecords} onAddCoachAttendance={handleAddCoachAttendance} onOpenActivityDetail={setSelectedActivityDetail} onOpenParticipantDetail={openParticipantDetail} /> : null}
            {activeSection === 'participants' ? <ParticipantsSection products={allProducts} workshopSlots={workshopSlots} workshopAttendanceRecords={workshopAttendanceRecords} onOpenParticipantDetail={openParticipantDetail} /> : null}
            {activeSection === 'products' ? <ProductsSection products={allProducts} createdProducts={adminCreatedProducts} coaches={coaches} onAddProduct={addAdminCreatedProduct} onRemoveProduct={removeAdminCreatedProduct} /> : null}
            {activeSection === 'coaches' ? <CoachesSection coaches={coaches} coachAttendanceRecords={coachAttendanceRecords} dppDocuments={coachDppDocuments} sharedTrainingSlots={sharedTrainingSlots} workshopSlots={workshopSlots} campTurnusy={campTurnusyState} onAddCoachAttendance={handleAddCoachAttendance} onCreateCoachDpp={handleCreateCoachDpp} onMarkCoachDppSigned={handleMarkCoachDppSigned} onReleaseSharedTraining={(slot, pos) => handleReleaseSharedTraining(slot, pos)} onAssignSharedTraining={handleAssignSharedTraining} onAddWorkshopCoach={handleAddWorkshopCoach} onRemoveWorkshopCoach={handleRemoveWorkshopCoach} onAddWorkshopSlot={handleAddWorkshopSlot} onAddCampCoach={handleAddCampCoach} onRemoveCampCoach={handleRemoveCampCoach} /> : null}
            {activeSection === 'payouts' ? (
              <PayoutsSection
                coaches={coaches}
                transfers={transfers}
                coachAttendanceRecords={coachAttendanceRecords}
                message={payoutMessage}
                payingCoachId={payingCoachId}
                onboardingLinks={onboardingLinks}
                generatingOnboarding={generatingOnboarding}
                onStartOnboarding={handleStartOnboarding}
                onPayout={handlePayout}
              />
            ) : null}
            {activeSection === 'invoices' ? <InvoicesSection invoices={invoices} onTogglePaid={(id) => setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, paid: !inv.paid, paidDate: !inv.paid ? new Date().toISOString().slice(0, 10) : undefined } : inv))} onAddInvoice={(inv) => setInvoices((prev) => [inv, ...prev])} onDeleteInvoice={(id) => setInvoices((prev) => prev.filter((inv) => inv.id !== id))} /> : null}
            {activeSection === 'finance' ? <FinanceOverviewSection totals={totals} invoices={invoices} paymentRows={paymentRows} coaches={coaches} coachAttendanceRecords={coachAttendanceRecords} onNavigate={setActiveSection} /> : null}
          </motion.div>
        </AnimatePresence>
      </main>
      {selectedActivityDetail ? (
        <ActivityDetailModal
          activity={selectedActivityDetail}
          onClose={() => setSelectedActivityDetail(null)}
          onOpenParticipant={(participant) => openParticipantDetail(participant, selectedActivityDetail.type, selectedActivityDetail.place)}
        />
      ) : null}
      {selectedParticipantDetail ? (
        <ParticipantDetailModal detail={selectedParticipantDetail} onClose={() => setSelectedParticipantDetail(null)} />
      ) : null}
    </div>
  );
}

function AdminHeader({ activeSection, devMode, showSignOut, totals }: { activeSection: (typeof sections)[number]; devMode: boolean; showSignOut: boolean; totals: AdminTotals }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-brand-purple/20 bg-gradient-to-br from-[#331650] via-[#27113D] to-[#4A1D78] px-4 py-4 text-white shadow-brand sm:px-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-brand" />
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white/10 text-brand-cyan ring-1 ring-white/10">
            {activeSection.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-cyan">{activeSection.label}</p>
            <h1 className="mt-0.5 text-lg font-black leading-tight md:text-xl">{headlineForSection(activeSection.key)}</h1>
            {devMode ? <p className="mt-1 text-[11px] font-black uppercase text-brand-lime">Testovací režim bez přihlášení</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={`${totals.missingDocuments} dokumentů chybí`} tone={totals.missingDocuments > 0 ? 'orange' : 'mint'} />
          {showSignOut ? <SignOutButton /> : null}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <AdminSignal value={`${linkedParticipants.length}`} label="účastníci" tone="cyan" />
        <AdminSignal value={`${adminCoachSummaries.length}`} label="trenéři" tone="purple" />
        <AdminSignal value={currency(totals.payoutTotal)} label="k výplatě" tone="orange" />
        <AdminSignal value={currency(totals.paidTotal)} label="zaplaceno" tone="mint" />
      </div>
    </div>
  );
}

function BackendNotice({ error }: { error: string }) {
  return (
    <Panel className="border-brand-orange/30 bg-brand-orange/10 p-4">
      <div className="flex items-start gap-3">
        <Bell className="mt-1 shrink-0 text-brand-orange-deep" size={20} />
        <div>
          <p className="font-black text-brand-ink">Backend finance teď neodpověděl</p>
          <p className="mt-1 text-sm font-bold leading-6 text-brand-ink-soft">{error}. Admin zobrazuje provozní demo data, aby šel dál kontrolovat vzhled a flow.</p>
        </div>
      </div>
    </Panel>
  );
}

function OverviewSection({ totals, coaches, coachAttendanceRecords, dppDocuments, keyRequests, onApproveKeyRequest, onNavigate }: { totals: AdminTotals; coaches: AdminCoachSummary[]; coachAttendanceRecords: CoachAttendanceRecord[]; dppDocuments: AdminCoachDppDocument[]; keyRequests: typeof adminCoachAccessRequests; onApproveKeyRequest: (id: string) => void; onNavigate: (section: SectionKey) => void }) {
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const unsignedDpp = coaches.filter((coach) => dppStatusForCoach(coach.id, dppDocuments) !== 'signed');

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <Panel className="border-brand-purple/20 bg-[#2B1247] p-4 shadow-brand sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ActionTile icon={<ClipboardList size={18} />} label="Docházka" value={`${totals.courseCount} aktivit`} onClick={() => onNavigate('attendance')} />
            <ActionTile icon={<Users size={18} />} label="Účastníci" value={`${linkedParticipants.length} profily`} onClick={() => onNavigate('participants')} />
            <ActionTile icon={<PackagePlus size={18} />} label="Produkty" value="kroužky, tábory, workshopy" onClick={() => onNavigate('products')} />
            <ActionTile icon={<Banknote size={18} />} label="Výplaty" value={currency(totals.payoutTotal)} onClick={() => onNavigate('payouts')} />
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle icon={<Gauge size={18} />} title="Prioritní fronta" subtitle="věci, které mají přímý dopad na rodiče, trenéry nebo provoz" />
          <div className="mt-4 grid gap-3">
            <PriorityRow title="Nepodepsané DPP trenérů" value={`${unsignedDpp.length}`} detail={unsignedDpp.length ? unsignedDpp.map((coach) => coach.name).join(', ') : 'Všichni trenéři mají DPP podepsané.'} tone={unsignedDpp.length ? 'orange' : 'mint'} />
            <div className="space-y-2">
              <div className="rounded-[16px] border border-brand-purple/10 bg-brand-paper p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-brand-ink">Žádosti o trenérský klíč</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-brand-ink-soft">{keyRequests.length ? `${keyRequests.length} čeká na schválení — zkontroluj osobní údaje a vydej klíč` : 'Právě žádná nová žádost.'}</p>
                  </div>
                  <StatusPill label={`${keyRequests.length}`} tone={keyRequests.length ? 'pink' : 'mint'} />
                </div>
                {keyRequests.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {keyRequests.map((request) => (
                      <div key={request.id} className="rounded-[14px] border border-brand-purple/10 bg-white">
                        <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setExpandedRequestId(expandedRequestId === request.id ? null : request.id)}>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-brand-ink">{request.name}</p>
                            <p className="mt-0.5 text-xs font-bold text-brand-ink-soft">{request.requestedLocation} · {request.requestedAt}</p>
                          </div>
                          <ChevronDown size={16} className={`shrink-0 text-brand-purple transition-transform ${expandedRequestId === request.id ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedRequestId === request.id ? (
                          <div className="border-t border-brand-purple/8 px-4 pb-4 pt-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <InfoBlock label="Jméno" value={request.name} />
                              <InfoBlock label="E-mail" value={request.email} />
                              <InfoBlock label="Telefon" value={request.phone} />
                              <InfoBlock label="Požadovaná lokalita" value={request.requestedLocation} />
                              <InfoBlock label="Čas žádosti" value={request.requestedAt} />
                            </div>
                            {request.note ? <p className="mt-3 rounded-[12px] bg-brand-paper px-3 py-2 text-sm font-bold text-brand-ink-soft">{request.note}</p> : null}
                            <button
                              type="button"
                              onClick={() => { onApproveKeyRequest(request.id); setExpandedRequestId(null); }}
                              className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-brand-purple px-4 py-2.5 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep"
                            >
                              <CheckCircle2 size={16} /> Schválit a otevřít profil trenéra
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <PriorityRow title="Zpětné docházky" value={`${adminAttendanceAdjustments.length}`} detail="Doplněné záznamy se mají zkontrolovat před výplatami." tone="purple" />
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle icon={<SlidersHorizontal size={18} />} title="Další admin funkce" subtitle="praktické věci pro další iteraci" />
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <Suggestion title="CSV export" text="Docházka, účastníci, platby a dokumenty pro účetní nebo provoz." />
            <Suggestion title="Role a oprávnění" text="Jasně oddělit admina, trenéra, rodiče a asistenta tábora." />
            <Suggestion title="Kontrola kapacit" text="Varování při plné skupině, čekací listina a náhradníci." />
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionTitle icon={<UserCheck size={18} />} title="Trenéři v měsíci" subtitle="výkon, docházka a připravenost na výplaty" />
        <div className="mt-4 space-y-3">
          {coaches.map((coach) => (
            <CoachCompactRow key={coach.id} coach={coach} coachAttendanceRecords={coachAttendanceRecords} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AttendanceSection({ query, onQueryChange, activityRows, workshopSlots, workshopAttendanceRecords, coaches, coachAttendanceRecords, onAddCoachAttendance, onOpenActivityDetail, onOpenParticipantDetail }: { query: string; onQueryChange: (value: string) => void; activityRows: ReturnType<typeof adminActivityRows>; workshopSlots: WorkshopSlot[]; workshopAttendanceRecords: WorkshopAttendanceRecord[]; coaches: AdminCoachSummary[]; coachAttendanceRecords: CoachAttendanceRecord[]; onAddCoachAttendance: (input: ManualCoachAttendanceInput) => CoachAttendanceRecord; onOpenActivityDetail: (activity: ReturnType<typeof adminActivityRows>[number]) => void; onOpenParticipantDetail: (participant: ParentParticipant, activityType: ActivityType, place: string) => void }) {
  const visibleActivities = filterActivityRows(activityRows, query);
  const childAttendance = parentAttendanceHistory.filter((record) => matchesQuery(`${record.participantName} ${record.location} ${record.date}`, query));
  const visibleCoaches = coaches.filter((coach) => matchesQuery(`${coach.name} ${coach.locations.join(' ')}`, query) || recordsForCoach(coach, coachAttendanceRecords).some((record) => matchesQuery(`${record.coachName} ${record.sessionTitle} ${record.date}`, query)));
  const courseStats = buildCourseLocationStats(visibleActivities);
  const todayKey = new Date().toISOString().slice(0, 10);
  const upcomingWsSlots = workshopSlots.filter((s) => s.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 24);

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle icon={<ClipboardList size={18} />} title="Docházka všech kroužků" subtitle="filtruj podle místa, účastníka, trenéra nebo data" />
          <SearchField value={query} onChange={onQueryChange} placeholder="Hledat Vyškov, Alex, Filip..." />
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<Gauge size={18} />} title="Statistika kroužků podle města" subtitle="kolik dětí bylo na lekcích v čase" />
        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {courseStats.map((stat) => <CourseLocationStatCard key={stat.key} stat={stat} onOpenDetail={() => onOpenActivityDetail(stat.activity)} />)}
        </div>
        {courseStats.length === 0 ? <EmptyState text="Pro zadaný filtr není žádný kroužek." /> : null}
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<Banknote size={18} />} title="Trenérská docházka podle trenéra" subtitle="celý záznam trenéra včetně admin doplnění" />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {visibleCoaches.map((coach) => (
            <CoachAttendancePanel key={coach.id} coach={coach} records={coachAttendanceRecords} onAdd={onAddCoachAttendance} compact />
          ))}
          {visibleCoaches.length === 0 ? <EmptyState text="Pro zadaný filtr není žádná trenérská docházka." /> : null}
        </div>
      </Panel>

      <ManualAttendancePanel coaches={coaches} onAdd={onAddCoachAttendance} />
    </div>
  );
}

function ParticipantsSection({ products, workshopSlots, workshopAttendanceRecords, onOpenParticipantDetail }: { products: ParentProduct[]; workshopSlots: WorkshopSlot[]; workshopAttendanceRecords: WorkshopAttendanceRecord[]; onOpenParticipantDetail: (participant: ParentParticipant, activityType: ActivityType, place: string) => void }) {
  const [query, setQuery] = useState('');
  const [activeParticipantType, setActiveParticipantType] = useState<ActivityType>('Krouzek');
  const participantGroups = useMemo(() => buildParticipantGroups(query, products), [query, products]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const upcomingWsSlots = useMemo(() => workshopSlots.filter((s) => s.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 24), [workshopSlots, todayKey]);
  const participantSubtitle = activeParticipantType === 'Tabor'
    ? 'tábory jsou rozdělené podle termínu, potom podle města a lokality'
    : activeParticipantType === 'Workshop'
    ? 'nadcházející termíny · přihlášení podle data'
    : 'přepni typ aktivity nahoře, města zůstávají jako hlavní rozbalení';
  const groupsByType = {
    Krouzek: participantGroups.filter((group) => group.type === 'Krouzek'),
    Tabor: participantGroups.filter((group) => group.type === 'Tabor'),
    Workshop: participantGroups.filter((group) => group.type === 'Workshop'),
  };
  const activeGroups = groupsByType[activeParticipantType];

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div className="space-y-4">
            <SectionTitle icon={<Users size={18} />} title="Účastníci podle místa" subtitle={participantSubtitle} />
            <ParticipantTypeSwitch activeType={activeParticipantType} groupsByType={groupsByType} workshopUpcomingCount={upcomingWsSlots.length} onChange={setActiveParticipantType} />
          </div>
          <SearchField value={query} onChange={setQuery} placeholder="Hledat účastníka nebo lokalitu..." />
        </div>
      </Panel>

      {activeParticipantType === 'Workshop'
        ? <>
            <WorkshopUpcomingPanel slots={upcomingWsSlots} attendanceRecords={workshopAttendanceRecords} onOpenParticipant={(p, place) => onOpenParticipantDetail(p, 'Workshop', place)} />
            <WorkshopStatsPanel allSlots={workshopSlots} attendanceRecords={workshopAttendanceRecords} onOpenParticipant={(p, place) => onOpenParticipantDetail(p, 'Workshop', place)} />
          </>
        : <>
            <ActivityParticipantTypeSection type={activeParticipantType} groups={activeGroups} onOpenParticipantDetail={onOpenParticipantDetail} />
            {participantGroups.length === 0 ? <EmptyState text="Žádná lokalita ani účastník neodpovídá filtru." /> : null}
          </>
      }
    </div>
  );
}

function CoachesSection({ coaches, coachAttendanceRecords, dppDocuments, sharedTrainingSlots, workshopSlots, campTurnusy, onAddCoachAttendance, onCreateCoachDpp, onMarkCoachDppSigned, onReleaseSharedTraining, onAssignSharedTraining, onAddWorkshopCoach, onRemoveWorkshopCoach, onAddWorkshopSlot, onAddCampCoach, onRemoveCampCoach }: { coaches: AdminCoachSummary[]; coachAttendanceRecords: CoachAttendanceRecord[]; dppDocuments: AdminCoachDppDocument[]; sharedTrainingSlots: SharedTrainingSlot[]; workshopSlots: WorkshopSlot[]; campTurnusy: CampTurnus[]; onAddCoachAttendance: (input: ManualCoachAttendanceInput) => CoachAttendanceRecord; onCreateCoachDpp: (coach: AdminCoachSummary) => AdminCoachDppDocument; onMarkCoachDppSigned: (coachId: string) => void; onReleaseSharedTraining: (slot: SharedTrainingSlot, position?: 'first' | 'second') => void; onAssignSharedTraining: (slot: SharedTrainingSlot, coach: AdminCoachSummary) => void; onAddWorkshopCoach: (slot: WorkshopSlot, coach: AdminCoachSummary) => void; onRemoveWorkshopCoach: (slot: WorkshopSlot, coachId: string) => void; onAddWorkshopSlot: (date: string, city: WorkshopCity) => void; onAddCampCoach: (turnus: CampTurnus, coach: AdminCoachSummary) => void; onRemoveCampCoach: (turnus: CampTurnus, coachId: string) => void }) {
  const [query, setQuery] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'Krouzek' | 'Tabor' | 'Workshop'>('all');
  const placementGroups = useMemo(() => buildCoachPlacementGroups(coaches, query), [coaches, query]);
  const courseGroups = placementGroups.filter((group) => group.type === 'Krouzek');
  const campGroups = placementGroups.filter((group) => group.type === 'Tabor');
  const workshopGroups = placementGroups.filter((group) => group.type === 'Workshop');
  const signedCount = coaches.filter((coach) => dppStatusForCoach(coach.id, dppDocuments) === 'signed').length;
  const selectedCoach = selectedCoachId ? coaches.find((coach) => coach.id === selectedCoachId) : null;

  const TYPE_TABS: { key: 'all' | 'Krouzek' | 'Tabor' | 'Workshop'; label: string; count: number }[] = [
    { key: 'all', label: 'Vše', count: placementGroups.length },
    { key: 'Krouzek', label: 'Kroužky', count: courseGroups.length },
    { key: 'Tabor', label: 'Tábory', count: campGroups.length },
    { key: 'Workshop', label: 'Workshopy', count: workshopGroups.length },
  ];

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle icon={<UserCheck size={18} />} title="Trenéři podle míst" subtitle={`krátký přehled po lokalitách, detail se otevře v modalu · ${signedCount}/${coaches.length} DPP podepsáno`} />
          <SearchField value={query} onChange={setQuery} placeholder="Hledat trenéra, lokalitu..." />
        </div>
      </Panel>

      <SharedTrainerCalendarPanel slots={sharedTrainingSlots} coaches={coaches} onRelease={onReleaseSharedTraining} onAssign={onAssignSharedTraining} />

      {(typeFilter === 'all' || typeFilter === 'Workshop') && (
        <WorkshopCalendarPanel slots={workshopSlots} coaches={coaches} onAddCoach={onAddWorkshopCoach} onRemoveCoach={onRemoveWorkshopCoach} onAddSlot={onAddWorkshopSlot} />
      )}

      {(typeFilter === 'all' || typeFilter === 'Tabor') && (
        <CampCalendarPanel turnusy={campTurnusy} coaches={coaches} onAddCoach={onAddCampCoach} onRemoveCoach={onRemoveCampCoach} />
      )}

      <Panel className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-[13px] px-3.5 py-2 text-xs font-black transition ${
                typeFilter === tab.key
                  ? 'bg-brand-purple text-white shadow-brand'
                  : 'border border-brand-purple/15 bg-white text-brand-ink-soft hover:bg-brand-purple/5 hover:text-brand-purple'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${typeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-brand-paper text-brand-ink-soft'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {(typeFilter === 'all' || typeFilter === 'Krouzek') && (typeFilter === 'Krouzek') && (
        <CoachPlacementSection title="Kroužky podle míst" subtitle="lokalita, den a přiřazený trenér" groups={courseGroups} emptyText="Pro zadaný filtr není žádný kroužek ani trenér." dppDocuments={dppDocuments} coachAttendanceRecords={coachAttendanceRecords} onOpenCoach={setSelectedCoachId} />
      )}
      {typeFilter === 'Tabor' && (
        <CoachPlacementSection title="Tábory" subtitle="turnusy a táboroví trenéři" groups={campGroups} emptyText="Pro zadaný filtr není žádný táborový trenér." dppDocuments={dppDocuments} coachAttendanceRecords={coachAttendanceRecords} onOpenCoach={setSelectedCoachId} />
      )}
      {typeFilter === 'Workshop' && (
        <CoachPlacementSection title="Workshopy" subtitle="trenéři pro jednorázové akce" groups={workshopGroups} emptyText="Pro zadaný filtr není žádný workshopový trenér." dppDocuments={dppDocuments} coachAttendanceRecords={coachAttendanceRecords} onOpenCoach={setSelectedCoachId} />
      )}
      {typeFilter === 'all' && (
        <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <CoachPlacementSection title="Kroužky podle míst" subtitle="lokalita, den a přiřazený trenér" groups={courseGroups} emptyText="Pro zadaný filtr není žádný kroužek ani trenér." dppDocuments={dppDocuments} coachAttendanceRecords={coachAttendanceRecords} onOpenCoach={setSelectedCoachId} />
          <div className="space-y-5">
            <CoachPlacementSection title="Tábory" subtitle="turnusy a táboroví trenéři" groups={campGroups} emptyText="Pro zadaný filtr není žádný táborový trenér." dppDocuments={dppDocuments} coachAttendanceRecords={coachAttendanceRecords} onOpenCoach={setSelectedCoachId} compact />
            <CoachPlacementSection title="Workshopy" subtitle="trenéři pro jednorázové akce" groups={workshopGroups} emptyText="Pro zadaný filtr není žádný workshopový trenér." dppDocuments={dppDocuments} coachAttendanceRecords={coachAttendanceRecords} onOpenCoach={setSelectedCoachId} compact />
          </div>
        </div>
      )}
      {selectedCoach ? (
        <DetailModal title={selectedCoach.name} subtitle={`${coachStatusLabel(selectedCoach.status)} · ${selectedCoach.locations.join(' · ')}`} onClose={() => setSelectedCoachId(null)}>
          <CoachDetailCard coach={selectedCoach} coachAttendanceRecords={coachAttendanceRecords} dppDocument={documentForCoach(selectedCoach, dppDocuments)} onAddCoachAttendance={onAddCoachAttendance} onCreateCoachDpp={onCreateCoachDpp} onMarkCoachDppSigned={onMarkCoachDppSigned} />
        </DetailModal>
      ) : null}
    </div>
  );
}

const WEEK_DAY_NAMES_WEB = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const WEEK_DAY_ABBR_WEB = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const CZECH_MONTH_NAMES_WEB = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const SEASON_START_WEB = { year: 2025, month: 9 }; // October 2025
const SEASON_END_WEB = { year: 2026, month: 5 };   // June 2026

function slotDayIndicesWeb(dayStr: string): number[] {
  return dayStr.split(/\s*\/\s*/).map((d) => WEEK_DAY_NAMES_WEB.indexOf(d.trim())).filter((i) => i >= 0);
}
function slotCoachCountWeb(slot: { assignedCoachId?: string; secondCoachId?: string }): number {
  return (slot.assignedCoachId ? 1 : 0) + (slot.secondCoachId ? 1 : 0);
}
function computeEasterWeb(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
function czechHolidaySetWeb(startYear: number): Set<string> {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const y0 = startYear, y1 = startYear + 1;
  const s = new Set<string>([
    `${y0}-10-28`, `${y0}-11-17`, `${y0}-12-24`, `${y0}-12-25`, `${y0}-12-26`,
    `${y1}-01-01`, `${y1}-05-01`, `${y1}-05-08`,
  ]);
  const easter = computeEasterWeb(y1);
  const gf = new Date(easter); gf.setDate(gf.getDate() - 2);
  const em = new Date(easter); em.setDate(em.getDate() + 1);
  s.add(fmt(gf)); s.add(fmt(em));
  return s;
}
function getMonthGridWeb(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDow = (first.getDay() + 6) % 7;
  const grid: (Date | null)[][] = [];
  let row: (Date | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= last.getDate(); d++) {
    row.push(new Date(year, month, d));
    if (row.length === 7) { grid.push(row); row = []; }
  }
  if (row.length > 0) { while (row.length < 7) row.push(null); grid.push(row); }
  return grid;
}
function dateKeyWeb(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function SharedTrainerCalendarPanel({ slots, coaches, onRelease, onAssign }: { slots: SharedTrainingSlot[]; coaches: AdminCoachSummary[]; onRelease: (slot: SharedTrainingSlot, position?: 'first' | 'second') => void; onAssign: (slot: SharedTrainingSlot, coach: AdminCoachSummary) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const incompleteCount = slots.filter((s) => slotCoachCountWeb(s) < 2).length;
  const activeCoaches = coaches.filter((c) => c.status === 'Aktivni' || c.status === 'Ceka na klic');
  const holidays = useMemo(() => czechHolidaySetWeb(SEASON_START_WEB.year), []);
  const grid = useMemo(() => getMonthGridWeb(calYear, calMonth), [calYear, calMonth]);

  const ymVal = (y: number, m: number) => y * 12 + m;
  const canGoPrev = ymVal(calYear, calMonth) > ymVal(SEASON_START_WEB.year, SEASON_START_WEB.month);
  const canGoNext = ymVal(calYear, calMonth) < ymVal(SEASON_END_WEB.year, SEASON_END_WEB.month);

  function goPrev() {
    if (!canGoPrev) return;
    setSelectedKey(null);
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); } else setCalMonth((m) => m - 1);
  }
  function goNext() {
    if (!canGoNext) return;
    setSelectedKey(null);
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); } else setCalMonth((m) => m + 1);
  }

  const selectedSlotId = selectedKey ? selectedKey.split('|')[0] : null;
  const selectedSlot = selectedSlotId ? slots.find((s) => s.id === selectedSlotId) ?? null : null;

  const closeModal = () => { setIsOpen(false); setSelectedKey(null); };

  return (
    <>
    <Panel className="p-5">
      {/* Panel header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SectionTitle icon={<CalendarDays size={18} />} title="Sdílený kalendář tréninků" subtitle="říjen – červen · 2 trenéři na trénink · svátky = volno" />
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`${slots.length} vzorů`} tone="purple" />
            <StatusPill label={incompleteCount > 0 ? `${incompleteCount} neúplných` : 'Vše obsazeno'} tone={incompleteCount > 0 ? 'pink' : 'mint'} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 rounded-[13px] border border-brand-purple/20 bg-white px-3 py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple/5"
        >
          <ChevronDown size={14} />
          Zobrazit
        </button>
      </div>
    </Panel>

    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="shared-backdrop"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeModal}
          />
          {/* Modal */}
          <motion.div
            key="shared-modal"
            className="fixed inset-x-3 bottom-0 top-6 z-50 mx-auto flex max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Modal header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-brand-purple/8 bg-white px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <SectionTitle icon={<CalendarDays size={18} />} title="Sdílený kalendář tréninků" subtitle="říjen – červen · 2 trenéři na trénink · svátky = volno" />
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={`${slots.length} vzorů`} tone="purple" />
                  <StatusPill label={incompleteCount > 0 ? `${incompleteCount} neúplných` : 'Vše obsazeno'} tone={incompleteCount > 0 ? 'pink' : 'mint'} />
                </div>
              </div>
              <button type="button" onClick={closeModal} className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-paper text-brand-ink-soft transition hover:bg-brand-purple/10 hover:text-brand-purple">
                <ChevronDown size={16} className="rotate-180" />
              </button>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
          <>
          {/* Month navigation */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={goPrev}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-purple/20 bg-white text-brand-purple transition hover:bg-brand-purple/5 disabled:opacity-30"
            >
              <ChevronDown size={14} className="rotate-90" />
            </button>
            <div className="text-center">
              <p className="text-sm font-black text-brand-purple-deep">{CZECH_MONTH_NAMES_WEB[calMonth]} {calYear}</p>
              <p className="text-[11px] text-brand-ink-soft">sezóna říjen {SEASON_START_WEB.year} – červen {SEASON_END_WEB.year}</p>
            </div>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={goNext}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-purple/20 bg-white text-brand-purple transition hover:bg-brand-purple/5 disabled:opacity-30"
            >
              <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-brand-ink-soft">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1FB37A]" />Obsazeno</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FFB21A]" />Potřeba 2. trenéra</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F0445B]" />Bez trenéra</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-ink-soft/20" />Svátek</span>
          </div>

          {/* Day-of-week headers */}
          <div className="mt-4 grid grid-cols-7 gap-1">
            {WEEK_DAY_ABBR_WEB.map((abbr) => (
              <div key={abbr} className="pb-1 text-center text-[11px] font-black uppercase text-brand-purple-deep">{abbr}</div>
            ))}
          </div>

          {/* Calendar date grid */}
          <div className="grid grid-cols-7 gap-1">
            {grid.flat().map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="min-h-[56px]" />;
              const key = dateKeyWeb(date);
              const isHoliday = holidays.has(key);
              const czechIdx = (date.getDay() + 6) % 7;
              const daySlots = isHoliday ? [] : slots.filter((s) => slotDayIndicesWeb(s.day).includes(czechIdx));
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const isToday = date.getTime() === today.getTime();
              const isPast = date < today;
              return (
                <div
                  key={key}
                  className={`min-h-[56px] rounded-xl p-1.5 transition ${
                    isHoliday
                      ? 'bg-brand-paper/70'
                      : daySlots.length > 0
                        ? 'border border-brand-purple/8 bg-white'
                        : 'bg-transparent'
                  }`}
                >
                  <div className={`mb-1 flex items-center justify-end`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                      isToday ? 'bg-brand-purple text-white' : isPast ? 'text-brand-ink-soft/40' : isHoliday ? 'text-brand-ink-soft/30' : 'text-brand-ink'
                    }`}>
                      {date.getDate()}
                    </span>
                  </div>
                  {isHoliday && <div className="text-center text-[9px] font-bold text-brand-ink-soft/40">svátek</div>}
                  <div className="flex flex-col gap-0.5">
                    {daySlots.map((slot) => {
                      const count = slotCoachCountWeb(slot);
                      const isSelected = selectedKey === `${slot.id}|${key}`;
                      const bg = count === 0 ? 'bg-[#F0445B]' : count === 1 ? 'bg-[#FFB21A]' : 'bg-[#1FB37A]';
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedKey(isSelected ? null : `${slot.id}|${key}`)}
                          className={`w-full rounded-[5px] px-1 py-0.5 text-left text-[9px] font-black text-white transition hover:opacity-80 ${bg} ${isSelected ? 'ring-2 ring-brand-purple ring-offset-1' : ''}`}
                          title={`${slot.time} · ${slot.place}`}
                        >
                          {slot.time.split(' - ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected slot detail */}
          {selectedSlot ? (
            <div className="mt-4 rounded-2xl border border-brand-purple/12 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-brand-purple-deep">{selectedSlot.time}</p>
                  <p className="mt-0.5 text-xs font-bold text-brand-ink">{selectedSlot.place}</p>
                  <p className="text-[11px] text-brand-ink-soft">{selectedSlot.group} · {selectedSlot.activityType}</p>
                </div>
                <button type="button" onClick={() => setSelectedKey(null)} className="rounded-xl border border-brand-purple/15 bg-brand-paper px-3 py-1.5 text-xs font-black text-brand-purple-deep transition hover:bg-brand-purple/5">
                  Zavřít
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className={`rounded-xl p-2.5 ${selectedSlot.assignedCoachId ? 'bg-brand-paper' : 'bg-[#F0445B]/8 border border-[#F0445B]/20'}`}>
                  <p className="text-[10px] font-black uppercase text-brand-ink-soft/60">1. Trenér</p>
                  <p className={`mt-0.5 text-xs font-black ${selectedSlot.assignedCoachId ? 'text-brand-ink' : 'text-[#F0445B]'}`}>{selectedSlot.assignedCoachName ?? '—'}</p>
                  {selectedSlot.assignedCoachId && (
                    <button type="button" onClick={() => onRelease(selectedSlot, 'first')} className="mt-1.5 w-full rounded-[8px] border border-[#F0445B]/20 px-2 py-1 text-[10px] font-black text-[#F0445B] transition hover:bg-[#F0445B]/8">
                      Uvolnit
                    </button>
                  )}
                </div>
                <div className={`rounded-xl p-2.5 ${selectedSlot.secondCoachId ? 'bg-brand-paper' : 'bg-[#FFB21A]/8 border border-[#FFB21A]/25'}`}>
                  <p className="text-[10px] font-black uppercase text-brand-ink-soft/60">2. Trenér</p>
                  <p className={`mt-0.5 text-xs font-black ${selectedSlot.secondCoachId ? 'text-brand-ink' : 'text-[#b37200]'}`}>{selectedSlot.secondCoachName ?? '—'}</p>
                  {selectedSlot.secondCoachId && (
                    <button type="button" onClick={() => onRelease(selectedSlot, 'second')} className="mt-1.5 w-full rounded-[8px] border border-[#FFB21A]/30 px-2 py-1 text-[10px] font-black text-[#b37200] transition hover:bg-[#FFB21A]/10">
                      Uvolnit
                    </button>
                  )}
                </div>
              </div>
              {slotCoachCountWeb(selectedSlot) < 2 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-black uppercase text-brand-ink-soft/60">
                    {selectedSlot.assignedCoachId ? 'Přiřadit 2. trenéra' : 'Přiřadit trenéra'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCoaches.filter((c) => c.id !== selectedSlot.assignedCoachId).map((coach) => (
                      <button
                        key={coach.id}
                        type="button"
                        onClick={() => onAssign(selectedSlot, coach)}
                        className="rounded-[10px] bg-brand-purple px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-brand-purple-deep"
                      >
                        + {coach.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-center text-xs text-brand-ink-soft/50">Klikni na trénink v kalendáři pro správu trenérů.</p>
          )}
            </>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

function WorkshopCalendarPanel({ slots, coaches, onAddCoach, onRemoveCoach, onAddSlot }: { slots: WorkshopSlot[]; coaches: AdminCoachSummary[]; onAddCoach: (slot: WorkshopSlot, coach: AdminCoachSummary) => void; onRemoveCoach: (slot: WorkshopSlot, coachId: string) => void; onAddSlot: (date: string, city: WorkshopCity) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState<WorkshopCity>('Brno');
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingSlotDate, setAddingSlotDate] = useState<string | null>(null);
  const [addingSlotCity, setAddingSlotCity] = useState<WorkshopCity>('Brno');

  const ymVal = (y: number, m: number) => y * 12 + m;
  const canGoPrev = ymVal(calYear, calMonth) > ymVal(SEASON_START_WEB.year, SEASON_START_WEB.month);
  const canGoNext = ymVal(calYear, calMonth) < ymVal(SEASON_END_WEB.year, SEASON_END_WEB.month);
  function goPrev() { if (!canGoPrev) return; setSelectedId(null); if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); } else setCalMonth((m) => m - 1); }
  function goNext() { if (!canGoNext) return; setSelectedId(null); if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); } else setCalMonth((m) => m + 1); }
  const grid = useMemo(() => getMonthGridWeb(calYear, calMonth), [calYear, calMonth]);
  const activeCoaches = coaches.filter((c) => c.status === 'Aktivni' || c.status === 'Ceka na klic');
  const filteredSlots = slots.filter((s) => s.city === cityFilter);
  const openCount = filteredSlots.filter((s) => s.coaches.length < s.maxCoaches).length;
  const selectedSlot = selectedId ? slots.find((s) => s.id === selectedId) ?? null : null;

  const CITY_COLORS: Record<WorkshopCity, string> = {
    Brno: 'bg-[#8B1DFF]',
    Praha: 'bg-[#1FB37A]',
    Ostrava: 'bg-[#FFB21A]',
  };
  const CITY_BORDER_COLORS: Record<WorkshopCity, string> = {
    Brno: 'border-[#8B1DFF]/30 bg-[#8B1DFF]/6',
    Praha: 'border-[#1FB37A]/30 bg-[#1FB37A]/6',
    Ostrava: 'border-[#FFB21A]/40 bg-[#FFB21A]/8',
  };

  const closeWsModal = () => { setIsOpen(false); setSelectedId(null); setAddingSlotDate(null); };

  return (
    <>
    <Panel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SectionTitle icon={<CalendarDays size={18} />} title="Workshopy" subtitle={`Brno · Praha · Ostrava · ${WORKSHOP_HOURLY_RATE} Kč/h · ${WORKSHOP_MAX_COACHES} trenéři · termíny přidávají trenéři`} />
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`${slots.length} workshopů`} tone="purple" />
            <StatusPill label={openCount > 0 ? `${openCount} neúplných` : 'Vše obsazeno'} tone={openCount > 0 ? 'pink' : 'mint'} />
          </div>
        </div>
        <button type="button" onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 rounded-[13px] border border-brand-purple/20 bg-white px-3 py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple/5">
          <ChevronDown size={14} />
          Zobrazit
        </button>
      </div>
    </Panel>

    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="ws-backdrop"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeWsModal}
          />
          <motion.div
            key="ws-modal"
            className="fixed inset-x-3 bottom-0 top-6 z-50 mx-auto flex max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-brand-purple/8 bg-white px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <SectionTitle icon={<CalendarDays size={18} />} title="Workshopy" subtitle={`Brno · Praha · Ostrava · ${WORKSHOP_HOURLY_RATE} Kč/h`} />
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={`${slots.length} workshopů`} tone="purple" />
                  <StatusPill label={openCount > 0 ? `${openCount} neúplných` : 'Vše obsazeno'} tone={openCount > 0 ? 'pink' : 'mint'} />
                </div>
              </div>
              <button type="button" onClick={closeWsModal} className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-paper text-brand-ink-soft transition hover:bg-brand-purple/10 hover:text-brand-purple">
                <ChevronDown size={16} className="rotate-180" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
          <>
          {/* City filter */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(['Brno', 'Praha', 'Ostrava'] as const).map((city) => (
              <button key={city} type="button"
                onClick={() => { setCityFilter(city); setSelectedId(null); }}
                className={`rounded-[11px] px-3 py-1.5 text-xs font-black transition ${cityFilter === city ? 'bg-brand-purple text-white' : 'border border-brand-purple/20 bg-white text-brand-purple hover:bg-brand-purple/5'}`}>
                {city}
              </button>
            ))}
          </div>

          {/* Month nav */}
          <div className="mt-4 flex items-center justify-between">
            <button type="button" disabled={!canGoPrev} onClick={goPrev}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-purple/20 bg-white text-brand-purple transition hover:bg-brand-purple/5 disabled:opacity-30">
              <ChevronDown size={14} className="rotate-90" />
            </button>
            <div className="text-center">
              <p className="text-sm font-black text-brand-purple-deep">{CZECH_MONTH_NAMES_WEB[calMonth]} {calYear}</p>
              <p className="text-[11px] text-brand-ink-soft">klikni na datum pro správu · prázdná data = přidat workshop</p>
            </div>
            <button type="button" disabled={!canGoNext} onClick={goNext}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-purple/20 bg-white text-brand-purple transition hover:bg-brand-purple/5 disabled:opacity-30">
              <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-brand-ink-soft">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#8B1DFF]" />Brno</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1FB37A]" />Praha</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FFB21A]" />Ostrava</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border border-brand-purple/20 bg-transparent" />Obsazeno</span>
          </div>

          {/* Day headers */}
          <div className="mt-4 grid grid-cols-7 gap-1">
            {WEEK_DAY_ABBR_WEB.map((abbr) => (
              <div key={abbr} className="pb-1 text-center text-[11px] font-black uppercase text-brand-purple-deep">{abbr}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {grid.flat().map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="min-h-[52px]" />;
              const key = dateKeyWeb(date);
              const daySlots = filteredSlots.filter((s) => s.date === key || s.dateTo === key);
              const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
              const isToday = date.getTime() === todayD.getTime();
              const isPast = date < todayD;
              const isSelected = daySlots.some((s) => s.id === selectedId);
              return (
                <div key={key}
                  className={`min-h-[52px] cursor-pointer rounded-xl p-1.5 transition ${isSelected ? 'ring-2 ring-brand-purple ring-offset-1 bg-brand-purple/5' : daySlots.length > 0 ? 'hover:bg-brand-paper' : 'hover:bg-brand-paper/50'}`}
                  onClick={() => {
                    if (daySlots.length > 0) {
                      // Cycle through slots on this day
                      const currentIdx = daySlots.findIndex((s) => s.id === selectedId);
                      const nextIdx = (currentIdx + 1) % (daySlots.length + 1);
                      if (nextIdx === daySlots.length) { setSelectedId(null); } else { setSelectedId(daySlots[nextIdx].id); }
                      setAddingSlotDate(null);
                    } else if (!isPast) { setAddingSlotDate(addingSlotDate === key ? null : key); setSelectedId(null); }
                  }}
                >
                  <div className="flex justify-end">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${isToday ? 'bg-brand-purple text-white' : isPast ? 'text-brand-ink-soft/40' : 'text-brand-ink'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {daySlots.map((slot) => {
                      const isFull = slot.coaches.length >= slot.maxCoaches;
                      const cityBg = CITY_COLORS[slot.city];
                      return (
                        <div key={slot.id} className={`flex items-center gap-0.5 rounded-[4px] px-1 py-0.5 ${isFull ? 'opacity-60' : ''}`}>
                          <span className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${cityBg}`} />
                          <span className="truncate text-[9px] font-black text-brand-ink">{slot.coaches.length}/{slot.maxCoaches}</span>
                        </div>
                      );
                    })}
                    {daySlots.length === 0 && !isPast && addingSlotDate !== key && (
                      <div className="mt-0.5 text-center text-[9px] text-brand-ink-soft/30">+</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add slot form */}
          {addingSlotDate && (
            <div className="mt-4 rounded-2xl border border-dashed border-brand-purple/30 bg-brand-paper/60 p-4">
              <p className="mb-3 text-xs font-black text-brand-purple-deep">Přidat workshop: {addingSlotDate}</p>
              <div className="flex flex-wrap gap-2">
                {(['Brno', 'Praha', 'Ostrava'] as WorkshopCity[]).map((city) => (
                  <button key={city} type="button"
                    onClick={() => setAddingSlotCity(city)}
                    className={`rounded-[10px] px-3 py-1.5 text-xs font-black transition ${addingSlotCity === city ? 'bg-brand-purple text-white' : 'border border-brand-purple/20 bg-white text-brand-purple'}`}>
                    {city}
                  </button>
                ))}
                <button type="button"
                  onClick={() => { onAddSlot(addingSlotDate, addingSlotCity); setAddingSlotDate(null); }}
                  className="rounded-[10px] bg-brand-purple px-4 py-1.5 text-xs font-black text-white transition hover:bg-brand-purple-deep">
                  Vytvořit
                </button>
                <button type="button" onClick={() => setAddingSlotDate(null)}
                  className="rounded-[10px] border border-brand-purple/15 bg-white px-3 py-1.5 text-xs font-black text-brand-purple-deep">
                  Zrušit
                </button>
              </div>
            </div>
          )}

          {/* Selected slot detail */}
          {selectedSlot ? (
            <div className="mt-4 rounded-2xl border border-brand-purple/12 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className={`mb-1 inline-block rounded-lg px-2 py-0.5 text-xs font-black text-white ${CITY_COLORS[selectedSlot.city]}`}>{selectedSlot.city}</div>
                  <p className="text-sm font-black text-brand-purple-deep">{selectedSlot.date} · {selectedSlot.time}</p>
                  <p className="mt-0.5 text-xs font-bold text-brand-ink">{selectedSlot.venue}</p>
                  {selectedSlot.notes && <p className="mt-1 text-[11px] italic text-brand-ink-soft">{selectedSlot.notes}</p>}
                  <p className="mt-1 text-[11px] text-brand-ink-soft">{WORKSHOP_HOURLY_RATE} Kč/h · 4 h = {WORKSHOP_HOURLY_RATE * 4} Kč / trenér</p>
                  {/* Show other cities running same day */}
                  {(() => {
                    const sameDaySlots = slots.filter((s) => s.id !== selectedSlot.id && s.date === selectedSlot.date);
                    if (sameDaySlots.length === 0) return null;
                    return (
                      <p className="mt-1.5 text-[11px] font-bold text-[#FFB21A]">
                        ⚠ Tento den probíhá také: {sameDaySlots.map((s) => s.city).join(', ')} — trenér nemůže být na obou místech najednou.
                      </p>
                    );
                  })()}
                </div>
                <button type="button" onClick={() => setSelectedId(null)} className="rounded-xl border border-brand-purple/15 bg-brand-paper px-3 py-1.5 text-xs font-black text-brand-purple-deep hover:bg-brand-purple/5">
                  Zavřít
                </button>
              </div>
              {/* 4 coach slots */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: selectedSlot.maxCoaches }).map((_, i) => {
                  const coach = selectedSlot.coaches[i];
                  return (
                    <div key={i} className={`rounded-xl p-2.5 ${coach ? 'bg-brand-paper' : `border border-dashed border-brand-purple/20 bg-transparent`}`}>
                      <p className="text-[9px] font-black uppercase text-brand-ink-soft/60">{i + 1}. trenér</p>
                      {coach ? (
                        <>
                          <p className="mt-0.5 truncate text-xs font-black text-brand-ink">{coach.coachName}</p>
                          <button type="button" onClick={() => onRemoveCoach(selectedSlot, coach.coachId)}
                            className="mt-1 w-full rounded-[7px] border border-[#F0445B]/20 px-1 py-0.5 text-[9px] font-black text-[#F0445B] hover:bg-[#F0445B]/8">
                            Odebrat
                          </button>
                        </>
                      ) : (
                        <p className="mt-0.5 text-[10px] text-brand-ink-soft/40">Volné místo</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Assign coach */}
              {selectedSlot.coaches.length < selectedSlot.maxCoaches && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-black uppercase text-brand-ink-soft/60">Přiřadit trenéra</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCoaches
                      .filter((c) => !selectedSlot.coaches.some((sc) => sc.coachId === c.id))
                      .map((coach) => {
                        const conflictSlot = slots.find((s) => s.id !== selectedSlot.id && s.date === selectedSlot.date && s.coaches.some((sc) => sc.coachId === coach.id));
                        return (
                          <button key={coach.id} type="button"
                            disabled={!!conflictSlot}
                            title={conflictSlot ? `${coach.name.split(' ')[0]} je ten den v ${conflictSlot.city}` : undefined}
                            onClick={() => !conflictSlot && onAddCoach(selectedSlot, coach)}
                            className={`rounded-[10px] px-3 py-1.5 text-[11px] font-black transition ${conflictSlot ? 'cursor-not-allowed border border-brand-purple/15 bg-brand-paper text-brand-ink-soft/40 line-through' : 'bg-brand-purple text-white hover:bg-brand-purple-deep'}`}>
                            {conflictSlot ? `${coach.name.split(' ')[0]} (${conflictSlot.city})` : `+ ${coach.name.split(' ')[0]}`}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : !addingSlotDate && (
            <p className="mt-4 text-center text-xs text-brand-ink-soft/50">Klikni na datum pro správu workshopu · prázdné datum = přidat nový termín.</p>
          )}
            </>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

function CampCalendarPanel({ turnusy, coaches, onAddCoach, onRemoveCoach }: { turnusy: CampTurnus[]; coaches: AdminCoachSummary[]; onAddCoach: (turnus: CampTurnus, coach: AdminCoachSummary) => void; onRemoveCoach: (turnus: CampTurnus, coachId: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeCoaches = coaches.filter((c) => c.status === 'Aktivni' || c.status === 'Ceka na klic');
  const selectedTurnus = selectedId ? turnusy.find((t) => t.id === selectedId) ?? null : null;
  const totalAssigned = turnusy.reduce((sum, t) => sum + t.coaches.length, 0);
  const openCount = turnusy.filter((t) => t.coaches.length < t.maxCoaches).length;

  const closeCampModal = () => { setIsOpen(false); setSelectedId(null); };

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}. ${m}. ${y}`;
  };

  return (
    <>
    <Panel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SectionTitle icon={<CalendarDays size={18} />} title="Tábory" subtitle={`turnusy · ${CAMP_DAILY_RATE} Kč/den/trenér · ${CAMP_MAX_COACHES} trenéři na turnus`} />
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`${turnusy.length} turnusů`} tone="purple" />
            <StatusPill label={openCount > 0 ? `${openCount} neúplných` : 'Vše obsazeno'} tone={openCount > 0 ? 'pink' : 'mint'} />
            <StatusPill label={`${totalAssigned} přiřazených`} />
          </div>
        </div>
        <button type="button" onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 rounded-[13px] border border-brand-purple/20 bg-white px-3 py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple/5">
          <ChevronDown size={14} />
          Zobrazit
        </button>
      </div>
    </Panel>

    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="camp-backdrop"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeCampModal}
          />
          <motion.div
            key="camp-modal"
            className="fixed inset-x-3 bottom-0 top-6 z-50 mx-auto flex max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-brand-purple/8 bg-white px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <SectionTitle icon={<CalendarDays size={18} />} title="Tábory – přiřazení trenérů" subtitle={`${CAMP_DAILY_RATE} Kč/den · ${CAMP_MAX_COACHES} trenéři na turnus`} />
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={`${turnusy.length} turnusů`} tone="purple" />
                  <StatusPill label={openCount > 0 ? `${openCount} neúplných` : 'Vše obsazeno'} tone={openCount > 0 ? 'pink' : 'mint'} />
                </div>
              </div>
              <button type="button" onClick={closeCampModal} className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-paper text-brand-ink-soft transition hover:bg-brand-purple/10 hover:text-brand-purple">
                <ChevronDown size={16} className="rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
              <div className="space-y-3">
                {turnusy.map((turnus) => {
                  const isSelected = turnus.id === selectedId;
                  const isFull = turnus.coaches.length >= turnus.maxCoaches;
                  const payout = turnus.durationDays * CAMP_DAILY_RATE;
                  return (
                    <div key={turnus.id}
                      className={`rounded-2xl border p-4 transition cursor-pointer ${isSelected ? 'border-brand-purple/40 bg-brand-purple/5 ring-2 ring-brand-purple ring-offset-1' : 'border-brand-purple/12 bg-white hover:bg-brand-paper/60'}`}
                      onClick={() => setSelectedId(isSelected ? null : turnus.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-brand-purple px-2 py-0.5 text-[11px] font-black text-white">{turnus.city}</span>
                            <span className={`rounded-lg px-2 py-0.5 text-[11px] font-black ${isFull ? 'bg-[#1FB37A]/12 text-[#1FB37A]' : 'bg-[#F0445B]/10 text-[#F0445B]'}`}>{isFull ? 'Obsazeno' : `${turnus.coaches.length}/${turnus.maxCoaches} trenérů`}</span>
                          </div>
                          <p className="mt-1 text-sm font-black text-brand-purple-deep">{turnus.campTitle}</p>
                          <p className="text-xs font-bold text-brand-ink">{turnus.venue}</p>
                          <p className="mt-0.5 text-[11px] text-brand-ink-soft">{formatDate(turnus.dateFrom)} – {formatDate(turnus.dateTo)} · {turnus.durationDays} dní · {payout} Kč/trenér</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {turnus.coaches.map((c) => (
                            <span key={c.coachId} className="rounded-full bg-brand-paper px-2 py-0.5 text-[11px] font-black text-brand-ink">{c.coachName.split(' ')[0]}</span>
                          ))}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                          {/* Coach slots */}
                          <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: turnus.maxCoaches }).map((_, i) => {
                              const coach = turnus.coaches[i];
                              return (
                                <div key={i} className={`rounded-xl p-2.5 ${coach ? 'bg-brand-paper' : 'border border-dashed border-brand-purple/20 bg-transparent'}`}>
                                  <p className="text-[9px] font-black uppercase text-brand-ink-soft/60">{i + 1}. trenér</p>
                                  {coach ? (
                                    <>
                                      <p className="mt-0.5 truncate text-xs font-black text-brand-ink">{coach.coachName}</p>
                                      <button type="button" onClick={() => onRemoveCoach(turnus, coach.coachId)}
                                        className="mt-1 w-full rounded-[7px] border border-[#F0445B]/20 px-1 py-0.5 text-[9px] font-black text-[#F0445B] hover:bg-[#F0445B]/8">
                                        Odebrat
                                      </button>
                                    </>
                                  ) : (
                                    <p className="mt-0.5 text-[10px] text-brand-ink-soft/40">Volné místo</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Assign coach */}
                          {turnus.coaches.length < turnus.maxCoaches && (
                            <div className="mt-3">
                              <p className="mb-1.5 text-[10px] font-black uppercase text-brand-ink-soft/60">Přiřadit trenéra</p>
                              <div className="flex flex-wrap gap-1.5">
                                {activeCoaches.filter((c) => !turnus.coaches.some((tc) => tc.coachId === c.id)).map((coach) => (
                                  <button key={coach.id} type="button" onClick={() => onAddCoach(turnus, coach)}
                                    className="rounded-[10px] bg-brand-purple px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-brand-purple-deep">
                                    + {coach.name.split(' ')[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!selectedTurnus && (
                <p className="mt-4 text-center text-xs text-brand-ink-soft/50">Klikni na turnus pro správu přiřazení trenérů.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

function PayoutsSection({
  coaches,
  transfers,
  coachAttendanceRecords,
  message,
  payingCoachId,
  onboardingLinks,
  generatingOnboarding,
  onStartOnboarding,
  onPayout,
}: {
  coaches: AdminCoachSummary[];
  transfers: TrainerPayoutTransfer[];
  coachAttendanceRecords: CoachAttendanceRecord[];
  message: string | null;
  payingCoachId: string | null;
  onboardingLinks: Record<string, string>;
  generatingOnboarding: string | null;
  onStartOnboarding: (coach: AdminCoachSummary) => void;
  onPayout: (coach: AdminCoachSummary) => void;
}) {
  const total = coaches.reduce((sum, coach) => sum + payoutAmountForCoach(coach, coachAttendanceRecords), 0);
  const readyCoaches = coaches.filter((coach) => {
    const amount = payoutAmountForCoach(coach, coachAttendanceRecords);
    return coach.stripeAccountId?.startsWith('acct_') && amount > 0;
  }).length;
  const missingOnboarding = coaches.filter((coach) => !coach.stripeAccountId?.startsWith('acct_')).length;

  return (
    <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <Panel className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <SectionTitle icon={<Banknote size={18} />} title="Výplaty trenérům" subtitle="uzavřený měsíc, základ + schválené bonusy" />
            <div className="grid gap-2 rounded-[18px] bg-brand-paper p-2 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-[14px] bg-white px-4 py-3">
                <p className="text-[11px] font-black uppercase text-brand-ink-soft">Období</p>
                <p className="mt-1 text-sm font-black text-brand-ink">{payoutPeriod.label}</p>
              </div>
              <div className="rounded-[14px] bg-white px-4 py-3">
                <p className="text-[11px] font-black uppercase text-brand-ink-soft">Připraveno</p>
                <p className="mt-1 text-sm font-black text-brand-ink">{readyCoaches}/{coaches.length}</p>
              </div>
              <div className="rounded-[14px] bg-brand-ink px-4 py-3 text-white">
                <p className="text-[11px] font-black uppercase text-white/60">Celkem</p>
                <p className="mt-1 text-lg font-black">{currency(total)}</p>
              </div>
            </div>
          </div>
          {missingOnboarding > 0 ? <p className="mt-4 rounded-[16px] bg-brand-orange/12 px-4 py-3 text-sm font-bold leading-6 text-brand-orange-deep">{missingOnboarding} {missingOnboarding === 1 ? 'trenér ještě nemá' : 'trenéři ještě nemají'} dokončený Stripe Connect onboarding.</p> : null}
          {message ? <p className="mt-4 rounded-[16px] bg-brand-purple-light px-4 py-3 text-sm font-bold leading-6 text-brand-ink-soft">{message}</p> : null}
        </Panel>

        <div className="grid gap-4">
          {coaches.map((coach) => {
            const amount = payoutAmountForCoach(coach, coachAttendanceRecords);
            const hasConnect = coach.stripeAccountId?.startsWith('acct_');
            const ready = !!hasConnect && amount > 0;
            const onboardingUrl = onboardingLinks[coach.id];
            return (
              <Panel key={coach.id} className="overflow-hidden p-0">
                <div className={`h-1.5 ${ready ? 'bg-brand-purple' : 'bg-brand-orange'}`} />
                <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-stretch">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black leading-tight text-brand-ink">{coach.name}</h3>
                        <p className="mt-1 text-sm font-bold text-brand-ink-soft">{coach.locations.slice(0, 2).join(' · ')}</p>
                      </div>
                      <StatusPill label={ready ? 'Připraveno' : hasConnect ? 'Čeká na docházku' : 'Onboarding chybí'} tone={ready ? 'mint' : hasConnect ? 'purple' : 'orange'} />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <Metric value={`${coach.loggedHours} h`} label="hodiny" />
                      <Metric value={currency(coach.baseAmount)} label="základ" />
                      <Metric value={currency(coach.approvedBonuses)} label="bonus" />
                    </div>

                    {hasConnect ? (
                      <div className="flex items-center gap-3 rounded-[16px] border border-brand-purple/10 bg-brand-paper px-4 py-3">
                        <CheckCircle2 size={17} className="shrink-0 text-brand-purple" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase text-brand-ink-soft">Stripe Connect</p>
                          <p className="mt-0.5 break-all font-mono text-xs font-black text-brand-ink">{coach.stripeAccountId}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[16px] border border-brand-orange/20 bg-brand-orange/6 p-4">
                        <p className="text-sm font-bold text-brand-orange-deep">Trenér ještě nespojil svůj účet se Stripe. Vygeneruj mu onboarding odkaz — vyplní bankovní údaje sám na Stripe stránce.</p>
                        {onboardingUrl ? (
                          <div className="mt-3 grid gap-2">
                            <p className="text-[11px] font-black uppercase text-brand-ink-soft">Odkaz pro trenéra (platný ~5 min)</p>
                            <div className="flex items-center gap-2 overflow-hidden rounded-[14px] border border-brand-purple/15 bg-white px-3 py-2">
                              <span className="min-w-0 flex-1 break-all font-mono text-xs text-brand-ink-soft">{onboardingUrl}</span>
                              <button type="button" onClick={() => navigator.clipboard.writeText(onboardingUrl)} className="shrink-0 rounded-[10px] bg-brand-purple px-2 py-1 text-[10px] font-black text-white transition hover:bg-brand-purple-deep">Kopírovat</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={generatingOnboarding === coach.id}
                            onClick={() => onStartOnboarding(coach)}
                            className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-brand-orange px-4 py-2 text-sm font-black text-white transition hover:bg-brand-orange-deep disabled:opacity-55"
                          >
                            {generatingOnboarding === coach.id ? 'Generuji...' : 'Zahájit Stripe onboarding'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`flex flex-col justify-between rounded-[20px] border p-4 ${ready ? 'border-brand-purple bg-brand-purple text-white shadow-brand-soft' : 'border-brand-purple/10 bg-brand-paper text-brand-ink'}`}>
                    <div>
                      <p className={`text-xs font-black uppercase ${ready ? 'text-white/70' : 'text-brand-ink-soft'}`}>K výplatě</p>
                      <p className="mt-1 text-3xl font-black leading-tight">{currency(amount)}</p>
                      <p className={`mt-2 text-xs font-black uppercase ${ready ? 'text-white/62' : 'text-brand-ink-soft'}`}>{payoutPeriod.label}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!ready || payingCoachId === coach.id}
                      onClick={() => onPayout(coach)}
                      aria-label={`Vyplatit ${payoutPeriod.label} pro ${coach.name}`}
                      className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-black shadow-brand transition disabled:cursor-not-allowed disabled:opacity-55 ${ready ? 'bg-white text-brand-purple hover:bg-brand-paper' : 'bg-white text-brand-ink-soft'}`}
                    >
                      <Send size={17} />
                      {payingCoachId === coach.id ? 'Odesílám...' : 'Vyplatit'}
                    </button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>

      <Panel className="p-5 2xl:sticky 2xl:top-3">
        <SectionTitle icon={<History size={18} />} title="Historie výplat" subtitle="Stripe transfery uložené v Supabase" />
        <div className="mt-4 grid gap-2">
          {transfers.map((transfer) => (
            <MiniRow key={transfer.id} label={transfer.coachName} meta={`${transfer.periodKey} · ${transfer.status}${transfer.stripeTransferId ? ` · ${transfer.stripeTransferId}` : ''}`} value={currency(transfer.amount)} />
          ))}
          {transfers.length === 0 ? <EmptyState text="Po první sandbox výplatě se tady objeví transfer historie." /> : null}
        </div>
      </Panel>
    </div>
  );
}

function InvoicesSection({ invoices, onTogglePaid, onAddInvoice, onDeleteInvoice }: {
  invoices: Invoice[];
  onTogglePaid: (id: string) => void;
  onAddInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
}) {
  const [filterCategory, setFilterCategory] = useState<Invoice['category'] | 'Vše'>('Vše');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [showForm, setShowForm] = useState(false);
  const [formSupplier, setFormSupplier] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formIssuedDate, setFormIssuedDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState<Invoice['category']>('Tělocvična');

  const categories: Array<Invoice['category']> = ['Tělocvična', 'Vybavení', 'Marketing', 'Ostatní'];

  const visible = invoices.filter((inv) => {
    if (filterCategory !== 'Vše' && inv.category !== filterCategory) return false;
    if (filterPaid === 'paid' && !inv.paid) return false;
    if (filterPaid === 'unpaid' && inv.paid) return false;
    return true;
  });

  const totalUnpaid = invoices.filter((inv) => !inv.paid).reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter((inv) => inv.paid).reduce((sum, inv) => sum + inv.amount, 0);
  const totalAll = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = invoices.filter((inv) => !inv.paid && inv.dueDate < new Date().toISOString().slice(0, 10)).length;

  function handleAddInvoice(event: FormEvent) {
    event.preventDefault();
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      supplier: formSupplier,
      description: formDescription,
      amount: Number(formAmount),
      issuedDate: formIssuedDate,
      dueDate: formDueDate,
      paid: false,
      category: formCategory,
    };
    onAddInvoice(newInvoice);
    setFormSupplier(''); setFormDescription(''); setFormAmount(''); setFormIssuedDate(''); setFormDueDate('');
    setShowForm(false);
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle icon={<Receipt size={18} />} title="Přehled výdajů" subtitle="faktury a platby" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric value={`${totalAll.toLocaleString('cs-CZ')} Kč`} label="celkem" />
            <Metric value={`${totalPaid.toLocaleString('cs-CZ')} Kč`} label="uhrazeno" />
            <Metric value={`${totalUnpaid.toLocaleString('cs-CZ')} Kč`} label="k úhradě" />
            <Metric value={String(overdueCount)} label="po splatnosti" />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-black uppercase text-brand-ink-soft">Podle kategorie</p>
            <div className="grid gap-1.5">
              {categories.map((cat) => {
                const catTotal = invoices.filter((inv) => inv.category === cat).reduce((sum, inv) => sum + inv.amount, 0);
                const catPaid = invoices.filter((inv) => inv.category === cat && inv.paid).reduce((sum, inv) => sum + inv.amount, 0);
                if (catTotal === 0) return null;
                return (
                  <div key={cat} className="flex items-center justify-between rounded-[12px] bg-brand-paper px-3 py-2">
                    <p className="text-sm font-bold text-brand-ink">{cat}</p>
                    <div className="text-right">
                      <p className="text-sm font-black text-brand-ink">{catTotal.toLocaleString('cs-CZ')} Kč</p>
                      <p className="text-[11px] font-bold text-brand-ink-soft">{catPaid.toLocaleString('cs-CZ')} Kč uhrazeno</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Plus size={18} />} title="Přidat fakturu" subtitle="ruční zadání" />
            <button type="button" onClick={() => setShowForm((v) => !v)} className={`inline-flex h-10 w-10 items-center justify-center rounded-[14px] transition ${showForm ? 'bg-brand-purple text-white' : 'bg-brand-paper text-brand-purple hover:bg-brand-purple hover:text-white'}`}>
              {showForm ? <X size={17} /> : <Plus size={17} />}
            </button>
          </div>
          {showForm ? (
            <form className="mt-4 grid gap-3" onSubmit={handleAddInvoice}>
              <TextInput label="Dodavatel" value={formSupplier} onChange={setFormSupplier} />
              <TextInput label="Popis" value={formDescription} onChange={setFormDescription} />
              <TextInput label="Částka (Kč)" value={formAmount} onChange={setFormAmount} inputMode="numeric" />
              <TextInput label="Datum vystavení" value={formIssuedDate} onChange={setFormIssuedDate} />
              <TextInput label="Datum splatnosti" value={formDueDate} onChange={setFormDueDate} />
              <label className="grid gap-2 text-sm font-black text-brand-ink">
                Kategorie
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as Invoice['category'])} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple">
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </label>
              <button type="submit" className="rounded-[16px] bg-brand-purple py-3 text-sm font-black text-white transition hover:opacity-80">Uložit fakturu</button>
            </form>
          ) : (
            <p className="mt-3 text-sm font-bold text-brand-ink-soft">Faktury lze přidávat ručně. Brzy bude možné nahrát PDF přímo ze školy.</p>
          )}
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle icon={<ListChecks size={18} />} title="Seznam faktur" subtitle={`${visible.length} záznamů`} />
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="grid grid-cols-3 gap-1 rounded-[14px] border border-brand-purple/10 bg-brand-paper p-1">
              {(['all', 'unpaid', 'paid'] as const).map((status) => (
                <button key={status} type="button" onClick={() => setFilterPaid(status)} className={`rounded-[10px] px-3 py-1.5 text-xs font-black transition ${filterPaid === status ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-ink-soft hover:text-brand-purple'}`}>
                  {status === 'all' ? 'Vše' : status === 'paid' ? 'Uhrazeno' : 'K úhradě'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {(['Vše', ...categories] as const).map((cat) => (
                <button key={cat} type="button" onClick={() => setFilterCategory(cat)} className={`rounded-[10px] px-3 py-1.5 text-xs font-black transition ${filterCategory === cat ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-paper text-brand-ink-soft hover:text-brand-purple'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {visible.map((inv) => (
              <div key={inv.id} className={`rounded-[16px] border p-4 transition ${inv.paid ? 'border-emerald-200 bg-emerald-50/60' : inv.dueDate < new Date().toISOString().slice(0, 10) ? 'border-brand-pink/30 bg-brand-pink/5' : 'border-brand-purple/10 bg-brand-paper'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-brand-ink">{inv.supplier}</p>
                    <p className="mt-0.5 text-xs font-bold text-brand-ink-soft">{inv.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${inv.paid ? 'bg-emerald-100 text-emerald-700' : inv.dueDate < new Date().toISOString().slice(0, 10) ? 'bg-brand-pink/15 text-brand-pink' : 'bg-brand-purple/10 text-brand-purple'}`}>
                      {inv.paid ? 'Uhrazeno' : inv.dueDate < new Date().toISOString().slice(0, 10) ? 'Po splatnosti' : 'K úhradě'}
                    </span>
                    <span className="text-sm font-black text-brand-ink">{inv.amount.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-3 text-[11px] font-bold text-brand-ink-soft">
                    <span>Vystaveno: {inv.issuedDate}</span>
                    <span>Splatnost: {inv.dueDate}</span>
                    {inv.paidDate ? <span className="text-emerald-600">Zaplaceno: {inv.paidDate}</span> : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onTogglePaid(inv.id)} className={`flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-black transition ${inv.paid ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-brand-purple text-white hover:opacity-80'}`}>
                      <CheckCircle2 size={13} />
                      {inv.paid ? 'Zrušit úhradu' : 'Označit uhrazeno'}
                    </button>
                    <button type="button" onClick={() => onDeleteInvoice(inv.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-brand-pink transition hover:bg-brand-pink hover:text-white">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {visible.length === 0 ? <EmptyState text="Žádné faktury pro vybraný filtr." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function DocumentsSection({ activityRows }: { activityRows: ReturnType<typeof adminActivityRows> }) {
  const [filter, setFilter] = useState<'all' | DocumentStatus>('all');
  const documents = allParticipantDocuments();
  const visibleDocuments = filter === 'all' ? documents : documents.filter((document) => document.status === filter);
  const stats = documentStatsFor(documents);

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle icon={<FileCheck2 size={18} />} title="Dokumenty účastníků" subtitle={`${stats.signed}/${stats.total} podepsáno`} />
          <div className="grid grid-cols-4 rounded-[16px] border border-brand-purple/10 bg-brand-paper p-1">
            {(['all', 'signed', 'draft', 'missing'] as const).map((status) => (
              <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-[7px] px-2 py-2 text-[11px] font-black transition ${filter === status ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-ink-soft hover:text-brand-purple'}`}>
                {status === 'all' ? 'Vše' : documentStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {visibleDocuments.map((document) => <DocumentRow key={document.id} document={document} />)}
          {visibleDocuments.length === 0 ? <EmptyState text="Pro vybraný stav nejsou žádné dokumenty." /> : null}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle icon={<ShieldCheck size={18} />} title="Kompletace produktů" subtitle="u kroužků a táborů sleduj povinné dokumenty" />
          <div className="mt-4 grid gap-2">
            {activityRows.filter((activity) => activity.type !== 'Workshop').slice(0, 10).map((activity) => {
              const missingDocuments = missingDocumentsForActivity(activity).length;
              return <MiniRow key={activity.id} label={activity.title} meta={`${activity.place} · ${activity.registered}/${activity.capacityTotal} účastníků`} value={missingDocuments > 0 ? `${missingDocuments} chybí` : 'OK'} />;
            })}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle icon={<ListChecks size={18} />} title="Povinné balíčky" subtitle="podle typu produktu" />
          <div className="mt-4 space-y-3">
            <RequiredDocumentsPreview type="Krouzek" title="Kroužek" />
            <RequiredDocumentsPreview type="Tabor" title="Tábor" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

type ProductEdits = Partial<Pick<ParentProduct, 'title' | 'place' | 'primaryMeta' | 'capacityTotal' | 'price' | 'priceLabel'>>;

function groupCourseProducts(courses: ParentProduct[]): Array<{ baseId: string; base: ParentProduct; variant15: ParentProduct | null }> {
  const baseProducts = courses.filter((product) => !product.id.endsWith('-15'));
  return baseProducts.map((base) => ({
    baseId: base.id,
    base,
    variant15: courses.find((product) => product.id === `${base.id}-15`) ?? null,
  }));
}

function ProductsSection({ products, createdProducts, coaches, onAddProduct, onRemoveProduct }: { products: ParentProduct[]; createdProducts: ParentProduct[]; coaches: AdminCoachSummary[]; onAddProduct: (input: AdminProductInput) => ParentProduct; onRemoveProduct: (productId: string) => void }) {
  const [activeTab, setActiveTab] = useState<ActivityType>('Krouzek');
  const [removedBaseIds, setRemovedBaseIds] = useState<Set<string>>(new Set());
  const [editedProducts, setEditedProducts] = useState<Map<string, ProductEdits>>(new Map());

  function handleEdit(productId: string, edits: ProductEdits) {
    setEditedProducts((prev) => new Map(prev).set(productId, { ...prev.get(productId), ...edits }));
  }

  function applyEdits(product: ParentProduct): ParentProduct {
    const edits = editedProducts.get(product.id);
    return edits ? { ...product, ...edits } : product;
  }

  function handleRemove(product: ParentProduct) {
    const isCreated = createdProducts.some((created) => created.id === product.id);
    if (isCreated) {
      onRemoveProduct(product.id);
    } else {
      setRemovedBaseIds((prev) => new Set([...prev, product.id, `${product.id}-15`]));
    }
  }

  const visibleProducts = products.filter((product) => product.type === activeTab && !removedBaseIds.has(product.id)).map(applyEdits);
  const courses = visibleProducts.filter((product) => product.type === 'Krouzek');
  const courseGroups = groupCourseProducts(courses);
  const nonCourses = visibleProducts.filter((product) => product.type !== 'Krouzek');

  const courseGroupCount = groupCourseProducts(products.filter((product) => product.type === 'Krouzek' && !removedBaseIds.has(product.id))).length;
  const campCount = products.filter((product) => product.type === 'Tabor' && !removedBaseIds.has(product.id)).length;
  const workshopCount = products.filter((product) => product.type === 'Workshop' && !removedBaseIds.has(product.id)).length;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <ProductCreateForm coaches={coaches} onAddProduct={onAddProduct} />

      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle icon={<PackagePlus size={18} />} title="Nabídka produktů" subtitle="po vytvoření se propíše na web i do rodičovského portálu" />
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <Metric value={`${courseGroupCount + campCount + workshopCount}`} label="celkem" />
            <Metric value={`${courseGroupCount}`} label="kroužky" />
            <Metric value={`${campCount}`} label="tábory" />
            <Metric value={`${workshopCount}`} label="workshopy" />
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle icon={<ListChecks size={18} />} title="Produkty na webu" subtitle={`${activeTab === 'Krouzek' ? courseGroupCount : activeTab === 'Tabor' ? campCount : workshopCount} v kategorii`} />
          <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-[16px] border border-brand-purple/10 bg-brand-paper p-1">
            {([['Krouzek', 'Kroužky', courseGroupCount], ['Tabor', 'Tábory', campCount], ['Workshop', 'Workshopy', workshopCount]] as const).map(([type, label, count]) => (
              <button key={type} type="button" onClick={() => setActiveTab(type)} className={`flex items-center justify-center gap-1.5 rounded-[12px] px-3 py-2 text-sm font-black transition ${activeTab === type ? 'bg-brand-purple text-white shadow-brand' : 'text-brand-ink-soft hover:text-brand-ink'}`}>
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${activeTab === type ? 'bg-white/20 text-white' : 'bg-brand-purple/10 text-brand-purple'}`}>{count}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            {activeTab === 'Krouzek'
              ? courseGroups.map((group) => (
                  <GroupedCourseCard key={group.baseId} group={group} coaches={coaches} isCreated={createdProducts.some((created) => created.id === group.baseId)} onRemove={() => handleRemove(group.base)} onEdit={(edits) => handleEdit(group.baseId, edits)} />
                ))
              : nonCourses.map((product) => (
                  <AdminProductCard key={product.id} product={product} coaches={coaches} isCreated={createdProducts.some((created) => created.id === product.id)} onRemove={() => handleRemove(product)} onEdit={(edits) => handleEdit(product.id, edits)} />
                ))}
            {(activeTab === 'Krouzek' ? courseGroups.length : nonCourses.length) === 0 ? <EmptyState text="V této kategorii zatím není žádný produkt." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ProductCreateForm({ coaches, onAddProduct }: { coaches: AdminCoachSummary[]; onAddProduct: (input: AdminProductInput) => ParentProduct }) {
  const [type, setType] = useState<ActivityType>('Krouzek');
  const availableCoaches = useMemo(() => coaches.filter((coach) => coach.status !== 'Pozastaveny'), [coaches]);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Vyškov');
  const [venue, setVenue] = useState('Nová tělocvična');
  const [primaryMeta, setPrimaryMeta] = useState('Pondělí 16:00-17:00');
  const [price, setPrice] = useState('1790');
  const [capacityTotal, setCapacityTotal] = useState('25');
  const [capacityCurrent, setCapacityCurrent] = useState('0');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [description, setDescription] = useState('');
  const [trainingFocus, setTrainingFocus] = useState('bezpečné dopady, přeskoky, skill tree, NFC docházka');
  // Workshop – triky
  const [trick1, setTrick1] = useState('');
  const [trick2, setTrick2] = useState('');
  const [trick1VideoFile, setTrick1VideoFile] = useState('');
  const [trick2VideoFile, setTrick2VideoFile] = useState('');
  // Fotky (kroužek / tábor)
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Auto-vyplnit název workshopu z triků
  useEffect(() => {
    if (type !== 'Workshop') return;
    const t1 = trick1.trim();
    const t2 = trick2.trim();
    if (t1 && t2) setTitle(`Workshop: ${t1} + ${t2}`);
    else if (t1) setTitle(`Workshop: ${t1}`);
  }, [type, trick1, trick2]);

  useEffect(() => {
    if (availableCoaches.length === 0) {
      setSelectedCoachId('');
      return;
    }
    if (!availableCoaches.some((coach) => coach.id === selectedCoachId)) {
      setSelectedCoachId(availableCoaches[0].id);
    }
  }, [availableCoaches, selectedCoachId]);

  function selectType(nextType: ActivityType) {
    const defaults = productDefaults(nextType);
    setType(nextType);
    setTitle('');
    setCity(defaults.city);
    setVenue(defaults.venue);
    setPrimaryMeta(defaults.primaryMeta);
    setPrice(defaults.price);
    setCapacityTotal(defaults.capacityTotal);
    setCapacityCurrent('0');
    setSelectedCoachId(availableCoaches[0]?.id ?? '');
    setDescription('');
    setTrainingFocus(defaults.trainingFocus);
    setTrick1('');
    setTrick2('');
    setTrick1VideoFile('');
    setTrick2VideoFile('');
    setPhotos([]);
    setPhotoCount(0);
    setMessage(null);
  }

  async function handlePhotoFiles(files: FileList) {
    const results: string[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      results.push(dataUrl);
    }
    setPhotos(results);
    setPhotoCount(results.length);
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requiredFields = [city, venue, primaryMeta, price, capacityTotal];
    if (requiredFields.some((value) => value.trim().length === 0)) {
      setMessage('Doplň město, místo, termín, cenu a kapacitu.');
      return;
    }
    if (availableCoaches.length > 0 && !selectedCoachId) {
      setMessage('Vyber trenéra, který produkt povede.');
      return;
    }

    const product = onAddProduct({
      type,
      title,
      city,
      venue,
      primaryMeta,
      price: Number(price),
      capacityTotal: Number(capacityTotal),
      capacityCurrent: Number(capacityCurrent),
      coachIds: selectedCoachId ? [selectedCoachId] : [],
      description,
      trainingFocus,
      photos: photos.length > 0 ? photos : undefined,
      workshopTrick1: trick1.trim() || undefined,
      workshopTrick2: trick2.trim() || undefined,
      workshopTrick1VideoFile: trick1VideoFile || undefined,
      workshopTrick2VideoFile: trick2VideoFile || undefined,
    });
    setMessage(`${product.title} je vytvořený a dostupný na webu i u rodičů.`);
  }

  return (
    <Panel className="p-5">
      <SectionTitle icon={<Plus size={18} />} title="Přidat produkt" subtitle="kroužek, tábor nebo workshop" />
      <form onSubmit={submitProduct} className="mt-4 grid gap-3">
        <div className="grid grid-cols-3 rounded-[16px] border border-brand-purple/10 bg-brand-paper p-1">
          {(['Krouzek', 'Tabor', 'Workshop'] as const).map((item) => (
            <button key={item} type="button" onClick={() => selectType(item)} className={`rounded-[12px] px-3 py-2 text-xs font-black transition ${type === item ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-ink-soft hover:text-brand-purple'}`}>
              {activityLabel(item)}
            </button>
          ))}
        </div>

        {/* Workshop: triky a videa */}
        {type === 'Workshop' ? (
          <div className="grid gap-3 rounded-[16px] border border-brand-purple/15 bg-brand-paper p-4">
            <p className="text-xs font-black uppercase text-brand-purple">Triky workshopu</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <TextInput label="Trik 1 – název" value={trick1} onChange={setTrick1} />
                <label className="grid gap-2 text-xs font-black text-brand-ink-soft">
                  Video triku 1
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-brand-purple/20 bg-white px-3 py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple-light">
                      <Film size={15} />
                      Nahrát video
                      <input
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        onChange={(event) => setTrick1VideoFile(event.target.files?.[0]?.name ?? '')}
                      />
                    </label>
                    {trick1VideoFile ? <span className="truncate text-xs font-bold text-brand-ink-soft">{trick1VideoFile}</span> : null}
                  </div>
                </label>
              </div>
              <div className="grid gap-2">
                <TextInput label="Trik 2 – název" value={trick2} onChange={setTrick2} />
                <label className="grid gap-2 text-xs font-black text-brand-ink-soft">
                  Video triku 2
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-brand-purple/20 bg-white px-3 py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple-light">
                      <Film size={15} />
                      Nahrát video
                      <input
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        onChange={(event) => setTrick2VideoFile(event.target.files?.[0]?.name ?? '')}
                      />
                    </label>
                    {trick2VideoFile ? <span className="truncate text-xs font-bold text-brand-ink-soft">{trick2VideoFile}</span> : null}
                  </div>
                </label>
              </div>
            </div>
          </div>
        ) : null}

        <label className="grid gap-2 text-sm font-black text-brand-ink">
          {type === 'Workshop' ? 'Název (automaticky z triků)' : 'Název'}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nech prázdné pro automatický název" className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple" />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Město" value={city} onChange={setCity} />
          <TextInput label="Místo / sportoviště" value={venue} onChange={setVenue} />
          <TextInput label={type === 'Krouzek' ? 'Den a čas' : 'Termín'} value={primaryMeta} onChange={setPrimaryMeta} />
          <TextInput label="Cena v Kč" value={price} onChange={setPrice} inputMode="numeric" />
          <TextInput label="Kapacita" value={capacityTotal} onChange={setCapacityTotal} inputMode="numeric" />
          <TextInput label="Přihlášeno" value={capacityCurrent} onChange={setCapacityCurrent} inputMode="numeric" />
        </div>

        <label className="grid gap-2 text-sm font-black text-brand-ink">
          Trenér produktu
          <select value={selectedCoachId} onChange={(event) => setSelectedCoachId(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple">
            {availableCoaches.map((coach) => (
              <option key={coach.id} value={coach.id}>{coach.name}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black text-brand-ink">
          Popis
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Krátký popis pro web a rodiče" className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple" />
        </label>

        <TextInput label="Zaměření" value={trainingFocus} onChange={setTrainingFocus} />

        {/* Fotky: jen pro kroužek a tábor */}
        {type !== 'Workshop' ? (
          <div className="grid gap-2 rounded-[16px] border border-brand-purple/15 bg-brand-paper p-4">
            <p className="text-xs font-black uppercase text-brand-purple">Fotky produktu</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border border-brand-purple/20 bg-white px-3 py-2.5 text-sm font-black text-brand-purple transition hover:bg-brand-purple-light">
                <ImagePlus size={17} />
                Přiložit fotky
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => { if (event.target.files) handlePhotoFiles(event.target.files); }}
                />
              </label>
              {photoCount > 0 ? (
                <span className="rounded-[14px] bg-brand-purple-light px-3 py-2 text-xs font-black text-brand-purple">{photoCount} {photoCount === 1 ? 'fotka' : photoCount < 5 ? 'fotky' : 'fotek'} připraveno</span>
              ) : (
                <span className="text-xs font-bold text-brand-ink-soft">Nepovinné – bez fotek se použije výchozí obrázek</span>
              )}
            </div>
            {photos.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((src, index) => (
                  <img key={index} src={src} alt={`Náhled ${index + 1}`} className="h-16 w-16 rounded-[12px] object-cover shadow-sm" />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-brand-purple px-4 py-3 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep">
          <Plus size={17} />
          Vytvořit a publikovat
        </button>
        {message ? <p className="rounded-[16px] bg-brand-purple-light p-3 text-sm font-bold leading-6 text-brand-ink-soft">{message}</p> : null}
      </form>
    </Panel>
  );
}

function productCoachNames(product: ParentProduct, coaches: AdminCoachSummary[]) {
  return (product.coachIds ?? [])
    .map((coachId) => coaches.find((coach) => coach.id === coachId)?.name)
    .filter(Boolean)
    .join(', ');
}

function GroupedCourseCard({ group, coaches, isCreated, onRemove, onEdit }: { group: { baseId: string; base: ParentProduct; variant15: ParentProduct | null }; coaches: AdminCoachSummary[]; isCreated: boolean; onRemove: () => void; onEdit: (edits: ProductEdits) => void }) {
  const { base, variant15 } = group;
  const coachNames = productCoachNames(base, coaches);
  const [editing, setEditing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [title, setTitle] = useState(base.title);
  const [place, setPlace] = useState(base.place);
  const [primaryMeta, setPrimaryMeta] = useState(base.primaryMeta);
  const [capacityTotal, setCapacityTotal] = useState(String(base.capacityTotal));

  const enrollment = courseEnrollments.find((e) => e.courseId === group.baseId);

  function handleSave() {
    onEdit({ title, place, primaryMeta, capacityTotal: Number(capacityTotal) });
    setEditing(false);
  }

  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label="Kroužek" tone="mint" />
          {isCreated ? <StatusPill label="Z adminu" tone="purple" /> : <StatusPill label="Na webu" tone="mint" />}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing((prev) => !prev)} className={`inline-flex h-10 w-10 items-center justify-center rounded-[14px] transition ${editing ? 'bg-brand-purple text-white' : 'bg-white text-brand-ink-soft hover:text-brand-purple'}`} aria-label="Upravit produkt">
            <Pencil size={16} />
          </button>
          <button type="button" onClick={onRemove} className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-brand-pink transition hover:bg-brand-pink hover:text-white" aria-label="Smazat produkt">
            <Trash2 size={17} />
          </button>
        </div>
      </div>
      {editing ? (
        <div className="mt-3 grid gap-3">
          <TextInput label="Název" value={title} onChange={setTitle} />
          <TextInput label="Místo" value={place} onChange={setPlace} />
          <TextInput label="Čas / rozvrh" value={primaryMeta} onChange={setPrimaryMeta} />
          <TextInput label="Kapacita" value={capacityTotal} onChange={setCapacityTotal} inputMode="numeric" />
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} className="flex-1 rounded-[14px] bg-brand-purple py-2.5 text-sm font-black text-white transition hover:opacity-80">Uložit</button>
            <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-[14px] bg-white py-2.5 text-sm font-black text-brand-ink-soft transition hover:text-brand-ink">Zrušit</button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="mt-3 text-lg font-black text-brand-ink">{base.title}</h3>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">{base.place} · {base.primaryMeta}</p>
          {coachNames ? <p className="mt-1 text-sm font-black text-brand-purple">Trenér: {coachNames}</p> : null}
          <div className="mt-3 grid gap-1.5">
            {[base, ...(variant15 ? [variant15] : [])].map((variant) => (
              <div key={variant.id} className="flex items-center justify-between rounded-[12px] bg-white px-3 py-2">
                <p className="text-sm font-bold text-brand-ink">{variant.priceLabel}</p>
                <p className="text-sm font-black text-brand-purple">{variant.price.toLocaleString('cs-CZ')} Kč</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <Metric value={`${base.capacityCurrent}/${base.capacityTotal}`} label="kapacita" />
            <Metric value={isCreated ? 'Přidáno' : 'Vestavěný'} label="původ" />
          </div>
          {enrollment && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowParticipants((v) => !v)}
                className="flex w-full items-center justify-between rounded-[12px] border border-brand-purple/15 bg-white px-3 py-2 text-sm font-black text-brand-ink transition hover:border-brand-purple/40"
              >
                <span className="flex items-center gap-2">
                  <Users size={14} className="text-brand-purple" />
                  Přihlášení ({enrollment.participants.length})
                </span>
                <ChevronDown size={14} className={`text-brand-ink-soft transition-transform ${showParticipants ? 'rotate-180' : ''}`} />
              </button>
              {showParticipants && (
                <div className="mt-2 space-y-1">
                  {enrollment.participants.map((p) => (
                    <div key={p.name} className="flex items-center justify-between rounded-[10px] bg-white px-3 py-1.5">
                      <span className="text-sm font-bold text-brand-ink">{p.name}</span>
                      <span className={`text-xs font-black ${p.remaining <= 2 ? 'text-[#F0445B]' : p.remaining <= 4 ? 'text-[#FFB21A]' : 'text-brand-purple'}`}>
                        {p.remaining} vstupů
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdminProductCard({ product, coaches, isCreated, onRemove, onEdit }: { product: ParentProduct; coaches: AdminCoachSummary[]; isCreated: boolean; onRemove: () => void; onEdit: (edits: ProductEdits) => void }) {
  const coachNames = productCoachNames(product, coaches);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(product.title);
  const [place, setPlace] = useState(product.place);
  const [primaryMeta, setPrimaryMeta] = useState(product.primaryMeta);
  const [price, setPrice] = useState(String(product.price));
  const [capacityTotal, setCapacityTotal] = useState(String(product.capacityTotal));

  function handleSave() {
    const priceNum = Number(price);
    onEdit({ title, place, primaryMeta, price: priceNum, priceLabel: `${priceNum.toLocaleString('cs-CZ')} Kč`, capacityTotal: Number(capacityTotal) });
    setEditing(false);
  }

  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={activityLabel(product.type)} tone={product.type === 'Workshop' ? 'purple' : product.type === 'Tabor' ? 'orange' : 'mint'} />
          {isCreated ? <StatusPill label="Z adminu" tone="purple" /> : <StatusPill label="Na webu" tone="mint" />}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing((prev) => !prev)} className={`inline-flex h-10 w-10 items-center justify-center rounded-[14px] transition ${editing ? 'bg-brand-purple text-white' : 'bg-white text-brand-ink-soft hover:text-brand-purple'}`} aria-label="Upravit produkt">
            <Pencil size={16} />
          </button>
          <button type="button" onClick={onRemove} className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-brand-pink transition hover:bg-brand-pink hover:text-white" aria-label="Smazat produkt">
            <Trash2 size={17} />
          </button>
        </div>
      </div>
      {editing ? (
        <div className="mt-3 grid gap-3">
          <TextInput label="Název" value={title} onChange={setTitle} />
          <TextInput label="Místo" value={place} onChange={setPlace} />
          <TextInput label="Datum / čas" value={primaryMeta} onChange={setPrimaryMeta} />
          <TextInput label="Cena (Kč)" value={price} onChange={setPrice} inputMode="numeric" />
          <TextInput label="Kapacita" value={capacityTotal} onChange={setCapacityTotal} inputMode="numeric" />
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} className="flex-1 rounded-[14px] bg-brand-purple py-2.5 text-sm font-black text-white transition hover:opacity-80">Uložit</button>
            <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-[14px] bg-white py-2.5 text-sm font-black text-brand-ink-soft transition hover:text-brand-ink">Zrušit</button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="mt-3 text-lg font-black text-brand-ink">{product.title}</h3>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">{product.place} · {product.primaryMeta}</p>
          {coachNames ? <p className="mt-1 text-sm font-black text-brand-purple">Trenér: {coachNames}</p> : null}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Metric value={product.priceLabel} label="cena" />
            <Metric value={`${product.capacityCurrent}/${product.capacityTotal}`} label="kapacita" />
            <Metric value={isCreated ? 'Přidáno' : 'Vestavěný'} label="původ" />
          </div>
          {product.description ? <p className="mt-3 text-sm font-bold leading-6 text-brand-ink-soft">{product.description}</p> : null}
        </>
      )}
    </div>
  );
}

function TextInput({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (value: string) => void; inputMode?: 'numeric' | 'decimal' }) {
  return (
    <label className="grid gap-2 text-sm font-black text-brand-ink">
      {label}
      <input value={value} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple" />
    </label>
  );
}

function productDefaults(type: ActivityType) {
  if (type === 'Tabor') {
    return { city: 'Vyškov', venue: 'Orel jednota Vyškov', primaryMeta: 'Léto 2026', price: '3890', capacityTotal: '30', trainingFocus: 'parkour základy, hry, venkovní výzvy, bezpečný režim' };
  }
  if (type === 'Workshop') {
    return { city: 'Praha', venue: 'Balkan', primaryMeta: '14. 6. 2026 · 10:00', price: '890', capacityTotal: '40', trainingFocus: 'tic-tac, kong vault, flow, QR ticket' };
  }
  return { city: 'Vyškov', venue: 'Nová tělocvična', primaryMeta: 'Pondělí 16:00-17:00', price: '1790', capacityTotal: '25', trainingFocus: 'bezpečné dopady, přeskoky, skill tree, NFC docházka' };
}

function PastSessionRow({ rec, slotTricks, cityBadge, cityText, fmtDate }: {
  rec: WorkshopAttendanceRecord & { slot: WorkshopSlot };
  slotTricks: number;
  cityBadge: string;
  cityText: string;
  fmtDate: (iso: string) => string;
}) {
  return (
    <div className="rounded-[14px] bg-brand-paper px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`shrink-0 rounded-[8px] px-2 py-0.5 text-xs font-black ${cityBadge}`}>{rec.slot.city}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-brand-ink leading-tight">{fmtDate(rec.slot.date)}</p>
          <p className="text-[11px] text-brand-ink-soft">{rec.slot.venue} · {rec.slot.time}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-black text-brand-ink leading-tight">{rec.attendees}</p>
            <p className="text-[9px] font-bold uppercase text-brand-ink-soft">účastníků</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-black leading-tight ${cityText}`}>{slotTricks}</p>
            <p className="text-[9px] font-bold uppercase text-brand-ink-soft">triků</p>
          </div>
        </div>
      </div>
      {rec.coachTrickCounts.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {rec.coachTrickCounts.map((ct) => (
            <span key={ct.coachId} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-brand-ink shadow-sm">
              {ct.coachName.split(' ')[0]} · {ct.count} triků
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkshopStatsPanel({ allSlots, attendanceRecords, onOpenParticipant }: { allSlots: WorkshopSlot[]; attendanceRecords: WorkshopAttendanceRecord[]; onOpenParticipant?: (participant: ParentParticipant, place: string) => void }) {
  const CITY_BADGE: Record<WorkshopCity, string> = { Brno: 'bg-[#8B1DFF] text-white', Praha: 'bg-[#1FB37A] text-white', Ostrava: 'bg-[#FFB21A] text-brand-ink' };
  const CITY_TEXT: Record<WorkshopCity, string> = { Brno: 'text-[#8B1DFF]', Praha: 'text-[#1FB37A]', Ostrava: 'text-[#FFB21A]' };
  const CITY_BG: Record<WorkshopCity, string> = { Brno: 'bg-[#8B1DFF]/10', Praha: 'bg-[#1FB37A]/10', Ostrava: 'bg-[#FFB21A]/15' };
  const [monthIdx, setMonthIdx] = useState(0);

  const allRecords = attendanceRecords.map((rec) => {
    const slot = allSlots.find((s) => s.id === rec.slotId);
    return { ...rec, slot };
  }).filter((r): r is WorkshopAttendanceRecord & { slot: WorkshopSlot } => !!r.slot);

  // Group by month (newest first)
  const groups: { key: string; label: string; items: typeof allRecords }[] = [];
  for (const rec of [...allRecords].sort((a, b) => b.slot.date.localeCompare(a.slot.date))) {
    const [y, m] = rec.slot.date.split('-');
    const key = `${y}-${m}`;
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('cs-CZ', { month: 'long', year: 'numeric' });
    const existing = groups.find((g) => g.key === key);
    if (existing) { existing.items.push(rec); } else { groups.push({ key, label, items: [rec] }); }
  }

  const safeIdx = groups.length > 0 ? Math.min(monthIdx, groups.length - 1) : 0;
  const records = groups.length > 0 ? groups[safeIdx].items : allRecords;
  const currentLabel = groups[safeIdx]?.label;

  const totalAttendees = records.reduce((s, r) => s + r.attendees, 0);
  const totalTricks = records.reduce((s, r) => s + r.coachTrickCounts.reduce((a, c) => a + c.count, 0), 0);

  const cities: WorkshopCity[] = ['Brno', 'Praha', 'Ostrava'];
  const cityStats = cities.map((city) => {
    const cityRecs = records.filter((r) => r.slot.city === city);
    return { city, count: cityRecs.length, attendees: cityRecs.reduce((s, r) => s + r.attendees, 0), tricks: cityRecs.reduce((s, r) => s + r.coachTrickCounts.reduce((a, c) => a + c.count, 0), 0) };
  });

  const coachMap = new Map<string, { name: string; tricks: number; workshops: number }>();
  for (const rec of records) {
    for (const ct of rec.coachTrickCounts) {
      const existing = coachMap.get(ct.coachId);
      if (existing) { existing.tricks += ct.count; existing.workshops++; }
      else { coachMap.set(ct.coachId, { name: ct.coachName, tricks: ct.count, workshops: 1 }); }
    }
  }
  const coachLeaderboard = [...coachMap.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.tricks - a.tricks);
  const maxTricks = coachLeaderboard[0]?.tricks ?? 1;

  return (
    <article className="rounded-[18px] border border-brand-purple/10 bg-white p-5 shadow-brand-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle icon={<BarChart2 size={18} />} title="Statistiky proběhlých workshopů" subtitle={`${allRecords.length} workshopů · sezóna 2025/2026`} />
        {groups.length > 1 && (
          <div className="flex items-center gap-1">
            <button type="button" disabled={safeIdx >= groups.length - 1} onClick={() => setMonthIdx(safeIdx + 1)} className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-paper text-brand-purple transition hover:bg-brand-purple/10 disabled:cursor-default disabled:opacity-30">
              <ChevronDown size={15} className="rotate-90" />
            </button>
            <span className="min-w-[124px] text-center text-xs font-black uppercase tracking-wide text-brand-purple">{currentLabel}</span>
            <button type="button" disabled={safeIdx === 0} onClick={() => setMonthIdx(safeIdx - 1)} className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-paper text-brand-purple transition hover:bg-brand-purple/10 disabled:cursor-default disabled:opacity-30">
              <ChevronDown size={15} className="-rotate-90" />
            </button>
          </div>
        )}
      </div>

      {/* Summary row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'workshopů', value: records.length },
          { label: 'účastníků', value: totalAttendees },
          { label: 'triků rozdáno', value: totalTricks },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-[14px] bg-brand-paper px-3 py-3 text-center">
            <p className="text-2xl font-black text-brand-purple">{value}</p>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-brand-ink-soft">{label}</p>
          </div>
        ))}
      </div>

      {/* City breakdown */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cityStats.map(({ city, count, attendees, tricks }) => (
          <div key={city} className={`rounded-[14px] px-4 py-3 ${CITY_BG[city]}`}>
            <div className="flex items-center justify-between">
              <span className={`rounded-[8px] px-2 py-0.5 text-xs font-black ${CITY_BADGE[city]}`}>{city}</span>
              <span className={`text-xs font-black ${CITY_TEXT[city]}`}>{count}×</span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <p className="text-lg font-black text-brand-ink leading-none">{attendees}</p>
                <p className="text-[10px] font-bold text-brand-ink-soft uppercase tracking-wide">účastníků</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-black leading-none ${CITY_TEXT[city]}`}>{tricks}</p>
                <p className="text-[10px] font-bold text-brand-ink-soft uppercase tracking-wide">triků</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coach leaderboard */}
      {coachLeaderboard.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-brand-ink-soft">Trenéři · triky rozdáné na workshopech</p>
          <div className="space-y-1.5">
            {coachLeaderboard.map((coach, i) => (
              <div key={coach.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-center text-xs font-black text-brand-ink-soft">{i + 1}</span>
                <span className="w-28 shrink-0 truncate text-sm font-bold text-brand-ink">{coach.name}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-brand-purple/10">
                  <div className="h-2 rounded-full bg-brand-purple transition-all" style={{ width: `${Math.round((coach.tricks / maxTricks) * 100)}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-black text-brand-purple">{coach.tricks}</span>
                <span className="w-16 shrink-0 text-right text-[10px] font-bold text-brand-ink-soft">{coach.workshops} WS</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </article>
  );
}

function WorkshopUpcomingPanel({ slots, attendanceRecords = [], onOpenParticipant }: { slots: WorkshopSlot[]; attendanceRecords?: WorkshopAttendanceRecord[]; onOpenParticipant?: (participant: ParentParticipant, place: string) => void }) {
  const WS_CAPACITY = 40;
  const CITY_BADGE: Record<WorkshopCity, string> = { Brno: 'bg-[#8B1DFF] text-white', Praha: 'bg-[#1FB37A] text-white', Ostrava: 'bg-[#FFB21A] text-brand-ink' };
  const CITY_BAR: Record<WorkshopCity, string> = { Brno: 'bg-[#8B1DFF]', Praha: 'bg-[#1FB37A]', Ostrava: 'bg-[#FFB21A]' };
  const DOW_CS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
  const [monthIdx, setMonthIdx] = useState(0);
  const [openSlotId, setOpenSlotId] = useState<string | null>(null);

  const WS_MOCK_NAMES = ['Jakub N.', 'Eliška K.', 'Tomáš P.', 'Martin S.', 'Klára M.', 'Ondřej B.', 'Tereza V.', 'Michal H.', 'Adéla R.', 'Jan Č.', 'Barbora F.', 'Adam D.', 'Petra N.', 'David L.', 'Zuzana T.', 'Jiří K.', 'Veronika P.', 'Natálie O.', 'Filip S.', 'Lenka H.', 'Pavel M.', 'Anežka B.', 'Václav Č.', 'Simona R.', 'Radek K.', 'Lucie V.', 'Miroslav D.', 'Eva P.', 'Jana H.', 'Lukáš R.', 'Karolína T.', 'Petr M.', 'Markéta H.', 'Josef K.', 'Dominika S.'];
  function mockRegistered(slot: WorkshopSlot): number {
    const seed = slot.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return (seed % 28) + 7;
  }
  function mockRegisteredNames(slot: WorkshopSlot): string[] {
    const count = mockRegistered(slot);
    const seed = slot.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const candidate = WS_MOCK_NAMES[(seed + i * 7) % WS_MOCK_NAMES.length];
      result.push(result.includes(candidate) ? WS_MOCK_NAMES[(seed + i * 7 + 3) % WS_MOCK_NAMES.length] : candidate);
    }
    return result;
  }
  function fmtDate(iso: string) {
    const [y, m, d] = iso.split('-').map(Number);
    const dow = DOW_CS[new Date(y, m - 1, d).getDay()];
    return `${dow} ${d}. ${m}. ${y}`;
  }

  const groups: { key: string; label: string; items: WorkshopSlot[] }[] = [];
  for (const slot of slots) {
    const [y, m] = slot.date.split('-');
    const key = `${y}-${m}`;
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('cs-CZ', { month: 'long', year: 'numeric' });
    const existing = groups.find((g) => g.key === key);
    if (existing) { existing.items.push(slot); } else { groups.push({ key, label, items: [slot] }); }
  }

  const safeIdx = Math.min(monthIdx, Math.max(0, groups.length - 1));
  const currentGroup = groups[safeIdx];

  return (
    <article className="rounded-[18px] border border-brand-purple/10 bg-white p-5 shadow-brand-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle icon={<ListChecks size={18} />} title="Nadcházející workshopy" subtitle={`${slots.length} termínů · přihlášení na každý termín`} />
        {groups.length > 1 && (
          <div className="flex items-center gap-1">
            <button type="button" disabled={safeIdx === 0} onClick={() => { setMonthIdx(safeIdx - 1); setOpenSlotId(null); }} className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-paper text-brand-purple transition hover:bg-brand-purple/10 disabled:cursor-default disabled:opacity-30">
              <ChevronDown size={15} className="rotate-90" />
            </button>
            <span className="min-w-[124px] text-center text-xs font-black uppercase tracking-wide text-brand-purple">{currentGroup?.label}</span>
            <button type="button" disabled={safeIdx >= groups.length - 1} onClick={() => { setMonthIdx(safeIdx + 1); setOpenSlotId(null); }} className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-paper text-brand-purple transition hover:bg-brand-purple/10 disabled:cursor-default disabled:opacity-30">
              <ChevronDown size={15} className="-rotate-90" />
            </button>
          </div>
        )}
      </div>
      {groups.length === 0 ? <div className="mt-4"><EmptyState text="Žádné nadcházející workshopy." /></div> : null}
      {currentGroup && (
        <div className="mt-4 grid gap-2">
          {currentGroup.items.map((slot) => {
            const registered = mockRegistered(slot);
            const pct = Math.min(100, Math.round((registered / WS_CAPACITY) * 100));
            const isFull = registered >= WS_CAPACITY;
            const isAlmostFull = pct >= 80;
            const isOpen = openSlotId === slot.id;
            const attendance = attendanceRecords.find((r) => r.slotId === slot.id);
            return (
              <div key={slot.id} className="overflow-hidden rounded-[14px] bg-brand-paper">
                <button
                  type="button"
                  onClick={() => setOpenSlotId(isOpen ? null : slot.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-purple/5"
                >
                  <span className={`shrink-0 rounded-[9px] px-2.5 py-1.5 text-xs font-black ${CITY_BADGE[slot.city]}`}>{slot.city}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-brand-ink">{fmtDate(slot.date)}{slot.dateTo ? ` – ${fmtDate(slot.dateTo)}` : ''}</p>
                    <p className="mt-0.5 truncate text-xs font-bold text-brand-ink-soft">{slot.venue} · {slot.time}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="min-w-[72px] text-right">
                      <p className={`text-sm font-black ${isFull ? 'text-[#F0445B]' : isAlmostFull ? 'text-[#FFB21A]' : 'text-brand-ink'}`}>
                        {registered}/{WS_CAPACITY}
                      </p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-purple/10">
                        <div className={`h-full rounded-full transition-all ${isFull ? 'bg-[#F0445B]' : isAlmostFull ? 'bg-[#FFB21A]' : CITY_BAR[slot.city]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <ChevronDown size={14} className={`shrink-0 text-brand-ink-soft transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-brand-purple/10 px-4 py-3">
                    {attendance ? (
                      <>
                        <p className="mb-2 text-xs font-black uppercase tracking-wide text-brand-ink-soft">{attendance.attendees} účastníků</p>
                        <div className="flex flex-wrap gap-1.5">
                          {attendance.participants.map((name) => {
                            const p = workshopParticipantFromShortName(name, slot.venue);
                            return onOpenParticipant ? (
                              <button key={name} type="button" onClick={() => onOpenParticipant(p, slot.venue)} className="rounded-[999px] bg-brand-purple/10 px-2.5 py-1 text-xs font-black text-brand-purple-deep transition hover:bg-brand-purple hover:text-white">
                                {name}
                              </button>
                            ) : (
                              <span key={name} className="rounded-[999px] bg-brand-purple/10 px-2.5 py-1 text-xs font-bold text-brand-ink-soft">{name}</span>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mb-2 text-xs font-black uppercase tracking-wide text-brand-ink-soft">Přihlášeni · {registered} z {WS_CAPACITY}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mockRegisteredNames(slot).map((name) => {
                            const p = workshopParticipantFromShortName(name, slot.venue);
                            return onOpenParticipant ? (
                              <button key={name} type="button" onClick={() => onOpenParticipant(p, slot.venue)} className="rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-xs font-black text-brand-purple-deep transition hover:bg-brand-purple hover:text-white">
                                {name}
                              </button>
                            ) : (
                              <span key={name} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-brand-ink shadow-sm">{name}</span>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function ParticipantTypeSwitch({ activeType, groupsByType, workshopUpcomingCount, onChange }: { activeType: ActivityType; groupsByType: Record<ActivityType, ParticipantGroup[]>; workshopUpcomingCount: number; onChange: (type: ActivityType) => void }) {
  const typeOptions: Array<{ type: ActivityType; label: string; sublabel: string; icon: ReactNode; count: number }> = [
    { type: 'Krouzek', label: 'Kroužky', sublabel: `${groupsByType.Krouzek.length} lokalit`, icon: <MapPin size={17} />, count: groupsByType.Krouzek.reduce((s, g) => s + g.participants.length, 0) },
    { type: 'Tabor', label: 'Tábory', sublabel: `${groupsByType.Tabor.length} turnusů`, icon: <ShieldCheck size={17} />, count: groupsByType.Tabor.reduce((s, g) => s + g.participants.length, 0) },
    { type: 'Workshop', label: 'Workshopy', sublabel: 'nadcházející termíny', icon: <ListChecks size={17} />, count: workshopUpcomingCount },
  ];

  return (
    <div className="grid gap-2 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-1.5 sm:grid-cols-3">
      {typeOptions.map((option) => {
        const active = activeType === option.type;
        return (
          <button key={option.type} type="button" onClick={() => onChange(option.type)} className={`flex min-w-0 items-center justify-between gap-3 rounded-[14px] px-3 py-3 text-left transition ${active ? 'bg-brand-purple text-white shadow-brand-soft' : 'bg-white text-brand-ink hover:bg-brand-purple-light'}`}>
            <span className="flex min-w-0 items-center gap-2">
              <span className={active ? 'text-white' : 'text-brand-purple'}>{option.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-tight">{option.label}</span>
                <span className={`mt-0.5 block text-[10px] font-black uppercase ${active ? 'text-white/72' : 'text-brand-ink-soft'}`}>{option.sublabel}</span>
              </span>
            </span>
            <span className={`shrink-0 rounded-[999px] px-2.5 py-1 text-xs font-black ${active ? 'bg-white/18 text-white' : 'bg-brand-purple-light text-brand-purple-deep'}`}>{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function ActivityParticipantTypeSection({ type, groups, onOpenParticipantDetail }: { type: ActivityType; groups: ParticipantGroup[]; onOpenParticipantDetail: (participant: ParentParticipant, activityType: ActivityType, place: string) => void }) {
  const totalParticipants = groups.reduce((sum, group) => sum + group.participants.length, 0);
  const cityGroups = groupParticipantGroupsByCity(groups);
  const termGroups = type === 'Tabor' ? groupParticipantGroupsByTerm(groups) : [];
  const subtitle = type === 'Tabor'
    ? `léto 2026 · ${cityGroups.length} měst · ${groups.length} turnusů · ${totalParticipants} účastníků`
    : `${cityGroups.length} měst · ${groups.length} lokalit · ${totalParticipants} účastníků`;

  return (
    <article className="rounded-[18px] border border-brand-purple/10 bg-white p-5 shadow-brand-soft">
      <SectionTitle icon={type === 'Krouzek' ? <MapPin size={18} /> : type === 'Tabor' ? <ShieldCheck size={18} /> : <ListChecks size={18} />} title={activityLabel(type)} subtitle={subtitle} />
      <div className="mt-4 space-y-3">
        {cityGroups.map((cityGroup) => <ParticipantCityDropdown key={cityGroup.key} cityGroup={cityGroup} onOpenParticipantDetail={onOpenParticipantDetail} />)}
        {groups.length === 0 ? <EmptyState text={`Pro ${activityLabel(type).toLowerCase()} není žádná odpovídající lokalita.`} /> : null}
      </div>
    </article>
  );
}

function ParticipantCityDropdown({ cityGroup, onOpenParticipantDetail }: { cityGroup: ParticipantCityGroup; onOpenParticipantDetail: (participant: ParentParticipant, activityType: ActivityType, place: string) => void }) {
  const isCampGroup = cityGroup.groups[0]?.type === 'Tabor';
  const subtitle = isCampGroup
    ? `${cityGroup.groups.length} turnusů · ${cityGroup.participantCount} účastníků`
    : `${cityGroup.groups.length} lokalit · ${cityGroup.participantCount} účastníků`;

  return (
    <CollapsiblePanel icon={<MapPin size={18} />} title={cityGroup.city} subtitle={subtitle} count={cityGroup.missingDocuments > 0 ? `${cityGroup.missingDocuments} dok. chybí` : 'Dokumenty OK'} defaultOpen={false}>
      <div className="grid gap-3">
        {cityGroup.groups.map((group) => <ParticipantLocationCard key={group.key} group={group} onOpenParticipantDetail={onOpenParticipantDetail} />)}
      </div>
    </CollapsiblePanel>
  );
}

function ParticipantTermDropdown({ termGroup, onOpenParticipantDetail }: { termGroup: ParticipantTermGroup; onOpenParticipantDetail: (participant: ParentParticipant, activityType: ActivityType, place: string) => void }) {
  const cityGroups = groupParticipantGroupsByCity(termGroup.groups);

  return (
    <CollapsiblePanel icon={<CalendarDays size={18} />} title={termGroup.term} subtitle={`${cityGroups.length} měst · ${termGroup.groups.length} lokalit · ${termGroup.participantCount} účastníků`} count={termGroup.missingDocuments > 0 ? `${termGroup.missingDocuments} dok. chybí` : 'Dokumenty OK'} defaultOpen>
      <div className="grid gap-3">
        {cityGroups.map((cityGroup) => <ParticipantCityDropdown key={`${termGroup.key}-${cityGroup.key}`} cityGroup={cityGroup} onOpenParticipantDetail={onOpenParticipantDetail} />)}
      </div>
    </CollapsiblePanel>
  );
}

function ParticipantLocationCard({ group, onOpenParticipantDetail }: { group: ParticipantGroup; onOpenParticipantDetail: (participant: ParentParticipant, activityType: ActivityType, place: string) => void }) {
  const missingDocuments = group.participants.reduce((sum, participant) => sum + documentsForActivityParticipant(participant, group.type).filter((document) => document.status !== 'signed').length, 0);

  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-white p-4 shadow-brand-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-[16px] bg-brand-paper px-4 py-3">
        <div className="min-w-0">
          <p className="font-black leading-tight text-brand-ink">{group.place}</p>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">{group.product.primaryMeta}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${group.participants.length} účastníků`} tone="purple" />
          <StatusPill label={missingDocuments > 0 ? `${missingDocuments} dok. chybí` : 'Dokumenty OK'} tone={missingDocuments > 0 ? 'orange' : 'mint'} />
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {group.participants.map((participant) => <ParticipantCompactRow key={`${group.key}-${participant.id}`} participant={participant} activityType={group.type} place={group.place} onOpen={() => onOpenParticipantDetail(participant, group.type, group.place)} />)}
      </div>
      {group.participants.length === 0 ? <p className="mt-3 rounded-[16px] bg-white p-3 text-sm font-bold leading-6 text-brand-ink-soft">Zatím tady není přiřazený žádný účastník.</p> : null}
    </div>
  );
}

function ManualAttendancePanel({ coaches, onAdd }: { coaches: AdminCoachSummary[]; onAdd: (input: ManualCoachAttendanceInput) => CoachAttendanceRecord }) {
  return (
    <CollapsiblePanel icon={<ClipboardList size={18} />} title="Doplnit docházku ručně" subtitle="když trenér zapomene zapsat lekci" count="admin" defaultOpen={false}>
      <ManualCoachAttendanceForm coaches={coaches} onAdd={onAdd} />
    </CollapsiblePanel>
  );
}

function ParticipantCompactRow({ participant, activityType, place, onOpen }: { participant: ParentParticipant; activityType: ActivityType; place: string; onOpen: () => void }) {
  const participantName = `${participant.firstName} ${participant.lastName}`;
  const participantDocuments = documentsForActivityParticipant(participant, activityType);
  const missingDocuments = participantDocuments.filter((document) => document.status !== 'signed').length;
  const statusValue = activityType === 'Krouzek' ? `${participant.attendanceDone}/${participant.attendanceTotal}` : activityType === 'Tabor' ? 'Registrován' : 'Ticket';

  return (
    <button type="button" onClick={onOpen} className="flex items-center justify-between gap-3 rounded-[14px] border border-brand-purple/10 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-brand-purple/24 hover:shadow-brand-soft">
      <div className="min-w-0 flex-1">
        <p className="truncate font-black leading-snug text-brand-ink">{participantName}</p>
        <p className="mt-0.5 text-xs font-bold text-brand-ink-soft">{statusValue} · L{participant.level}</p>
      </div>
      <StatusPill label={missingDocuments > 0 ? `${missingDocuments} chybí` : 'OK'} tone={missingDocuments > 0 ? 'orange' : 'mint'} />
    </button>
  );
}

function CoachPlacementSection({ title, subtitle, groups, emptyText, dppDocuments, coachAttendanceRecords, onOpenCoach, compact = false }: { title: string; subtitle: string; groups: CoachPlacementGroup[]; emptyText: string; dppDocuments: AdminCoachDppDocument[]; coachAttendanceRecords: CoachAttendanceRecord[]; onOpenCoach: (coachId: string) => void; compact?: boolean }) {
  return (
    <Panel className="p-5">
      <SectionTitle icon={<MapPin size={18} />} title={title} subtitle={subtitle} />
      <div className="mt-4 grid gap-3">
        {groups.map((group) => <CoachPlacementGroupCard key={group.key} group={group} dppDocuments={dppDocuments} coachAttendanceRecords={coachAttendanceRecords} onOpenCoach={onOpenCoach} compact={compact} />)}
        {groups.length === 0 ? <EmptyState text={emptyText} /> : null}
      </div>
    </Panel>
  );
}

function CoachPlacementGroupCard({ group, dppDocuments, coachAttendanceRecords, onOpenCoach }: { group: CoachPlacementGroup; dppDocuments: AdminCoachDppDocument[]; coachAttendanceRecords: CoachAttendanceRecord[]; onOpenCoach: (coachId: string) => void; compact: boolean }) {
  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-white p-3 shadow-brand-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-[14px] bg-brand-paper px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight text-brand-ink">{group.place}</p>
          <p className="mt-1 text-xs font-bold text-brand-ink-soft">{activityLabel(group.type)} · {group.primaryMeta}</p>
        </div>
        <StatusPill label={`${group.coaches.length} trenér${group.coaches.length === 1 ? '' : 'ů'}`} tone={group.coaches.length > 0 ? 'purple' : 'orange'} />
      </div>
      <div className="mt-3 grid gap-2">
        {group.coaches.map((coach) => <CoachLocationRow key={`${group.key}-${coach.id}`} coach={coach} group={group} dppDocument={documentForCoach(coach, dppDocuments)} coachAttendanceRecords={coachAttendanceRecords} onOpen={() => onOpenCoach(coach.id)} />)}
        {group.coaches.length === 0 ? <p className="rounded-[14px] bg-white p-3 text-xs font-bold leading-5 text-brand-ink-soft">Zatím bez přiřazeného trenéra.</p> : null}
      </div>
    </div>
  );
}

function CoachLocationRow({ coach, group, dppDocument, coachAttendanceRecords, onOpen }: { coach: AdminCoachSummary; group: CoachPlacementGroup; dppDocument: AdminCoachDppDocument; coachAttendanceRecords: CoachAttendanceRecord[]; onOpen: () => void }) {
  const coachRecords = recordsForCoach(coach, coachAttendanceRecords);

  return (
    <button type="button" onClick={onOpen} className="flex flex-wrap items-center justify-between gap-3 rounded-[15px] border border-brand-purple/10 bg-white px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-brand-purple/30 hover:shadow-brand-soft">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-brand-purple-light text-sm font-black text-brand-purple-deep">{initialsForName(coach.name)}</span>
        <span className="min-w-0">
          <span className="block text-sm font-black leading-tight text-brand-ink">{coach.name}</span>
          <span className="mt-1 flex min-w-0 items-center gap-1 text-xs font-bold leading-tight text-brand-ink-soft"><Banknote size={13} /> {coach.bankAccount}</span>
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StatusPill label={coachStatusLabel(coach.status)} tone={coach.status === 'Aktivni' ? 'mint' : 'orange'} />
        <span className="rounded-[999px] bg-brand-paper px-3 py-2 text-xs font-black uppercase text-brand-ink-soft">{coachRecords.length} záp.</span>
        <StatusPill label={coachDppStatusLabel(dppDocument.status)} tone={coachDppStatusTone(dppDocument.status)} />
      </span>
    </button>
  );
}

function CoachSummaryCard({ coach, coachAttendanceRecords, dppDocument, onOpen }: { coach: AdminCoachSummary; coachAttendanceRecords: CoachAttendanceRecord[]; dppDocument: AdminCoachDppDocument; onOpen: () => void }) {
  const coachRecords = recordsForCoach(coach, coachAttendanceRecords);

  return (
    <button type="button" onClick={onOpen} className="rounded-[18px] border border-brand-purple/10 bg-white p-5 text-left shadow-brand-soft transition hover:-translate-y-0.5 hover:border-brand-purple/24 hover:shadow-brand">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StatusPill label={coachStatusLabel(coach.status)} tone={coach.status === 'Aktivni' ? 'mint' : 'orange'} />
          <h3 className="mt-3 text-xl font-black text-brand-ink">{coach.name}</h3>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">{coach.locations.slice(0, 2).join(' · ')}</p>
        </div>
        <StatusPill label={coachDppStatusLabel(dppDocument.status)} tone={coachDppStatusTone(dppDocument.status)} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric value={`${coach.loggedHours}`} label="hodin" />
        <Metric value={`${coach.childrenLogged}`} label="děti" />
        <Metric value={currency(payoutAmountForCoach(coach, coachAttendanceRecords))} label="výplata" />
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-brand-ink-soft">{coach.locations.length} lokality · {coachRecords.length} záznamů docházky · {coach.stripeAccountId ? 'Stripe aktivní' : 'Stripe chybí'}</p>
    </button>
  );
}

function CoachDetailCard({ coach, coachAttendanceRecords, dppDocument, onAddCoachAttendance, onCreateCoachDpp, onMarkCoachDppSigned }: { coach: AdminCoachSummary; coachAttendanceRecords: CoachAttendanceRecord[]; dppDocument: AdminCoachDppDocument; onAddCoachAttendance: (input: ManualCoachAttendanceInput) => CoachAttendanceRecord; onCreateCoachDpp: (coach: AdminCoachSummary) => AdminCoachDppDocument; onMarkCoachDppSigned: (coachId: string) => void }) {
  const trainerProducts = parentProducts.filter((product) => trainersForProduct(product).some((trainer) => trainer.id === coach.id));

  return (
    <Panel className="p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[18px] border border-brand-purple/10 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <StatusPill label={coachStatusLabel(coach.status)} tone={coach.status === 'Aktivni' ? 'mint' : 'orange'} />
              <h3 className="mt-3 text-xl font-black text-brand-ink">{coach.name}</h3>
              <p className="mt-1 text-sm font-bold text-brand-ink-soft">{coach.locations.length} lokality · poslední zápis {coach.lastAttendance}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-brand-purple-light text-base font-black text-brand-purple-deep">{initialsForName(coach.name)}</div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <InfoBlock icon={<Mail size={16} />} label="E-mail" value={coach.email} />
            <InfoBlock icon={<Phone size={16} />} label="Telefon" value={coach.phone} />
          </div>
        </div>

        <div className="rounded-[18px] bg-brand-ink p-4 text-white shadow-brand-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-white/60">K výplatě</p>
              <p className="mt-1 text-2xl font-black">{currency(payoutAmountForCoach(coach, coachAttendanceRecords))}</p>
            </div>
            <span className="rounded-[14px] bg-white/10 p-2"><Banknote size={18} /></span>
          </div>
          <div className="mt-4 grid gap-2 text-sm font-bold leading-6 text-white/78">
            <p><span className="text-[11px] font-black uppercase text-white/48">Bankovní účet</span><br />{coach.bankAccount}</p>
            <p><span className="text-[11px] font-black uppercase text-white/48">IBAN</span><br />{coach.iban ?? 'není vyplněn'}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Metric value={`${coach.loggedHours}`} label="hodin" />
        <Metric value={`${coach.childrenLogged}`} label="zapsání dětí" />
        <Metric value={currency(payoutAmountForCoach(coach, coachAttendanceRecords))} label="k výplatě" />
        <Metric value={coach.stripeAccountId ? 'aktivní' : 'chybí'} label="Stripe" />
        <Metric value={coachDppStatusLabel(dppDocument.status)} label="DPP" />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[18px] border border-brand-purple/10 bg-white p-4">
          <p className="text-xs font-black uppercase text-brand-purple">Platební informace</p>
          <div className="mt-3 grid gap-2">
            <InfoBlock label="Bankovní účet" value={coach.bankAccount} />
            <InfoBlock label="IBAN" value={coach.iban ?? 'není vyplněn'} />
            <InfoBlock label="Stripe Connect" value={coach.stripeAccountId ?? 'čeká na doplnění'} />
          </div>
        </div>
        <div className="rounded-[18px] border border-brand-purple/10 bg-white p-4">
          <p className="text-xs font-black uppercase text-brand-purple">Přiřazení</p>
          <div className="mt-3 grid gap-2">
            <InfoBlock label="Produkty" value={trainerProducts.length ? trainerProducts.map((product) => product.title).slice(0, 3).join(' · ') : 'Zatím bez veřejně přiřazeného produktu'} />
            <InfoBlock label="QR triky" value={`${coach.qrTricksApproved} schváleno`} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {coach.locations.map((location) => <span key={location} className="rounded-[14px] bg-brand-purple-light px-3 py-2 text-xs font-black text-brand-purple-deep">{location}</span>)}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <CoachDppPanel coach={coach} document={dppDocument} onMarkSigned={onMarkCoachDppSigned} />
      </div>
      <div className="mt-4">
        <CoachAttendancePanel coach={coach} records={coachAttendanceRecords} onAdd={onAddCoachAttendance} />
      </div>
    </Panel>
  );
}

function CoachDppPanel({ coach, document, onMarkSigned }: { coach: AdminCoachSummary; document: AdminCoachDppDocument; onMarkSigned: (coachId: string) => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const signed = document.status === 'signed';

  function markSigned() {
    onMarkSigned(coach.id);
    setMessage('DPP označena jako digitálně podepsaná a uložená v kartě trenéra.');
  }

  return (
    <CollapsiblePanel icon={<FileText size={18} />} title="DPP dokument" subtitle={`${document.title} · ${coachDppStatusLabel(document.status)}`} count={coachDppStatusLabel(document.status)} defaultOpen={!signed}>
      <div className="grid gap-3 md:grid-cols-3">
        <InfoBlock label="Platnost" value={`${document.validFrom} - ${document.validTo}`} />
        <InfoBlock label="Sazba" value={`${currency(document.hourlyRate)} / hod`} />
        <InfoBlock label="Envelope" value={document.digitalEnvelopeId ?? 'čeká na vytvoření'} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <InfoBlock label="Účet pro výplatu" value={coach.bankAccount} />
        <InfoBlock label="IBAN" value={coach.iban ?? 'není vyplněn'} />
      </div>

      <div className="mt-3 rounded-[16px] border border-brand-purple/10 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-brand-purple">Dohoda o provedení práce</p>
            <h4 className="mt-1 text-base font-black text-brand-ink">{document.title}</h4>
            <p className="mt-1 text-sm font-bold text-brand-ink-soft">{document.role} · {document.workplace}</p>
          </div>
          <StatusPill label={coachDppStatusLabel(document.status)} tone={coachDppStatusTone(document.status)} />
        </div>
        <p className="mt-3 text-sm font-bold leading-6 text-brand-ink-soft">{document.scope}</p>
        <div className="mt-3 grid gap-2">
          {document.clauses.map((clause, index) => (
            <div key={clause} className="rounded-[14px] bg-brand-paper px-3 py-2 text-xs font-bold leading-5 text-brand-ink-soft">
              <span className="font-black text-brand-ink">{index + 1}. </span>{clause}
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <InfoBlock label="Poslední změna" value={document.updatedAt} />
          <InfoBlock label="Podepsáno" value={document.signedAt ?? 'čeká na digitální podpis'} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={markSigned} disabled={signed} className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-brand-purple/15 bg-white px-4 py-3 text-sm font-black text-brand-ink transition hover:bg-brand-paper disabled:cursor-not-allowed disabled:opacity-55">
          <CheckCircle2 size={17} />
          Označit podepsáno
        </button>
      </div>
      {message ? <p className="mt-3 rounded-[16px] bg-white p-3 text-sm font-bold leading-6 text-brand-ink-soft">{message}</p> : null}
    </CollapsiblePanel>
  );
}

function CoachCompactRow({ coach, coachAttendanceRecords }: { coach: AdminCoachSummary; coachAttendanceRecords: CoachAttendanceRecord[] }) {
  return (
    <div className="rounded-[16px] border border-brand-purple/10 bg-brand-paper p-4 transition hover:-translate-y-0.5 hover:border-brand-purple/24 hover:bg-white hover:shadow-brand-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-brand-ink">{coach.name}</p>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">{coach.locations.slice(0, 2).join(' · ')}</p>
        </div>
        <p className="font-black text-brand-purple">{currency(payoutAmountForCoach(coach, coachAttendanceRecords))}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Metric value={`${coach.loggedHours}`} label="hod" />
        <Metric value={`${coach.childrenLogged}`} label="děti" />
        <Metric value={`${coach.qrTricksApproved}`} label="QR" />
      </div>
    </div>
  );
}

function CourseLocationStatCard({ stat, onOpenDetail }: { stat: ReturnType<typeof buildCourseLocationStats>[number]; onOpenDetail: () => void }) {
  const maxPresent = Math.max(...stat.sessions.map((session) => session.present), 1);

  return (
    <button type="button" onClick={onOpenDetail} className="rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-purple/24 hover:bg-white hover:shadow-brand-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-brand-ink">{stat.place}</p>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">průměr {stat.averagePresent} dětí · max {stat.maxPresent} · <span className="text-brand-purple">{stat.enrolledCount} přihlášeno</span></p>
        </div>
        <StatusPill label={`${stat.lastPresent}/${stat.capacityTotal}`} tone="purple" />
      </div>
      <div className="mt-4 flex h-24 items-end gap-2 rounded-[16px] bg-white px-3 py-3">
        {stat.sessions.map((session) => (
          <div key={`${stat.key}-${session.date}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t-[8px] bg-brand-cyan" style={{ height: `${Math.max(12, Math.round((session.present / maxPresent) * 68))}px` }} />
            <span className="text-[9px] font-black text-brand-ink-soft">{session.shortDate}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function ParticipantAttendanceRow({ record, onOpenParticipant }: { record: (typeof parentAttendanceHistory)[number]; onOpenParticipant: (participant: ParentParticipant, activityType: ActivityType, place: string) => void }) {
  const participant = findParticipantByName(record.participantName);

  return (
    <div className="grid gap-2 rounded-[16px] border border-brand-purple/10 bg-brand-paper p-3 text-sm transition hover:-translate-y-0.5 hover:border-brand-purple/24 hover:bg-white hover:shadow-brand-soft md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
      <button type="button" disabled={!participant} onClick={() => participant ? onOpenParticipant(participant, 'Krouzek', record.location) : undefined} className="min-w-0 text-left font-black text-brand-ink underline-offset-4 hover:underline disabled:cursor-default disabled:no-underline">
        {record.participantName} · {record.location}
      </button>
      <span className="font-bold text-brand-ink-soft">{record.date} · {record.time}</span>
      <StatusPill label={record.method} tone="purple" />
    </div>
  );
}

function ActivityAttendanceRow({ activity, onOpenDetail }: { activity: ReturnType<typeof adminActivityRows>[number]; onOpenDetail: () => void }) {
  const percent = activity.capacityTotal > 0 ? Math.min(100, Math.round((activity.registered / activity.capacityTotal) * 100)) : 0;
  const activityMeta = activity.type === 'Tabor' ? `${activity.registered}/${activity.capacityTotal} registrováno` : activity.type === 'Workshop' ? `${activity.registered}/${activity.capacityTotal} ticketů` : `${activity.visits} návštěv`;
  const capacityLabel = activity.type === 'Tabor' ? 'registrováno' : activity.type === 'Workshop' ? 'tickety' : 'obsazeno';
  return (
    <button type="button" onClick={onOpenDetail} className="rounded-[16px] border border-brand-purple/10 bg-brand-paper p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-purple/24 hover:bg-white hover:shadow-brand-soft">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
        <div className="min-w-0">
          <p className="font-black leading-tight text-brand-ink">{activity.title}</p>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">{activity.place} · {activityLabel(activity.type)} · {activityMeta}</p>
        </div>
        <div className="text-left md:text-right">
          <p className="font-black text-brand-ink">{activity.registered}/{activity.capacityTotal}</p>
          <p className="text-xs font-black uppercase text-brand-ink-soft">{capacityLabel}</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${percent}%` }} />
      </div>
    </button>
  );
}

function ActivityDetailModal({ activity, onClose, onOpenParticipant }: { activity: ReturnType<typeof adminActivityRows>[number]; onClose: () => void; onOpenParticipant: (participant: ParentParticipant) => void }) {
  const [selectedSessionDate, setSelectedSessionDate] = useState<string | null>(null);
  const [monthIdx, setMonthIdx] = useState(() => {
    const groups = buildActivitySessions(activity);
    return Math.max(0, groups.length - 1); // default to latest month
  });
  const monthGroups = buildActivitySessions(activity);
  const safeMonthIdx = Math.min(monthIdx, monthGroups.length - 1);
  const currentMonthGroup = monthGroups[safeMonthIdx];
  const sessions = currentMonthGroup.sessions;
  const participants = registeredParticipantsForActivity(activity);
  const maxPresent = Math.max(...sessions.map((session) => session.present), 1);
  const missingDocuments = missingDocumentsForActivity(activity);
  const showLessonRecords = activity.type === 'Krouzek';
  const activityVolume = activity.type === 'Krouzek' ? { value: `${activity.visits}`, label: 'návštěvy' } : activity.type === 'Tabor' ? { value: `${activity.registered}`, label: 'registrováno' } : { value: `${activity.registered}`, label: 'ticketů' };
  const selectedSession = sessions.find((session) => session.date === selectedSessionDate) ?? null;
  const visibleSessions = selectedSession ? [selectedSession] : sessions;

  return (
    <DetailModal title={activity.title} subtitle={`${activity.place} · ${activityLabel(activity.type)}`} onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric value={`${activity.registered}/${activity.capacityTotal}`} label="kapacita" />
        <Metric value={activityVolume.value} label={activityVolume.label} />
        <Metric value={currency(activity.revenue)} label="tržby" />
        <Metric value={missingDocuments.length > 0 ? `${missingDocuments.length}` : 'OK'} label="dokumenty" />
      </div>

      {showLessonRecords ? (
        <section className="mt-5 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
          <SectionTitle icon={<Gauge size={18} />} title="Časový graf docházky" subtitle={selectedSession ? `vybraný den ${selectedSession.date} · klikni na jiný sloupec pro změnu` : 'klikni na sloupec a dole uvidíš děti z konkrétní lekce'} />
          {monthGroups.length > 1 && (
            <div className="mt-3 flex items-center gap-1">
              <button type="button" disabled={safeMonthIdx === 0} onClick={() => { setMonthIdx(safeMonthIdx - 1); setSelectedSessionDate(null); }} className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white text-brand-purple transition hover:bg-brand-purple/10 disabled:cursor-default disabled:opacity-30">
                <ChevronDown size={13} className="rotate-90" />
              </button>
              <span className="min-w-[112px] text-center text-xs font-black uppercase tracking-wide text-brand-purple">{currentMonthGroup.month}</span>
              <button type="button" disabled={safeMonthIdx >= monthGroups.length - 1} onClick={() => { setMonthIdx(safeMonthIdx + 1); setSelectedSessionDate(null); }} className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white text-brand-purple transition hover:bg-brand-purple/10 disabled:cursor-default disabled:opacity-30">
                <ChevronDown size={13} className="-rotate-90" />
              </button>
            </div>
          )}
          <div className="mt-4 flex h-36 items-end gap-2 rounded-[16px] bg-white px-3 py-4">
            {sessions.map((session) => {
              const active = selectedSessionDate === session.date;
              return (
                <button key={session.date} type="button" aria-pressed={active} onClick={() => setSelectedSessionDate(session.date)} className={`group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[12px] px-1 py-1 transition hover:bg-brand-purple-light/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 ${active ? 'bg-brand-purple-light shadow-sm' : ''}`}>
                  <span className="flex w-full items-end rounded-t-[10px] bg-brand-cyan/20" style={{ height: '96px' }}>
                    <span className={`w-full rounded-t-[10px] transition ${active ? 'bg-brand-purple' : 'bg-brand-cyan group-hover:bg-brand-purple'}`} style={{ height: `${Math.max(14, Math.round((session.present / maxPresent) * 96))}px` }} />
                  </span>
                  <div className="text-center">
                    <p className={`text-xs font-black ${active ? 'text-brand-purple-deep' : 'text-brand-ink'}`}>{session.present}</p>
                    <p className="text-[9px] font-black text-brand-ink-soft">{session.shortDate}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {showLessonRecords ? (
        <section className="mt-5 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle icon={<History size={18} />} title={selectedSession ? `Účastníci ${selectedSession.date}` : 'Přesné záznamy lekcí'} subtitle={selectedSession ? 'děti z vybraného sloupce grafu, účastníka můžeš rozkliknout' : `${currentMonthGroup.month} · kliknutím na den v grafu vyfiltrujete`} />
            {selectedSession ? (
              <button type="button" onClick={() => setSelectedSessionDate(null)} className="inline-flex items-center justify-center rounded-[14px] bg-white px-4 py-3 text-xs font-black text-brand-purple transition hover:bg-brand-purple hover:text-white">
                Zobrazit všechny dny
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-2">
            {visibleSessions.map((session) => {
              const sessionParticipants = sessionParticipantsForActivity(activity, session.present);
              return (
                <div key={`session-${session.date}`} className="rounded-[16px] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-black text-brand-ink">{session.date}</p>
                      <p className="mt-1 text-xs font-bold text-brand-ink-soft">{session.absent} omluveno / chybělo · {session.capacityTotal} kapacita</p>
                    </div>
                    <StatusPill label={`${session.present} dětí`} tone="mint" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sessionParticipants.map((participant) => <ActivityParticipantChip key={`${session.date}-${participant.id}`} participant={participant} onOpenParticipant={onOpenParticipant} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <RegisteredParticipantsSection activity={activity} participants={participants} onOpenParticipant={onOpenParticipant} />
      )}
    </DetailModal>
  );
}

function ParticipantDetailModal({ detail, onClose }: { detail: ParticipantDetailState; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<ParticipantDetailTab>('documents');
  const { participant, activityType, place } = detail;
  const documents = documentsForActivityParticipant(participant, activityType);
  const missingDocuments = documents.filter((document) => document.status !== 'signed');
  const attendanceRows = activityType === 'Krouzek' ? buildCompleteCourseAttendance(participant, place) : [];
  const participantName = `${participant.firstName} ${participant.lastName}`;
  const activityStatus = activityType === 'Krouzek' ? `${participant.attendanceDone}/${participant.attendanceTotal}` : activityType === 'Tabor' ? 'Registrován' : 'Ticket';
  const activityStatusLabel = activityType === 'Krouzek' ? 'docházka' : 'stav';

  return (
    <DetailModal title={participantName} subtitle={`${activityLabel(activityType)} · ${place}`} onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric value={`${participant.level}`} label="level" />
        <Metric value={participant.bracelet} label="náramek" />
        <Metric value={activityStatus} label={activityStatusLabel} />
        <Metric value={missingDocuments.length > 0 ? `${missingDocuments.length}` : 'OK'} label="dokumenty" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-1 sm:grid-cols-5">
        <ParticipantDetailTabButton active={activeTab === 'documents'} icon={<FileCheck2 size={16} />} label="Dokumenty" onClick={() => setActiveTab('documents')} />
        {activityType === 'Krouzek' ? <ParticipantDetailTabButton active={activeTab === 'attendance'} icon={<History size={16} />} label="Docházka" onClick={() => setActiveTab('attendance')} /> : null}
        <ParticipantDetailTabButton active={activeTab === 'skills'} icon={<Trophy size={16} />} label="Skill tree" onClick={() => setActiveTab('skills')} />
        <ParticipantDetailTabButton active={activeTab === 'products'} icon={<PackagePlus size={16} />} label="Produkty" onClick={() => setActiveTab('products')} />
        <ParticipantDetailTabButton active={activeTab === 'contacts'} icon={<Phone size={16} />} label="Kontakty" onClick={() => setActiveTab('contacts')} />
      </div>

      {activeTab === 'documents' ? (
        <section className="mt-5 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
          <SectionTitle icon={<FileCheck2 size={18} />} title="Dokumenty účastníka" subtitle={missingDocuments.length > 0 ? `Chybí: ${missingDocuments.map(missingDocumentLabel).join(', ')}` : 'všechny evidované dokumenty jsou podepsané'} />
          <div className="mt-4 grid gap-2">
            {documents.map((document) => <DocumentRow key={document.id} document={document} />)}
            {documents.length === 0 ? <EmptyState text="Účastník zatím nemá žádný dokument v evidenci." /> : null}
          </div>
        </section>
      ) : null}

      {activeTab === 'attendance' ? (
        <section className="mt-5 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
          <SectionTitle icon={<History size={18} />} title={activityType === 'Krouzek' ? 'Kompletní docházka kroužku' : 'Účast na produktu'} subtitle={place} />
          <div className="mt-4">
            {activityType === 'Krouzek' ? <CourseAttendanceList rows={attendanceRows} /> : <ParticipantActivityList participant={participant} activityType={activityType} />}
          </div>
        </section>
      ) : null}

      {activeTab === 'skills' ? (
        <section className="mt-5 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
          <SectionTitle icon={<Trophy size={18} />} title="Skill tree" subtitle={`${participant.xp} XP · ${participant.bracelet} náramek`} />
          <div className="mt-4">
            <ParticipantSkillTree participant={participant} />
          </div>
        </section>
      ) : null}

      {activeTab === 'products' ? (
        <section className="mt-5 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
          <SectionTitle icon={<PackagePlus size={18} />} title="Zakoupené produkty" subtitle="všechny aktivní nákupy tohoto účastníka" />
          <div className="mt-4 grid gap-2">
            {participant.activePurchases.length > 0
              ? participant.activePurchases.map((purchase) => (
                  <div key={`${purchase.type}-${purchase.title}`} className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-brand-ink">{purchase.title}</p>
                      <p className="mt-0.5 text-xs font-bold text-brand-ink-soft">{activityLabel(purchase.type)}</p>
                    </div>
                    <StatusPill label={purchase.status} tone={purchase.status === 'Aktivní' ? 'mint' : purchase.status === 'Zaplaceno' ? 'orange' : 'purple'} />
                  </div>
                ))
              : <EmptyState text="Účastník nemá žádné aktivní nákupy." />}
          </div>
        </section>
      ) : null}

      {activeTab === 'contacts' ? (
        <section className="mt-5 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
          <SectionTitle icon={<Phone size={18} />} title="Kontakty rodiče" subtitle="rychlé provozní spojení k účastníkovi" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoBlock label="Rodič" value={parentProfile.name} />
            <InfoBlock label="Účastník" value={`${participantName} · ${participant.birthNumberMasked}`} />
            <ContactBlock icon={<Phone size={17} />} label="Telefon" value={parentProfile.phone} />
            <ContactBlock icon={<Mail size={17} />} label="E-mail" value={parentProfile.email} />
          </div>
        </section>
      ) : null}
    </DetailModal>
  );
}

function RegisteredParticipantsSection({ activity, participants, onOpenParticipant }: { activity: ReturnType<typeof adminActivityRows>[number]; participants: ActivityParticipantRecord[]; onOpenParticipant: (participant: ParentParticipant) => void }) {
  const showDocuments = activity.type !== 'Workshop';

  return (
    <section className="mt-5 rounded-[18px] border border-brand-purple/10 bg-brand-paper p-4">
      <SectionTitle icon={<Users size={18} />} title={activity.type === 'Tabor' ? 'Registrovaní účastníci tábora' : 'Registrovaní účastníci'} subtitle={showDocuments ? `${participants.length}/${activity.registered} zobrazeno · dokumenty jsou přímo u účastníků` : `${participants.length}/${activity.registered} zobrazeno v administraci`} />
      <div className={showDocuments ? 'mt-4 grid gap-3' : 'mt-4 grid gap-2 md:grid-cols-2'}>
        {participants.map((participant) => <RegisteredParticipantCard key={participant.id} activity={activity} participant={participant} onOpenParticipant={onOpenParticipant} />)}
      </div>
      {participants.length === 0 ? <EmptyState text="Zatím tady nejsou registrovaní účastníci." /> : null}
    </section>
  );
}

function RegisteredParticipantCard({ activity, participant, onOpenParticipant }: { activity: ReturnType<typeof adminActivityRows>[number]; participant: ActivityParticipantRecord; onOpenParticipant: (participant: ParentParticipant) => void }) {
  const linkedParticipant = participant.participant;
  const participantDocuments = linkedParticipant ? activityDocumentsForParticipant(linkedParticipant, activity) : [];
  const activityMetricLabel = activity.type === 'Krouzek' ? 'docházka' : 'stav';
  const missingDocs = participantDocuments.filter((d) => d.status !== 'signed').length;
  const [docsOpen, setDocsOpen] = useState(false);

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-black text-brand-ink">{participant.name}</p>
          <p className="mt-1 text-xs font-bold text-brand-ink-soft">{participant.subtitle}</p>
        </div>
        <StatusPill label={participant.documents} tone={participant.documents === 'Dokumenty OK' || participant.documents === 'QR ticket' ? 'mint' : 'orange'} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric value={participant.level} label="level" />
        <Metric value={participant.attendance} label={activityMetricLabel} />
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-brand-ink-soft">{participant.parentContact}</p>
    </>
  );

  return (
    <div className="rounded-[16px] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-brand-soft">
      {linkedParticipant ? (
        <button type="button" onClick={() => onOpenParticipant(linkedParticipant)} className="block w-full rounded-[14px] text-left transition hover:bg-brand-paper/60">
          {content}
        </button>
      ) : content}

      {participantDocuments.length > 0 ? (
        <div className="mt-3 border-t border-brand-purple/10 pt-3">
          <button
            type="button"
            onClick={() => setDocsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-xs font-black text-brand-ink-soft transition hover:text-brand-purple"
          >
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 size={13} />
              {participantDocuments.length} dokumentů
              {missingDocs > 0 && <span className="ml-1 rounded-full bg-[#F0445B]/12 px-1.5 py-0.5 text-[10px] font-black text-[#F0445B]">{missingDocs} chybí</span>}
            </span>
            <ChevronDown size={13} className={`transition-transform ${docsOpen ? 'rotate-180' : ''}`} />
          </button>
          <CollapsibleContent open={docsOpen} className="pt-3">
            <div className="grid gap-2">
              {participantDocuments.map((document) => <DocumentRow key={document.id} document={document} />)}
            </div>
          </CollapsibleContent>
        </div>
      ) : null}
    </div>
  );
}

function ActivityParticipantChip({ participant, onOpenParticipant }: { participant: ActivityParticipantRecord; onOpenParticipant: (participant: ParentParticipant) => void }) {
  if (participant.participant) {
    return (
      <button type="button" onClick={() => onOpenParticipant(participant.participant as ParentParticipant)} className="rounded-[999px] bg-brand-purple-light px-3 py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple hover:text-white">
        {participant.name}
      </button>
    );
  }

  return <span className="rounded-[999px] bg-brand-paper px-3 py-2 text-xs font-black text-brand-ink-soft">{participant.name}</span>;
}

function ParticipantDetailTabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-[14px] px-3 py-3 text-xs font-black transition ${active ? 'bg-brand-purple text-white shadow-brand-soft' : 'text-brand-ink-soft hover:bg-white hover:text-brand-purple'}`}>
      {icon}
      {label}
    </button>
  );
}

function ParticipantActivityList({ participant, activityType }: { participant: ParentParticipant; activityType: ActivityType }) {
  const purchases = participant.activePurchases.filter((purchase) => purchase.type === activityType);

  return (
    <div className="grid gap-2">
      {purchases.map((purchase) => <MiniRow key={`${purchase.type}-${purchase.title}`} label={purchase.title} meta={activityLabel(purchase.type)} value={purchase.status} />)}
      {purchases.length === 0 ? <EmptyState text="Účastník nemá v demo datech detail docházky pro tento typ aktivity." /> : null}
    </div>
  );
}

function ContactBlock({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-white p-4">
      <span className="rounded-[14px] bg-brand-purple-light p-2 text-brand-purple">{icon}</span>
      <div>
        <p className="text-[11px] font-black uppercase text-brand-ink-soft">{label}</p>
        <p className="mt-1 text-sm font-black text-brand-ink">{value}</p>
      </div>
    </div>
  );
}

function DocumentRow({ document }: { document: ParentDocument }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[16px] border border-brand-purple/10 bg-brand-paper p-4 transition hover:-translate-y-0.5 hover:border-brand-purple/24 hover:bg-white hover:shadow-brand-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-brand-purple">{document.id}</p>
          <p className="mt-1 font-black text-brand-ink">{document.title} · {document.participantName}</p>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">{document.activityTitle} · {activityLabel(document.activityType)} · {document.updatedAt}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DocumentPill status={document.status} />
          <button type="button" onClick={() => setOpen((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-white px-3 py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple hover:text-white">
            <Eye size={15} />
            {open ? 'Skrýt' : 'Zobrazit'}
          </button>
        </div>
      </div>
      <CollapsibleContent open={open} className="pt-4">
        <DocumentPreview document={document} />
      </CollapsibleContent>
    </div>
  );
}

function DocumentPreview({ document }: { document: ParentDocument }) {
  const previewRows = documentPreviewRows(document);
  const content = documentPreviewContent(document);

  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-purple/10 pb-4">
        <div>
          <p className="text-xs font-black uppercase text-brand-purple">Náhled dokumentu</p>
          <h4 className="mt-1 text-lg font-black text-brand-ink">{document.title}</h4>
          <p className="mt-1 text-sm font-bold text-brand-ink-soft">{document.participantName} · {document.activityTitle}</p>
        </div>
        <DocumentPill status={document.status} />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {previewRows.map((row) => <InfoBlock key={row.label} label={row.label} value={row.value} />)}
      </div>

      <div className="mt-4 rounded-[16px] bg-brand-paper p-4">
        <p className="text-[11px] font-black uppercase text-brand-ink-soft">Souhlas / prohlášení</p>
        <h5 className="mt-1 text-base font-black text-brand-ink">{content.heading}</h5>
        <div className="mt-3 grid gap-2">
          {content.paragraphs.map((paragraph) => <p key={paragraph} className="text-sm font-bold leading-6 text-brand-ink-soft">{paragraph}</p>)}
        </div>
        <div className="mt-3 grid gap-2">
          {content.clauses.map((clause, index) => (
            <div key={clause} className="rounded-[14px] bg-white px-3 py-2 text-xs font-bold leading-5 text-brand-ink-soft">
              <span className="font-black text-brand-purple">{index + 1}. </span>{clause}
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-[14px] border border-brand-purple/10 bg-white px-3 py-2 text-xs font-black leading-5 text-brand-ink">{content.confirmation}</p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <InfoBlock label="Rodič" value={parentProfile.name} />
        <InfoBlock label="Telefon" value={parentProfile.phone} />
        <InfoBlock label="E-mail" value={parentProfile.email} />
      </div>
    </div>
  );
}

function documentPreviewRows(document: ParentDocument) {
  return [
    { label: 'Účastník', value: document.participantName },
    { label: 'Aktivita', value: `${document.activityTitle} · ${activityLabel(document.activityType)}` },
    { label: 'Stav', value: documentStatusLabel(document.status) },
    { label: 'Poslední změna', value: document.updatedAt },
    { label: 'Typ dokumentu', value: documentKindLabel(documentKindForTitle(document.title)) },
    { label: 'Evidence', value: document.id },
  ];
}

function documentPreviewContent(document: ParentDocument) {
  const kind = documentKindForTitle(document.title);
  const activity = `${document.activityTitle} (${activityLabel(document.activityType)})`;
  const signer = parentProfile.name;
  const confirmation = document.status === 'signed'
    ? `Digitálně potvrzeno zákonným zástupcem ${signer}. Stav dokumentu: ${documentStatusLabel(document.status)} · ${document.updatedAt}.`
    : `Dokument čeká na doplnění zákonným zástupcem ${signer}. Stav dokumentu: ${documentStatusLabel(document.status)}.`;

  if (kind === 'gdpr') return {
    heading: 'Souhlas se zpracováním osobních údajů',
    paragraphs: [
      `Zákonný zástupce ${signer} uděluje TeamVYS souhlas se zpracováním osobních údajů účastníka ${document.participantName} pro aktivitu ${activity}.`,
      'Údaje slouží pouze k provozu přihlášky, komunikaci s rodičem, bezpečné organizaci aktivity, platební evidenci a interní administraci.'
    ],
    clauses: [
      'TeamVYS může evidovat jméno dítěte, kontakt na rodiče, stav dokumentů, platby a při kroužcích také docházku evidovanou přes NFC.',
      'Nezbytné údaje mohou vidět pouze administrátoři a trenéři, kteří danou aktivitu reálně zajišťují.',
      'Zákonný zástupce může požádat o opravu údajů, omezení zpracování nebo výmaz v rozsahu povoleném zákonnými povinnostmi.',
      'Souhlas se nevztahuje na marketingové zveřejnění fotografií ani videí, pokud není udělen samostatně.'
    ],
    confirmation,
  };
  if (kind === 'guardian-consent') return {
    heading: 'Souhlas zákonného zástupce s účastí',
    paragraphs: [
      `Zákonný zástupce ${signer} souhlasí s účastí dítěte ${document.participantName} na aktivitě ${activity}.`,
      'Rodič potvrzuje, že se seznámil s provozními pokyny, časem konání, místem předání dítěte a pravidly bezpečného chování při tréninku nebo táborovém programu.'
    ],
    clauses: [
      'Účastník se řídí pokyny trenérů, dodržuje bezpečnostní pravidla a nepouští se do prvků, které mu trenér nepovolil.',
      'Rodič potvrzuje, že dítě je schopné běžné sportovní zátěže odpovídající věku a charakteru aktivity.',
      'TeamVYS může v nezbytné situaci kontaktovat rodiče, přerušit účast dítěte nebo zajistit první pomoc.',
      'Rodič bere na vědomí, že pozdní vyzvednutí, zdravotní změny nebo jiné provozní změny musí nahlásit administraci předem.'
    ],
    confirmation,
  };
  if (kind === 'health') return {
    heading: 'Anamnéza, alergie a zdravotní omezení',
    paragraphs: [
      `Zákonný zástupce ${signer} potvrzuje zdravotní informace pro účastníka ${document.participantName} u aktivity ${activity}.`,
      'Dokument slouží trenérům k bezpečnému vedení programu a administraci k rychlému dohledání nouzových údajů.'
    ],
    clauses: [
      'Rodič uvádí alergie, pravidelně užívané léky, zdravotní omezení, pojišťovnu a kontakt pro mimořádnou situaci.',
      'Pokud dítě potřebuje léky během dne, rodič předá přesné dávkování a informaci, kdo smí lék podat.',
      'TeamVYS použije zdravotní údaje jen pro bezpečnost dítěte, první pomoc a komunikaci se zákonným zástupcem.',
      'Rodič se zavazuje neprodleně aktualizovat údaje, pokud se zdravotní stav dítěte změní před aktivitou nebo během ní.'
    ],
    confirmation,
  };
  if (kind === 'departure') return {
    heading: 'Souhlas se samostatným odchodem dítěte',
    paragraphs: [
      `Zákonný zástupce ${signer} výslovně souhlasí, aby účastník ${document.participantName} po skončení aktivity ${activity} odešel samostatně bez vyzvednutí dospělou osobou.`,
      'Cílem dokumentu je, aby trenér věděl, že dítě po ukončení programu nemusí předávat rodiči ani jiné pověřené osobě a může ho pustit samostatně domů.'
    ],
    clauses: [
      'Rodič potvrzuje, že dítě zná cestu z místa konání a může po skončení programu odejít bez doprovodu.',
      'Trenér dítě uvolní až po ukončení aktivity a běžné kontrole, že dítě odchází v dohodnutém čase.',
      'Odpovědnost za cestu dítěte po opuštění místa konání přebírá zákonný zástupce v rozsahu tohoto souhlasu.',
      'Pokud má dítě v konkrétní den čekat na rodiče nebo jinou osobu, rodič tuto změnu nahlásí administraci nebo trenérovi před koncem programu.'
    ],
    confirmation,
  };
  if (kind === 'infection-free') return {
    heading: 'Čestné prohlášení o bezinfekčnosti',
    paragraphs: [
      `Zákonný zástupce ${signer} prohlašuje, že účastník ${document.participantName} může nastoupit na táborovou aktivitu ${activity}.`,
      'Prohlášení je určeno pro táborový režim, společný program, stravování a delší pobyt dítěte ve skupině.'
    ],
    clauses: [
      'Dítě nejeví příznaky akutního infekčního onemocnění a nebylo mu nařízeno karanténní opatření.',
      'Rodič nezatajil okolnosti, které by mohly ohrozit ostatní účastníky nebo trenéry.',
      'Při změně zdravotního stavu před nástupem rodič informuje TeamVYS a dítě na aktivitu nepřivede.',
      'TeamVYS může při podezření na infekční onemocnění kontaktovat rodiče a účast dítěte přerušit.'
    ],
    confirmation,
  };
  if (kind === 'packing') return {
    heading: 'Potvrzení táborových pokynů a vybavení',
    paragraphs: [
      `Zákonný zástupce ${signer} potvrzuje, že převzal pokyny k vybavení pro ${document.participantName} na aktivitu ${activity}.`,
      'Dokument sjednocuje informace o věcech s sebou, lécích, kartičce pojišťovny a praktickém režimu dne.'
    ],
    clauses: [
      'Dítě bude mít sportovní oblečení, pevnou obuv, lahev na pití, náhradní tričko a vybavení podle pokynů pořadatele.',
      'Léky musí být předané v označeném obalu společně s dávkováním a kontaktem na rodiče.',
      'Rodič bere na vědomí, že cennosti a elektronika nejsou pro program potřeba a dítě je nosí na vlastní odpovědnost.',
      'Rodič potvrzuje, že zná čas příchodu, vyzvednutí, místo srazu a způsob komunikace při mimořádné situaci.'
    ],
    confirmation,
  };
  return {
    heading: 'Administrativní potvrzení účasti',
    paragraphs: [`Dokument se vztahuje k účastníkovi ${document.participantName} a aktivitě ${activity}.`],
    clauses: ['Dokument je uložený v administraci TeamVYS a slouží ke kontrole kompletnosti přihlášky.'],
    confirmation,
  };
}

function documentKindLabel(kind: string) {
  if (kind === 'gdpr') return 'GDPR souhlas';
  if (kind === 'guardian-consent') return 'Souhlas zákonného zástupce';
  if (kind === 'health') return 'Zdravotní informace';
  if (kind === 'departure') return 'Samostatný odchod dítěte';
  if (kind === 'infection-free') return 'Bezinfekčnost';
  if (kind === 'packing') return 'Věci s sebou';
  return kind;
}

function RequiredDocumentsPreview({ type, title }: { type: Exclude<ActivityType, 'Workshop'>; title: string }) {
  const product = parentProducts.find((item) => item.type === type);
  const documents = product ? requiredDocumentsForProduct(product) : [];
  return (
    <div className="rounded-[16px] border border-brand-purple/10 bg-white p-4">
      <h3 className="text-sm font-black text-brand-ink">{title}</h3>
      <div className="mt-3 grid gap-2">
        {documents.map((document) => (
          <div key={document.kind} className="flex gap-2 rounded-[14px] bg-brand-paper px-3 py-2 text-xs leading-5 text-brand-ink-soft">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-cyan" />
            <span><strong className="text-brand-ink">{document.title}</strong> · {document.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailModal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-ink/30 p-3 backdrop-blur-md sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <motion.div
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_28px_80px_rgba(47,25,82,0.28)] sm:max-h-[calc(100dvh-40px)]"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-purple/10 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-brand-purple">Detail administrace</p>
            <h2 className="mt-1 text-xl font-black text-brand-ink sm:text-2xl">{title}</h2>
            <p className="mt-1 text-sm font-bold text-brand-ink-soft">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brand-paper text-brand-purple transition hover:bg-brand-purple hover:text-white" aria-label="Zavřít detail">
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('self-start rounded-[22px] border border-brand-purple/12 bg-white shadow-brand', className)}>{children}</section>;
}

function SectionTitle({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
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

function AdminSignal({ value, label, tone }: { value: string; label: string; tone: 'cyan' | 'mint' | 'orange' | 'purple' }) {
  const toneClass = {
    cyan: 'text-brand-cyan',
    mint: 'text-brand-mint',
    orange: 'text-brand-orange',
    purple: 'text-brand-purple-light',
  }[tone];

  return (
    <div className="rounded-[16px] bg-white/10 px-3 py-3 ring-1 ring-white/10">
      <p className={`text-base font-black leading-tight ${toneClass}`}>{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/60">{label}</p>
    </div>
  );
}

function ActionTile({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid min-h-[86px] grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-[16px] border border-white/10 bg-white/10 p-3 text-left text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/16 hover:shadow-brand-soft">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-brand-cyan shadow-sm ring-1 ring-white/10">{icon}</span>
      <span className="min-w-0">
        <span className="block break-words text-[15px] font-black leading-tight sm:text-base">{label}</span>
        <span className="mt-1 block break-words text-sm font-bold leading-tight text-white/64">{value}</span>
      </span>
    </button>
  );
}

function PriorityRow({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: 'purple' | 'pink' | 'orange' | 'mint' }) {
  return (
    <div className="rounded-[16px] border border-brand-purple/10 bg-brand-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-brand-ink">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-brand-ink-soft">{detail}</p>
        </div>
        <StatusPill label={value} tone={tone} />
      </div>
    </div>
  );
}

function Suggestion({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[16px] border border-brand-purple/10 bg-brand-paper p-4">
      <p className="font-black text-brand-ink">{title}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-brand-ink-soft">{text}</p>
    </div>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block w-full lg:max-w-[360px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink-soft" size={17} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-[16px] border border-brand-purple/15 bg-white py-3 pl-10 pr-4 text-sm font-bold text-brand-ink outline-none transition focus:border-brand-purple" />
    </label>
  );
}

function MiniRow({ label, meta, value }: { label: string; meta: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-[16px] border border-brand-purple/10 bg-brand-paper p-3 text-sm transition hover:-translate-y-0.5 hover:border-brand-purple/24 hover:bg-white hover:shadow-brand-soft md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <p className="font-black leading-tight text-brand-ink">{label}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-brand-ink-soft">{meta}</p>
      </div>
      <span className="font-black leading-tight text-brand-purple md:text-right">{value}</span>
    </div>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[16px] bg-brand-paper px-3 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase text-brand-ink-soft">{icon ? <span className="text-brand-purple">{icon}</span> : null}{label}</p>
      <p className="mt-1 text-sm font-black leading-5 text-brand-ink">{value}</p>
    </div>
  );
}

function CollapsiblePanel({ icon, title, subtitle, count, defaultOpen = false, children }: { icon: ReactNode; title: string; subtitle?: string; count?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-brand-paper/70 p-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 rounded-[14px] px-2 py-2 text-left transition hover:bg-white/70">
        <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] transition-colors ${open ? 'bg-brand-purple text-white' : 'bg-white text-brand-purple shadow-sm'}`}>
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black leading-tight text-brand-ink">{title}</span>
            {subtitle ? <span className="mt-0.5 block text-xs font-bold leading-5 text-brand-ink-soft">{subtitle}</span> : null}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {count ? <span className="rounded-[999px] bg-white px-2.5 py-1 text-[10px] font-black uppercase text-brand-purple shadow-sm">{count}</span> : null}
          <ChevronDown className={`text-brand-purple transition-transform duration-300 ${open ? 'rotate-180' : ''}`} size={18} />
        </span>
      </button>
      <CollapsibleContent open={open} className="px-2 pb-2 pt-3">
        {children}
      </CollapsibleContent>
    </div>
  );
}

function ManualCoachAttendanceForm({ coaches, lockedCoach, onAdd }: { coaches: AdminCoachSummary[]; lockedCoach?: AdminCoachSummary; onAdd: (input: ManualCoachAttendanceInput) => CoachAttendanceRecord }) {
  const [coachId, setCoachId] = useState(lockedCoach?.id ?? coaches[0]?.id ?? '');
  const selectedCoach = lockedCoach ?? coaches.find((coach) => coach.id === coachId) ?? coaches[0];

  const deriveRate = (coach: AdminCoachSummary) =>
    coach.loggedHours > 0 ? Math.round(coach.baseAmount / coach.loggedHours) : 500;

  const [sessionTitle, setSessionTitle] = useState(selectedCoach?.locations[0] ?? '');
  const [time, setTime] = useState('16:00');
  const [date, setDate] = useState('30. 4. 2026');
  const [durationHours, setDurationHours] = useState('1');
  const [hourlyRate, setHourlyRate] = useState(String(deriveRate(selectedCoach ?? coaches[0])));
  const [reason, setReason] = useState('Trenér zapomněl zapsat docházku po lekci.');
  const [message, setMessage] = useState<string | null>(null);
  const amount = Math.round(Number(durationHours || 0) * Number(hourlyRate || 0));

  const TIME_OPTIONS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'];

  function onCoachChange(id: string) {
    setCoachId(id);
    const coach = coaches.find((c) => c.id === id);
    if (coach) {
      setSessionTitle(coach.locations[0] ?? '');
      setHourlyRate(String(deriveRate(coach)));
    }
  }

  function onLocationChange(loc: string) {
    setSessionTitle(loc);
  }

  async function submitManualAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCoach) return;

    const place = sessionTitle || selectedCoach.locations[0] || 'Lekce bez lokace';
    const sessionLabel = `${place} · ${time}`;
    const record = onAdd({
      coachId: selectedCoach.id,
      coachName: selectedCoach.name,
      sessionTitle: sessionLabel,
      date,
      durationHours: Number(durationHours || 0),
      hourlyRate: Number(hourlyRate || 0),
      reason,
    });

    try {
      await saveCoachAttendance({
        coachId: selectedCoach.id,
        sessionId: slugForId(place),
        place,
        present: '',
        durationHours: Number(durationHours || 0),
        hourlyRate: Number(hourlyRate || 0),
      });
      setMessage(`Uloženo do backendu a přidáno ke kontrole: ${record.coachName} · ${record.sessionTitle} · ${currency(record.amount)}.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'backend neodpověděl';
      setMessage(`Přidáno lokálně ke kontrole, ale backend zápis se nepovedl: ${errorMessage}.`);
    }
  }

  return (
    <form onSubmit={submitManualAttendance} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        {lockedCoach ? (
          <InfoBlock label="Trenér" value={lockedCoach.name} />
        ) : (
          <label className="grid gap-2 text-sm font-black text-brand-ink">
            Trenér
            <select value={coachId} onChange={(event) => onCoachChange(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple">
              {coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.name}</option>)}
            </select>
          </label>
        )}
        <label className="grid gap-2 text-sm font-black text-brand-ink">
          Lekce / místo
          <select value={sessionTitle} onChange={(event) => onLocationChange(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple">
            {(selectedCoach?.locations ?? []).map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black text-brand-ink">
          Datum
          <input value={date} onChange={(event) => setDate(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple" />
        </label>
        <label className="grid gap-2 text-sm font-black text-brand-ink">
          Čas lekce
          <select value={time} onChange={(event) => setTime(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple">
            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black text-brand-ink">
          Hodiny
          <input inputMode="decimal" value={durationHours} onChange={(event) => setDurationHours(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple" />
        </label>
        <div className="grid gap-2 text-sm font-black text-brand-ink">
          Sazba / hod
          <div className="flex items-center rounded-[16px] border border-brand-purple/10 bg-brand-paper px-3 py-2.5 text-sm font-bold text-brand-ink-soft">
            {hourlyRate} Kč
          </div>
        </div>
      </div>
      <label className="grid gap-2 text-sm font-black text-brand-ink">
        Poznámka
        <input value={reason} onChange={(event) => setReason(event.target.value)} className="rounded-[16px] border border-brand-purple/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-purple" />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-white p-3">
        <div>
          <p className="text-xs font-black uppercase text-brand-ink-soft">Částka ke kontrole</p>
          <p className="text-lg font-black text-brand-ink">{currency(amount)}</p>
        </div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-brand-purple px-4 py-3 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep">
          <CheckCircle2 size={17} />
          Doplnit záznam
        </button>
      </div>
      {message ? <p className="rounded-[16px] bg-white p-3 text-sm font-bold leading-6 text-brand-ink-soft">{message}</p> : null}
    </form>
  );
}

function CoachAttendancePanel({ coach, records, onAdd, compact = false }: { coach: AdminCoachSummary; records: CoachAttendanceRecord[]; onAdd: (input: ManualCoachAttendanceInput) => CoachAttendanceRecord; compact?: boolean }) {
  const coachRecords = recordsForCoach(coach, records);
  const totalHours = coachRecords.reduce((sum, record) => sum + record.durationHours, 0);

  return (
    <CollapsiblePanel icon={<History size={18} />} title="Celá docházka trenéra" subtitle={`${totalHours} h · ${coach.name}`} count={`${coachRecords.length}`} defaultOpen={!compact}>
      <div className="grid gap-4">
        {groupByMonthAdmin(coachRecords, (r) => r.date).map(({ label, items }) => (
          <div key={label}>
            <p className="mb-2 border-b border-brand-purple/10 pb-1 text-xs font-black uppercase tracking-wide text-brand-purple">{label}</p>
            <div className="grid gap-2">
              {items.map((record) => (
                <MiniRow key={record.id} label={record.present ? `${record.sessionTitle} · ${record.present}` : record.sessionTitle} meta={`${record.date} · ${record.durationHours} h · ${record.reason}`} value={record.source === 'admin' ? `Admin · ${currency(record.amount)}` : currency(record.amount)} />
              ))}
            </div>
          </div>
        ))}
        {coachRecords.length === 0 ? <EmptyState text="Tento trenér zatím nemá žádnou docházku." /> : null}
      </div>
      <div className="mt-3">
        <CollapsiblePanel icon={<ClipboardList size={18} />} title="Doplnit zapomenutý zápis" subtitle="přidá se do výplat ke kontrole" count="ručně">
          <ManualCoachAttendanceForm coaches={[coach]} lockedCoach={coach} onAdd={onAdd} />
        </CollapsiblePanel>
      </div>
    </CollapsiblePanel>
  );
}

function CourseAttendanceList({ rows }: { rows: ReturnType<typeof buildCompleteCourseAttendance> }) {
  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 rounded-[14px] border border-brand-purple/10 bg-white p-3 text-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <span className="font-black text-brand-ink">{row.label}</span>
          <span className="font-bold text-brand-ink-soft">{row.date} · {row.time}</span>
          <StatusPill label={row.status} tone={row.status === 'Přítomen' ? 'mint' : 'purple'} />
        </div>
      ))}
    </div>
  );
}

function ParticipantSkillTree({ participant }: { participant: ParentParticipant }) {
  const skills = buildSkillTree(participant);
  const percent = participant.nextBraceletXp > 0 ? Math.min(100, Math.round((participant.xp / participant.nextBraceletXp) * 100)) : 0;

  return (
    <div>
      <div className="rounded-[16px] bg-white p-3">
        <div className="flex items-center justify-between gap-3 text-xs font-black">
          <span className="text-brand-ink">{participant.xp}/{participant.nextBraceletXp} XP</span>
          <span className="text-brand-purple">{percent}% k dalšímu náramku</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-paper">
          <div className="h-full rounded-full bg-brand-purple" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {skills.map((skill) => (
          <div key={skill.title} className="grid gap-2 rounded-[14px] border border-brand-purple/10 bg-white p-3 text-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="font-black text-brand-ink">{skill.title}</p>
              <p className="mt-1 text-xs font-bold text-brand-ink-soft">{skill.description}</p>
            </div>
            <StatusPill label={skill.status} tone={skill.status === 'Hotovo' ? 'mint' : 'purple'} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CollapsibleContent({ open, children, className = '' }: { open: boolean; children: ReactNode; className?: string }) {
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
          <motion.div initial={{ scale: 0.985 }} animate={{ scale: 1 }} exit={{ scale: 0.985 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} className={className}>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DocumentPill({ status }: { status: DocumentStatus }) {
  const tone = status === 'signed' ? 'mint' : status === 'draft' ? 'orange' : 'pink';
  return <StatusPill label={documentStatusLabel(status)} tone={tone} />;
}

function StatusPill({ label, tone = 'purple' }: { label: string; tone?: 'purple' | 'pink' | 'orange' | 'mint' }) {
  const toneClass = tone === 'purple' ? 'bg-brand-purple-light text-brand-purple-deep' : tone === 'pink' ? 'bg-brand-pink/10 text-brand-pink' : tone === 'orange' ? 'bg-brand-orange/18 text-brand-orange-deep' : 'bg-brand-mint/14 text-emerald-700';
  return <span className={`inline-flex w-max items-center justify-center rounded-[999px] px-3 py-2 text-xs font-black uppercase ${toneClass}`}>{label}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-[16px] border border-brand-purple/10 bg-white p-3 text-sm font-bold leading-6 text-brand-ink-soft">{text}</p>;
}

type AdminTotals = {
  paidTotal: number;
  pendingTotal: number;
  payoutTotal: number;
  missingDocuments: number;
  courseCount: number;
  transferCount: number;
};

function buildTotals(paymentRows: AdminPaymentRow[], activityRows: ReturnType<typeof adminActivityRows>, coaches: AdminCoachSummary[], transfers: TrainerPayoutTransfer[], coachAttendanceRecords: CoachAttendanceRecord[]): AdminTotals {
  return {
    paidTotal: paymentRows.filter((payment) => isPaidStatus(payment.status)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    pendingTotal: paymentRows.filter((payment) => !isPaidStatus(payment.status)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    payoutTotal: coaches.reduce((sum, coach) => sum + payoutAmountForCoach(coach, coachAttendanceRecords), 0),
    missingDocuments: allParticipantDocuments().filter((document) => document.status !== 'signed').length,
    courseCount: activityRows.length,
    transferCount: transfers.length,
  };
}

function buildPaymentRows(finance: AdminFinanceResponse | null): AdminPaymentRow[] {
  const purchases = finance?.purchases ?? [];
  if (purchases.length === 0) return adminPaymentRows();

  return purchases.map((purchase) => ({
    id: purchase.id,
    title: purchase.title,
    participantName: purchase.participant_name,
    amount: purchase.amount,
    status: purchase.status || 'Zaplaceno',
    dueDate: purchase.paid_at,
  }));
}

function mergeCoachData(finance: AdminFinanceResponse | null): AdminCoachSummary[] {
  return adminCoachSummaries.map((coach) => {
    const apiCoach = finance?.coaches?.find((item) => item.id === coach.id);
    return {
      ...coach,
      stripeAccountId: apiCoach?.stripe_account_id || coach.stripeAccountId,
      qrTricksApproved: apiCoach?.qr_tricks_approved ?? coach.qrTricksApproved,
    };
  });
}

function documentForCoach(coach: AdminCoachSummary, documents: AdminCoachDppDocument[]) {
  return documents.find((document) => document.coachId === coach.id) ?? buildCoachDppDocument(coach, 'missing');
}

function dppStatusForCoach(coachId: string, documents: AdminCoachDppDocument[]) {
  return documents.find((document) => document.coachId === coachId)?.status ?? 'missing';
}

function buildCoachDppDocument(coach: AdminCoachSummary, status: CoachDppStatus): AdminCoachDppDocument {
  return {
    id: `dpp-${coach.id}-2026`,
    coachId: coach.id,
    coachName: coach.name,
    title: `DPP 2026 · ${coach.name}`,
    status,
    validFrom: '1. 5. 2026',
    validTo: '31. 12. 2026',
    hourlyRate: coach.baseAmount > 0 && coach.loggedHours > 0 ? Math.round(coach.baseAmount / coach.loggedHours) : 500,
    role: coach.status === 'Ceka na klic' ? 'Trenér / asistent po aktivaci' : 'Trenér parkour lekcí',
    workplace: coach.locations.join(' · '),
    scope: 'Vedení lekcí, evidence docházky, bezpečnostní dohled a potvrzování progresu účastníků v TeamVYS administraci.',
    digitalEnvelopeId: status === 'missing' ? undefined : `DPP-VYS-2026-${coach.id.toUpperCase()}`,
    updatedAt: status === 'missing' ? 'Čeká na vytvoření' : '1. 5. 2026',
    clauses: coachDppTemplateClauses,
  };
}

function coachDppStatusLabel(status: CoachDppStatus) {
  if (status === 'signed') return 'Podepsáno';
  if (status === 'sent') return 'Odesláno';
  if (status === 'draft') return 'Návrh';
  return 'Chybí';
}

function coachDppStatusTone(status: CoachDppStatus): 'purple' | 'pink' | 'orange' | 'mint' {
  if (status === 'signed') return 'mint';
  if (status === 'sent') return 'purple';
  if (status === 'draft') return 'orange';
  return 'pink';
}

function normalizeFinanceTransfers(transfers: AdminFinanceTransfer[]): TrainerPayoutTransfer[] {
  return transfers.map((transfer) => ({
    id: transfer.id,
    coachId: transfer.coach_id ?? transfer.id,
    coachName: transfer.coach_name,
    periodKey: transfer.period_key,
    amount: Number(transfer.amount || 0),
    status: transfer.status,
    createdAt: transfer.created_at_text,
    stripeTransferId: transfer.stripe_transfer_id ?? undefined,
  }));
}

function buildInitialCoachAttendanceRecords(): CoachAttendanceRecord[] {
  const manualRecords = adminAttendanceAdjustments.map((record) => ({
    id: record.id,
    coachId: coachIdForName(record.coachName),
    coachName: record.coachName,
    sessionTitle: record.sessionTitle,
    date: record.date,
    present: record.present,
    durationHours: record.durationHours,
    amount: record.amount,
    reason: record.reason,
    source: 'admin' as const,
  }));

  const coachRecords = adminCoachAttendance.map((record) => ({
    id: record.id,
    coachId: coachIdForName(record.coachName),
    coachName: record.coachName,
    sessionTitle: record.sessionTitle,
    date: record.date,
    present: record.present,
    durationHours: record.durationHours,
    amount: record.amount,
    reason: record.reason,
    source: 'coach' as const,
  }));

  return [...manualRecords, ...coachRecords];
}

function coachIdForName(coachName: string) {
  return adminCoachSummaries.find((coach) => normalizeText(coach.name) === normalizeText(coachName))?.id;
}

function recordsForCoach(coach: AdminCoachSummary, records: CoachAttendanceRecord[]) {
  return records.filter((record) => record.coachId === coach.id || normalizeText(record.coachName) === normalizeText(coach.name));
}

function groupByMonthAdmin<T>(items: T[], getDate: (item: T) => string): { label: string; items: T[] }[] {
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

function buildInitialSharedTrainingState(): SharedTrainingState {
  return sharedTrainingCalendar.reduce((state, slot) => {
    state[slot.id] = {
      assignedCoachId: slot.assignedCoachId,
      assignedCoachName: slot.assignedCoachName,
      secondCoachId: slot.secondCoachId,
      secondCoachName: slot.secondCoachName,
      releasedBy: slot.releasedBy,
      releaseReason: slot.releaseReason,
      updatedAt: slot.updatedAt,
    };
    return state;
  }, {} as SharedTrainingState);
}

function resolveSharedTrainingSlots(state: SharedTrainingState): SharedTrainingSlot[] {
  return sharedTrainingCalendar.map((slot) => ({ ...slot, ...state[slot.id] }));
}

function payoutAmountForCoach(coach: AdminCoachSummary, coachAttendanceRecords: CoachAttendanceRecord[] = buildInitialCoachAttendanceRecords()) {
  const adjustmentAmount = recordsForCoach(coach, coachAttendanceRecords)
    .filter((record) => record.source === 'admin')
    .reduce((sum, record) => sum + record.amount, 0);
  return coach.baseAmount + coach.approvedBonuses + adjustmentAmount;
}

function buildCoachPlacementGroups(coaches: AdminCoachSummary[], query: string): CoachPlacementGroup[] {
  const coachById = new Map(coaches.map((coach) => [coach.id, coach]));
  const products = uniqueParticipantProducts(parentProducts);

  return products
    .map((product) => {
      const productCoaches = trainersForProduct(product)
        .map((trainer) => coachById.get(trainer.id))
        .filter((coach): coach is AdminCoachSummary => Boolean(coach));
      const productMatchesQuery = matchesQuery(`${activityLabel(product.type)} ${product.title} ${product.place} ${product.primaryMeta}`, query);
      const coachesForGroup = query && !productMatchesQuery
        ? productCoaches.filter((coach) => matchesQuery(`${coach.name} ${coach.email} ${coach.phone} ${coach.locations.join(' ')}`, query))
        : productCoaches;

      if (query && !productMatchesQuery && coachesForGroup.length === 0) return null;

      return {
        key: participantProductGroupKey(product),
        type: product.type,
        title: product.title,
        place: product.place,
        primaryMeta: product.primaryMeta,
        coaches: coachesForGroup,
      };
    })
    .filter((group): group is CoachPlacementGroup => Boolean(group));
}

function buildParticipantGroups(query: string, products: ParentProduct[]): ParticipantGroup[] {
  const normalizedQuery = normalizeText(query);

  return uniqueParticipantProducts(products)
    .map((product) => {
      const groupMatchesQuery = matchesQuery(`${activityLabel(product.type)} ${product.title} ${product.place} ${product.primaryMeta}`, query);
      const relatedParticipants = linkedParticipants.filter((participant) => participantBelongsToProduct(participant, product));
      const participants = normalizedQuery && !groupMatchesQuery
        ? relatedParticipants.filter((participant) => matchesQuery(`${participant.firstName} ${participant.lastName} ${participant.activeCourse} ${participant.activePurchases.map((purchase) => purchase.title).join(' ')}`, query))
        : relatedParticipants;

      return {
        key: `${product.type}-${normalizeText(product.place)}`,
        type: product.type,
        title: product.title,
        place: product.place,
        product,
        participants,
      };
    })
    .filter((group) => !normalizedQuery || matchesQuery(`${group.title} ${group.place}`, query) || group.participants.length > 0);
}

function groupParticipantGroupsByCity(groups: ParticipantGroup[]): ParticipantCityGroup[] {
  const cityMap = new Map<string, ParticipantCityGroup>();

  for (const group of groups) {
    const city = participantGroupCity(group);
    const key = normalizeText(city);
    const current = cityMap.get(key) ?? {
      key,
      city,
      groups: [],
      participantCount: 0,
      missingDocuments: 0,
    };

    current.groups.push(group);
    current.participantCount += group.participants.length;
    current.missingDocuments += group.participants.reduce((sum, participant) => sum + documentsForActivityParticipant(participant, group.type).filter((document) => document.status !== 'signed').length, 0);
    cityMap.set(key, current);
  }

  return Array.from(cityMap.values()).sort((a, b) => a.city.localeCompare(b.city, 'cs'));
}

function groupParticipantGroupsByTerm(groups: ParticipantGroup[]): ParticipantTermGroup[] {
  const termMap = new Map<string, ParticipantTermGroup>();

  for (const group of groups) {
    const term = participantGroupTerm(group);
    const key = normalizeText(term);
    const current = termMap.get(key) ?? {
      key,
      term,
      groups: [],
      participantCount: 0,
      missingDocuments: 0,
    };

    current.groups.push(group);
    current.participantCount += group.participants.length;
    current.missingDocuments += group.participants.reduce((sum, participant) => sum + documentsForActivityParticipant(participant, group.type).filter((document) => document.status !== 'signed').length, 0);
    termMap.set(key, current);
  }

  return Array.from(termMap.values()).sort((a, b) => a.term.localeCompare(b.term, 'cs'));
}

function participantGroupTerm(group: ParticipantGroup) {
  return group.product.primaryMeta?.trim() || 'Termín není vyplněný';
}

function participantGroupCity(group: ParticipantGroup) {
  const city = group.product.city?.trim();
  if (city) return city;
  return group.place.split('·')[0]?.trim() || group.place;
}

function uniqueParticipantProducts(products: ParentProduct[]) {
  const productsByPlace = new Map<string, ParentProduct>();

  for (const product of products) {
    const key = participantProductGroupKey(product);
    if (!productsByPlace.has(key)) productsByPlace.set(key, product);
  }

  return Array.from(productsByPlace.values());
}

function participantProductGroupKey(product: ParentProduct) {
  const base = `${product.type}-${normalizeText(product.place)}`;
  if (product.type !== 'Tabor') return base;
  return `${base}-${normalizeText(product.primaryMeta)}`;
}

function participantBelongsToProduct(participant: ParentParticipant, product: ParentProduct) {
  const activeCourse = normalizeText(participant.activeCourse);
  const productPlace = normalizeText(product.place);
  const productCity = normalizeText(product.city);

  if (product.type === 'Krouzek') {
    return activeCourse === productPlace || activeCourse.includes(productPlace) || productPlace.includes(activeCourse);
  }

  return participant.activePurchases.some((purchase) => {
    if (purchase.type !== product.type) return false;
    const purchaseTitle = normalizeText(purchase.title);
    const cityOrPlaceMatch = purchaseTitle.includes(productCity) || purchaseTitle.includes(productPlace) || productPlace.includes(purchaseTitle);
    if (!cityOrPlaceMatch) return false;
    if (product.type === 'Tabor') {
      const primaryMetaNorm = normalizeText(product.primaryMeta);
      if (purchaseTitle.includes('1. turnus') || purchaseTitle.includes('turnus 1')) return primaryMetaNorm.includes('1. turnus');
      if (purchaseTitle.includes('2. turnus') || purchaseTitle.includes('turnus 2')) return primaryMetaNorm.includes('2. turnus');
    }
    return true;
  });
}

function documentsForParticipant(participant: ParentParticipant): ParentDocument[] {
  const participantName = `${participant.firstName} ${participant.lastName}`;
  const normalizedName = normalizeText(participantName);
  const existingDocuments = parentDocuments
    .filter((document) => normalizeText(document.participantName) === normalizedName)
    .map((document) => participantHasPaidForActivity(participant, document.activityType) ? markDocumentComplete(document) : document);
  const existingKeys = new Set(existingDocuments.map((document) => `${document.activityType}-${documentKindForTitle(document.title)}`));
  const generatedDocuments: ParentDocument[] = [];
  const generatedKeys = new Set<string>();

  for (const product of productsForParticipant(participant)) {
    const paid = participantHasPaidForProduct(participant, product);
    for (const template of requiredDocumentsForProduct(product)) {
      const key = `${product.type}-${template.kind}`;
      if (existingKeys.has(key) || generatedKeys.has(key)) continue;
      generatedKeys.add(key);
      generatedDocuments.push({
        id: `${paid ? 'auto' : 'missing'}-${participant.id}-${product.id}-${template.kind}`,
        participantName,
        activityTitle: product.title,
        activityType: product.type,
        title: template.title,
        status: paid ? 'signed' : 'missing',
        updatedAt: paid ? 'Vyplněno při platbě' : 'Chybí',
      });
    }
  }

  return [...existingDocuments, ...generatedDocuments];
}

function documentsForActivityParticipant(participant: ParentParticipant, activityType: ActivityType): ParentDocument[] {
  if (activityType === 'Workshop') {
    const isGenerated = participant.id.includes('-participant-');
    if (isGenerated) {
      const idx = Number.parseInt(participant.id.split('-participant-')[1] ?? '0', 10);
      const activityTitle = participant.activePurchases[0]?.title ?? 'Workshop';
      const participantName = `${participant.firstName} ${participant.lastName}`;
      const s1: DocumentStatus = idx % 4 === 0 ? 'missing' : 'signed';
      const s2: DocumentStatus = idx % 3 === 0 ? 'missing' : idx % 3 === 1 ? 'draft' : 'signed';
      const s3: DocumentStatus = idx % 5 === 0 ? 'draft' : 'signed';
      return [
        { id: `${participant.id}-wt`, participantName, activityTitle, activityType: 'Workshop', title: 'Přihláška a podmínky', status: s1, updatedAt: s1 === 'signed' ? '2. 5. 2026' : 'Čeká na rodiče' },
        { id: `${participant.id}-wh`, participantName, activityTitle, activityType: 'Workshop', title: 'Zdravotní prohlášení', status: s2, updatedAt: s2 === 'signed' ? '2. 5. 2026' : 'Čeká na rodiče' },
        { id: `${participant.id}-wg`, participantName, activityTitle, activityType: 'Workshop', title: 'GDPR souhlas', status: s3, updatedAt: s3 === 'signed' ? '2. 5. 2026' : 'Čeká na rodiče' },
      ];
    }
    return documentsForParticipant(participant).filter((document) => document.activityType === 'Workshop');
  }
  return documentsForParticipant(participant).filter((document) => document.activityType === activityType);
}

function allParticipantDocuments() {
  const documentsByKey = new Map<string, ParentDocument>();

  for (const participant of linkedParticipants) {
    for (const document of documentsForParticipant(participant)) {
      const key = `${normalizeText(document.participantName)}-${document.activityType}-${documentKindForTitle(document.title)}`;
      const current = documentsByKey.get(key);
      if (!current || document.status === 'signed') documentsByKey.set(key, document);
    }
  }

  return Array.from(documentsByKey.values());
}

function documentStatsFor(documents: ParentDocument[]) {
  const signed = documents.filter((document) => document.status === 'signed').length;
  const missing = documents.filter((document) => document.status !== 'signed').length;
  return { signed, missing, total: documents.length };
}

function markDocumentComplete(document: ParentDocument): ParentDocument {
  return document.status === 'signed' ? document : { ...document, status: 'signed', updatedAt: 'Vyplněno při platbě' };
}

function participantHasPaidForActivity(participant: ParentParticipant, activityType: ActivityType) {
  return productsForParticipant(participant).some((product) => product.type === activityType && participantHasPaidForProduct(participant, product));
}

function participantHasPaidForProduct(participant: ParentParticipant, product: ParentProduct) {
  const participantName = normalizeText(`${participant.firstName} ${participant.lastName}`);
  const productTitle = normalizeText(product.title);
  const productPlace = normalizeText(product.place);
  const productCity = normalizeText(product.city);
  const productType = normalizeText(activityLabel(product.type));

  const paidPayment = parentPayments.some((payment) => {
    if (normalizeText(payment.participantName) !== participantName || payment.status !== 'paid') return false;
    const paymentTitle = normalizeText(payment.title);
    return paymentTitle.includes(productCity) || paymentTitle.includes(productPlace) || paymentTitle.includes(productTitle) || (product.type === 'Krouzek' && paymentTitle.includes('permanentka')) || (product.type === 'Tabor' && paymentTitle.includes('tabor'));
  });

  if (paidPayment) return true;

  return participant.activePurchases.some((purchase) => {
    if (purchase.type !== product.type) return false;
    const purchaseTitle = normalizeText(purchase.title);
    const purchaseStatus = normalizeText(purchase.status);
    return (purchaseStatus.includes('zaplaceno') || purchaseStatus.includes('aktivni')) && (purchaseTitle.includes(productCity) || purchaseTitle.includes(productPlace) || purchaseTitle.includes(productType));
  });
}

function missingDocumentsForActivity(activity: ReturnType<typeof adminActivityRows>[number]) {
  return participantsForActivity(activity).flatMap((participant) => documentsForActivityParticipant(participant, activity.type).filter((document) => document.status !== 'signed'));
}

function missingDocumentLabel(document: ParentDocument) {
  return `${document.title} (${activityLabel(document.activityType)})`;
}

function productsForParticipant(participant: ParentParticipant) {
  const productsByContext = new Map<string, ParentProduct>();

  for (const product of parentProducts) {
    if (!participantBelongsToProduct(participant, product)) continue;
    const key = `${product.type}-${normalizeText(product.place)}`;
    if (!productsByContext.has(key)) productsByContext.set(key, product);
  }

  return Array.from(productsByContext.values());
}

function documentKindForTitle(title: string) {
  const normalizedTitle = normalizeText(title);
  if (normalizedTitle.includes('gdpr')) return 'gdpr';
  if (normalizedTitle.includes('souhlas')) return 'guardian-consent';
  if (normalizedTitle.includes('zdravotni') || normalizedTitle.includes('anamneza') || normalizedTitle.includes('alergie')) return 'health';
  if (normalizedTitle.includes('vyzvedavani') || normalizedTitle.includes('odchod')) return 'departure';
  if (normalizedTitle.includes('bezinfekcnost')) return 'infection-free';
  if (normalizedTitle.includes('veci') || normalizedTitle.includes('sebou')) return 'packing';
  if (normalizedTitle.includes('prihlaška') || normalizedTitle.includes('podminky')) return 'workshop-terms';
  return normalizedTitle;
}

function buildCourseLocationStats(activityRows: ReturnType<typeof adminActivityRows>) {
  const courseActivities = activityRows.filter((activity) => activity.type === 'Krouzek');
  const uniqueActivities = new Map<string, (typeof courseActivities)[number]>();

  for (const activity of courseActivities) {
    const key = normalizeText(activity.place);
    if (!uniqueActivities.has(key)) uniqueActivities.set(key, activity);
  }

  return Array.from(uniqueActivities.entries()).map(([key, activity]) => {
    const monthGroups = buildActivitySessions(activity);
    const sessions = monthGroups.flatMap((g) => g.sessions);
    const presentCounts = sessions.map((s) => s.present);
    const averagePresent = Math.round(presentCounts.reduce((sum, value) => sum + value, 0) / Math.max(1, presentCounts.length));
    const enrollment = courseEnrollments.find((e) => e.courseId === activity.id);
    const enrolledCount = enrollment?.participants.length ?? activity.registered;
    return {
      key,
      activity,
      place: activity.place,
      sessions,
      capacityTotal: activity.capacityTotal,
      averagePresent,
      maxPresent: Math.max(...presentCounts, 0),
      lastPresent: presentCounts[presentCounts.length - 1] ?? 0,
      enrolledCount,
    };
  });
}

function buildActivitySessions(activity: ReturnType<typeof adminActivityRows>[number]) {
  const monthGroups = [
    { month: 'leden 2026', shortDates: ['6. 1.', '13. 1.', '20. 1.', '27. 1.'] },
    { month: 'únor 2026', shortDates: ['3. 2.', '10. 2.', '17. 2.', '24. 2.'] },
    { month: 'březen 2026', shortDates: ['3. 3.', '10. 3.', '17. 3.', '24. 3.', '31. 3.'] },
    { month: 'duben 2026', shortDates: ['7. 4.', '14. 4.', '21. 4.', '28. 4.'] },
  ];
  const seed = normalizeText(`${activity.place} ${activity.title}`).split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const registered = Math.max(1, activity.registered);
  const basePresent = Math.max(1, Math.min(registered, Math.round(registered * 0.78)));

  let globalIdx = 0;
  return monthGroups.map(({ month, shortDates }) => ({
    month,
    sessions: shortDates.map((shortDate) => {
      const idx = globalIdx++;
      const offset = ((seed + idx * 5) % 5) - 2;
      const present = Math.max(1, Math.min(registered, basePresent + offset + Math.floor(idx / 4)));
      return {
        date: `${shortDate} 2026`,
        shortDate,
        present,
        absent: Math.max(0, registered - present),
        capacityTotal: activity.capacityTotal,
      };
    }),
  }));
}

function participantsForActivity(activity: ReturnType<typeof adminActivityRows>[number]) {
  const product = parentProducts.find((item) => item.id === activity.id) ?? parentProducts.find((item) => item.type === activity.type && normalizeText(item.place) === normalizeText(activity.place));
  if (!product) return [];
  return linkedParticipants.filter((participant) => participantBelongsToProduct(participant, product));
}

function registeredParticipantsForActivity(activity: ReturnType<typeof adminActivityRows>[number]): ActivityParticipantRecord[] {
  const realParticipants = participantsForActivity(activity).map((participant) => participantRecordForLinkedParticipant(participant, activity));
  const registeredCount = Math.max(activity.registered, realParticipants.length);
  const generatedParticipants: ActivityParticipantRecord[] = [];

  for (let index = realParticipants.length; index < registeredCount; index += 1) {
    generatedParticipants.push(generatedParticipantForActivity(activity, index));
  }

  return [...realParticipants, ...generatedParticipants];
}

function sessionParticipantsForActivity(activity: ReturnType<typeof adminActivityRows>[number], presentCount: number) {
  return registeredParticipantsForActivity(activity).slice(0, presentCount);
}

function participantRecordForLinkedParticipant(participant: ParentParticipant, activity: ReturnType<typeof adminActivityRows>[number]): ActivityParticipantRecord {
  const participantDocuments = activityDocumentsForParticipant(participant, activity);
  const missing = participantDocuments.filter((document) => document.status !== 'signed').length;

  return {
    id: participant.id,
    name: `${participant.firstName} ${participant.lastName}`,
    subtitle: `${activityLabel(activity.type)} · ${activity.place}`,
    level: `${participant.level}`,
    attendance: activity.type === 'Krouzek' ? `${participant.attendanceDone}/${participant.attendanceTotal}` : activity.type === 'Workshop' ? 'Ticket' : 'Registrován',
    documents: missing > 0 ? `${missing} dok. chybí` : 'Dokumenty OK',
    parentContact: `${parentProfile.name} · ${parentProfile.phone}`,
    participant,
  };
}

function activityDocumentsForParticipant(participant: ParentParticipant, activity: ReturnType<typeof adminActivityRows>[number]) {
  return documentsForActivityParticipant(participant, activity.type);
}

function generatedParticipantForActivity(activity: ReturnType<typeof adminActivityRows>[number], index: number): ActivityParticipantRecord {
  const names = [
    'Tobiáš Král',
    'Sofie Dvořáková',
    'Matěj Urban',
    'Laura Veselá',
    'Adam Černý',
    'Nela Horáková',
    'Vojtěch Mareš',
    'Ema Procházková',
    'Jakub Němec',
    'Anna Pokorná',
    'Oliver Kučera',
    'Klára Benešová',
    'Daniel Fiala',
    'Sára Kolářová',
    'Filip Jelínek',
    'Natálie Svobodová',
    'Tomáš Bartoš',
    'Julie Marková',
    'Martin Němec',
    'Veronika Malá',
    'Dominik Čech',
    'Kristýna Nová',
    'Patrik Šimek',
    'Barbora Vacková',
  ];
  const name = names[index % names.length];
  const [firstName, ...lastNameParts] = name.split(' ');
  const lastName = lastNameParts.join(' ') || 'Účastník';
  const level = String(2 + ((index + activity.id.length) % 7));
  const attendanceDone = activity.type === 'Krouzek' ? Math.max(1, 4 + (index % 8)) : 0;
  const attendanceTotal = activity.type === 'Krouzek' ? 10 : 0;
  const participant: ParentParticipant = {
    id: `${activity.id}-participant-${index + 1}`,
    firstName,
    lastName,
    birthNumberMasked: `******/${String(2300 + index).slice(-4)}`,
    level: Number(level),
    bracelet: ['Béžová', 'Žlutá', 'Oranžová', 'Růžová'][index % 4],
    braceletColor: ['#D8C2A3', '#FFD84A', '#FFB21A', '#F5A7C8'][index % 4],
    xp: 240 + index * 45,
    nextBraceletXp: 600 + index * 80,
    attendanceDone,
    attendanceTotal,
    activeCourse: activity.type === 'Krouzek' ? activity.place : 'Bez pravidelného kroužku',
    nextTraining: activity.type === 'Krouzek' ? 'Podle rozpisu kroužku' : 'Jednorázová aktivita',
    activePurchases: activity.type === 'Krouzek' ? [{ type: 'Krouzek', title: activity.title, status: 'Aktivní' }] : [{ type: activity.type, title: activity.title, status: activity.type === 'Workshop' ? 'Ticket' : 'Zaplaceno' }],
  };

  return {
    id: participant.id,
    name,
    subtitle: `${activityLabel(activity.type)} · ${activity.place}`,
    level,
    attendance: activity.type === 'Krouzek' ? `${attendanceDone}/${attendanceTotal}` : activity.type === 'Workshop' ? 'Ticket' : 'Registrován',
    documents: (() => { const docs = documentsForActivityParticipant(participant, activity.type); const m = docs.filter((d) => d.status !== 'signed').length; return m > 0 ? `${m} dok. chybí` : 'Dokumenty OK'; })(),
    parentContact: `Rodič v evidenci · +420 7${String(10000000 + index * 4721).slice(0, 8)}`,
    participant,
  };
}

function findParticipantByShortName(shortName: string): ParentParticipant | undefined {
  const parts = shortName.trim().split(' ');
  if (parts.length < 2) return undefined;
  const firstName = normalizeText(parts[0]);
  const lastInitial = normalizeText(parts[1].replace('.', ''));
  return linkedParticipants.find((p) => normalizeText(p.firstName) === firstName && normalizeText(p.lastName).startsWith(lastInitial));
}

function workshopParticipantFromShortName(shortName: string, venue: string): ParentParticipant {
  const real = findParticipantByShortName(shortName);
  if (real) return real;
  const parts = shortName.trim().split(' ');
  const firstName = parts[0] ?? 'Účastník';
  const lastInitial = (parts[1] ?? 'X').replace('.', '');
  const seed = shortName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const BRACELETS = ['Béžová', 'Žlutá', 'Oranžová', 'Růžová', 'Modrá'];
  const BRACELET_COLORS = ['#D8C2A3', '#FFD84A', '#FFB21A', '#F5A7C8', '#7EC8E3'];
  return {
    id: `ws-participant-${normalizeText(shortName)}`,
    firstName,
    lastName: `${lastInitial}.`,
    birthNumberMasked: `******/${String(2200 + seed % 800).slice(-4)}`,
    level: 2 + (seed % 7),
    bracelet: BRACELETS[seed % BRACELETS.length],
    braceletColor: BRACELET_COLORS[seed % BRACELET_COLORS.length],
    xp: 150 + (seed % 900),
    nextBraceletXp: 600 + (seed % 800),
    attendanceDone: 1 + (seed % 8),
    attendanceTotal: 10,
    activeCourse: venue,
    nextTraining: 'Příští workshop',
    activePurchases: [{ type: 'Workshop', title: `Workshop · ${venue}`, status: 'Ticket' }],
  };
}

function findParticipantByName(name: string) {
  const normalizedName = normalizeText(name);
  return linkedParticipants.find((participant) => normalizeText(`${participant.firstName} ${participant.lastName}`) === normalizedName);
}

function buildCompleteCourseAttendance(participant: ParentParticipant, place: string) {
  const participantName = normalizeText(`${participant.firstName} ${participant.lastName}`);
  const placeName = normalizeText(place);
  const actualRows: Array<{ id: string; label: string; date: string; time: string; method: string; status: 'Přítomen' | 'Zbývá' }> = parentAttendanceHistory
    .filter((record) => normalizeText(record.participantName) === participantName && (normalizeText(record.location) === placeName || normalizeText(record.location).includes(placeName) || placeName.includes(normalizeText(record.location))))
    .map((record, index) => ({
      id: record.id,
      label: `Vstup ${index + 1}`,
      date: record.date,
      time: record.time,
      method: record.method,
      status: 'Přítomen' as const,
    }));

  const rows = [...actualRows];
  for (let index = rows.length; index < participant.attendanceTotal; index += 1) {
    const attended = index < participant.attendanceDone;
    rows.push({
      id: `${participant.id}-attendance-${index + 1}`,
      label: `Vstup ${index + 1}`,
      date: attended ? 'Zapsáno v historii permanentky' : 'Čeká na využití',
      time: attended ? 'bez času' : participant.nextTraining,
      method: attended ? 'Historie' : 'Plán',
      status: attended ? 'Přítomen' as const : 'Zbývá' as const,
    });
  }

  return rows;
}

function buildSkillTree(participant: ParentParticipant) {
  const skills = [
    { title: 'Bezpečný dopad', xp: 100, description: 'Měkké přistání, kontrola kolen a práce s rukama.' },
    { title: 'Parakotoul', xp: 240, description: 'Plynulý přechod z dopadu do kotoulu bez ztráty směru.' },
    { title: 'Precision jump', xp: 390, description: 'Přesný odraz a dopad na vyznačený cíl.' },
    { title: 'Lazy vault', xp: 560, description: 'Základní přeskok přes překážku s oporou ruky.' },
    { title: 'Kong vault', xp: 760, description: 'Dynamický přeskok s bezpečnou přípravou na vyšší překážku.' },
    { title: 'Wall run', xp: 980, description: 'Náběh na stěnu a kontrolovaný návrat zpět.' },
    { title: 'Flow link', xp: 1220, description: 'Spojení více prvků do krátké trasy bez zastavení.' },
    { title: 'Master challenge', xp: 1450, description: 'Kombinace techniky, odvahy a čistého provedení.' },
  ];
  const firstLockedIndex = skills.findIndex((skill) => participant.xp < skill.xp);

  return skills.map((skill, index) => ({
    ...skill,
    status: participant.xp >= skill.xp ? 'Hotovo' as const : 'Zamčeno' as const,
  }));
}

function filterActivityRows(activityRows: ReturnType<typeof adminActivityRows>, query: string) {
  return activityRows.filter((activity) => matchesQuery(`${activity.title} ${activity.place} ${activity.type}`, query));
}

function matchesQuery(value: string, query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  return normalizeText(value).includes(normalizedQuery);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugForId(value: string) {
  return normalizeText(value).replace(/\s+/g, '-');
}

function isPaidStatus(status: string) {
  return normalizeText(status) === 'zaplaceno' || normalizeText(status) === 'paid';
}

function coachStatusLabel(status: AdminCoachSummary['status']) {
  if (status === 'Aktivni') return 'Aktivní';
  if (status === 'Ceka na klic') return 'Čeká na klíč';
  return 'Pozastavený';
}

function initialsForName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function friendlyPayoutError(message: string) {
  if (message.includes('Missing STRIPE_SECRET_KEY')) return 'Backend nemá nastavený Stripe secret key. Doplň testovací STRIPE_SECRET_KEY pro sandbox výplaty.';
  if (message.includes('Missing SUPABASE_URL') || message.includes('SUPABASE_SERVICE_ROLE_KEY')) return 'Backend nemá Supabase service role klíč, takže výplatu nejde uložit do historie.';
  return message;
}

function FinanceOverviewSection({ totals, invoices, paymentRows, coaches, coachAttendanceRecords, onNavigate }: {
  totals: AdminTotals;
  invoices: Invoice[];
  paymentRows: AdminPaymentRow[];
  coaches: AdminCoachSummary[];
  coachAttendanceRecords: CoachAttendanceRecord[];
  onNavigate: (section: SectionKey) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  // Příjmy
  const revenueTotal = paymentRows.filter((r) => isPaidStatus(r.status)).reduce((s, r) => s + Number(r.amount || 0), 0);
  const revenuePending = paymentRows.filter((r) => !isPaidStatus(r.status)).reduce((s, r) => s + Number(r.amount || 0), 0);
  const revenueThisMonth = paymentRows.filter((r) => isPaidStatus(r.status) && (r.dueDate ?? '').startsWith(currentMonth)).reduce((s, r) => s + Number(r.amount || 0), 0);

  // Výdaje (faktury)
  const expensesTotal = invoices.reduce((s, inv) => s + inv.amount, 0);
  const expensesPaid = invoices.filter((inv) => inv.paid).reduce((s, inv) => s + inv.amount, 0);
  const expensesUnpaid = invoices.filter((inv) => !inv.paid).reduce((s, inv) => s + inv.amount, 0);
  const expensesOverdue = invoices.filter((inv) => !inv.paid && inv.dueDate < today);

  // Výplaty trenérů
  const coachPayoutTotal = coaches.reduce((s, c) => s + payoutAmountForCoach(c, coachAttendanceRecords), 0);

  // Cash flow estimate
  const cashFlow = revenueTotal - expensesPaid - coachPayoutTotal;

  // Top 5 nezaplacených od rodičů
  const unpaidParents = paymentRows.filter((r) => !isPaidStatus(r.status)).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Hlavní metriky */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Příjmy celkem',
            value: `${revenueTotal.toLocaleString('cs-CZ')} Kč`,
            sub: `${revenueThisMonth.toLocaleString('cs-CZ')} Kč tento měsíc`,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            icon: <TrendingUp size={20} className="text-emerald-600" />,
            onClick: () => onNavigate('payouts'),
          },
          {
            label: 'Čekající platby',
            value: `${revenuePending.toLocaleString('cs-CZ')} Kč`,
            sub: `${paymentRows.filter((r) => !isPaidStatus(r.status)).length} nezaplacených`,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            icon: <Banknote size={20} className="text-amber-600" />,
            onClick: () => onNavigate('payouts'),
          },
          {
            label: 'Výdaje (faktury)',
            value: `${expensesTotal.toLocaleString('cs-CZ')} Kč`,
            sub: `${expensesUnpaid.toLocaleString('cs-CZ')} Kč k úhradě`,
            color: 'text-brand-pink',
            bg: 'bg-brand-pink/5',
            border: 'border-brand-pink/20',
            icon: <TrendingDown size={20} className="text-brand-pink" />,
            onClick: () => onNavigate('invoices'),
          },
          {
            label: 'Odhadovaný zůstatek',
            value: `${cashFlow.toLocaleString('cs-CZ')} Kč`,
            sub: `po výdajích a výplatách`,
            color: cashFlow >= 0 ? 'text-brand-purple-deep' : 'text-brand-pink',
            bg: cashFlow >= 0 ? 'bg-brand-purple/5' : 'bg-brand-pink/5',
            border: cashFlow >= 0 ? 'border-brand-purple/15' : 'border-brand-pink/20',
            icon: <BarChart2 size={20} className={cashFlow >= 0 ? 'text-brand-purple' : 'text-brand-pink'} />,
            onClick: undefined,
          },
        ].map((card) => (
          <div key={card.label} role={card.onClick ? 'button' : undefined} tabIndex={card.onClick ? 0 : undefined} onClick={card.onClick} onKeyDown={card.onClick ? (e) => { if (e.key === 'Enter') card.onClick?.(); } : undefined} className={`cursor-default ${card.onClick ? 'cursor-pointer' : ''}`}>
            <Panel className={`h-full p-5 transition ${card.onClick ? 'hover:shadow-md' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] border ${card.border} ${card.bg}`}>
                {card.icon}
              </div>
              <p className="text-right text-[11px] font-bold text-brand-ink-soft">{card.label}</p>
            </div>
            <p className={`mt-3 text-2xl font-black ${card.color}`}>{card.value}</p>
            <p className="mt-0.5 text-xs font-bold text-brand-ink-soft">{card.sub}</p>
          </Panel>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Příjmy – rozpad */}
        <Panel className="flex flex-col p-5 self-stretch">
          <SectionTitle icon={<TrendingUp size={18} />} title="Příjmy" subtitle="platby od rodičů" />
          <div className="mt-4 flex-1 space-y-2">
            {[
              { label: 'Zaplaceno', value: revenueTotal, color: 'bg-emerald-500' },
              { label: 'Čekající', value: revenuePending, color: 'bg-amber-400' },
            ].map((row) => {
              const pct = revenueTotal + revenuePending > 0 ? (row.value / (revenueTotal + revenuePending)) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs font-bold text-brand-ink">
                    <span>{row.label}</span>
                    <span>{row.value.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-paper">
                    <div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => onNavigate('payouts')} className="mt-4 w-full rounded-[14px] bg-brand-paper py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple hover:text-white">
            Detail plateb →
          </button>
        </Panel>

        {/* Výdaje – rozpad */}
        <Panel className="flex flex-col p-5 self-stretch">
          <SectionTitle icon={<Receipt size={18} />} title="Výdaje" subtitle="faktury a platby" />
          <div className="mt-4 flex-1 space-y-2">
            {[
              { label: 'Tělocvičny', color: 'bg-brand-purple' },
              { label: 'Vybavení', color: 'bg-brand-cyan' },
              { label: 'Marketing', color: 'bg-brand-pink' },
              { label: 'Ostatní', color: 'bg-brand-ink-soft' },
            ].map((cat) => {
              const total = invoices.filter((inv) => inv.category === cat.label).reduce((s, inv) => s + inv.amount, 0);
              if (total === 0) return null;
              const pct = expensesTotal > 0 ? (total / expensesTotal) * 100 : 0;
              return (
                <div key={cat.label}>
                  <div className="mb-1 flex justify-between text-xs font-bold text-brand-ink">
                    <span>{cat.label}</span>
                    <span>{total.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-paper">
                    <div className={`h-full rounded-full ${cat.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {expensesOverdue.length > 0 ? (
            <div className="mt-4 rounded-[12px] border border-brand-pink/25 bg-brand-pink/5 px-3 py-2">
              <p className="text-xs font-black text-brand-pink">{expensesOverdue.length}× faktura po splatnosti</p>
              <p className="text-[11px] font-bold text-brand-ink-soft">{expensesOverdue.map((inv) => inv.supplier).join(', ')}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-black text-emerald-600">Žádné faktury po splatnosti ✓</p>
            </div>
          )}
          <button type="button" onClick={() => onNavigate('invoices')} className="mt-3 w-full rounded-[14px] bg-brand-paper py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple hover:text-white">
            Detail faktur →
          </button>
        </Panel>

        {/* Výplaty trenérů */}
        <Panel className="flex flex-col p-5 self-stretch">
          <SectionTitle icon={<Banknote size={18} />} title="Výplaty trenérů" subtitle="odhad za aktuální období" />
          <div className="mt-4 flex-1 space-y-2">
            {coaches.slice(0, 6).map((coach) => {
              const amount = payoutAmountForCoach(coach, coachAttendanceRecords);
              return (
                <div key={coach.id} className="flex items-center justify-between rounded-[10px] bg-brand-paper px-3 py-2">
                  <p className="text-sm font-bold text-brand-ink">{coach.name}</p>
                  <p className="text-sm font-black text-brand-ink">{amount.toLocaleString('cs-CZ')} Kč</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-[12px] border border-brand-purple/15 bg-brand-purple/5 px-3 py-2.5">
            <p className="text-sm font-black text-brand-ink">Celkem trenéři</p>
            <p className="text-sm font-black text-brand-purple-deep">{coachPayoutTotal.toLocaleString('cs-CZ')} Kč</p>
          </div>
          <button type="button" onClick={() => onNavigate('payouts')} className="mt-3 w-full rounded-[14px] bg-brand-paper py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple hover:text-white">
            Spravovat výplaty →
          </button>
        </Panel>
      </div>

      {/* Nezaplacení rodiče */}
      {unpaidParents.length > 0 ? (
        <Panel className="p-5">
          <SectionTitle icon={<ListChecks size={18} />} title="Čekající platby rodičů" subtitle="nejbližší nezaplacené položky" />
          <div className="mt-4 grid gap-2">
            {unpaidParents.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-amber-200 bg-amber-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-brand-ink">{row.participantName}</p>
                  <p className="text-xs font-bold text-brand-ink-soft">{row.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-700">{Number(row.amount).toLocaleString('cs-CZ')} Kč</p>
                  {row.dueDate ? <p className="text-[11px] font-bold text-brand-ink-soft">splatnost: {row.dueDate}</p> : null}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onNavigate('payouts')} className="mt-3 w-full rounded-[14px] bg-brand-paper py-2 text-xs font-black text-brand-purple transition hover:bg-brand-purple hover:text-white">
            Zobrazit všechny platby →
          </button>
        </Panel>
      ) : null}
    </div>
  );
}

function headlineForSection(section: SectionKey) {
  switch (section) {
    case 'attendance':
      return 'Docházka všech kroužků a účastníků';
    case 'participants':
      return 'Celý seznam dětí, nákupů a dokumentů';
    case 'products':
      return 'Produkty pro web a rodiče';
    case 'coaches':
      return 'Trenéři, lokality a výkon';
    case 'payouts':
      return 'Výplaty za měsíc přes Stripe sandbox';
    case 'finance':
      return 'Cash flow, příjmy, výdaje a výplaty na jednom místě';
    default:
      return 'Provozní přehled bez zbytečností';
  }
}