// Native map view using react-native-maps (iOS: Apple Maps, Android: Google Maps).
import React, { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { Brand } from '@/lib/brand';
import { Shadow } from '@/lib/theme';
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

const SpotsMapView = forwardRef<MapView, SpotsMapViewProps>(
  ({ spots, selectedSpotId, onMarkerPress, initialRegion, height }, ref) => {
    return (
      <MapView
        ref={ref}
        provider={PROVIDER_DEFAULT}
        style={{ width: '100%', height }}
        initialRegion={initialRegion}
        showsUserLocation
        showsCompass={false}
        showsScale={false}
        mapType="standard"
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
            onPress={() => onMarkerPress(spot)}
            title={spot.name}
            description={spot.city}
          >
            <View
              style={[
                styles.markerOuter,
                {
                  backgroundColor: spot.is_verified ? Brand.purple : '#888',
                  borderColor: selectedSpotId === spot.id ? Brand.orange : '#fff',
                  borderWidth: selectedSpotId === spot.id ? 3 : 2,
                  transform: [{ scale: selectedSpotId === spot.id ? 1.25 : 1 }],
                },
              ]}
            />
          </Marker>
        ))}
      </MapView>
    );
  },
);

SpotsMapView.displayName = 'SpotsMapView';

export default SpotsMapView;

const styles = StyleSheet.create({
  markerOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    ...Shadow.soft,
  },
});
