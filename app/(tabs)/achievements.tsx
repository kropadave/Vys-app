import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACHIEVEMENTS, type Achievement } from '@/lib/data/mock';

export default function AchievementsScreen() {
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked);
  const locked = ACHIEVEMENTS.filter((a) => !a.unlocked);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Odznaky a odměny</ThemedText>
      <ThemedText style={styles.muted}>
        Plněním triků a účastí na akcích sbíráš odznaky. Některé odemykají slevy nebo merch.
      </ThemedText>

      <ThemedText type="subtitle" style={{ marginTop: 8 }}>
        Získané ({unlocked.length})
      </ThemedText>
      {unlocked.map((a) => (
        <AchievementCard key={a.id} achievement={a} />
      ))}

      <ThemedText type="subtitle" style={{ marginTop: 16 }}>
        K dosažení ({locked.length})
      </ThemedText>
      {locked.map((a) => (
        <AchievementCard key={a.id} achievement={a} />
      ))}
    </ScrollView>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <ThemedView
      style={[
        styles.card,
        { opacity: achievement.unlocked ? 1 : 0.6 },
      ]}
    >
      <View style={styles.iconBox}>
        <ThemedText style={{ fontSize: 32 }}>
          {achievement.unlocked ? achievement.icon : '🔒'}
        </ThemedText>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText type="defaultSemiBold">{achievement.name}</ThemedText>
        <ThemedText style={styles.muted}>{achievement.description}</ThemedText>
        {achievement.reward && (
          <View style={styles.rewardBadge}>
            <ThemedText style={styles.rewardText}>
              🎁 {achievement.reward.label}
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 64, gap: 10 },
  muted: { opacity: 0.65 },
  card: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(127,127,127,0.08)', alignItems: 'center',
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(127,127,127,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  rewardBadge: {
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.18)',
  },
  rewardText: { fontSize: 12, fontWeight: '600', color: '#B45309' },
});
