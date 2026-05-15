export type PublicCoachProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  profilePhotoUri?: string;
  bankAccount?: string;
  iban?: string;
  payoutAccountHolder?: string;
  payoutNote?: string;
  taughtTricksCount: number;
  assignedCourseIds: string[];
};

export type CoachProfileOverride = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePhotoUri?: string;
  bankAccount?: string;
  iban?: string;
  payoutAccountHolder?: string;
  payoutNote?: string;
  taughtTricksCount?: number;
  assignedCourseIds?: string[];
};

export const seedCoachProfiles: PublicCoachProfile[] = [];

export function mergeCoachProfileOverrides(overrides: CoachProfileOverride[]) {
  return overrides.map((override) => ({
    id: override.id,
    name: override.name ?? 'TeamVYS trenér',
    email: override.email ?? '',
    phone: override.phone ?? '',
    bio: override.bio ?? 'Trenérský profil TeamVYS.',
    profilePhotoUri: override.profilePhotoUri,
    bankAccount: override.bankAccount,
    iban: override.iban,
    payoutAccountHolder: override.payoutAccountHolder,
    payoutNote: override.payoutNote,
    taughtTricksCount: override.taughtTricksCount ?? 0,
    assignedCourseIds: override.assignedCourseIds ?? [],
  }));
}

export function coachesForCourse(courseId: string, coaches: PublicCoachProfile[]) {
  return coaches.filter((coach) => coach.assignedCourseIds.includes(courseId));
}

export function coachInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TV';
}