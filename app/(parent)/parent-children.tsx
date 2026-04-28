import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParentCard, StatusPill } from '@/components/parent-card';
import { attendancePercent, linkedParticipants, paymentStatusLabel } from '@/lib/parent-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function ParentChildren() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Rodič · Účastníci</Text>
      <Text style={styles.title}>Přidaní účastníci</Text>
      <Text style={styles.body}>Tady rodič uvidí každé dítě připojené k profilu v databázi.</Text>

      {linkedParticipants.map((participant) => (
        <ParentCard key={participant.id}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{participant.firstName} {participant.lastName}</Text>
              <Text style={styles.muted}>Rodné číslo: {participant.birthNumberMasked}</Text>
            </View>
            <StatusPill label={paymentStatusLabel(participant.paidStatus)} tone={participant.paidStatus === 'paid' ? 'success' : 'warning'} />
          </View>

          <View style={styles.braceletRow}>
            <View style={[styles.bracelet, { backgroundColor: participant.braceletColor }]}>
              <Text style={styles.braceletLabel}>Náramek</Text>
              <Text style={styles.braceletTitle}>{participant.bracelet}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metric}>{participant.level}</Text>
              <Text style={styles.muted}>Level</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <Stat label="XP" value={`${participant.xp}/${participant.nextBraceletXp}`} />
            <Stat label="Docházka" value={`${attendancePercent(participant)} %`} />
            <Stat label="Tréninky" value={`${participant.attendanceDone}/${participant.attendanceTotal}`} />
            <Stat label="Další" value={participant.nextTraining} />
          </View>

          <View style={styles.purchaseList}>
            {participant.activePurchases.map((purchase) => (
              <View key={`${participant.id}-${purchase.type}`} style={styles.purchaseRow}>
                <Text style={styles.purchaseType}>{purchase.type}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.text}>{purchase.title}</Text>
                  <Text style={styles.muted}>{purchase.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </ParentCard>
      ))}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 42 },
  kicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 28, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  name: { color: Palette.text, fontSize: 22, fontWeight: '900' },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
  text: { color: Palette.text, fontSize: 14, lineHeight: 20 },
  braceletRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  bracelet: { flex: 1, minWidth: 220, borderRadius: Radius.lg, padding: Spacing.lg, justifyContent: 'center' },
  braceletLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  braceletTitle: { color: '#fff', fontSize: 30, fontWeight: '900' },
  metricBox: { backgroundColor: Palette.surfaceAlt, borderRadius: Radius.lg, padding: Spacing.lg, minWidth: 120, alignItems: 'center' },
  metric: { color: Palette.text, fontSize: 48, fontWeight: '900', lineHeight: 52 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: { backgroundColor: Palette.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, minWidth: 120, flexGrow: 1 },
  statValue: { color: Palette.text, fontSize: 18, fontWeight: '900' },
  purchaseList: { gap: Spacing.md },
  purchaseRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  purchaseType: { color: Palette.primary, width: 78, fontWeight: '900' },
});
