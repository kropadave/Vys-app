import { skillTreeTricks, type SkillDiscipline } from '@/lib/participant-content';

export type CoachSession = {
  id: string;
  city: string;
  venue: string;
  day: string;
  time: string;
  group: string;
  enrolled: number;
  present: number;
  durationHours?: number;
  hourlyRate?: number;
  latitude?: number;
  longitude?: number;
  checkInRadiusMeters?: number;
};

export type SharedTrainingSlot = {
  id: string;
  activityType: 'Krouzek' | 'Tabor' | 'Workshop';
  day: string;
  time: string;
  place: string;
  group: string;
  regularCoachId: string;
  regularCoachName: string;
  assignedCoachId?: string;
  assignedCoachName?: string;
  secondCoachId?: string;
  secondCoachName?: string;
  releasedBy?: string;
  releaseReason?: string;
  updatedAt: string;
};

export type WorkshopCity = 'Brno' | 'Praha' | 'Ostrava';
export type WorkshopCoachRef = { coachId: string; coachName: string };
export type WorkshopSlot = {
  id: string;
  date: string; // Saturday ISO date
  dateTo: string; // Sunday ISO date
  time: string; // "10:00 - 17:00"
  city: WorkshopCity;
  venue: string;
  coaches: WorkshopCoachRef[];
  maxCoaches: number;
  notes?: string;
  updatedAt: string;
};

export const WORKSHOP_HOURLY_RATE = 750;
export const WORKSHOP_MAX_COACHES = 4;

export type CampCoachRef = { coachId: string; coachName: string };
export type CampTurnus = {
  id: string;
  campId: string;
  campTitle: string;
  city: string;
  venue: string;
  dateFrom: string;
  dateTo: string;
  durationDays: number;
  coaches: CampCoachRef[];
  maxCoaches: number;
};

export const CAMP_DAILY_RATE = 1500;
export const CAMP_MAX_COACHES = 3;

export const campTurnusy: CampTurnus[] = [];

const WORKSHOP_VENUES: Record<WorkshopCity, string[]> = {
  Brno: ['Sportovní hala Vodova', 'TJ Sokol Brno-Líšeň', 'Sportovní centrum Omega Brno'],
  Praha: ['Hala Strahov', 'TJ Sokol Vinohrady', 'Sportovní centrum Chodov Praha'],
  Ostrava: ['Hala Poruba', 'TJ Sokol Zábřeh Ostrava', 'Sportovní hala Vítkovice'],
};
const WS_CITY_CYCLE: WorkshopCity[] = ['Brno', 'Praha', 'Ostrava'];
const WS_SEEDED: Record<string, { coaches: WorkshopCoachRef[]; notes?: string }> = {};
function generateWeekendWorkshopSlots(): WorkshopSlot[] {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const slots: WorkshopSlot[] = [];
  const cur = new Date(2025, 9, 1);
  const end = new Date(2026, 5, 30);
  let idx = 0;
  while (cur <= end) {
    if (cur.getDay() === 6) {
      const weekendDays = [new Date(cur), new Date(cur)];
      weekendDays[1].setDate(weekendDays[1].getDate() + 1);
      const primaryCity = WS_CITY_CYCLE[idx % 3];
      WS_CITY_CYCLE.forEach((city) => {
        const venueList = WORKSHOP_VENUES[city];
        const venue = venueList[Math.floor(idx / 3) % venueList.length];
        const isPrimary = city === primaryCity;
        weekendDays.forEach((day) => {
          const dateStr = fmt(day);
          const seeded = WS_SEEDED[dateStr];
          slots.push({ id: `ws-${city.toLowerCase()}-${dateStr}`, date: dateStr, dateTo: dateStr, time: '13:00 - 17:00', city, venue, coaches: isPrimary ? (seeded?.coaches ?? []) : [], maxCoaches: 4, notes: isPrimary ? seeded?.notes : undefined, updatedAt: isPrimary && seeded ? dateStr.split('-').reverse().join('.') : '' });
        });
      });
      idx++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return slots;
}
export const workshopCalendar: WorkshopSlot[] = generateWeekendWorkshopSlots();

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type TrainingVenue = {
  id: string;
  label: string;
  city: string;
  venue: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type TrainingVenueCheck = {
  venue?: TrainingVenue;
  distanceMeters?: number;
  allowedRadiusMeters?: number;
  allowed: boolean;
};

export type CoachTrick = {
  id: string;
  title: string;
  bracelet: string;
  xp: number;
  category: string;
  level: number;
  levelTitle: string;
  discipline: SkillDiscipline;
  description: string;
  order: number;
};

export type DepartureMode = 'parent' | 'alone' | 'authorized';

export type CoachWardDeparture = {
  mode: DepartureMode;
  signed: boolean;
  signedAt: string;
  authorizedPeople: string;
  note: string;
};

export type CoachWardHealth = {
  allergies: string;
  limits: string;
  medication: string;
  emergencyPhone: string;
};

export type CoachWardSkillTrick = CoachTrick & {
  completed: boolean;
  manual: boolean;
};

export type CoachWard = {
  id: string;
  name: string;
  parentName: string;
  locations: string[];
  activityType: 'krouzek' | 'tabor' | 'workshop';
  parentPhone: string;
  emergencyPhone: string;
  birthYear: number;
  schoolYear: string;
  coachNote: string;
  departure: CoachWardDeparture;
  health: CoachWardHealth;
  level: number;
  bracelet: string;
  braceletColor: string;
  paymentStatus: 'Zaplaceno' | 'Čeká na platbu';
  physicalBraceletReceived: boolean;
  hasNfcChip: boolean;
  nfcChipId?: string;
  passTitle: string;
  entriesLeft: number;
  lastAttendance: string;
  completedTrickIds: string[];
};

export type ChildAttendanceRecord = {
  id: string;
  date: string;
  location: string;
  attendees: {
    name: string;
    time: string;
    method: 'NFC' | 'Ručně';
  }[];
};

export const coachProfile = {
  name: 'TeamVYS trenér',
  email: '',
  phone: '',
  address: '',
  bio: 'Trenérský profil TeamVYS.',
  level: 1,
  xp: 0,
  nextLevelXp: 1,
  qrTricksApproved: 0,
  attendanceLogged: 0,
  currentLocation: '',
  assignedCourses: [],
};

// Bonusy jsou výhradně z Cesty odměn (XP milníky). Žádné jiné typy bonusů.
export const coachPaymentStats = {
  nextPayout: 'Bez záznamu',
  baseAmount: 0,
  approvedBonuses: 0,
  pendingBonuses: 0,
  status: 'Bez záznamu',
};

export const coachSessions: CoachSession[] = [];

export const sharedTrainingCalendar: SharedTrainingSlot[] = [];

export const trainingVenues: TrainingVenue[] = [
  { id: 'venue-vyskov-nadrazni', label: 'Vyškov · ZŠ Nádražní', city: 'Vyškov', venue: 'ZŠ Nádražní', latitude: 49.2775, longitude: 16.9984, radiusMeters: 300 },
  { id: 'venue-vyskov-purkynova', label: 'Vyškov · ZŠ Purkyňova', city: 'Vyškov', venue: 'ZŠ Purkyňova', latitude: 49.2792, longitude: 17.0029, radiusMeters: 300 },
  { id: 'venue-prostejov-melantrichova', label: 'Prostějov · ZŠ Melantrichova', city: 'Prostějov', venue: 'ZŠ Melantrichova', latitude: 49.4734, longitude: 17.1128, radiusMeters: 350 },
  { id: 'venue-vyskov-orel', label: 'Vyškov · Orel jednota Vyškov', city: 'Vyškov', venue: 'Orel jednota Vyškov', latitude: 49.2789, longitude: 16.9997, radiusMeters: 300 },
];

export const coachAttendanceHistory: { date: string; place: string; status: 'Zapsáno'; present: string }[] = [];

export const childAttendanceHistory: ChildAttendanceRecord[] = [];

export const coachTricks: CoachTrick[] = skillTreeTricks.map((trick) => ({
  id: trick.id,
  title: trick.title,
  bracelet: trick.stage.title,
  xp: trick.xp,
  category: trick.discipline,
  level: trick.level,
  levelTitle: trick.levelTitle,
  discipline: trick.discipline,
  description: trick.description,
  order: trick.order,
}));

export const coachWards: CoachWard[] = [];

// monthlyXp = XP za triky udělené svěřencům tento měsíc. bonus = součet odměn z Cesty odměn.
export const coachLeaderboard: { rank: number; name: string; xp: number; qr: number; bonus: string; avatarColor: string; initials: string }[] = [];

export const coachRewardPath = [
  { xp: 500, title: 'TeamVYS badge trenéra', reward: 'Profilový odznak', unlocked: true },
  { xp: 1200, title: 'Stabilní docházka', reward: '+300 Kč', unlocked: true },
  { xp: 1800, title: 'QR progres svěřenců', reward: '+500 Kč', unlocked: true },
  { xp: 2400, title: 'Mentor skupiny', reward: '+1000 Kč', unlocked: false },
];

export function coachXpProgress() {
  return Math.min(coachProfile.xp / coachProfile.nextLevelXp, 1);
}

export function sessionLocation(session: CoachSession) {
  return `${session.city} · ${session.venue}`;
}

export function trainingVenueForLocation(location: string) {
  return trainingVenues.find((venue) => venue.label === location);
}

export function distanceBetweenMeters(from: GeoCoordinates, to: Pick<TrainingVenue, 'latitude' | 'longitude'>) {
  const earthRadiusMeters = 6371000;
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const haversine = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function verifyCoachAtTrainingVenue(
  location: string,
  coordinates: GeoCoordinates,
  sessionGps?: { latitude: number; longitude: number; radiusMeters: number },
): TrainingVenueCheck {
  const venue = trainingVenueForLocation(location);
  const gps = sessionGps ?? (venue ? { latitude: venue.latitude, longitude: venue.longitude, radiusMeters: venue.radiusMeters } : null);
  if (!gps) return { allowed: true }; // No GPS configured — allow (fallback)

  const distanceMeters = Math.round(distanceBetweenMeters(coordinates, gps));
  const accuracyAllowance = Math.min(Math.max(coordinates.accuracy ?? 0, 0), 80);
  const allowedRadiusMeters = gps.radiusMeters + accuracyAllowance;

  return {
    venue,
    distanceMeters,
    allowedRadiusMeters,
    allowed: distanceMeters <= allowedRadiusMeters,
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function findSessionByLocation(location: string) {
  return coachSessions.find((session) => sessionLocation(session) === location);
}

export function wardsForLocation(location: string) {
  return coachWards.filter((ward) => ward.locations.includes(location));
}

export function findCoachWardById(id: string) {
  return coachWards.find((ward) => ward.id === id) ?? null;
}

export function departureModeLabel(mode: DepartureMode) {
  if (mode === 'alone') return 'Může odejít samo';
  if (mode === 'authorized') return 'Pověřené osoby';
  return 'Vyzvedne rodič';
}

export function childAttendanceForWard(wardName: string) {
  return childAttendanceHistory
    .map((record) => {
      const attendee = record.attendees.find((item) => item.name === wardName);
      return attendee ? { ...record, attendee } : null;
    })
    .filter((record): record is ChildAttendanceRecord & { attendee: ChildAttendanceRecord['attendees'][number] } => record !== null);
}

export function skillTreeProgressForWard(ward: CoachWard, manualTrickIds: string[] = []) {
  const manualIds = new Set(manualTrickIds);
  const completedIds = new Set([...ward.completedTrickIds, ...manualTrickIds]);
  const tricks: CoachWardSkillTrick[] = coachTricks.map((trick) => ({
    ...trick,
    completed: completedIds.has(trick.id),
    manual: manualIds.has(trick.id),
  }));
  const completed = tricks.filter((trick) => trick.completed);
  const missing = tricks.filter((trick) => !trick.completed);
  const percent = tricks.length > 0 ? completed.length / tricks.length : 0;

  return { tricks, completed, missing, completedCount: completed.length, missingCount: missing.length, total: tricks.length, percent };
}

export function childAttendanceForLocation(location: string) {
  return childAttendanceHistory.filter((record) => record.location === location);
}

export function needsPhysicalBracelet(ward: CoachWard, confirmedIds: string[] = []) {
  return ward.activityType === 'krouzek' && ward.paymentStatus === 'Zaplaceno' && !ward.physicalBraceletReceived && !confirmedIds.includes(ward.id);
}

export function physicalBraceletNotifications(confirmedIds: string[] = []) {
  return coachWards.filter((ward) => needsPhysicalBracelet(ward, confirmedIds)).map((ward) => ({
    wardId: ward.id,
    wardName: ward.name,
    location: ward.locations[0],
    bracelet: ward.bracelet,
    coachMessage: `${ward.name} má zaplacený kroužek a musí dostat fyzický náramek ${ward.bracelet}.`,
    participantMessage: `Máš zaplacený kroužek. Na tréninku dostaneš fyzický náramek ${ward.bracelet}.`,
  }));
}