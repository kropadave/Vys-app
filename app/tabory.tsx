import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { CheckIcon, HourglassIcon, ParkourIcon, PinIcon } from '@/components/icons/Icon3D';
import { SectionHeader, WebColors, WebPage } from '@/components/public/WebChrome';
import { CAMP_DAY, CAMP_INCLUDES, PUBLIC_CAMPS } from '@/lib/data/public-web';

export default function PublicTaboryScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  return (
    <WebPage>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Příměstské tábory</Text>
          <Text style={styles.h1}>Léto plné dobrodružství.</Text>
          <Text style={styles.lead}>
            Nezapomenutelný týden, kde se parkour potkává s komunitou, hrami,
            novými výzvami a bezpečným vedením trenérů.
          </Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroMetric}>od 3300 Kč</Text>
          <Text style={styles.heroMeta}>turnusy Vyškov a Veliny</Text>
        </View>
      </View>

      <SectionHeader eyebrow="Aktuální turnusy" title="Vyberte tábor" body="Na teamvys.cz najdete detail termínů, dostupnost i přihlášku." />
      <View style={[styles.cardGrid, wide && styles.cardGridWide]}>
        {PUBLIC_CAMPS.map((camp) => (
          <View key={camp.id} style={styles.card}>
            <View style={styles.iconBox}><PinIcon size={30} /></View>
            <Text style={styles.meta}>{camp.city} · {camp.season}</Text>
            <Text style={styles.title}>{camp.venue}</Text>
            <Text style={styles.body}>{camp.description}</Text>
            <Text style={styles.price}>od {camp.priceFrom.toLocaleString('cs-CZ')} Kč</Text>
            <Pressable style={styles.button} onPress={() => Linking.openURL(camp.url)}>
              <Text style={styles.buttonText}>Zjistit termíny</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <SectionHeader eyebrow="V ceně" title="Co tábory zahrnují" />
      <View style={[styles.includeGrid, wide && styles.includeGridWide]}>
        {CAMP_INCLUDES.map((item) => (
          <View key={item} style={styles.includeItem}>
            <CheckIcon size={24} />
            <Text style={styles.includeText}>{item}</Text>
          </View>
        ))}
      </View>

      <SectionHeader eyebrow="Harmonogram" title="Typický den tábora" />
      <View style={styles.timeline}>
        {CAMP_DAY.map((item) => (
          <View key={item.time} style={styles.timelineItem}>
            <View style={styles.timelineTime}><HourglassIcon size={22} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineHour}>{item.time}</Text>
              <Text style={styles.timelineTitle}>{item.title}</Text>
              <Text style={styles.timelineBody}>{item.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </WebPage>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 16, backgroundColor: WebColors.panel, borderWidth: 1, borderColor: WebColors.line, borderRadius: 30, padding: 24 },
  heroWide: { flexDirection: 'row', alignItems: 'center' },
  kicker: { color: WebColors.lime, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  h1: { color: WebColors.ink, fontSize: 44, lineHeight: 48, fontWeight: '900', marginTop: 10 },
  lead: { color: WebColors.muted, fontSize: 16, lineHeight: 24, marginTop: 10, maxWidth: 680 },
  heroCard: { minWidth: 220, backgroundColor: WebColors.paper, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: WebColors.paperLine },
  heroMetric: { color: WebColors.paperText, fontWeight: '900', fontSize: 30 },
  heroMeta: { color: '#506454', marginTop: 4, fontWeight: '700' },
  cardGrid: { gap: 14 },
  cardGridWide: { flexDirection: 'row' },
  card: { flex: 1, backgroundColor: WebColors.paper, borderRadius: 24, padding: 18, gap: 8, borderWidth: 1, borderColor: WebColors.paperLine },
  iconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#E6F8E9', alignItems: 'center', justifyContent: 'center' },
  meta: { color: '#4B8F5B', fontWeight: '900', fontSize: 12, marginTop: 4 },
  title: { color: WebColors.paperText, fontWeight: '900', fontSize: 22 },
  body: { color: '#506454', lineHeight: 21 },
  price: { color: WebColors.paperText, fontWeight: '900', fontSize: 20, marginTop: 6 },
  button: { alignSelf: 'flex-start', backgroundColor: WebColors.lime, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11, marginTop: 6 },
  buttonText: { color: WebColors.paperText, fontWeight: '900' },
  includeGrid: { gap: 10 },
  includeGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  includeItem: { flexGrow: 1, flexBasis: 250, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: WebColors.panel2, borderWidth: 1, borderColor: WebColors.line, borderRadius: 20, padding: 14 },
  includeText: { color: WebColors.ink, fontWeight: '800', flex: 1 },
  timeline: { gap: 10 },
  timelineItem: { flexDirection: 'row', gap: 12, backgroundColor: WebColors.paper, borderRadius: 22, padding: 14 },
  timelineTime: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E6F8E9', alignItems: 'center', justifyContent: 'center' },
  timelineHour: { color: '#4B8F5B', fontWeight: '900', fontSize: 12 },
  timelineTitle: { color: WebColors.paperText, fontWeight: '900', fontSize: 17, marginTop: 2 },
  timelineBody: { color: '#506454', marginTop: 2 },
});
