import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { StatusPill } from '@/components/parent-card';
import { useAuth } from '@/hooks/use-auth';
import { useCoachCamps } from '@/hooks/use-coach-camps';
import { useCoachProfile } from '@/hooks/use-coach-profile';
import { useCoachReviews } from '@/hooks/use-coach-reviews';
import { useCoachSessions } from '@/hooks/use-coach-sessions';
import { WORKSHOP_HOURLY_RATE, WORKSHOP_MAX_COACHES, type CoachSession, type WorkshopCity, type WorkshopSlot } from '@/lib/coach-content';
import { coachReviewStats, reviewsForCoach } from '@/lib/coach-reviews';
import { CoachColors, CoachShadow } from '@/lib/coach-theme';
import { coachInitials } from '@/lib/course-coaches';
import { courses, type Course } from '@/lib/public-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { Radius, Spacing } from '@/lib/theme';

const FALLBACK_COACH_ID = 'coach-demo';
const WORKSHOP_SESSION_PREFIX = 'coach-workshop-';

function workshopDayLabel(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`);
  const labels = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  return labels[date.getDay()] ?? 'Sobota';
}
function formatWorkshopDate(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`);
  return `${workshopDayLabel(dateIso)} ${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}
function parseWorkshopMeta(primaryMeta: string): { dateIso: string; time: string } {
  const isoDates = primaryMeta.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
  const czechDates = Array.from(primaryMeta.matchAll(/(\d{1,2})\.(\s*)(\d{1,2})\.(\s*)(\d{4})?/g)).map((m) => {
    const year = m[5] ? Number(m[5]) : new Date().getFullYear();
    return `${year}-${String(Number(m[3])).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`;
  });
  const dateIso = isoDates[0] ?? czechDates[0] ?? new Date().toISOString().slice(0, 10);
  const timeMatch = primaryMeta.match(/\d{1,2}:\d{2}\s*(?:[-\u2013]\s*\d{1,2}:\d{2})?/);
  const time = timeMatch ? timeMatch[0].replace(/\s*[-\u2013]\s*/, ' - ') : '10:00 - 17:00';
  return { dateIso, time };
}
function workshopCityFromString(city: string): WorkshopCity {
  if (city === 'Praha' || city === 'Ostrava' || city === 'Brno') return city;
  return 'Brno';
}
function workshopSessionId(coachId: string, slotId: string) {
  return `${WORKSHOP_SESSION_PREFIX}${coachId}-${slotId}`;
}
function workshopDurationHours(time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})\s*[-\u2013]\s*(\d{1,2}):(\d{2})/);
  if (!match) return 4;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  return end > start ? (end - start) / 60 : 4;
}
async function loadWorkshopSlots(): Promise<WorkshopSlot[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  const { data: productsData } = await supabase
    .from('products')
    .select('id, city, venue, primary_meta, capacity_current, important_info, coach_ids')
    .eq('type', 'Workshop');
  if (!productsData) return [];
  const products = productsData as Array<{ id: string; city: string; venue: string; primary_meta: string; capacity_current: number; important_info: Array<{ label: string; value: string }> | null }>;
  const { data: rowsData } = await supabase
    .from('coach_sessions')
    .select('id, coach_id')
    .like('id', `${WORKSHOP_SESSION_PREFIX}%`);
  const rows = (rowsData as Array<{ id: string; coach_id: string }> | null) ?? [];
  const coachIds = Array.from(new Set(rows.map((r) => r.coach_id).filter(Boolean)));
  const nameById = new Map<string, string>();
  if (coachIds.length > 0) {
    const { data: profilesData } = await supabase.from('app_profiles').select('id, name').in('id', coachIds);
    for (const p of (profilesData as Array<{ id: string; name: string | null }> | null) ?? []) nameById.set(p.id, p.name ?? 'Trenér');
  }
  const coachesBySlotId = new Map<string, WorkshopSlot['coaches']>();
  for (const row of rows) {
    const prefix = `${WORKSHOP_SESSION_PREFIX}${row.coach_id}-`;
    const slotId = row.id.startsWith(prefix) ? row.id.slice(prefix.length) : null;
    if (!slotId) continue;
    const coaches = coachesBySlotId.get(slotId) ?? [];
    if (!coaches.some((c) => c.coachId === row.coach_id)) coaches.push({ coachId: row.coach_id, coachName: nameById.get(row.coach_id) ?? 'Trenér' });
    coachesBySlotId.set(slotId, coaches);
  }
  return products.map((product) => {
    const { dateIso, time } = parseWorkshopMeta(product.primary_meta);
    const info = Array.isArray(product.important_info) ? product.important_info : [];
    return {
      id: product.id,
      date: dateIso,
      dateTo: dateIso,
      time,
      city: workshopCityFromString(product.city),
      venue: product.venue,
      coaches: coachesBySlotId.get(product.id) ?? [],
      maxCoaches: WORKSHOP_MAX_COACHES,
      trick1: info.find((i) => i.label === 'Trik 1')?.value,
      trick2: info.find((i) => i.label === 'Trik 2')?.value,
      enrolledKids: product.capacity_current,
      updatedAt: '',
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

function courseLocation(course: Course) {
  return `${course.city} · ${course.venue}`;
}

function courseTime(course: Course) {
  return `${course.from} - ${course.to}`;
}

function courseGroup(course: Course) {
  return `Kroužek ${course.city}`;
}

function courseMatchesSession(course: Course, sessionItem: CoachSession) {
  return sessionItem.city === course.city
    && sessionItem.venue === course.venue
    && sessionItem.day === course.day
    && sessionItem.time === courseTime(course);
}

export default function CoachProfile() {
  const router = useRouter();
  const { session } = useAuth();
  const currentCoachId = session?.userId ?? FALLBACK_COACH_ID;
  const { coach, saveCoachProfilePhoto, saveCoachPayoutDetails, saveCoachPhone } = useCoachProfile(currentCoachId);
  const { sessions: myCoachSessions, loading: coachSessionsLoading, addSession, assignCourse, removeSession } = useCoachSessions();
  const { camps: myCamps, loading: campsLoading } = useCoachCamps(currentCoachId);
  const coachLevel = Math.max(1, Math.floor(coach.taughtTricksCount / 20) + 1);
  const coachXp = coach.taughtTricksCount * 25;
  const coachNextLevelXp = Math.max(500, coachLevel * 500);
  const progress = Math.min(coachXp / coachNextLevelXp, 1);
  const { reviews } = useCoachReviews();
  const coachReviews = reviewsForCoach(reviews, currentCoachId);
  const reviewStats = coachReviewStats(coachReviews);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState('');
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(coach.phone ?? '');
  const [phoneMessage, setPhoneMessage] = useState('');
  const [payoutForm, setPayoutForm] = useState({
    bankAccount: coach.bankAccount ?? '',
    iban: coach.iban ?? '',
    payoutAccountHolder: coach.payoutAccountHolder ?? coach.name,
    payoutNote: coach.payoutNote ?? '',
  });
  const [payoutSheetOpen, setPayoutSheetOpen] = useState(false);
  const [coursesSheetOpen, setCoursesSheetOpen] = useState(false);
  const [courseActionId, setCourseActionId] = useState<string | null>(null);
  const [courseMessage, setCourseMessage] = useState('');
  const [workshopsSheetOpen, setWorkshopsSheetOpen] = useState(false);
  const [workshopSlots, setWorkshopSlots] = useState<WorkshopSlot[]>([]);
  const [workshopLoading, setWorkshopLoading] = useState(false);
  const [workshopActionId, setWorkshopActionId] = useState<string | null>(null);
  const [workshopMessage, setWorkshopMessage] = useState('');
  const [adminCourses, setAdminCourses] = useState<Course[]>([]);
  const staticCourseIds = useMemo(() => new Set(courses.map((c) => c.id)), []);
  const allCourses = useMemo(() => [...courses, ...adminCourses], [adminCourses]);
  const assignedCourseIds = useMemo(
    () => new Set(allCourses.filter((course) => myCoachSessions.some((sessionItem) => courseMatchesSession(course, sessionItem))).map((course) => course.id)),
    [allCourses, myCoachSessions],
  );

  useEffect(() => {
    async function loadAdminCourses() {
      try {
        const { courses: raw } = await apiClient.courses() as { courses: Array<{ id: string; city: string; venue: string; place: string; primary_meta: string; price: number; price_label: string; capacity_total: number }> };
        const parsed: Course[] = raw
          .filter((item) => !staticCourseIds.has(item.id))
          .map((item) => {
            const match = (item.primary_meta ?? '').match(/^(.+?)\s*·\s*(\d+:\d+)\s*[-\u2013]\s*(\d+:\d+)/);
            const day = match ? match[1].trim() : item.primary_meta ?? '';
            const from = match ? match[2].trim() : '';
            const to = match ? match[3].trim() : '';
            return {
              id: item.id,
              city: item.city,
              venue: item.venue || item.place,
              day,
              from,
              to,
              price: item.price_label || `${item.price} Kč`,
              priceAmount: item.price,
              capacityTotal: item.capacity_total,
            };
          });
        setAdminCourses(parsed);
      } catch {
        // keep static list as fallback
      }
    }
    void loadAdminCourses();
  }, [staticCourseIds]);

  useEffect(() => {
    loadWorkshopSlots().then(setWorkshopSlots).catch(() => {});
  }, []);

  useEffect(() => {
    setPayoutForm({
      bankAccount: coach.bankAccount ?? '',
      iban: coach.iban ?? '',
      payoutAccountHolder: coach.payoutAccountHolder ?? coach.name,
      payoutNote: coach.payoutNote ?? '',
    });
  }, [coach.id, coach.bankAccount, coach.iban, coach.name, coach.payoutAccountHolder, coach.payoutNote]);

  useEffect(() => {
    setPhoneValue(coach.phone ?? '');
  }, [coach.id, coach.phone]);

  function updatePayoutField(field: keyof typeof payoutForm, value: string) {
    setPayoutForm((current) => ({ ...current, [field]: value }));
    setPayoutMessage('');
  }

  async function savePhone() {
    setSavingPhone(true);
    setPhoneMessage('');
    try {
      await saveCoachPhone(currentCoachId, phoneValue);
      setPhoneMessage('Telefonní číslo je uložené.');
    } catch (error) {
      setPhoneMessage(error instanceof Error ? error.message : 'Telefon se nepodařilo uložit.');
    } finally {
      setSavingPhone(false);
    }
  }

  async function savePayoutDetails() {
    setSavingPayout(true);
    setPayoutMessage('');

    try {
      await saveCoachPayoutDetails(currentCoachId, payoutForm);
      setPayoutMessage('Výplatní údaje jsou uložené pro administraci.');
    } catch (error) {
      setPayoutMessage(error instanceof Error ? error.message : 'Výplatní údaje se nepodařilo uložit.');
    } finally {
      setSavingPayout(false);
    }
  }

  async function openWorkshopsSheet() {
    setWorkshopsSheetOpen(true);
    setWorkshopLoading(true);
    try {
      const slots = await loadWorkshopSlots();
      setWorkshopSlots(slots);
    } finally {
      setWorkshopLoading(false);
    }
  }

  async function toggleWorkshopAssignment(slot: WorkshopSlot) {
    const isAssigned = slot.coaches.some((c) => c.coachId === currentCoachId);
    setWorkshopActionId(slot.id);
    setWorkshopMessage('');
    try {
      if (isAssigned) {
        if (!hasSupabaseConfig || !supabase) throw new Error('Nejsi přihlášen.');
        await supabase.from('coach_sessions').delete().eq('id', workshopSessionId(currentCoachId, slot.id)).eq('coach_id', currentCoachId);
        setWorkshopSlots((prev) => prev.map((s) => s.id !== slot.id ? s : { ...s, coaches: s.coaches.filter((c) => c.coachId !== currentCoachId) }));
        setWorkshopMessage(`${slot.city} odebráno.`);
      } else {
        if (slot.coaches.length >= slot.maxCoaches) throw new Error('Workshop je plně obsazen.');
        if (!hasSupabaseConfig || !supabase) throw new Error('Nejsi přihlášen.');
        const row = { id: workshopSessionId(currentCoachId, slot.id), coach_id: currentCoachId, city: slot.city, venue: slot.venue, day: workshopDayLabel(slot.date), time: slot.time, group_name: `Workshop:${slot.id}`, enrolled: 0, present: 0, duration_hours: workshopDurationHours(slot.time), hourly_rate: WORKSHOP_HOURLY_RATE, latitude: null, longitude: null, check_in_radius_meters: 300 };
        const { error } = await supabase.from('coach_sessions').upsert(row);
        if (error) throw error;
        const { data: profile } = await supabase.from('app_profiles').select('name').eq('id', currentCoachId).maybeSingle();
        const myName = (profile as { name?: string } | null)?.name ?? 'Trenér';
        setWorkshopSlots((prev) => prev.map((s) => s.id !== slot.id ? s : { ...s, coaches: [...s.coaches, { coachId: currentCoachId, coachName: myName }] }));
        setWorkshopMessage(`${slot.city} přidáno.`);
      }
    } catch (err) {
      setWorkshopMessage(err instanceof Error ? err.message : 'Akci se nepodařilo uložit.');
    } finally {
      setWorkshopActionId(null);
    }
  }
  async function toggleCourseAssignment(course: Course) {
    const assignedSession = myCoachSessions.find((sessionItem) => courseMatchesSession(course, sessionItem));
    setCourseActionId(course.id);
    setCourseMessage('');

    try {
      if (assignedSession) {
        await removeSession(assignedSession.id);
        setCourseMessage(`${courseLocation(course)} odebráno z tvých kroužků.`);
      } else if (staticCourseIds.has(course.id)) {
        await assignCourse(course.id);
        setCourseMessage(`${courseLocation(course)} přidáno do tvých kroužků.`);
      } else {
        // Admin-created course — build session input directly
        const fromMin = course.from ? (() => { const [h, m] = course.from.split(':').map(Number); return h * 60 + m; })() : 0;
        const toMin = course.to ? (() => { const [h, m] = course.to.split(':').map(Number); return h * 60 + m; })() : 60;
        const durationHrs = toMin > fromMin ? (toMin - fromMin) / 60 : 1;
        await addSession({
          city: course.city,
          venue: course.venue,
          day: course.day,
          time: `${course.from} - ${course.to}`,
          group: `Kroužek ${course.city}`,
          durationHours: durationHrs,
        });
        setCourseMessage(`${courseLocation(course)} přidáno do tvých kroužků.`);
      }
    } catch (error) {
      setCourseMessage(error instanceof Error ? error.message : 'Kroužek se nepodařilo uložit.');
    } finally {
      setCourseActionId(null);
    }
  }

  const pickProfilePhoto = async () => {
    setPhotoMessage('');

    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoMessage('Povolte prosím přístup ke galerii v nastavení zařízení.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.72,
      base64: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const profilePhotoUri = asset.base64
      ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
      : asset.uri;

    setSavingPhoto(true);
    await saveCoachProfilePhoto(currentCoachId, profilePhotoUri);
    setSavingPhoto(false);
    setPhotoMessage('Fotka je uložená.');
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <CoachPageHeader
        kicker="Trenér · Profil"
        title="Profil trenéra"
        subtitle="Osobní údaje, hodnocení, přiřazené kroužky a tábory na jednom místě."
        icon="user"
        metrics={[
          { label: 'Level', value: String(coachLevel), tone: 'blue' },
          { label: 'Potvrzení', value: String(coach.taughtTricksCount), tone: 'teal' },
          { label: 'Recenze', value: reviewStats.label, tone: 'amber' },
        ]}
      />

      <CoachCard>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {coach.profilePhotoUri ? (
              <Image source={{ uri: coach.profilePhotoUri }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarInitials}>{coachInitials(coach.name)}</Text>
            )}
          </View>
        </View>
        <Text style={styles.name}>{coach.name}</Text>
        <Text style={styles.profileContact}>{coach.email} · {coach.phone}</Text>
        <Pressable onPress={pickProfilePhoto} disabled={savingPhoto} style={({ pressed }: any) => [styles.photoButton, pressed && styles.photoButtonPressed, savingPhoto && styles.photoButtonDisabled]}>
          <Text style={styles.photoButtonText}>{savingPhoto ? 'Ukládám...' : coach.profilePhotoUri ? 'Změnit profilovou fotku' : 'Nahrát profilovou fotku'}</Text>
        </Pressable>
        {photoMessage ? <Text style={styles.photoMessage}>{photoMessage}</Text> : null}
        <View style={styles.divider} />
        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{coachLevel}</Text>
            <Text style={styles.levelBadgeLabel}>Level</Text>
          </View>
          <View style={styles.xpCol}>
            <Text style={styles.profileLabel}>Progres</Text>
            <Text style={styles.profileValue}>{coach.taughtTricksCount} potvrzení</Text>
            <Text style={styles.xpText}>{coachXp} / {coachNextLevelXp} XP</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        </View>
      </CoachCard>

      <CoachCard title="Profil trenéra">
        <Text style={styles.cardTitle}>Obecné info</Text>
        <Text style={styles.muted}>{coach.bio}</Text>
        <View style={styles.infoGrid}>
          <Info label="E-mail" value={coach.email} />
        </View>
        <Text style={[styles.muted, { marginTop: Spacing.sm, marginBottom: 4 }]}>Telefon</Text>
        <View style={styles.phoneRow}>
          <TextInput
            style={[styles.phoneInput, { flex: 1 }]}
            value={phoneValue}
            onChangeText={(v) => { setPhoneValue(v); setPhoneMessage(''); }}
            placeholder="+420 777 221 904"
            keyboardType="phone-pad"
            placeholderTextColor="#A0A8B4"
          />
          <Pressable onPress={savePhone} disabled={savingPhone} style={({ pressed }: any) => [styles.phoneSaveBtn, pressed && styles.photoButtonPressed, savingPhone && styles.photoButtonDisabled]}>
            <Text style={styles.photoButtonText}>{savingPhone ? '...' : 'Uložit'}</Text>
          </Pressable>
        </View>
        {phoneMessage ? <Text style={styles.photoMessage}>{phoneMessage}</Text> : null}
      </CoachCard>

      <Pressable
        onPress={() => setPayoutSheetOpen(true)}
        style={({ pressed }) => [styles.payoutTrigger, pressed && { opacity: 0.84 }]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.payoutTriggerKicker}>Profil trenéra</Text>
          <Text style={styles.payoutTriggerTitle}>Výplatní údaje</Text>
          <Text style={styles.payoutTriggerSub}>
            {payoutForm.bankAccount || payoutForm.iban
              ? payoutForm.bankAccount || payoutForm.iban
              : 'Bez účtu ti admin nemůže poslat výplatu'}
          </Text>
        </View>
        <View style={styles.payoutTriggerIcon}>
          <Text style={styles.payoutTriggerIconText}>+</Text>
        </View>
      </Pressable>

      <ProfileSheet
        visible={payoutSheetOpen}
        title="Výplatní údaje"
        subtitle="Účet, IBAN a poznámky k výplatě pro administraci."
        onClose={() => setPayoutSheetOpen(false)}
      >
        <View style={styles.sheetIntroCard}>
          <Text style={styles.sheetIntroTitle}>Údaje pro výplatu</Text>
          <Text style={styles.sheetIntroText}>Stačí vyplnit číslo účtu nebo IBAN. Admin je uvidí u výplat a DPP.</Text>
        </View>
        {!payoutForm.bankAccount && !payoutForm.iban ? (
          <View style={styles.payoutWarning}>
            <Text style={styles.payoutWarningTitle}>Bez účtu ti admin nemůže poslat výplatu</Text>
            <Text style={styles.payoutWarningText}>Vyplň číslo účtu nebo IBAN a klikni na Uložit.</Text>
          </View>
        ) : null}
        <View style={styles.formGrid}>
          <PayoutField label="Majitel účtu" value={payoutForm.payoutAccountHolder} onChange={(value) => updatePayoutField('payoutAccountHolder', value)} placeholder="Jméno majitele účtu" />
          <PayoutField label="Číslo účtu" value={payoutForm.bankAccount} onChange={(value) => updatePayoutField('bankAccount', value)} placeholder="123456789/2010" />
          <PayoutField label="IBAN" value={payoutForm.iban} onChange={(value) => updatePayoutField('iban', value)} placeholder="CZ65 2010 0000 0029 0234 5671" autoCapitalize="characters" />
          <PayoutField label="Poznámka" value={payoutForm.payoutNote} onChange={(value) => updatePayoutField('payoutNote', value)} placeholder="Např. preferuji měsíční výplatu" multiline />
        </View>
        <Pressable
          onPress={async () => { await savePayoutDetails(); setPayoutSheetOpen(false); }}
          disabled={savingPayout}
          style={({ pressed }: any) => [styles.payoutButton, pressed && styles.photoButtonPressed, savingPayout && styles.photoButtonDisabled]}
        >
          <Text style={styles.photoButtonText}>{savingPayout ? 'Ukládám...' : 'Uložit výplatní údaje'}</Text>
        </Pressable>
        {payoutMessage ? <Text style={styles.photoMessage}>{payoutMessage}</Text> : null}
      </ProfileSheet>

      <CoachCard title="Hodnocení od rodičů">
        <View style={styles.infoGrid}>
          <Info label="Průměr" value={reviewStats.label} />
          <Info label="Počet recenzí" value={`${reviewStats.count}`} />
        </View>
        {coachReviews.length === 0 ? <Text style={styles.muted}>Zatím není uložená žádná recenze.</Text> : null}
        {coachReviews.map((review) => (
          <View key={review.id} style={styles.reviewRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardTitle}>{review.parentName}</Text>
              <Text style={styles.muted}>{review.participantName} · {review.createdAt}</Text>
              <Text style={styles.reviewText}>{review.comment}</Text>
            </View>
            <StatusPill label={`${review.rating} / 5`} tone={review.rating >= 4 ? 'success' : 'warning'} />
          </View>
        ))}
      </CoachCard>

      <Pressable
        onPress={() => setCoursesSheetOpen(true)}
        style={({ pressed }) => [styles.payoutTrigger, pressed && { opacity: 0.84 }]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.payoutTriggerKicker}>Rozvrh</Text>
          <Text style={styles.payoutTriggerTitle}>Zapsané kroužky</Text>
          <Text style={styles.payoutTriggerSub}>
            {assignedCourseIds.size > 0
              ? `${assignedCourseIds.size} přiřazen${assignedCourseIds.size === 1 ? 'ý kroužek' : assignedCourseIds.size < 5 ? 'é kroužky' : 'é kroužků'} · klepni pro správu`
              : 'Zatím nejsi přiřazen k žádnému kroužku'}
          </Text>
        </View>
        <View style={styles.payoutTriggerIcon}>
          <Text style={styles.payoutTriggerIconText}>+</Text>
        </View>
      </Pressable>

      <ProfileSheet
        visible={coursesSheetOpen}
        title="Zapsané kroužky"
        subtitle="Přehled přiřazení a rychlý vstup do docházky."
        onClose={() => setCoursesSheetOpen(false)}
      >
        {coachSessionsLoading ? <Text style={styles.muted}>Načítám aktuální kroužky...</Text> : null}
        <View style={styles.courseList}>
          {allCourses.map((course) => {
            const isAssigned = assignedCourseIds.has(course.id);
            const isSaving = courseActionId === course.id;
            return (
              <View key={course.id} style={[styles.courseRow, isAssigned && styles.courseRowActive]}>
                <View style={styles.courseTitleRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.courseCity}>{course.city}</Text>
                    <Text style={styles.courseVenue}>{course.venue}</Text>
                  </View>
                  <StatusPill label={isAssigned ? 'Zapsáno' : 'Volné'} tone={isAssigned ? 'success' : 'neutral'} />
                </View>
                <Text style={styles.courseMeta}>{course.day} · {courseTime(course)} · {courseGroup(course)}</Text>
                <View style={styles.courseActions}>
                  {isAssigned ? (
                    <Pressable
                      onPress={() => { setCoursesSheetOpen(false); router.push('/attendance' as never); }}
                      style={({ pressed }: any) => [styles.courseAttendanceButton, pressed && { opacity: 0.84 }]}
                    >
                      <Text style={styles.courseAttendanceGlyph}>✓</Text>
                      <Text style={styles.courseAttendanceButtonText}>Docházka</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    disabled={isSaving}
                    onPress={() => toggleCourseAssignment(course)}
                    style={({ pressed }: any) => [
                      styles.courseButton,
                      isAssigned && styles.courseButtonRemove,
                      pressed && styles.photoButtonPressed,
                      isSaving && styles.photoButtonDisabled,
                    ]}
                  >
                    <Text style={[styles.courseButtonGlyph, isAssigned && styles.courseButtonGlyphRemove]}>{isAssigned ? '-' : '+'}</Text>
                    <Text style={[styles.courseButtonText, isAssigned && styles.courseButtonTextRemove]}>{isSaving ? 'Ukládám...' : isAssigned ? 'Odebrat' : 'Přidat'}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
        {courseMessage ? <Text style={styles.photoMessage}>{courseMessage}</Text> : null}
      </ProfileSheet>

      <CoachCard title="Moje workshopy">
        {workshopSlots.filter((s) => s.coaches.some((c) => c.coachId === currentCoachId) && s.date >= new Date().toISOString().slice(0, 10)).length === 0 ? (
          <Text style={styles.muted}>Nemáš přiřazený žádný nadcházející workshop.</Text>
        ) : (
          workshopSlots
            .filter((s) => s.coaches.some((c) => c.coachId === currentCoachId) && s.date >= new Date().toISOString().slice(0, 10))
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((s) => (
              <View key={s.id} style={styles.campRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardTitle}>{s.city} · {s.time}</Text>
                  <Text style={styles.muted}>{formatWorkshopDate(s.date)} · {s.venue}</Text>
                </View>
                <StatusPill label="Přiřazeno" tone="warning" />
              </View>
            ))
        )}
      </CoachCard>



      <CoachCard title="Moje tábory">
        {campsLoading ? <Text style={styles.muted}>Načítám přiřazené tábory...</Text> : null}
        {!campsLoading && myCamps.length === 0 ? (
          <Text style={styles.muted}>Zatím ti není přiřazen žádný tábor.</Text>
        ) : (
          myCamps.map((camp) => {
            const dateStr = camp.eventDate || camp.primaryMeta;
            return (
              <View key={camp.id} style={styles.campRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardTitle}>{camp.title}</Text>
                  <Text style={styles.muted}>{camp.city} · {camp.venue}</Text>
                  <Text style={styles.muted}>{dateStr}</Text>
                  {camp.participants.length > 0 ? (
                    <View style={styles.campParticipants}>
                      {camp.participants.map((participant) => (
                        <Text key={participant.purchaseId} style={styles.campParticipant}>• {participant.participantName}</Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.muted}>Zatím nejsou přihlášení účastníci.</Text>
                  )}
                </View>
                <StatusPill label={`${camp.participants.length} účastníků`} tone="success" />
              </View>
            );
          })
        )}
      </CoachCard>
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function PayoutField({ label, value, onChange, placeholder, multiline = false, autoCapitalize = 'sentences' }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' }) {
  return (
    <View style={[styles.payoutField, multiline && styles.payoutFieldWide]}>
      <Text style={styles.payoutLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={CoachColors.slateMuted}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={[styles.payoutInput, multiline && styles.payoutInputMultiline]}
      />
    </View>
  );
}

function ProfileSheet({ visible, title, subtitle, onClose, children }: { visible: boolean; title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.profileSheet}>
          <LinearGradient colors={[CoachColors.blue, CoachColors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sheetHeaderGradient}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderContent}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.sheetTitle}>{title}</Text>
                <Text style={styles.sheetSubtitle}>{subtitle}</Text>
              </View>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.sheetCloseButton, pressed && { opacity: 0.72 }]}>
                <Text style={styles.sheetCloseText}>x</Text>
              </Pressable>
            </View>
          </LinearGradient>
          <ScrollView style={styles.sheetBody} contentContainerStyle={styles.sheetBodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 104 },
  avatarWrap: { alignItems: 'center', marginBottom: Spacing.md },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: CoachColors.slate, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderColor: '#FFFFFF', borderWidth: 4, shadowColor: CoachColors.slate, shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  name: { color: CoachColors.slate, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  profileContact: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  photoButton: { alignSelf: 'center', marginTop: Spacing.md, backgroundColor: CoachColors.blue, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  photoButtonPressed: { opacity: 0.78 },
  photoButtonDisabled: { opacity: 0.58 },
  photoButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  photoMessage: { color: CoachColors.slateMuted, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  divider: { height: 1, backgroundColor: CoachColors.border, marginVertical: Spacing.md },
  levelRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  levelBadge: { backgroundColor: CoachColors.panelAlt, borderRadius: Radius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl ?? Spacing.lg, alignItems: 'center', justifyContent: 'center', minWidth: 88 },
  levelNumber: { color: CoachColors.slate, fontSize: 48, lineHeight: 52, fontWeight: '900' },
  levelBadgeLabel: { color: CoachColors.slateMuted, fontSize: 13, marginTop: 2 },
  xpCol: { flex: 1, gap: 4 },
  xpText: { color: CoachColors.slateMuted, fontSize: 12 },
  profileLabel: { color: CoachColors.blue, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  profileValue: { color: CoachColors.slate, fontSize: 22, fontWeight: '900' },
  progressTrack: { height: 10, backgroundColor: CoachColors.panelAlt, borderRadius: Radius.pill, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: CoachColors.teal, borderRadius: Radius.pill },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  infoBox: { backgroundColor: CoachColors.panelAlt, borderRadius: Radius.md, padding: Spacing.md, minWidth: 180, flexGrow: 1 },
  infoValue: { color: CoachColors.slate, fontSize: 15, lineHeight: 21, fontWeight: '900' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  payoutField: { flexGrow: 1, flexBasis: 240, gap: 7 },
  payoutFieldWide: { flexBasis: '100%' },
  payoutLabel: { color: CoachColors.blue, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  payoutInput: { minHeight: 48, borderWidth: 1, borderColor: CoachColors.border, borderRadius: Radius.md, backgroundColor: '#FFFFFF', color: CoachColors.slate, fontSize: 15, lineHeight: 20, fontWeight: '800', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  payoutInputMultiline: { minHeight: 86, textAlignVertical: 'top' },
  payoutButton: { alignSelf: 'stretch', backgroundColor: CoachColors.teal, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  phoneInput: { minHeight: 48, borderWidth: 1, borderColor: CoachColors.border, borderRadius: Radius.md, backgroundColor: '#FFFFFF', color: CoachColors.slate, fontSize: 15, lineHeight: 20, fontWeight: '800', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginTop: 4 },
  phoneSaveBtn: { backgroundColor: CoachColors.teal, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  payoutTrigger: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.panel, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, ...CoachShadow.soft },
  payoutTriggerKicker: { color: CoachColors.blue, fontSize: 10, lineHeight: 14, fontWeight: '900', textTransform: 'uppercase' },
  payoutTriggerTitle: { color: CoachColors.slate, fontSize: 17, lineHeight: 23, fontWeight: '900' },
  payoutTriggerSub: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  payoutTriggerIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(21,154,116,0.16)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  payoutTriggerIconText: { color: CoachColors.teal, fontSize: 25, lineHeight: 28, fontWeight: '900' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(10,5,20,0.68)', justifyContent: 'flex-end' },
  profileSheet: { backgroundColor: CoachColors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', overflow: 'hidden' },
  sheetHeaderGradient: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.48)', alignSelf: 'center', marginBottom: Spacing.md },
  sheetHeaderContent: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  sheetTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 29, fontWeight: '900' },
  sheetSubtitle: { color: 'rgba(255,255,255,0.76)', fontSize: 13, lineHeight: 18, marginTop: 2, fontWeight: '700' },
  sheetCloseButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.22)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { color: '#FFFFFF', fontSize: 18, lineHeight: 20, fontWeight: '900' },
  sheetBody: { flexGrow: 0 },
  sheetBodyContent: { padding: Spacing.lg, paddingBottom: 42, gap: Spacing.md },
  sheetIntroCard: { backgroundColor: CoachColors.panel, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  sheetIntroTitle: { color: CoachColors.slate, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  sheetIntroText: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  payoutWarning: { backgroundColor: CoachColors.amberSoft, borderColor: 'rgba(245,158,11,0.34)', borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.md, gap: 6 },
  payoutWarningTitle: { color: '#7A4F00', fontSize: 14, fontWeight: '900', lineHeight: 20 },
  payoutWarningText: { color: '#7A4F00', fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  cardTitle: { color: CoachColors.slate, fontSize: 17, lineHeight: 23, fontWeight: '900' },
  courseList: { gap: Spacing.sm },
  courseRow: { gap: Spacing.sm, backgroundColor: CoachColors.panel, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  courseRowActive: { borderColor: 'rgba(21,154,116,0.34)', backgroundColor: '#F0FBF7' },
  courseTitleRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  courseCity: { color: CoachColors.slate, fontSize: 16, lineHeight: 21, fontWeight: '900' },
  courseVenue: { color: CoachColors.slate, fontSize: 14, lineHeight: 19, fontWeight: '800', marginTop: 1 },
  courseMeta: { color: CoachColors.slateMuted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  courseActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 2 },
  courseButton: { minHeight: 40, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 9, backgroundColor: CoachColors.blue, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  courseButtonRemove: { backgroundColor: '#FFFFFF', borderColor: CoachColors.blue, borderWidth: 1.5 },
  courseButtonGlyph: { color: '#FFFFFF', fontSize: 17, lineHeight: 18, fontWeight: '900' },
  courseButtonGlyphRemove: { color: CoachColors.blue },
  courseButtonText: { color: '#FFFFFF', fontSize: 13, lineHeight: 17, fontWeight: '900' },
  courseButtonTextRemove: { color: CoachColors.blue },
  courseAttendanceButton: { minHeight: 40, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 9, backgroundColor: '#F0FBF7', borderColor: CoachColors.teal, borderWidth: 1.5, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  courseAttendanceGlyph: { color: CoachColors.teal, fontSize: 13, lineHeight: 15, fontWeight: '900' },
  courseAttendanceButtonText: { color: CoachColors.teal, fontSize: 13, lineHeight: 17, fontWeight: '900' },
  reviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  reviewText: { color: CoachColors.slate, fontSize: 14, lineHeight: 20 },
  campRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  campParticipants: { marginTop: Spacing.sm, gap: 3 },
  campParticipant: { color: CoachColors.slate, fontSize: 13, lineHeight: 18, fontWeight: '800' },
});