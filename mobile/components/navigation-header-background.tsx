import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { BrandGradient } from '@/lib/brand';

const headerFill = ['rgba(255,255,255,0.98)', 'rgba(255,249,240,0.98)', 'rgba(255,241,224,0.96)'] as const;

export function NavigationHeaderBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={headerFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={BrandGradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  accent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    opacity: 0.22,
  },
});