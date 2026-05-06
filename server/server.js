const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = Number(process.env.SERVER_PORT || 3001);
const defaultCorsOrigins = ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:8081', 'http://localhost:8088'];
const configuredCorsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultCorsOrigins, ...configuredCorsOrigins]));

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true,
}));

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), asyncRoute(async (request, response) => {
  requireServices();
  requireStripe();

  const signature = request.headers['stripe-signature'];
  let event;

  if (stripeWebhookSecret) {
    if (!signature) throw new Error('Missing Stripe webhook signature.');
    event = stripe.webhooks.constructEvent(request.body, signature, stripeWebhookSecret);
  } else {
    event = JSON.parse(request.body.toString('utf8'));
  }

  if (event.type === 'payment_intent.succeeded') {
    await finalizePaymentIntent(event.data.object);
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
    await markPaymentIntentFailed(event.data.object);
  }

  response.json({ received: true });
}));

app.use(express.json({ limit: '1mb' }));

function requireServices() {
  if (!supabase) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the backend.');
}

function requireStripe() {
  if (!stripe) throw new Error('Missing STRIPE_SECRET_KEY on the backend.');
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`Missing ${label}.`);
  return value.trim();
}

function optionalString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

const rewardDiscountRules = [
  { suffix: 'KROUZEK-5', type: 'Krouzek', percent: 5 },
  { suffix: 'WORKSHOP-10', type: 'Workshop', percent: 10 },
  { suffix: 'KROUZEK-12', type: 'Krouzek', percent: 12 },
  { suffix: 'WORKSHOP-15', type: 'Workshop', percent: 15 },
  { suffix: 'KROUZEK-20', type: 'Krouzek', percent: 20 },
];

function normalizeActivityType(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('workshop')) return 'Workshop';
  if (normalized.includes('krouzek')) return 'Krouzek';
  return null;
}

function rewardDiscountForCode(code, productType) {
  const normalizedCode = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
  const normalizedType = normalizeActivityType(productType);
  if (!normalizedCode) return null;
  return rewardDiscountRules.find((rule) => normalizedCode.endsWith(rule.suffix) && rule.type === normalizedType) || null;
}

function slugify(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'participant';
}

function asyncRoute(handler) {
  return async (request, response, next) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

async function getProduct(productId) {
  requireServices();

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,price,price_label,place,event_date,expires_at,entries_total')
    .eq('id', productId)
    .single();

  if (error || !data) throw new Error('Product was not found.');
  return data;
}

function toClientPurchase(row) {
  return {
    id: row.id,
    productId: row.product_id,
    participantId: row.participant_id,
    participantName: row.participant_name,
    type: row.type,
    title: row.title,
    amount: row.amount,
    priceLabel: row.price_label,
    place: row.place,
    status: row.status,
    paidAt: row.paid_at,
    eventDate: row.event_date || undefined,
    expiresAt: row.expires_at || undefined,
  };
}

function purchaseRowFromPaymentIntent(paymentIntent, metadata, status = 'Čeká na platbu') {
  const amount = Number(metadata.amount || Math.round((paymentIntent.amount || 0) / 100));

  return {
    id: `stripe-pi-${paymentIntent.id}`,
    parent_profile_id: optionalString(metadata.parent_profile_id),
    product_id: requiredString(metadata.product_id, 'product metadata'),
    participant_id: requiredString(metadata.participant_id, 'participant metadata'),
    participant_name: requiredString(metadata.participant_name, 'participantName metadata'),
    type: requiredString(metadata.type, 'type metadata'),
    title: requiredString(metadata.title, 'title metadata'),
    amount,
    original_amount: Number(metadata.original_amount || amount),
    discount_code: optionalString(metadata.discount_code),
    discount_percent: metadata.discount_percent ? Number(metadata.discount_percent) : null,
    discount_amount: metadata.discount_amount ? Number(metadata.discount_amount) : 0,
    price_label: metadata.price_label || `${amount} Kč`,
    place: requiredString(metadata.place, 'place metadata'),
    status,
    paid_at: status === 'Zaplaceno' ? new Date().toLocaleDateString('cs-CZ') : 'Čeká na zaplacení',
    event_date: metadata.event_date || null,
    expires_at: metadata.expires_at || null,
    stripe_payment_intent_id: paymentIntent.id,
  };
}

async function finalizePaymentIntent(paymentIntent) {
  requireServices();

  if (paymentIntent.status !== 'succeeded') throw new Error('Stripe payment is not paid yet.');

  const metadata = paymentIntent.metadata || {};
  const row = purchaseRowFromPaymentIntent(paymentIntent, metadata, 'Zaplaceno');
  const { data, error } = await supabase
    .from('parent_purchases')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  await createDigitalPassForPurchase(data);
  return data;
}

async function markPaymentIntentFailed(paymentIntent) {
  requireServices();

  const { error } = await supabase
    .from('parent_purchases')
    .update({ status: 'Platba selhala', paid_at: 'Platba se nepovedla' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) throw error;
}

async function createDigitalPassForPurchase(purchase) {
  if (!purchase || !purchase.participant_id || !purchase.product_id) return;

  const { data: product } = await supabase
    .from('products')
    .select('entries_total')
    .eq('id', purchase.product_id)
    .maybeSingle();

  const totalEntries = Number(product?.entries_total || (purchase.type === 'Kroužek' ? 10 : 1));
  const passId = `pass-${purchase.id}`;
  const passTitle = purchase.type === 'Kroužek' ? purchase.title : `${purchase.title} · ticket`;
  const chipPrefix = purchase.type === 'Kroužek' ? 'NFC' : 'QR';

  const { error } = await supabase
    .from('digital_passes')
    .upsert({
      id: passId,
      participant_id: purchase.participant_id,
      holder_name: purchase.participant_name,
      title: passTitle,
      location: purchase.place,
      nfc_chip_id: `${chipPrefix}-${purchase.participant_id.slice(0, 8).toUpperCase()}-${purchase.product_id.slice(0, 8).toUpperCase()}`,
      total_entries: totalEntries,
      used_entries: 0,
      last_scan_at: null,
      last_scan_place: purchase.place,
    }, { onConflict: 'id' });

  if (error) throw error;
}

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'teamvys-api' });
});

app.get('/api/camps', asyncRoute(async (_request, response) => {
  requireServices();

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,city,place,venue,price,price_label,primary_meta,secondary_meta,description,important_info,capacity_total,badge,event_date,expires_at')
    .eq('type', 'Tábor')
    .order('created_at', { ascending: true });

  if (error) throw error;
  response.json({ camps: data });
}));

app.get('/api/courses', asyncRoute(async (_request, response) => {
  requireServices();

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,city,place,venue,price,price_label,entries_total,primary_meta,secondary_meta,description,important_info,capacity_total,badge')
    .eq('type', 'Kroužek')
    .order('city', { ascending: true });

  if (error) throw error;
  response.json({ courses: data });
}));

app.get('/api/coach/sessions', asyncRoute(async (request, response) => {
  requireServices();

  const coachId = typeof request.query.coachId === 'string' ? request.query.coachId : 'coach-demo';
  const { data, error } = await supabase
    .from('coach_sessions')
    .select('*')
    .eq('coach_id', coachId)
    .order('day', { ascending: true });

  if (error) throw error;
  response.json({ sessions: data });
}));

app.post('/api/coach/attendance', asyncRoute(async (request, response) => {
  requireServices();

  const coachId = requiredString(request.body.coachId, 'coachId');
  const sessionId = requiredString(request.body.sessionId, 'sessionId');
  const place = requiredString(request.body.place, 'place');
  const present = requiredString(request.body.present, 'present');
  const durationHours = Number(request.body.durationHours || 1);
  const hourlyRate = Number(request.body.hourlyRate || 500);
  const today = new Date().toLocaleDateString('cs-CZ');
  const row = {
    id: `coach-att-${sessionId}-${new Date().toISOString().slice(0, 10)}`,
    coach_id: coachId,
    session_id: sessionId,
    date_text: today,
    place,
    status: 'Zapsáno',
    present,
    duration_hours: durationHours,
    hourly_rate: hourlyRate,
    amount: Math.round(durationHours * hourlyRate),
  };

  const { data, error } = await supabase
    .from('coach_attendance_records')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  response.status(201).json({ attendance: data });
}));

app.post('/api/payments/checkout', asyncRoute(async (request, response) => {
  requireServices();
  requireStripe();

  const productId = requiredString(request.body.productId, 'productId');
  const participantId = requiredString(request.body.participantId, 'participantId');
  const participantName = requiredString(request.body.participantName, 'participantName');
  const successUrl = requiredString(request.body.successUrl, 'successUrl');
  const cancelUrl = requiredString(request.body.cancelUrl, 'cancelUrl');
  const product = await getProduct(productId);
  const originalAmount = Math.round(Number(product.price));
  const discountCode = optionalString(request.body.discountCode);
  const discount = discountCode ? rewardDiscountForCode(discountCode, product.type) : null;

  if (discountCode && !discount) throw new Error('Slevový kód nejde použít pro tento produkt.');

  const discountAmount = discount ? Math.round((originalAmount * discount.percent) / 100) : 0;
  const amount = Math.max(0, originalAmount - discountAmount);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale: 'cs',
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'czk',
          unit_amount: amount * 100,
          product_data: {
            name: product.title,
            description: `${product.place} · ${participantName}`,
          },
        },
      },
    ],
    metadata: {
      product_id: product.id,
      participant_id: participantId,
      participant_name: participantName,
      type: product.type,
      title: product.title,
      amount: String(amount),
      original_amount: String(originalAmount),
      discount_code: discountCode || '',
      discount_percent: discount ? String(discount.percent) : '',
      discount_amount: discountAmount ? String(discountAmount) : '',
      price_label: discount ? `${product.price_label} · sleva ${discount.percent} %` : product.price_label,
      place: product.place,
      event_date: product.event_date || '',
      expires_at: product.expires_at || '',
    },
  });

  response.json({ id: session.id, url: session.url });
}));

app.post('/api/payments/payment-intent', asyncRoute(async (request, response) => {
  requireServices();
  requireStripe();

  const productId = requiredString(request.body.productId, 'productId');
  const participantId = requiredString(request.body.participantId, 'participantId');
  const participantName = requiredString(request.body.participantName, 'participantName');
  const product = await getProduct(productId);
  const originalAmount = Math.round(Number(product.price));
  const discountCode = optionalString(request.body.discountCode);
  const discount = discountCode ? rewardDiscountForCode(discountCode, product.type) : null;

  if (discountCode && !discount) throw new Error('Slevový kód nejde použít pro tento produkt.');

  const discountAmount = discount ? Math.round((originalAmount * discount.percent) / 100) : 0;
  const amount = Math.max(0, originalAmount - discountAmount);
  if (amount <= 0) throw new Error('Částka platby musí být větší než 0 Kč.');

  const priceLabel = discount ? `${product.price_label} · sleva ${discount.percent} %` : product.price_label;
  const metadata = {
    parent_profile_id: optionalString(request.body.parentProfileId) || '',
    product_id: product.id,
    participant_id: participantId,
    participant_name: participantName,
    type: product.type,
    title: product.title,
    amount: String(amount),
    original_amount: String(originalAmount),
    discount_code: discountCode || '',
    discount_percent: discount ? String(discount.percent) : '',
    discount_amount: discountAmount ? String(discountAmount) : '',
    price_label: priceLabel,
    place: product.place,
    event_date: product.event_date || '',
    expires_at: product.expires_at || '',
  };

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: 'czk',
    description: `TeamVYS · ${product.title} · ${participantName}`,
    receipt_email: optionalString(request.body.receiptEmail) || undefined,
    metadata,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  });

  const row = purchaseRowFromPaymentIntent(paymentIntent, metadata, 'Čeká na platbu');
  const { error } = await supabase
    .from('parent_purchases')
    .upsert(row, { onConflict: 'id' });

  if (error) throw error;

  response.status(201).json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount,
    originalAmount,
    discountAmount,
    discountPercent: discount?.percent ?? 0,
    priceLabel,
  });
}));

app.post('/api/payments/confirm-payment-intent', asyncRoute(async (request, response) => {
  requireServices();
  requireStripe();

  const paymentIntentId = requiredString(request.body.paymentIntentId, 'paymentIntentId');
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const purchase = await finalizePaymentIntent(paymentIntent);

  response.json({ purchase: toClientPurchase(purchase) });
}));

app.post('/api/participants/manual', asyncRoute(async (request, response) => {
  requireServices();

  const firstName = requiredString(request.body.firstName, 'firstName');
  const lastName = requiredString(request.body.lastName, 'lastName');
  const dateOfBirth = requiredString(request.body.dateOfBirth, 'dateOfBirth');
  const schoolYear = requiredString(request.body.schoolYear, 'schoolYear');
  const parentName = requiredString(request.body.parentName, 'parentName');
  const parentPhone = requiredString(request.body.parentPhone, 'parentPhone');
  const emergencyPhone = requiredString(request.body.emergencyPhone, 'emergencyPhone');
  const address = requiredString(request.body.address, 'address');
  const preferredCourse = requiredString(request.body.preferredCourse, 'preferredCourse');
  const departureMode = requiredString(request.body.departureMode, 'departureMode');
  const allergies = requiredString(request.body.allergies, 'allergies');
  const healthLimits = requiredString(request.body.healthLimits, 'healthLimits');
  const medicationNote = requiredString(request.body.medicationNote, 'medicationNote');

  if (!['parent', 'alone', 'authorized'].includes(departureMode)) throw new Error('Invalid departureMode.');

  const participantId = `manual-${slugify(`${firstName}-${lastName}-${dateOfBirth}`)}`;
  const row = {
    id: participantId,
    parent_profile_id: optionalString(request.body.parentProfileId) || 'parent-demo',
    first_name: firstName,
    last_name: lastName,
    birth_number_masked: optionalString(request.body.birthNumberMasked),
    date_of_birth: dateOfBirth,
    school_year: schoolYear,
    parent_name: parentName,
    parent_phone: parentPhone,
    emergency_phone: emergencyPhone,
    address,
    departure_mode: departureMode,
    authorized_people: optionalString(request.body.authorizedPeople),
    allergies,
    health_limits: healthLimits,
    medication_note: medicationNote,
    coach_note: optionalString(request.body.coachNote),
    without_phone: true,
    active_course: preferredCourse,
    next_training: 'Doplní se po zařazení do kurzu',
    paid_status: 'due',
    active_purchases: [],
  };

  const { data, error } = await supabase
    .from('participants')
    .upsert(row, { onConflict: 'id' })
    .select('id,first_name,last_name,active_course')
    .single();

  if (error) throw error;
  response.status(201).json({ participant: data });
}));

app.post('/api/course-documents', asyncRoute(async (request, response) => {
  requireServices();

  const productId = requiredString(request.body.productId, 'productId');
  const participantId = requiredString(request.body.participantId, 'participantId');
  const participantName = requiredString(request.body.participantName, 'participantName');
  const participantFirstName = requiredString(request.body.participantFirstName, 'participantFirstName');
  const participantLastName = requiredString(request.body.participantLastName, 'participantLastName');
  const documents = Array.isArray(request.body.documents) ? request.body.documents : [];

  if (documents.length === 0) throw new Error('At least one document is required.');

  const product = await getProduct(productId);

  const { error: participantError } = await supabase
    .from('participants')
    .upsert({
      id: participantId,
      parent_profile_id: optionalString(request.body.parentProfileId),
      first_name: participantFirstName,
      last_name: participantLastName,
      birth_number_masked: optionalString(request.body.birthNumberMasked),
      active_course: product.place,
      next_training: product.event_date || product.expires_at || 'Doplní se po registraci',
    }, { onConflict: 'id' });

  if (participantError) throw participantError;

  const now = new Date();
  const purchaseId = `pending-${participantId}-${product.id}`;
  const rows = documents.map((document) => {
    const kind = requiredString(document.kind, 'document kind');
    const title = requiredString(document.title, 'document title');
    const parentName = requiredString(document.parentName, 'parentName');
    const payload = document.payload && typeof document.payload === 'object' ? document.payload : {};

    return {
      id: `web-doc-${participantId}-${product.id}-${kind}`,
      participant_id: participantId,
      participant_name: participantName,
      purchase_id: purchaseId,
      product_id: product.id,
      activity_type: product.type,
      kind,
      title,
      status: 'signed',
      parent_name: parentName,
      course_place: product.place,
      payload: {
        ...payload,
        savedFrom: 'web-parent-checkout',
        savedVia: 'teamvys-api',
      },
      signed_at_text: now.toLocaleDateString('cs-CZ'),
      updated_at_text: now.toLocaleString('cs-CZ'),
    };
  });

  const { data, error } = await supabase
    .from('course_documents')
    .upsert(rows, { onConflict: 'id' })
    .select('id,participant_id,product_id,kind,title,status,updated_at_text');

  if (error) throw error;
  response.status(201).json({ documents: data });
}));

app.post('/api/payments/confirm', asyncRoute(async (request, response) => {
  requireServices();
  requireStripe();

  const sessionId = requiredString(request.body.sessionId, 'sessionId');
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });

  if (session.payment_status !== 'paid') throw new Error('Stripe payment is not paid yet.');

  const metadata = session.metadata || {};
  const amount = Number(metadata.amount || Math.round((session.amount_total || 0) / 100));
  const row = {
    id: `stripe-${session.id}`,
    product_id: requiredString(metadata.product_id, 'product metadata'),
    participant_id: requiredString(metadata.participant_id, 'participant metadata'),
    participant_name: requiredString(metadata.participant_name, 'participantName metadata'),
    type: requiredString(metadata.type, 'type metadata'),
    title: requiredString(metadata.title, 'title metadata'),
    amount,
    price_label: metadata.price_label || `${amount} Kč`,
    place: requiredString(metadata.place, 'place metadata'),
    status: 'Zaplaceno',
    paid_at: new Date(session.created * 1000).toLocaleDateString('cs-CZ'),
    event_date: metadata.event_date || null,
    expires_at: metadata.expires_at || null,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
  };

  const { data, error } = await supabase
    .from('parent_purchases')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  response.json({ purchase: toClientPurchase(data) });
}));

app.get('/api/admin/finance', asyncRoute(async (_request, response) => {
  requireServices();

  const [purchasesResult, payoutTransfersResult, coachesResult] = await Promise.all([
    supabase.from('parent_purchases').select('*').order('created_at', { ascending: false }),
    supabase.from('admin_coach_payout_transfers').select('*').order('created_at', { ascending: false }),
    supabase.from('coach_profiles').select('id,level,xp,qr_tricks_approved,stripe_account_id'),
  ]);

  if (purchasesResult.error) throw purchasesResult.error;
  if (payoutTransfersResult.error) throw payoutTransfersResult.error;
  if (coachesResult.error) throw coachesResult.error;

  response.json({
    purchases: purchasesResult.data,
    payoutTransfers: payoutTransfersResult.data,
    coaches: coachesResult.data,
  });
}));

app.post('/api/admin/coaches/:coachId/stripe-onboarding', asyncRoute(async (request, response) => {
  requireServices();
  requireStripe();

  const coachId = requiredString(request.params.coachId, 'coachId');
  const returnUrl = requiredString(request.body.returnUrl, 'returnUrl');
  const refreshUrl = requiredString(request.body.refreshUrl, 'refreshUrl');

  // Look up existing stripe_account_id for this coach
  const { data: profileData } = await supabase
    .from('coach_profiles')
    .select('stripe_account_id')
    .eq('id', coachId)
    .maybeSingle();

  let accountId = profileData?.stripe_account_id ?? null;

  // Create Express account if not yet set
  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express', country: 'CZ' });
    accountId = account.id;

    await supabase
      .from('coach_profiles')
      .update({ stripe_account_id: accountId })
      .eq('id', coachId);
  }

  // Generate a fresh onboarding link (valid ~5 min)
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  response.json({ accountId, onboardingUrl: accountLink.url });
}));

app.post('/api/admin/trainer-payouts', asyncRoute(async (request, response) => {
  requireServices();
  requireStripe();

  const coachId = requiredString(request.body.coachId, 'coachId');
  const coachName = requiredString(request.body.coachName, 'coachName');
  const periodKey = requiredString(request.body.periodKey, 'periodKey');
  const periodStart = requiredString(request.body.periodStart, 'periodStart');
  const periodEnd = requiredString(request.body.periodEnd, 'periodEnd');
  const stripeAccountId = requiredString(request.body.stripeAccountId, 'stripeAccountId');
  const amount = Math.round(Number(request.body.amount));

  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Payout amount must be greater than 0.');

  const transfer = await stripe.transfers.create({
    amount: amount * 100,
    currency: 'czk',
    destination: stripeAccountId,
    description: `TeamVYS výplata ${coachName} ${periodKey}`,
    metadata: { coach_id: coachId, coach_name: coachName, period_key: periodKey },
  });

  const row = {
    id: `coach-payout-${coachId}-${periodKey}`,
    coach_id: coachId,
    coach_name: coachName,
    period_key: periodKey,
    period_start: periodStart,
    period_end: periodEnd,
    amount,
    currency: 'czk',
    status: 'paid',
    mode: 'connect_transfer',
    stripe_account_id: stripeAccountId,
    stripe_transfer_id: transfer.id,
    stripe_payout_id: null,
    created_at_text: new Date().toLocaleString('cs-CZ'),
    available_from: new Date().toISOString().slice(0, 10),
  };

  const { data, error } = await supabase
    .from('admin_coach_payout_transfers')
    .upsert(row, { onConflict: 'coach_id,period_key' })
    .select()
    .single();

  if (error) throw error;
  response.status(201).json({ transfer: data });
}));

app.get('/api/admin/products', asyncRoute(async (_request, response) => {
  requireServices();

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,city,place,venue,price,price_label,entries_total,primary_meta,secondary_meta,description,important_info,badge,event_date,expires_at,capacity_total,capacity_current,hero_image,gallery,coach_ids,training_focus,is_published')
    .like('id', 'admin-created-%')
    .order('created_at', { ascending: false });

  if (error) throw error;
  response.json({ products: data || [] });
}));

app.post('/api/admin/products', asyncRoute(async (request, response) => {
  requireServices();

  const product = request.body.product;
  if (!product || typeof product.id !== 'string' || !product.id.startsWith('admin-created-')) {
    throw new Error('Invalid product: id must start with "admin-created-".');
  }

  const allowed = ['id', 'type', 'title', 'city', 'place', 'venue', 'price', 'price_label', 'entries_total', 'primary_meta', 'secondary_meta', 'description', 'important_info', 'badge', 'event_date', 'expires_at', 'capacity_total', 'capacity_current', 'hero_image', 'gallery', 'coach_ids', 'training_focus', 'is_published'];
  const row = Object.fromEntries(Object.entries(product).filter(([key]) => allowed.includes(key)));

  requiredString(row.type, 'type');
  requiredString(row.title, 'title');
  requiredString(row.city, 'city');
  requiredString(row.place, 'place');

  const { data, error } = await supabase
    .from('products')
    .upsert(row, { onConflict: 'id' })
    .select('id')
    .single();

  if (error) throw error;
  response.status(201).json({ id: data.id });
}));

app.delete('/api/admin/products/:id', asyncRoute(async (request, response) => {
  requireServices();

  const id = request.params.id;
  if (!id || !id.startsWith('admin-created-')) {
    throw new Error('Only admin-created products can be deleted via this endpoint.');
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  response.json({ ok: true });
}));

app.use((error, _request, response, _next) => {
  const status = error.statusCode || 400;
  response.status(status).json({ error: error.message || 'Unexpected backend error.' });
});

app.listen(port, () => {
  console.log(`TeamVYS API listening on http://localhost:${port}`);
});