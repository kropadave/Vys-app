import { createBrowserSupabaseClient, hasSupabaseBrowserConfig } from '@/lib/supabase/browser';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://server-psi-ochre-40.vercel.app';

type CheckoutPayload = {
  productId: string;
  participantId: string;
  participantName: string;
  successUrl: string;
  cancelUrl: string;
  discountCode?: string;
};

type CheckoutResponse = {
  id: string;
  url: string | null;
};

export type EmbeddedPaymentIntentPayload = {
  parentProfileId?: string;
  productId: string;
  participantId: string;
  participantName: string;
  receiptEmail?: string;
  discountCode?: string;
};

export type EmbeddedPaymentIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  discountPercent: number;
  priceLabel: string;
};

type SaveCourseDocument = {
  kind: string;
  title: string;
  parentName: string;
  payload: Record<string, unknown>;
};

type SaveCourseDocumentsPayload = {
  parentProfileId?: string;
  productId: string;
  participantId: string;
  participantName: string;
  participantFirstName: string;
  participantLastName: string;
  birthNumberMasked?: string;
  documents: SaveCourseDocument[];
};

type SaveCourseDocumentsResponse = {
  documents: Array<{
    id: string;
    participant_id: string;
    product_id: string;
    kind: string;
    title: string;
    status: string;
    updated_at_text: string;
  }>;
};

type CreateManualParticipantPayload = {
  parentProfileId?: string;
  firstName: string;
  lastName: string;
  birthNumberMasked?: string;
  dateOfBirth: string;
  schoolYear: string;
  parentName: string;
  parentPhone: string;
  emergencyPhone: string;
  address: string;
  preferredCourse: string;
  departureMode: string;
  authorizedPeople?: string;
  allergies: string;
  healthLimits: string;
  medicationNote: string;
  coachNote?: string;
};

type CreateManualParticipantResponse = {
  participant: {
    id: string;
    first_name: string;
    last_name: string;
    active_course: string | null;
  };
};

type LinkParticipantPayload = {
  parentProfileId?: string;
  firstName: string;
  lastName: string;
  birthNumber: string;
};

type LinkParticipantResponse = {
  participant: {
    id: string;
    first_name: string;
    last_name: string;
    active_course: string | null;
    parent_profile_id: string | null;
  };
};

type ConfirmResponse = {
  purchase: {
    id: string;
    title: string;
    participantName: string;
    amount: number;
    priceLabel: string;
    status: string;
    paidAt: string;
  };
};

export type SaveCoachAttendancePayload = {
  coachId: string;
  sessionId: string;
  place: string;
  present: string;
  durationHours: number;
  hourlyRate: number;
  latitude?: number;
  longitude?: number;
};

export type SaveCoachAttendanceResponse = {
  attendance: {
    id: string;
    coach_id: string;
    session_id: string;
    date_text: string;
    place: string;
    status: string;
    present: string;
    duration_hours: number;
    hourly_rate: number;
    amount: number;
  };
};

export type TrainerPayoutPayload = {
  coachId: string;
  coachName: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  stripeAccountId: string;
  amount: number;
};

export type TrainerPayoutTransfer = {
  id: string;
  coachId: string;
  coachName: string;
  periodKey: string;
  amount: number;
  status: string;
  createdAt?: string;
  stripeTransferId?: string;
};

type RawTrainerPayoutTransfer = {
  id: string;
  coach_id?: string;
  coachId?: string;
  coach_name?: string;
  coachName?: string;
  period_key?: string;
  periodKey?: string;
  amount: number;
  status: string;
  created_at_text?: string;
  createdAt?: string;
  stripe_transfer_id?: string | null;
  stripeTransferId?: string;
};

export async function createCheckoutSession(payload: CheckoutPayload): Promise<CheckoutResponse> {
  return requestJson('/api/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, { auth: true });
}

export async function createEmbeddedPaymentIntent(payload: EmbeddedPaymentIntentPayload): Promise<EmbeddedPaymentIntentResponse> {
  return requestJson('/api/payments/payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, { auth: true });
}

export async function confirmEmbeddedPaymentIntent(paymentIntentId: string): Promise<ConfirmResponse> {
  return requestJson('/api/payments/confirm-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId }),
  }, { auth: true });
}

export async function saveCourseDocuments(payload: SaveCourseDocumentsPayload): Promise<SaveCourseDocumentsResponse> {
  return requestJson('/api/course-documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, { auth: true });
}

export async function createManualParticipantProfile(payload: CreateManualParticipantPayload): Promise<CreateManualParticipantResponse> {
  return requestJson('/api/participants/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, { auth: true });
}

export async function linkParticipantByBirthNumber(payload: LinkParticipantPayload): Promise<LinkParticipantResponse> {
  // This route lives in the Next.js app itself — use a relative fetch, NOT the external apiUrl
  const init = await withAuthHeader({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const response = await fetch('/api/participants/link', init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data as LinkParticipantResponse;
}

export async function confirmCheckoutSession(sessionId: string): Promise<ConfirmResponse> {
  return requestJson('/api/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  }, { auth: true });
}

export async function saveCoachAttendance(payload: SaveCoachAttendancePayload): Promise<SaveCoachAttendanceResponse> {
  return requestJson('/api/coach/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, { auth: true });
}

export async function createCoachStripeOnboarding(coachId: string, returnUrl: string, refreshUrl: string): Promise<{ accountId: string; onboardingUrl: string }> {
  return requestJson('/api/admin/coaches/' + coachId + '/stripe-onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnUrl, refreshUrl }),
  }, { auth: true });
}

export async function sendTrainerPayout(payload: TrainerPayoutPayload): Promise<{ transfer: TrainerPayoutTransfer }> {
  const result = await requestJson<{ transfer: RawTrainerPayoutTransfer }>('/api/admin/trainer-payouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, { auth: true });

  return { transfer: normalizeTrainerPayoutTransfer(result.transfer, payload) };
}

async function requestJson<T>(path: string, init: RequestInit, options: { auth?: boolean } = {}): Promise<T> {
  const requestInit = options.auth ? await withAuthHeader(init) : init;
  const response = await fetch(`${apiUrl}${path}`, requestInit);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Backend returned HTTP ${response.status}`);
  }

  return payload as T;
}

async function withAuthHeader(init: RequestInit): Promise<RequestInit> {
  if (!hasSupabaseBrowserConfig()) return init;

  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return init;

  return {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  };
}

function normalizeTrainerPayoutTransfer(transfer: RawTrainerPayoutTransfer, fallback: TrainerPayoutPayload): TrainerPayoutTransfer {
  return {
    id: transfer.id,
    coachId: transfer.coachId ?? transfer.coach_id ?? fallback.coachId,
    coachName: transfer.coachName ?? transfer.coach_name ?? fallback.coachName,
    periodKey: transfer.periodKey ?? transfer.period_key ?? fallback.periodKey,
    amount: Number(transfer.amount || fallback.amount),
    status: transfer.status,
    createdAt: transfer.createdAt ?? transfer.created_at_text,
    stripeTransferId: transfer.stripeTransferId ?? transfer.stripe_transfer_id ?? undefined,
  };
}

// ─── Admin products ───────────────────────────────────────────────────────────

export type AdminProductRow = {
  id: string;
  type: string;
  title: string;
  city: string;
  place: string;
  venue: string;
  price: number;
  original_price?: number;
  price_label: string;
  entries_total?: number;
  primary_meta: string;
  secondary_meta: string;
  description: string;
  important_info: Array<{ label: string; value: string }>;
  badge: string;
  event_date?: string;
  expires_at?: string;
  capacity_total?: number;
  capacity_current: number;
  hero_image?: string;
  gallery: string[];
  map_query?: string;
  coach_ids: string[];
  training_focus: string[];
  is_published: boolean;
};

export async function loadAdminProducts(): Promise<AdminProductRow[]> {
  const result = await requestJson<{ products: AdminProductRow[] }>('/api/admin/products', { method: 'GET' }, { auth: true });
  return result.products;
}

export async function loadPublicProducts(): Promise<AdminProductRow[]> {
  const result = await requestJson<{ products: AdminProductRow[] }>('/api/public/products', { method: 'GET', cache: 'no-store' });
  return result.products;
}

export type PublicCoachSummary = {
  id: string;
  name: string;
  photoUrl: string;
};

export async function loadPublicCoaches(): Promise<PublicCoachSummary[]> {
  const result = await requestJson<{ coaches: PublicCoachSummary[] }>('/api/public/coaches', { method: 'GET', cache: 'no-store' });
  return result.coaches;
}

export async function saveAdminProduct(product: AdminProductRow): Promise<{ id: string }> {
  return requestJson('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product }),
  }, { auth: true });
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  await requestJson(`/api/admin/products/${encodeURIComponent(productId)}`, { method: 'DELETE' }, { auth: true });
}

// ─── Admin invoices ──────────────────────────────────────────────────────────

export type AdminInvoiceRow = {
  id: number | string;
  dodavatel: string | null;
  castka: string | null;
  mena: string | null;
  datum_vystaveni: string | null;
  datum_splatnosti: string | null;
  cislo_faktury: string | null;
  popis: string | null;
  file_url: string | null;
  zaplaceno: boolean;
  datum_zaplaceni: string | null;
  odeslal: string | null;
  created_at: string | null;
};

export type AdminInvoiceInput = {
  supplier: string;
  description: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  paid?: boolean;
  paidDate?: string;
};

export async function loadAdminInvoices(): Promise<AdminInvoiceRow[]> {
  const result = await requestJson<{ invoices: AdminInvoiceRow[] }>('/api/admin/invoices', { method: 'GET' }, { auth: true });
  return result.invoices;
}

export async function createAdminInvoice(invoice: AdminInvoiceInput): Promise<AdminInvoiceRow> {
  const result = await requestJson<{ invoice: AdminInvoiceRow }>('/api/admin/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice }),
  }, { auth: true });
  return result.invoice;
}

export async function updateAdminInvoicePayment(invoiceId: string, paid: boolean): Promise<AdminInvoiceRow> {
  const result = await requestJson<{ invoice: AdminInvoiceRow }>(`/api/admin/invoices/${encodeURIComponent(invoiceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paid }),
  }, { auth: true });
  return result.invoice;
}

export async function deleteAdminInvoice(invoiceId: string): Promise<void> {
  await requestJson(`/api/admin/invoices/${encodeURIComponent(invoiceId)}`, { method: 'DELETE' }, { auth: true });
}