import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AnimatedCatMascot } from '@/components/icons/CatMascot';
import { useRole, type AppRole } from '@/hooks/use-role';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';

export default function SignInScreen() {
  const { role, setRole } = useRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function chooseRole(r: AppRole) {
    await setRole(r);
  }

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Přihlášení selhalo', error.message);
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert('Registrace selhala', error.message);
    else Alert.alert('Hotovo', 'Zkontroluj e-mail pro potvrzení účtu.');
  }

  // V DEV režimu jen vybereme roli a navigujeme
  async function devEnter(r: AppRole) {
    await setRole(r);
    router.replace(r === 'coach' ? '/(coach)' : '/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.mascotWrap}>
        <AnimatedCatMascot size={150} />
      </View>
      <Text style={styles.title}>Vys-app</Text>
      <Text style={styles.subtitle}>Přihlas se a začni svoji parkour cestu.</Text>

      <View style={styles.roleSwitch}>
        <RoleTab label="Dítě / Rodič" active={role === 'kid'} onPress={() => chooseRole('kid')} />
        <RoleTab label="Trenér" active={role === 'coach'} onPress={() => chooseRole('coach')} />
      </View>

      <TextInput
        style={styles.input}
        placeholder={role === 'coach' ? 'Trenérský e-mail' : 'E-mail'}
        placeholderTextColor={Palette.textMuted}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Heslo"
        placeholderTextColor={Palette.textMuted}
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={signIn}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {role === 'coach' ? 'Přihlásit se jako trenér' : 'Přihlásit se'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signUp} disabled={loading}>
        <Text style={styles.link}>Vytvořit účet</Text>
      </TouchableOpacity>

      {DEV_BYPASS_AUTH && (
        <View style={styles.devBox}>
          <Text style={styles.devTitle}>DEV rychlý přístup</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[styles.devBtn, { backgroundColor: Palette.primary500 }]} onPress={() => devEnter('kid')}>
              <Text style={styles.devBtnText}>Vstoupit jako dítě</Text>
            </Pressable>
            <Pressable style={[styles.devBtn, { backgroundColor: Palette.primary700 }]} onPress={() => devEnter('coach')}>
              <Text style={styles.devBtnText}>Vstoupit jako trenér</Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function RoleTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.roleTab, active && styles.roleTabActive]}
    >
      <Text style={[styles.roleTabText, active && styles.roleTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: Palette.bg,
  },
  mascotWrap: { alignItems: 'center', marginBottom: Spacing.sm },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: Palette.text },
  subtitle: { textAlign: 'center', color: Palette.textMuted, marginBottom: Spacing.md },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  roleTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.pill },
  roleTabActive: { backgroundColor: Palette.surface, ...Shadow.soft },
  roleTabText: { color: Palette.textMuted, fontWeight: '700' },
  roleTabTextActive: { color: Palette.primary700 },
  input: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Palette.text,
  },
  button: {
    backgroundColor: Palette.accentYellow,
    padding: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Palette.textOnAccent, fontWeight: '800', fontSize: 16 },
  link: { textAlign: 'center', color: Palette.primary600, marginTop: 12, fontWeight: '700' },
  devBox: {
    marginTop: Spacing.lg,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceAlt,
    gap: 8,
  },
  devTitle: { fontWeight: '700', color: Palette.primary700, marginBottom: 4 },
  devBtn: { flex: 1, padding: 12, borderRadius: Radius.pill, alignItems: 'center' },
  devBtnText: { color: Palette.textOnPrimary, fontWeight: '700' },
});
