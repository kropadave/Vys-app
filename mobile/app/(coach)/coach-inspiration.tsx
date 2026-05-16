import { Feather } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { inspirationCategories, type InspirationCategoryKey, type InspirationItem } from '@/lib/coach-inspiration';
import { CoachColors } from '@/lib/coach-theme';
import { Radius, Spacing } from '@/lib/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export default function CoachInspirationScreen() {
  const [activeKey, setActiveKey] = useState<InspirationCategoryKey>('first-aid');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const activeCategory = inspirationCategories.find((c) => c.key === activeKey)!;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <CoachPageHeader
        kicker="Trenér · Inspirace"
        title="Knihovna postupů"
        subtitle="První pomoc, metodika učení a levelování v parkouru v rychle čitelných sekcích."
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
            {activeCategory.intro ? <Text style={styles.categoryIntro}>{activeCategory.intro}</Text> : null}
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

      {activeCategory.sourceNote ? (
        <View style={styles.sourceBox}>
          <Text style={styles.sourceText}>{activeCategory.sourceNote}</Text>
        </View>
      ) : null}

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

      {isOpen ? (
        <View style={styles.contentBlock}>
          <StructuredContent content={item.content} accent={accent} />
        </View>
      ) : null}
    </CoachCard>
  );
}

function StructuredContent({ content, accent }: { content: string; accent: string }) {
  return (
    <View style={styles.structuredContent}>
      {content.split('\n').map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <View key={`space-${index}`} style={styles.contentSpacer} />;

        const ordered = line.match(/^(\d+)\.\s(.+)$/);
        if (ordered) {
          return (
            <View key={`ordered-${index}`} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: accent }]}>
                <Text style={styles.stepNumberText}>{ordered[1]}</Text>
              </View>
              <Text style={styles.stepText}>{ordered[2]}</Text>
            </View>
          );
        }

        if (line.startsWith('- ')) {
          const isNested = rawLine.startsWith('   -');
          return (
            <View key={`bullet-${index}`} style={[styles.bulletRow, isNested && styles.bulletRowNested]}>
              <View style={[styles.bulletDot, { backgroundColor: accent }]} />
              <Text style={styles.contentText}>{line.slice(2)}</Text>
            </View>
          );
        }

        if (line.startsWith('Poznámka')) {
          return <Text key={`note-${index}`} style={styles.noteText}>{line}</Text>;
        }

        if (isLabelLine(line)) {
          return <Text key={`label-${index}`} style={[styles.contentLabel, { color: accent }]}>{line}</Text>;
        }

        return <Text key={`text-${index}`} style={styles.contentText}>{line}</Text>;
      })}
    </View>
  );
}

function isLabelLine(line: string) {
  return line.endsWith(':')
    || line.startsWith('Příznaky:')
    || line.startsWith('Příznaky podvrtnutí:')
    || line.startsWith('Červené příznaky')
    || line.startsWith('Masivní / život ohrožující krvácení')
    || line.startsWith('Před každým tréninkem')
    || line.startsWith('Příklady:')
    || line.startsWith('Klíčové zásady:');
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
  categoryIntro: { color: CoachColors.slate, fontSize: 13, lineHeight: 19, marginTop: Spacing.sm, fontWeight: '700' },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 18 },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  itemTitle: { color: CoachColors.slate, fontSize: 16, fontWeight: '900', marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '900' },
  contentBlock: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: CoachColors.border },
  structuredContent: { gap: Spacing.sm },
  contentSpacer: { height: 2 },
  contentLabel: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  contentText: { color: CoachColors.slate, fontSize: 14, lineHeight: 20, flex: 1 },
  noteText: { color: CoachColors.slate, fontSize: 13, lineHeight: 19, fontWeight: '800', backgroundColor: CoachColors.amberSoft, borderColor: 'rgba(245,158,11,0.24)', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletRowNested: { marginLeft: 30 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepText: { color: CoachColors.slate, fontSize: 14, lineHeight: 20, flex: 1 },
  sourceBox: { backgroundColor: CoachColors.panel, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  sourceText: { color: CoachColors.slateMuted, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
