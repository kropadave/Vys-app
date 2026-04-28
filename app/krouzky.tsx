import { Stack } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { KROUZKY, type Krouzek } from '@/lib/data/mock';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function KrouzkyScreen() {
  // Seskupit podle města
  const byCity = KROUZKY.reduce<Record<string, Krouzek[]>>((acc, k) => {
    (acc[k.city] ??= []).push(k);
    return acc;
  }, {});

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Kroužky',
          headerShown: true,
          headerStyle: { backgroundColor: Palette.bg },
          headerTitleStyle: { color: Palette.text, fontWeight: '800' },
          headerTintColor: Palette.primary600,
        }}
      />
      <ScrollView
        style={{ backgroundColor: Palette.bg }}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.intro}>
          Vyber si lokalitu a podívej se na nabídku parkour kroužků TeamVYS.
          Přihlášku zařídí rodič přes web.
        </Text>

        {Object.entries(byCity).map(([city, items]) => (
          <View key={city} style={{ gap: 10 }}>
            <Text style={styles.cityTitle}>📍 {city}</Text>

            {items.map((k) => (
              <Card key={k.id} pad={16}>
                <View style={styles.row}>
                  <View style={styles.icon}>
                    <Text style={{ fontSize: 26 }}>🤸</Text>
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.title}>{k.venue}</Text>
                    <Text style={styles.meta}>
                      {k.day} · {k.timeFrom}–{k.timeTo}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      <Pill label={k.ageGroup} variant="soft" emoji="🧒" />
                      <Pill label={`od ${k.priceFrom} Kč`} variant="yellow" emoji="💰" />
                      {k.isOpen && <Pill label="Otevřeno" variant="mint" />}
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => Linking.openURL(k.url)}
                >
                  <Text style={styles.buttonText}>Zjistit víc</Text>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        ))}

        <Text style={styles.footer}>
          Data čerpáme z teamvys.cz. Přihlášku a platby vyřídí rodič.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  intro: { color: Palette.textMuted, lineHeight: 20 },
  cityTitle: { fontSize: 20, fontWeight: '800', color: Palette.text },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: Palette.primary100,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: Palette.text },
  meta: { color: Palette.textMuted, fontSize: 13 },
  button: {
    marginTop: 12,
    backgroundColor: Palette.accentYellow,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  buttonText: { color: Palette.textOnAccent, fontWeight: '800', fontSize: 14 },
  footer: { color: Palette.textMuted, fontSize: 12, textAlign: 'center', marginTop: Spacing.md },
});
