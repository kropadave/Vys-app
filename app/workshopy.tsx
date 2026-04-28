import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { BoltIcon, LockIcon, TargetIcon } from '@/components/icons/Icon3D';
import { SectionHeader, WebColors, WebPage } from '@/components/public/WebChrome';
import { PUBLIC_WORKSHOPS } from '@/lib/data/public-web';

export default function PublicWorkshopyScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const tiers = ['Tier 1', 'Tier 2', 'Tier 3'];

  return (
    <WebPage>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Speciální výuka</Text>
          <Text style={styles.h1}>Učíme to, co se na kroužku nestihne.</Text>
          <Text style={styles.lead}>
            Intenzivní 4hodinové bloky zaměřené na specifické akrobatické dovednosti.
            Workshopy pomáhají odemykat odznaky, náramky a pokročilé části skill tree.
          </Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroMetric}>790 Kč</Text>
          <Text style={styles.heroMeta}>4 hodiny tréninku</Text>
        </View>
      </View>

      <View style={[styles.reasonGrid, wide && styles.reasonGridWide]}>
        <Reason title="4 hodiny tréninku" body="Dost času na rozehřátí, nácvik, posilování i protažení." icon={<BoltIcon size={28} />} />
        <Reason title="Úzké zaměření" body="Každý workshop řeší jednu konkrétní dovednost do detailu." icon={<TargetIcon size={28} />} />
        <Reason title="Gamifikace" body="Některé odznaky a náramky jsou navázané na workshop skill tree." icon={<LockIcon size={28} />} />
      </View>

      <SectionHeader eyebrow="Nabídka workshopů" title="Tiers podle úrovně" />
      {tiers.map((tier) => (
        <View key={tier} style={styles.tierBlock}>
          <Text style={styles.tierTitle}>{tier}</Text>
          <View style={[styles.workshopGrid, wide && styles.workshopGridWide]}>
            {PUBLIC_WORKSHOPS.filter((workshop) => workshop.tier === tier).map((workshop) => (
              <View key={workshop.id} style={[styles.card, workshop.locked && styles.cardLocked]}>
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>{workshop.locked ? <LockIcon size={26} /> : <BoltIcon size={26} />}</View>
                  <Text style={[styles.status, workshop.locked && styles.statusLocked]}>{workshop.requirement}</Text>
                </View>
                <Text style={styles.title}>{workshop.title}</Text>
                <Text style={styles.body}>{workshop.body}</Text>
                <Text style={styles.price}>{workshop.price} Kč</Text>
                <Pressable style={styles.button} onPress={() => Linking.openURL(workshop.url)}>
                  <Text style={styles.buttonText}>Detail</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ))}
    </WebPage>
  );
}

function Reason({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
  return (
    <View style={styles.reasonCard}>
      <View style={styles.reasonIcon}>{icon}</View>
      <Text style={styles.reasonTitle}>{title}</Text>
      <Text style={styles.reasonBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 16, backgroundColor: WebColors.panel, borderWidth: 1, borderColor: WebColors.line, borderRadius: 30, padding: 24 },
  heroWide: { flexDirection: 'row', alignItems: 'center' },
  kicker: { color: WebColors.lime, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  h1: { color: WebColors.ink, fontSize: 42, lineHeight: 46, fontWeight: '900', marginTop: 10, maxWidth: 760 },
  lead: { color: WebColors.muted, fontSize: 16, lineHeight: 24, marginTop: 10, maxWidth: 720 },
  heroCard: { minWidth: 220, backgroundColor: WebColors.paper, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: WebColors.paperLine },
  heroMetric: { color: WebColors.paperText, fontWeight: '900', fontSize: 34 },
  heroMeta: { color: '#506454', marginTop: 4, fontWeight: '700' },
  reasonGrid: { gap: 12 },
  reasonGridWide: { flexDirection: 'row' },
  reasonCard: { flex: 1, backgroundColor: WebColors.panel2, borderWidth: 1, borderColor: WebColors.line, borderRadius: 22, padding: 16, gap: 8 },
  reasonIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#14281D', alignItems: 'center', justifyContent: 'center' },
  reasonTitle: { color: WebColors.ink, fontWeight: '900', fontSize: 17 },
  reasonBody: { color: WebColors.muted, lineHeight: 20 },
  tierBlock: { gap: 10 },
  tierTitle: { color: WebColors.lime, fontWeight: '900', fontSize: 18 },
  workshopGrid: { gap: 12 },
  workshopGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { flexGrow: 1, flexBasis: 330, backgroundColor: WebColors.paper, borderRadius: 24, padding: 16, gap: 8, borderWidth: 1, borderColor: WebColors.paperLine },
  cardLocked: { opacity: 0.82 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  iconBox: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#E6F8E9', alignItems: 'center', justifyContent: 'center' },
  status: { color: '#4B8F5B', fontWeight: '900', fontSize: 12 },
  statusLocked: { color: '#809184' },
  title: { color: WebColors.paperText, fontWeight: '900', fontSize: 20, textTransform: 'uppercase' },
  body: { color: '#506454', lineHeight: 20 },
  price: { color: WebColors.paperText, fontWeight: '900', fontSize: 20 },
  button: { alignSelf: 'flex-start', backgroundColor: WebColors.lime, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  buttonText: { color: WebColors.paperText, fontWeight: '900' },
});
