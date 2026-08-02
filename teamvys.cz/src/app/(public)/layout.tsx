import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-white">
      <SiteNav />
      <main className="relative">{children}</main>
      <SiteFooter />
    </div>
  );
}
