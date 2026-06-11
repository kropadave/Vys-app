import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';
import { PageHero } from '@/components/page-hero';
import { contacts } from '@shared/content';

export const metadata = {
  title: 'Kontakty',
  description: 'Kontakt na TeamVYS, města, fakturační údaje a rychlá cesta pro rodiče do přihlášení.',
};

export default function ContactsPage() {
  return (
    <>
      <PageHero
        eyebrow="Kontakty"
        title="Ozvi se nám"
        body="Kroužek, tábor nebo platba? Odpovídáme co nejrychleji."
        word="kontakt"
      />
      <section className="section-shell grid gap-5 py-14 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <div className="group relative overflow-hidden rounded-[28px] bg-white p-6 shadow-brand-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-brand-float md:p-7">
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] border border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,rgba(139,29,255,0.30),rgba(241,43,179,0.18))_border-box]" />
            <div className="relative">
              <ContactRow icon={<Phone size={20} />} label="Telefon" value={contacts.phone} href={`tel:${contacts.phone.replaceAll(' ', '')}`} />
              <ContactRow icon={<Mail size={20} />} label="E-mail" value={contacts.email} href={`mailto:${contacts.email}`} />
              <ContactRow icon={<MapPin size={20} />} label="Města" value={contacts.cities.join(', ')} />
              <div className="grid gap-3 pt-4 sm:grid-cols-2">
                <Info label="IČO" value={contacts.ico} />
                <Info label="Účet" value={contacts.bank} />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="group relative h-full overflow-hidden rounded-[28px] bg-white p-6 text-brand-ink shadow-brand-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-brand-float md:p-7">
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] border border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,rgba(241,43,179,0.30),rgba(139,29,255,0.18))_border-box]" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-widest text-brand-pink">Rychlý rozcestník</p>
              <h2 className="mt-2 text-2xl font-black md:text-3xl">Co chceš vyřešit?</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <QuickLink href="/krouzky" title="Vybrat kroužek" body="Pravidelné tréninky podle města." />
                <QuickLink href="/tabory" title="Rezervovat tábor" body="Turnusy, dokumenty a platba." />
                <QuickLink href="/workshopy" title="Koupit workshop" body="Jednorázové akce a QR ticket." />
                <QuickLink href="/sign-in" title="Přihlášení" body="Rodičovský a admin web." />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {contacts.social.map((item) => (
                  <span key={item} className="rounded-full bg-brand-purple-light px-3 py-1.5 text-xs font-black text-brand-purple-deep">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="mb-3 flex items-center gap-4 rounded-[20px] bg-brand-paper p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-gradient-brand text-white">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-black text-brand-ink md:text-base">{value}</p>
      </div>
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      {content}
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-brand-purple/12 bg-brand-paper p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-brand-ink">{value}</p>
    </div>
  );
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="group/q rounded-[20px] border border-brand-purple/12 bg-brand-paper p-4 transition-colors hover:bg-brand-purple-light">
      <h3 className="flex items-center justify-between gap-3 font-black text-brand-ink">
        {title}
        <ArrowRight size={16} className="transition-transform group-hover/q:translate-x-1" />
      </h3>
      <p className="mt-1 text-sm leading-6 text-brand-ink-soft">{body}</p>
    </Link>
  );
}