import { StyleSheet, Text, View } from 'react-native';

import { PageHero, PublicPage, publicStyles, webColors } from '@/components/public-page';
import { aboutText } from '@/lib/public-content';

export default function AboutPage() {
  return (
    <PublicPage>
      <PageHero eyebrow="TeamVYS" title="O nás" body={aboutText} />
      <View style={publicStyles.section}>
        <View style={styles.band}>
          <Text style={styles.tag}>Učíme parkour</Text>
          <Text style={styles.tag}>Pořádáme tábory</Text>
          <Text style={styles.tag}>Tvoříme zážitky</Text>
        </View>
      </View>
    </PublicPage>
  );
}

const styles = StyleSheet.create({
  band: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    backgroundColor: webColors.blue,
    color: webColors.sageDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '900',
  },
});
