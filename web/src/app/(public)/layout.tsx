import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-brand-paper">
      <div aria-hidden className="absolute inset-0 texture-grid opacity-70 pointer-events-none" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(135deg,rgba(139,29,255,0.14),rgba(255,255,255,0)_42%),linear-gradient(210deg,rgba(255,178,26,0.18),rgba(255,255,255,0)_36%)]" />
      <SiteNav />
      <main className="relative">{children}</main>
      <SiteFooter />
    </div>
  );
}
