import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CatLogo } from '@/components/icons/CatMascot';
import {
  ArrowRightIcon,
  BellIcon,
  BoltIcon,
  CartIcon,
  CheckIcon,
  ChildIcon,
  CoinIcon,
  TargetIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  PARENT_BOOKINGS,
  PARENT_CHILDREN,
  duePaymentsTotal,
} from '@/lib/data/parent';
import { Gradients, Palette, Radius, Shadow, Spacing } from '@/lib/theme';

export default function ParentDashboard() {
  const dueTotal = duePaymentsTotal();
  const activeBookings = PARENT_BOOKINGS.filter((b) => b.status !== 'paid').length;

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.hello}>Rodičovský přehled</Text>
          <Text style={styles.subHello}>{PARENT_CHILDREN.length} děti · {activeBookings} otevřené přihlášky</Text>
        </View>
        <Link href="/notifications" asChild>
          <TouchableOpacity style={styles.bellBtn}>
            <BellIcon size={26} />
          </TouchableOpacity>
        </Link>
      </View>

      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <View style={styles.heroRow}>
          <View style={styles.logoBubble}>
            <CatLogo size={72} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Všechno pro TeamVYS na jednom místě</Text>
            <Text style={styles.heroSub}>Přihlášky, platby, děti a jejich parkourový progres.</Text>
            <View style={styles.pillRow}>
              <Pill label={`${dueTotal.toLocaleString('cs-CZ')} Kč k úhradě`} variant="yellow" icon={<CoinIcon size={14} />} />
              <Pill label="Kroužky od 1790 Kč" variant="soft" icon={<TargetIcon size={14} />} />
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.quickRow}>
        <QuickLink href="/(parent)/children" label="Děti" icon={<ChildIcon size={28} />} />
        <QuickLink href="/(parent)/bookings" label="Přihlášky" icon={<CartIcon size={28} />} />
        <QuickLink href="/(parent)/payments" label="Platby" icon={<CoinIcon size={28} />} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Děti</Text>
        <Link href="/(parent)/children" asChild>
          <TouchableOpacity><Text style={styles.linkText}>Detail</Text></TouchableOpacity>
        </Link>
      </View>
      <View style={{ gap: 10 }}>
        {PARENT_CHILDREN.map((child) => (
          <Card key={child.id} pad={14} radius={Radius.lg}>
            <View style={styles.childRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{child.name.slice(0, 2).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{child.name}</Text>
                <Text style={styles.muted}>{child.group}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, child.attendanceRate * 100)}%` }]} />
                </View>
              </View>
              <Pill label={child.bracelet} variant="soft" icon={<BoltIcon size={14} />} />
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Aktuálně</Text>
        <Link href="/(parent)/bookings" asChild>
          <TouchableOpacity><Text style={styles.linkText}>Vše</Text></TouchableOpacity>
        </Link>
      </View>
      <View style={{ gap: 10 }}>
        {PARENT_BOOKINGS.slice(0, 2).map((booking) => (
          <Card key={booking.id} pad={14} radius={Radius.lg}>
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>{booking.status === 'paid' ? <CheckIcon size={22} /> : <CartIcon size={22} />}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{booking.title}</Text>
                <Text style={styles.muted}>{booking.childName} · {booking.dateLabel}</Text>
              </View>
              <ArrowRightIcon />
            </View>
          </Card>
        ))}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href as never} asChild>
      <TouchableOpacity style={styles.quickCard}>
        {icon}
        <Text style={styles.quickLabel}>{label}</Text>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingTop: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hello: { fontSize: 24, fontWeight: '900', color: Palette.text },
  subHello: { color: Palette.textMuted, marginTop: 2 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.surface,
    alignItems: 'center', justifyContent: 'center', ...Shadow.soft,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBubble: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: Palette.surface, fontSize: 18, fontWeight: '900' },
  heroSub: { color: Palette.surface, opacity: 0.9, marginTop: 3 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, backgroundColor: Palette.surface, borderRadius: Radius.lg, padding: 14,
    alignItems: 'center', gap: 8, ...Shadow.soft,
  },
  quickLabel: { color: Palette.text, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Palette.text },
  linkText: { color: Palette.primary700, fontWeight: '800' },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Palette.primary100, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900', color: Palette.primary700 },
  cardTitle: { color: Palette.text, fontWeight: '900' },
  muted: { color: Palette.textMuted, marginTop: 2, fontSize: 13 },
  progressTrack: { height: 7, borderRadius: 999, backgroundColor: Palette.primary50, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: Palette.accentMint },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookingIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.primary50, alignItems: 'center', justifyContent: 'center' },
});
