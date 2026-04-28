import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CatLogo } from '@/components/icons/CatMascot';

export const WebColors = {
  bg: '#07110D',
  panel: '#0D1B14',
  panel2: '#12241A',
  line: '#234331',
  line2: '#315742',
  ink: '#F4FFF8',
  muted: '#CFE8D7',
  dim: '#809184',
  lime: '#B5FF72',
  orange: '#FFB85C',
  paper: '#F4FFF8',
  paperLine: '#D6EAD7',
  paperText: '#08110D',
};

export function WebPage({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.shell}>
        <WebNav />
        {children}
        <WebFooter />
      </View>
    </ScrollView>
  );
}

export function WebNav() {
  return (
    <View style={styles.nav}>
      <Link href="/" style={styles.brand}>
        <View style={styles.brandInner}>
          <CatLogo size={34} />
          <Text style={styles.brandText}>TEAMVYS</Text>
        </View>
      </Link>
      <View style={styles.links}>
        <Link href="/krouzky" style={styles.navPill}>Kroužky</Link>
        <Link href="/tabory" style={styles.navPill}>Tábory</Link>
        <Link href="/workshopy" style={styles.navPill}>Workshopy</Link>
        <Link href="/kontakt" style={styles.navPill}>Kontakt</Link>
        <Link href="/sign-in" style={styles.loginPill}>Přihlášení</Link>
      </View>
    </View>
  );
}

export function WebFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerBrand}>TEAMVYS</Text>
      <Text style={styles.footerText}>info@teamvys.cz · 605 324 417 · Instagram · YouTube · Facebook</Text>
    </View>
  );
}

export function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: WebColors.bg },
  scroll: { flexGrow: 1 },
  shell: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 18, gap: 24 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, gap: 12, flexWrap: 'wrap',
  },
  brand: { textDecorationLine: 'none' },
  brandInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { color: WebColors.ink, fontWeight: '900', letterSpacing: 0, fontSize: 18 },
  links: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  navPill: {
    color: WebColors.muted, fontWeight: '700', borderWidth: 1, borderColor: WebColors.line,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: WebColors.panel,
    textDecorationLine: 'none',
  },
  loginPill: {
    color: WebColors.paperText, fontWeight: '900', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, backgroundColor: WebColors.lime, textDecorationLine: 'none',
  },
  footer: {
    borderTopWidth: 1, borderTopColor: WebColors.line, paddingTop: 18, paddingBottom: 28,
    flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
  },
  footerBrand: { color: WebColors.ink, fontWeight: '900' },
  footerText: { color: WebColors.dim },
  sectionHeader: { gap: 6, maxWidth: 760 },
  eyebrow: { color: WebColors.lime, fontWeight: '900', textTransform: 'uppercase', fontSize: 12, letterSpacing: 0 },
  title: { color: WebColors.ink, fontWeight: '900', fontSize: 34, lineHeight: 38 },
  body: { color: WebColors.muted, fontSize: 16, lineHeight: 24 },
});
