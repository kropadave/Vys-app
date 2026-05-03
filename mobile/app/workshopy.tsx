import { View } from 'react-native';

import { PageHero, PublicPage, publicStyles } from '@/components/public-page';

export default function WorkshopsPage() {
  return (
    <PublicPage>
      <PageHero eyebrow="Speciální výuka" title="Workshopy" body="" />
      <View style={publicStyles.section}>
        <View style={publicStyles.emptyBox} />
      </View>
    </PublicPage>
  );
}
