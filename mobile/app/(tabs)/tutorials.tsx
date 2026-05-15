import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FadeInUp } from '@/components/animated/motion';
import { Brand, BrandGradient } from '@/lib/brand';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';
import {
  BRACELET_COLORS,
  LEVEL_TITLES,
  trickTutorials,
  type TrickTutorial,
} from '@/lib/tricks-tutorials';
import { useBreakpoint } from '@/lib/use-breakpoint';

type FilterLevel = 0 | 1 | 2 | 3 | 4 | 5;
type FilterDiscipline = 'Vše' | 'Parkour' | 'Tricking';

const DISCIPLINE_FILTERS: FilterDiscipline[] = ['Vše', 'Parkour', 'Tricking'];

function matchesDiscipline(discipline: string, filter: FilterDiscipline): boolean {
  if (filter === 'Vše') return true;
  return discipline.toLowerCase().includes(filter.toLowerCase());
}

export default function TutorialsScreen() {
  const { isMobile } = useBreakpoint();
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState<FilterLevel>(0);
  const [disciplineFilter, setDisciplineFilter] = useState<FilterDiscipline>('Vše');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return trickTutorials.filter((trick) => {
      const levelOk = levelFilter === 0 || trick.level === levelFilter;
      const disciplineOk = matchesDiscipline(trick.discipline, disciplineFilter);
      return levelOk && disciplineOk;
    });
  }, [levelFilter, disciplineFilter]);

  const toggleExpand = (name: string) => {
    setExpandedId((prev) => (prev === name ? null : name));
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={BrandGradient.paper} style={StyleSheet.absoluteFill} />

      {/* Fixed header */}
      <View style={[styles.header, { paddingTop: isMobile ? 56 : 64 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.65 }]}
            accessibilityRole="button"
            accessibilityLabel="Zpět"
          >
            <FontAwesome5 name="chevron-left" size={15} color={Brand.purple} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Tutoriály triků</Text>
            <Text style={styles.headerSub}>{filtered.length} triků · postup, chyby a tipy</Text>
          </View>
        </View>

        {/* Discipline chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {DISCIPLINE_FILTERS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDisciplineFilter(d)}
              style={[styles.chip, disciplineFilter === d && styles.chipActive]}
            >
              <Text style={[styles.chipText, disciplineFilter === d && styles.chipTextActive]}>
                {d}
              </Text>
            </Pressable>
          ))}
          <View style={styles.chipDivider} />
          {([0, 1, 2, 3, 4, 5] as FilterLevel[]).map((lvl) => {
            const bracelet = BRACELET_COLORS[lvl];
            const isActive = levelFilter === lvl;
            return (
              <Pressable
                key={lvl}
                onPress={() => setLevelFilter(lvl)}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: bracelet?.color ?? Brand.purple, borderColor: bracelet?.color ?? Brand.purple },
                ]}
              >
                {lvl === 0 ? (
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>Vše</Text>
                ) : (
                  <View style={styles.chipLevelInner}>
                    <View style={[styles.chipDot, { backgroundColor: isActive ? '#fff' : (bracelet?.color ?? Brand.purple) }]} />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {bracelet?.title ?? `Level ${lvl}`}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.list, isMobile && styles.listMobile]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((trick, index) => (
          <FadeInUp key={trick.trick_name} delay={index * 18}>
            <TrickCard
              trick={trick}
              expanded={expandedId === trick.trick_name}
              onToggle={() => toggleExpand(trick.trick_name)}
            />
          </FadeInUp>
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

function TrickCard({ trick, expanded, onToggle }: { trick: TrickTutorial; expanded: boolean; onToggle: () => void }) {
  const bracelet = BRACELET_COLORS[trick.level];
  const levelTitle = LEVEL_TITLES[trick.level];
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  // Animate when expanded changes
  useMemo(() => {
    Animated.spring(anim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      damping: 18,
      stiffness: 220,
    }).start();
  }, [expanded, anim]);

  const disciplineColor = trick.discipline.includes('Tricking') ? Brand.pink : Brand.cyanDeep;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`${trick.trick_name} – detail`}
    >
      <View style={[styles.card, expanded && styles.cardExpanded]}>
        {/* Left accent bar */}
        <View style={[styles.cardAccent, { backgroundColor: bracelet.color }]} />

        <View style={styles.cardContent}>
          {/* Row: title + badges */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>{trick.trick_name}</Text>
              <Text style={styles.cardDescription} numberOfLines={expanded ? undefined : 2}>
                {trick.description}
              </Text>
            </View>
            <View style={styles.cardBadges}>
              <View style={[styles.badge, { backgroundColor: bracelet.color + '22', borderColor: bracelet.color + '55' }]}>
                <View style={[styles.badgeDot, { backgroundColor: bracelet.color }]} />
                <Text style={[styles.badgeText, { color: bracelet.color }]}>{bracelet.title}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: disciplineColor + '18', borderColor: disciplineColor + '44' }]}>
                <Text style={[styles.badgeText, { color: disciplineColor }]}>{trick.discipline}</Text>
              </View>
            </View>
          </View>

          {/* Expand chevron */}
          <View style={styles.cardChevronRow}>
            <Text style={styles.levelLabel}>{levelTitle}</Text>
            <FontAwesome5
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={11}
              color={Palette.textMuted}
            />
          </View>

          {/* Expanded body */}
          {expanded && (
            <View style={styles.cardBody}>
              {/* Prerequisites */}
              {trick.prerequisites.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionLabelRow}>
                    <FontAwesome5 name="layer-group" size={12} color={Brand.cyanDeep} />
                    <Text style={[styles.sectionLabel, { color: Brand.cyanDeep }]}>Předpoklady</Text>
                  </View>
                  <View style={styles.prereqChips}>
                    {trick.prerequisites.map((prereq) => (
                      <View key={prereq} style={styles.prereqChip}>
                        <Text style={styles.prereqText}>{prereq}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Steps */}
              <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                  <FontAwesome5 name="list-ol" size={12} color={Brand.purple} />
                  <Text style={[styles.sectionLabel, { color: Brand.purple }]}>Postup</Text>
                </View>
                {trick.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={[styles.stepNum, { backgroundColor: Brand.purple }]}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Common mistakes */}
              <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                  <FontAwesome5 name="exclamation-triangle" size={12} color={Brand.orangeDeep} />
                  <Text style={[styles.sectionLabel, { color: Brand.orangeDeep }]}>Časté chyby</Text>
                </View>
                {trick.common_mistakes.map((mistake, i) => (
                  <View key={i} style={styles.mistakeRow}>
                    <View style={styles.mistakeDot} />
                    <Text style={styles.mistakeText}>{mistake}</Text>
                  </View>
                ))}
              </View>

              {/* Safety tip */}
              <View style={[styles.safetyBox]}>
                <FontAwesome5 name="shield-alt" size={13} color={Brand.pink} style={{ marginTop: 1 }} />
                <Text style={styles.safetyText}>{trick.safety_tip}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  header: {
    backgroundColor: 'rgba(247,243,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,29,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,29,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 2,
    paddingRight: Spacing.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(139,29,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(139,29,255,0.15)',
  },
  chipActive: {
    backgroundColor: Brand.purple,
    borderColor: Brand.purple,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.purple,
  },
  chipTextActive: {
    color: '#fff',
  },
  chipLevelInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(139,29,255,0.15)',
    marginHorizontal: 2,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingTop: 12,
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  listMobile: {
    paddingHorizontal: 14,
  },
  bottomPad: {
    height: 120,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(139,29,255,0.08)',
  },
  cardExpanded: {
    borderColor: 'rgba(139,29,255,0.18)',
    ...Shadow.elevated,
  },
  cardAccent: {
    width: 4,
    alignSelf: 'stretch',
    minHeight: 56,
  },
  cardContent: {
    flex: 1,
    padding: 13,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  cardBadges: {
    alignItems: 'flex-end',
    gap: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,29,255,0.07)',
  },
  levelLabel: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '600',
  },

  // Expanded body
  cardBody: {
    marginTop: 12,
    gap: 14,
  },
  section: {
    gap: 7,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  prereqChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prereqChip: {
    backgroundColor: 'rgba(20,200,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(20,200,255,0.25)',
  },
  prereqText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.cyanDeep,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: Palette.text,
    lineHeight: 19,
  },
  mistakeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  mistakeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.orangeDeep,
    marginTop: 6,
    flexShrink: 0,
  },
  mistakeText: {
    flex: 1,
    fontSize: 13,
    color: Palette.text,
    lineHeight: 19,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: 'rgba(241,43,179,0.07)',
    borderRadius: Radius.md,
    padding: 11,
    borderWidth: 1,
    borderColor: 'rgba(241,43,179,0.18)',
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: Palette.text,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
