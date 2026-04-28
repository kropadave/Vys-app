import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParentCard, StatusPill } from '@/components/parent-card';
import { attendancePercent, duePaymentsTotal, linkedParticipants, parentPayments, parentProfile, paymentStatusLabel } from '@/lib/parent-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function ParentHome() {
  const participant = linkedParticipants[0];
  const unpaidTotal = duePaymentsTotal();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Rodič</Text>
        <Text style={styles.title}>Dobrý den, {parentProfile.name}</Text>
        <Text style={styles.body}>Tady uvidíte přidané účastníky, platby, docházku, levely a všechno důležité pro správu aktivit.</Text>
      </View>

      <View style={styles.grid}>
        <ParentCard title="Platební stav">
          <Text style={styles.metric}>{unpaidTotal === 0 ? 'Vše zaplaceno' : `${unpaidTotal} Kč`}</Text>
          <Text style={styles.muted}>{unpaidTotal === 0 ? 'Aktuálně není nic k doplacení.' : 'Čeká na online platbu přes web.'}</Text>
          <StatusPill label={unpaidTotal === 0 ? 'Zaplaceno' : 'Čeká na platbu'} tone={unpaidTotal === 0 ? 'success' : 'warning'} />
        </ParentCard>

        <ParentCard title="Přidaný účastník">
          <Text style={styles.cardTitle}>{participant.firstName} {participant.lastName}</Text>
          <Text style={styles.muted}>{participant.activeCourse}</Text>
          <View style={styles.braceletRow}>
            <View style={[styles.bracelet, { backgroundColor: participant.braceletColor }]}>
              <Text style={styles.braceletText}>{participant.bracelet}</Text>
            </View>
            <View>
              <Text style={styles.level}>Level {participant.level}</Text>
              <Text style={styles.muted}>{participant.xp} / {participant.nextBraceletXp} XP</Text>
            </View>
          </View>
        </ParentCard>
      </View>

      <ParentCard title="Statistiky účastníka">
        <View style={styles.statsGrid}>
          <Stat label="Docházka" value={`${attendancePercent(participant)} %`} />
          <Stat label="Tréninky" value={`${participant.attendanceDone}/${participant.attendanceTotal}`} />
          <Stat label="Další trénink" value={participant.nextTraining} />
        </View>
      </ParentCard>

      <ParentCard title="Poslední platby">
        {parentPayments.map((payment) => (
          <View key={payment.id} style={styles.paymentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>{payment.title}</Text>
              <Text style={styles.muted}>{payment.participantName} · {payment.amount} Kč</Text>
            </View>
            <StatusPill label={paymentStatusLabel(payment.status)} tone={payment.status === 'paid' ? 'success' : 'warning'} />
          </View>
        ))}
      </ParentCard>
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
  hero: { gap: 8 },
  kicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 28, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  metric: { color: Palette.text, fontSize: 34, fontWeight: '900' },
  cardTitle: { color: Palette.text, fontSize: 20, fontWeight: '900' },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
  text: { color: Palette.text, fontSize: 14, lineHeight: 20 },
  braceletRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bracelet: { minWidth: 110, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  braceletText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  level: { color: Palette.text, fontSize: 18, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: { backgroundColor: Palette.surfaceAlt, borderRadius: Radius.lg, padding: Spacing.lg, minWidth: 130, flexGrow: 1 },
  statValue: { color: Palette.text, fontSize: 22, fontWeight: '900' },
  paymentRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
});
