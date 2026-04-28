import { Link } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { LockedBuyButton } from '@/components/locked-buy-button';
import { aboutText, campIncludes, campSchedule, camps, contacts, courses } from '@/lib/public-content';

const colors = {
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

export default function PublicWebsite() {
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});

  function scrollTo(section: string) {
    const y = sectionY.current[section] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
  }

  return (
    <ScrollView ref={scrollRef} style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.nav}>
        <Text style={styles.logo}>TEAMVYS</Text>
        <View style={styles.navLinks}>
          <NavItem label="Kroužky" onPress={() => scrollTo('krouzky')} />
          <NavItem label="Tábory" onPress={() => scrollTo('tabory')} />
          <NavItem label="Workshopy" onPress={() => scrollTo('workshopy')} />
          <NavItem label="O nás" onPress={() => scrollTo('onas')} />
          <NavItem label="Kontakty" onPress={() => scrollTo('kontakty')} />
          <Link href="/sign-in" style={styles.login}>Přihlásit</Link>
        </View>
      </View>

      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={styles.heroText}>
          <Text style={styles.kicker}>Parkour kroužky pro děti</Text>
          <Text style={styles.heroTitle}>S poskokem, k dovednostem.</Text>
          <Text style={styles.heroBody}>
            TeamVYS je místo, kde děti získají odvahu, koordinaci a kamarády - v bezpečí a v tempu, které jim sedí.
          </Text>
        </View>
        <View style={styles.heroPanel}>
          <Text style={styles.panelNumber}>3</Text>
          <Text style={styles.panelText}>Bezpečný postup · Rychlý progres · Více měst</Text>
        </View>
      </View>

      <Section id="krouzky" onMeasure={(id, y) => (sectionY.current[id] = y)} title="Kroužky" eyebrow="Přehled kroužků" body="Vyberte si svou lokalitu. Staňte se součástí parkourové komunity. Trénujeme na nejlepších místech v Česku, s profíky a v bezpečí.">
        <View style={[styles.cardGrid, wide && styles.cardGridWide]}>
          {courses.map((course) => (
            <View key={`${course.city}-${course.venue}`} style={styles.card}>
              <Text style={styles.city}>{course.city}</Text>
              <Text style={styles.cardTitle}>{course.venue}</Text>
              <Text style={styles.meta}>{course.day} · {course.from} - {course.to}</Text>
              <Text style={styles.price}>{course.price}</Text>
              <LockedBuyButton />
            </View>
          ))}
        </View>
      </Section>

      <Section id="tabory" onMeasure={(id, y) => (sectionY.current[id] = y)} title="Tábory" eyebrow="Příměstské tábory" body="Nezapomenutelný týden, kde se parkour potkává s komunitou a novými výzvy.">
        <View style={[styles.cardGrid, wide && styles.cardGridWide]}>
          {camps.map((camp) => (
            <View key={camp.place} style={styles.cardAccent}>
              <Text style={styles.city}>{camp.place}</Text>
              <Text style={styles.cardTitle}>{camp.venue}</Text>
              <Text style={styles.meta}>{camp.season}</Text>
              <Text style={styles.price}>{camp.price}</Text>
              <LockedBuyButton />
            </View>
          ))}
        </View>

        <View style={[styles.split, wide && styles.splitWide]}>
          <View style={styles.infoBlock}>
            <Text style={styles.smallTitle}>Co tábory zahrnují?</Text>
            {campIncludes.map((item) => <Text key={item} style={styles.listItem}>• {item}</Text>)}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.smallTitle}>Typický den tábora</Text>
            {campSchedule.map((item) => (
              <View key={item.time} style={styles.scheduleRow}>
                <Text style={styles.time}>{item.time}</Text>
                <Text style={styles.scheduleTitle}>{item.title}</Text>
                <Text style={styles.meta}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </Section>

      <Section id="workshopy" onMeasure={(id, y) => (sectionY.current[id] = y)} title="Workshopy" eyebrow="Speciální výuka" body="">
        <View style={styles.emptyBox} />
      </Section>

      <Section id="onas" onMeasure={(id, y) => (sectionY.current[id] = y)} title="O nás" eyebrow="TeamVYS" body={aboutText}>
        <View style={styles.aboutBand}>
          <Text style={styles.aboutTag}>Učíme parkour</Text>
          <Text style={styles.aboutTag}>Pořádáme tábory</Text>
          <Text style={styles.aboutTag}>Tvoříme zážitky</Text>
        </View>
      </Section>

      <Section id="kontakty" onMeasure={(id, y) => (sectionY.current[id] = y)} title="Kontakty" eyebrow="Spojení" body="">
        <View style={[styles.contactGrid, wide && styles.contactGridWide]}>
          <Contact label="Telefon" value={contacts.phone} />
          <Contact label="E-mail" value={contacts.email} />
          <Contact label="IČO" value={contacts.ico} />
          <Contact label="AirBank" value={contacts.bank} />
          <Contact label="Socky" value={contacts.social.join(' · ')} />
        </View>
      </Section>
    </ScrollView>
  );
}

function NavItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.65 }]}>
      <Text style={styles.navItem}>{label}</Text>
    </Pressable>
  );
}

function Section({
  id,
  title,
  eyebrow,
  body,
  children,
  onMeasure,
}: {
  id: string;
  title: string;
  eyebrow: string;
  body: string;
  children: React.ReactNode;
  onMeasure: (id: string, y: number) => void;
}) {
  return (
    <View style={styles.section} onLayout={(event) => onMeasure(id, event.nativeEvent.layout.y)}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
      {children}
    </View>
  );
}

function Contact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.contactCard}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.paper },
  pageContent: { paddingBottom: 64 },
  nav: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.panel,
    gap: 14,
  },
  logo: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  navLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  navItem: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  login: {
    color: colors.panel,
    backgroundColor: colors.sageDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '900',
    textDecorationLine: 'none',
  },
  hero: { padding: 22, gap: 18 },
  heroWide: { flexDirection: 'row', alignItems: 'stretch', padding: 40 },
  heroText: { flex: 1, gap: 12 },
  kicker: { color: colors.coral, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  heroTitle: { color: colors.ink, fontSize: 44, lineHeight: 48, fontWeight: '900' },
  heroBody: { color: colors.muted, fontSize: 17, lineHeight: 25, maxWidth: 660 },
  heroPanel: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    padding: 24,
    justifyContent: 'space-between',
    minHeight: 190,
    flex: 0.72,
    borderWidth: 1,
    borderColor: colors.line,
  },
  panelNumber: { color: colors.sageDark, fontSize: 74, fontWeight: '900' },
  panelText: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  section: { paddingHorizontal: 22, paddingVertical: 34, gap: 14 },
  sectionEyebrow: { color: colors.sage, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  sectionTitle: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  sectionBody: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 760 },
  cardGrid: { gap: 12 },
  cardGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 8,
    flexBasis: 250,
    flexGrow: 1,
  },
  cardAccent: {
    backgroundColor: colors.yellow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2C65D',
    padding: 18,
    gap: 8,
    flexBasis: 300,
    flexGrow: 1,
  },
  city: { color: colors.sageDark, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  price: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  split: { gap: 12, marginTop: 12 },
  splitWide: { flexDirection: 'row' },
  infoBlock: {
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 10,
    flex: 1,
  },
  smallTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  listItem: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  scheduleRow: { gap: 3, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  time: { color: colors.coral, fontSize: 12, fontWeight: '900' },
  scheduleTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  emptyBox: {
    height: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  aboutBand: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  aboutTag: {
    backgroundColor: colors.blue,
    color: colors.sageDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '900',
  },
  contactGrid: { gap: 10 },
  contactGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  contactCard: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 5,
    flexBasis: 220,
    flexGrow: 1,
  },
  contactLabel: { color: colors.muted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  contactValue: { color: colors.ink, fontSize: 16, fontWeight: '800' },
});
