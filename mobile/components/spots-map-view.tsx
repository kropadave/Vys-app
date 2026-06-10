// Web map view: same Leaflet/OpenStreetMap renderer as native, embedded via an
// iframe (srcDoc). Markers are projected by Leaflet so they always line up, no
// API key is needed, and selecting a spot flies the map to it via postMessage.
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';

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

const iframeStyle: React.CSSProperties = {
  border: 0,
  display: 'block',
  height: '100%',
  width: '100%',
};

const SpotsMapView = forwardRef<MapView, SpotsMapViewProps>(
  ({ spots, selectedSpotId, onMarkerPress, initialRegion, height }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    useImperativeHandle(ref, () => ({ animateToRegion: () => undefined }) as unknown as MapView, []);

    const html = useMemo(
      () => buildSpotsMapHtml(spots, initialRegion, selectedSpotId),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [spots, initialRegion],
    );

    // Serve the HTML via a Blob URL instead of srcDoc — Blob iframes get a real
    // origin so external scripts (Leaflet CDN) load reliably on mobile browsers.
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    useEffect(() => {
      if (typeof window === 'undefined' || typeof Blob === 'undefined') return undefined;
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }, [html]);

    // Receive marker taps from the Leaflet iframe.
    useEffect(() => {
      if (typeof window === 'undefined') return undefined;
      const handler = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'marker' && data.id) {
            const spot = spots.find((item) => item.id === data.id);
            if (spot) onMarkerPress(spot);
          }
        } catch {
          // ignore malformed messages
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, [spots, onMarkerPress]);

    // Fly to the selected spot whenever it changes.
    useEffect(() => {
      if (!selectedSpotId) return;
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'select', id: selectedSpotId }), '*');
    }, [selectedSpotId]);

    return (
      <View style={[styles.container, typeof height === 'number' ? { height } : styles.fill]}>
        {blobUrl
          ? React.createElement('iframe', {
              ref: iframeRef,
              src: blobUrl,
              style: iframeStyle,
              title: 'Mapa trénovacích spotů',
            })
          : null}
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
});
