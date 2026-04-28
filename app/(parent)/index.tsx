import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ParentHome() {
  return (
    <PlaceholderScreen
      eyebrow="Rodič"
      title="Rodičovský přehled"
      description="Tady bude rychlý souhrn dětí, nadcházejících tréninků a stavu plateb."
      bullets={['Stav přihlášek', 'Dnešní tréninky dětí', 'Po splatnosti / k zaplacení']}
    />
  );
}
