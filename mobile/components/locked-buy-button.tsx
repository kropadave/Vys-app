import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDigitalPasses } from '@/hooks/use-digital-passes';
import { useParentPurchases } from '@/hooks/use-parent-purchases';
import { BrandGradient } from '@/lib/brand';
import { parentProducts } from '@/lib/parent-content';
import { capacityForProduct } from '@/lib/product-capacity';
import { Palette, Radius, Shadow } from '@/lib/theme';

const colors = {
  ink: Palette.text,
  muted: Palette.textMuted,
  border: Palette.borderStrong,
  locked: Palette.primarySoft,
  activeText: '#FFFFFF',
  full: Palette.danger,
  fullSoft: Palette.dangerSoft,
};

export function LockedBuyButton({ productId }: { productId?: string }) {
  const { purchases } = useParentPurchases();
  const { digitalPasses } = useDigitalPasses();
  const product = parentProducts.find((item) => item.id === productId);
  const capacity = useMemo(() => product ? capacityForProduct(product, purchases, digitalPasses) : null, [digitalPasses, product, purchases]);
  const soldOut = capacity?.full ?? false;
  const canBuy = false;

  return (
    <View style={styles.wrap}>
      <Pressable
        disabled={!canBuy}
        style={({ pressed }) => [
          styles.button,
          canBuy && styles.buttonActive,
          soldOut && styles.buttonFull,
          pressed && { opacity: 0.86 },
        ]}>
        {canBuy ? <LinearGradient colors={BrandGradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
        <Text style={[styles.icon, canBuy && styles.iconActive, soldOut && styles.iconFull]}>{soldOut ? 'Plno' : 'Web'}</Text>
        <Text style={[styles.buttonText, canBuy && styles.buttonTextActive, soldOut && styles.buttonTextFull]}>{soldOut ? 'Obsazeno' : 'Rezervace na webu'}</Text>
      </Pressable>
      <Text style={styles.help}>
        {soldOut ? 'Kapacita je plná, nákup je do uvolnění místa zamčený.' : 'Nákup a rodičovské platby jsou jen ve webovém portálu, ne v lokální aplikaci.'}
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
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    overflow: 'hidden',
    opacity: 0.78,
  },
  buttonActive: {
    borderColor: 'rgba(255,255,255,0)',
    opacity: 1,
    ...Shadow.glow,
  },
  buttonFull: {
    backgroundColor: colors.fullSoft,
    borderColor: colors.full,
    opacity: 1,
  },
  icon: { color: colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  iconActive: { color: 'rgba(255,255,255,0.82)' },
  iconFull: { color: colors.full },
  buttonText: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  buttonTextActive: { color: colors.activeText },
  buttonTextFull: { color: colors.full },
  help: { color: colors.muted, fontSize: 12, lineHeight: 17, maxWidth: 420 },
});
