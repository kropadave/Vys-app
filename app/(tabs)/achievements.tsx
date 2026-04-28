import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { ACHIEVEMENTS, type Achievement } from '@/lib/data/mock';
import { Palette, Spacing } from '@/lib/theme';

export default function AchievementsScreen() {
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked);
  const locked = ACHIEVEMENTS.filter((a) => !a.unlocked);

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Odznaky a odměny</Text>
      <Text style={styles.intro}>
        Plněním triků a účastí na akcích sbíráš odznaky. Některé otevírají slevy nebo merch.
      </Text>

      <Text style={styles.section}>Získané ({unlocked.length})</Text>
      {unlocked.map((a) => (
        <AchievementCard key={a.id} achievement={a} />
      ))}

      <Text style={styles.section}>K dosažení ({locked.length})</Text>
      {locked.map((a) => (
        <AchievementCard key={a.id} achievement={a} />
      ))}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card pad={14} style={!achievement.unlocked ? { opacity: 0.6 } : undefined}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 32 }}>{achievement.unlocked ? achievement.icon : '🔒'}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.name}>{achievement.name}</Text>
          <Text style={styles.muted}>{achievement.description}</Text>
          {achievement.reward && (
            <View style={{ marginTop: 4 }}>
              <Pill label={achievement.reward.label} variant="yellow" emoji="🎁" />
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: 10 },
  h1: { fontSize: 28, fontWeight: '800', color: Palette.text },
  intro: { color: Palette.textMuted, marginBottom: 4 },
  section: { fontSize: 16, fontWeight: '800', color: Palette.text, marginTop: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Palette.primary100,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '800', color: Palette.text },
  muted: { color: Palette.textMuted, fontSize: 13 },
});
