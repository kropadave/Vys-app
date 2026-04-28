import { Link, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CatLogo } from '@/components/icons/CatMascot';
import {
  ArrowRightIcon,
  BellIcon,
  BoltIcon,
  CoinIcon,
  HourglassIcon,
  ParkourIcon,
  TargetIcon,
  TrophyIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  COACH_TODAY_SESSIONS,
  LEADERBOARD,
  MOCK_COACH,
  WARDS,
  formatTime,
  presentCount,
  readyForBraceletCount,
  totalEarnedThisMonth,
  type CoachSession,
} from '@/lib/data/coach';
import { Gradients, Palette, Radius, Shadow, Spacing } from '@/lib/theme';

export default function CoachDashboard() {
  const router = useRouter();
  const c = MOCK_COACH;
  const today = COACH_TODAY_SESSIONS;
  const present = presentCount(WARDS);
  const ready = readyForBraceletCount(WARDS);
  const myRank = LEADERBOARD.findIndex((r) => r.coachId === c.id) + 1;

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.hello}>Ahoj, trenére {c.nickname}!</Text>
          <Text style={styles.subHello}>{c.city} · {today.length} dnešní sessions</Text>
        </View>
        <Link href="/notifications" asChild>
          <TouchableOpacity style={styles.bellBtn}>
            <BellIcon size={26} />
          </TouchableOpacity>
        </Link>
      </View>

      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <View style={styles.heroRow}>
          <View style={styles.mascotCircle}>
            <CatLogo size={64} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Připraven na trénink?</Text>
            <Text style={styles.heroSub}>{present} dětí v hale · {ready} čeká na náramek</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Pill label={`${c.unlocksThisMonth} odemčení`} variant="yellow" icon={<BoltIcon size={14} />} />
              <Pill label={`${c.hoursThisMonth} h`} variant="soft" icon={<HourglassIcon size={14} />} />
              <Pill label={`${myRank}. v žebříčku`} variant="mint" icon={<TrophyIcon size={14} />} />
            </View>
          </View>
        </View>
      </Card>

      {/* Rychlé akce */}
      <View style={styles.quickRow}>
        <QuickAction
          label="Spustit docházku"
          icon={<TargetIcon size={28} />}
          onPress={() => router.push('/(coach)/attendance')}
          tint={Palette.primary500}
        />
        <QuickAction
          label="Odemknout trik"
          icon={<BoltIcon size={28} />}
          onPress={() => router.push('/(coach)/unlock')}
          tint={Palette.accentYellow}
        />
      </View>

      {/* Dnešní rozvrh */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dnes</Text>
        <Text style={styles.sectionSub}>{today.length} sessions</Text>
      </View>
      <View style={{ gap: 12 }}>
        {today.map((s) => (
          <SessionCard key={s.id} session={s} onPress={() => router.push(`/(coach)/attendance?session=${s.id}`)} />
        ))}
      </View>

      {/* Připraveni na náramek */}
      {ready > 0 && (
        <Card pad={16} radius={Radius.lg}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.alertIcon}>
              <ParkourIcon size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{ready} svěřenců splnilo podmínky</Text>
              <Text style={styles.alertSub}>Můžeš jim udělit nový náramek jedním tapem.</Text>
            </View>
            <Link href="/(coach)/wards" asChild>
              <TouchableOpacity style={styles.alertBtn}>
                <ArrowRightIcon tint={Palette.surface} />
              </TouchableOpacity>
            </Link>
          </View>
        </Card>
      )}

      {/* Tento měsíc */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tento měsíc</Text>
      </View>
      <View style={styles.statsRow}>
        <StatCard
          label="Vyděláno"
          value={`${totalEarnedThisMonth().toLocaleString('cs-CZ')} Kč`}
          icon={<CoinIcon size={22} />}
        />
        <StatCard
          label="Odpracováno"
          value={`${c.hoursThisMonth} h`}
          icon={<HourglassIcon size={22} />}
        />
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function QuickAction({
  label, icon, onPress, tint,
}: { label: string; icon: React.ReactNode; onPress: () => void; tint: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.quickCard, { borderColor: tint }]}>
      <View style={styles.quickIconWrap}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SessionCard({ session, onPress }: { session: CoachSession; onPress: () => void }) {
  const isLive = session.status === 'live';
  const isDone = session.status === 'done';
  return (
    <TouchableOpacity onPress={onPress}>
      <Card pad={14} radius={Radius.lg}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.timeChip, isLive && styles.timeChipLive, isDone && styles.timeChipDone]}>
            <Text style={[styles.timeChipText, (isLive || isDone) && { color: Palette.surface }]}>
              {formatTime(session.startsAt)}
            </Text>
            <Text style={[styles.timeChipSub, (isLive || isDone) && { color: Palette.surface, opacity: 0.85 }]}>
              {formatTime(session.endsAt)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
            <Text style={styles.sessionSub} numberOfLines={1}>
              {session.venue} · {session.city}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              {isLive && <Pill label="● LIVE" variant="primary" />}
              {isDone && <Pill label="Hotovo" variant="mint" />}
              {session.status === 'upcoming' && <Pill label="Brzy" variant="soft" />}
              <Pill label={`${session.expectedCount}/${session.enrolledCount} dětí`} variant="plain" />
            </View>
          </View>
          <ArrowRightIcon />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingTop: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hello: { fontSize: 22, fontWeight: '800', color: Palette.text },
  subHello: { color: Palette.textMuted, marginTop: 2 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center',
    ...Shadow.soft,
  },

  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mascotCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: Palette.surface, fontSize: 18, fontWeight: '800' },
  heroSub: { color: Palette.surface, opacity: 0.9, marginTop: 2 },

  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1, borderRadius: Radius.lg, padding: 16, alignItems: 'center',
    backgroundColor: Palette.surface, borderWidth: 2, gap: 8, ...Shadow.soft,
  },
  quickIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontWeight: '800', color: Palette.text },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Palette.text },
  sectionSub: { color: Palette.textMuted },

  timeChip: {
    width: 64, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Palette.surfaceAlt,
    alignItems: 'center',
  },
  timeChipLive: { backgroundColor: Palette.primary500 },
  timeChipDone: { backgroundColor: Palette.locked },
  timeChipText: { fontWeight: '800', color: Palette.text },
  timeChipSub: { fontSize: 11, color: Palette.textMuted, marginTop: 2 },
  sessionTitle: { fontSize: 15, fontWeight: '800', color: Palette.text },
  sessionSub: { color: Palette.textMuted, marginTop: 2, fontSize: 13 },

  alertIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.surfaceAlt,
  },
  alertTitle: { fontWeight: '800', color: Palette.text },
  alertSub: { color: Palette.textMuted, marginTop: 2, fontSize: 13 },
  alertBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.primary500,
    alignItems: 'center', justifyContent: 'center',
  },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, padding: 16, backgroundColor: Palette.surface, borderRadius: Radius.lg,
    ...Shadow.soft, gap: 4,
  },
  statIcon: { marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', color: Palette.text },
  statLabel: { color: Palette.textMuted, fontSize: 13 },
});
