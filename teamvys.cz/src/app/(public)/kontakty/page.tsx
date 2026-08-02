import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

import { PageHero } from '@/components/page-hero';
import { contacts } from '@shared/content';

export const metadata = {
  title: 'Kontakty',
  description: 'Kontakt na TeamVYS, města, fakturační údaje a rychlá cesta pro rodiče do přihlášení.',
};

const quickLinks = [
  { href: '/krouzky', title: 'Vybrat kroužek', body: 'Pravidelné tréninky podle města.' },
  { href: '/tabory', title: 'Rezervovat tábor', body: 'Turnusy, dokumenty a platba.' },
  { href: '/workshopy', title: 'Koupit workshop', body: 'Jednorázové akce a QR ticket.' },
];

export default function ContactsPage() {
  return (
    <>
      <PageHero
        eyebrow="Kontakty"
        title="Ozvi se nám"
        body="Kroužek, tábor nebo platba? Odpovídáme co nejrychleji."
      />

      <section className="section-shell grid gap-6 py-16 md:py-20 lg:grid-cols-2">
        {/* Kontaktní údaje */}
        <div className="rounded-2xl border border-black/[0.08] bg-white p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-purple">Spojení</p>
          <div className="mt-5 grid gap-3">
            <ContactRow icon={<Phone size={18} />} label="Telefon" value={contacts.phone} href={`tel:${contacts.phone.replaceAll(' ', '')}`} />
            <ContactRow icon={<Mail size={18} />} label="E-mail" value={contacts.email} href={`mailto:${contacts.email}`} />
            <ContactRow icon={<MapPin size={18} />} label="Města" value={contacts.cities.join(', ')} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info label="IČO" value={contacts.ico} />
            <Info label="Účet" value={contacts.bank} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {contacts.social.map((item) => (
              <span key={item} className="rounded-full border border-black/[0.08] px-3 py-1.5 text-xs font-bold text-neutral-500">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Rozcestník */}
        <div className="rounded-2xl border border-black/[0.08] bg-white p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-purple">Rychlý rozcestník</p>
          <h2 className="mt-2 text-2xl font-black text-brand-ink">Co chceš vyřešit?</h2>
          <div className="mt-6 grid gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between gap-4 rounded-xl border border-black/[0.08] p-4 transition-colors hover:border-brand-purple/40"
              >
                <div>
                  <p className="font-black text-brand-ink">{link.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-neutral-500">{link.body}</p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-purple" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-4 rounded-xl border border-black/[0.08] p-4 transition-colors hover:border-brand-purple/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="mt-0.5 text-sm font-black text-brand-ink md:text-base">{value}</p>
      </div>
    </div>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.08] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-sm font-black text-brand-ink">{value}</p>
    </div>
  );
}
