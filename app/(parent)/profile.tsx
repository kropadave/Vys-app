import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CatLogo } from '@/components/icons/CatMascot';
import { BoltIcon, ChildIcon, TargetIcon } from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { useRole, type AppRole } from '@/hooks/use-role';
import { PARENT_CHILDREN } from '@/lib/data/parent';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';
import { Gradients, Palette, Radius, Spacing } from '@/lib/theme';

const ROLES: { role: AppRole; label: string; target: string }[] = [
  { role: 'parent', label: 'Rodič', target: '/(parent)' },
  { role: 'participant', label: 'Účastník', target: '/(tabs)' },
  { role: 'coach', label: 'Trenér', target: '/(coach)' },
];

export default function ParentProfileScreen() {
  const router = useRouter();
  const { setRole } = useRole();

  async function switchRole(role: AppRole, target: string) {
    await setRole(role);
    router.replace(target as never);
  }

  async function signOut() {
    if (DEV_BYPASS_AUTH) {
      Alert.alert('Dev režim', 'Odhlášení je vypnuté – DEV_BYPASS_AUTH = true.');
      return;
    }
    await supabase.auth.signOut();
  }

  return (
    <ScrollView style={{ backgroundColor: Palette.bg }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <View style={styles.heroRow}>
          <View style={styles.logoBubble}><CatLogo size={80} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Rodičovský účet</Text>
            <Text style={styles.sub}>Správa dětí, přihlášek a plateb</Text>
            <View style={styles.pillRow}>
              <Pill label={`${PARENT_CHILDREN.length} děti`} variant="yellow" icon={<ChildIcon size={14} />} />
              <Pill label="TeamVYS" variant="soft" icon={<TargetIcon size={14} />} />
            </View>
          </View>
        </View>
      </Card>

      <Text style={styles.section}>Přepnout sekci</Text>
      <View style={{ gap: 10 }}>
        {ROLES.map((item) => (
          <Pressable key={item.role} onPress={() => switchRole(item.role, item.target)}>
            <Card pad={14} radius={Radius.lg}>
              <View style={styles.roleRow}>
                <View style={styles.roleIcon}><BoltIcon size={22} /></View>
                <Text style={styles.roleLabel}>{item.label}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={signOut} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Odhlásit se</Text>
      </Pressable>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBubble: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  name: { color: Palette.surface, fontSize: 22, fontWeight: '900' },
  sub: { color: Palette.surface, opacity: 0.9, marginTop: 2 },
  pillRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  section: { fontSize: 18, fontWeight: '900', color: Palette.text },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.primary50, alignItems: 'center', justifyContent: 'center' },
  roleLabel: { color: Palette.text, fontWeight: '900', fontSize: 16 },
  signOutBtn: { padding: 14, alignItems: 'center' },
  signOutText: { color: Palette.danger, fontWeight: '900' },
});
