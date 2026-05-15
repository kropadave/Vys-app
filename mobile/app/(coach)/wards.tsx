import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { StatusPill } from '@/components/parent-card';
import { useAuth } from '@/hooks/use-auth';
import { useBraceletConfirmations } from '@/hooks/use-bracelet-confirmations';
import { useCoachCamps } from '@/hooks/use-coach-camps';
import { useCoachWards } from '@/hooks/use-coach-wards';
import { needsPhysicalBracelet } from '@/lib/coach-content';
import { CoachColors } from '@/lib/coach-theme';
import { Radius, Spacing } from '@/lib/theme';

type ActivityFilter = 'krouzek' | 'workshop' | 'tabor';

export default function CoachWards() {
  const router = useRouter();
  const { session } = useAuth();
  const { wards: allWards, loading: wardsLoading } = useCoachWards();
  const { camps, loading: campsLoading } = useCoachCamps(session?.userId ?? '');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('krouzek');
  const [searchQuery, setSearchQuery] = useState('');
  const { confirmedIds, confirmPhysicalBracelet } = useBraceletConfirmations();
  const normalizedQuery = normalizeSearch(searchQuery);
  const typeWards = allWards.filter((ward) => ward.activityType === activityFilter);
  const visibleWards = normalizedQuery ? typeWards.filter((ward) => wardMatchesQuery(ward, normalizedQuery)) : typeWards;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <CoachPageHeader
        kicker="Trenér · Svěřenci"
        title="Svěřenci na tréninku"
        subtitle="Rychlý seznam dětí podle typu aktivity, kontakt na rodiče, permanentka a náramek bez zbytečného hledání."
        icon="users"
        metrics={[
          { label: activityFilter === 'krouzek' ? 'Kroužek' : activityFilter === 'workshop' ? 'Workshop' : 'Tábor', value: activityFilter === 'tabor' ? String(camps.reduce((s, c) => s + c.participants.length, 0)) : (visibleWards.length ? String(visibleWards.length) : '0'), tone: 'blue' },
          { label: 'Celkem dětí', value: String(allWards.length + camps.reduce((s, c) => s + c.participants.length, 0)), tone: 'teal' },
          { label: 'Náramky', value: String(allWards.filter((ward) => needsPhysicalBracelet(ward, confirmedIds)).length), tone: 'amber' },
        ]}
      />

      <Pressable
        onPress={() => router.push('/participant-search' as never)}
        style={({ pressed }) => [styles.globalSearchButton, pressed && { opacity: 0.86 }]}
      >
        <Feather name="search" size={18} color="#fff" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.globalSearchTitle}>Hledat kohokoliv z databáze</Text>
          <Text style={styles.globalSearchSub}>Workshop bez telefonu? Vyhledej účastníka podle jména a přidej trik.</Text>
        </View>
        <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.72)" />
      </Pressable>

      <CoachCard title="Typ aktivity">
        <View style={styles.typeToggleRow}>
          {(['krouzek', 'workshop', 'tabor'] as const).map((type) => (
            <Pressable
              key={type}
              style={({ pressed }) => [styles.typeToggleBtn, activityFilter === type && styles.typeToggleBtnActive, pressed && { opacity: 0.82 }]}
              onPress={() => setActivityFilter(type)}
            >
              <Feather name={type === 'krouzek' ? 'users' : type === 'workshop' ? 'map-pin' : 'sun'} size={15} color={activityFilter === type ? '#fff' : CoachColors.slate} />
              <Text style={[styles.typeToggleBtnText, activityFilter === type && styles.typeToggleBtnTextActive]}>{type === 'krouzek' ? 'Kroužek' : type === 'workshop' ? 'Workshop' : 'Tábor'}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.muted}>{activityFilter === 'krouzek' ? 'Zobrazuji svěřence z kroužků.' : activityFilter === 'workshop' ? 'Zobrazuji svěřence z workshopů.' : 'Přihlášené děti na táboře — prezenční listina.'}</Text>
      </CoachCard>

      <CoachCard title="Rychlé vyhledání">
        <View style={styles.searchBox}>
          <Feather name="search" size={20} color={CoachColors.slate} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Napiš jméno dítěte, telefon rodiče nebo lokalitu"
            placeholderTextColor={CoachColors.slateMuted}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.72 }]}>
              <Feather name="x" size={18} color={CoachColors.slateMuted} />
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.muted}>{normalizedQuery ? `Nalezeno ${activityFilter === 'tabor' ? camps.reduce((s, c) => s + c.participants.filter((p) => normalizeSearch(p.participantName).includes(normalizedQuery)).length, 0) : visibleWards.length} svěřenců napříč lokalitami.` : `Zobrazuji ${activityFilter === 'tabor' ? camps.reduce((s, c) => s + c.participants.length, 0) : visibleWards.length} svěřenců pro vybranou lokalitu.`}</Text>
      </CoachCard>

      {activityFilter === 'tabor' ? (
        camps.length === 0 && !campsLoading ? (
          <CoachCard>
            <Text style={styles.muted}>Nejsi přiřazen k žádnému táboru nebo zatím nikdo není přihlášen.</Text>
          </CoachCard>
        ) : camps.map((camp) => {
          const filteredParticipants = normalizedQuery
            ? camp.participants.filter((p) => normalizeSearch(p.participantName).includes(normalizedQuery))
            : camp.participants;
          if (filteredParticipants.length === 0 && normalizedQuery) return null;
          return (
            <View key={camp.id}>
              <View style={styles.campHeader}>
                <Feather name="sun" size={15} color={CoachColors.teal} />
                <Text style={styles.campHeaderTitle}>{camp.title}</Text>
                <Text style={styles.campHeaderMeta}>{camp.primaryMeta}</Text>
                <View style={styles.campCountBadge}>
                  <Text style={styles.campCountText}>{filteredParticipants.length}</Text>
                </View>
              </View>
              {filteredParticipants.map((p) => (
                <View key={p.purchaseId} style={styles.campRow}>
                  <View style={styles.campRowMain}>
                    <View style={styles.campDot} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.name}>{p.participantName}</Text>
                      {(p.allergies || p.healthLimits || p.medication) ? (
                        <Text style={[styles.muted, { color: CoachColors.amber }]} numberOfLines={1}>
                          {[p.allergies, p.healthLimits, p.medication].filter(Boolean).join(' · ')}
                        </Text>
                      ) : (
                        <Text style={styles.muted}>Bez zdravotních omezení</Text>
                      )}
                      {p.departureMode !== 'parent' && p.authorizedPeople ? (
                        <Text style={styles.muted} numberOfLines={1}>Vyzvednutí: {p.authorizedPeople}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.callIconBtn, pressed && { opacity: 0.82 }]}
                      onPress={() => callParent(p.parentPhone)}
                    >
                      <Feather name="phone" size={15} color={CoachColors.blue} />
                    </Pressable>
                  </View>
                </View>
              ))}
              {filteredParticipants.length === 0 && !normalizedQuery ? (
                <CoachCard>
                  <Text style={styles.muted}>Zatím žádné přihlášky na tento tábor.</Text>
                </CoachCard>
              ) : null}
            </View>
          );
        })
      ) : (
        <>
          {visibleWards.map((ward) => (
        <Pressable key={ward.id} onPress={() => router.push({ pathname: '/ward-detail', params: { id: ward.id } } as never)} style={({ pressed }) => [styles.wardRow, pressed && { opacity: 0.86 }]}> 
          {needsPhysicalBracelet(ward, confirmedIds) && (
            <View style={styles.braceletAlert}>
              <Feather name="alert-circle" size={13} color={CoachColors.amber} />
              <Text style={styles.braceletAlertText}>Předat náramek {ward.bracelet}</Text>
              <Pressable style={({ pressed }) => [styles.confirmButtonSmall, pressed && { opacity: 0.86 }]} onPress={(e) => { e.stopPropagation?.(); confirmPhysicalBracelet(ward.id); }}>
                <Text style={styles.confirmButtonSmallText}>Obdržen</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.wardRowMain}>
            <View style={[styles.braceletDot, { backgroundColor: ward.braceletColor }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name}>{ward.name}</Text>
              <Text style={styles.muted}>{ward.bracelet} · {ward.entriesLeft}x vstupů · {ward.hasNfcChip ? 'NFC' : 'Ručně'}</Text>
            </View>
            <View style={styles.wardRowRight}>
              <StatusPill label={ward.paymentStatus} tone={ward.paymentStatus === 'Zaplaceno' ? 'success' : 'warning'} />
              <Pressable style={({ pressed }) => [styles.callIconBtn, pressed && { opacity: 0.82 }]} onPress={(e) => { e.stopPropagation?.(); callParent(ward.parentPhone); }}>
                <Feather name="phone" size={15} color={CoachColors.blue} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      ))}
      {visibleWards.length === 0 && (
          <CoachCard>
            <Text style={styles.muted}>{normalizedQuery ? `Na dotaz „${searchQuery}" není žádný svěřenec.` : activityFilter === 'krouzek' ? 'Zatím nejsou z databáze načtení žádní svěřenci kroužku.' : 'Zatím nejsou z databáze načtení žádní svěřenci workshopu.'}</Text>
          </CoachCard>
        )}
        </>
      )}
    </ScrollView>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function wardMatchesQuery(ward: { name: string; parentPhone: string; locations: string[] }, normalizedQuery: string) {
  const searchable = normalizeSearch(`${ward.name} ${ward.parentPhone} ${ward.locations.join(' ')}`);
  return searchable.includes(normalizedQuery);
}

function callParent(phone: string) {
  const phoneHref = phone.replace(/\s+/g, '');
  Linking.openURL(`tel:${phoneHref}`).catch(() => undefined);
}

const styles = StyleSheet.create({
  page: { backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.md, paddingBottom: 104 },
  globalSearchButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.blue, borderRadius: Radius.lg, padding: Spacing.lg },
  globalSearchTitle: { color: '#fff', fontSize: 15, fontWeight: '900', lineHeight: 20 },
  globalSearchSub: { color: 'rgba(255,255,255,0.76)', fontSize: 12, lineHeight: 17, marginTop: 2 },
  typeToggleRow: { flexDirection: 'row', gap: Spacing.sm },
  typeToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  typeToggleBtnActive: { backgroundColor: CoachColors.blue, borderColor: CoachColors.blue },
  typeToggleBtnText: { color: CoachColors.slate, fontSize: 15, fontWeight: '900' },
  typeToggleBtnTextActive: { color: '#fff' },
  searchBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.borderStrong, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md },
  searchInput: { flex: 1, minWidth: 0, color: CoachColors.slate, fontSize: 16, lineHeight: 22, fontWeight: '800', paddingVertical: Spacing.md },
  clearButton: { width: 34, height: 34, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: CoachColors.panel },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: CoachColors.slate, fontSize: 17, lineHeight: 23, fontWeight: '900' },
  // Compact ward row
  wardRow: { backgroundColor: CoachColors.panel, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  braceletAlert: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: CoachColors.amberSoft, borderBottomColor: 'rgba(217,119,6,0.22)', borderBottomWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  braceletAlertText: { flex: 1, color: CoachColors.slate, fontSize: 12, fontWeight: '800' },
  confirmButtonSmall: { backgroundColor: CoachColors.teal, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 5 },
  confirmButtonSmallText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  wardRowMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  braceletDot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
  name: { color: CoachColors.slate, fontSize: 16, lineHeight: 21, fontWeight: '900' },
  wardRowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 0 },
  callIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: CoachColors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  // Camp section
  campHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  campHeaderTitle: { flex: 1, color: CoachColors.slate, fontSize: 15, fontWeight: '900' },
  campHeaderMeta: { color: CoachColors.slateMuted, fontSize: 12, fontWeight: '700' },
  campCountBadge: { backgroundColor: CoachColors.teal, borderRadius: Radius.pill, minWidth: 26, alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  campCountText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  campRow: { backgroundColor: CoachColors.panel, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: 4 },
  campRowMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  campDot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0, backgroundColor: CoachColors.teal },
});
