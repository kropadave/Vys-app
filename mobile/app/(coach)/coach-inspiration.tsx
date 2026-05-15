import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { inspirationCategories, type InspirationCategoryKey, type InspirationItem } from '@/lib/coach-inspiration';
import { CoachColors } from '@/lib/coach-theme';
import { Radius, Spacing } from '@/lib/theme';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

export default function CoachInspirationScreen() {
  const [activeKey, setActiveKey] = useState<InspirationCategoryKey>('first-aid');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const activeCategory = inspirationCategories.find((c) => c.key === activeKey)!;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <CoachPageHeader
        kicker="Trenér · Inspirace"
        title="Knihovna postupů"
        subtitle="První pomoc, metodika, harmonogram sezóny a hry na začátek tréninku v rychle čitelných sekcích."
        icon="book-open"
        metrics={[
          { label: 'Sekcí', value: String(inspirationCategories.length), tone: 'blue' },
          { label: 'Aktivní oblast', value: activeCategory.title, tone: 'amber' },
        ]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {inspirationCategories.map((cat) => {
          const isActive = cat.key === activeKey;
          return (
            <Pressable
              key={cat.key}
              onPress={() => { setActiveKey(cat.key); setOpenItemId(null); }}
              style={({ pressed }) => [
                styles.tab,
                { borderColor: isActive ? cat.accent : CoachColors.border, backgroundColor: isActive ? cat.accent : CoachColors.panel },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name={cat.icon as FeatherIconName} size={16} color={isActive ? '#fff' : cat.accent} />
              <Text style={[styles.tabText, { color: isActive ? '#fff' : CoachColors.slate }]}>{cat.title}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <CoachCard>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: activeCategory.accent + '22', borderColor: activeCategory.accent + '55' }]}>
            <Feather name={activeCategory.icon as FeatherIconName} size={22} color={activeCategory.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.categoryTitle}>{activeCategory.title}</Text>
            <Text style={styles.muted}>{activeCategory.subtitle}</Text>
          </View>
        </View>
      </CoachCard>

      {activeCategory.items.map((item) => (
        <InspirationCard
          key={item.id}
          item={item}
          accent={activeCategory.accent}
          isOpen={openItemId === item.id}
          onToggle={() => setOpenItemId(openItemId === item.id ? null : item.id)}
        />
      ))}

      <View style={{ height: 96 }} />
    </ScrollView>
  );
}

function InspirationCard({ item, accent, isOpen, onToggle }: { item: InspirationItem; accent: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <CoachCard>
      <Pressable onPress={onToggle} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        <View style={styles.itemHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.muted}>{item.summary}</Text>
            {item.tags && item.tags.length > 0 ? (
              <View style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
                    <Text style={[styles.tagText, { color: accent }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color={CoachColors.slateMuted} />
        </View>
      </Pressable>

      {isOpen && item.steps && item.steps.length > 0 ? (
        <View style={styles.stepsBlock}>
          {item.steps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: accent }]}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </CoachCard>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },
  tabs: { gap: 8, paddingVertical: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  tabText: { fontSize: 13, fontWeight: '900' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  categoryIcon: {
    width: 48, height: 48, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  categoryTitle: { color: CoachColors.slate, fontSize: 18, fontWeight: '900' },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 18 },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  itemTitle: { color: CoachColors.slate, fontSize: 16, fontWeight: '900', marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '900' },
  stepsBlock: { marginTop: Spacing.md, gap: Spacing.sm, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: CoachColors.border },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepText: { color: CoachColors.slate, fontSize: 14, lineHeight: 20, flex: 1 },
});
