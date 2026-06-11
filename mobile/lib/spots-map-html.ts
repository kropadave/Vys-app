// Shared Leaflet/OpenStreetMap map renderer used by both the native (WebView)
// and web (iframe) SpotsMapView. Leaflet handles map projection so markers are
// always positioned correctly, OSM tiles need no API key, and selecting a spot
// pans/zooms the map. Communication:
//   - marker tap  → posts { type: 'marker', id } to ReactNativeWebView (native)
//                   or window.parent (web iframe)
//   - select spot → call window.selectSpot(id) (native injectJavaScript) or
//                   postMessage({ type: 'select', id }) from the host (web)
import { type TrainingSpot } from '@/lib/training-spots';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const VERIFIED_COLOR = '#9B2CFF';
const UNVERIFIED_COLOR = '#8A8A99';
const SELECTED_COLOR = '#FF8A00';

function escapeForScript(value: string) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export function buildSpotsMapHtml(
  spots: TrainingSpot[],
  initialRegion: Region,
  selectedSpotId?: string | null,
): string {
  const validSpots = spots.filter(
    (spot) => Number.isFinite(spot.lat) && Number.isFinite(spot.lng) && (spot.lat !== 0 || spot.lng !== 0),
  );

  const markerData = validSpots.map((spot) => ({
    id: spot.id,
    lat: spot.lat,
    lng: spot.lng,
    name: spot.name,
    city: spot.city,
    verified: !!spot.is_verified,
  }));

  const markersJson = escapeForScript(JSON.stringify(markerData));
  const initialJson = escapeForScript(JSON.stringify({
    lat: initialRegion.latitude,
    lng: initialRegion.longitude,
    latDelta: initialRegion.latitudeDelta,
    lngDelta: initialRegion.longitudeDelta,
  }));
  const selectedJson = escapeForScript(JSON.stringify(selectedSpotId ?? ''));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #EDE7F6; }
    #map { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
    .spot-pin {
      width: 18px; height: 18px; border-radius: 50%;
      border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      box-sizing: border-box;
    }
    .spot-pin.selected { width: 26px; height: 26px; border-width: 3px; }
    .coach-pin {
      width: 26px; height: 26px; border-radius: 50%;
      border: 2px solid #fff; background: #15B8A6;
      box-shadow: 0 1px 5px rgba(0,0,0,0.4);
      box-sizing: border-box; display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 14px; font-weight: 700;
    }
    .coach-pin.self {
      background: #9B2CFF; width: 30px; height: 30px; border-width: 3px;
      box-shadow: 0 0 0 4px rgba(155,44,255,0.25), 0 1px 5px rgba(0,0,0,0.4);
    }
    .coach-popup b { font-size: 13px; }
    .coach-popup span { color: #15B8A6; font-weight: 700; }
    .coach-popup.self span { color: #9B2CFF; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var markers = JSON.parse(${markersJson});
      var initial = JSON.parse(${initialJson});
      var selectedId = JSON.parse(${selectedJson});

      var VERIFIED = ${escapeForScript(VERIFIED_COLOR)};
      var UNVERIFIED = ${escapeForScript(UNVERIFIED_COLOR)};
      var SELECTED = ${escapeForScript(SELECTED_COLOR)};

      // Keep the map locked to the Czech Republic — users can't pan away to the
      // rest of the world, and zoom is bounded to country level.
      var CZ_BOUNDS = L.latLngBounds([48.55, 12.09], [51.06, 18.86]);

      var map = L.map('map', {
        zoomControl: true,
        attributionControl: true,
        minZoom: 6,
        maxZoom: 18,
        maxBounds: CZ_BOUNDS,
        maxBoundsViscosity: 1.0,
      }).setView([initial.lat, initial.lng], 7);

      map.setMaxBounds(CZ_BOUNDS);
      map.fitBounds(CZ_BOUNDS);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      function postToHost(payload) {
        var msg = JSON.stringify(payload);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(msg);
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage(msg, '*');
        }
      }

      function pinColor(marker) {
        if (marker.id === selectedId) return SELECTED;
        return marker.verified ? VERIFIED : UNVERIFIED;
      }

      function makeIcon(marker) {
        var isSelected = marker.id === selectedId;
        return L.divIcon({
          className: '',
          html: '<div class="spot-pin' + (isSelected ? ' selected' : '') + '" style="background:' + pinColor(marker) + '"></div>',
          iconSize: isSelected ? [26, 26] : [18, 18],
          iconAnchor: isSelected ? [13, 13] : [9, 9],
        });
      }

      var layerById = {};
      var dataById = {};

      markers.forEach(function (marker) {
        dataById[marker.id] = marker;
        var m = L.marker([marker.lat, marker.lng], { icon: makeIcon(marker), title: marker.name });
        m.on('click', function () {
          postToHost({ type: 'marker', id: marker.id });
        });
        m.addTo(map);
        layerById[marker.id] = m;
      });

      if (markers.length > 1) {
        var bounds = L.latLngBounds(markers.map(function (marker) { return [marker.lat, marker.lng]; }));
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (markers.length === 1) {
        map.setView([markers[0].lat, markers[0].lng], 13);
      }

      function refreshIcons() {
        Object.keys(layerById).forEach(function (id) {
          layerById[id].setIcon(makeIcon(dataById[id]));
          if (id === selectedId) layerById[id].setZIndexOffset(1000);
          else layerById[id].setZIndexOffset(0);
        });
      }

      // Highlight + fly to a spot. Exposed for native injectJavaScript.
      window.selectSpot = function (id) {
        selectedId = id;
        refreshIcons();
        var target = dataById[id];
        if (target) {
          map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 13), { duration: 0.7 });
        }
      };

      // Web iframe host sends selection commands via postMessage.
      window.addEventListener('message', function (event) {
        try {
          var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'select' && data.id) window.selectSpot(data.id);
          if (data && data.type === 'coaches') window.updateCoaches(data.list || []);
        } catch (e) { /* ignore malformed messages */ }
      });

      // ── Live coach markers (teal). Replaced wholesale on each update so the
      // base spot map is never rebuilt. Only name + XP are ever shown. ──────
      var coachLayer = L.layerGroup().addTo(map);
      function escapeHtml(value) {
        return String(value == null ? '' : value)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      window.updateCoaches = function (list) {
        coachLayer.clearLayers();
        (list || []).forEach(function (coach) {
          if (typeof coach.lat !== 'number' || typeof coach.lng !== 'number') return;
          var isSelf = !!coach.self;
          var size = isSelf ? 30 : 26;
          var icon = L.divIcon({
            className: '',
            html: '<div class="coach-pin' + (isSelf ? ' self' : '') + '">' +
              escapeHtml(isSelf ? 'JÁ' : (coach.name || '?').charAt(0).toUpperCase()) + '</div>',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
          var m = L.marker([coach.lat, coach.lng], { icon: icon, title: coach.name, zIndexOffset: isSelf ? 3000 : 2000 });
          m.bindPopup(
            '<div class="coach-popup' + (isSelf ? ' self' : '') + '"><b>' +
            escapeHtml(coach.name) + (isSelf ? ' (ty)' : '') +
            '</b><br/><span>' + escapeHtml(coach.xp) + ' XP</span></div>'
          );
          m.addTo(coachLayer);
        });
      };

      if (selectedId) {
        // Defer so tiles/markers exist before flying.
        setTimeout(function () { window.selectSpot(selectedId); }, 200);
      }

      // Leaflet needs its container size recalculated once layout settles,
      // otherwise tiles render blank/gray (classic late-sizing bug).
      function refreshSize() {
        map.invalidateSize();
        if (markers.length > 1) {
          map.fitBounds(L.latLngBounds(markers.map(function (mk) { return [mk.lat, mk.lng]; })), { padding: [40, 40] });
        }
      }
      setTimeout(refreshSize, 0);
      setTimeout(refreshSize, 250);
      setTimeout(refreshSize, 800);
      window.addEventListener('resize', function () { map.invalidateSize(); });
      window.addEventListener('orientationchange', function () { setTimeout(refreshSize, 300); });

      // Tell the host the map finished loading.
      postToHost({ type: 'ready' });
    })();
  </script>
</body>
</html>`;
}
