import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BRACELET_LEVELS,
  MOCK_PARTICIPANT,
  TRICKS,
  type Trick,
  type TrickStatus,
} from '@/lib/data/mock';

const STATUS_LABEL: Record<TrickStatus, string> = {
  locked: '🔒 Zamčeno',
  available: '🎯 K tréninku',
  in_progress: '⏳ Rozpracováno',
  mastered: '✅ Zvládnuto',
};

const STATUS_COLOR: Record<TrickStatus, string> = {
  locked: '#9CA3AF',
  available: '#2563EB',
  in_progress: '#F59E0B',
  mastered: '#16A34A',
};

export default function TricksScreen() {
  const p = MOCK_PARTICIPANT;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Skill tree triků</ThemedText>
      <ThemedText style={styles.muted}>
        Triky se odemykají podle úrovně náramku a zvládnutí předchozích triků.
      </ThemedText>

      {BRACELET_LEVELS.map((level) => {
        const tricks = TRICKS.filter((t) => t.requiredBraceletLevel === level.id);
        if (tricks.length === 0) return null;
        const isUnlocked = p.currentBraceletLevel >= level.id;

        return (
          <ThemedView
            key={level.id}
            style={[
              styles.section,
              { borderLeftColor: level.color, borderLeftWidth: 6, opacity: isUnlocked ? 1 : 0.55 },
            ]}
          >
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">
                {level.name} náramek
              </ThemedText>
              <ThemedText style={styles.muted}>
                {isUnlocked ? 'Odemčeno' : `Od ${level.xpRequired} XP`}
              </ThemedText>
            </View>

            {tricks.map((t) => (
              <TrickCard key={t.id} trick={t} disabled={!isUnlocked} />
            ))}
          </ThemedView>
        );
      })}
    </ScrollView>
  );
}

function TrickCard({ trick, disabled }: { trick: Trick; disabled: boolean }) {
  return (
    <View style={styles.trickCard}>
      <View style={styles.trickHeader}>
        <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
          {trick.name}
        </ThemedText>
        <ThemedText style={[styles.badge, { backgroundColor: STATUS_COLOR[trick.status] + '22', color: STATUS_COLOR[trick.status] }]}>
          {STATUS_LABEL[disabled ? 'locked' : trick.status]}
        </ThemedText>
      </View>
      <ThemedText style={styles.muted}>{trick.description}</ThemedText>
      <View style={styles.trickMeta}>
        <ThemedText style={styles.muted}>+{trick.xp} XP</ThemedText>
        {trick.prerequisites.length > 0 && (
          <ThemedText style={styles.muted}>
            Vyžaduje: {trick.prerequisites.join(', ')}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 64, gap: 16 },
  muted: { opacity: 0.65 },
  section: {
    padding: 14, borderRadius: 14, gap: 10,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  trickCard: {
    padding: 12, borderRadius: 10, gap: 6,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  trickHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    fontSize: 12, fontWeight: '600',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    overflow: 'hidden',
  },
  trickMeta: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
});
