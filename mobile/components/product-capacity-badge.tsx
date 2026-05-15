import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/lib/brand';
import type { ProductCapacity } from '@/lib/product-capacity';
import { Palette, Radius, Spacing } from '@/lib/theme';

type Props = {
  capacity: ProductCapacity;
  compact?: boolean;
};

export function ProductCapacityBadge({ capacity, compact = false }: Props) {
  const colors = capacityColors(capacity.status);

  return (
    <View style={[styles.box, compact && styles.boxCompact, { backgroundColor: colors.bg, borderColor: colors.border }]}> 
      <View style={styles.topRow}>
        <Text style={[styles.kicker, { color: colors.text }]}>Live kapacita</Text>
        <Text style={[styles.status, { color: colors.text }]}>{capacity.full ? 'Plno' : `${capacity.available} volno`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${capacity.percent * 100}%`, backgroundColor: colors.text }]} />
      </View>
      {!compact ? <Text style={styles.meta}>{capacity.used}/{capacity.total} míst obsazeno</Text> : null}
    </View>
  );
}

function capacityColors(status: ProductCapacity['status']) {
  if (status === 'full') return { text: Palette.danger, bg: Palette.dangerSoft, border: 'rgba(240,68,91,0.34)' };
  if (status === 'low') return { text: Palette.accent, bg: Palette.accentSoft, border: 'rgba(255,178,26,0.34)' };
  return { text: Brand.cyanDeep, bg: 'rgba(46,231,214,0.12)', border: 'rgba(46,231,214,0.34)' };
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 8, minWidth: 164 },
  boxCompact: { paddingHorizontal: 10, paddingVertical: 8, minWidth: 132, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  kicker: { fontSize: 10, lineHeight: 13, fontWeight: '900', textTransform: 'uppercase' },
  status: { fontSize: 13, lineHeight: 17, fontWeight: '900' },
  track: { height: 8, borderRadius: Radius.pill, backgroundColor: 'rgba(26,19,38,0.10)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  meta: { color: Palette.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '800' },
});