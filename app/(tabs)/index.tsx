import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ParticipantHome() {
  return (
    <PlaceholderScreen
      eyebrow="Účastník"
      title="Tvoje cesta parkourem"
      description="Tady vznikne dashboard se skill tree, XP, náramkem a dalšími odznaky."
      bullets={[
        'Tvůj kroužek a další tréninky',
        'Co odemknout dál ve skill tree',
        'Aktuální XP a level',
      ]}
    />
  );
}
