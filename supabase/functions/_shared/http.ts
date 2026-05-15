export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function stripeSecretKey() {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('Chybí STRIPE_SECRET_KEY v Supabase secrets.');
  return key;
}

export async function stripeRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${stripeSecretKey()}`);

  const response = await fetch(`https://api.stripe.com/v1${path}`, { ...init, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof data?.error?.message === 'string' ? data.error.message : 'Stripe požadavek selhal.';
    throw new Error(message);
  }

  return data;
}

export function supabaseRestHeaders() {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
  if (!key) throw new Error('Chybí SUPABASE_SERVICE_ROLE_KEY nebo SUPABASE_ANON_KEY.');

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export function supabaseRestUrl(path: string) {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('Chybí SUPABASE_URL v Edge Function prostředí.');
  return `${url}/rest/v1/${path}`;
}

export function requiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`Chybí ${label}.`);
  return value.trim();
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}