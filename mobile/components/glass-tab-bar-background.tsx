import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Brand, BrandGradient } from '@/lib/brand';

export function GlassTabBarBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BlurView intensity={58} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.82)', 'rgba(255,255,255,0.48)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={BrandGradient.primarySoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.colorWash}
      />
      <View style={styles.topHighlight} />
      <View style={styles.bottomShade} />
    </View>
  );
}

const styles = StyleSheet.create({
  colorWash: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.38,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    backgroundColor: Brand.white,
    opacity: 0.18,
  },
});
