import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CoachTrick } from '@/lib/coach-content';
import { coachTricks, coachWards } from '@/lib/coach-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

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
  | { status: 'claimed'; trickTitle: string; xp: number; participantName: string }
  | { status: 'already-claimed'; trickTitle: string; xp: number; participantName: string }
  | { status: 'expired' }
  | { status: 'not-found' }
  | { status: 'missing-ward'; participantName: string }
  | { status: 'error'; message: string };

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
};

type QrClaimRpcRow = {
  status: string;
  trick_title: string | null;
  xp: number | null;
  participant_name: string | null;
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

export async function claimQrEventForParticipant(eventId: string, participant: QrClaimParticipant): Promise<QrClaimResult> {
  const normalizedEventId = eventId.trim();
  if (!normalizedEventId) return { status: 'not-found' };

  if (hasSupabaseConfig && supabase) {
    return claimSupabaseQrEvent(normalizedEventId, participant);
  }

  return claimLocalQrEvent(normalizedEventId, participant);
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

  const wardId = await loadWardId(participant.name);
  if (!wardId) return { status: 'missing-ward', participantName: participant.name };

  const awardId = `qr-award-${wardId}-${trick.id}`;
  const { data: existingAward, error: existingError } = await supabase
    .from('coach_manual_trick_awards')
    .select('id')
    .eq('ward_id', wardId)
    .eq('trick_id', trick.id)
    .maybeSingle();

  if (existingError) return { status: 'error', message: existingError.message };
  if (existingAward) return { status: 'already-claimed', trickTitle: trick.title, xp: trick.xp, participantName: participant.name };

  const { error: insertError } = await supabase.from('coach_manual_trick_awards').insert({
    id: awardId,
    ward_id: wardId,
    participant_id: participant.id,
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
  return { status: 'claimed', trickTitle: trick.title, xp: trick.xp, participantName: participant.name };
}

function qrClaimResultFromRpc(row: QrClaimRpcRow, fallbackParticipantName: string): QrClaimResult {
  const trickTitle = row.trick_title ?? 'trik';
  const xp = Number(row.xp ?? 0);
  const participantName = row.participant_name ?? fallbackParticipantName;

  if (row.status === 'claimed') return { status: 'claimed', trickTitle, xp, participantName };
  if (row.status === 'already-claimed') return { status: 'already-claimed', trickTitle, xp, participantName };
  if (row.status === 'expired') return { status: 'expired' };
  if (row.status === 'not-found') return { status: 'not-found' };
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

  const ward = coachWards.find((item) => item.name === participant.name);
  if (!ward) return { status: 'missing-ward', participantName: participant.name };

  const award = {
    id: `qr-award-${ward.id}-${trick.id}`,
    wardId: ward.id,
    participantName: participant.name,
    trickId: trick.id,
    trickTitle: trick.title,
    coachId: event.coachId,
    awardedAt: new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };
  const awards = await loadLocalManualAwards();
  const alreadyClaimed = awards.some((item) => item.id === award.id || (item.wardId === ward.id && item.trickId === trick.id));
  if (!alreadyClaimed) await AsyncStorage.setItem(MANUAL_AWARDS_STORAGE_KEY, JSON.stringify([award, ...awards]));

  return { status: alreadyClaimed ? 'already-claimed' : 'claimed', trickTitle: trick.title, xp: trick.xp, participantName: participant.name };
}

async function loadTrick(trickId: string): Promise<{ id: string; title: string; xp: number } | null> {
  const localTrick = coachTricks.find((item) => item.id === trickId);
  if (!supabase) return localTrick ?? null;

  const { data } = await supabase
    .from('coach_tricks')
    .select('id,title,xp')
    .eq('id', trickId)
    .maybeSingle();

  if (data) return { id: data.id, title: data.title, xp: Number(data.xp || 0) };
  return localTrick ?? null;
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
