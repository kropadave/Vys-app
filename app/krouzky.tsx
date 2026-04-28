import { View, Text } from 'react-native';

import { LockedBuyButton } from '@/components/locked-buy-button';
import { PageHero, PublicPage, publicStyles } from '@/components/public-page';
import { courses } from '@/lib/public-content';

export default function CoursesPage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Přehled kroužků"
        title="Vyberte si svou lokalitu"
        body="Staňte se součástí parkourové komunity. Trénujeme na nejlepších místech v Česku, s profíky a v bezpečí."
      />
      <View style={publicStyles.section}>
        <View style={publicStyles.grid}>
          {courses.map((course) => (
            <View key={`${course.city}-${course.venue}`} style={publicStyles.card}>
              <Text style={publicStyles.label}>{course.city}</Text>
              <Text style={publicStyles.cardTitle}>{course.venue}</Text>
              <Text style={publicStyles.meta}>{course.day} · {course.from} - {course.to}</Text>
              <Text style={publicStyles.price}>{course.price}</Text>
              <LockedBuyButton />
            </View>
          ))}
        </View>
      </View>
    </PublicPage>
  );
}
