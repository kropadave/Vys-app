import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { FadeInUp, PulseGlow } from '@/components/animated/motion';
import { useRole, type AppRole } from '@/hooks/use-role';
import { Brand } from '@/lib/brand';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
type CoachApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

type RoleOption = {
  role: AppRole;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  gradient: readonly [string, string];
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  initial: string;
};

type FormField =
  | 'credential'
  | 'password'
  | 'confirmPassword'
  | 'fullName'
  | 'phone'
  | 'birthDate'
  | 'birthNumber'
  | 'coachMessage';

type FormValues = Record<FormField, string>;

type FieldConfig = {
  key: FormField;
  label: string;
  placeholder: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
};

const AUTH_PROFILE_KEY = 'vys.authProfile';
const AUTH_FORM_VALIDATION_ENABLED = !DEV_BYPASS_AUTH;

const emptyForm: FormValues = {
  credential: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phone: '',
  birthDate: '',
  birthNumber: '',
  coachMessage: '',
};

const ROLES: RoleOption[] = [
  {
    role: 'participant',
    title: 'Účastník',
    subtitle: 'Skill tree, XP, náramky',
    description: 'Pro triky, digitální permanentku a progres v kroužku.',
    route: '/tricks',
    gradient: ['#14C8FF', '#8B1DFF'],
    icon: 'run-fast',
    initial: 'U',
  },
  {
    role: 'coach',
    title: 'Trenér',
    subtitle: 'Docházka, QR, svěřenci',
    description: 'Po vyplnění formuláře odešleš žádost. Admin ji prověří a potvrdí přístup.',
    route: '/coach',
    gradient: ['#F12BB3', '#FFB21A'],
    icon: 'whistle-outline',
    initial: 'T',
  },
];

const LOGIN_FIELDS: Record<AppRole, FieldConfig[]> = {
  participant: [
    { key: 'credential', label: 'E-mail nebo telefon', placeholder: 'eliska@example.cz', keyboardType: 'email-address' },
    { key: 'password', label: 'Heslo', placeholder: 'Tvoje heslo', secure: true },
  ],
  coach: [
    { key: 'credential', label: 'Trenérský e-mail', placeholder: 'trener@teamvys.cz', keyboardType: 'email-address' },
    { key: 'password', label: 'Heslo', placeholder: 'Tvoje heslo', secure: true },
  ],
};

const REGISTER_FIELDS: Record<AppRole, FieldConfig[]> = {
  participant: [
    { key: 'fullName', label: 'Jméno a příjmení účastníka', placeholder: 'Eliška Nováková' },
    { key: 'birthDate', label: 'Datum narození', placeholder: '12. 4. 2014' },
    { key: 'birthNumber', label: 'Rodné číslo', placeholder: '045212/1234' },
    { key: 'credential', label: 'E-mail (tvůj nebo rodiče)', placeholder: 'eliska@example.cz', keyboardType: 'email-address' },
    { key: 'phone', label: 'Telefon zákonného zástupce', placeholder: '+420 605 324 417', keyboardType: 'phone-pad' },
    { key: 'password', label: 'Heslo', placeholder: 'Minimálně 6 znaků', secure: true },
    { key: 'confirmPassword', label: 'Potvrzení hesla', placeholder: 'Zopakuj heslo', secure: true },
  ],
  coach: [
    { key: 'fullName', label: 'Jméno a příjmení', placeholder: 'Jméno trenéra' },
    { key: 'credential', label: 'E-mail', placeholder: 'trener@example.cz', keyboardType: 'email-address' },
    { key: 'phone', label: 'Telefon', placeholder: '+420 777 221 904', keyboardType: 'phone-pad' },
    { key: 'coachMessage', label: 'Krátce o sobě (nepovinné)', placeholder: 'Kde trénuješ, odkud víš o nás, zkušenosti...', multiline: true },
    { key: 'password', label: 'Heslo', placeholder: 'Minimálně 6 znaků', secure: true },
    { key: 'confirmPassword', label: 'Potvrzení hesla', placeholder: 'Zopakuj heslo', secure: true },
  ],
};

function routeForRole(role: AppRole) {
  return ROLES.find((option) => option.role === role)?.route ?? '/tricks';
}

function looksLikeEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-ZÁ-Ž]/.test(password) && /[a-zá-ž]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-zÁ-Žá-ž0-9]/.test(password)) score += 1;
  return score;
}

function passwordStrengthLabel(score: number) {
  if (score >= 4) return 'Silné heslo';
  if (score >= 3) return 'Dobré heslo';
  if (score >= 2) return 'Použitelné heslo';
  return 'Slabé heslo';
}

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { setRole } = useRole();
  const { isDesktop } = useBreakpoint();
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<AppRole>('participant');
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<FormField | 'form', string>>>({});
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<FormField | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Partial<Record<FormField, boolean>>>({});

  const selectedOption = ROLES.find((option) => option.role === selectedRole) ?? ROLES[0];
  const fields = useMemo(() => {
    if (DEV_BYPASS_AUTH) return [];
    if (mode === 'forgot') return [{ key: 'credential', label: 'E-mail účtu', placeholder: 'rodic@email.cz', keyboardType: 'email-address' } satisfies FieldConfig];
    if (mode === 'reset') return [
      { key: 'password', label: 'Nové heslo', placeholder: 'Minimálně 6 znaků', secure: true },
      { key: 'confirmPassword', label: 'Potvrzení hesla', placeholder: 'Zopakuj heslo', secure: true },
    ] satisfies FieldConfig[];
    return mode === 'login' ? LOGIN_FIELDS[selectedRole] : REGISTER_FIELDS[selectedRole];
  }, [mode, selectedRole]);
  const strength = passwordStrength(form.password);

  useEffect(() => {
    if (params.mode === 'reset-password') setMode('reset');
  }, [params.mode]);

  useEffect(() => {
    if (DEV_BYPASS_AUTH || !hasSupabaseConfig || !supabase) return;

    const subscription = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('reset');
    });

    return () => subscription.data.subscription.unsubscribe();
  }, []);

  function updateField(key: FormField, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function toggleFieldVisibility(key: FormField) {
    setVisibleFields((current) => ({ ...current, [key]: !current[key] }));
  }

  function validate() {
    if (!DEV_BYPASS_AUTH && (!hasSupabaseConfig || !supabase)) {
      setErrors({ form: 'Doplň EXPO_PUBLIC_SUPABASE_URL a EXPO_PUBLIC_SUPABASE_ANON_KEY.' });
      return false;
    }

    if (!AUTH_FORM_VALIDATION_ENABLED) {
      setErrors({});
      return true;
    }
    const nextErrors: Partial<Record<FormField | 'form', string>> = {};
    for (const field of fields) {
      if (!field.multiline && !form[field.key].trim()) nextErrors[field.key] = 'Tohle pole je povinné.';
    }
    if (mode === 'register' && selectedRole === 'coach' && !form.fullName.trim()) nextErrors.fullName = 'Jméno a příjmení je povinné.';
    if (mode === 'forgot' && !looksLikeEmail(form.credential)) nextErrors.credential = 'Vyplň e-mail účtu.';
    if (form.password && form.password.length < 6) nextErrors.password = 'Heslo musí mít alespoň 6 znaků.';
    if ((mode === 'register' || mode === 'reset') && form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Hesla se neshodují.';
    if ((mode === 'register' || mode === 'reset') && form.password && passwordStrength(form.password) < 2) nextErrors.password = 'Použij silnější heslo.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function persistLocalProfile() {
    const profileDraft = {
      role: selectedRole,
      mode,
      credential: form.credential,
      fullName: form.fullName,
      phone: form.phone,
      createdAt: new Date().toISOString(),
    };

    try {
      if (staySignedIn) await AsyncStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profileDraft));
      else await AsyncStorage.removeItem(AUTH_PROFILE_KEY);
    } catch {
      // persistence is optional in prototype
    }
  }

  async function upsertAppProfile(userId: string, email: string | null, role: AppRole) {
    if (!supabase) return;

    const fullName = form.fullName.trim() || (role === 'coach' ? 'Trenér TeamVYS' : 'Učastník TeamVYS');
    const { error } = await supabase.from('app_profiles').upsert(
      {
        id: userId,
        role,
        name: fullName,
        email,
        phone: form.phone.trim() || null,
        bio: role === 'coach' ? form.coachMessage.trim() || null : null,
      },
      { onConflict: 'id' },
    );

    if (error) throw error;
  }

  async function upsertRoleProfile(userId: string, role: AppRole) {
    if (!supabase) return;

    if (role === 'coach') {
      const { error } = await supabase.from('coach_profiles').upsert(
        {
          id: userId,
          level: 1,
          xp: 0,
          next_level_xp: 500,
          qr_tricks_approved: 0,
          attendance_logged: 0,
          bonus_total: 0,
          assigned_courses: [],
        },
        { onConflict: 'id' },
      );
      if (error) throw error;
      return;
    }

    const [firstName, ...restName] = form.fullName.trim().split(/\s+/).filter(Boolean);
    const { error } = await supabase.from('participants').upsert(
      {
        id: userId,
        first_name: firstName || 'Účastník',
        last_name: restName.join(' ') || 'TeamVYS',
        date_of_birth: form.birthDate.trim() || null,
        birth_number_masked: form.birthNumber.trim() || null,
        parent_phone: form.phone.trim() || null,
        without_phone: !form.phone.trim(),
        paid_status: 'due',
        active_purchases: [],
      },
      { onConflict: 'id' },
    );
    if (error) throw error;
  }

  async function loadCoachApprovalStatus(userId: string): Promise<CoachApprovalStatus> {
    if (!supabase) return 'pending';

    const { data, error } = await supabase
      .from('coach_profiles')
      .select('approval_status')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    const status = data?.approval_status;
    return status === 'approved' || status === 'rejected' || status === 'suspended' || status === 'pending' ? status : 'pending';
  }

  async function stopPendingCoachSession() {
    if (supabase) await supabase.auth.signOut();
    await setRole(null);
    setPendingApproval(true);
  }

  async function sendPasswordReset() {
    if (!supabase) throw new Error('Supabase klient není nakonfigurovaný.');

    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/sign-in?mode=reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(form.credential.trim().toLowerCase(), { redirectTo });
    if (error) throw error;
    setErrors({ form: 'Obnovovací e-mail je odeslaný. Otevři odkaz a nastav nové heslo.' });
  }

  async function updatePassword() {
    if (!supabase) throw new Error('Supabase klient není nakonfigurovaný.');

    const { error } = await supabase.auth.updateUser({ password: form.password });
    if (error) throw error;
    await supabase.auth.signOut();
    setForm(emptyForm);
    setVisibleFields({});
    setMode('login');
    setErrors({ form: 'Heslo je změněné. Přihlas se novým heslem.' });
  }

  async function submitWithSupabase() {
    if (!supabase) throw new Error('Supabase klient není nakonfigurovaný.');

    const email = form.credential.trim();
    const password = form.password;
    const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/sign-in` : undefined;
    const authResult = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            role: selectedRole,
            name: form.fullName.trim(),
            phone: form.phone.trim(),
            birthDate: form.birthDate.trim(),
            coachMessage: form.coachMessage.trim(),
          },
        },
      });

    if (authResult.error) throw authResult.error;

    const user = authResult.data.user;
    if (!user) {
      setErrors({ form: 'Zkontroluj e-mail a potvrď registraci.' });
      return;
    }

    if (mode === 'register' && !authResult.data.session) {
      setErrors({ form: 'Registrace je založená. Zkontroluj e-mail a potvrď účet, potom se přihlas.' });
      return;
    }

    let resolvedRole = selectedRole;

    if (mode === 'login') {
      const { data: profile, error } = await supabase
        .from('app_profiles')
        .select('role,name')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (profile?.role === 'participant' || profile?.role === 'coach') {
        resolvedRole = profile.role;
        // Ensure participants/coach row exists (may be missing if email verification interrupted registration)
        if (profile.role === 'participant') {
          const { data: existingParticipant } = await supabase.from('participants').select('id').eq('id', user.id).maybeSingle();
          if (!existingParticipant) {
            const nameParts = (profile.name || '').trim().split(/\s+/);
            const firstName = nameParts[0] || 'Účastník';
            const lastName = nameParts.slice(1).join(' ') || 'TeamVYS';
            await supabase.from('participants').upsert(
              { id: user.id, first_name: firstName, last_name: lastName, paid_status: 'due', active_purchases: [], without_phone: true },
              { onConflict: 'id' }
            );
          }
        }
      } else if (profile?.role) {
        await supabase.auth.signOut();
        await setRole(null);
        setErrors({ form: 'Tenhle účet patří na webový profil. Pro appku použij účastnický nebo trenérský účet.' });
        return;
      } else {
        await upsertAppProfile(user.id, user.email ?? email, selectedRole);
      }
    } else {
      await upsertAppProfile(user.id, user.email ?? email, selectedRole);
      await upsertRoleProfile(user.id, selectedRole);

      if (selectedRole === 'coach') {
        await stopPendingCoachSession();
        return;
      }
    }

    if (resolvedRole === 'coach') {
      const approvalStatus = await loadCoachApprovalStatus(user.id);
      if (approvalStatus !== 'approved') {
        await stopPendingCoachSession();
        return;
      }
    }

    await persistLocalProfile();
    await setRole(resolvedRole, { remember: staySignedIn });
    router.replace(routeForRole(resolvedRole) as never);
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    if (DEV_BYPASS_AUTH && mode === 'register' && selectedRole === 'coach') {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubmitting(false);
      setPendingApproval(true);
      return;
    }

    try {
      if (!DEV_BYPASS_AUTH && hasSupabaseConfig && supabase) {
        if (mode === 'forgot') {
          await sendPasswordReset();
          return;
        }

        if (mode === 'reset') {
          await updatePassword();
          return;
        }

        await submitWithSupabase();
        return;
      }

      await persistLocalProfile();
      await setRole(selectedRole, { remember: staySignedIn });
      router.replace(selectedOption.route as never);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Přihlášení se nepovedlo.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]} keyboardShouldPersistTaps="handled">
      <FadeInUp>
        <View style={styles.shell}>
          <View style={[styles.formPanel, isDesktop && styles.formPanelDesktop]}>
            {pendingApproval ? (
              <PendingCard onGoToLogin={() => { setPendingApproval(false); setMode('login'); }} />
            ) : (
              <FadeInUp key={mode} duration={280} offset={10} style={styles.formInner}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>{mode === 'forgot' ? 'Obnova hesla' : mode === 'reset' ? 'Nové heslo' : mode === 'login' ? 'Přihlášení' : 'Registrace'}</Text>
                  <Text style={styles.formSubtitle}>
                    {mode === 'forgot'
                      ? 'pošleme bezpečný odkaz na e-mail účtu'
                      : mode === 'reset'
                        ? 'ulož nové heslo po otevření odkazu'
                        : `${selectedOption.title} · ${mode === 'login' ? 'pokračuj do svého prostoru' : 'vyplň údaje pro vytvoření účtu'}`}
                  </Text>
                </View>

                {mode === 'login' || mode === 'register' ? <View style={styles.modeSwitch}>
                  {(['login', 'register'] as const).map((item) => {
                    const active = mode === item;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => { setMode(item); setForm(emptyForm); setErrors({}); }}
                        style={({ pressed }: any) => [styles.modeButton, active && styles.modeButtonActive, pressed && styles.pressed]}
                      >
                        {active ? <LinearGradient colors={selectedOption.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
                        <Text style={[styles.modeText, active && styles.modeTextActive]}>{item === 'login' ? 'Přihlásit se' : 'Zaregistrovat'}</Text>
                      </Pressable>
                    );
                  })}
                </View> : null}

                {mode === 'login' || mode === 'register' ? <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Role</Text>
                <View style={styles.roleGrid}>
                  {ROLES.map((option) => {
                    const active = option.role === selectedRole;
                    return (
                      <Pressable
                        key={option.role}
                        onPress={() => { setSelectedRole(option.role); setForm(emptyForm); setErrors({}); }}
                        style={({ hovered, pressed }: any) => [
                          styles.roleButton,
                          active && styles.roleButtonActive,
                          hovered && !active && styles.roleButtonHover,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={[styles.roleIcon, active && styles.roleIconActive]}>
                          {active ? <LinearGradient colors={option.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
                          <MaterialCommunityIcons name={option.icon} size={22} color={active ? Brand.white : option.gradient[0]} />
                        </View>
                        <View style={styles.roleCopy}>
                          <Text style={styles.roleTitle}>{option.title}</Text>
                          <Text style={styles.roleSubtitle}>{option.subtitle}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                </View> : null}

                {DEV_BYPASS_AUTH ? null : (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionLabel}>Údaje</Text>
                    <View style={styles.fieldsGrid}>
                      {fields.map((field) => {
                        const focused = focusedField === field.key;
                        return (
                          <View key={field.key} style={[styles.fieldWrap, field.multiline && styles.fieldWrapFull]}>
                            <Text style={styles.label}>{field.label}</Text>
                            <View style={[styles.inputFrame, focused && styles.inputFrameFocused, errors[field.key] ? styles.inputFrameError : undefined]}>
                              <TextInput
                                value={form[field.key]}
                                onChangeText={(value) => updateField(field.key, value)}
                                onFocus={() => setFocusedField(field.key)}
                                onBlur={() => setFocusedField(null)}
                                placeholder={field.placeholder}
                                placeholderTextColor={Palette.textSubtle}
                                secureTextEntry={field.secure ? !visibleFields[field.key] : false}
                                keyboardType={field.keyboardType ?? 'default'}
                                autoCapitalize={field.keyboardType === 'email-address' ? 'none' : 'sentences'}
                                multiline={field.multiline}
                                numberOfLines={field.multiline ? 3 : 1}
                                style={[
                                  styles.input,
                                  field.multiline ? styles.inputMultiline : undefined,
                                  field.secure ? styles.inputWithToggle : undefined,
                                ]}
                              />
                              {field.secure ? (
                                <Pressable
                                  onPress={() => toggleFieldVisibility(field.key)}
                                  style={({ pressed }: any) => [styles.passwordToggle, pressed && styles.pressed]}
                                  accessibilityRole="button"
                                  accessibilityLabel={visibleFields[field.key] ? 'Skrýt heslo' : 'Zobrazit heslo'}
                                >
                                  <MaterialCommunityIcons name={visibleFields[field.key] ? 'eye-off-outline' : 'eye-outline'} size={21} color={Brand.inkSoft} />
                                </Pressable>
                              ) : null}
                            </View>
                            {errors[field.key] ? <Text style={styles.errorText}>{errors[field.key]}</Text> : null}
                          </View>
                        );
                      })}
                    </View>
                    {mode === 'register' || mode === 'reset' ? (
                      <View style={styles.passwordStrengthWrap}>
                        <View style={styles.passwordStrengthTrack}>
                          <LinearGradient colors={selectedOption.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.passwordStrengthFill, { width: `${Math.max(strength, 1) * 25}%` }]} />
                        </View>
                        <Text style={styles.passwordStrengthText}>{passwordStrengthLabel(strength)}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {DEV_BYPASS_AUTH || mode === 'forgot' || mode === 'reset' ? null : (
                  <Pressable
                    onPress={() => setStaySignedIn((value) => !value)}
                    style={({ pressed }: any) => [styles.rememberRow, pressed && styles.pressed]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: staySignedIn }}
                  >
                    <View style={[styles.checkbox, staySignedIn && styles.checkboxActive]}>
                      {staySignedIn ? <MaterialCommunityIcons name="check-bold" size={15} color={Brand.white} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rememberTitle}>Zůstat přihlášený</Text>
                      <Text style={styles.rememberText}>Po dalším spuštění půjdeš rovnou dovnitř.</Text>
                    </View>
                  </Pressable>
                )}

                {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

                <Pressable
                  onPress={submit}
                  disabled={submitting}
                  style={({ hovered, pressed }: any) => [
                    styles.submitButton,
                    hovered && styles.submitHover,
                    pressed && styles.submitPressed,
                    submitting && styles.submitDisabled,
                  ]}
                >
                  <LinearGradient colors={selectedOption.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  <MaterialCommunityIcons name={submitting ? 'loading' : 'arrow-right'} size={20} color={Brand.white} />
                  {submitting ? (
                    <PulseGlow scaleTo={1.02}>
                      <Text style={styles.submitText}>Odesílám...</Text>
                    </PulseGlow>
                  ) : (
                    <Text style={styles.submitText}>
                      {DEV_BYPASS_AUTH
                        ? `Otevřít jako ${selectedOption.title.toLowerCase()}`
                        : mode === 'forgot'
                          ? 'Poslat obnovovací e-mail'
                        : mode === 'reset'
                          ? 'Uložit nové heslo'
                        : mode === 'register' && selectedRole === 'coach'
                        ? 'Odeslat žádost o přístup'
                        : mode === 'login'
                          ? `Přihlásit se jako ${selectedOption.title.toLowerCase()}`
                          : `Zaregistrovat jako ${selectedOption.title.toLowerCase()}`}
                    </Text>
                  )}
                </Pressable>

                {!DEV_BYPASS_AUTH ? (
                  <View style={styles.authLinksRow}>
                    {mode === 'login' ? (
                      <Pressable onPress={() => { setMode('forgot'); setForm(emptyForm); setErrors({}); }} style={({ pressed }: any) => [styles.authLinkButton, pressed && styles.pressed]}>
                        <Text style={styles.authLinkText}>Zapomenuté heslo</Text>
                      </Pressable>
                    ) : null}
                    {mode === 'forgot' || mode === 'reset' ? (
                      <Pressable onPress={() => { setMode('login'); setForm(emptyForm); setErrors({}); setVisibleFields({}); }} style={({ pressed }: any) => [styles.authLinkButton, pressed && styles.pressed]}>
                        <Text style={styles.authLinkText}>Zpět na přihlášení</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </FadeInUp>
            )}
          </View>
        </View>
      </FadeInUp>
    </ScrollView>
  );
}

function StatPill({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <MaterialCommunityIcons name={icon} size={18} color={Brand.cyan} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const SKILL_ICONS: { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { icon: 'run-fast', color: '#14C8FF' },
  { icon: 'qrcode-scan', color: '#F12BB3' },
  { icon: 'star-shooting', color: '#FFB21A' },
  { icon: 'medal-outline', color: '#8B1DFF' },
  { icon: 'account-group-outline', color: '#00E5C0' },
  { icon: 'calendar-check-outline', color: '#FF6B35' },
];

function SkillShowcase() {
  return (
    <View style={styles.skillShowcase}>
      {SKILL_ICONS.map((item, i) => (
        <View key={i} style={[styles.skillBadge, { backgroundColor: item.color + '22' }]}>
          <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
        </View>
      ))}
    </View>
  );
}

function PendingCard({ onGoToLogin }: { onGoToLogin: () => void }) {
  return (
    <FadeInUp style={styles.pendingWrap}>
      <View style={styles.pendingIconWrap}>
        <MaterialCommunityIcons name="email-check-outline" size={42} color={Brand.purple} />
      </View>
      <Text style={styles.pendingTitle}>Žádost odeslána</Text>
      <Text style={styles.pendingText}>
        Admin tě brzy prověří a potvrdí přístup. Jakmile budeš schválený, dostaneš přihlašovací údaje e-mailem.
      </Text>
      <Pressable onPress={onGoToLogin} style={({ pressed }: any) => [styles.pendingBtn, pressed && styles.pressed]}>
        <LinearGradient colors={['#F12BB3', '#FFB21A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <Text style={styles.pendingBtnText}>Zpět na přihlášení</Text>
      </Pressable>
    </FadeInUp>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#F4F0E7' },
  container: { padding: Spacing.lg, paddingTop: 24, paddingBottom: 36, minHeight: '100%' },
  containerDesktop: { justifyContent: 'center' },
  shell: { width: '100%', maxWidth: 560, alignSelf: 'center' },

  stage: {
    minHeight: 330,
    borderRadius: 30,
    padding: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    ...Shadow.float,
  },
  stageMobile: { minHeight: 280, padding: Spacing.lg, borderRadius: 26 },
  stageDesktop: { flex: 0.9, minHeight: 650 },
  stagePattern: { ...StyleSheet.absoluteFillObject, opacity: 0.13 },
  stageLine: {
    position: 'absolute',
    width: 620,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.34)',
    transform: [{ rotate: '-18deg' }],
  },
  stageTopBar: { flexDirection: 'row', alignItems: 'center', gap: 10, position: 'relative', zIndex: 2 },
  markImage: { width: 34, height: 34 },
  brand: { color: Brand.white, fontWeight: '900', letterSpacing: 2, fontSize: 14 },
  brandHot: { color: Brand.pink },
  stageCopy: { marginTop: Spacing.xl, maxWidth: 390, position: 'relative', zIndex: 2 },
  stageCopyMobile: { marginTop: Spacing.lg, maxWidth: 330 },
  stageEyebrow: { color: Brand.lime, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
  stageTitle: { color: Brand.white, fontSize: 42, lineHeight: 46, fontWeight: '900', marginTop: 8 },
  stageSubtitle: { color: 'rgba(255,255,255,0.76)', fontSize: 15, lineHeight: 23, marginTop: 12 },
  skillShowcase: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingVertical: Spacing.xl, position: 'relative', zIndex: 2 },
  skillBadge: { width: 70, height: 70, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.1)' },
  stageStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, position: 'relative', zIndex: 2 },
  stageStatsMobile: { marginTop: Spacing.xl },
  statPill: {
    minWidth: 118,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  statValue: { color: Brand.white, fontSize: 15, fontWeight: '900', lineHeight: 18 },
  statLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  formPanel: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(23,18,32,0.08)',
    borderRadius: 30,
    backgroundColor: Brand.white,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadow.float,
  },
  formPanelDesktop: { justifyContent: 'center' },
  formInner: { gap: Spacing.lg },
  formHeader: { gap: 4 },
  formTitle: { color: Brand.ink, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  formSubtitle: { color: Brand.inkSoft, fontSize: 14, lineHeight: 20, fontWeight: '700' },

  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: Radius.lg,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(23,18,32,0.06)',
  },
  modeButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, overflow: 'hidden' },
  modeButtonActive: {},
  modeText: { color: Palette.textMuted, fontSize: 14, fontWeight: '900' },
  modeTextActive: { color: Brand.white },

  sectionBlock: { gap: Spacing.sm },
  sectionLabel: { color: Brand.ink, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  roleGrid: { flexDirection: 'row', gap: Spacing.sm },
  roleButton: {
    flex: 1,
    minHeight: 88,
    borderWidth: 1.5,
    borderColor: 'rgba(23,18,32,0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: '#FAFAFB',
    justifyContent: 'space-between',
  },
  roleButtonActive: { borderColor: Brand.ink, backgroundColor: Brand.white, ...Shadow.soft },
  roleButtonHover: { transform: [{ translateY: -2 }], ...Shadow.soft },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: 'rgba(23,18,32,0.07)',
  },
  roleIconActive: { borderColor: 'transparent' },
  roleCopy: { flex: 1, minWidth: 0 },
  roleTitle: { color: Brand.ink, fontWeight: '900', fontSize: 15, marginTop: 10 },
  roleSubtitle: { color: Brand.inkSoft, fontWeight: '800', fontSize: 11, lineHeight: 15, marginTop: 2 },

  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  fieldWrap: { flexGrow: 1, flexBasis: 220, gap: 6 },
  fieldWrapFull: { flexBasis: '100%' },
  label: { color: Brand.inkSoft, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  inputFrame: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(23,18,32,0.08)',
    backgroundColor: '#F8F8FA',
    overflow: 'hidden',
  },
  inputFrameFocused: { borderColor: Brand.ink, backgroundColor: Brand.white, ...Shadow.soft },
  inputFrameError: { borderColor: Palette.danger, backgroundColor: Palette.dangerSoft },
  input: {
    minHeight: 52,
    color: Brand.ink,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: 15,
    fontWeight: '800',
    outlineStyle: 'none' as never,
  },
  inputWithToggle: { paddingRight: 52 },
  passwordToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 50,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.sm },
  errorText: { color: Palette.danger, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  passwordStrengthWrap: { gap: 6, marginTop: Spacing.sm },
  passwordStrengthTrack: { height: 8, borderRadius: 999, backgroundColor: '#ECECF2', overflow: 'hidden' },
  passwordStrengthFill: { height: '100%', borderRadius: 999 },
  passwordStrengthText: { color: Brand.inkSoft, fontSize: 12, fontWeight: '800' },

  rememberRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(23,18,32,0.08)',
    backgroundColor: '#FAFAFB',
    padding: Spacing.md,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: Radius.sm, borderWidth: 1.5,
    borderColor: 'rgba(23,18,32,0.16)', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Brand.white,
  },
  checkboxActive: { backgroundColor: Brand.ink, borderColor: Brand.ink },
  rememberTitle: { color: Brand.ink, fontSize: 14, fontWeight: '900' },
  rememberText: { color: Brand.inkSoft, fontSize: 12, lineHeight: 17, marginTop: 1 },

  submitButton: {
    minHeight: 58,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
    ...Shadow.glow,
  },
  submitHover: { transform: [{ translateY: -2 }] },
  submitPressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  submitDisabled: { opacity: 0.76 },
  submitText: { color: Brand.white, fontSize: 15, fontWeight: '900' },
  authLinksRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm },
  authLinkButton: { minHeight: 38, justifyContent: 'center' },
  authLinkText: { color: Brand.purple, fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.86 },

  pendingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingVertical: Spacing.xl },
  pendingIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: Brand.purpleLight, alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { color: Brand.ink, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  pendingText: { color: Brand.inkSoft, fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 380 },
  pendingBtn: {
    minHeight: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', paddingHorizontal: Spacing.xl, alignSelf: 'center', ...Shadow.glow,
  },
  pendingBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});

