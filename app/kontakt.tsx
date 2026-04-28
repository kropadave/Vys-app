import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ArrowRightIcon, BellIcon, PinIcon } from '@/components/icons/Icon3D';
import { SectionHeader, WebColors, WebPage } from '@/components/public/WebChrome';
import { PUBLIC_CONTACT } from '@/lib/data/public-web';

export default function PublicKontaktScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return (
    <WebPage>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Kontakt</Text>
          <Text style={styles.h1}>Potřebujete poradit s přihláškou?</Text>
          <Text style={styles.lead}>
            Napište nebo zavolejte. Pomůžeme s výběrem kroužku, workshopu, tábora
            i s nastavením rodičovského účtu.
          </Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroMetric}>{PUBLIC_CONTACT.phone}</Text>
          <Text style={styles.heroMeta}>{PUBLIC_CONTACT.email}</Text>
        </View>
      </View>

      <SectionHeader eyebrow="Spojení" title="TeamVYS online" />
      <View style={[styles.contactGrid, wide && styles.contactGridWide]}>
        <ContactCard title="E-mail" value={PUBLIC_CONTACT.email} url={`mailto:${PUBLIC_CONTACT.email}`} />
        <ContactCard title="Telefon" value={PUBLIC_CONTACT.phone} url={`tel:+420${PUBLIC_CONTACT.phone.replace(/\s/g, '')}`} />
        <ContactCard title="Instagram" value="@teamvys" url={PUBLIC_CONTACT.instagram} />
        <ContactCard title="YouTube" value="@teamvys" url={PUBLIC_CONTACT.youtube} />
        <ContactCard title="Facebook" value="TeamVYS" url={PUBLIC_CONTACT.facebook} />
        <ContactCard title="WhatsApp" value="Komunitní skupina" url={PUBLIC_CONTACT.whatsapp} />
      </View>

      <View style={styles.companyBox}>
        <PinIcon size={28} />
        <View style={{ flex: 1 }}>
          <Text style={styles.companyTitle}>Fakturační informace</Text>
          <Text style={styles.companyBody}>IČO: {PUBLIC_CONTACT.ico} · AirBank: {PUBLIC_CONTACT.bank}</Text>
        </View>
      </View>
    </WebPage>
  );
}

function ContactCard({ title, value, url }: { title: string; value: string; url: string }) {
  return (
    <Pressable style={styles.card} onPress={() => Linking.openURL(url)}>
      <View style={styles.iconBox}><BellIcon size={24} /></View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <View style={styles.cardAction}>
        <Text style={styles.cardActionText}>Otevřít</Text>
        <ArrowRightIcon tint={WebColors.paperText} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 16, backgroundColor: WebColors.panel, borderWidth: 1, borderColor: WebColors.line, borderRadius: 30, padding: 24 },
  heroWide: { flexDirection: 'row', alignItems: 'center' },
  kicker: { color: WebColors.lime, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  h1: { color: WebColors.ink, fontSize: 42, lineHeight: 46, fontWeight: '900', marginTop: 10, maxWidth: 720 },
  lead: { color: WebColors.muted, fontSize: 16, lineHeight: 24, marginTop: 10, maxWidth: 720 },
  heroCard: { minWidth: 250, backgroundColor: WebColors.paper, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: WebColors.paperLine },
  heroMetric: { color: WebColors.paperText, fontWeight: '900', fontSize: 28 },
  heroMeta: { color: '#506454', marginTop: 4, fontWeight: '700' },
  contactGrid: { gap: 12 },
  contactGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { flexGrow: 1, flexBasis: 310, backgroundColor: WebColors.paper, borderRadius: 24, padding: 16, gap: 7, borderWidth: 1, borderColor: WebColors.paperLine },
  iconBox: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#E6F8E9', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#4B8F5B', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  cardValue: { color: WebColors.paperText, fontWeight: '900', fontSize: 20 },
  cardAction: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 6, backgroundColor: WebColors.lime, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  cardActionText: { color: WebColors.paperText, fontWeight: '900' },
  companyBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WebColors.panel2, borderRadius: 24, borderWidth: 1, borderColor: WebColors.line, padding: 18 },
  companyTitle: { color: WebColors.ink, fontWeight: '900', fontSize: 18 },
  companyBody: { color: WebColors.muted, marginTop: 4 },
});
