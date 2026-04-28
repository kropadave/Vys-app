import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NOTIFICATIONS } from '@/lib/data/mock';

export default function NotificationsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Notifikace', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.container}>
        {NOTIFICATIONS.length === 0 && (
          <ThemedText style={styles.muted}>Žádné notifikace.</ThemedText>
        )}
        {NOTIFICATIONS.map((n) => (
          <ThemedView
            key={n.id}
            style={[styles.card, !n.read && { borderLeftWidth: 4, borderLeftColor: '#2563EB' }]}
          >
            <View style={styles.head}>
              <ThemedText type="defaultSemiBold">{n.title}</ThemedText>
              {!n.read && <View style={styles.dot} />}
            </View>
            <ThemedText>{n.body}</ThemedText>
            <ThemedText style={styles.muted}>
              {new Date(n.date).toLocaleString('cs-CZ')}
            </ThemedText>
          </ThemedView>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  muted: { opacity: 0.65, fontSize: 12 },
  card: {
    padding: 14, borderRadius: 12, gap: 6,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
});
