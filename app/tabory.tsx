import { Text, View } from 'react-native';

import { LockedBuyButton } from '@/components/locked-buy-button';
import { PageHero, PublicPage, publicStyles } from '@/components/public-page';
import { campIncludes, campSchedule, camps } from '@/lib/public-content';

export default function CampsPage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Příměstské tábory"
        title="Léto plné dobrodružství"
        body="Nezapomenutelný týden, kde se parkour potkává s komunitou a novými výzvy."
      />
      <View style={publicStyles.section}>
        <View style={publicStyles.grid}>
          {camps.map((camp) => (
            <View key={camp.place} style={publicStyles.accentCard}>
              <Text style={publicStyles.label}>{camp.place}</Text>
              <Text style={publicStyles.cardTitle}>{camp.venue}</Text>
              <Text style={publicStyles.meta}>{camp.season}</Text>
              <Text style={publicStyles.price}>{camp.price}</Text>
              <LockedBuyButton />
            </View>
          ))}
        </View>
        <View style={publicStyles.split}>
          <View style={publicStyles.infoBlock}>
            <Text style={publicStyles.smallTitle}>Co tábory zahrnují?</Text>
            {campIncludes.map((item) => <Text key={item} style={publicStyles.listItem}>• {item}</Text>)}
          </View>
          <View style={publicStyles.infoBlock}>
            <Text style={publicStyles.smallTitle}>Typický den tábora</Text>
            {campSchedule.map((item) => (
              <View key={item.time}>
                <Text style={publicStyles.label}>{item.time}</Text>
                <Text style={publicStyles.cardTitle}>{item.title}</Text>
                <Text style={publicStyles.meta}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </PublicPage>
  );
}
