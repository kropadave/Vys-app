import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParticipantCard } from '@/components/participant-card';
import { notifications, participantProfile, purchases, rewardPath } from '@/lib/participant-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function ParticipantOverview() {
  const progress = Math.min(participantProfile.xp / participantProfile.nextBraceletXp, 1);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Účastník</Text>
        <Text style={styles.title}>Ahoj, {participantProfile.name}</Text>
        <Text style={styles.body}>Tady bude rychlý přehled XP, náramku, zakoupených aktivit a notifikací.</Text>
      </View>

      <ParticipantCard title="XP a náramek">
        <View style={styles.levelRow}>
          <View>
            <Text style={styles.big}>{participantProfile.level}</Text>
            <Text style={styles.muted}>Level</Text>
          </View>
          <View style={[styles.bracelet, { backgroundColor: participantProfile.bracelet.color }]}>
            <Text style={styles.braceletText}>{participantProfile.bracelet.title}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.muted}>{participantProfile.xp} / {participantProfile.nextBraceletXp} XP k dalšímu náramku</Text>
      </ParticipantCard>

      <ParticipantCard title="Zakoupeno">
        {purchases.map((item) => (
          <View key={`${item.type}-${item.title}`} style={styles.row}>
            <Text style={styles.rowTitle}>{item.type}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>{item.title}</Text>
              <Text style={styles.muted}>{item.status}</Text>
            </View>
          </View>
        ))}
      </ParticipantCard>

      <ParticipantCard title="Notifikace">
        {notifications.map((item) => <Text key={item} style={styles.text}>• {item}</Text>)}
      </ParticipantCard>

      <ParticipantCard title="Další odměna na cestě">
        <Text style={styles.text}>{rewardPath.find((item) => !item.unlocked)?.title}</Text>
        <Text style={styles.muted}>Odměnová cesta je oddělená od skill tree.</Text>
      </ParticipantCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 42 },
  hero: { gap: 8 },
  kicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 28, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  levelRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  big: { color: Palette.text, fontSize: 56, fontWeight: '900', lineHeight: 60 },
  bracelet: { flex: 1, minHeight: 76, borderRadius: Radius.lg, justifyContent: 'center', padding: Spacing.lg },
  braceletText: { color: '#fff', fontSize: 26, fontWeight: '900' },
  progressTrack: { height: 12, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Palette.accent, borderRadius: Radius.pill },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowTitle: { color: Palette.primary, width: 76, fontWeight: '900' },
  text: { color: Palette.text, fontSize: 14, lineHeight: 20 },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
});
