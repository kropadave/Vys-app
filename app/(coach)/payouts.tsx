import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ArrowRightIcon,
  CheckIcon,
  CoinIcon,
  HourglassIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { MOCK_COACH, PAYOUTS, totalEarnedThisMonth } from '@/lib/data/coach';
import { Gradients, Palette, Radius, Spacing } from '@/lib/theme';

export default function PayoutsScreen() {
  const router = useRouter();
  const c = MOCK_COACH;
  const totalPaid = PAYOUTS.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = PAYOUTS.find((p) => p.status === 'pending');

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <ArrowRightIcon tint={Palette.primary700} />
        <Text style={styles.backText}>Zpět</Text>
      </Pressable>

      <Text style={styles.h1}>Výplaty</Text>

      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <Text style={styles.heroLabel}>Tento měsíc</Text>
        <Text style={styles.heroValue}>{totalEarnedThisMonth().toLocaleString('cs-CZ')} Kč</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <Pill label={`${c.hoursThisMonth} h`} variant="yellow" icon={<HourglassIcon size={14} />} />
          <Pill label={`${c.ratePerHour} Kč/h`} variant="soft" icon={<CoinIcon size={14} />} />
          {pending && <Pill label="Čeká na výplatu" variant="plain" />}
        </View>
      </Card>

      <View style={styles.summaryRow}>
        <Summary label="Celkem vyplaceno" value={`${totalPaid.toLocaleString('cs-CZ')} Kč`} />
        <Summary label="Hodinová sazba" value={`${c.ratePerHour} Kč`} />
      </View>

      <Text style={styles.sectionTitle}>Historie</Text>

      <View style={{ gap: 10 }}>
        {PAYOUTS.map((p) => (
          <Card key={p.id} pad={14} radius={Radius.lg}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.statusIcon, p.status === 'paid' ? styles.statusPaid : styles.statusPending]}>
                {p.status === 'paid' ? <CheckIcon size={20} /> : <HourglassIcon size={20} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutTitle}>{p.periodLabel}</Text>
                <Text style={styles.payoutSub}>
                  {p.hours} h × {p.ratePerHour} Kč
                  {p.paidAt && ` · vyplaceno ${new Date(p.paidAt).toLocaleDateString('cs-CZ')}`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{p.amount.toLocaleString('cs-CZ')} Kč</Text>
                <Pill
                  label={p.status === 'paid' ? 'Vyplaceno' : 'Brzy'}
                  variant={p.status === 'paid' ? 'mint' : 'soft'}
                />
              </View>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', transform: [{ scaleX: -1 }] },
  backText: { color: Palette.primary700, fontWeight: '700', transform: [{ scaleX: -1 }] },
  h1: { fontSize: 28, fontWeight: '800', color: Palette.text },

  heroLabel: { color: Palette.surface, opacity: 0.9, fontWeight: '700' },
  heroValue: { color: Palette.surface, fontSize: 36, fontWeight: '800', marginTop: 4 },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, padding: 14, backgroundColor: Palette.surface, borderRadius: Radius.lg,
  },
  summaryLabel: { color: Palette.textMuted, fontSize: 12, fontWeight: '600' },
  summaryValue: { color: Palette.text, fontWeight: '800', fontSize: 18, marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: Palette.text },

  statusIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statusPaid: { backgroundColor: Palette.accentMint },
  statusPending: { backgroundColor: Palette.surfaceAlt },

  payoutTitle: { fontWeight: '800', color: Palette.text },
  payoutSub: { color: Palette.textMuted, marginTop: 2, fontSize: 12 },
  amount: { fontWeight: '800', color: Palette.text, marginBottom: 4 },
});
