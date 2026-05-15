// Web fallback for MapView — react-native-maps doesn't support web.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/lib/brand';
import { Palette, Radius } from '@/lib/theme';
import { type TrainingSpot } from '@/lib/training-spots';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type SpotsMapViewProps = {
  spots: TrainingSpot[];
  selectedSpotId?: string | null;
  onMarkerPress: (spot: TrainingSpot) => void;
  initialRegion: Region;
  height: number;
};

export default function SpotsMapView({ spots, height }: SpotsMapViewProps) {
  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.title}>Mapa trénovacích spotů</Text>
      <Text style={styles.sub}>Mapa je dostupná v mobilní aplikaci</Text>
      <Text style={styles.count}>{spots.length} spotů v ČR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  icon: { fontSize: 40 },
  title: { fontSize: 16, fontWeight: '900', color: Palette.text },
  sub: { fontSize: 12, color: Palette.textMuted },
  count: {
    fontSize: 12, fontWeight: '700',
    color: Brand.purple,
    backgroundColor: `${Brand.purple}18`,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
});
