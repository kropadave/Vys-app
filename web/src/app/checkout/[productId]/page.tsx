import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CheckoutForm } from '@/components/checkout/checkout-form';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { findWebProduct } from '@/lib/products';
import { createServerSupabaseClient, hasSupabaseServerConfig } from '@/lib/supabase/server';

type Props = { params: Promise<{ productId: string }> };

export async function generateMetadata({ params }: Props) {
  const { productId } = await params;
  const product = findWebProduct(productId);
  if (!product) return { title: 'Checkout' };
  return { title: `Platba · ${product.title}` };
}

export default async function CheckoutPage({ params }: Props) {
  const { productId } = await params;
  const product = findWebProduct(productId);
  if (!product) notFound();

  let checkoutUser = {
    id: 'dev-parent',
    email: 'test@teamvys.cz',
    name: 'Eliška Nováková',
  };

  if (!DEV_BYPASS_AUTH) {
    if (!hasSupabaseServerConfig()) return <ConfigMissing />;

    const supabase = await createServerSupabaseClient();
    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;
    if (!user) redirect(`/sign-in?next=/checkout/${product.id}`);

    const { data: profile } = await supabase.from('app_profiles').select('role,name,email').eq('id', user.id).maybeSingle();
    checkoutUser = {
      id: user.id,
      email: user.email || profile?.email || '',
      name: profile?.name || '',
    };
  }

  return (
    <main className="min-h-dvh bg-brand-paper px-6 py-8 texture-grid">
      <div className="mx-auto max-w-[980px] space-y-6">
        <Link href={product.type === 'Kroužek' ? '/krouzky' : product.type === 'Tábor' ? '/tabory' : '/workshopy'} className="inline-flex items-center gap-2 text-sm font-black text-brand-ink-soft hover:text-brand-purple">
          <ArrowLeft size={17} />
          Zpět na nabídku
        </Link>
        <div className="grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-brand border border-brand-purple/12 bg-white p-6 text-brand-ink shadow-brand">
            <span className="inline-block rounded-brand bg-brand-purple-light px-3 py-2 text-xs font-black uppercase text-brand-purple-deep">
              {product.type}
            </span>
            <div className="mt-5">
              <h1 className="text-2xl font-black text-brand-ink md:text-3xl">{product.title}</h1>
              <p className="mt-2 text-sm leading-6 text-brand-ink-soft">{product.description}</p>
            </div>
            <div className="mt-5 grid gap-3">
              <Info icon={<MapPin size={17} />} label="Místo" value={product.place} />
              <Info icon={<CalendarDays size={17} />} label="Termín" value={product.meta} />
            </div>
            <div className="mt-5 rounded-brand bg-white p-5 text-brand-ink">
              <p className="text-xs font-black uppercase text-slate-400">Cena</p>
              <p className="mt-1 text-3xl font-black">{product.priceLabel}</p>
            </div>
            {DEV_BYPASS_AUTH ? <p className="mt-4 text-xs font-bold text-brand-ink-soft">Testovací checkout bez Supabase přihlášení.</p> : null}
          </aside>

          <CheckoutForm product={product} userId={checkoutUser.id} userEmail={checkoutUser.email} defaultName={checkoutUser.name} />
        </div>
      </div>
    </main>
  );
}

function ConfigMissing() {
  return (
    <main className="min-h-dvh bg-brand-paper px-6 py-12 texture-grid">
      <div className="mx-auto max-w-[760px] rounded-brand border border-black/10 bg-white p-7 shadow-brand">
        <p className="text-xs font-black uppercase text-brand-pink">Chybí Supabase env</p>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">Checkout čeká na Supabase Auth</h1>
        <p className="mt-3 leading-7 text-slate-600">Doplň NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY ve web/.env.local.</p>
      </div>
    </main>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-brand bg-brand-paper p-4">
      <span className="mt-0.5 text-brand-cyan">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-black text-brand-ink">{value}</p>
      </div>
    </div>
  );
}