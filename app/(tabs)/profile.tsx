import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParticipantCard } from '@/components/participant-card';
import { participantProfile, purchases } from '@/lib/participant-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function ParticipantProfile() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <ParticipantCard>
        <Text style={styles.name}>{participantProfile.name}</Text>
        <View style={styles.levelGrid}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{participantProfile.level}</Text>
            <Text style={styles.metricLabel}>Level</Text>
          </View>
          <View style={[styles.braceletHero, { backgroundColor: participantProfile.bracelet.color }]}>
            <Text style={styles.braceletLabel}>Náramek</Text>
            <Text style={styles.braceletTitle}>{participantProfile.bracelet.title}</Text>
          </View>
        </View>
        <Text style={styles.xp}>{participantProfile.xp} XP</Text>
      </ParticipantCard>

      <ParticipantCard title="Moje zakoupené aktivity">
        {purchases.map((item) => (
          <View key={`${item.type}-${item.title}`} style={styles.purchase}>
            <Text style={styles.purchaseType}>{item.type}</Text>
            <Text style={styles.purchaseTitle}>{item.title}</Text>
            <Text style={styles.purchaseStatus}>{item.status}</Text>
          </View>
        ))}
      </ParticipantCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 42 },
  name: { color: Palette.text, fontSize: 28, fontWeight: '900' },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: {
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    minWidth: 112,
    alignItems: 'center',
  },
  metricValue: { color: Palette.text, fontSize: 58, fontWeight: '900', lineHeight: 62 },
  metricLabel: { color: Palette.textMuted, fontSize: 13, fontWeight: '800' },
  braceletHero: { flex: 1, minWidth: 210, minHeight: 126, borderRadius: Radius.lg, padding: Spacing.lg, justifyContent: 'center' },
  braceletLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  braceletTitle: { color: '#fff', fontSize: 34, fontWeight: '900' },
  xp: { color: Palette.accent, fontSize: 18, fontWeight: '900' },
  purchase: { backgroundColor: Palette.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  purchaseType: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  purchaseTitle: { color: Palette.text, fontSize: 16, fontWeight: '800' },
  purchaseStatus: { color: Palette.textMuted, fontSize: 13 },
});
