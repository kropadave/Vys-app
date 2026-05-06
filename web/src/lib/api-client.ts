const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  });
}

export async function createEmbeddedPaymentIntent(payload: EmbeddedPaymentIntentPayload): Promise<EmbeddedPaymentIntentResponse> {
  return requestJson('/api/payments/payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function confirmEmbeddedPaymentIntent(paymentIntentId: string): Promise<ConfirmResponse> {
  return requestJson('/api/payments/confirm-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId }),
  });
}

export async function saveCourseDocuments(payload: SaveCourseDocumentsPayload): Promise<SaveCourseDocumentsResponse> {
  return requestJson('/api/course-documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function createManualParticipantProfile(payload: CreateManualParticipantPayload): Promise<CreateManualParticipantResponse> {
  return requestJson('/api/participants/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function confirmCheckoutSession(sessionId: string): Promise<ConfirmResponse> {
  return requestJson('/api/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
}

export async function saveCoachAttendance(payload: SaveCoachAttendancePayload): Promise<SaveCoachAttendanceResponse> {
  return requestJson('/api/coach/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function createCoachStripeOnboarding(coachId: string, returnUrl: string, refreshUrl: string): Promise<{ accountId: string; onboardingUrl: string }> {
  return requestJson('/api/admin/coaches/' + coachId + '/stripe-onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnUrl, refreshUrl }),
  });
}

export async function sendTrainerPayout(payload: TrainerPayoutPayload): Promise<{ transfer: TrainerPayoutTransfer }> {
  const result = await requestJson<{ transfer: RawTrainerPayoutTransfer }>('/api/admin/trainer-payouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return { transfer: normalizeTrainerPayoutTransfer(result.transfer, payload) };
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Backend returned HTTP ${response.status}`);
  }

  return payload as T;
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
  coach_ids: string[];
  training_focus: string[];
  is_published: boolean;
};

export async function loadAdminProducts(): Promise<AdminProductRow[]> {
  const result = await requestJson<{ products: AdminProductRow[] }>('/api/admin/products', { method: 'GET' });
  return result.products;
}

export async function saveAdminProduct(product: AdminProductRow): Promise<{ id: string }> {
  return requestJson('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product }),
  });
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  await requestJson(`/api/admin/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
}