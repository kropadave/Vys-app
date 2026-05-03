import Link from 'next/link';

export const metadata = {
  title: 'Platba zrušena',
};

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-dvh bg-brand-paper px-6 py-12">
      <div className="mx-auto max-w-[760px] rounded-brand-lg border bg-white p-7" style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}>
        <p className="text-brand-pink text-xs font-black uppercase tracking-[0.16em]">Stripe Checkout</p>
        <h1 className="text-3xl font-black text-brand-ink mt-2">Platba byla zrušena</h1>
        <p className="text-[#5C5474] leading-7 mt-3">Objednávka se neuložila jako zaplacená. Můžeš se vrátit k výběru a spustit checkout znovu.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/rodic" className="rounded-full bg-gradient-brand px-6 py-3 text-sm font-black text-white" style={{ boxShadow: 'var(--shadow-glow-pink)' }}>
            Do rodičovského webu
          </Link>
          <Link href="/krouzky" className="rounded-full border bg-white px-6 py-3 text-sm font-black text-brand-ink" style={{ borderColor: 'rgba(20,14,38,0.08)' }}>
            Vybrat znovu
          </Link>
        </div>
      </div>
    </main>
  );
}