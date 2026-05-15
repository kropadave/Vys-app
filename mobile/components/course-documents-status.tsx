import { StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/parent-card';
import { courseDocumentProgress, type CourseDocumentEnrollment, type StoredCourseDocument } from '@/lib/course-documents';
import { Palette, Radius, Spacing } from '@/lib/theme';

export function CourseDocumentsStatus({
  enrollment,
  documents,
  compact = false,
}: {
  enrollment: CourseDocumentEnrollment;
  documents: StoredCourseDocument[];
  compact?: boolean;
}) {
  const progress = courseDocumentProgress(documents, enrollment);
  const missingLabel = progress.complete ? 'Vše podepsáno' : `Chybí: ${progress.missingTitles.join(', ')}`;
  const label = enrollment.activityType === 'Tábor' ? 'Dokumenty k příměstskému táboru' : 'Dokumenty ke kroužku';

  return (
    <View style={[styles.box, compact && styles.boxCompact, progress.complete ? styles.boxComplete : styles.boxOpen]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.title}>{enrollment.title}</Text>
          <Text style={styles.muted}>{enrollment.participantName} · {enrollment.place}</Text>
        </View>
        <StatusPill label={`${progress.signed}/${progress.required}`} tone={progress.complete ? 'success' : 'warning'} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(progress.signed / progress.required) * 100}%` }]} />
      </View>

      <Text style={styles.muted}>{missingLabel}</Text>
      <View style={styles.button}>
        <Text style={styles.buttonText}>{progress.complete ? 'Dokumenty hotové na webu' : 'Vyplnit ve webovém portálu'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  boxCompact: { minWidth: 260, flex: 1 },
  boxOpen: { backgroundColor: Palette.accentSoft, borderColor: 'rgba(255,178,26,0.34)' },
  boxComplete: { backgroundColor: Palette.successSoft, borderColor: 'rgba(31,179,122,0.34)' },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.md },
  label: { color: Palette.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 17, lineHeight: 22, fontWeight: '900' },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
  progressTrack: { height: 10, backgroundColor: 'rgba(20,14,38,0.10)', borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Palette.success, borderRadius: Radius.pill },
  button: { alignSelf: 'flex-start', backgroundColor: Palette.primaryDark, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  buttonText: { color: '#fff', fontWeight: '900' },
});