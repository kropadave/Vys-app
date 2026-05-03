import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { participantProfile, rewardPath } from '@/lib/participant-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function RewardsScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Odměnová cesta</Text>
      <Text style={styles.title}>XP za pohyb, odměny po cestě</Text>
      <Text style={styles.body}>Tahle cesta je oddělená od odemykání náramků. Sbírané XP tu postupně plní odměny.</Text>

      <View style={styles.path}>
        {rewardPath.map((reward) => {
          const unlocked = participantProfile.xp >= reward.xp;
          return (
            <View key={reward.xp} style={[styles.reward, unlocked && styles.rewardUnlocked]}>
              <Text style={styles.xp}>{reward.xp} XP</Text>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.status}>{unlocked ? 'Odemčeno' : 'Zamčeno'}</Text>
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
  path: { gap: Spacing.md },
  reward: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 6,
  },
  rewardUnlocked: { borderColor: Palette.success, backgroundColor: '#173328' },
  xp: { color: Palette.accent, fontSize: 12, fontWeight: '900' },
  rewardTitle: { color: Palette.text, fontSize: 18, fontWeight: '900' },
  status: { color: Palette.textMuted, fontSize: 13, fontWeight: '800' },
});
