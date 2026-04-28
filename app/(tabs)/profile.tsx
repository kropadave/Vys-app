import { Link } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  BellIcon,
  BoltIcon,
  MascotIcon,
  ParkourIcon,
  TentIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  MOCK_PARTICIPANT,
  PURCHASES,
  currentBracelet,
  unreadNotificationsCount,
  type Purchase,
} from '@/lib/data/mock';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';
import { Gradients, Palette, Radius, Spacing } from '@/lib/theme';

const TYPE_LABEL: Record<Purchase['type'], string> = {
  krouzek: 'Kroužek',
  tabor: 'Tábor',
  workshop: 'Workshop',
};

function PurchaseTypeIcon({ type, size = 28 }: { type: Purchase['type']; size?: number }) {
  if (type === 'krouzek') return <ParkourIcon size={size} />;
  if (type === 'tabor') return <TentIcon size={size} />;
  return <BoltIcon size={size} />;
}

const STATUS_VARIANT: Record<Purchase['status'], 'mint' | 'soft' | 'plain'> = {
  active: 'mint',
  upcoming: 'soft',
  completed: 'plain',
};

const STATUS_LABEL: Record<Purchase['status'], string> = {
  active: 'Probíhá',
  upcoming: 'Brzy',
  completed: 'Dokončeno',
};

export default function ProfileScreen() {
  const p = MOCK_PARTICIPANT;
  const bracelet = currentBracelet(p.currentBraceletLevel);

  async function signOut() {
    if (DEV_BYPASS_AUTH) {
      Alert.alert('Dev režim', 'Odhlášení je vypnuté – DEV_BYPASS_AUTH = true.');
      return;
    }
    await supabase.auth.signOut();
  }

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Card gradient={Gradients.hero} pad={24} radius={Radius.xl}>
        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <MascotIcon size={104} />
          </View>
          <Text style={styles.name}>{p.firstName} {p.lastName}</Text>
          <Text style={styles.sub}>{p.nickname} · {p.age} let · {p.city}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            <Pill label={`${p.xp} XP`} variant="yellow" icon={<BoltIcon size={14} />} />
            <Pill label={bracelet.name} variant="soft" />
          </View>
        </View>
      </Card>

      <View style={styles.quickRow}>
        <QuickLink href="/notifications" title="Notifikace" badge={unreadNotificationsCount()}>
          <BellIcon size={36} />
        </QuickLink>
        <QuickLink href="/krouzky" title="Kroužky">
          <ParkourIcon size={36} />
        </QuickLink>
      </View>

      <Text style={styles.section}>Moje nákupy</Text>
      <Text style={styles.muted}>
        Nákupy provádí rodič ze svého účtu. Tady vidíš vše, co máš zaplaceno.
      </Text>

      {PURCHASES.map((item) => (
        <Card key={item.id} pad={14}>
          <View style={styles.purchaseRow}>
            <View style={styles.purchaseIcon}>
              <PurchaseTypeIcon type={item.type} size={32} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.purchaseTitle}>{item.title}</Text>
              <Text style={styles.muted}>
                {TYPE_LABEL[item.type]} · {new Date(item.date).toLocaleDateString('cs-CZ')} · {item.price} Kč
              </Text>
            </View>
            <Pill label={STATUS_LABEL[item.status]} variant={STATUS_VARIANT[item.status]} />
          </View>
        </Card>
      ))}

      <Text style={styles.section}>Účet</Text>
      <Card pad={14}>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Odhlásit se</Text>
        </TouchableOpacity>
        {DEV_BYPASS_AUTH && (
          <Text style={[styles.muted, { fontSize: 11, marginTop: 8, textAlign: 'center' }]}>
            DEV režim: přihlášení je vypnuté pro testování (lib/dev-config.ts).
          </Text>
        )}
      </Card>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function QuickLink({
  href, title, badge, children,
}: { href: any; title: string; badge?: number; children: React.ReactNode }) {
  return (
    <Link href={href} asChild>
      <TouchableOpacity style={{ flex: 1 }}>
        <Card pad={14} style={{ alignItems: 'center', gap: 6 }}>
          {children}
          <Text style={{ fontWeight: '700', color: Palette.text }}>{title}</Text>
          {badge ? <Text style={styles.muted}>{badge} nepřečtených</Text> : null}
        </Card>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.md },
  profileHero: { alignItems: 'center', gap: 6 },
  avatar: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    overflow: 'hidden',
  },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.85)' },
  quickRow: { flexDirection: 'row', gap: 12 },

  section: { fontSize: 18, fontWeight: '800', color: Palette.text, marginTop: 8 },
  muted: { color: Palette.textMuted, fontSize: 13 },

  purchaseRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  purchaseIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Palette.primary100,
    alignItems: 'center', justifyContent: 'center',
  },
  purchaseTitle: { fontSize: 14, fontWeight: '700', color: Palette.text },

  signOutBtn: {
    paddingVertical: 12, borderRadius: Radius.pill,
    backgroundColor: 'rgba(225,29,72,0.10)',
    alignItems: 'center',
  },
  signOutText: { color: Palette.danger, fontWeight: '800' },
});
