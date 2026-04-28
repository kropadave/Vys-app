import { Link, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CatLogo } from '@/components/icons/CatMascot';
import {
    ArrowRightIcon,
    BoltIcon,
    CoinIcon,
    HourglassIcon,
    MedalIcon,
    TrophyIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { useRole } from '@/hooks/use-role';
import {
    COACH_BADGES,
    LEADERBOARD,
    MOCK_COACH,
    totalEarnedThisMonth,
} from '@/lib/data/coach';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';
import { Gradients, Palette, Radius, Shadow, Spacing } from '@/lib/theme';

export default function CoachProfile() {
  const c = MOCK_COACH;
  const router = useRouter();
  const { setRole } = useRole();
  const myRank = LEADERBOARD.findIndex((r) => r.coachId === c.id) + 1;
  const unlockedBadges = COACH_BADGES.filter((b) => b.unlocked).length;

  async function signOut() {
    if (DEV_BYPASS_AUTH) {
      Alert.alert('Dev režim', 'Odhlášení je vypnuté – DEV_BYPASS_AUTH = true.');
      return;
    }
    await supabase.auth.signOut();
  }

  async function switchRole() {
    await setRole('participant');
    router.replace('/home');
  }

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <CatLogo size={84} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{c.firstName} {c.lastName}</Text>
            <Text style={styles.sub}>Trenér · {c.city}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Pill label={`★ ${c.rating}`} variant="yellow" icon={<TrophyIcon size={14} />} />
              <Pill label={`${c.unlocksTotal} odemčení`} variant="soft" icon={<BoltIcon size={14} />} />
              <Pill label={`${myRank}. místo`} variant="mint" icon={<MedalIcon size={14} />} />
            </View>
          </View>
        </View>

        <View style={styles.groupsBox}>
          <Text style={styles.groupsTitle}>Tvé skupiny</Text>
          {c.groups.map((g) => (
            <Text key={g} style={styles.groupItem}>· {g}</Text>
          ))}
        </View>
      </Card>

      {/* Tento měsíc */}
      <View style={styles.statsRow}>
        <Stat icon={<CoinIcon size={22} />} value={`${totalEarnedThisMonth().toLocaleString('cs-CZ')} Kč`} label="Tento měsíc" />
        <Stat icon={<HourglassIcon size={22} />} value={`${c.hoursThisMonth} h`} label="Odpracováno" />
        <Stat icon={<BoltIcon size={22} />} value={`${c.unlocksThisMonth}`} label="Odemčení" />
      </View>

      {/* Quick links */}
      <View style={{ gap: 10 }}>
        <Link href="/(coach)/payouts" asChild>
          <Pressable>
            <Card pad={14} radius={Radius.lg}>
              <View style={styles.linkRow}>
                <View style={styles.linkIcon}><CoinIcon size={26} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle}>Výplaty</Text>
                  <Text style={styles.linkSub}>Přehled hodin a vyplacených částek</Text>
                </View>
                <ArrowRightIcon />
              </View>
            </Card>
          </Pressable>
        </Link>

        <Link href="/(coach)/gamification" asChild>
          <Pressable>
            <Card pad={14} radius={Radius.lg}>
              <View style={styles.linkRow}>
                <View style={styles.linkIcon}><MedalIcon size={26} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle}>Gamifikace trenéra</Text>
                  <Text style={styles.linkSub}>{unlockedBadges}/{COACH_BADGES.length} odznaků · žebříček</Text>
                </View>
                <ArrowRightIcon />
              </View>
            </Card>
          </Pressable>
        </Link>
      </View>

      {/* Switch role */}
      <Pressable onPress={switchRole} style={styles.switchBtn}>
        <Text style={styles.switchText}>Přepnout do dětského účtu</Text>
      </Pressable>

      <Pressable onPress={signOut} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Odhlásit se</Text>
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={{ marginBottom: 6 }}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800', color: Palette.surface },
  sub: { color: Palette.surface, opacity: 0.9, marginTop: 2 },

  groupsBox: { marginTop: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: Radius.md },
  groupsTitle: { color: Palette.surface, fontWeight: '800', marginBottom: 4 },
  groupItem: { color: Palette.surface, opacity: 0.92, fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Palette.surface, borderRadius: Radius.lg, padding: 14, ...Shadow.soft,
  },
  statValue: { fontWeight: '800', color: Palette.text, fontSize: 16 },
  statLabel: { color: Palette.textMuted, fontSize: 12, marginTop: 2 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.primary50,
  },
  linkTitle: { fontWeight: '800', color: Palette.text },
  linkSub: { color: Palette.textMuted, marginTop: 2, fontSize: 13 },

  switchBtn: {
    padding: 14, borderRadius: Radius.pill, backgroundColor: Palette.surface, alignItems: 'center',
    ...Shadow.soft,
  },
  switchText: { color: Palette.primary700, fontWeight: '800' },
  signOutBtn: { padding: 14, alignItems: 'center' },
  signOutText: { color: Palette.danger, fontWeight: '800' },
});
