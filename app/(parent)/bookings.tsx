import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CartIcon, CheckIcon, HourglassIcon, ParkourIcon } from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { PARENT_BOOKINGS, type ParentBooking } from '@/lib/data/parent';
import { Palette, Radius, Spacing } from '@/lib/theme';

const TYPE_LABEL: Record<ParentBooking['type'], string> = {
  krouzek: 'Kroužek',
  tabor: 'Tábor',
  workshop: 'Workshop',
};

const STATUS_LABEL: Record<ParentBooking['status'], string> = {
  active: 'Aktivní',
  pending: 'Čeká',
  paid: 'Zaplaceno',
};

export default function ParentBookingsScreen() {
  return (
    <ScrollView style={{ backgroundColor: Palette.bg }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Přihlášky</Text>
      <Text style={styles.lead}>Kroužky, tábory a workshopy přihlášené pro tvoje děti.</Text>
      {PARENT_BOOKINGS.map((booking) => (
        <Card key={booking.id} pad={16} radius={Radius.lg}>
          <View style={styles.row}>
            <View style={styles.icon}>{iconFor(booking)}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{booking.title}</Text>
              <Text style={styles.sub}>{booking.childName} · {booking.dateLabel}</Text>
              <View style={styles.pillRow}>
                <Pill label={TYPE_LABEL[booking.type]} variant="soft" />
                <Pill label={STATUS_LABEL[booking.status]} variant={booking.status === 'paid' ? 'mint' : booking.status === 'pending' ? 'yellow' : 'plain'} />
              </View>
            </View>
            <Text style={styles.price}>{booking.price.toLocaleString('cs-CZ')} Kč</Text>
          </View>
        </Card>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function iconFor(booking: ParentBooking) {
  if (booking.status === 'paid') return <CheckIcon size={24} />;
  if (booking.type === 'workshop') return <ParkourIcon size={24} />;
  if (booking.status === 'pending') return <HourglassIcon size={24} />;
  return <CartIcon size={24} />;
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  h1: { fontSize: 28, fontWeight: '900', color: Palette.text },
  lead: { color: Palette.textMuted, marginTop: -12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 50, height: 50, borderRadius: 25, backgroundColor: Palette.primary50, alignItems: 'center', justifyContent: 'center' },
  title: { color: Palette.text, fontWeight: '900' },
  sub: { color: Palette.textMuted, marginTop: 2, fontSize: 13 },
  pillRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  price: { color: Palette.text, fontWeight: '900' },
});
