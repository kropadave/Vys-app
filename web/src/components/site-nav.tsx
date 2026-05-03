'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { TeamVysLogo } from '@/components/brand/team-vys-logo';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Kroužky', href: '/krouzky' },
  { label: 'Tábory', href: '/tabory' },
  { label: 'Workshopy', href: '/workshopy' },
  { label: 'O nás', href: '/o-nas' },
  { label: 'Kontakty', href: '/kontakty' },
  { label: 'Aplikace', href: '/aplikace' },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-brand-purple/10 bg-white/88 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between gap-3 py-2 md:py-3">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <TeamVysLogo size={34} priority />
          <span className="text-[17px] font-black text-brand-ink md:text-[18px]">
            TEAM<span className="gradient-text">VYS</span>
          </span>
        </Link>

        <button
          aria-label="Menu"
          className="flex h-10 w-10 items-center justify-center rounded-brand border border-brand-purple/15 bg-white text-brand-ink shadow-brand-soft md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-brand px-3 py-2 text-sm font-extrabold transition-colors',
                  active ? 'bg-gradient-brand text-white shadow-brand-soft' : 'text-brand-ink-soft hover:bg-brand-purple-light hover:text-brand-ink'
                )}
              >
                {item.label}
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </Link>
            );
          })}
          <Link
            href="/sign-in"
            className="ml-2 inline-flex items-center gap-2 rounded-brand bg-gradient-brand px-4 py-3 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-px"
          >
            <UserRound size={16} />
            Přihlásit se
          </Link>
        </nav>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="section-shell mb-3 space-y-1 rounded-brand border border-brand-purple/12 bg-white p-3 shadow-brand-float md:hidden"
          >
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-brand px-4 py-3.5 transition-colors',
                    active ? 'bg-brand-purple-light' : 'hover:bg-brand-paper'
                  )}
                >
                  <span className="text-base font-bold text-brand-ink">{item.label}</span>
                  <ArrowRight size={18} className="text-brand-pink" />
                </Link>
              );
            })}
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-5 py-4 text-center font-black text-white"
            >
              <UserRound size={18} />
              Přihlásit se
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
