import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';

import { AnimatedCatMascot, CatLogo } from '@/components/icons/CatMascot';
import {
    ArrowRightIcon,
    BoltIcon,
    CheckIcon,
    HourglassIcon,
    ParkourIcon,
    TargetIcon,
} from '@/components/icons/Icon3D';
import { useRole, type AppRole } from '@/hooks/use-role';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';

type RoleOption = {
  role: AppRole;
  title: string;
  kicker: string;
  body: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'parent',
    title: 'Rodič',
    kicker: 'Rezervace, platby, děti',
    body: 'Přehled přihlášek, správa účastníků, kroužky, tábory a stav plateb.',
  },
  {
    role: 'participant',
    title: 'Účastník',
    kicker: 'Skill tree, XP, náramky',
    body: 'Osobní cesta parkourem, odemčené triky, odznaky a vlastní progres.',
  },
  {
    role: 'coach',
    title: 'Trenér',
    kicker: 'Docházka, QR, svěřenci',
    body: 'Dnešní skupiny, NFC/QR docházka, odemykání triků a výplaty.',
  },
];

const TEAMVYS_FACTS = [
  { label: 'Kroužky', value: 'od 1790 Kč', detail: 'Blansko, Brandýs, Jeseník, Vyškov' },
  { label: 'Tábory', value: 'od 3300 Kč', detail: 'Vyškov a Veliny, léto 2026' },
  { label: 'Workshopy', value: '790 Kč', detail: '4hodinové bloky pro konkrétní dovednosti' },
];

const PROGRAMS = [
  {
    title: 'Parkour kroužky',
    body: 'Bezpečný postup, rychlý progres a komunita dětí ve více městech.',
    meta: 'od 1790 Kč',
  },
  {
    title: 'Příměstské tábory',
    body: 'Týden pohybu, obědy, svačiny, tričko, certifikovaní trenéři a bohatý program.',
    meta: 'Veliny / Vyškov',
  },
  {
    title: 'Parkour workshopy',
    body: 'Úzké zaměření na věci, které se na kroužku nestihnou: salta, wall triky, flow.',
    meta: '4 hodiny',
  },
];

function routeForRole(role: AppRole) {
  if (role === 'coach') return '/(coach)';
  if (role === 'parent') return '/(parent)';
  return '/home';
}

export default function SignInScreen() {
  const { role, setRole } = useRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  async function chooseRole(r: AppRole) {
    await setRole(r);
  }

  async function enterRole(r: AppRole) {
    await setRole(r);
    router.replace(routeForRole(r));
  }

  async function signIn() {
    if (DEV_BYPASS_AUTH) {
      await enterRole(role);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Přihlášení selhalo', error.message);
      return;
    }
    router.replace(routeForRole(role));
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert('Registrace selhala', error.message);
    else Alert.alert('Hotovo', 'Zkontroluj e-mail pro potvrzení účtu.');
  }

  const activeOption = ROLE_OPTIONS.find((option) => option.role === role) ?? ROLE_OPTIONS[1];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View style={styles.nav}>
            <View style={styles.brand}>
              <CatLogo size={34} />
              <Text style={styles.brandText}>TEAMVYS</Text>
            </View>
            <View style={styles.navPills}>
              <Link href="/krouzky" style={styles.navPill}>Kroužky</Link>
              <Link href="/tabory" style={styles.navPill}>Tábory</Link>
              <Link href="/workshopy" style={styles.navPill}>Workshopy</Link>
              <Link href="/kontakt" style={styles.navPill}>Kontakt</Link>
            </View>
          </View>

          <View style={[styles.hero, wide && styles.heroWide]}>
            <View style={[styles.heroCopy, wide && styles.heroCopyWide]}>
              <Text style={styles.kicker}>Parkour kroužky pro děti</Text>
              <Text style={styles.h1}>S poskokem k dovednostem.</Text>
              <Text style={styles.lead}>
                TeamVYS vede děti k odvaze, koordinaci a kamarádům. Bezpečně,
                postupně a s gamifikací přes skill tree, náramky a odznaky.
              </Text>

              <View style={styles.heroActions}>
                <Pressable style={styles.primaryBtn} onPress={signIn} disabled={loading}>
                  <Text style={styles.primaryBtnText}>Vstoupit jako {activeOption.title.toLowerCase()}</Text>
                  <ArrowRightIcon tint="#08110D" />
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => enterRole('participant')}>
                  <Text style={styles.secondaryBtnText}>Ukázat účastníka</Text>
                </Pressable>
              </View>

              <View style={styles.factRow}>
                {TEAMVYS_FACTS.map((fact) => (
                  <View key={fact.label} style={styles.factCard}>
                    <Text style={styles.factLabel}>{fact.label}</Text>
                    <Text style={styles.factValue}>{fact.value}</Text>
                    <Text style={styles.factDetail}>{fact.detail}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.loginPanel, wide && styles.loginPanelWide]}>
              <View style={styles.mascotOrbit}>
                <AnimatedCatMascot size={168} />
              </View>
              <Text style={styles.panelTitle}>Vyber svůj vstup</Text>
              <Text style={styles.panelSub}>Každá role má vlastní dashboard a nástroje.</Text>

              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((option) => (
                  <RoleCard
                    key={option.role}
                    option={option}
                    active={role === option.role}
                    onPress={() => chooseRole(option.role)}
                    onEnter={() => enterRole(option.role)}
                  />
                ))}
              </View>

              <View style={styles.formBox}>
                <Text style={styles.formLabel}>Přihlášení</Text>
                <TextInput
                  style={styles.input}
                  placeholder={role === 'coach' ? 'Trenérský e-mail' : 'E-mail'}
                  placeholderTextColor="#809184"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Heslo"
                  placeholderTextColor="#809184"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable style={[styles.loginBtn, loading && { opacity: 0.6 }]} onPress={signIn} disabled={loading}>
                  <Text style={styles.loginBtnText}>
                    {DEV_BYPASS_AUTH ? 'Demo vstup' : `Přihlásit: ${activeOption.title}`}
                  </Text>
                </Pressable>
                <Pressable onPress={signUp} disabled={loading}>
                  <Text style={styles.createAccount}>Vytvořit účet</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.programSection}>
            <View>
              <Text style={styles.sectionKicker}>Program</Text>
              <Text style={styles.sectionTitle}>Co najdeš v TeamVYS</Text>
            </View>
            <View style={[styles.programGrid, wide && styles.programGridWide]}>
              {PROGRAMS.map((program, index) => (
                <ProgramCard key={program.title} program={program} index={index} />
              ))}
            </View>
          </View>

          <View style={[styles.featureBand, wide && styles.featureBandWide]}>
            <Feature icon={<CheckIcon size={28} />} title="Bezpečný postup" body="Děti postupují po zvládnutí základů, ne podle tlaku okolí." />
            <Feature icon={<TargetIcon size={28} />} title="Skill tree" body="Triky, workshopy a náramky na sebe navazují jako herní cesta." />
            <Feature icon={<HourglassIcon size={28} />} title="Přehled pro rodiče" body="Přihlášky, termíny, platby a progres dítěte na jednom místě." />
            <Feature icon={<BoltIcon size={28} />} title="Trenérské nástroje" body="Docházka přes NFC/QR, rychlé potvrzení triků a přehled skupin." />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>TEAMVYS</Text>
            <Text style={styles.footerText}>info@teamvys.cz · 605 324 417 · Instagram · YouTube · Facebook</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleCard({
  option,
  active,
  onPress,
  onEnter,
}: {
  option: RoleOption;
  active: boolean;
  onPress: () => void;
  onEnter: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.roleCard, active && styles.roleCardActive]}>
      <View style={styles.roleTopLine}>
        <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{option.title}</Text>
        <View style={[styles.roleDot, active && styles.roleDotActive]} />
      </View>
      <Text style={[styles.roleKicker, active && styles.roleKickerActive]}>{option.kicker}</Text>
      <Text style={styles.roleBody}>{option.body}</Text>
      <Pressable onPress={onEnter} style={[styles.roleEnter, active && styles.roleEnterActive]}>
        <Text style={[styles.roleEnterText, active && styles.roleEnterTextActive]}>Otevřít sekci</Text>
      </Pressable>
    </Pressable>
  );
}

function ProgramCard({ program, index }: { program: (typeof PROGRAMS)[number]; index: number }) {
  const Icon = index === 0 ? ParkourIcon : index === 1 ? TargetIcon : BoltIcon;
  return (
    <View style={styles.programCard}>
      <View style={styles.programIcon}><Icon size={30} /></View>
      <Text style={styles.programMeta}>{program.meta}</Text>
      <Text style={styles.programTitle}>{program.title}</Text>
      <Text style={styles.programBody}>{program.body}</Text>
    </View>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07110D' },
  scroll: { flexGrow: 1 },
  shell: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 18, gap: 24 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { color: '#F4FFF8', fontWeight: '900', letterSpacing: 0, fontSize: 18 },
  navPills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  navPill: {
    color: '#CFE8D7', fontWeight: '700', borderWidth: 1, borderColor: '#234331',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#0D1B14',
  },

  hero: { gap: 18 },
  heroWide: { flexDirection: 'row', alignItems: 'stretch' },
  heroCopy: {
    backgroundColor: '#0D1B14', borderWidth: 1, borderColor: '#234331', borderRadius: 30,
    padding: 22, overflow: 'hidden',
  },
  heroCopyWide: { flex: 1.05, padding: 34 },
  kicker: { color: '#B5FF72', fontWeight: '900', textTransform: 'uppercase', fontSize: 12, letterSpacing: 0 },
  h1: { color: '#F4FFF8', fontSize: 48, lineHeight: 52, fontWeight: '900', marginTop: 14, maxWidth: 620 },
  lead: { color: '#CFE8D7', fontSize: 17, lineHeight: 25, marginTop: 14, maxWidth: 650 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#B5FF72',
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 999,
  },
  primaryBtnText: { color: '#08110D', fontWeight: '900' },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#315742', paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 999, backgroundColor: '#12241A',
  },
  secondaryBtnText: { color: '#F4FFF8', fontWeight: '800' },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 26 },
  factCard: {
    flexGrow: 1, flexBasis: 170, backgroundColor: '#08110D', borderRadius: 22,
    borderWidth: 1, borderColor: '#24452F', padding: 14,
  },
  factLabel: { color: '#809184', fontWeight: '800', fontSize: 12 },
  factValue: { color: '#FFB85C', fontWeight: '900', fontSize: 22, marginTop: 4 },
  factDetail: { color: '#CFE8D7', marginTop: 5, fontSize: 12, lineHeight: 17 },

  loginPanel: {
    backgroundColor: '#F4FFF8', borderRadius: 30, padding: 18, gap: 14,
    borderWidth: 1, borderColor: '#D6EAD7',
  },
  loginPanelWide: { flex: 0.95, padding: 22 },
  mascotOrbit: {
    alignSelf: 'center', width: 210, height: 160, alignItems: 'center', justifyContent: 'center',
    borderRadius: 32, backgroundColor: '#08110D', overflow: 'hidden',
  },
  panelTitle: { color: '#08110D', fontSize: 24, fontWeight: '900' },
  panelSub: { color: '#506454', marginTop: -8 },
  roleGrid: { gap: 10 },
  roleCard: {
    borderWidth: 1, borderColor: '#D6EAD7', backgroundColor: '#FFFFFF', borderRadius: 20,
    padding: 14, gap: 6,
  },
  roleCardActive: { backgroundColor: '#08110D', borderColor: '#B5FF72' },
  roleTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleTitle: { color: '#08110D', fontWeight: '900', fontSize: 18 },
  roleTitleActive: { color: '#F4FFF8' },
  roleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D6EAD7' },
  roleDotActive: { backgroundColor: '#B5FF72' },
  roleKicker: { color: '#4B8F5B', fontWeight: '800', fontSize: 12 },
  roleKickerActive: { color: '#B5FF72' },
  roleBody: { color: '#748077', fontSize: 12, lineHeight: 17 },
  roleEnter: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
    backgroundColor: '#EDF7EF', marginTop: 4,
  },
  roleEnterActive: { backgroundColor: '#B5FF72' },
  roleEnterText: { color: '#315742', fontWeight: '800', fontSize: 12 },
  roleEnterTextActive: { color: '#08110D' },
  formBox: { gap: 10, marginTop: 2 },
  formLabel: { color: '#08110D', fontWeight: '900' },
  input: {
    backgroundColor: '#EDF7EF', borderWidth: 1, borderColor: '#D6EAD7', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#08110D',
  },
  loginBtn: { backgroundColor: '#FFB85C', alignItems: 'center', borderRadius: 999, paddingVertical: 14 },
  loginBtnText: { color: '#2A1700', fontWeight: '900' },
  createAccount: { textAlign: 'center', color: '#315742', fontWeight: '800', paddingVertical: 4 },

  programSection: { gap: 14 },
  sectionKicker: { color: '#B5FF72', fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  sectionTitle: { color: '#F4FFF8', fontWeight: '900', fontSize: 28, marginTop: 4 },
  programGrid: { gap: 12 },
  programGridWide: { flexDirection: 'row' },
  programCard: {
    flex: 1, backgroundColor: '#F4FFF8', borderRadius: 26, padding: 18, gap: 8,
  },
  programIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#E6F8E9',
    alignItems: 'center', justifyContent: 'center',
  },
  programMeta: { color: '#4B8F5B', fontWeight: '900', fontSize: 12, marginTop: 4 },
  programTitle: { color: '#08110D', fontWeight: '900', fontSize: 20 },
  programBody: { color: '#506454', lineHeight: 20 },

  featureBand: {
    gap: 10, backgroundColor: '#0D1B14', borderRadius: 30, borderWidth: 1,
    borderColor: '#234331', padding: 16,
  },
  featureBandWide: { flexDirection: 'row' },
  featureItem: { flex: 1, gap: 8, padding: 10 },
  featureIcon: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#14281D',
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { color: '#F4FFF8', fontWeight: '900', fontSize: 16 },
  featureBody: { color: '#B7CDBE', lineHeight: 19 },

  footer: {
    borderTopWidth: 1, borderTopColor: '#234331', paddingTop: 18, paddingBottom: 28,
    flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
  },
  footerBrand: { color: '#F4FFF8', fontWeight: '900' },
  footerText: { color: '#809184' },
});
