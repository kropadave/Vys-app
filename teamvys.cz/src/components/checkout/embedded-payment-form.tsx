'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type EmbeddedPaymentFormProps = {
  clientSecret: string;
  amountLabel: string;
  submitLabel?: string;
  onPaid: (paymentIntentId: string) => Promise<void> | void;
  onError?: (message: string) => void;
};

export function EmbeddedPaymentForm({ clientSecret, amountLabel, submitLabel = 'Zaplatit kartou', onPaid, onError }: EmbeddedPaymentFormProps) {
  const options = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#8B1DFF',
        colorText: '#171220',
        borderRadius: '8px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    },
  }), [clientSecret]);

  if (!stripePromise) {
    return (
      <div className="rounded-[16px] border border-brand-pink/20 bg-brand-pink/10 p-4 text-sm font-bold leading-6 text-brand-ink">
        Chybí NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Doplň ho do webového prostředí, aby se karta mohla zadat přímo na webu.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <EmbeddedPaymentInner amountLabel={amountLabel} submitLabel={submitLabel} onPaid={onPaid} onError={onError} />
    </Elements>
  );
}

function EmbeddedPaymentInner({ amountLabel, submitLabel, onPaid, onError }: Omit<EmbeddedPaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitPayment() {
    if (!stripe || !elements) return;

    setPending(true);
    setMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (result.error) {
      const text = result.error.message || 'Platbu se nepodařilo potvrdit.';
      setMessage(text);
      onError?.(text);
      setPending(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      await onPaid(result.paymentIntent.id);
      setPending(false);
      return;
    }

    const text = 'Platba čeká na potvrzení. Zkus to prosím za chvíli znovu načíst v rodičovském portálu.';
    setMessage(text);
    onError?.(text);
    setPending(false);
  }

  return (
    <div className="space-y-4 rounded-[16px] border border-brand-purple/12 bg-white p-4 shadow-brand-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brand-purple text-white">
          <CreditCard size={18} />
        </span>
        <div>
          <p className="text-sm font-black text-brand-ink">Platba přímo na webu</p>
          <p className="mt-1 text-xs font-bold leading-5 text-brand-ink-soft">Karta je zadaná ve Stripe poli. TeamVYS neukládá číslo karty ani CVC.</p>
        </div>
      </div>

      <PaymentElement />

      <div className="flex items-start gap-2 rounded-[14px] bg-brand-lime/20 p-3 text-xs font-bold leading-5 text-brand-ink">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <span>Po úspěšné platbě backend označí objednávku v Supabase jako zaplacenou a vytvoří digitální pass.</span>
      </div>

      {message ? <p className="rounded-[14px] bg-brand-paper p-3 text-sm font-bold text-brand-ink-soft">{message}</p> : null}

      <button
        type="button"
        disabled={!stripe || !elements || pending}
        onClick={submitPayment}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-brand px-5 py-3 text-sm font-black text-white shadow-brand-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <CreditCard size={17} />
        {pending ? 'Potvrzuji platbu...' : `${submitLabel} · ${amountLabel}`}
      </button>
    </div>
  );
}