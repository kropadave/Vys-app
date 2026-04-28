import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRole } from '@/hooks/use-role';

const colors = {
  ink: '#17211D',
  muted: '#6C756F',
  border: '#D7E0DA',
  locked: '#F0F2EF',
  active: '#2F5E4C',
  activeText: '#FFFFFF',
};

export function LockedBuyButton() {
  const router = useRouter();
  const { role } = useRole();
  const canBuy = role === 'parent';

  function openCheckout() {
    if (!canBuy) return;
    router.push('/parent-payments' as never);
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        disabled={!canBuy}
        onPress={openCheckout}
        style={({ pressed }) => [
          styles.button,
          canBuy && styles.buttonActive,
          pressed && { opacity: 0.86 },
        ]}>
        <Text style={[styles.icon, canBuy && styles.iconActive]}>{canBuy ? 'Odemčeno' : 'Zamčeno'}</Text>
        <Text style={[styles.buttonText, canBuy && styles.buttonTextActive]}>Koupit</Text>
      </Pressable>
      <Text style={styles.help}>
        {canBuy ? 'Nákup dokončíš v rodičovských platbách.' : 'Pro nákup musíš být přihlášený jako rodič.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.locked,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    opacity: 0.78,
  },
  buttonActive: {
    backgroundColor: colors.active,
    borderColor: colors.active,
    opacity: 1,
  },
  icon: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  iconActive: { color: 'rgba(255,255,255,0.82)' },
  buttonText: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  buttonTextActive: { color: colors.activeText },
  help: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
