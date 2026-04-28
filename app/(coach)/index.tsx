import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function CoachHome() {
  return (
    <PlaceholderScreen
      eyebrow="Trenér"
      title="Dnešní skupiny"
      description="Tady bude denní rozvrh, rychlé spuštění docházky a generování QR."
      bullets={['Dnešní tréninky', 'QR pro odemčení triku (60s)', 'Notifikace od rodičů']}
    />
  );
}
