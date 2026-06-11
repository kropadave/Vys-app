import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFeatureFlags } from '@/hooks/use-feature-flags';

/**
 * App-wide banner shown when the signed-in user's organization has a lapsed
 * subscription (past_due / canceled). The VYS org is 'exempt' and never locked.
 */
export function SubscriptionBanner() {
  const { subscriptionLocked } = useFeatureFlags();
  const insets = useSafeAreaInsets();
  if (!subscriptionLocked) return null;

  return (
    <View style={[styles.banner, { paddingTop: Math.max(insets.top, 8) }]}>
      <Text style={styles.text}>Předplatné vypršelo — obnovte platbu pro plný přístup</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
});
