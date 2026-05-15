import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-brand-paper">
      <div aria-hidden className="absolute inset-0 texture-grid opacity-[0.35] pointer-events-none" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[linear-gradient(135deg,rgba(139,29,255,0.10),rgba(255,255,255,0)_44%),linear-gradient(210deg,rgba(241,43,179,0.08),rgba(255,255,255,0)_38%)]" />
      <SiteNav />
      <main className="relative">{children}</main>
      <SiteFooter />
    </div>
  );
}
