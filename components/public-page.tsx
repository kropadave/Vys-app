import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export const webColors = {
  paper: '#F7F5EF',
  panel: '#FFFFFF',
  ink: '#17211D',
  muted: '#6C756F',
  line: '#D7E0DA',
  sage: '#587D69',
  sageDark: '#2F5E4C',
  coral: '#E96D4C',
  blue: '#DCEBF2',
  yellow: '#F6D86B',
};

const navItems = [
  { label: 'Kroužky', href: '/krouzky' },
  { label: 'Tábory', href: '/tabory' },
  { label: 'Workshopy', href: '/workshopy' },
  { label: 'O nás', href: '/o-nas' },
  { label: 'Kontakty', href: '/kontakty' },
] as const;

type PublicPageProps = {
  children: React.ReactNode;
};

export function PublicPage({ children }: PublicPageProps) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.nav}>
        <Link href="/" style={styles.logo}>TEAMVYS</Link>
        <View style={styles.navLinks}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={styles.navItem}>
              {item.label}
            </Link>
          ))}
          <Link href="/sign-in" style={styles.login}>Přihlásit</Link>
        </View>
      </View>
      {children}
    </ScrollView>
  );
}

export function PageHero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroBody}>{body}</Text>
    </View>
  );
}

export function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: webColors.paper },
  content: { paddingBottom: 64 },
  nav: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: webColors.line,
    backgroundColor: webColors.panel,
    gap: 14,
  },
  logo: {
    color: webColors.ink,
    fontSize: 20,
    fontWeight: '900',
    textDecorationLine: 'none',
  },
  navLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  navItem: {
    color: webColors.muted,
    fontWeight: '700',
    fontSize: 13,
    textDecorationLine: 'none',
  },
  login: {
    color: webColors.panel,
    backgroundColor: webColors.sageDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '900',
    textDecorationLine: 'none',
  },
  hero: { padding: 28, gap: 12 },
  eyebrow: { color: webColors.coral, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  heroTitle: { color: webColors.ink, fontSize: 42, lineHeight: 48, fontWeight: '900', maxWidth: 760 },
  heroBody: { color: webColors.muted, fontSize: 17, lineHeight: 25, maxWidth: 760 },
  section: { paddingHorizontal: 22, paddingVertical: 24, gap: 14 },
  sectionHead: { gap: 8, paddingHorizontal: 22, paddingTop: 16 },
  sectionTitle: { color: webColors.ink, fontSize: 30, fontWeight: '900' },
  sectionBody: { color: webColors.muted, fontSize: 16, lineHeight: 24, maxWidth: 760 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: webColors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: webColors.line,
    padding: 18,
    gap: 8,
    flexBasis: 250,
    flexGrow: 1,
  },
  accentCard: {
    backgroundColor: webColors.yellow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2C65D',
    padding: 18,
    gap: 8,
    flexBasis: 300,
    flexGrow: 1,
  },
  label: { color: webColors.sageDark, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: webColors.ink, fontSize: 20, fontWeight: '900' },
  meta: { color: webColors.muted, fontSize: 14, lineHeight: 20 },
  price: { color: webColors.ink, fontSize: 16, fontWeight: '900' },
  split: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoBlock: {
    backgroundColor: webColors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: webColors.line,
    padding: 18,
    gap: 10,
    flexBasis: 320,
    flexGrow: 1,
  },
  smallTitle: { color: webColors.ink, fontSize: 18, fontWeight: '900' },
  listItem: { color: webColors.muted, fontSize: 14, lineHeight: 21 },
  emptyBox: {
    height: 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: webColors.line,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});

export const publicStyles = styles;
