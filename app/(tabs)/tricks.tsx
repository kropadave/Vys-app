import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ParticipantTricks() {
  return (
    <PlaceholderScreen
      eyebrow="Účastník · Triky"
      title="Skill tree"
      description="Tady bude strom triků s odemykáním přes trenérovo QR."
      bullets={['Větvení podle stylů', 'Stav: locked / in progress / done', 'Návrh dalšího kroku']}
    />
  );
}
