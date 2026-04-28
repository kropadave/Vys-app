import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, CoinIcon, HourglassIcon } from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { PARENT_PAYMENTS, duePaymentsTotal } from '@/lib/data/parent';
import { Gradients, Palette, Radius, Spacing } from '@/lib/theme';

export default function ParentPaymentsScreen() {
  const due = duePaymentsTotal();
  return (
    <ScrollView style={{ backgroundColor: Palette.bg }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Platby</Text>
      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <Text style={styles.heroLabel}>K úhradě</Text>
        <Text style={styles.heroValue}>{due.toLocaleString('cs-CZ')} Kč</Text>
        <Text style={styles.heroSub}>Přehled plateb za kroužky, tábory a workshopy.</Text>
      </Card>
      {PARENT_PAYMENTS.map((payment) => (
        <Card key={payment.id} pad={16} radius={Radius.lg}>
          <View style={styles.row}>
            <View style={[styles.icon, payment.status === 'paid' && styles.iconPaid]}>
              {payment.status === 'paid' ? <CheckIcon size={22} /> : <HourglassIcon size={22} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{payment.title}</Text>
              <Text style={styles.sub}>{payment.dueLabel}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={styles.amount}>{payment.amount.toLocaleString('cs-CZ')} Kč</Text>
              <Pill label={payment.status === 'paid' ? 'Zaplaceno' : 'Zaplatit'} variant={payment.status === 'paid' ? 'mint' : 'yellow'} icon={<CoinIcon size={14} />} />
            </View>
          </View>
        </Card>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  h1: { fontSize: 28, fontWeight: '900', color: Palette.text },
  heroLabel: { color: Palette.surface, opacity: 0.9, fontWeight: '800' },
  heroValue: { color: Palette.surface, fontSize: 36, fontWeight: '900', marginTop: 4 },
  heroSub: { color: Palette.surface, opacity: 0.9, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  iconPaid: { backgroundColor: Palette.accentMint },
  title: { color: Palette.text, fontWeight: '900' },
  sub: { color: Palette.textMuted, marginTop: 2, fontSize: 13 },
  amount: { color: Palette.text, fontWeight: '900' },
});
