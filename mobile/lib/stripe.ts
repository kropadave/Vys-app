import { hasSupabaseConfig, supabase } from '@/lib/supabase';

type FunctionErrorPayload = {
  error?: unknown;
};

export type StripeCheckoutSessionRequest = {
  productId: string;
  participantId: string;
  participantName: string;
  successUrl: string;
  cancelUrl: string;
};

export type StripeCheckoutSessionResponse = {
  id: string;
  url: string;
};

export type StripeConfirmedPurchase = {
  id: string;
  productId: string;
  participantId: string;
  participantName: string;
  type: 'Kroužek' | 'Tábor' | 'Workshop';
  title: string;
  amount: number;
  priceLabel: string;
  place: string;
  status: 'Zaplaceno';
  paidAt: string;
  eventDate?: string;
  expiresAt?: string;
};

export type StripeCoachPayoutRequest = {
  coachId: string;
  coachName: string;
  amount: number;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  stripeAccountId: string;
  currency?: 'czk';
};

export type StripeCoachPayoutTransfer = {
  id: string;
  coachId: string;
  coachName: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: 'czk';
  status: 'paid' | 'pending' | 'failed';
  mode: 'connect_transfer';
  stripeAccountId: string;
  stripeTransferId?: string;
  stripePayoutId?: string;
  createdAt: string;
  availableFrom: string;
};

async function invokeStripeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error('Stripe je napojený přes Supabase Edge Functions. Doplň EXPO_PUBLIC_SUPABASE_URL a EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.functions.invoke<T>(name, { body });

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Stripe funkce nevrátila žádnou odpověď.');

  const payload = data as FunctionErrorPayload;
  if (typeof payload.error === 'string') throw new Error(payload.error);

  return data;
}

export function createStripeCheckoutSession(input: StripeCheckoutSessionRequest) {
  return invokeStripeFunction<StripeCheckoutSessionResponse>('stripe-create-checkout', { ...input });
}

export function confirmStripeCheckoutSession(sessionId: string) {
  return invokeStripeFunction<{ purchase: StripeConfirmedPurchase }>('stripe-confirm-checkout', { sessionId });
}

export function sendStripeCoachPayout(input: StripeCoachPayoutRequest) {
  return invokeStripeFunction<{ transfer: StripeCoachPayoutTransfer }>('stripe-send-coach-payout', { ...input });
}