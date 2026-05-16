// Web map fallback for react-native-maps.
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type MapView from 'react-native-maps';

import { Brand } from '@/lib/brand';
import { Palette, Radius } from '@/lib/theme';
import { type TrainingSpot } from '@/lib/training-spots';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
};

export type SpotsMapViewProps = {
  spots: TrainingSpot[];
  selectedSpotId?: string | null;
  onMarkerPress: (spot: TrainingSpot) => void;
  initialRegion: Region;
  height: number;
};

const iframeStyle: React.CSSProperties = {
  border: 0,
  display: 'block',
  height: '100%',
  width: '100%',
};

function validMapSpots(spots: TrainingSpot[]) {
  return spots.filter((spot) => Number.isFinite(spot.lat) && Number.isFinite(spot.lng) && (spot.lat !== 0 || spot.lng !== 0));
}

function mapBoundsForSpots(validSpots: TrainingSpot[], initialRegion: Region): MapBounds {
  if (validSpots.length === 0) {
    return {
      west: initialRegion.longitude - initialRegion.longitudeDelta / 2,
      east: initialRegion.longitude + initialRegion.longitudeDelta / 2,
      south: initialRegion.latitude - initialRegion.latitudeDelta / 2,
      north: initialRegion.latitude + initialRegion.latitudeDelta / 2,
    };
  }

  const latitudes = validSpots.map((spot) => spot.lat);
  const longitudes = validSpots.map((spot) => spot.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latPadding = Math.max((maxLat - minLat) * 0.18, 0.08);
  const lngPadding = Math.max((maxLng - minLng) * 0.18, 0.12);
  const west = minLng - lngPadding;
  const east = maxLng + lngPadding;
  const south = minLat - latPadding;
  const north = maxLat + latPadding;

  return { west, east, south, north };
}

function buildMapUrl(bounds: MapBounds, selectedSpot: TrainingSpot | null) {
  const { west, east, south, north } = bounds;
  const marker = selectedSpot ? `&marker=${selectedSpot.lat}%2C${selectedSpot.lng}` : '';

  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik${marker}`;
}

function markerPosition(spot: TrainingSpot, bounds: MapBounds) {
  const x = ((spot.lng - bounds.west) / Math.max(bounds.east - bounds.west, 0.0001)) * 100;
  const y = (1 - ((spot.lat - bounds.south) / Math.max(bounds.north - bounds.south, 0.0001))) * 100;

  return {
    left: `${Math.min(Math.max(x, 4), 96)}%`,
    top: `${Math.min(Math.max(y, 8), 92)}%`,
  } as const;
}

const SpotsMapView = forwardRef<MapView, SpotsMapViewProps>(
  ({ spots, selectedSpotId, onMarkerPress, initialRegion, height }, ref) => {
    useImperativeHandle(ref, () => ({ animateToRegion: () => undefined }) as unknown as MapView, []);

    const validSpots = useMemo(() => validMapSpots(spots), [spots]);
    const selectedSpot = validSpots.find((spot) => spot.id === selectedSpotId) ?? validSpots[0] ?? null;
    const bounds = useMemo(() => mapBoundsForSpots(validSpots, initialRegion), [initialRegion, validSpots]);
    const mapUrl = useMemo(
      () => buildMapUrl(bounds, selectedSpot),
      [bounds, selectedSpot],
    );
    const pins = useMemo(
      () => validSpots.map((spot) => ({ spot, position: markerPosition(spot, bounds) })),
      [bounds, validSpots],
    );
    const openMapUrl = selectedSpot
      ? `https://www.openstreetmap.org/?mlat=${selectedSpot.lat}&mlon=${selectedSpot.lng}#map=13/${selectedSpot.lat}/${selectedSpot.lng}`
      : 'https://www.openstreetmap.org/#map=7/49.80/15.50';

    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.mapFrame}>
          {React.createElement('iframe', {
            allowFullScreen: true,
            loading: 'lazy',
            referrerPolicy: 'no-referrer-when-downgrade',
            src: mapUrl,
            style: iframeStyle,
            title: 'Mapa trénovacích spotů',
          })}
        </View>
        <View style={styles.pinLayer} pointerEvents="box-none">
          {pins.map(({ spot, position }) => {
            const active = spot.id === selectedSpotId;
            return (
              <Pressable
                key={spot.id}
                accessibilityLabel={`Otevřít spot ${spot.name}`}
                onPress={() => onMarkerPress(spot)}
                style={({ pressed }) => [styles.mapPin, position, active && styles.mapPinActive, pressed && { opacity: 0.82 }]}
              >
                <View style={[styles.mapPinCore, active && styles.mapPinCoreActive]} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.mapOverlay} pointerEvents="box-none">
          <View style={styles.mapHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>Mapa trénovacích spotů</Text>
              <Text style={styles.sub}>{spots.length} spotů v ČR</Text>
            </View>
            <Pressable
              onPress={() => Linking.openURL(openMapUrl).catch(() => undefined)}
              style={({ pressed }) => [styles.openButton, pressed && { opacity: 0.82 }]}
            >
              <Text style={styles.openButtonText}>Otevřít mapu</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.markerTray}>
            {spots.map((spot) => {
              const active = spot.id === selectedSpotId;
              return (
                <Pressable
                  key={spot.id}
                  onPress={() => onMarkerPress(spot)}
                  style={({ pressed }) => [styles.markerChip, active && styles.markerChipActive, pressed && { opacity: 0.86 }]}
                >
                  <View style={[styles.markerDot, active && styles.markerDotActive]} />
                  <Text style={[styles.markerText, active && styles.markerTextActive]} numberOfLines={1}>{spot.city}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  },
);

SpotsMapView.displayName = 'SpotsMapView';

export default SpotsMapView;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    overflow: 'hidden',
  },
  mapFrame: { ...StyleSheet.absoluteFillObject, backgroundColor: Palette.surfaceAlt },
  pinLayer: { ...StyleSheet.absoluteFillObject },
  mapPin: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: 'rgba(155,44,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  mapPinActive: {
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    borderRadius: 15,
    backgroundColor: 'rgba(255,138,0,0.24)',
    borderColor: '#FFFFFF',
  },
  mapPinCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: Brand.purple },
  mapPinCoreActive: { width: 16, height: 16, borderRadius: 8, backgroundColor: Brand.orange },
  mapOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 12 },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(25,18,38,0.10)',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: { color: Palette.text, fontSize: 15, fontWeight: '900' },
  sub: { color: Palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 1 },
  openButton: { backgroundColor: Brand.purple, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  openButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  markerTray: { gap: 8, paddingTop: 8 },
  markerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 128,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(25,18,38,0.12)',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  markerChipActive: { borderColor: Brand.purple, backgroundColor: '#FFFFFF' },
  markerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.textSubtle },
  markerDotActive: { backgroundColor: Brand.purple },
  markerText: { color: Palette.textMuted, fontSize: 12, fontWeight: '800' },
  markerTextActive: { color: Brand.purple },
});
