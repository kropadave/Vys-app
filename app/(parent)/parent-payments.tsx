import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParentCard, StatusPill } from '@/components/parent-card';
import { duePaymentsTotal, parentPayments, paymentStatusLabel } from '@/lib/parent-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function ParentPayments() {
  const total = duePaymentsTotal();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Rodič · Platby</Text>
      <Text style={styles.title}>Platby a Stripe checkout</Text>
      <Text style={styles.body}>Platby zůstanou na webu, aby šlo později bezpečně připojit Stripe checkout.</Text>

      <ParentCard title="K úhradě">
        <Text style={styles.total}>{total} Kč</Text>
        <Text style={styles.muted}>{total === 0 ? 'Vše je zaplaceno.' : 'Připraveno pro budoucí Stripe platbu.'}</Text>
        <Pressable disabled style={styles.payButton}>
          <Text style={styles.payButtonText}>Zaplatit přes Stripe · připravujeme</Text>
        </Pressable>
      </ParentCard>

      {parentPayments.map((payment) => (
        <ParentCard key={payment.id}>
          <View style={styles.paymentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>{payment.title}</Text>
              <Text style={styles.muted}>{payment.participantName}</Text>
              <Text style={styles.muted}>Splatnost: {payment.dueDate}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amount}>{payment.amount} Kč</Text>
              <StatusPill label={paymentStatusLabel(payment.status)} tone={payment.status === 'paid' ? 'success' : 'warning'} />
            </View>
          </View>
        </ParentCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 42 },
  kicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 28, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  total: { color: Palette.text, fontSize: 40, fontWeight: '900' },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
  payButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.primaryDark,
    opacity: 0.68,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  payButtonText: { color: '#fff', fontWeight: '900' },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  paymentTitle: { color: Palette.text, fontSize: 18, fontWeight: '900' },
  amountBox: { gap: Spacing.sm, alignItems: 'flex-start' },
  amount: { color: Palette.text, fontSize: 20, fontWeight: '900' },
});
