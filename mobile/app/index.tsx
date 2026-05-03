import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PublicPage, webColors } from '@/components/public-page';

const routes = [
  { title: 'Kroužky', body: 'Lokality, časy a ceny parkour kroužků.', href: '/krouzky' },
  { title: 'Tábory', body: 'Příměstské tábory, ceny, program a typický den.', href: '/tabory' },
  { title: 'Workshopy', body: 'Sekce je připravená, obsah doplníme později.', href: '/workshopy' },
  { title: 'O nás', body: 'Kdo je TeamVYS a co dělá.', href: '/o-nas' },
  { title: 'Kontakty', body: 'Telefon, e-mail a fakturační údaje.', href: '/kontakty' },
] as const;

export default function HomePage() {
  return (
    <PublicPage>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Parkour kroužky pro děti</Text>
        <Text style={styles.title}>S poskokem, k dovednostem.</Text>
        <Text style={styles.body}>
          TeamVYS je místo, kde děti získají odvahu, koordinaci a kamarády - v bezpečí a v tempu, které jim sedí.
        </Text>
      </View>

      <View style={styles.grid}>
        {routes.map((route) => (
          <Link key={route.href} href={route.href} style={styles.card}>
            <Text style={styles.cardTitle}>{route.title}</Text>
            <Text style={styles.cardBody}>{route.body}</Text>
            <Text style={styles.open}>Otevřít</Text>
          </Link>
        ))}
      </View>
    </PublicPage>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 28, paddingBottom: 18, gap: 12 },
  kicker: { color: webColors.coral, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  title: { color: webColors.ink, fontSize: 44, lineHeight: 48, fontWeight: '900', maxWidth: 760 },
  body: { color: webColors.muted, fontSize: 17, lineHeight: 25, maxWidth: 760 },
  grid: { paddingHorizontal: 22, paddingVertical: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: webColors.panel,
    borderColor: webColors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    flexBasis: 250,
    flexGrow: 1,
    gap: 8,
    textDecorationLine: 'none',
  },
  cardTitle: { color: webColors.ink, fontSize: 20, fontWeight: '900' },
  cardBody: { color: webColors.muted, fontSize: 14, lineHeight: 20 },
  open: { color: webColors.sageDark, fontSize: 13, fontWeight: '900', marginTop: 6 },
});
