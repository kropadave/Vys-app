import { Link } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  MOCK_PARTICIPANT,
  PURCHASES,
  currentBracelet,
  unreadNotificationsCount,
  type Purchase,
} from '@/lib/data/mock';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';

const TYPE_LABEL: Record<Purchase['type'], string> = {
  krouzek: 'Kroužek',
  tabor: 'Tábor',
  workshop: 'Workshop',
};

const STATUS_LABEL: Record<Purchase['status'], string> = {
  active: 'Probíhá',
  upcoming: 'Brzy',
  completed: 'Dokončeno',
};

const STATUS_COLOR: Record<Purchase['status'], string> = {
  active: '#16A34A',
  upcoming: '#2563EB',
  completed: '#6B7280',
};

export default function ProfileScreen() {
  const p = MOCK_PARTICIPANT;
  const bracelet = currentBracelet(p.currentBraceletLevel);

  async function signOut() {
    if (DEV_BYPASS_AUTH) {
      Alert.alert('Dev režim', 'Odhlášení je zakázané, dokud je DEV_BYPASS_AUTH = true.');
      return;
    }
    await supabase.auth.signOut();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hlavička profilu */}
      <ThemedView style={styles.profileCard}>
        <View style={[styles.avatar, { borderColor: bracelet.color }]}>
          <ThemedText style={{ fontSize: 40 }}>{p.avatarEmoji}</ThemedText>
        </View>
        <ThemedText type="title">
          {p.firstName} {p.lastName}
        </ThemedText>
        <ThemedText style={styles.muted}>{p.nickname} · {p.age} let · {p.city}</ThemedText>
        <ThemedText style={styles.muted}>{p.group}</ThemedText>

        <View style={styles.profileRow}>
          <Stat label="XP" value={`${p.xp}`} />
          <Stat label="Náramek" value={bracelet.name} />
          <Stat
            label="V TeamVYS"
            value={`${Math.max(1, Math.round((Date.now() - new Date(p.joinedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))} m.`}
          />
        </View>
      </ThemedView>

      {/* Notifikace */}
      <Link href="/notifications" asChild>
        <TouchableOpacity>
          <ThemedView style={styles.linkCard}>
            <ThemedText type="subtitle">🔔 Notifikace</ThemedText>
            <ThemedText style={styles.muted}>
              {unreadNotificationsCount() > 0
                ? `${unreadNotificationsCount()} nepřečtených`
                : 'Vše přečteno'}
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </Link>

      {/* Moje nákupy */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText type="subtitle">🛒 Moje nákupy</ThemedText>
          <ThemedText style={styles.muted}>{PURCHASES.length}</ThemedText>
        </View>
        <ThemedText style={styles.muted}>
          Nákupy provádí rodič ze svého účtu. Zde vidíš všechno, co máš zaplaceno.
        </ThemedText>

        {PURCHASES.map((item) => (
          <View key={item.id} style={styles.purchaseRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText style={styles.muted}>
                {TYPE_LABEL[item.type]} · {new Date(item.date).toLocaleDateString('cs-CZ')} · {item.price} Kč
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.statusBadge, { color: STATUS_COLOR[item.status], backgroundColor: STATUS_COLOR[item.status] + '22' }]}
            >
              {STATUS_LABEL[item.status]}
            </ThemedText>
          </View>
        ))}
      </ThemedView>

      {/* Účet */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Účet</ThemedText>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <ThemedText style={{ color: '#DC2626', fontWeight: '600' }}>Odhlásit se</ThemedText>
        </TouchableOpacity>
        {DEV_BYPASS_AUTH && (
          <ThemedText style={[styles.muted, { fontSize: 12 }]}>
            ⚠️ DEV režim: přihlášení je vypnuté pro testování (lib/dev-config.ts).
          </ThemedText>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>{value}</ThemedText>
      <ThemedText style={styles.muted}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 64, gap: 14 },
  muted: { opacity: 0.65 },
  profileCard: {
    padding: 16, borderRadius: 14, gap: 6, alignItems: 'center',
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F3F4F6', borderWidth: 4,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row', gap: 8, marginTop: 12, alignSelf: 'stretch',
  },
  stat: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(127,127,127,0.10)',
  },
  linkCard: {
    padding: 14, borderRadius: 12, gap: 4,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  section: {
    padding: 14, borderRadius: 14, gap: 10,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  purchaseRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(127,127,127,0.25)',
  },
  statusBadge: {
    fontSize: 12, fontWeight: '600',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden',
  },
  signOutBtn: {
    padding: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.10)',
  },
});
