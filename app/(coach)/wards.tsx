import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ArrowRightIcon,
  BoltIcon,
  BraceletIcon,
  CheckIcon,
  HourglassIcon,
  TargetIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { BraceletPaletteByLevel, Palette, Radius, Shadow, Spacing } from '@/lib/theme';
import { WARDS, type WardSummary } from '@/lib/data/coach';
import { BRACELET_LEVELS, currentBracelet } from '@/lib/data/mock';

export default function WardsScreen() {
  const [filter, setFilter] = useState<'all' | 'ready' | 'present'>('all');

  const groups = useMemo(() => {
    const map = new Map<string, WardSummary[]>();
    for (const w of WARDS) {
      const key = w.group;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries());
  }, []);

  const filtered = (list: WardSummary[]) => {
    if (filter === 'ready') return list.filter((w) => w.readyForBraceletUp);
    if (filter === 'present') return list.filter((w) => w.presentToday);
    return list;
  };

  function awardBracelet(w: WardSummary) {
    const next = currentBracelet(w.braceletLevel + 1);
    Alert.alert(
      'Udělit nový náramek?',
      `${w.firstName} dostane ${next.name.toLowerCase()} náramek.`,
      [
        { text: 'Zrušit', style: 'cancel' },
        { text: 'Udělit', onPress: () => Alert.alert('Hotovo', `${w.firstName} má teď ${next.name.toLowerCase()} náramek!`) },
      ],
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Svěřenci</Text>

      {/* Filtry */}
      <View style={styles.filterRow}>
        <FilterChip label="Všichni" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label="Dnes přítomní" active={filter === 'present'} onPress={() => setFilter('present')} />
        <FilterChip label="Připraveni na náramek" active={filter === 'ready'} onPress={() => setFilter('ready')} />
      </View>

      {groups.map(([groupName, list]) => {
        const visible = filtered(list);
        if (visible.length === 0) return null;
        return (
          <View key={groupName} style={{ gap: 10 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{groupName}</Text>
              <Text style={styles.sectionSub}>{visible.length}</Text>
            </View>

            {visible.map((w) => (
              <WardCard key={w.id} ward={w} onAward={() => awardBracelet(w)} />
            ))}
          </View>
        );
      })}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

function WardCard({ ward, onAward }: { ward: WardSummary; onAward: () => void }) {
  const palette = BraceletPaletteByLevel[ward.braceletLevel] ?? BraceletPaletteByLevel[1];
  const bracelet = currentBracelet(ward.braceletLevel);
  const next = BRACELET_LEVELS.find((b) => b.id === ward.braceletLevel + 1);
  const xpToNext = next ? Math.max(0, next.xpRequired - ward.xp) : 0;
  const progress = next
    ? Math.min(1, (ward.xp - bracelet.xpRequired) / (next.xpRequired - bracelet.xpRequired))
    : 1;

  return (
    <Card pad={14} radius={Radius.lg}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.avatar, { backgroundColor: palette.soft }]}>
          <Text style={[styles.avatarText, { color: palette.main }]}>
            {ward.firstName[0]}{ward.lastName[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.wardName}>{ward.firstName} {ward.lastName}</Text>
          <Text style={styles.wardSub}>{ward.age} let · {ward.xp} XP</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Pill
              label={bracelet.name}
              variant="plain"
              icon={<BraceletIcon size={14} tint={palette.main} />}
            />
            {ward.presentToday && <Pill label="Dnes" variant="mint" icon={<CheckIcon size={14} />} />}
            {!ward.presentToday && <Pill label="Chybí" variant="plain" icon={<HourglassIcon size={14} />} />}
          </View>
        </View>
      </View>

      {/* Skill stats */}
      <View style={styles.statsRow}>
        <MiniStat icon={<TargetIcon size={18} />} label="Triky" value={`${ward.masteredTricks}`} />
        <MiniStat icon={<BoltIcon size={18} />} label="Učí se" value={`${ward.inProgressTricks}`} />
        <MiniStat icon={<HourglassIcon size={18} />} label="Docházka" value={`${Math.round(ward.attendanceRate * 100)} %`} />
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: palette.main }]} />
      </View>
      <Text style={styles.progressText}>
        {next ? `Do náramku ${next.name.toLowerCase()}: ${xpToNext} XP` : 'Nejvyšší úroveň'}
      </Text>

      {ward.readyForBraceletUp && next && (
        <Pressable onPress={onAward} style={styles.awardBtn}>
          <BraceletIcon size={18} tint={Palette.textOnAccent} />
          <Text style={styles.awardBtnText}>Udělit {next.name.toLowerCase()} náramek</Text>
          <ArrowRightIcon tint={Palette.textOnAccent} />
        </Pressable>
      )}
    </Card>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      {icon}
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  h1: { fontSize: 28, fontWeight: '800', color: Palette.text },

  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill,
    backgroundColor: Palette.surface, ...Shadow.soft,
  },
  filterChipActive: { backgroundColor: Palette.primary500 },
  filterText: { fontWeight: '700', color: Palette.text, fontSize: 13 },
  filterTextActive: { color: Palette.surface },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Palette.text },
  sectionSub: { color: Palette.textMuted },

  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800' },
  wardName: { fontWeight: '800', color: Palette.text, fontSize: 15 },
  wardSub: { color: Palette.textMuted, marginTop: 2, fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  miniStat: {
    flex: 1, padding: 10, backgroundColor: Palette.primary50, borderRadius: Radius.md,
    alignItems: 'center', gap: 2,
  },
  miniStatValue: { fontWeight: '800', color: Palette.text, fontSize: 15 },
  miniStatLabel: { color: Palette.textMuted, fontSize: 11, fontWeight: '600' },

  progressTrack: {
    height: 8, borderRadius: 4, backgroundColor: Palette.primary50, marginTop: 12, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { color: Palette.textMuted, fontSize: 12, marginTop: 6 },

  awardBtn: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: Radius.pill, backgroundColor: Palette.accentYellow,
  },
  awardBtnText: { color: Palette.textOnAccent, fontWeight: '800' },
});
