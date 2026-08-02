'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { confirmCheckoutSession } from '@/lib/api-client';

type State =
  | { status: 'loading'; message: string }
  | { status: 'error'; message: string }
  | { status: 'success'; title: string; participantName: string; priceLabel: string };

export function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [state, setState] = useState<State>({ status: 'loading', message: 'Potvrzuji platbu u backendu…' });

  useEffect(() => {
    let active = true;

    async function confirm() {
      if (!sessionId) {
        setState({ status: 'error', message: 'Chybí Stripe session_id.' });
        return;
      }

      try {
        const result = await confirmCheckoutSession(sessionId);
        if (!active) return;
        setState({
          status: 'success',
          title: result.purchase.title,
          participantName: result.purchase.participantName,
          priceLabel: result.purchase.priceLabel,
        });
      } catch (error) {
        if (!active) return;
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Platbu se nepovedlo potvrdit.' });
      }
    }

    confirm();
    return () => {
      active = false;
    };
  }, [sessionId]);

  if (state.status === 'loading') {
    return <Status title="Kontroluji platbu" body={state.message} tone="neutral" />;
  }

  if (state.status === 'error') {
    return <Status title="Platbu je potřeba zkontrolovat" body={state.message} tone="error" />;
  }

  return (
    <div className="mx-auto max-w-[760px] rounded-brand-lg border bg-white p-7 text-center" style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}>
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-lime text-brand-ink text-2xl font-black">✓</span>
      <h1 className="text-3xl font-black text-brand-ink mt-5">Platba je potvrzená</h1>
      <p className="text-[#5C5474] leading-7 mt-3">
        {state.title} pro {state.participantName} je uložené v Supabase jako {state.priceLabel}.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/rodic" className="rounded-full bg-gradient-brand px-6 py-3 text-sm font-black text-white" style={{ boxShadow: 'var(--shadow-glow-pink)' }}>
          Do rodičovského webu
        </Link>
        <Link href="/" className="rounded-full border bg-white px-6 py-3 text-sm font-black text-brand-ink" style={{ borderColor: 'rgba(20,14,38,0.08)' }}>
          Na homepage
        </Link>
      </div>
    </div>
  );
}

function Status({ title, body, tone }: { title: string; body: string; tone: 'neutral' | 'error' }) {
  return (
    <div className="mx-auto max-w-[760px] rounded-brand-lg border bg-white p-7" style={{ borderColor: tone === 'error' ? 'rgba(239,59,154,0.25)' : 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}>
      <p className="text-brand-pink text-xs font-black uppercase tracking-[0.16em]">Stripe Checkout</p>
      <h1 className="text-3xl font-black text-brand-ink mt-2">{title}</h1>
      <p className="text-[#5C5474] leading-7 mt-3">{body}</p>
      <Link href="/rodic" className="mt-6 inline-flex rounded-full bg-gradient-brand px-6 py-3 text-sm font-black text-white">
        Zpět do rodičovského webu
      </Link>
    </div>
  );
}