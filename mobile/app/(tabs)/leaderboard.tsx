import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { leaderboard, participantProfile } from '@/lib/participant-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function LeaderboardScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Leaderboard</Text>
      <Text style={styles.title}>Žebříček XP</Text>
      <Text style={styles.body}>Srovnání je jen motivační. Hlavní je vlastní progres a bezpečné zvládnutí cviků.</Text>

      <View style={styles.list}>
        {leaderboard.map((item) => {
          const isMe = item.name === participantProfile.name;
          return (
            <View key={item.rank} style={[styles.row, isMe && styles.me]}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.xp}>{item.xp} XP</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 48 },
  kicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 30, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  list: { gap: Spacing.md },
  row: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  me: { borderColor: Palette.primary, backgroundColor: Palette.primarySoft },
  rank: { color: Palette.accent, fontSize: 18, fontWeight: '900', width: 42 },
  name: { color: Palette.text, fontSize: 17, fontWeight: '900', flex: 1 },
  xp: { color: Palette.textMuted, fontSize: 14, fontWeight: '800' },
});
