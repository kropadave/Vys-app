import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AnimatedCatMascot } from '@/components/icons/CatMascot';
import { supabase } from '@/lib/supabase';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.mascotWrap}>
        <AnimatedCatMascot size={160} />
      </View>
      <Text style={styles.title}>Vys-app</Text>
      <Text style={styles.subtitle}>Tvoje parkour cesta začíná tady.</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
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
        <Text style={styles.buttonText}>Přihlásit se</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signUp} disabled={loading}>
        <Text style={styles.link}>Vytvořit účet</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
  mascotWrap: { alignItems: 'center', marginBottom: Spacing.md },
  title: {
    fontSize: 32, fontWeight: '800', textAlign: 'center', color: Palette.text,
  },
  subtitle: {
    textAlign: 'center', color: Palette.textMuted, marginBottom: Spacing.lg,
  },
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
  link: {
    textAlign: 'center', color: Palette.primary600, marginTop: 12, fontWeight: '700',
  },
});
