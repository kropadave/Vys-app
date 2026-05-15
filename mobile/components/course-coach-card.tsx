import { Image, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/lib/brand';
import { coachInitials, type PublicCoachProfile } from '@/lib/course-coaches';
import { Palette, Radius, Spacing } from '@/lib/theme';

type Props = {
  coach: PublicCoachProfile;
  compact?: boolean;
};

export function CourseCoachCard({ coach, compact = false }: Props) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.avatar, compact && styles.avatarCompact]}>
        {coach.profilePhotoUri ? (
          <Image source={{ uri: coach.profilePhotoUri }} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.initials, compact && styles.initialsCompact]}>{coachInitials(coach.name)}</Text>
        )}
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>Zde učí</Text>
        <Text style={[styles.name, compact && styles.nameCompact]}>{coach.name}</Text>
        <Text style={styles.meta}>Telefon {coach.phone}</Text>
        <Text style={styles.meta}>{coach.taughtTricksCount} odučených triků</Text>
      </View>
    </View>
  );
}

export function CourseCoachList({ coaches, compact = false }: { coaches: PublicCoachProfile[]; compact?: boolean }) {
  if (coaches.length === 0) return null;

  return (
    <View style={[styles.list, compact && styles.listCompact]}>
      {coaches.map((coach) => <CourseCoachCard key={coach.id} coach={coach} compact={compact} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
  listCompact: { gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(46,231,214,0.10)',
    borderColor: 'rgba(46,231,214,0.28)',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  cardCompact: { padding: 10, gap: 10 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    backgroundColor: Brand.purple,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  avatarCompact: { width: 48, height: 48, borderRadius: 24 },
  avatarImage: { width: '100%', height: '100%' },
  initials: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  initialsCompact: { fontSize: 15 },
  copy: { flex: 1, minWidth: 0 },
  kicker: { color: Brand.cyanDeep, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  name: { color: Palette.text, fontSize: 17, lineHeight: 23, fontWeight: '900' },
  nameCompact: { fontSize: 15, lineHeight: 20 },
  meta: { color: Palette.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '800' },
});