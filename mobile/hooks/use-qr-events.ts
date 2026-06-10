import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CoachTrick } from '@/lib/coach-content';
import { coachTricks, coachWards } from '@/lib/coach-content';
import { braceletStages } from '@/lib/participant-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { WORKSHOP_TRICKS_COUNT, workshopTrickIds, workshopXpForCompletedCount } from '@/lib/workshop-ticket';

const STORAGE_KEY = 'vys.qrEvents';
const MANUAL_AWARDS_STORAGE_KEY = 'vys.manualTrickAwards';
const COACH_ID = 'coach-demo';
const QR_VALIDITY_MS = 60_000;

export type StoredQrEvent = {
  id: string;
  coachId: string;
  trickId: string;
  generatedAt: string;
  validUntil: string;
  createdAtMs?: number;
  syncStatus?: 'cloud' | 'local';
  syncError?: string;
};

export type QrClaimResult =
  | { status: 'claimed'; trickTitle: string; xp: number; participantName: string; trickId?: string; tricksCompleted?: number; totalTricks?: number }
  | { status: 'already-claimed'; trickTitle: string; xp: number; participantName: string }
  | { status: 'rescan-crate'; trickTitle: string; participantName: string; trickId?: string }
  | { status: 'expired' }
  | { status: 'not-found' }
  | { status: 'not-unlocked'; participantName: string }
  | { status: 'arena-locked'; trickTitle: string; level: number; participantName: string }
  | { status: 'missing-ward'; participantName: string }
  | { status: 'error'; message: string };

export type QrPayload = {
  event?: string;
  workshop?: string;
  title?: string;
  ts?: string;
  coach?: string;
};

const QR_CLAIM_URL_KEYS = ['event', 'workshop', 'title', 'ts', 'coach'] as const;

/**
 * Parses a scanned QR string into claim params. Coach QR codes encode a full web
 * URL like `https://.../qr-claim?event=<id>` (or `?workshop=...`). Older/manual
 * codes may be a bare event id. Returns only the recognized claim params so the
 * in-app flow never has to open a web browser.
 */
export function parseQrPayload(raw: string): QrPayload {
  const value = (raw ?? '').trim();
  if (!value) return {};

  const queryIndex = value.indexOf('?');
  if (queryIndex >= 0) {
    const payload: QrPayload = {};
    for (const part of value.slice(queryIndex + 1).split('&')) {
      const eq = part.indexOf('=');
      if (eq < 0) continue;
      const key = part.slice(0, eq);
      if (!(QR_CLAIM_URL_KEYS as readonly string[]).includes(key)) continue;
      try {
        (payload as Record<string, string>)[key] = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, ' '));
      } catch {
        (payload as Record<string, string>)[key] = part.slice(eq + 1);
      }
    }
    if (payload.event || payload.workshop) return payload;
  }

  // No recognizable params — treat a bare value as an event id, ignore stray URLs.
  if (/^https?:\/\//i.test(value)) return {};
  return { event: value };
}

/** Cumulative XP needed to unlock the arena (skill-tree level) a trick belongs to. */
function requiredXpForLevel(level: number) {
  const index = Math.max(0, Math.min(braceletStages.length - 1, (Number(level) || 1) - 1));
  return braceletStages[index]?.xpRequired ?? 0;
}

type QrEventRow = {
  id: string;
  coach_id: string;
  trick_id: string;
  generated_at_text: string;
  valid_until_text: string;
  created_at?: string;
};

type QrClaimParticipant = {
  id: string;
  name: string;
  xp?: number;
};

type QrClaimRpcRow = {
  status: string;
  trick_title: string | null;
  xp: number | null;
  participant_name: string | null;
  trick_id?: string | null;
};

function rowFromEvent(event: StoredQrEvent): QrEventRow {
  return {
    id: event.id,
    coach_id: event.coachId,
    trick_id: event.trickId,
    generated_at_text: event.generatedAt,
    valid_until_text: event.validUntil,
  };
}

function parseEvents(value: string | null): StoredQrEvent[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is StoredQrEvent => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}

async function loadLocalEvents() {
  try {
    return parseEvents(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

async function saveLocalEvent(event: StoredQrEvent) {
  try {
    const current = await loadLocalEvents();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([event, ...current].slice(0, 50)));
  } catch {
    // keep QR generation usable even without local storage
  }
}

export async function addQrEvent(trick: CoachTrick, validUntil: string) {
  const coachId = await resolveCurrentCoachId();
  const event: StoredQrEvent = {
    id: `qr-${trick.id}-${Date.now()}`,
    coachId,
    trickId: trick.id,
    generatedAt: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    validUntil,
    createdAtMs: Date.now(),
  };

  if (hasSupabaseConfig && supabase) {
    const { error } = await supabase.from('qr_events').insert(rowFromEvent(event));
    if (!error) return { ...event, syncStatus: 'cloud' as const };

    const localEvent = { ...event, syncStatus: 'local' as const, syncError: error.message };
    await saveLocalEvent(localEvent);
    return localEvent;
  } else {
    const localEvent = { ...event, syncStatus: 'local' as const };
    await saveLocalEvent(localEvent);
    return localEvent;
  }
}

/** Exposes the current coach ID for use when building workshop QR URLs. */
export async function getCoachId(): Promise<string> {
  return resolveCurrentCoachId();
}

/**
 * Claims a workshop QR event — awards partial or full XP based on how many
 * of the 2 required tricks the participant has already completed.
 *
 * @param productId  Workshop product ID (from `workshopProducts`)
 * @param productTitle  Human-readable title for the workshop
 * @param ts  Timestamp string when the QR was generated (ms since epoch)
 * @param coachId  Coach who generated the QR
 * @param participant  Participant claiming the QR
 */
export async function claimWorkshopForParticipant(
  productId: string,
  productTitle: string,
  ts: string,
  coachId: string,
  participant: QrClaimParticipant,
): Promise<QrClaimResult> {
  const tsMs = Number(ts);
  if (!Number.isFinite(tsMs) || Date.now() - tsMs > QR_VALIDITY_MS) {
    return { status: 'expired' };
  }

  if (hasSupabaseConfig && supabase) {
    return claimWorkshopSupabase(productId, productTitle, coachId, participant);
  }
  return claimWorkshopLocal(productId, productTitle, coachId, participant);
}

export async function claimQrEventForParticipant(eventId: string, participant: QrClaimParticipant): Promise<QrClaimResult> {
  const normalizedEventId = eventId.trim();
  if (!normalizedEventId) return { status: 'not-found' };

  if (hasSupabaseConfig && supabase) {
    return claimSupabaseQrEvent(normalizedEventId, participant);
  }

  return claimLocalQrEvent(normalizedEventId, participant);
}

async function claimWorkshopSupabase(
  productId: string,
  productTitle: string,
  coachId: string,
  participant: QrClaimParticipant,
): Promise<QrClaimResult> {
  if (!supabase) return { status: 'error', message: 'Supabase není nakonfigurovaný.' };

  const awardId = `ws-award-${participant.id}-${productId}`;

  // Prevent double-claiming
  const { data: existing } = await supabase
    .from('workshop_xp_awards')
    .select('id,xp_awarded,tricks_completed')
    .eq('id', awardId)
    .maybeSingle();

  if (existing) {
    return {
      status: 'already-claimed',
      trickTitle: productTitle,
      xp: Number(existing.xp_awarded),
      participantName: participant.name,
    };
  }

  // Check how many of the 2 required tricks the participant has completed
  const trickIds = workshopTrickIds(productId);
  const wardId = await loadWardId(participant.name);
  let completedCount = 0;

  if (wardId) {
    const { data: awardedTricks } = await supabase
      .from('coach_manual_trick_awards')
      .select('trick_id')
      .eq('ward_id', wardId)
      .in('trick_id', trickIds);
    completedCount = awardedTricks?.length ?? 0;
  }

  if (completedCount === 0) {
    return { status: 'not-unlocked', participantName: participant.name };
  }

  const xpAwarded = workshopXpForCompletedCount(productId, completedCount);

  const { error: insertError } = await supabase.from('workshop_xp_awards').insert({
    id: awardId,
    participant_id: participant.id,
    participant_name: participant.name,
    product_id: productId,
    product_title: productTitle,
    tricks_completed: completedCount,
    xp_awarded: xpAwarded,
    coach_id: coachId || COACH_ID,
    awarded_at_text: new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return { status: 'already-claimed', trickTitle: productTitle, xp: xpAwarded, participantName: participant.name };
    }
    return { status: 'error', message: insertError.message };
  }

  return {
    status: 'claimed',
    trickTitle: productTitle,
    xp: xpAwarded,
    participantName: participant.name,
    tricksCompleted: completedCount,
    totalTricks: WORKSHOP_TRICKS_COUNT,
  };
}

async function claimWorkshopLocal(
  productId: string,
  productTitle: string,
  coachId: string,
  participant: QrClaimParticipant,
): Promise<QrClaimResult> {
  const awardId = `ws-award-${participant.id}-${productId}`;
  const awards = await loadLocalManualAwards();

  const existing = awards.find((item) => item.id === awardId);
  if (existing) {
    return {
      status: 'already-claimed',
      trickTitle: productTitle,
      xp: Number((existing as { xp?: number }).xp ?? 0),
      participantName: participant.name,
    };
  }

  const trickIds = workshopTrickIds(productId);
  const completedCount = awards.filter((a) => trickIds.includes((a as { trickId?: string }).trickId ?? '')).length;

  if (completedCount === 0) {
    return { status: 'not-unlocked', participantName: participant.name };
  }

  const xpAwarded = workshopXpForCompletedCount(productId, completedCount);
  const award = {
    id: awardId,
    wardId: participant.id,
    participantName: participant.name,
    trickId: `workshop:${productId}`,
    trickTitle: productTitle,
    coachId: coachId || COACH_ID,
    xp: xpAwarded,
    tricksCompleted: completedCount,
    awardedAt: new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };

  await AsyncStorage.setItem(MANUAL_AWARDS_STORAGE_KEY, JSON.stringify([award, ...awards]));

  return {
    status: 'claimed',
    trickTitle: productTitle,
    xp: xpAwarded,
    participantName: participant.name,
    tricksCompleted: completedCount,
    totalTricks: WORKSHOP_TRICKS_COUNT,
  };
}

async function claimSupabaseQrEvent(eventId: string, participant: QrClaimParticipant): Promise<QrClaimResult> {
  if (!supabase) return { status: 'error', message: 'Supabase není nakonfigurovaný.' };

  const rpcResult = await supabase.rpc('teamvys_claim_qr_trick', { p_event_id: eventId });
  if (!rpcResult.error) {
    const row = Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data;
    if (row) return qrClaimResultFromRpc(row as QrClaimRpcRow, participant.name);
  } else if (rpcResult.error.code !== '42883') {
    return { status: 'error', message: rpcResult.error.message };
  }

  const { data: event, error: eventError } = await supabase
    .from('qr_events')
    .select('id,coach_id,trick_id,generated_at_text,valid_until_text,created_at')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError) return { status: 'error', message: eventError.message };
  if (!event) return { status: 'not-found' };

  const createdAtMs = event.created_at ? new Date(event.created_at).getTime() : Date.now();
  if (Number.isFinite(createdAtMs) && Date.now() - createdAtMs > QR_VALIDITY_MS) return { status: 'expired' };

  const trick = await loadTrick(event.trick_id);
  if (!trick) return { status: 'error', message: 'Trik z QR kódu už neexistuje.' };

  // Arena gating — block tricks from skill-tree levels the participant hasn't unlocked.
  if (typeof participant.xp === 'number' && participant.xp < requiredXpForLevel(trick.level)) {
    return { status: 'arena-locked', trickTitle: trick.title, level: trick.level, participantName: participant.name };
  }

  // Ward is optional now — any participant can claim. XP is credited via the
  // participant_id / participant_name match in the DB trigger.
  const wardId = await loadWardId(participant.name);
  const participantId = participant.id && participant.id !== 'guest' ? participant.id : null;
  const awardId = wardId ? `qr-award-${wardId}-${trick.id}` : `qr-award-p-${participantId ?? participant.name}-${trick.id}`;

  const dedupeOr = [
    participantId ? `participant_id.eq.${participantId}` : null,
    wardId ? `ward_id.eq.${wardId}` : null,
    `id.eq.${awardId}`,
  ]
    .filter(Boolean)
    .join(',');

  const { data: existingAward, error: existingError } = await supabase
    .from('coach_manual_trick_awards')
    .select('id')
    .eq('trick_id', trick.id)
    .or(dedupeOr)
    .limit(1)
    .maybeSingle();

  if (existingError) return { status: 'error', message: existingError.message };
  if (existingAward) return { status: 'already-claimed', trickTitle: trick.title, xp: trick.xp, participantName: participant.name };

  const { error: insertError } = await supabase.from('coach_manual_trick_awards').insert({
    id: awardId,
    ward_id: wardId,
    participant_id: participantId,
    participant_name: participant.name,
    trick_id: trick.id,
    trick_title: trick.title,
    coach_id: event.coach_id || COACH_ID,
    awarded_at_text: new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  });

  if (insertError) {
    if (insertError.code === '23505') return { status: 'already-claimed', trickTitle: trick.title, xp: trick.xp, participantName: participant.name };
    return { status: 'error', message: insertError.message };
  }
  return { status: 'claimed', trickTitle: trick.title, xp: trick.xp, participantName: participant.name, trickId: trick.id };
}

function qrClaimResultFromRpc(row: QrClaimRpcRow, fallbackParticipantName: string): QrClaimResult {
  const trickTitle = row.trick_title ?? 'trik';
  const xp = Number(row.xp ?? 0);
  const participantName = row.participant_name ?? fallbackParticipantName;
  const trickId = row.trick_id ?? undefined;

  if (row.status === 'claimed') return { status: 'claimed', trickTitle, xp, participantName, trickId };
  if (row.status === 'rescan-crate') return { status: 'rescan-crate', trickTitle, participantName, trickId };
  if (row.status === 'already-claimed') return { status: 'already-claimed', trickTitle, xp, participantName };
  if (row.status === 'expired') return { status: 'expired' };
  if (row.status === 'not-found') return { status: 'not-found' };
  if (row.status === 'arena-locked') return { status: 'arena-locked', trickTitle, level: Number((row as { level?: number }).level ?? 0), participantName };
  if (row.status === 'missing-ward') return { status: 'missing-ward', participantName };
  if (row.status === 'missing-participant') return { status: 'error', message: 'K přihlášení není založený účastnický profil.' };
  if (row.status === 'not-authenticated') return { status: 'error', message: 'Nejdřív se přihlas jako účastník.' };
  return { status: 'error', message: 'QR se nepodařilo potvrdit.' };
}

async function resolveCurrentCoachId() {
  if (!supabase) return COACH_ID;

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? COACH_ID;
}

async function claimLocalQrEvent(eventId: string, participant: QrClaimParticipant): Promise<QrClaimResult> {
  const events = await loadLocalEvents();
  const event = events.find((item) => item.id === eventId);
  if (!event) return { status: 'not-found' };
  if (event.createdAtMs && Date.now() - event.createdAtMs > QR_VALIDITY_MS) return { status: 'expired' };

  const trick = coachTricks.find((item) => item.id === event.trickId);
  if (!trick) return { status: 'error', message: 'Trik z QR kódu už neexistuje.' };

  if (typeof participant.xp === 'number' && participant.xp < requiredXpForLevel(trick.level)) {
    return { status: 'arena-locked', trickTitle: trick.title, level: trick.level, participantName: participant.name };
  }

  const ward = coachWards.find((item) => item.name === participant.name);
  const wardId = ward?.id ?? null;
  const awardId = wardId ? `qr-award-${wardId}-${trick.id}` : `qr-award-p-${participant.id}-${trick.id}`;

  const award = {
    id: awardId,
    wardId: wardId ?? participant.id,
    participantName: participant.name,
    trickId: trick.id,
    trickTitle: trick.title,
    coachId: event.coachId,
    awardedAt: new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
  const awards = await loadLocalManualAwards();
  const alreadyClaimed = awards.some(
    (item) => item.id === award.id || (wardId && item.wardId === wardId && item.trickId === trick.id),
  );
  if (!alreadyClaimed) await AsyncStorage.setItem(MANUAL_AWARDS_STORAGE_KEY, JSON.stringify([award, ...awards]));

  return { status: alreadyClaimed ? 'already-claimed' : 'claimed', trickTitle: trick.title, xp: trick.xp, participantName: participant.name, trickId: trick.id };
}

async function loadTrick(trickId: string): Promise<{ id: string; title: string; xp: number; level: number } | null> {
  const localTrick = coachTricks.find((item) => item.id === trickId);
  const localResult = localTrick ? { id: localTrick.id, title: localTrick.title, xp: localTrick.xp, level: localTrick.level } : null;
  if (!supabase) return localResult;

  const { data } = await supabase
    .from('coach_tricks')
    .select('id,title,xp,level')
    .eq('id', trickId)
    .maybeSingle();

  if (data) return { id: data.id, title: data.title, xp: Number(data.xp || 0), level: Number(data.level || 1) };
  return localResult;
}

async function loadWardId(participantName: string) {
  if (supabase) {
    const { data } = await supabase
      .from('coach_wards')
      .select('id')
      .eq('name', participantName)
      .limit(1)
      .maybeSingle();

    if (data?.id) return data.id;
  }

  return coachWards.find((item) => item.name === participantName)?.id ?? null;
}

async function loadLocalManualAwards() {
  try {
    const value = await AsyncStorage.getItem(MANUAL_AWARDS_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}
