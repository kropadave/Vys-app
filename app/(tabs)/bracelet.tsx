import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BRACELET_LEVELS,
  MOCK_PARTICIPANT,
  TRICKS,
  type BraceletLevel,
} from '@/lib/data/mock';

export default function BraceletScreen() {
  const p = MOCK_PARTICIPANT;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Náramky</ThemedText>
      <ThemedText style={styles.muted}>
        5 úrovní pokroku. S každou úrovní se otevírají nové triky a možnosti.
      </ThemedText>

      <ThemedView style={styles.summary}>
        <ThemedText type="subtitle">Tvůj aktuální náramek</ThemedText>
        <View style={styles.summaryRow}>
          <View style={[styles.bigBracelet, { backgroundColor: BRACELET_LEVELS[p.currentBraceletLevel - 1].color }]} />
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 20 }}>
              {BRACELET_LEVELS[p.currentBraceletLevel - 1].name}
            </ThemedText>
            <ThemedText style={styles.muted}>{p.xp} XP</ThemedText>
          </View>
        </View>
      </ThemedView>

      {BRACELET_LEVELS.map((b) => (
        <LevelRow key={b.id} level={b} currentXp={p.xp} currentLevel={p.currentBraceletLevel} />
      ))}
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

  return (
    <ThemedView
      style={[
        styles.row,
        { borderLeftColor: level.color, borderLeftWidth: 6, opacity: reached ? 1 : 0.7 },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: level.color }]} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.rowHead}>
          <ThemedText type="subtitle">
            {level.id}. {level.name}
          </ThemedText>
          <ThemedText style={styles.muted}>
            {reached ? '✓ dosaženo' : `${level.xpRequired} XP`}
          </ThemedText>
        </View>
        <ThemedText style={styles.muted}>{level.description}</ThemedText>
        <ThemedText style={styles.muted}>
          {trickCount} {trickCount === 1 ? 'trik' : trickCount < 5 ? 'triky' : 'triků'}
          {reached ? '' : ` · chybí ${Math.max(0, level.xpRequired - currentXp)} XP`}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 64, gap: 12 },
  muted: { opacity: 0.65 },
  summary: {
    padding: 16, borderRadius: 14, gap: 12,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bigBracelet: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 4, borderColor: 'rgba(0,0,0,0.1)',
  },
  row: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, alignItems: 'flex-start',
    backgroundColor: 'rgba(127,127,127,0.06)',
  },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 6 },
});
