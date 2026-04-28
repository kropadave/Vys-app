import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BellIcon } from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { NOTIFICATIONS } from '@/lib/data/mock';
import { Palette, Spacing } from '@/lib/theme';

export default function NotificationsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifikace',
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
        {NOTIFICATIONS.length === 0 && <Text style={styles.muted}>Žádné notifikace.</Text>}
        {NOTIFICATIONS.map((n) => (
          <Card key={n.id} pad={14}>
            <View style={styles.head}>
              <View style={styles.iconBox}>
                <BellIcon size={22} />
              </View>
              <Text style={styles.title}>{n.title}</Text>
              {!n.read && <View style={styles.dot} />}
            </View>
            <Text style={styles.body}>{n.body}</Text>
            <Text style={styles.muted}>{new Date(n.date).toLocaleString('cs-CZ')}</Text>
          </Card>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Palette.primary100,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontWeight: '800', color: Palette.text, fontSize: 15 },
  body: { color: Palette.text, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.primary500 },
  muted: { color: Palette.textMuted, fontSize: 12, marginTop: 6 },
});
