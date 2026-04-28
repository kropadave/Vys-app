import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  BRACELET_LEVELS,
  MOCK_PARTICIPANT,
  TRICKS,
  type BraceletLevel,
} from '@/lib/data/mock';
import { BraceletPaletteByLevel, Gradients, Palette, Radius, Spacing } from '@/lib/theme';

export default function BraceletScreen() {
  const p = MOCK_PARTICIPANT;
  const palette = BraceletPaletteByLevel[p.currentBraceletLevel];

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Náramky</Text>
      <Text style={styles.intro}>
        Pět úrovní pokroku. S každou se otevírají nové triky a možnosti.
      </Text>

      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <Text style={styles.heroLabel}>Tvůj aktuální náramek</Text>
        <View style={styles.heroRow}>
          <View
            style={[
              styles.bigBracelet,
              { backgroundColor: palette.main, borderColor: 'rgba(255,255,255,0.6)' },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{BRACELET_LEVELS[p.currentBraceletLevel - 1].name}</Text>
            <Text style={styles.heroSub}>{p.xp} XP</Text>
          </View>
        </View>
      </Card>

      {BRACELET_LEVELS.map((b) => (
        <LevelRow key={b.id} level={b} currentXp={p.xp} currentLevel={p.currentBraceletLevel} />
      ))}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function LevelRow({
  level,
  currentXp,
  currentLevel,
}: {
  level: BraceletLevel;
  currentXp: number;
  currentLevel: number;
}) {
  const reached = currentLevel >= level.id;
  const trickCount = TRICKS.filter((t) => t.requiredBraceletLevel === level.id).length;
  const palette = BraceletPaletteByLevel[level.id];

  return (
    <Card pad={14}>
      <View style={styles.row}>
        <View style={[styles.bracelet, { backgroundColor: palette.main }]} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.headRow}>
            <Text style={styles.levelTitle}>
              {level.id}. {level.name}
            </Text>
            <Pill
              label={reached ? '✓ dosaženo' : `${level.xpRequired} XP`}
              variant={reached ? 'mint' : 'plain'}
            />
          </View>
          <Text style={styles.muted}>{level.description}</Text>
          <Text style={styles.muted}>
            {trickCount} {trickCount === 1 ? 'trik' : trickCount < 5 ? 'triky' : 'triků'}
            {reached ? '' : ` · chybí ${Math.max(0, level.xpRequired - currentXp)} XP`}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.md },
  h1: { fontSize: 28, fontWeight: '800', color: Palette.text },
  intro: { color: Palette.textMuted, marginBottom: 4 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)' },
  bigBracelet: { width: 76, height: 76, borderRadius: 38, borderWidth: 5 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bracelet: { width: 36, height: 36, borderRadius: 18 },
  levelTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: Palette.text },
  muted: { color: Palette.textMuted, fontSize: 12 },
});
