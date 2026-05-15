import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { CoachColors, CoachShadow } from '@/lib/coach-theme';
import { Radius, Spacing } from '@/lib/theme';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];
type CoachTone = 'blue' | 'pink' | 'teal' | 'amber' | 'red' | 'slate';

type HeaderMetric = {
  label: string;
  value: string;
  tone?: CoachTone;
};

type CoachPageHeaderProps = {
  kicker: string;
  title: string;
  subtitle?: string;
  icon: FeatherIconName;
  metrics?: HeaderMetric[];
  actionLabel?: string;
  actionIcon?: FeatherIconName;
  onActionPress?: () => void;
};

type CoachCardProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function CoachPageHeader({ kicker, title, subtitle, icon, metrics = [], actionLabel, actionIcon = 'arrow-right', onActionPress }: CoachPageHeaderProps) {
  return (
    <View style={styles.header}>
      <View pointerEvents="none" style={styles.headerAccentWrap}>
        <View style={[styles.headerAccent, { backgroundColor: CoachColors.blue, flex: 1.05 }]} />
        <View style={[styles.headerAccent, { backgroundColor: CoachColors.pink, flex: 0.9 }]} />
        <View style={[styles.headerAccent, { backgroundColor: CoachColors.amber, flex: 0.75 }]} />
      </View>
      <View style={styles.headerTop}>
        <View style={styles.headerIcon}>
          <Feather name={icon} size={22} color={CoachColors.blue} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {metrics.length > 0 ? (
        <View style={styles.metricGrid}>
          {metrics.map((metric) => (
            <View key={`${metric.label}-${metric.value}`} style={[styles.metric, metricStyle(metric.tone)]}>
              <Text style={[styles.metricValue, { color: toneColor(metric.tone) }]}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {actionLabel && onActionPress ? (
        <Pressable style={({ pressed }) => [styles.headerAction, pressed && { opacity: 0.84 }]} onPress={onActionPress}>
          <Text style={styles.headerActionText}>{actionLabel}</Text>
          <Feather name={actionIcon} size={16} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

export function CoachCard({ title, subtitle, right, children }: CoachCardProps) {
  return (
    <View style={styles.card}>
      {title || subtitle || right ? (
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function CoachIconButton({ icon, label, onPress, tone = 'blue' }: { icon: FeatherIconName; label: string; onPress: () => void; tone?: CoachTone }) {
  return (
    <Pressable style={({ pressed }) => [styles.iconButton, { backgroundColor: toneColor(tone) }, pressed && { opacity: 0.86 }]} onPress={onPress}>
      <Feather name={icon} size={17} color="#fff" />
      <Text style={styles.iconButtonText}>{label}</Text>
    </Pressable>
  );
}

function toneColor(tone: CoachTone = 'blue') {
  if (tone === 'pink') return CoachColors.pink;
  if (tone === 'teal') return CoachColors.teal;
  if (tone === 'amber') return CoachColors.amber;
  if (tone === 'red') return CoachColors.red;
  if (tone === 'slate') return CoachColors.slate;
  return CoachColors.blue;
}

function metricStyle(tone: CoachTone = 'blue') {
  if (tone === 'pink') return styles.metricPink;
  if (tone === 'teal') return styles.metricTeal;
  if (tone === 'amber') return styles.metricAmber;
  if (tone === 'red') return styles.metricRed;
  if (tone === 'slate') return styles.metricSlate;
  return styles.metricBlue;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: CoachColors.panel,
    borderColor: CoachColors.border,
    borderWidth: 1,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    ...CoachShadow.panel,
  },
  headerAccentWrap: { position: 'absolute', left: 0, right: 0, top: 0, height: 3, flexDirection: 'row' },
  headerAccent: { height: 3 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: CoachColors.blueSoft,
    borderColor: 'rgba(124,58,237,0.16)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 4 },
  kicker: { color: CoachColors.blue, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: CoachColors.slate, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  subtitle: { color: CoachColors.slateMuted, fontSize: 14, lineHeight: 20, fontWeight: '700', maxWidth: 620 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metric: { flex: 1, minWidth: 128, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: 2 },
  metricBlue: { backgroundColor: CoachColors.blueSoft, borderColor: 'rgba(124,58,237,0.18)' },
  metricPink: { backgroundColor: CoachColors.pinkSoft, borderColor: 'rgba(217,70,239,0.16)' },
  metricTeal: { backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(31,157,114,0.22)' },
  metricAmber: { backgroundColor: CoachColors.amberSoft, borderColor: 'rgba(232,154,24,0.22)' },
  metricRed: { backgroundColor: CoachColors.redSoft, borderColor: 'rgba(226,71,93,0.22)' },
  metricSlate: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border },
  metricValue: { fontSize: 18, lineHeight: 24, fontWeight: '900' },
  metricLabel: { color: CoachColors.slateMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  headerAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: CoachColors.slate, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerActionText: { color: '#fff', fontWeight: '900' },
  card: {
    backgroundColor: CoachColors.panel,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: CoachColors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...CoachShadow.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  cardTitle: { color: CoachColors.slate, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  cardSubtitle: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  iconButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  iconButtonText: { color: '#fff', fontWeight: '900' },
});