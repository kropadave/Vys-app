import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import type { DigitalPass } from '@/lib/digital-pass-content';
import { remainingEntries } from '@/lib/digital-pass-content';
import type { ParentProduct } from '@/lib/parent-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const STORAGE_KEY = 'vys.digitalPasses';

export type DigitalPassScanResult =
  | { status: 'updated'; pass: DigitalPass; attendanceSynced?: boolean }
  | { status: 'no-active-pass'; chipId: string; holderName: string; location: string }
  | { status: 'wrong-location'; chipId: string; holderName: string; location: string }
  | { status: 'all-passes-used'; chipId: string; holderName: string; location: string; passes: DigitalPass[] };

type DigitalPassRow = {
  id: string;
  participant_id: string;
  holder_name: string;
  title: string;
  location: string;
  nfc_chip_id: string;
  total_entries: number;
  used_entries: number;
  last_scan_at: string | null;
  last_scan_place: string | null;
};

type DigitalPassScanRpcRow = {
  status: string;
  pass_id: string | null;
  participant_id: string | null;
  holder_name: string | null;
  title: string | null;
  location: string | null;
  nfc_chip_id: string | null;
  total_entries: number | null;
  used_entries: number | null;
  last_scan_at: string | null;
  last_scan_place: string | null;
};

const fallbackDigitalPasses: DigitalPass[] = [];

let cached: DigitalPass[] | null = null;
const listeners = new Set<(passes: DigitalPass[]) => void>();

function emit(passes: DigitalPass[]) {
  cached = passes;
  for (const listener of listeners) listener(passes);
}

function normalizeChipId(chipId: string) {
  return chipId.trim().replace(/\s+/g, '').toUpperCase();
}

function parsePasses(value: string | null): DigitalPass[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is DigitalPass => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}

function mergeById(primary: DigitalPass[], fallback: DigitalPass[]) {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...fallback.filter((item) => !seen.has(item.id))];
}

function digitalPassFromRow(row: DigitalPassRow): DigitalPass {
  return {
    id: row.id,
    participantId: row.participant_id,
    holderName: row.holder_name,
    title: row.title,
    location: row.location,
    nfcChipId: normalizeChipId(row.nfc_chip_id),
    totalEntries: row.total_entries,
    usedEntries: row.used_entries,
    lastScanAt: row.last_scan_at ?? 'Zatím nenačteno',
    lastScanPlace: row.last_scan_place ?? row.location,
  };
}

function digitalPassToRow(pass: DigitalPass): DigitalPassRow {
  return {
    id: pass.id,
    participant_id: pass.participantId,
    holder_name: pass.holderName,
    title: pass.title,
    location: pass.location,
    nfc_chip_id: normalizeChipId(pass.nfcChipId),
    total_entries: pass.totalEntries,
    used_entries: pass.usedEntries,
    last_scan_at: pass.lastScanAt,
    last_scan_place: pass.lastScanPlace,
  };
}

async function loadLocalDigitalPasses() {
  try {
    return parsePasses(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

async function saveLocalDigitalPasses(passes: DigitalPass[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(passes));
  } catch {
    // keep the prototype resilient if local storage is unavailable
  }
}

async function saveDigitalPasses(nextPasses: DigitalPass[], changedPass: DigitalPass) {
  if (hasSupabaseConfig && supabase) {
    const { error } = await supabase.from('digital_passes').upsert(digitalPassToRow(changedPass));
    if (error) await saveLocalDigitalPasses(nextPasses);
  } else {
    await saveLocalDigitalPasses(nextPasses);
  }

  emit(nextPasses);
}

export async function loadDigitalPasses() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('digital_passes')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      const passes = mergeById((data as DigitalPassRow[]).map(digitalPassFromRow), fallbackDigitalPasses);
      cached = passes;
      return passes;
    }
  }

  const localPasses = await loadLocalDigitalPasses();
  const passes = mergeById(localPasses, fallbackDigitalPasses);
  cached = passes;
  return passes;
}

export function passesForParticipant(passes: DigitalPass[], participantId: string) {
  return sortDigitalPasses(passes.filter((pass) => pass.participantId === participantId));
}

export function sortDigitalPasses(passes: DigitalPass[]) {
  return passes.slice().sort((a, b) => b.usedEntries - a.usedEntries || a.totalEntries - b.totalEntries || a.title.localeCompare(b.title, 'cs-CZ'));
}

export function selectDigitalPassForScan(passes: DigitalPass[], { holderName, location, chipId }: { holderName: string; location: string; chipId?: string }) {
  const normalizedChipId = chipId ? normalizeChipId(chipId) : null;
  if (normalizedChipId) {
    const chipPass = sortDigitalPasses(
      passes.filter((pass) => normalizeChipId(pass.nfcChipId) === normalizedChipId && pass.location === location && remainingEntries(pass) > 0),
    )[0];
    if (chipPass) return chipPass;
  }

  return sortDigitalPasses(
    passes.filter((pass) => pass.holderName === holderName && pass.location === location && remainingEntries(pass) > 0),
  )[0] ?? null;
}

function digitalPassFromScanRpc(row: DigitalPassScanRpcRow): DigitalPass | null {
  if (row.status !== 'updated' || !row.pass_id || !row.participant_id || !row.holder_name || !row.title || !row.location || !row.nfc_chip_id) return null;

  return {
    id: row.pass_id,
    participantId: row.participant_id,
    holderName: row.holder_name,
    title: row.title,
    location: row.location,
    nfcChipId: normalizeChipId(row.nfc_chip_id),
    totalEntries: Number(row.total_entries || 0),
    usedEntries: Number(row.used_entries || 0),
    lastScanAt: row.last_scan_at ?? 'Zatím nenačteno',
    lastScanPlace: row.last_scan_place ?? row.location,
  };
}

export async function recordDigitalPassScan({ chipId, holderName, location, sessionId }: { chipId: string; holderName: string; location: string; sessionId?: string }): Promise<DigitalPassScanResult> {
  const normalizedChipId = normalizeChipId(chipId);

  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase.rpc('teamvys_scan_digital_pass', {
      p_chip_id: normalizedChipId,
      p_location: location,
      p_holder_name: holderName,
      p_session_id: sessionId ?? null,
      p_method: 'NFC',
    });

    const row = Array.isArray(data) ? data[0] as DigitalPassScanRpcRow | undefined : data as DigitalPassScanRpcRow | undefined;
    if (!error && row) {
      const rpcPass = digitalPassFromScanRpc(row);
      if (rpcPass) {
        const currentPasses = cached ?? await loadDigitalPasses();
        const nextPasses = [rpcPass, ...currentPasses.filter((pass) => pass.id !== rpcPass.id)];
        emit(nextPasses);
        return { status: 'updated', pass: rpcPass, attendanceSynced: true };
      }

      const currentPasses = cached ?? await loadDigitalPasses();
      const matchingPasses = currentPasses.filter((pass) => normalizeChipId(pass.nfcChipId) === normalizedChipId || (pass.holderName === holderName && pass.location === location));
      if (row.status === 'all-passes-used') return { status: 'all-passes-used', chipId: normalizedChipId, holderName, location, passes: matchingPasses };
      if (row.status === 'wrong-location') return { status: 'wrong-location', chipId: normalizedChipId, holderName, location };
      return { status: 'no-active-pass', chipId: normalizedChipId, holderName, location };
    }
  }

  const passes = cached ?? await loadDigitalPasses();
  const matchingPasses = passes.filter((pass) => normalizeChipId(pass.nfcChipId) === normalizedChipId || (pass.holderName === holderName && pass.location === location));
  const selectedPass = selectDigitalPassForScan(passes, { holderName, location, chipId: normalizedChipId });

  if (!selectedPass) {
    if (matchingPasses.length > 0) return { status: 'all-passes-used', chipId: normalizedChipId, holderName, location, passes: matchingPasses };
    return { status: 'no-active-pass', chipId: normalizedChipId, holderName, location };
  }

  const updatedPass: DigitalPass = {
    ...selectedPass,
    nfcChipId: normalizedChipId,
    usedEntries: Math.min(selectedPass.usedEntries + 1, selectedPass.totalEntries),
    lastScanAt: new Date().toLocaleString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    lastScanPlace: location,
  };
  const nextPasses = [updatedPass, ...passes.filter((pass) => pass.id !== updatedPass.id)];
  await saveDigitalPasses(nextPasses, updatedPass);

  return { status: 'updated', pass: updatedPass };
}

export async function createDigitalPassForPurchase(product: ParentProduct, participant: { id: string; firstName: string; lastName: string }) {
  if (product.type !== 'Kroužek' || !product.entriesTotal) return null;

  const currentPasses = cached ?? await loadDigitalPasses();
  const holderName = `${participant.firstName} ${participant.lastName}`;
  const existingPass = currentPasses.find((pass) => pass.participantId === participant.id && pass.location === product.place);
  const chipId = existingPass?.nfcChipId ?? `NFC-${participant.id.replace(/[^a-z0-9]/gi, '').toUpperCase()}-${String(Date.now()).slice(-4)}`;
  const pass: DigitalPass = {
    id: `pass-${participant.id}-${product.id}-${Date.now()}`,
    participantId: participant.id,
    holderName,
    title: `Permanentka ${product.entriesTotal} vstupů`,
    location: product.place,
    nfcChipId: normalizeChipId(chipId),
    totalEntries: product.entriesTotal,
    usedEntries: 0,
    lastScanAt: 'Zatím nenačteno',
    lastScanPlace: product.place,
  };
  const nextPasses = [pass, ...currentPasses];
  await saveDigitalPasses(nextPasses, pass);

  return pass;
}

export function useDigitalPasses() {
  const [digitalPasses, setDigitalPasses] = useState<DigitalPass[]>(cached ?? fallbackDigitalPasses);
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadDigitalPasses().then((passes) => {
        if (!mounted) return;
        setDigitalPasses(passes);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (passes: DigitalPass[]) => setDigitalPasses(passes);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { digitalPasses, ready };
}