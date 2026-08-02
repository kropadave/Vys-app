import { Unbounded } from 'next/font/google';

// Display font used only on the redesigned homepage. Kept in its own module
// (instead of the root layout) so the rest of the site keeps using Inter
// untouched — this stays scoped to the "/" page and its components.
export const displayFont = Unbounded({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800', '900'],
  display: 'swap',
});
