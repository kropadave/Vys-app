// Native map view powered by Leaflet + OpenStreetMap inside a WebView.
// No API key required (works on iOS & Android), markers are projected by
// Leaflet so they always line up, and selecting a spot flies the map to it.
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildSpotsMapHtml } from '@/lib/spots-map-html';
import { Palette } from '@/lib/theme';
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
  height?: number;
};

const SpotsMapView = forwardRef<MapView, SpotsMapViewProps>(
  ({ spots, selectedSpotId, onMarkerPress, initialRegion, height }, ref) => {
    const webRef = useRef<WebView>(null);

    // Rebuild the HTML only when the spot set changes — selection is handled
    // via injected JS so the map doesn't fully reload on every tap.
    const html = useMemo(
      () => buildSpotsMapHtml(spots, initialRegion, selectedSpotId),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [spots, initialRegion],
    );

    // The screen drives selection through this imperative ref. Leaflet handles
    // the actual fly-to via the selectedSpotId effect below, so this is a no-op.
    useImperativeHandle(ref, () => ({
      animateToRegion: () => undefined,
    }) as unknown as MapView, []);

    // Fly to the selected spot whenever it changes.
    React.useEffect(() => {
      if (!selectedSpotId) return;
      webRef.current?.injectJavaScript(`window.selectSpot && window.selectSpot(${JSON.stringify(selectedSpotId)}); true;`);
    }, [selectedSpotId]);

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string };
        if (data.type === 'marker' && data.id) {
          const spot = spots.find((item) => item.id === data.id);
          if (spot) onMarkerPress(spot);
        }
      } catch {
        // ignore malformed messages
      }
    };

    return (
      <View style={[styles.container, typeof height === 'number' ? { height } : styles.fill]}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          // A real https baseUrl gives the page a proper origin so Android lets
          // it load the Leaflet CDN scripts (an empty origin blocks them →
          // blank map in Expo Go / Android).
          source={{ html, baseUrl: 'https://teamvys.app' }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          style={styles.web}
          androidLayerType="hardware"
          mixedContentMode="always"
          setSupportMultipleWindows={false}
        />
      </View>
    );
  },
);

SpotsMapView.displayName = 'SpotsMapView';

export default SpotsMapView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Palette.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { flex: 1 },
  web: { flex: 1, backgroundColor: 'transparent' },
});
