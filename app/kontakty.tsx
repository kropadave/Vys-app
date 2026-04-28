import { Text, View } from 'react-native';

import { PageHero, PublicPage, publicStyles } from '@/components/public-page';
import { contacts } from '@/lib/public-content';

export default function ContactPage() {
  const rows = [
    ['Telefon', contacts.phone],
    ['E-mail', contacts.email],
    ['IČO', contacts.ico],
    ['AirBank', contacts.bank],
    ['Socky', contacts.social.join(' · ')],
  ];

  return (
    <PublicPage>
      <PageHero eyebrow="Spojení" title="Kontakty" body="" />
      <View style={publicStyles.section}>
        <View style={publicStyles.grid}>
          {rows.map(([label, value]) => (
            <View key={label} style={publicStyles.card}>
              <Text style={publicStyles.label}>{label}</Text>
              <Text style={publicStyles.cardTitle}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    </PublicPage>
  );
}
