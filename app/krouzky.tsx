import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ChildIcon, CoinIcon, ParkourIcon, PinIcon } from '@/components/icons/Icon3D';
import { SectionHeader, WebColors, WebPage } from '@/components/public/WebChrome';
import type { Krouzek } from '@/lib/data/mock';
import { PUBLIC_KROUZKY } from '@/lib/data/public-web';

export default function PublicKrouzkyScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const byCity = PUBLIC_KROUZKY.reduce<Record<string, Krouzek[]>>((acc, item) => {
    (acc[item.city] ??= []).push(item);
    return acc;
  }, {});

  return (
    <WebPage>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Přehled kroužků</Text>
          <Text style={styles.h1}>Vyberte si svoji lokalitu.</Text>
          <Text style={styles.lead}>
            Staňte se součástí parkourové komunity. Trénujeme na nejlepších místech
            v Česku, s profíky a v bezpečí.
          </Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroMetric}>od 1790 Kč</Text>
          <Text style={styles.heroMeta}>aktuální kroužky TeamVYS</Text>
        </View>
      </View>

      <SectionHeader
        eyebrow="Lokality"
        title="Kroužky po ČR"
        body="Data vycházejí z aktuální nabídky teamvys.cz. Detail a rezervaci otevřeš na původní stránce."
      />

      <View style={styles.cityGrid}>
        {Object.entries(byCity).map(([city, items]) => (
          <View key={city} style={styles.cityBlock}>
            <View style={styles.cityHeader}>
              <PinIcon size={24} />
              <Text style={styles.cityTitle}>{city}</Text>
            </View>
            {items.map((item) => (
              <KrouzekCard key={item.id} item={item} />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.infoBand}>
        <Text style={styles.infoTitle}>Potřebujete přidat dítě?</Text>
        <Text style={styles.infoBody}>
          Pro zápis je potřeba mít dítě přidané v rodičovském profilu. V aplikaci
          pak uvidíte přihlášky, platby i průběžný progres.
        </Text>
      </View>
    </WebPage>
  );
}

function KrouzekCard({ item }: { item: Krouzek }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}><ParkourIcon size={34} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.venue}</Text>
          <Text style={styles.cardMeta}>{item.day} · {item.timeFrom}–{item.timeTo}</Text>
        </View>
      </View>
      <View style={styles.tags}>
        <Tag icon={<ChildIcon size={14} />} label={item.ageGroup} />
        <Tag icon={<CoinIcon size={14} />} label={`od ${item.priceFrom} Kč`} accent />
        {item.isOpen && <Tag label="Otevřeno" />}
      </View>
      <Pressable style={styles.button} onPress={() => Linking.openURL(item.url)}>
        <Text style={styles.buttonText}>Zjistit víc</Text>
      </Pressable>
    </View>
  );
}

function Tag({ label, icon, accent }: { label: string; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <View style={[styles.tag, accent && styles.tagAccent]}>
      {icon}
      <Text style={[styles.tagText, accent && styles.tagTextAccent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 16, backgroundColor: WebColors.panel, borderWidth: 1, borderColor: WebColors.line,
    borderRadius: 30, padding: 24,
  },
  heroWide: { flexDirection: 'row', alignItems: 'center' },
  kicker: { color: WebColors.lime, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  h1: { color: WebColors.ink, fontSize: 44, lineHeight: 48, fontWeight: '900', marginTop: 10 },
  lead: { color: WebColors.muted, fontSize: 16, lineHeight: 24, marginTop: 10, maxWidth: 680 },
  heroCard: {
    minWidth: 220, backgroundColor: WebColors.paper, borderRadius: 24, padding: 18,
    borderWidth: 1, borderColor: WebColors.paperLine,
  },
  heroMetric: { color: WebColors.paperText, fontWeight: '900', fontSize: 30 },
  heroMeta: { color: '#506454', marginTop: 4, fontWeight: '700' },
  cityGrid: { gap: 16 },
  cityBlock: { gap: 10 },
  cityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityTitle: { color: WebColors.ink, fontWeight: '900', fontSize: 22 },
  card: {
    backgroundColor: WebColors.paper, borderRadius: 24, padding: 16, gap: 12,
    borderWidth: 1, borderColor: WebColors.paperLine,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#E6F8E9', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: WebColors.paperText, fontSize: 18, fontWeight: '900' },
  cardMeta: { color: '#506454', marginTop: 2, fontWeight: '700' },
  tags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDF7EF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  tagAccent: { backgroundColor: WebColors.orange },
  tagText: { color: '#315742', fontWeight: '900', fontSize: 12 },
  tagTextAccent: { color: '#2A1700' },
  button: { alignSelf: 'flex-start', backgroundColor: WebColors.lime, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  buttonText: { color: WebColors.paperText, fontWeight: '900' },
  infoBand: { backgroundColor: WebColors.panel2, borderRadius: 26, borderWidth: 1, borderColor: WebColors.line, padding: 18 },
  infoTitle: { color: WebColors.ink, fontWeight: '900', fontSize: 20 },
  infoBody: { color: WebColors.muted, marginTop: 6, lineHeight: 22 },
});
