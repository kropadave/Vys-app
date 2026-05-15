const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();

function envValue(name) {
  return (process.env[name] || '').replace(/\\n/g, '\n').trim();
}

const port = Number(process.env.SERVER_PORT || 3001);
const defaultCorsOrigins = [
  'https://vys-web.vercel.app',
  'https://vys-app.vercel.app',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:8081',
  'http://localhost:8088',
];
const configuredCorsOrigins = envValue('CORS_ORIGIN')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultCorsOrigins, ...configuredCorsOrigins]));

const supabaseUrl = envValue('SUPABASE_URL') || envValue('EXPO_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = envValue('SUPABASE_SERVICE_ROLE_KEY');
const stripeSecretKey = envValue('STRIPE_SECRET_KEY');
const stripeWebhookSecret = envValue('STRIPE_WEBHOOK_SECRET');
const isProduction = envValue('NODE_ENV') === 'production';

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

  if (!stripeWebhookSecret) {
    if (isProduction) throw new Error('Missing STRIPE_WEBHOOK_SECRET on the backend. Refusing unsigned Stripe webhook.');
    event = JSON.parse(request.body.toString('utf8'));
  } else {
    if (!signature) throw new Error('Missing Stripe webhook signature.');
    event = stripe.webhooks.constructEvent(request.body, signature, stripeWebhookSecret);
  }

  if (event.type === 'payment_intent.succeeded') {
    await finalizePaymentIntent(event.data.object);
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
    await markPaymentIntentFailed(event.data.object);
  }

  response.json({ received: true });
}));

app.use(express.json({ limit: '15mb' }));

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

const DEFAULT_COURSE_ATTENDANCE_RATE = 500;
const SOLO_COURSE_ATTENDANCE_RATE = 750;
const IGNORED_COACH_SESSION_IDS = new Set(['coach-demo']);

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

const czechWeekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

function isWorkshopCoachSession(session) {
  return String(session?.id || '').startsWith('coach-workshop-') || String(session?.group_name || '').startsWith('Workshop:');
}

function numericOrFallback(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

async function resolveCoachAttendanceRate(coachId, session, requestedHourlyRate) {
  const defaultRate = numericOrFallback(session?.hourly_rate, numericOrFallback(requestedHourlyRate, DEFAULT_COURSE_ATTENDANCE_RATE));

  if (!session || isWorkshopCoachSession(session)) return defaultRate;

  const { data, error } = await supabase
    .from('coach_sessions')
    .select('id,coach_id,group_name')
    .eq('city', session.city)
    .eq('venue', session.venue)
    .eq('day', session.day)
    .eq('time', session.time);

  if (error) throw error;

  const assignedCoachIds = new Set(
    (data || [])
      .filter((row) => !isWorkshopCoachSession(row) && !IGNORED_COACH_SESSION_IDS.has(row.coach_id))
      .map((row) => row.coach_id)
      .filter(Boolean),
  );

  if (assignedCoachIds.size === 1 && assignedCoachIds.has(coachId)) return SOLO_COURSE_ATTENDANCE_RATE;
  return DEFAULT_COURSE_ATTENDANCE_RATE;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => d * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

function normalizePersonNamePart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function birthNumberSuffix(value) {
  return String(value || '').replace(/\D/g, '').slice(-4);
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

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function bearerTokenFromRequest(request) {
  const header = request.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] || null;
}

async function requireAuthenticatedProfile(request) {
  requireServices();

  const token = bearerTokenFromRequest(request);
  if (!token) throw httpError('Přihlášení je vyžadováno.', 401);

  const { data: userResult, error: userError } = await supabase.auth.getUser(token);
  const user = userResult?.user;
  if (userError || !user) throw httpError('Přihlášení vypršelo nebo není platné.', 401);

  const { data: profile, error: profileError } = await supabase
    .from('app_profiles')
    .select('id,role,email,name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw httpError('Profil účtu nebyl nalezen.', 403);

  return profile;
}

async function requireAdmin(request) {
  const profile = await requireAuthenticatedProfile(request);
  if (profile.role !== 'admin') throw httpError('Tahle operace je pouze pro admina.', 403);
  return profile;
}

async function requireParentOrAdmin(request) {
  const profile = await requireAuthenticatedProfile(request);
  if (profile.role !== 'admin' && profile.role !== 'parent') throw httpError('Tahle operace je pouze pro rodičovský účet.', 403);
  return profile;
}

function parentProfileIdForActor(actor, requestedParentProfileId) {
  const requested = optionalString(requestedParentProfileId);
  if (actor.role === 'admin') return requested || actor.id;
  if (requested && requested !== actor.id) throw httpError('Rodič může zapisovat jen ke svému účtu.', 403);
  return actor.id;
}

async function assertParticipantAccessible(actor, participantId) {
  if (actor.role === 'admin') return;

  const { data: participant, error } = await supabase
    .from('participants')
    .select('parent_profile_id')
    .eq('id', participantId)
    .maybeSingle();

  if (error) throw error;
  if (participant?.parent_profile_id && participant.parent_profile_id !== actor.id) {
    throw httpError('Účastník patří k jinému rodičovskému účtu.', 403);
  }
}

function assertPaymentIntentAccessible(actor, paymentIntent) {
  if (actor.role === 'admin') return;
  const metadata = paymentIntent.metadata || {};
  if (metadata.parent_profile_id && metadata.parent_profile_id !== actor.id) {
    throw httpError('Platba patří k jinému rodičovskému účtu.', 403);
  }
}

function assertCheckoutSessionAccessible(actor, session) {
  if (actor.role === 'admin') return;
  const metadata = session.metadata || {};
  if (metadata.parent_profile_id && metadata.parent_profile_id !== actor.id) {
    throw httpError('Platba patří k jinému rodičovskému účtu.', 403);
  }
}

async function requireStaff(request) {
  const profile = await requireAuthenticatedProfile(request);
  if (profile.role === 'admin') return profile;
  if (profile.role !== 'coach') throw httpError('Tahle operace je pouze pro tým TeamVYS.', 403);

  const { data: coach, error } = await supabase
    .from('coach_profiles')
    .select('approval_status')
    .eq('id', profile.id)
    .maybeSingle();

  if (error) throw error;
  if (coach?.approval_status !== 'approved') throw httpError('Trenérský účet ještě není schválený.', 403);
  return profile;
}

async function getProduct(productId) {
  requireServices();

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,price,price_label,place,event_date,expires_at,entries_total,capacity_total,capacity_current')
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

function nextMonthFirstIso(periodEndIso) {
  const [year, month] = String(periodEndIso).split('-').map(Number);
  if (!year || !month) throw new Error('Invalid payout period end date.');

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createdAtText() {
  return new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  await syncPaidPurchaseSideEffects(data);
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

async function createDigitalPassForPurchase(purchase, productOverride) {
  if (!purchase || !purchase.participant_id || !purchase.product_id) return;
  // Camps use name-based check-in via coach list — no QR pass needed
  if (purchase.type === 'Tábor' || purchase.type === 'Tabor') return;

  const product = productOverride || await getProduct(purchase.product_id);

  const totalEntries = Number(product?.entries_total || (purchase.type === 'Kroužek' ? 10 : 1));
  const passId = `pass-${purchase.id}`;
  const passTitle = purchase.type === 'Kroužek' ? purchase.title : `${purchase.title} · ticket`;
  const chipPrefix = purchase.type === 'Kroužek' ? 'NFC' : 'QR';

  const { data: existingPass, error: existingPassError } = await supabase
    .from('digital_passes')
    .select('used_entries,last_scan_at,last_scan_place')
    .eq('id', passId)
    .maybeSingle();

  if (existingPassError) throw existingPassError;

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
      used_entries: Number(existingPass?.used_entries || 0),
      last_scan_at: existingPass?.last_scan_at ?? null,
      last_scan_place: existingPass?.last_scan_place ?? purchase.place,
    }, { onConflict: 'id' });

  if (error) throw error;
}

async function ensureProductCapacity(productId) {
  const product = await getProduct(productId);
  if (!product.capacity_total) return product;

  const used = await countPaidProductParticipants(product);
  if (used >= Number(product.capacity_total)) throw new Error(`Kapacita produktu je plná (${used}/${product.capacity_total}).`);

  return { ...product, capacity_current: used };
}

async function syncProductCapacity(product) {
  const used = await countPaidProductParticipants(product);
  const productIds = capacityProductIds(product);

  const { error: updateError } = await supabase
    .from('products')
    .update({ capacity_current: used })
    .in('id', productIds);

  if (updateError) throw updateError;
}

function capacityProductIds(product) {
  const productId = String(product?.id || '');
  if (product?.type !== 'Kroužek') return [productId];

  const baseId = productId.endsWith('-15') ? productId.slice(0, -3) : productId;
  return [baseId, `${baseId}-15`];
}

async function countPaidProductParticipants(product) {
  const productIds = capacityProductIds(product);
  const { data, error } = await supabase
    .from('parent_purchases')
    .select('id,parent_profile_id,participant_id,participant_name')
    .in('product_id', productIds)
    .eq('status', 'Zaplaceno');

  if (error) throw error;

  const participants = new Set();
  for (const purchase of data || []) {
    if (isDemoAdminRecord(purchase.id, purchase.parent_profile_id, purchase.participant_id, purchase.participant_name)) continue;
    participants.add(purchase.participant_id || normalizeAdminSeedText(purchase.participant_name) || purchase.id);
  }

  return participants.size;
}

async function applyLiveProductCapacities(products) {
  const capacityProducts = (products || []).filter((product) => product.capacity_total);
  if (capacityProducts.length === 0) return products || [];

  const allProductIds = Array.from(new Set(capacityProducts.flatMap(capacityProductIds).filter(Boolean)));
  const { data, error } = await supabase
    .from('parent_purchases')
    .select('id,parent_profile_id,participant_id,participant_name,product_id')
    .in('product_id', allProductIds)
    .eq('status', 'Zaplaceno');

  if (error) throw error;

  const participantsByProductId = new Map();
  for (const purchase of data || []) {
    if (isDemoAdminRecord(purchase.id, purchase.parent_profile_id, purchase.participant_id, purchase.participant_name)) continue;
    const participantKey = purchase.participant_id || normalizeAdminSeedText(purchase.participant_name) || purchase.id;
    if (!participantsByProductId.has(purchase.product_id)) participantsByProductId.set(purchase.product_id, new Set());
    participantsByProductId.get(purchase.product_id).add(participantKey);
  }

  return (products || []).map((product) => {
    if (!product.capacity_total) return product;
    const participants = new Set();
    for (const productId of capacityProductIds(product)) {
      for (const participantKey of participantsByProductId.get(productId) || []) participants.add(participantKey);
    }
    return { ...product, capacity_current: participants.size };
  });
}

async function syncParticipantPaidPurchases(participantId, product) {
  const { data: purchases, error } = await supabase
    .from('parent_purchases')
    .select('id,product_id,type,title,status,place,paid_at,created_at')
    .eq('participant_id', participantId)
    .eq('status', 'Zaplaceno')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const activePurchases = (purchases || []).map((purchase) => ({
    purchaseId: purchase.id,
    productId: purchase.product_id,
    type: purchase.type,
    title: purchase.title,
    status: 'Aktivní',
    place: purchase.place,
    paidAt: purchase.paid_at,
  }));

  const update = {
    paid_status: 'paid',
    active_purchases: activePurchases,
  };

  if (product) {
    if (product.type === 'Kroužek') update.active_course = product.place;
    const nextTraining = product.event_date || product.expires_at;
    if (nextTraining) update.next_training = nextTraining;
  }

  const { error: participantError } = await supabase
    .from('participants')
    .update(update)
    .eq('id', participantId);

  if (participantError) throw participantError;
}

async function syncParentPaymentForPurchase(purchase) {
  const { error } = await supabase
    .from('parent_payments')
    .upsert({
      id: `payment-${purchase.id}`,
      participant_id: purchase.participant_id,
      participant_name: purchase.participant_name,
      title: purchase.title,
      amount: purchase.amount,
      due_date: purchase.paid_at,
      status: 'paid',
      stripe_ready: true,
    }, { onConflict: 'id' });

  if (error) throw error;
}

async function syncPaidPurchaseSideEffects(purchase) {
  if (!purchase || purchase.status !== 'Zaplaceno') return;

  const product = await getProduct(purchase.product_id);
  await Promise.all([
    syncProductCapacity(product),
    syncParticipantPaidPurchases(purchase.participant_id, product),
    syncParentPaymentForPurchase(purchase),
    createDigitalPassForPurchase(purchase, product),
  ]);
}

async function calculateTrainerPayoutAmount(coachId, periodStart, periodEnd) {
  const [attendanceResult, adjustmentsResult, payoutResult] = await Promise.all([
    supabase
      .from('coach_attendance_records')
      .select('amount,created_at')
      .eq('coach_id', coachId)
      .gte('created_at', `${periodStart}T00:00:00.000Z`)
      .lte('created_at', `${periodEnd}T23:59:59.999Z`),
    supabase
      .from('admin_attendance_adjustments')
      .select('amount,created_at')
      .eq('coach_id', coachId)
      .gte('created_at', `${periodStart}T00:00:00.000Z`)
      .lte('created_at', `${periodEnd}T23:59:59.999Z`),
    supabase
      .from('coach_payouts')
      .select('approved_bonuses')
      .eq('coach_id', coachId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (attendanceResult.error) throw attendanceResult.error;
  if (adjustmentsResult.error) throw adjustmentsResult.error;
  if (payoutResult.error) throw payoutResult.error;

  const attendanceAmount = (attendanceResult.data || []).reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const adjustmentAmount = (adjustmentsResult.data || []).reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const approvedBonuses = Number(payoutResult.data?.approved_bonuses || 0);

  return Math.round(attendanceAmount + adjustmentAmount + approvedBonuses);
}

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'teamvys-api' });
});

app.get('/api/public/products', asyncRoute(async (_request, response) => {
  requireServices();

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,city,place,venue,price,price_label,original_price,entries_total,primary_meta,secondary_meta,description,important_info,badge,event_date,expires_at,capacity_total,capacity_current,hero_image,gallery,coach_ids,training_focus,is_published')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const products = await applyLiveProductCapacities(data || []);
  response.json({ products });
}));

app.get('/api/public/coaches', asyncRoute(async (_request, response) => {
  requireServices();

  const { data: coachRows, error } = await supabase
    .from('coach_profiles')
    .select('id, profile_photo_url')
    .eq('approval_status', 'approved');

  if (error) throw error;

  const ids = (coachRows || []).map((r) => r.id).filter((id) => !isDemoAdminRecord(id));
  if (ids.length === 0) {
    response.json({ coaches: [] });
    return;
  }

  const { data: profiles } = await supabase
    .from('app_profiles')
    .select('id, name')
    .in('id', ids);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.name]));
  const coaches = (coachRows || [])
    .filter((r) => !isDemoAdminRecord(r.id))
    .map((r) => ({
      id: r.id,
      name: profileMap.get(r.id) || 'Trenér TeamVYS',
      photoUrl: r.profile_photo_url || '/vys-logo-mark.png',
    }));

  response.json({ coaches });
}));

app.get('/api/camps', asyncRoute(async (_request, response) => {
  requireServices();

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,city,place,venue,price,price_label,primary_meta,secondary_meta,description,important_info,capacity_total,capacity_current,coach_ids,badge,event_date,expires_at')
    .eq('type', 'Tábor')
    .order('created_at', { ascending: true });

  if (error) throw error;
  const camps = await applyLiveProductCapacities(data || []);
  response.json({ camps });
}));

app.get('/api/courses', asyncRoute(async (_request, response) => {
  requireServices();

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,city,place,venue,price,price_label,entries_total,primary_meta,secondary_meta,description,important_info,capacity_total,capacity_current,coach_ids,badge')
    .eq('type', 'Kroužek')
    .order('city', { ascending: true });

  if (error) throw error;
  const courses = await applyLiveProductCapacities(data || []);
  response.json({ courses });
}));

app.get('/api/coach/sessions', asyncRoute(async (request, response) => {
  requireServices();
  const actor = await requireStaff(request);

  const requestedCoachId = typeof request.query.coachId === 'string' ? request.query.coachId : actor.id;
  if (actor.role !== 'admin' && actor.id !== requestedCoachId) {
    throw httpError('Trenér může zobrazit jen vlastní sessions.', 403);
  }

  const { data, error } = await supabase
    .from('coach_sessions')
    .select('*')
    .eq('coach_id', requestedCoachId)
    .order('day', { ascending: true });

  if (error) throw error;
  response.json({ sessions: data });
}));

app.post('/api/coach/attendance', asyncRoute(async (request, response) => {
  requireServices();
  const actor = await requireStaff(request);

  const coachId = requiredString(request.body.coachId, 'coachId');
  if (actor.role !== 'admin' && actor.id !== coachId) throw httpError('Trenér může zapisovat jen vlastní docházku.', 403);

  const sessionId = requiredString(request.body.sessionId, 'sessionId');
  const place = requiredString(request.body.place, 'place');
  const present = requiredString(request.body.present, 'present');
  const requestedHourlyRate = Number(request.body.hourlyRate || DEFAULT_COURSE_ATTENDANCE_RATE);

  const { data: session, error: sessionError } = await supabase
    .from('coach_sessions')
    .select('id, coach_id, city, venue, day, time, group_name, duration_hours, hourly_rate, latitude, longitude, check_in_radius_meters')
    .eq('id', sessionId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session && actor.role !== 'admin') throw new Error('Session nebyla nalezena.');
  if (session && actor.role !== 'admin' && session.coach_id !== coachId) throw httpError('Trenér může zapisovat jen trénink, na který je přiřazený.', 403);

  const durationHours = numericOrFallback(request.body.durationHours, numericOrFallback(session?.duration_hours, 1));
  const hourlyRate = session ? await resolveCoachAttendanceRate(coachId, session, requestedHourlyRate) : numericOrFallback(requestedHourlyRate, DEFAULT_COURSE_ATTENDANCE_RATE);

  // GPS + day-of-week validation (admin bypasses)
  if (actor.role !== 'admin') {
    const todayName = czechWeekdays[new Date().getDay()];
    if (session.day && session.day !== todayName) {
      throw httpError(`Tato session je na ${session.day}, ale dnes je ${todayName}.`, 403);
    }

    if (session.latitude != null && session.longitude != null) {
      const reqLat = Number(request.body.latitude);
      const reqLon = Number(request.body.longitude);
      if (isNaN(reqLat) || isNaN(reqLon) || request.body.latitude === undefined) {
        throw httpError('Pro zápis docházky je vyžadována GPS poloha (latitude, longitude).', 400);
      }
      const distanceMeters = Math.round(haversineMeters(reqLat, reqLon, session.latitude, session.longitude));
      const radiusMeters = session.check_in_radius_meters ?? 300;
      if (distanceMeters > radiusMeters) {
        throw httpError(`Jsi ${distanceMeters} m od tréninku (povoleno ${radiusMeters} m). Přesuň se blíž ke škole.`, 403);
      }
    }
  }
  const today = new Date().toLocaleDateString('cs-CZ');
  const row = {
    id: `coach-att-${sessionId}-${new Date().toISOString().slice(0, 10)}`,
    coach_id: coachId,
    session_id: session?.id ?? null,
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
  const actor = await requireParentOrAdmin(request);
  requireStripe();

  const productId = requiredString(request.body.productId, 'productId');
  const participantId = requiredString(request.body.participantId, 'participantId');
  await assertParticipantAccessible(actor, participantId);

  const participantName = requiredString(request.body.participantName, 'participantName');
  const successUrl = requiredString(request.body.successUrl, 'successUrl');
  const cancelUrl = requiredString(request.body.cancelUrl, 'cancelUrl');
  const parentProfileId = parentProfileIdForActor(actor, request.body.parentProfileId);
  const product = await ensureProductCapacity(productId);
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
      parent_profile_id: parentProfileId,
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
  const actor = await requireParentOrAdmin(request);
  requireStripe();

  const productId = requiredString(request.body.productId, 'productId');
  const participantId = requiredString(request.body.participantId, 'participantId');
  await assertParticipantAccessible(actor, participantId);

  const participantName = requiredString(request.body.participantName, 'participantName');
  const product = await ensureProductCapacity(productId);
  const originalAmount = Math.round(Number(product.price));
  const discountCode = optionalString(request.body.discountCode);
  const discount = discountCode ? rewardDiscountForCode(discountCode, product.type) : null;

  if (discountCode && !discount) throw new Error('Slevový kód nejde použít pro tento produkt.');

  const discountAmount = discount ? Math.round((originalAmount * discount.percent) / 100) : 0;
  const amount = Math.max(0, originalAmount - discountAmount);
  if (amount <= 0) throw new Error('Částka platby musí být větší než 0 Kč.');

  const priceLabel = discount ? `${product.price_label} · sleva ${discount.percent} %` : product.price_label;
  const metadata = {
    parent_profile_id: parentProfileIdForActor(actor, request.body.parentProfileId),
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
  const actor = await requireParentOrAdmin(request);
  requireStripe();

  const paymentIntentId = requiredString(request.body.paymentIntentId, 'paymentIntentId');
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  assertPaymentIntentAccessible(actor, paymentIntent);
  const purchase = await finalizePaymentIntent(paymentIntent);

  response.json({ purchase: toClientPurchase(purchase) });
}));

app.post('/api/participants/manual', asyncRoute(async (request, response) => {
  requireServices();
  const actor = await requireParentOrAdmin(request);

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
  await assertParticipantAccessible(actor, participantId);

  const parentProfileId = parentProfileIdForActor(actor, request.body.parentProfileId);
  const row = {
    id: participantId,
    parent_profile_id: parentProfileId,
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

app.post('/api/participants/link', asyncRoute(async (request, response) => {
  requireServices();
  const actor = await requireParentOrAdmin(request);

  const parentProfileId = parentProfileIdForActor(actor, request.body.parentProfileId);
  const firstName = requiredString(request.body.firstName, 'firstName');
  const lastName = requiredString(request.body.lastName, 'lastName');
  const rawBirthNumber = optionalString(request.body.birthNumber);
  const birthSuffix = rawBirthNumber ? birthNumberSuffix(rawBirthNumber) : '';
  const hasBirthNumber = birthSuffix.length >= 4;

  const normalizedFirstName = normalizePersonNamePart(firstName);
  const normalizedLastName = normalizePersonNamePart(lastName);

  let candidates, candidatesError;

  if (hasBirthNumber) {
    // Birth number provided: filter by suffix in DB, then match name + suffix
    ({ data: candidates, error: candidatesError } = await supabase
      .from('participants')
      .select('id,parent_profile_id,first_name,last_name,birth_number_masked,active_course')
      .ilike('birth_number_masked', `%${birthSuffix}`)
      .limit(50));
  } else {
    // No birth number: fetch by exact name match (case-insensitive)
    ({ data: candidates, error: candidatesError } = await supabase
      .from('participants')
      .select('id,parent_profile_id,first_name,last_name,birth_number_masked,active_course')
      .ilike('first_name', firstName)
      .ilike('last_name', lastName)
      .limit(50));
  }

  if (candidatesError) throw candidatesError;

  let participant;
  if (hasBirthNumber) {
    participant = (candidates || []).find((candidate) => {
      const firstMatches = normalizePersonNamePart(candidate.first_name) === normalizedFirstName;
      const lastMatches = normalizePersonNamePart(candidate.last_name) === normalizedLastName;
      const birthMatches = birthNumberSuffix(candidate.birth_number_masked) === birthSuffix;
      return firstMatches && lastMatches && birthMatches;
    });
    if (!participant) throw new Error('Účastník se podle jména a rodného čísla nenašel.');
  } else {
    // No birth number provided — only match participants who also have no birth number set
    const nameMatches = (candidates || []).filter((candidate) => {
      const firstMatches = normalizePersonNamePart(candidate.first_name) === normalizedFirstName;
      const lastMatches = normalizePersonNamePart(candidate.last_name) === normalizedLastName;
      const hasNoBirthNumber = !candidate.birth_number_masked || candidate.birth_number_masked.trim() === '';
      return firstMatches && lastMatches && hasNoBirthNumber;
    });
    if (nameMatches.length === 0) {
      throw new Error('Účastník se podle jména nenašel. Pokud má účastník nastavené rodné číslo, zadej ho pro přesnější vyhledávání.');
    }
    if (nameMatches.length > 1) {
      throw new Error('Bylo nalezeno více účastníků se stejným jménem. Zadej rodné číslo pro přesné rozlišení.');
    }
    participant = nameMatches[0];
  }

  if (participant.parent_profile_id && participant.parent_profile_id !== parentProfileId) {
    throw new Error('Účastník už je připojený k jinému rodičovskému účtu.');
  }

  const { data, error } = await supabase
    .from('participants')
    .update({ parent_profile_id: parentProfileId })
    .eq('id', participant.id)
    .select('id,first_name,last_name,active_course,parent_profile_id')
    .single();

  if (error) throw error;
  response.json({ participant: data });
}));

app.post('/api/course-documents', asyncRoute(async (request, response) => {
  requireServices();
  const actor = await requireParentOrAdmin(request);

  const productId = requiredString(request.body.productId, 'productId');
  const participantId = requiredString(request.body.participantId, 'participantId');
  await assertParticipantAccessible(actor, participantId);

  const participantName = requiredString(request.body.participantName, 'participantName');
  const participantFirstName = requiredString(request.body.participantFirstName, 'participantFirstName');
  const participantLastName = requiredString(request.body.participantLastName, 'participantLastName');
  const documents = Array.isArray(request.body.documents) ? request.body.documents : [];

  if (documents.length === 0) throw new Error('At least one document is required.');

  const product = await getProduct(productId);
  const parentProfileId = parentProfileIdForActor(actor, request.body.parentProfileId);

  const { error: participantError } = await supabase
    .from('participants')
    .upsert({
      id: participantId,
      parent_profile_id: parentProfileId,
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
  const actor = await requireParentOrAdmin(request);
  requireStripe();

  const sessionId = requiredString(request.body.sessionId, 'sessionId');
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
  assertCheckoutSessionAccessible(actor, session);

  if (session.payment_status !== 'paid') throw new Error('Stripe payment is not paid yet.');

  const metadata = session.metadata || {};
  const amount = Number(metadata.amount || Math.round((session.amount_total || 0) / 100));
  const row = {
    id: `stripe-${session.id}`,
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
  await syncPaidPurchaseSideEffects(data);
  response.json({ purchase: toClientPurchase(data) });
}));

app.get('/api/admin/finance', asyncRoute(async (request, response) => {
  requireServices();
  await requireAdmin(request);

  const [purchasesResult, payoutTransfersResult, coachesResult] = await Promise.all([
    supabase.from('parent_purchases').select('*').order('created_at', { ascending: false }),
    supabase.from('admin_coach_payout_transfers').select('*').order('created_at', { ascending: false }),
    supabase.from('coach_profiles').select('id,level,xp,qr_tricks_approved,stripe_account_id'),
  ]);

  if (purchasesResult.error) throw purchasesResult.error;
  if (payoutTransfersResult.error) throw payoutTransfersResult.error;
  if (coachesResult.error) throw coachesResult.error;

  response.json({
    purchases: (purchasesResult.data || []).filter((purchase) => !isDemoAdminRecord(purchase.id, purchase.parent_profile_id, purchase.participant_id)),
    payoutTransfers: (payoutTransfersResult.data || []).filter((transfer) => !isDemoAdminRecord(transfer.id, transfer.coach_id, transfer.coach_name)),
    coaches: (coachesResult.data || []).filter((coach) => !isDemoAdminRecord(coach.id)),
  });
}));

function isDemoAdminRecord(...values) {
  return values.some((value) => {
    if (typeof value !== 'string') return false;
    const normalized = normalizeAdminSeedText(value);
    return normalized === 'coach demo'
      || normalized === 'parent demo'
      || normalized === 'participant demo'
      || normalized === 'admin demo'
      || normalized === 'demo child 1'
      || normalized === 'demo child 2'
      || normalized.startsWith('demo ')
      || normalized.includes(' demo ')
      || normalized.includes(' test ')
      || normalized.startsWith('test ')
      || normalized.endsWith(' test')
      || normalized === 'test'
      || normalized.includes('filip trener')
      || normalized.includes('eliska novakova')
      || normalized.includes('alex svoboda')
      || normalized.includes('nela horakova');
  });
}

function isSeedInvoice(row) {
  const supplier = normalizeAdminSeedText(row?.dodavatel);
  const description = normalizeAdminSeedText(row?.popis);
  const amount = String(row?.castka || '').replace(/\s+/g, '');
  const invoiceText = `${supplier} ${description}`;

  return (supplier === 'zs nadrazni vyskov' && description.includes('pronajem telocvicny') && amount === '3200')
    || (supplier === 'orel jednota vyskov' && description.includes('pronajem haly') && amount === '8500')
    || (supplier === 'sportovni sklad praha' && description.includes('nakup matraci') && amount === '14200')
    || (supplier === 'zs prostejov' && description.includes('pronajem telocvicny') && amount === '2800')
    || (invoiceText.includes('test') && invoiceText.includes('teamvys'));
}

function normalizeAdminSeedText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

app.post('/api/admin/coaches/:coachId/stripe-onboarding', asyncRoute(async (request, response) => {
  requireServices();
  await requireAdmin(request);
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
  await requireAdmin(request);
  requireStripe();

  const coachId = requiredString(request.body.coachId, 'coachId');
  const coachName = requiredString(request.body.coachName, 'coachName');
  const periodKey = requiredString(request.body.periodKey, 'periodKey');
  const periodStart = requiredString(request.body.periodStart, 'periodStart');
  const periodEnd = requiredString(request.body.periodEnd, 'periodEnd');
  const stripeAccountId = requiredString(request.body.stripeAccountId, 'stripeAccountId');
  const requestedAmount = Math.round(Number(request.body.amount || 0));
  const calculatedAmount = await calculateTrainerPayoutAmount(coachId, periodStart, periodEnd);
  const amount = calculatedAmount > 0 ? calculatedAmount : requestedAmount;
  const availableFrom = nextMonthFirstIso(periodEnd);

  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Payout amount must be greater than 0.');
  if (todayIsoDate() < availableFrom) throw new Error(`Výplatu za ${periodKey} lze poslat nejdříve ${availableFrom}.`);

  const { data: existingTransfer, error: existingTransferError } = await supabase
    .from('admin_coach_payout_transfers')
    .select('id,status')
    .eq('coach_id', coachId)
    .eq('period_key', periodKey)
    .in('status', ['paid', 'pending'])
    .limit(1)
    .maybeSingle();

  if (existingTransferError) throw existingTransferError;
  if (existingTransfer) throw new Error('Tento trenér už má výplatu za daný měsíc odeslanou.');

  const transfer = await stripe.transfers.create({
    amount: amount * 100,
    currency: 'czk',
    destination: stripeAccountId,
    description: `TeamVYS výplata ${coachName} ${periodKey}`,
    metadata: { coach_id: coachId, coach_name: coachName, period_key: periodKey, period_start: periodStart, period_end: periodEnd, calculated_amount: String(calculatedAmount) },
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
    created_at_text: createdAtText(),
    available_from: availableFrom,
  };

  const { data, error } = await supabase
    .from('admin_coach_payout_transfers')
    .upsert(row, { onConflict: 'coach_id,period_key' })
    .select()
    .single();

  if (error) throw error;
  response.status(201).json({ transfer: data });
}));

app.get('/api/admin/invoices', asyncRoute(async (request, response) => {
  requireServices();
  await requireAdmin(request);

  const { data, error } = await supabase
    .from('invoices')
    .select('id,dodavatel,castka,mena,datum_vystaveni,datum_splatnosti,cislo_faktury,popis,file_url,zaplaceno,datum_zaplaceni,odeslal,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  response.json({ invoices: (data || []).filter((invoice) => !isSeedInvoice(invoice)) });
}));

app.post('/api/admin/invoices', asyncRoute(async (request, response) => {
  requireServices();
  await requireAdmin(request);

  const invoice = request.body.invoice || {};
  const amount = Math.round(Number(invoice.amount || 0));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Částka faktury musí být větší než 0.');

  const row = {
    dodavatel: requiredString(invoice.supplier, 'dodavatel'),
    popis: requiredString(invoice.description, 'popis'),
    castka: String(amount),
    mena: 'CZK',
    datum_vystaveni: optionalString(invoice.issuedDate),
    datum_splatnosti: optionalString(invoice.dueDate),
    zaplaceno: Boolean(invoice.paid),
    datum_zaplaceni: invoice.paid ? optionalString(invoice.paidDate) || todayIsoDate() : null,
  };

  const { data, error } = await supabase
    .from('invoices')
    .insert(row)
    .select('id,dodavatel,castka,mena,datum_vystaveni,datum_splatnosti,cislo_faktury,popis,file_url,zaplaceno,datum_zaplaceni,odeslal,created_at')
    .single();

  if (error) throw error;
  response.status(201).json({ invoice: data });
}));

app.patch('/api/admin/invoices/:id', asyncRoute(async (request, response) => {
  requireServices();
  await requireAdmin(request);

  const id = requiredString(request.params.id, 'invoice id');
  const paid = Boolean(request.body.paid);
  const { data, error } = await supabase
    .from('invoices')
    .update({ zaplaceno: paid, datum_zaplaceni: paid ? todayIsoDate() : null })
    .eq('id', id)
    .select('id,dodavatel,castka,mena,datum_vystaveni,datum_splatnosti,cislo_faktury,popis,file_url,zaplaceno,datum_zaplaceni,odeslal,created_at')
    .single();

  if (error) throw error;
  response.json({ invoice: data });
}));

app.delete('/api/admin/invoices/:id', asyncRoute(async (request, response) => {
  requireServices();
  await requireAdmin(request);

  const id = requiredString(request.params.id, 'invoice id');
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
  response.json({ ok: true });
}));

app.get('/api/admin/products', asyncRoute(async (request, response) => {
  requireServices();
  await requireAdmin(request);

  const { data, error } = await supabase
    .from('products')
    .select('id,type,title,city,place,venue,price,price_label,original_price,entries_total,primary_meta,secondary_meta,description,important_info,badge,event_date,expires_at,capacity_total,capacity_current,hero_image,gallery,coach_ids,training_focus,is_published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  response.json({ products: data || [] });
}));

app.post('/api/admin/products', asyncRoute(async (request, response) => {
  requireServices();
  await requireAdmin(request);

  const product = request.body.product;
  if (!product || typeof product.id !== 'string' || product.id.trim().length === 0) {
    throw new Error('Invalid product: id is required.');
  }

  const allowed = ['id', 'type', 'title', 'city', 'place', 'venue', 'price', 'price_label', 'original_price', 'entries_total', 'primary_meta', 'secondary_meta', 'description', 'important_info', 'badge', 'event_date', 'expires_at', 'capacity_total', 'capacity_current', 'hero_image', 'gallery', 'coach_ids', 'training_focus', 'is_published'];
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
  await requireAdmin(request);

  const id = request.params.id;
  if (!id) {
    throw new Error('Product id is required.');
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  response.json({ ok: true });
}));

app.use((error, _request, response, _next) => {
  const status = error.statusCode || 400;
  response.status(status).json({ error: error.message || 'Unexpected backend error.' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`TeamVYS API listening on http://localhost:${port}`);
  });
}

module.exports = app;