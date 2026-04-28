import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
    BoltIcon,
    CheckIcon,
    HourglassIcon,
    LockIcon,
    TargetIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
    BRACELET_LEVELS,
    MOCK_PARTICIPANT,
    TRICKS,
    type Trick,
    type TrickStatus,
} from '@/lib/data/mock';
import { BraceletPaletteByLevel, Palette, Spacing } from '@/lib/theme';

const STATUS: Record<
  TrickStatus,
  {
    label: string;
    variant: 'plain' | 'soft' | 'yellow' | 'mint' | 'pink' | 'primary';
    Icon: (props: { size?: number }) => React.ReactElement;
  }
> = {
  locked: { label: 'Zamčeno', variant: 'plain', Icon: ({ size }) => <LockIcon size={size} /> },
  available: { label: 'K tréninku', variant: 'soft', Icon: ({ size }) => <TargetIcon size={size} /> },
  in_progress: { label: 'Rozpracováno', variant: 'yellow', Icon: ({ size }) => <HourglassIcon size={size} /> },
  mastered: { label: 'Zvládnuto', variant: 'mint', Icon: ({ size }) => <CheckIcon size={size} /> },
};

export default function TricksScreen() {
  const p = MOCK_PARTICIPANT;

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Skill tree</Text>
      <Text style={styles.intro}>
        Triky se odemykají s úrovní náramku a zvládnutím předchozích triků.
      </Text>

      {BRACELET_LEVELS.map((level) => {
        const tricks = TRICKS.filter((t) => t.requiredBraceletLevel === level.id);
        if (tricks.length === 0) return null;
        const isUnlocked = p.currentBraceletLevel >= level.id;
        const palette = BraceletPaletteByLevel[level.id];

        return (
          <View key={level.id} style={{ gap: 10 }}>
            <View style={styles.levelHead}>
              <View style={[styles.dot, { backgroundColor: palette.main }]} />
              <Text style={styles.levelTitle}>{level.name} náramek</Text>
              <View style={{ flex: 1 }} />
              <Pill
                label={isUnlocked ? 'Odemčeno' : `od ${level.xpRequired} XP`}
                variant={isUnlocked ? 'mint' : 'plain'}
              />
            </View>

            {tricks.map((t) => (
              <TrickCard key={t.id} trick={t} disabled={!isUnlocked} accent={palette.main} />
            ))}
          </View>
        );
      })}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function TrickCard({ trick, disabled, accent }: { trick: Trick; disabled: boolean; accent: string }) {
  const status = STATUS[disabled ? 'locked' : trick.status];
  return (
    <Card pad={14}>
      <View style={styles.trickHead}>
        <View style={[styles.trickIcon, { backgroundColor: accent + '33' }]}>
          <status.Icon size={32} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.trickName}>{trick.name}</Text>
          <Text style={styles.muted} numberOfLines={2}>
            {trick.description}
          </Text>
        </View>
      </View>
      <View style={styles.trickFoot}>
        <Pill label={`+${trick.xp} XP`} variant="soft" icon={<BoltIcon size={14} />} />
        <Pill label={status.label} variant={status.variant} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  h1: { fontSize: 28, fontWeight: '800', color: Palette.text },
  intro: { color: Palette.textMuted, marginBottom: 4 },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  levelTitle: { fontSize: 16, fontWeight: '800', color: Palette.text },
  trickHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  trickIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  trickName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  trickFoot: { flexDirection: 'row', gap: 6, marginTop: 10 },
  muted: { color: Palette.textMuted, fontSize: 12 },
});
