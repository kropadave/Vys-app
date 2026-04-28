import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { braceletStages, skillSlots } from '@/lib/participant-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function SkillTreeScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Skill tree</Text>
      <Text style={styles.title}>Cesta náramků</Text>
      <Text style={styles.body}>
        Workshopy budou vždy odemykat dva cviky. Po zvládnutí si dítě u trenéra naskenuje QR a odpovídající uzel se odemkne tady ve stromu.
      </Text>

      <View style={styles.road}>
        {braceletStages.map((stage) => (
          <View key={stage.id} style={styles.stageBlock}>
            <View style={[styles.bracelet, { backgroundColor: stage.color }]}>
              <Text style={styles.braceletTitle}>{stage.title}</Text>
              <Text style={styles.braceletMeta}>{stage.xpRequired} XP</Text>
            </View>
            <View style={styles.nodes}>
              {skillSlots.filter((slot) => slot.stage.id === stage.id).map((slot) => (
                <View key={slot.id} style={[styles.node, slot.unlocked && styles.nodeUnlocked]}>
                  <Text style={styles.nodeOrder}>#{slot.order}</Text>
                  <Text style={styles.nodeTitle}>Trik se doplní</Text>
                  <Text style={styles.nodeMeta}>{slot.xp} XP · QR od trenéra</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 48 },
  kicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 30, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  road: { gap: Spacing.xl },
  stageBlock: { gap: Spacing.md },
  bracelet: { minHeight: 92, borderRadius: Radius.lg, padding: Spacing.lg, justifyContent: 'center' },
  braceletTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  braceletMeta: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '800' },
  nodes: { gap: Spacing.md, paddingLeft: Spacing.lg, borderLeftWidth: 2, borderLeftColor: Palette.border },
  node: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 4,
  },
  nodeUnlocked: { borderColor: Palette.primary, backgroundColor: Palette.primarySoft },
  nodeOrder: { color: Palette.accent, fontSize: 12, fontWeight: '900' },
  nodeTitle: { color: Palette.text, fontSize: 18, fontWeight: '900' },
  nodeMeta: { color: Palette.textMuted, fontSize: 13 },
});
