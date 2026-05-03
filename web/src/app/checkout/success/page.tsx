import { Suspense } from 'react';

import { CheckoutSuccess } from '@/components/checkout/checkout-success';

export const metadata = {
  title: 'Platba potvrzena',
};

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-dvh bg-brand-paper px-6 py-12">
      <Suspense fallback={<StatusCard title="Kontroluji platbu" body="Čekám na Stripe session…" />}>
        <CheckoutSuccess />
      </Suspense>
    </main>
  );
}

function StatusCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-[760px] rounded-brand-lg border bg-white p-7" style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}>
      <h1 className="text-3xl font-black text-brand-ink">{title}</h1>
      <p className="text-[#5C5474] leading-7 mt-3">{body}</p>
    </div>
  );
}