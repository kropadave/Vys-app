import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { createDigitalPassForPurchase, loadDigitalPasses } from '@/hooks/use-digital-passes';
import { parentProducts, type ParentProduct } from '@/lib/parent-content';
import { capacityForProduct } from '@/lib/product-capacity';
import { confirmStripeCheckoutSession, type StripeConfirmedPurchase } from '@/lib/stripe';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const WORKSHOP_PRODUCT_ID = 'workshop-praha-balkan';

export type StoredParentPurchase = {
  id: string;
  productId: string;
  participantId: string;
  participantName: string;
  type: ParentProduct['type'];
  title: string;
  amount: number;
  priceLabel: string;
  place: string;
  status: 'Zaplaceno';
  paidAt: string;
  eventDate?: string;
  expiresAt?: string;
};

const STORAGE_KEY = 'vys.parentPurchases';

type ParentPurchaseRow = {
  id: string;
  product_id: string;
  participant_id: string;
  participant_name: string;
  type: ParentProduct['type'];
  title: string;
  amount: number;
  price_label: string;
  place: string;
  status: 'Zaplaceno';
  paid_at: string;
  event_date: string | null;
  expires_at: string | null;
};

let cached: StoredParentPurchase[] | null = null;
const listeners = new Set<(purchases: StoredParentPurchase[]) => void>();

function emit(purchases: StoredParentPurchase[]) {
  cached = purchases;
  for (const listener of listeners) listener(purchases);
}

function parsePurchases(value: string | null): StoredParentPurchase[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is StoredParentPurchase => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}

function purchaseFromRow(row: ParentPurchaseRow): StoredParentPurchase {
  return normalizeStoredPurchase({
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
    eventDate: row.event_date ?? undefined,
    expiresAt: row.expires_at ?? undefined,
  });
}

function rowFromPurchase(purchase: StoredParentPurchase): ParentPurchaseRow {
  return {
    id: purchase.id,
    product_id: purchase.productId,
    participant_id: purchase.participantId,
    participant_name: purchase.participantName,
    type: purchase.type,
    title: purchase.title,
    amount: purchase.amount,
    price_label: purchase.priceLabel,
    place: purchase.place,
    status: purchase.status,
    paid_at: purchase.paidAt,
    event_date: purchase.eventDate ?? null,
    expires_at: purchase.expiresAt ?? null,
  };
}

function purchaseFromStripe(purchase: StripeConfirmedPurchase): StoredParentPurchase {
  return normalizeStoredPurchase({
    id: purchase.id,
    productId: purchase.productId,
    participantId: purchase.participantId,
    participantName: purchase.participantName,
    type: purchase.type,
    title: purchase.title,
    amount: purchase.amount,
    priceLabel: purchase.priceLabel,
    place: purchase.place,
    status: purchase.status,
    paidAt: purchase.paidAt,
    eventDate: purchase.eventDate,
    expiresAt: purchase.expiresAt,
  });
}

async function loadLocalPurchases() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return parsePurchases(value).map(normalizeStoredPurchase);
  } catch {
    return [];
  }
}

function normalizeStoredPurchase(purchase: StoredParentPurchase): StoredParentPurchase {
  if (purchase.type !== 'Workshop') return purchase;

  const workshopProduct = parentProducts.find((product) => product.id === WORKSHOP_PRODUCT_ID);
  if (!workshopProduct) return purchase;

  return {
    ...purchase,
    productId: workshopProduct.id,
    title: workshopProduct.title,
    amount: workshopProduct.price,
    priceLabel: workshopProduct.priceLabel,
    place: workshopProduct.place,
    eventDate: workshopProduct.eventDate,
    expiresAt: workshopProduct.expiresAt,
  };
}

async function saveLocalPurchases(purchases: StoredParentPurchase[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  } catch {
    // ignore storage failures in the prototype
  }
}

export async function loadParentPurchases() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('parent_purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const purchases = (data as ParentPurchaseRow[]).map(purchaseFromRow);
      cached = purchases;
      return purchases;
    }
  }

  try {
    const purchases = await loadLocalPurchases();
    cached = purchases;
    return purchases;
  } catch {
    return [];
  }
}

export async function addParentPurchase(product: ParentProduct, participant: { id: string; firstName: string; lastName: string }) {
  const current = cached ?? await loadParentPurchases();
  const digitalPasses = await loadDigitalPasses();
  const capacity = capacityForProduct(product, current, digitalPasses);

  if (capacity.full) {
    throw new Error(`Kapacita je plná (${capacity.used}/${capacity.total}).`);
  }

  const purchase: StoredParentPurchase = {
    id: `mock-pay-${Date.now()}`,
    productId: product.id,
    participantId: participant.id,
    participantName: `${participant.firstName} ${participant.lastName}`,
    type: product.type,
    title: product.title,
    amount: product.price,
    priceLabel: product.priceLabel,
    place: product.place,
    status: 'Zaplaceno',
    paidAt: new Date().toLocaleDateString('cs-CZ'),
    eventDate: product.eventDate,
    expiresAt: product.expiresAt,
  };
  const next = [purchase, ...current];

  if (hasSupabaseConfig && supabase) {
    const { error } = await supabase.from('parent_purchases').insert(rowFromPurchase(purchase));

    if (error) await saveLocalPurchases(next);
  } else {
    await saveLocalPurchases(next);
  }

  emit(next);
  await createDigitalPassForPurchase(product, participant);
  return purchase;
}

export async function confirmStripeParentPurchase(sessionId: string) {
  const { purchase: confirmedPurchase } = await confirmStripeCheckoutSession(sessionId);
  const purchase = purchaseFromStripe(confirmedPurchase);
  const current = cached ?? [];
  const alreadyStored = current.some((item) => item.id === purchase.id);
  const next = [purchase, ...current.filter((item) => item.id !== purchase.id)];

  await saveLocalPurchases(next);
  emit(next);

  await loadDigitalPasses();

  return purchase;
}

export async function removeParentPurchase(purchaseId: string) {
  const current = cached ?? await loadParentPurchases();
  const next = current.filter((purchase) => purchase.id !== purchaseId);

  if (hasSupabaseConfig && supabase) {
    const { error } = await supabase.from('parent_purchases').delete().eq('id', purchaseId);

    if (error) await saveLocalPurchases(next);
  } else {
    await saveLocalPurchases(next);
  }

  emit(next);
}

export function useParentPurchases() {
  const [purchases, setPurchases] = useState<StoredParentPurchase[]>(cached ?? []);
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadParentPurchases().then((loadedPurchases) => {
        if (!mounted) return;
        setPurchases(loadedPurchases);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (nextPurchases: StoredParentPurchase[]) => setPurchases(nextPurchases);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { purchases, ready, addParentPurchase, removeParentPurchase, confirmStripeParentPurchase };
}

export function purchasesForParticipant(purchases: StoredParentPurchase[], participantId: string) {
  return purchases.filter((purchase) => purchase.participantId === participantId);
}