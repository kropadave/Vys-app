import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BoltIcon, CheckIcon, TargetIcon } from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { PARENT_CHILDREN } from '@/lib/data/parent';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function ParentChildrenScreen() {
  return (
    <ScrollView style={{ backgroundColor: Palette.bg }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Děti</Text>
      {PARENT_CHILDREN.map((child) => (
        <Card key={child.id} pad={16} radius={Radius.lg}>
          <View style={styles.header}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{child.name.slice(0, 2).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{child.name}</Text>
              <Text style={styles.sub}>{child.age} let · {child.city}</Text>
            </View>
            <Pill label={child.bracelet} variant="soft" icon={<BoltIcon size={14} />} />
          </View>
          <View style={styles.infoBox}>
            <Info label="Skupina" value={child.group} icon={<TargetIcon size={18} />} />
            <Info label="Další cíl" value={child.nextGoal} icon={<CheckIcon size={18} />} />
            <Info label="Docházka" value={`${Math.round(child.attendanceRate * 100)} %`} icon={<TargetIcon size={18} />} />
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, child.attendanceRate * 100)}%` }]} />
          </View>
        </Card>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <View style={styles.infoItem}>
      {icon}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  h1: { fontSize: 28, fontWeight: '900', color: Palette.text },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: Palette.primary100, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900', color: Palette.primary700 },
  name: { fontSize: 18, fontWeight: '900', color: Palette.text },
  sub: { color: Palette.textMuted, marginTop: 2 },
  infoBox: { flexDirection: 'row', gap: 8, marginTop: 14 },
  infoItem: { flex: 1, backgroundColor: Palette.primary50, borderRadius: Radius.md, padding: 10, gap: 4 },
  infoLabel: { color: Palette.textMuted, fontSize: 11, fontWeight: '700' },
  infoValue: { color: Palette.text, fontWeight: '800', fontSize: 12 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: Palette.primary50, marginTop: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: Palette.accentMint },
});
