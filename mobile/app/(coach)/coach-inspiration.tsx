import { Feather } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { CoachPageHeader } from '@/components/coach/coach-screen';
import { inspirationCategories, type InspirationCategoryKey, type InspirationItem } from '@/lib/coach-inspiration';
import { CoachColors, CoachShadow } from '@/lib/coach-theme';
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

      {/* Category switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {inspirationCategories.map((cat) => {
          const isActive = cat.key === activeKey;
          return (
            <Pressable
              key={cat.key}
              onPress={() => { setActiveKey(cat.key); setOpenItemId(null); }}
              style={({ pressed }) => [
                styles.tab,
                isActive
                  ? { borderColor: cat.accent, backgroundColor: cat.accent, ...CoachShadow.soft, shadowColor: cat.accent }
                  : { borderColor: CoachColors.border, backgroundColor: CoachColors.panel },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.tabIcon, { backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : cat.accent + '18' }]}>
                <Feather name={cat.icon as FeatherIconName} size={14} color={isActive ? '#fff' : cat.accent} />
              </View>
              <Text style={[styles.tabText, { color: isActive ? '#fff' : CoachColors.slate }]}>{cat.title}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Active category hero */}
      <View style={[styles.heroCard, { borderColor: activeCategory.accent + '33' }]}>
        <View style={[styles.heroAccent, { backgroundColor: activeCategory.accent }]} />
        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { backgroundColor: activeCategory.accent + '18', borderColor: activeCategory.accent + '40' }]}>
            <Feather name={activeCategory.icon as FeatherIconName} size={24} color={activeCategory.accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.heroTitle}>{activeCategory.title}</Text>
            <Text style={styles.muted}>{activeCategory.subtitle}</Text>
          </View>
          <View style={[styles.heroCount, { backgroundColor: activeCategory.accent + '14' }]}>
            <Text style={[styles.heroCountValue, { color: activeCategory.accent }]}>{activeCategory.items.length}</Text>
            <Text style={[styles.heroCountLabel, { color: activeCategory.accent }]}>sekcí</Text>
          </View>
        </View>
        {activeCategory.intro ? (
          <View style={[styles.heroIntro, { backgroundColor: activeCategory.accent + '0D' }]}>
            <Feather name="info" size={14} color={activeCategory.accent} style={{ marginTop: 2 }} />
            <Text style={styles.heroIntroText}>{activeCategory.intro}</Text>
          </View>
        ) : null}
      </View>

      {/* Collapsible items */}
      <View style={styles.itemList}>
        {activeCategory.items.map((item, index) => (
          <InspirationCard
            key={item.id}
            item={item}
            index={index + 1}
            accent={activeCategory.accent}
            isOpen={openItemId === item.id}
            onToggle={() => setOpenItemId(openItemId === item.id ? null : item.id)}
          />
        ))}
      </View>

      {activeCategory.sourceNote ? (
        <View style={styles.sourceBox}>
          <Feather name="book" size={13} color={CoachColors.slateMuted} />
          <Text style={styles.sourceText}>{activeCategory.sourceNote}</Text>
        </View>
      ) : null}

      <View style={{ height: 96 }} />
    </ScrollView>
  );
}

function InspirationCard({
  item,
  index,
  accent,
  isOpen,
  onToggle,
}: {
  item: InspirationItem;
  index: number;
  accent: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const rotation = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 1 : 0, { duration: 200 });
  }, [isOpen, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <View style={[styles.card, isOpen && { borderColor: accent + '55', ...CoachShadow.soft, shadowColor: accent }]}>
      {isOpen ? <View style={[styles.cardAccent, { backgroundColor: accent }]} /> : null}
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.itemHeader, pressed && { opacity: 0.85 }]}>
        <View style={[styles.indexBadge, { backgroundColor: isOpen ? accent : accent + '16' }]}>
          <Text style={[styles.indexText, { color: isOpen ? '#fff' : accent }]}>{index}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {!isOpen ? <Text style={styles.muted} numberOfLines={2}>{item.summary}</Text> : null}
          {item.tags && item.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {item.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: accent + '16', borderColor: accent + '40' }]}>
                  <Text style={[styles.tagText, { color: accent }]}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <Animated.View style={[styles.chevronBtn, isOpen && { backgroundColor: accent + '16' }, chevronStyle]}>
          <Feather name="chevron-down" size={20} color={isOpen ? accent : CoachColors.slateMuted} />
        </Animated.View>
      </Pressable>

      {isOpen ? (
        <Animated.View entering={FadeIn.duration(180)} style={styles.contentBlock}>
          <StructuredContent content={item.content} accent={accent} />
        </Animated.View>
      ) : null}
    </View>
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
          return (
            <View key={`note-${index}`} style={styles.noteBox}>
              <Feather name="alert-circle" size={14} color={CoachColors.amber} style={{ marginTop: 2 }} />
              <Text style={styles.noteText}>{line}</Text>
            </View>
          );
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

  // Tabs
  tabs: { gap: 8, paddingVertical: 4, paddingRight: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  tabIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13.5, fontWeight: '900' },

  // Hero
  heroCard: {
    backgroundColor: CoachColors.panel,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingLeft: Spacing.lg + 4,
    gap: Spacing.md,
    overflow: 'hidden',
    ...CoachShadow.soft,
  },
  heroAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroIcon: { width: 52, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  heroTitle: { color: CoachColors.slate, fontSize: 20, lineHeight: 26, fontWeight: '900' },
  heroCount: { alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 8, minWidth: 54 },
  heroCountValue: { fontSize: 20, lineHeight: 24, fontWeight: '900' },
  heroCountLabel: { fontSize: 10, lineHeight: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroIntro: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: Radius.md, padding: Spacing.md },
  heroIntroText: { flex: 1, color: CoachColors.slate, fontSize: 12.5, lineHeight: 18, fontWeight: '700' },

  // Cards
  itemList: { gap: Spacing.sm + 2 },
  card: {
    backgroundColor: CoachColors.panel,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: CoachColors.border,
    padding: Spacing.md + 2,
    overflow: 'hidden',
    ...CoachShadow.soft,
  },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  indexBadge: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: 15, fontWeight: '900' },
  itemTitle: { color: CoachColors.slate, fontSize: 16, lineHeight: 21, fontWeight: '900' },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '900' },
  chevronBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Content
  contentBlock: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: CoachColors.border },
  structuredContent: { gap: Spacing.sm },
  contentSpacer: { height: 2 },
  contentLabel: { fontSize: 13, lineHeight: 18, fontWeight: '900', marginTop: 2 },
  contentText: { color: CoachColors.slate, fontSize: 14, lineHeight: 20, flex: 1 },
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: CoachColors.amberSoft, borderColor: 'rgba(245,158,11,0.24)', borderWidth: 1,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  noteText: { flex: 1, color: CoachColors.slate, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletRowNested: { marginLeft: 30 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumberText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepText: { color: CoachColors.slate, fontSize: 14, lineHeight: 20, flex: 1 },

  // Source
  sourceBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1,
    borderRadius: Radius.lg, padding: Spacing.md,
  },
  sourceText: { flex: 1, color: CoachColors.slateMuted, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
