'use client';

import { CreditCard, ShieldCheck } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import { createCheckoutSession } from '@/lib/api-client';
import type { WebProduct } from '@/lib/products';

type Props = {
  product: WebProduct;
  userId: string;
  userEmail: string;
  defaultName: string;
};

export function CheckoutForm({ product, userId, userEmail, defaultName }: Props) {
  const [participantName, setParticipantName] = useState(defaultName);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const participantId = useMemo(() => `web-${userId.slice(0, 12)}`, [userId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!participantName.trim()) {
      setMessage('Doplň jméno dítěte nebo účastníka.');
      return;
    }

    setPending(true);
    try {
      const origin = window.location.origin;
      const checkout = await createCheckoutSession({
        productId: product.id,
        participantId,
        participantName: participantName.trim(),
        successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/checkout/cancel?product=${product.id}`,
      });

      if (!checkout.url) throw new Error('Stripe Checkout URL se nevytvořila.');
      window.location.assign(checkout.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Stripe checkout se nepovedl spustit.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-brand border border-black/10 bg-white p-6 shadow-brand">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-brand bg-gradient-brand text-white">
          <CreditCard size={20} />
        </span>
        <div>
          <h2 className="text-2xl font-black text-brand-ink">Platba kartou</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Otevře se Stripe Checkout v testovacím režimu. Po zaplacení backend uloží objednávku do Supabase.</p>
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase text-slate-500">Jméno dítěte / účastníka</span>
        <input
          required
          value={participantName}
          onChange={(event) => setParticipantName(event.target.value)}
          className="w-full rounded-brand border border-black/10 bg-white px-4 py-3 text-brand-ink outline-none focus:border-brand-cyan"
          placeholder="Např. Eliška Nováková"
        />
      </label>

      <div className="rounded-brand bg-brand-paper p-4">
        <p className="text-xs font-black uppercase text-slate-400">Přihlášený účet</p>
        <p className="mt-1 text-sm font-black text-brand-ink">{userEmail}</p>
      </div>

      <div className="flex items-start gap-2 rounded-brand bg-brand-lime/24 p-4 text-brand-ink">
        <ShieldCheck size={19} className="mt-0.5 shrink-0" />
        <p className="text-sm font-bold leading-6">Stripe tajný klíč zůstává jen na Express serveru. Web posílá pouze ID produktu a jméno účastníka.</p>
      </div>

      {message ? <p className="rounded-brand bg-brand-paper p-3 text-sm font-bold text-slate-600">{message}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <CreditCard size={18} />
        {pending ? 'Otevírám Stripe…' : `Zaplatit ${product.priceLabel}`}
      </button>
    </form>
  );
}