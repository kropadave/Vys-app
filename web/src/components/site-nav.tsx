'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky inset-x-0 top-0 z-50 border-b transition-all duration-300 backdrop-blur-[12px]',
        scrolled
          ? 'border-brand-purple/12 bg-white/[0.88] shadow-[0_12px_34px_rgba(83,36,140,0.10)]'
          : 'border-transparent bg-white/[0.68] shadow-none'
      )}
    >
      <div className="section-shell flex h-16 items-center justify-between gap-3 md:h-[72px]">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <TeamVysLogo size={34} priority />
          <span className="text-[17px] font-black text-brand-ink md:text-[18px]">
            TEAM<span className="gradient-text">VYS</span>
          </span>
        </Link>

        <button
          aria-label="Menu"
          className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-brand-purple/15 bg-white text-brand-ink shadow-brand-soft md:hidden"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 min-h-dvh overflow-y-auto bg-white text-brand-ink md:hidden"
          >
            <div className="mx-auto flex min-h-dvh w-full max-w-[680px] flex-col px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  <TeamVysLogo size={42} priority />
                  <span className="text-2xl font-black leading-none text-brand-ink">
                    TEAM<span className="gradient-text">VYS</span>
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label="Zavřít menu"
                  onClick={() => setOpen(false)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-brand-purple/[0.16] bg-white/[0.88] text-brand-ink shadow-brand-soft ring-1 ring-white/60 backdrop-blur-xl transition hover:bg-white"
                >
                  <X size={25} />
                </button>
              </div>

              <nav className="mt-10 flex flex-1 flex-col justify-center gap-3 pb-8">
                {navItems.map((item, index) => {
                  const active = pathname?.startsWith(item.href);
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.26, delay: 0.04 + index * 0.035, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'block py-3 transition-colors',
                          active ? 'text-brand-purple' : 'text-brand-ink hover:text-brand-purple'
                        )}
                      >
                        <span className="text-[clamp(1.9rem,7vw,3rem)] font-black leading-none">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-brand bg-gradient-brand px-5 py-4 text-center text-lg font-black text-white shadow-brand-float transition-transform hover:-translate-y-px"
                >
                  <UserRound size={24} />
                  Přihlásit se
                </Link>
              </nav>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
