import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    LayoutAnimation,
    Linking,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    UIManager,
    View,
} from 'react-native';
import type MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SpotsMapView from '@/components/spots-map-view';
import { useAuth } from '@/hooks/use-auth';
import { useCoachLiveLocations } from '@/hooks/use-coach-live-locations';
import { useRole } from '@/hooks/use-role';
import { Brand } from '@/lib/brand';
import { geocodeSpot } from '@/lib/geocode';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';
import {
    ENVIRONMENT_LABELS,
    HARDCODED_SPOTS,
    SPOT_TYPE_ICONS,
    SPOT_TYPE_LABELS,
    type SpotEnvironment,
    type SpotType,
    type TrainingSpot,
} from '@/lib/training-spots';

// ─── Types ────────────────────────────────────────────────────────────────────
type SpotRow = TrainingSpot & { avg_rating: number; review_count: number };
type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  created_at: string;
};
type NewSpotState = {
  name: string;
  city: string;
  address: string;
  description: string;
  website: string;
  entry_fee: string;
  opening_hours: string;
  spot_type: SpotType | null;
  environment: SpotEnvironment;
  tags: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CZECH_INITIAL_REGION = {
  latitude: 49.8,
  longitude: 15.5,
  latitudeDelta: 4.8,
  longitudeDelta: 6.5,
};

const CITIES = [
  'Vše', 'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Kladno',
  'Frýdek-Místek', 'Jihlava', 'Zlín', 'České Budějovice', 'Olomouc',
];

const TAG_LABELS: Record<string, string> = {
  parkour: 'Parkour',
  gymnastics: 'Gymnastika',
  trampoline: 'Trampolína',
  'foam-pit': 'Molitanová jáma',
  freerun: 'Freerun',
  tricking: 'Tricking',
  workout: 'Workout',
};

const TAG_COLORS: Record<string, string> = {
  parkour: Brand.purple,
  gymnastics: Brand.pink,
  trampoline: Brand.orange,
  'foam-pit': Brand.cyan,
  freerun: '#44E0B7',
  tricking: '#E16B12',
  workout: '#1FB37A',
};

const ALL_TAGS = Object.keys(TAG_LABELS);

// Enable smooth LayoutAnimation transitions on Android.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BLANK_SPOT: NewSpotState = {
  name: '', city: '', address: '', description: '', website: '', entry_fee: '',
  opening_hours: '', tags: [], spot_type: null, environment: 'indoor',
};

// ─── Star rating ──────────────────────────────────────────────────────────────
function StarRow({ rating, size = 14, onPress }: { rating: number; size?: number; onPress?: (r: number) => void }) {
  return (
    <View style={rowStyle.wrap}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={onPress ? () => onPress(star) : undefined} hitSlop={8}>
          <FontAwesome
            name={star <= Math.round(rating) ? 'star' : 'star-o'}
            size={size}
            color={star <= Math.round(rating) ? Brand.orange : Palette.textSubtle}
          />
        </Pressable>
      ))}
    </View>
  );
}
const rowStyle = StyleSheet.create({ wrap: { flexDirection: 'row', gap: 3, alignItems: 'center' } });

// ─── Spot card (horizontal list) ──────────────────────────────────────────────
function SpotCard({ spot, onPress, selected }: { spot: SpotRow; onPress: () => void; selected: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.spotCard, selected && styles.spotCardSelected, pressed && { opacity: 0.88 }]}>
      <Text style={styles.spotCardName} numberOfLines={2}>{spot.name}</Text>
      <Text style={styles.spotCardCity} numberOfLines={1}>{spot.city}</Text>

      <View style={styles.spotCardFooter}>
        {spot.review_count > 0 ? (
          <View style={styles.spotCardRating}>
            <StarRow rating={spot.avg_rating} size={11} />
            <Text style={styles.spotCardReviewCount}>({spot.review_count})</Text>
          </View>
        ) : (
          <Text style={styles.spotCardNoRating}>Zatím bez hodnocení</Text>
        )}
        {spot.tags.length > 0 && (
          <View style={styles.tagRow}>
            {spot.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={[styles.tagChip, { backgroundColor: `${TAG_COLORS[tag] ?? Brand.purple}22` }]}>
                <Text style={[styles.tagChipText, { color: TAG_COLORS[tag] ?? Brand.purple }]}>
                  {TAG_LABELS[tag] ?? tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────
function FormField({
  label, value, onChangeText, placeholder, multiline, keyboardType,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; multiline?: boolean; keyboardType?: 'default' | 'url';
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.textInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.textSubtle}
        multiline={multiline}
        autoCapitalize={multiline ? 'sentences' : 'words'}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ─── Spots screen ─────────────────────────────────────────────────────────────
export default function SpotsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { role } = useRole();
  const isCoach = role === 'coach' || role === 'admin';
  const mapRef = useRef<MapView>(null);

  // Live coach location sharing (coaches/admins only).
  const { sharing, locations: coachLocations, busy: shareBusy, error: shareError, toggleSharing, coachesAtSpot } =
    useCoachLiveLocations(isCoach);
  const coachMarkers = useMemo(
    () =>
      coachLocations.map((loc) => ({
        coachId: loc.coachId,
        name: loc.coachName,
        xp: loc.xp,
        lat: loc.lat,
        lng: loc.lng,
        self: loc.coachId === session?.userId,
      })),
    [coachLocations, session?.userId],
  );

  const [spots, setSpots] = useState<SpotRow[]>(
    HARDCODED_SPOTS.map((s) => ({ ...s, avg_rating: 0, review_count: 0 })),
  );
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Vše');
  const [selectedSpot, setSelectedSpot] = useState<SpotRow | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // form state
  const [newSpot, setNewSpot] = useState<NewSpotState>(BLANK_SPOT);
  const [addSpotLoading, setAddSpotLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [addSpotError, setAddSpotError] = useState('');
  const [manualCoords, setManualCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [addReviewLoading, setAddReviewLoading] = useState(false);

  // ── Load spots ──────────────────────────────────────────────────────────────
  const loadSpots = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('training_spots')
      .select('*, spot_reviews(rating)')
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: true });
    if (!error && data && data.length > 0) {
      const enriched: SpotRow[] = (data as Record<string, unknown>[]).map((s) => {
        const rs = ((s['spot_reviews'] as { rating: number }[]) ?? []).map((r) => r.rating);
        const avg = rs.length > 0 ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;
        return {
          ...(s as unknown as TrainingSpot),
          tags: (s['tags'] as string[] | null) ?? [],
          avg_rating: avg,
          review_count: rs.length,
        };
      });
      setSpots(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadSpots(); }, [loadSpots]);

  // ── Open spot detail ────────────────────────────────────────────────────────
  const openSpot = useCallback(async (spot: SpotRow) => {
    setSelectedSpot(spot);
    setShowDetail(true);
    setReviews([]);
    setShowAddReview(false);
    setNewRating(0);
    setNewComment('');
    if (!hasSupabaseConfig || !supabase) return;
    setReviewsLoading(true);
    const { data } = await supabase
      .from('spot_reviews')
      .select('*')
      .eq('spot_id', spot.id)
      .order('created_at', { ascending: false });
    setReviews((data as ReviewRow[] | null) ?? []);
    setReviewsLoading(false);
  }, []);

  const handleSelectSpot = useCallback((spot: SpotRow) => {
    // Animate map to spot on native
    (mapRef.current as MapView | null)?.animateToRegion(
      { latitude: spot.lat, longitude: spot.lng, latitudeDelta: 0.06, longitudeDelta: 0.10 }, 700,
    );
    void openSpot(spot);
  }, [openSpot]);

  // Smoothly collapse / expand the bottom list (animates the map height too).
  const setPanel = useCallback((collapsed: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(240, 'easeInEaseOut', 'opacity'));
    setPanelCollapsed(collapsed);
  }, []);
  const togglePanel = useCallback(() => setPanel(!panelCollapsed), [panelCollapsed, setPanel]);

  // Swipe down on the handle to hide the list, swipe up to show it again.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_evt, g) => {
        if (g.dy > 20) setPanel(true);
        else if (g.dy < -20) setPanel(false);
      },
    }),
  ).current;

  // ── Use current GPS position ───────────────────────────────────────────────
  const useCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setAddSpotError('Geolokace není na tomto zařízení dostupná.');
      return;
    }
    setGpsLoading(true);
    setAddSpotError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setManualCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setAddSpotError('Nepodařilo se získat polohu. Povol přístup k poloze v prohlížeči.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ── Submit new spot ─────────────────────────────────────────────────────────
  const submitAddSpot = async () => {
    setAddSpotError('');
    if (!isCoach) { setAddSpotError('Lokace mohou přidávat pouze trenéři.'); return; }
    if (!newSpot.name.trim() || !newSpot.city.trim()) {
      setAddSpotError('Název a město jsou povinné.'); return;
    }
    if (!newSpot.spot_type) { setAddSpotError('Vyber typ spotu.'); return; }
    if (!session?.userId) { setAddSpotError('Přihlas se prosím.'); return; }
    if (!hasSupabaseConfig || !supabase) { setAddSpotError('Databáze není dostupná.'); return; }
    setAddSpotLoading(true);
    // If the coach tapped "Use current location" we already have exact coords.
    // Otherwise resolve from the address via Nominatim.
    let geo = manualCoords;
    if (!geo) {
      setGeocoding(true);
      geo = await geocodeSpot({ name: newSpot.name, address: newSpot.address, city: newSpot.city });
      setGeocoding(false);
    }
    if (!geo) {
      setAddSpotError('Nepodařilo se najít adresu na mapě. Zkontroluj město a adresu.');
      setAddSpotLoading(false);
      return;
    }
    const { error } = await supabase.from('training_spots').insert({
      name: newSpot.name.trim(),
      city: newSpot.city.trim(),
      address: newSpot.address.trim() || null,
      description: newSpot.description.trim() || null,
      website: newSpot.website.trim() || null,
      entry_fee: newSpot.entry_fee.trim() || null,
      opening_hours: newSpot.opening_hours.trim() || null,
      spot_type: newSpot.spot_type,
      environment: newSpot.environment,
      tags: newSpot.tags,
      lat: geo.lat,
      lng: geo.lng,
      is_verified: false,
      added_by: session.userId,
    });
    if (error) {
      setAddSpotError('Nepodařilo se přidat místo.');
    } else {
      setNewSpot(BLANK_SPOT);
      setManualCoords(null);
      setShowAddSpot(false);
      await loadSpots();
    }
    setAddSpotLoading(false);
  };

  // ── Submit review ───────────────────────────────────────────────────────────
  const submitReview = async () => {
    if (!newRating || !selectedSpot || !session?.userId || !hasSupabaseConfig || !supabase) return;
    setAddReviewLoading(true);
    const { data: profile } = await supabase
      .from('app_profiles')
      .select('name')
      .eq('id', session.userId)
      .single();
    await supabase.from('spot_reviews').upsert({
      spot_id: selectedSpot.id,
      user_id: session.userId,
      rating: newRating,
      comment: newComment.trim() || null,
      reviewer_name: (profile as { name?: string } | null)?.name ?? null,
    });
    const { data } = await supabase
      .from('spot_reviews')
      .select('*')
      .eq('spot_id', selectedSpot.id)
      .order('created_at', { ascending: false });
    setReviews((data as ReviewRow[] | null) ?? []);
    setShowAddReview(false);
    setNewRating(0);
    setNewComment('');
    await loadSpots();
    setAddReviewLoading(false);
  };

  const filteredSpots = selectedCity === 'Vše' ? spots : spots.filter((s) => s.city === selectedCity);
  const myReview = session ? reviews.find((r) => r.user_id === session.userId) : null;
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <View style={styles.root}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
          <FontAwesome5 name="chevron-left" size={15} color={Palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Trénovací spoty</Text>
        {isCoach ? (
          <Pressable onPress={() => setShowAddSpot(true)} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
            <FontAwesome5 name="plus" size={12} color="#fff" />
            <Text style={styles.addBtnText}>Přidat</Text>
          </Pressable>
        ) : (
          <View style={styles.coachHintPill}>
            <MaterialCommunityIcons name="information-outline" size={12} color={Palette.textSubtle} />
            <Text style={styles.coachHintText}>Nové lokace přidávají trenéři</Text>
          </View>
        )}
      </View>

      {/* ── Location sharing bar (coaches only) ────────────────────────────── */}
      {isCoach && (
        <View style={styles.shareBar}>
          <Pressable
            onPress={toggleSharing}
            disabled={shareBusy}
            style={({ pressed }) => [styles.shareToggle, sharing && styles.shareToggleOn, pressed && { opacity: 0.85 }]}
          >
            <MaterialCommunityIcons
              name={sharing ? 'map-marker-radius' : 'map-marker-off-outline'}
              size={15}
              color={sharing ? '#fff' : Palette.textMuted}
            />
            <Text style={[styles.shareToggleText, sharing && styles.shareToggleTextOn]}>
              {shareBusy ? 'Zapínám…' : sharing ? 'Sdílím polohu' : 'Sdílet polohu'}
            </Text>
          </Pressable>
          <Text style={styles.shareHint} numberOfLines={1}>
            {shareError
              ? shareError
              : (() => {
                  const others = coachMarkers.filter((m) => !m.self).length;
                  return others > 0 ? `Online trenéři: ${others}` : 'Žádný další trenér zatím nesdílí';
                })()}
          </Text>
        </View>
      )}

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <SpotsMapView
        ref={mapRef as React.Ref<MapView>}
        spots={filteredSpots as TrainingSpot[]}
        selectedSpotId={selectedSpot?.id}
        onMarkerPress={(spot) => handleSelectSpot(spot as SpotRow)}
        initialRegion={CZECH_INITIAL_REGION}
        coaches={isCoach ? coachMarkers : undefined}
      />

      {/* ── Bottom panel ──────────────────────────────────────────────────── */}
      <View style={[styles.bottomPanel, { paddingBottom: panelCollapsed ? 0 : insets.bottom + 6 }]}>
        {/* Drag handle — tap or swipe up/down to show / hide the list */}
        <View {...panResponder.panHandlers}>
          <Pressable
            onPress={togglePanel}
            style={({ pressed }) => [styles.panelHandle, pressed && { opacity: 0.7 }]}
            hitSlop={8}
          >
            <View style={styles.panelHandleBar} />
            <View style={styles.panelHandleRow}>
              <MaterialCommunityIcons
                name={panelCollapsed ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Palette.textMuted}
              />
              <Text style={styles.panelHandleText}>
                {panelCollapsed
                  ? `Zobrazit seznam (${filteredSpots.length})`
                  : 'Skrýt seznam'}
              </Text>
            </View>
          </Pressable>
        </View>

        {!panelCollapsed && (
          <>
            {/* City filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cityFilter}
              contentContainerStyle={styles.cityFilterContent}
            >
              {CITIES.map((city) => (
                <Pressable
                  key={city}
                  onPress={() => setSelectedCity(city)}
                  style={[styles.cityChip, selectedCity === city && styles.cityChipActive]}
                >
                  <Text style={[styles.cityChipText, selectedCity === city && styles.cityChipTextActive]}>{city}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Spot list */}
            <Text style={styles.listLabel}>
              {filteredSpots.length} {filteredSpots.length === 1 ? 'spot' : filteredSpots.length < 5 ? 'spoty' : 'spotů'}
            </Text>
            {loading ? (
              <ActivityIndicator color={Brand.purple} style={{ marginTop: 16, marginBottom: 8 }} />
            ) : (
              <FlatList
                horizontal
                data={filteredSpots}
                keyExtractor={(item) => item.id}
                style={styles.spotsListView}
                renderItem={({ item }) => (
                  <SpotCard
                    spot={item}
                    selected={selectedSpot?.id === item.id}
                    onPress={() => handleSelectSpot(item)}
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.spotsList}
              />
            )}
          </>
        )}
      </View>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SPOT DETAIL MODAL                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showDetail} animationType="slide" transparent onRequestClose={() => setShowDetail(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowDetail(false)} />
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            {selectedSpot && (
              <>
                {/* Header row */}
                <View style={styles.sheetHeaderRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.sheetTitle} numberOfLines={2}>{selectedSpot.name}</Text>
                      {selectedSpot.is_verified && (
                        <MaterialCommunityIcons name="check-decagram" size={16} color={Brand.purple} />
                      )}
                    </View>
                    <Text style={styles.sheetSub}>
                      {selectedSpot.city}{selectedSpot.address ? ` · ${selectedSpot.address}` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowDetail(false)} hitSlop={8} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}>
                    <FontAwesome5 name="times" size={15} color={Palette.textMuted} />
                  </Pressable>
                </View>

                {/* Rating summary */}
                <View style={styles.ratingRow}>
                  <StarRow rating={avgRating} size={18} />
                  {reviews.length > 0 ? (
                    <Text style={styles.ratingNum}>{avgRating.toFixed(1)}</Text>
                  ) : null}
                  <Text style={styles.ratingCount}>
                    {reviews.length > 0 ? `${reviews.length} recenzí` : 'Zatím bez hodnocení'}
                  </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
                  {/* Coaches currently at this spot (coaches/admins only) */}
                  {isCoach && (() => {
                    const here = coachesAtSpot(selectedSpot.lat, selectedSpot.lng);
                    if (here.length === 0) return null;
                    return (
                      <View style={styles.hereCard}>
                        <View style={styles.hereHeader}>
                          <MaterialCommunityIcons name="map-marker-account" size={15} color="#15B8A6" />
                          <Text style={styles.hereTitle}>
                            Na spotu právě {here.length === 1 ? 'je' : 'jsou'} ({here.length})
                          </Text>
                        </View>
                        {here.map((coach) => (
                          <View key={coach.coachId} style={styles.hereRow}>
                            <View style={styles.hereAvatar}>
                              <Text style={styles.hereAvatarText}>
                                {(coach.coachName || '?').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.hereName} numberOfLines={1}>{coach.coachName}</Text>
                            <Text style={styles.hereXp}>{coach.xp} XP</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })()}

                  {/* Info chips */}
                  <View style={styles.infoRow}>
                    {selectedSpot.spot_type && (
                      <View style={[styles.infoChip, { borderColor: `${Brand.purple}55`, backgroundColor: `${Brand.purple}12` }]}>
                        <MaterialCommunityIcons
                          name={SPOT_TYPE_ICONS[selectedSpot.spot_type] as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={11}
                          color={Brand.purple}
                        />
                        <Text style={[styles.infoChipText, { color: Brand.purple }]}>
                          {SPOT_TYPE_LABELS[selectedSpot.spot_type]}
                        </Text>
                      </View>
                    )}
                    {selectedSpot.environment && (
                      <View style={styles.infoChip}>
                        <MaterialCommunityIcons
                          name={selectedSpot.environment === 'outdoor' ? 'tree-outline' : selectedSpot.environment === 'indoor' ? 'home-outline' : 'swap-horizontal'}
                          size={11}
                          color={Palette.textMuted}
                        />
                        <Text style={styles.infoChipText}>{ENVIRONMENT_LABELS[selectedSpot.environment]}</Text>
                      </View>
                    )}
                    {selectedSpot.opening_hours && (
                      <View style={styles.infoChip}>
                        <MaterialCommunityIcons name="clock-outline" size={11} color={Palette.textMuted} />
                        <Text style={styles.infoChipText}>{selectedSpot.opening_hours}</Text>
                      </View>
                    )}
                    {selectedSpot.entry_fee && (
                      <View style={styles.infoChip}>
                        <FontAwesome5 name="ticket-alt" size={11} color={Palette.textMuted} />
                        <Text style={styles.infoChipText}>{selectedSpot.entry_fee}</Text>
                      </View>
                    )}
                    {selectedSpot.website && (
                      <Pressable
                        style={styles.infoChip}
                        onPress={() => {
                          const url = selectedSpot.website!.startsWith('http')
                            ? selectedSpot.website!
                            : `https://${selectedSpot.website}`;
                          void Linking.openURL(url);
                        }}
                      >
                        <FontAwesome5 name="globe" size={11} color={Brand.purple} />
                        <Text style={[styles.infoChipText, { color: Brand.purple }]}>{selectedSpot.website}</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Tags */}
                  {selectedSpot.tags.length > 0 && (
                    <View style={styles.tagsWrap}>
                      {selectedSpot.tags.map((tag) => (
                        <View key={tag} style={[styles.tagChip, { backgroundColor: `${TAG_COLORS[tag] ?? Brand.purple}22` }]}>
                          <Text style={[styles.tagChipText, { color: TAG_COLORS[tag] ?? Brand.purple }]}>
                            {TAG_LABELS[tag] ?? tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Description */}
                  {selectedSpot.description && (
                    <Text style={styles.description}>{selectedSpot.description}</Text>
                  )}

                  {/* Navigate button */}
                  {(selectedSpot.lat !== 0 || selectedSpot.lng !== 0) && (
                    <Pressable
                      style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.85 }]}
                      onPress={() => {
                        const q = encodeURIComponent(`${selectedSpot.name} ${selectedSpot.address ?? selectedSpot.city}`);
                        const url = Platform.OS === 'ios'
                          ? `maps:?q=${q}&ll=${selectedSpot.lat},${selectedSpot.lng}`
                          : `geo:${selectedSpot.lat},${selectedSpot.lng}?q=${q}`;
                        void Linking.openURL(url);
                      }}
                    >
                      <MaterialCommunityIcons name="directions" size={16} color={Brand.purple} />
                      <Text style={styles.navBtnText}>Navigovat</Text>
                    </Pressable>
                  )}

                  {/* Reviews section */}
                  <View style={styles.reviewsSection}>
                    <View style={styles.reviewsHeader}>
                      <Text style={styles.reviewsSectionTitle}>Recenze</Text>
                      {!myReview && session && !showAddReview && (
                        <Pressable
                          onPress={() => setShowAddReview(true)}
                          style={({ pressed }) => [styles.addReviewBtn, pressed && { opacity: 0.8 }]}
                        >
                          <FontAwesome name="star" size={11} color="#fff" />
                          <Text style={styles.addReviewBtnText}>Přidat recenzi</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Add review form */}
                    {showAddReview && (
                      <View style={styles.addReviewCard}>
                        <Text style={styles.addReviewCardTitle}>Tvoje hodnocení</Text>
                        <StarRow rating={newRating} size={30} onPress={setNewRating} />
                        <TextInput
                          style={styles.reviewInput}
                          placeholder="Přidej komentář (nepovinné)…"
                          placeholderTextColor={Palette.textSubtle}
                          multiline
                          value={newComment}
                          onChangeText={setNewComment}
                          maxLength={400}
                        />
                        <View style={styles.reviewBtns}>
                          <Pressable
                            style={[styles.reviewSubmitBtn, !newRating && styles.reviewSubmitBtnDisabled]}
                            onPress={() => void submitReview()}
                            disabled={!newRating || addReviewLoading}
                          >
                            {addReviewLoading
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <Text style={styles.reviewSubmitText}>Odeslat</Text>}
                          </Pressable>
                          <Pressable style={styles.reviewCancelBtn} onPress={() => setShowAddReview(false)}>
                            <Text style={styles.reviewCancelText}>Zrušit</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}

                    {reviewsLoading ? (
                      <ActivityIndicator color={Brand.purple} style={{ marginTop: 16 }} />
                    ) : reviews.length === 0 ? (
                      <Text style={styles.noReviews}>Zatím žádné recenze. Buď první!</Text>
                    ) : (
                      reviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                          <View style={styles.reviewCardHeader}>
                            <View style={styles.reviewAvatar}>
                              <Text style={styles.reviewAvatarText}>
                                {(review.reviewer_name?.[0] ?? '?').toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.reviewerName}>{review.reviewer_name ?? 'Anonym'}</Text>
                              <StarRow rating={review.rating} size={12} />
                            </View>
                            <Text style={styles.reviewDate}>
                              {new Date(review.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                            </Text>
                          </View>
                          {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ADD SPOT MODAL                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showAddSpot} animationType="slide" transparent onRequestClose={() => setShowAddSpot(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => { setShowAddSpot(false); setManualCoords(null); }} />
          <View style={[styles.sheet, { maxHeight: '94%' }]}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { flex: 1 }]}>Přidat trénovací spot</Text>
              <Pressable onPress={() => { setShowAddSpot(false); setManualCoords(null); }} hitSlop={8} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}>
                <FontAwesome5 name="times" size={15} color={Palette.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64 }}>
              {/* Spot type — closed dropdown (no free-text junk) */}
              <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Typ spotu *</Text>
              <View style={styles.typeGrid}>
                {(Object.keys(SPOT_TYPE_LABELS) as SpotType[]).map((t) => {
                  const active = newSpot.spot_type === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setNewSpot((p) => ({ ...p, spot_type: t }))}
                      style={[styles.typeCard, active && styles.typeCardActive]}
                    >
                      <MaterialCommunityIcons
                        name={SPOT_TYPE_ICONS[t] as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={18}
                        color={active ? Brand.purple : Palette.textMuted}
                      />
                      <Text style={[styles.typeCardText, active && styles.typeCardTextActive]} numberOfLines={2}>
                        {SPOT_TYPE_LABELS[t]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Environment — segmented */}
              <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Prostředí *</Text>
              <View style={styles.segmentRow}>
                {(Object.keys(ENVIRONMENT_LABELS) as SpotEnvironment[]).map((env) => {
                  const active = newSpot.environment === env;
                  const icon = env === 'outdoor' ? 'tree-outline' : env === 'indoor' ? 'home-outline' : 'swap-horizontal';
                  return (
                    <Pressable
                      key={env}
                      onPress={() => setNewSpot((p) => ({ ...p, environment: env }))}
                      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                    >
                      <MaterialCommunityIcons
                        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={14}
                        color={active ? '#fff' : Palette.textMuted}
                      />
                      <Text style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}>
                        {ENVIRONMENT_LABELS[env]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <FormField
                label="Název místa *"
                value={newSpot.name}
                onChangeText={(t) => setNewSpot((p) => ({ ...p, name: t }))}
                placeholder="např. Jumping Pardubice"
              />
              <FormField
                label="Město *"
                value={newSpot.city}
                onChangeText={(t) => setNewSpot((p) => ({ ...p, city: t }))}
                placeholder="např. Pardubice"
              />
              <FormField
                label="Adresa"
                value={newSpot.address}
                onChangeText={(t) => { setNewSpot((p) => ({ ...p, address: t })); setManualCoords(null); }}
                placeholder="Ulice, číslo popisné"
              />
              {/* GPS location button */}
              <Pressable
                onPress={useCurrentLocation}
                disabled={gpsLoading}
                style={({ pressed }) => [styles.gpsBtn, pressed && { opacity: 0.8 }, gpsLoading && { opacity: 0.6 }]}
              >
                <MaterialCommunityIcons name="crosshairs-gps" size={15} color={manualCoords ? Brand.purple : Palette.textMuted} />
                <Text style={[styles.gpsBtnText, manualCoords && { color: Brand.purple }]}>
                  {gpsLoading ? 'Získávám polohu…' : manualCoords ? `Poloha zachycena (${manualCoords.lat.toFixed(5)}, ${manualCoords.lng.toFixed(5)})` : 'Použít moji aktuální polohu'}
                </Text>
              </Pressable>
              <FormField
                label="Popis"
                value={newSpot.description}
                onChangeText={(t) => setNewSpot((p) => ({ ...p, description: t }))}
                placeholder="Vybavení, přístupnost…"
                multiline
              />
              <FormField
                label="Otevírací doba (nepovinné)"
                value={newSpot.opening_hours}
                onChangeText={(t) => setNewSpot((p) => ({ ...p, opening_hours: t }))}
                placeholder="např. Po–Pá 14–22, So–Ne 10–20"
              />
              <FormField
                label="Web (nepovinné)"
                value={newSpot.website}
                onChangeText={(t) => setNewSpot((p) => ({ ...p, website: t }))}
                placeholder="www.example.cz"
                keyboardType="url"
              />
              <FormField
                label="Vstup / cena (nepovinné)"
                value={newSpot.entry_fee}
                onChangeText={(t) => setNewSpot((p) => ({ ...p, entry_fee: t }))}
                placeholder="např. 150 Kč / hodina, nebo Zdarma"
              />

              {/* Tag picker */}
              <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Aktivity</Text>
              <View style={styles.tagsGrid}>
                {ALL_TAGS.map((tag) => {
                  const active = newSpot.tags.includes(tag);
                  const color = TAG_COLORS[tag] ?? Brand.purple;
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => setNewSpot((p) => ({
                        ...p,
                        tags: active ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
                      }))}
                      style={[styles.tagToggle, active && { borderColor: color, backgroundColor: `${color}18` }]}
                    >
                      <Text style={[styles.tagToggleText, active && { color, fontWeight: '700' }]}>
                        {TAG_LABELS[tag]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {addSpotError ? <Text style={styles.errorText}>{addSpotError}</Text> : null}

              <View style={styles.geoHint}>
                <MaterialCommunityIcons name="map-marker-radius-outline" size={13} color={Brand.purple} />
                <Text style={styles.geoHintText}>
                  {manualCoords ? 'Poloha zachycena z GPS — spot se zobrazí přesně.' : 'Polohu určíme automaticky z adresy, nebo použij tlačítko GPS výše.'}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.87 }]}
                onPress={() => void submitAddSpot()}
                disabled={addSpotLoading}
              >
                <LinearGradient
                  colors={[Brand.purple, Brand.pink]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  {addSpotLoading
                    ? (
                      <>
                        <ActivityIndicator color="#fff" />
                        {geocoding ? <Text style={styles.submitBtnText}>Hledám na mapě…</Text> : null}
                      </>
                    )
                    : (
                      <>
                        <FontAwesome5 name="map-marker-alt" size={14} color="#fff" />
                        <Text style={styles.submitBtnText}>Přidat spot</Text>
                      </>
                    )}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Palette.bg,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
    zIndex: 5,
  },
  iconBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: Palette.text, letterSpacing: -0.3 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Brand.purple, borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  coachHintPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Palette.surface, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Palette.border,
  },
  coachHintText: { color: Palette.textSubtle, fontSize: 10, fontWeight: '700' },

  // Location sharing bar
  shareBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Palette.bg,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
    zIndex: 5,
  },
  shareToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Palette.surface, borderRadius: Radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Palette.border,
  },
  shareToggleOn: { backgroundColor: '#15B8A6', borderColor: '#15B8A6' },
  shareToggleText: { color: Palette.textMuted, fontSize: 12, fontWeight: '800' },
  shareToggleTextOn: { color: '#fff' },
  shareHint: { flex: 1, color: Palette.textSubtle, fontSize: 11, fontWeight: '600' },

  // Coaches currently at a spot
  hereCard: {
    backgroundColor: '#15B8A610', borderRadius: Radius.md,
    borderWidth: 1, borderColor: '#15B8A633',
    padding: 12, marginBottom: 16, gap: 8,
  },
  hereHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hereTitle: { color: '#0F8A7C', fontSize: 13, fontWeight: '800' },
  hereRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  hereAvatar: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#15B8A6',
    alignItems: 'center', justifyContent: 'center',
  },
  hereAvatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  hereName: { flex: 1, color: Palette.text, fontSize: 13, fontWeight: '700' },
  hereXp: { color: '#0F8A7C', fontSize: 12, fontWeight: '800' },

  // Spot type grid
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 9,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Palette.border,
    backgroundColor: Palette.surface, minWidth: '47%',
  },
  typeCardActive: { borderColor: Brand.purple, backgroundColor: `${Brand.purple}10` },
  typeCardText: { fontSize: 12, fontWeight: '600', color: Palette.textMuted, flex: 1 },
  typeCardTextActive: { color: Brand.purple, fontWeight: '800' },

  // Environment segmented
  segmentRow: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  segmentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Palette.border, backgroundColor: Palette.surface,
  },
  segmentBtnActive: { backgroundColor: Brand.purple, borderColor: Brand.purple },
  segmentBtnText: { fontSize: 11, fontWeight: '700', color: Palette.textMuted },
  segmentBtnTextActive: { color: '#fff' },

  // Bottom panel
  bottomPanel: {
    backgroundColor: Palette.bg,
    borderTopWidth: 1, borderTopColor: Palette.border,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    ...Shadow.soft,
  },
  panelHandle: {
    alignItems: 'center', paddingTop: 8, paddingBottom: 6,
  },
  panelHandleBar: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: Palette.border, marginBottom: 5,
  },
  panelHandleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  panelHandleText: { fontSize: 12, fontWeight: '800', color: Palette.textMuted },
  cityFilter: { maxHeight: 50 },
  cityFilterContent: {
    paddingHorizontal: 16, paddingVertical: 8,
    gap: 8, flexDirection: 'row', alignItems: 'center',
  },
  cityChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.pill,
    borderWidth: 1.5, borderColor: Palette.border, backgroundColor: Palette.surface,
  },
  cityChipActive: { borderColor: Brand.purple, backgroundColor: `${Brand.purple}14` },
  cityChipText: { fontSize: 12, fontWeight: '700', color: Palette.textMuted },
  cityChipTextActive: { color: Brand.purple },
  listLabel: {
    fontSize: 11, fontWeight: '900', color: Palette.textSubtle,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginLeft: 16, marginBottom: 4,
  },
  spotsList: { paddingHorizontal: 16, gap: 12, paddingBottom: 6, alignItems: 'flex-start' },
  spotsListView: { flexGrow: 0 },

  // Spot card
  spotCard: {
    width: 190, height: 118, backgroundColor: Palette.surface,
    borderRadius: Radius.lg, padding: 14,
    borderWidth: 1.5, borderColor: Palette.border,
    ...Shadow.soft,
  },
  spotCardSelected: { borderColor: Brand.purple, backgroundColor: `${Brand.purple}06` },
  spotCardName: { fontSize: 13, fontWeight: '900', color: Palette.text, letterSpacing: -0.2 },
  spotCardCity: { fontSize: 11, color: Palette.textMuted, fontWeight: '600', marginTop: 2 },
  spotCardFooter: { marginTop: 'auto' },
  spotCardRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  spotCardReviewCount: { fontSize: 10, color: Palette.textSubtle, fontWeight: '600' },
  spotCardNoRating: { fontSize: 10, color: Palette.textSubtle, fontWeight: '700', marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 4, overflow: 'hidden' },
  tagChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  tagChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.1 },

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalDismiss: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: Palette.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '90%',
    borderTopWidth: 1, borderTopColor: Palette.border,
    ...Shadow.float,
  },
  dragHandle: {
    alignSelf: 'center', width: 40, height: 4,
    borderRadius: 2, backgroundColor: Palette.border, marginBottom: 14,
  },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: Palette.text, letterSpacing: -0.3, flexShrink: 1 },
  sheetSub: { fontSize: 13, color: Palette.textMuted, fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 4, marginTop: 2 },

  // Rating row
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  ratingNum: { fontSize: 16, fontWeight: '900', color: Brand.orange },
  ratingCount: { fontSize: 12, color: Palette.textSubtle, fontWeight: '600' },

  // Spot info
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Palette.surfaceAlt, paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Palette.border,
  },
  infoChipText: { fontSize: 11, fontWeight: '700', color: Palette.textMuted },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  description: { fontSize: 13, color: Palette.textMuted, lineHeight: 20, marginBottom: 16 },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Brand.purple,
    paddingVertical: 10, paddingHorizontal: 16, marginBottom: 20,
    backgroundColor: `${Brand.purple}08`, alignSelf: 'flex-start',
  },
  navBtnText: { color: Brand.purple, fontWeight: '800', fontSize: 13 },

  // Reviews
  reviewsSection: { gap: 12 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewsSectionTitle: { fontSize: 16, fontWeight: '900', color: Palette.text },
  addReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Brand.orange, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  addReviewBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  addReviewCard: {
    backgroundColor: Palette.surfaceAlt, borderRadius: Radius.lg,
    padding: 14, borderWidth: 1, borderColor: Palette.border, gap: 10,
  },
  addReviewCardTitle: { fontSize: 13, fontWeight: '900', color: Palette.text },
  reviewInput: {
    backgroundColor: Palette.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    padding: 10, fontSize: 13, color: Palette.text, minHeight: 72,
    textAlignVertical: 'top',
  },
  reviewBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  reviewSubmitBtn: {
    flex: 1, backgroundColor: Brand.orange,
    borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center',
  },
  reviewSubmitBtnDisabled: { opacity: 0.5 },
  reviewSubmitText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  reviewCancelBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
  },
  reviewCancelText: { color: Palette.textMuted, fontWeight: '700', fontSize: 13 },
  noReviews: { fontSize: 13, color: Palette.textSubtle, fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  reviewCard: {
    backgroundColor: Palette.surface, borderRadius: Radius.lg,
    padding: 12, borderWidth: 1, borderColor: Palette.border,
  },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  reviewAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: `${Brand.purple}22`, alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 13, fontWeight: '900', color: Brand.purple },
  reviewerName: { fontSize: 12, fontWeight: '900', color: Palette.text, marginBottom: 2 },
  reviewDate: { fontSize: 10, color: Palette.textSubtle, fontWeight: '600' },
  reviewComment: { fontSize: 12, color: Palette.textMuted, lineHeight: 18 },

  // Add spot form
  formField: { marginBottom: Spacing.md },
  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: Palette.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  textInput: {
    backgroundColor: Palette.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    padding: 12, fontSize: 14, color: Palette.text,
  },
  textInputMulti: { height: 90, textAlignVertical: 'top' },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tagToggle: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Palette.border,
  },
  tagToggleText: { fontSize: 12, fontWeight: '600', color: Palette.textMuted },
  errorText: { color: Palette.danger, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  geoHint: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: `${Brand.purple}10`,
    borderColor: `${Brand.purple}26`, borderWidth: 1,
    borderRadius: Radius.md, paddingVertical: 9, paddingHorizontal: 11,
    marginBottom: 12,
  },
  geoHintText: { color: Palette.textMuted, fontSize: 12, fontWeight: '600', flex: 1 },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderColor: Palette.border,
    borderRadius: Radius.md, paddingVertical: 9, paddingHorizontal: 11,
    marginBottom: 12, backgroundColor: Palette.surface,
  },
  gpsBtnText: { color: Palette.textMuted, fontSize: 12, fontWeight: '700', flex: 1 },
  submitBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  submitBtnGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 20, justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
