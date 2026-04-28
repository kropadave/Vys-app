import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  ACHIEVEMENTS,
  MOCK_PARTICIPANT,
  NOTIFICATIONS,
  TRICKS,
  currentBracelet,
  masteredTricksCount,
  nextBracelet,
  unlockedAchievementsCount,
  unreadNotificationsCount,
} from '@/lib/data/mock';

export default function HomeScreen() {
  const p = MOCK_PARTICIPANT;
  const bracelet = currentBracelet(p.currentBraceletLevel);
  const next = nextBracelet(p.currentBraceletLevel);
  const xpToNext = next ? next.xpRequired - p.xp : 0;
  const progress = next
    ? Math.max(0, Math.min(1, (p.xp - bracelet.xpRequired) / (next.xpRequired - bracelet.xpRequired)))
    : 1;

  const inProgress = TRICKS.filter((t) => t.status === 'in_progress');
  const available = TRICKS.filter((t) => t.status === 'available');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hlavička s avatarem */}
      <ThemedView style={styles.header}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarEmoji}>{p.avatarEmoji}</ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="title">Ahoj, {p.nickname}!</ThemedText>
          <ThemedText style={styles.muted}>{p.group}</ThemedText>
        </View>
        <Link href="/notifications" style={styles.bell}>
          <ThemedText style={{ fontSize: 22 }}>
            🔔{unreadNotificationsCount() > 0 ? ` ${unreadNotificationsCount()}` : ''}
          </ThemedText>
        </Link>
      </ThemedView>

      {/* Náramek + XP */}
      <ThemedView style={[styles.card, { borderLeftColor: bracelet.color, borderLeftWidth: 6 }]}>
        <ThemedText type="subtitle">Náramek: {bracelet.name}</ThemedText>
        <ThemedText style={styles.muted}>{bracelet.description}</ThemedText>

        <View style={styles.xpRow}>
          <ThemedText type="defaultSemiBold">{p.xp} XP</ThemedText>
          {next ? (
            <ThemedText style={styles.muted}>
              {xpToNext} XP do {next.name.toLowerCase()}
            </ThemedText>
          ) : (
            <ThemedText style={styles.muted}>Maximální úroveň</ThemedText>
          )}
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: bracelet.color }]} />
        </View>
      </ThemedView>

      {/* Rychlé statistiky */}
      <View style={styles.statsRow}>
        <Stat label="Zvládnuté triky" value={`${masteredTricksCount()}/${TRICKS.length}`} />
        <Stat label="Odznaky" value={`${unlockedAchievementsCount()}/${ACHIEVEMENTS.length}`} />
        <Stat label="Notifikace" value={`${unreadNotificationsCount()}`} />
      </View>

      {/* Triky rozpracované */}
      {inProgress.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Rozpracované triky</ThemedText>
          {inProgress.map((t) => (
            <View key={t.id} style={styles.row}>
              <ThemedText>⏳ {t.name}</ThemedText>
              <ThemedText style={styles.muted}>+{t.xp} XP</ThemedText>
            </View>
          ))}
        </ThemedView>
      )}

      {/* Co odemknout dál */}
      {available.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">K dispozici k tréninku</ThemedText>
          {available.slice(0, 3).map((t) => (
            <View key={t.id} style={styles.row}>
              <ThemedText>🎯 {t.name}</ThemedText>
              <ThemedText style={styles.muted}>+{t.xp} XP</ThemedText>
            </View>
          ))}
          <Link href="/(tabs)/tricks" style={styles.linkText}>
            <ThemedText type="link">Zobrazit všechny triky →</ThemedText>
          </Link>
        </ThemedView>
      )}

      <View style={{ height: 24 }} />
      <ThemedText style={[styles.muted, { textAlign: 'center' }]}>
        Posledních {NOTIFICATIONS.length} oznámení v záložce Profil.
      </ThemedText>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.stat}>
      <ThemedText type="defaultSemiBold" style={{ fontSize: 20 }}>
        {value}
      </ThemedText>
      <ThemedText style={styles.muted}>{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 64, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 32 },
  bell: { padding: 8 },
  muted: { opacity: 0.65, marginTop: 2 },
  card: {
    padding: 16, borderRadius: 14, gap: 8,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressBg: {
    height: 10, borderRadius: 5, backgroundColor: 'rgba(127,127,127,0.2)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(127,127,127,0.08)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  linkText: { marginTop: 6 },
});
