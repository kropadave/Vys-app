import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const POZADI_ARENY = require('../../assets/images/pozadi_areny.png');
const POZADI_ARENA = require('../../assets/images/pozadi_arena.png');

const ARENA_IMAGES = [
  require('../../assets/images/arena_1.png'),
  require('../../assets/images/arena_2.png'),
  require('../../assets/images/arena_3.png'),
  require('../../assets/images/arena_4.png'),
  require('../../assets/images/arena_5.png'),
];
const STAGE_COLORS = ['#D8C2A3', '#F5A7C8', '#8A62D6', '#4C2B86', '#16151A'];

import { AnimatedProgressBar, FadeInUp, Float, PulseGlow } from '@/components/animated/motion';
import { TeamVysLogo } from '@/components/brand/team-vys-logo';
import { QrScanner } from '@/components/qr-scanner';
import { useParticipantProfile } from '@/hooks/use-participant-profile';
import { parseQrPayload } from '@/hooks/use-qr-events';
import { Brand, BrandGradient } from '@/lib/brand';
import { arenaPath, skillTreeLevels, type ArenaStage, type ParticipantProfile, type SkillTreeLevel } from '@/lib/participant-content';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SkillTrick = SkillTreeLevel['tricks'][number];

type PathMode = 'bracelets' | 'arenas';

// TODO: obrázky arén 6–10 dodá David později — zatím se cyklí stávající podklady.
function arenaImageFor(level: number) {
  return ARENA_IMAGES[(level - 1) % ARENA_IMAGES.length];
}

export default function SkillTreeScreen() {
  const { width, isMobile } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, profileReady, loading } = useParticipantProfile();
  const [expanded, setExpanded] = useState(false);
  const [pathMode, setPathMode] = useState<PathMode>('bracelets');
  const levels = useMemo(() => skillTreeLevels.slice(), []);
  const levelRequiredXp = useMemo(() => buildLevelRequiredXp(levels), [levels]);
  const currentIndex = useMemo(() => findCurrentLevelIndex(levels, profile, levelRequiredXp), [levels, profile, levelRequiredXp]);
  const currentLevel = levels[currentIndex];
  const nextLevel = levels[currentIndex + 1];
  const currentRequiredXp = levelRequiredXp.get(currentLevel.id) ?? 0;
  const nextRequiredXp = nextLevel ? (levelRequiredXp.get(nextLevel.id) ?? profile.xp) : profile.xp;
  const futureLevels = levels.slice(currentIndex + 1);
  const completedLevels = levels.slice(0, currentIndex).reverse();
  const collapsedFutureLevels = futureLevels.slice(0, 2);
  const completedCurrent = currentLevel.tricks.filter((trick) => isUnlocked(trick.id, profile));
  const missingCurrent = currentLevel.tricks.filter((trick) => !isUnlocked(trick.id, profile));
  const progress = nextLevel ? progressBetween(currentRequiredXp, nextRequiredXp, profile) : 1;
  const missingXp = nextLevel ? Math.max(nextRequiredXp - profile.xp, 0) : 0;
  const braceletSize = isMobile ? 240 : 320;

  // Cesta arén — druhá postupová cesta.
  const currentArenaIndex = useMemo(() => {
    let index = 0;
    arenaPath.forEach((arena, i) => {
      if (profile.xp >= arena.requiredXp) index = i;
    });
    return index;
  }, [profile.xp]);
  const currentArena = arenaPath[currentArenaIndex];
  const nextArena = arenaPath[currentArenaIndex + 1];
  const futureArenas = arenaPath.slice(currentArenaIndex + 1);
  const collapsedFutureArenas = futureArenas.slice(0, 2);
  const arenaProgress = nextArena
    ? Math.min(Math.max((profile.xp - currentArena.requiredXp) / Math.max(nextArena.requiredXp - currentArena.requiredXp, 1), 0), 1)
    : 1;
  const arenaMissingXp = nextArena ? Math.max(nextArena.requiredXp - profile.xp, 0) : 0;

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: expanded ? { display: 'none' } : getTabBarStyle(width, isMobile) });
  }, [expanded, isMobile, navigation, width]);

  if (loading || !profileReady) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={BrandGradient.paper} style={StyleSheet.absoluteFill} />
        <ActivityIndicator color={Brand.purple} size="large" />
      </View>
    );
  }

  return (
    <ImageBackground source={POZADI_ARENA} style={styles.screen} resizeMode="cover">

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, isMobile && styles.containerMobile, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
        <FadeInUp>
          <ProfileHud profile={profile} currentLevel={currentLevel} nextLevel={nextLevel} progress={progress} missingXp={missingXp} />
        </FadeInUp>

        <FadeInUp delay={80}>
          <View style={[styles.pathStage, isMobile && styles.pathStageMobile]}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageKicker}>Skill tree</Text>
              <Text style={styles.stageTitle}>{pathMode === 'arenas' ? 'Cesta arén' : 'Cesta náramků'}</Text>
              <View style={styles.pathToggle}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: pathMode === 'bracelets' }}
                  onPress={() => setPathMode('bracelets')}
                  style={[styles.pathToggleBtn, pathMode === 'bracelets' && styles.pathToggleBtnActive]}>
                  <Text style={[styles.pathToggleText, pathMode === 'bracelets' && styles.pathToggleTextActive]}>Náramky</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: pathMode === 'arenas' }}
                  onPress={() => setPathMode('arenas')}
                  style={[styles.pathToggleBtn, pathMode === 'arenas' && styles.pathToggleBtnActive]}>
                  <Text style={[styles.pathToggleText, pathMode === 'arenas' && styles.pathToggleTextActive]}>Arény</Text>
                </Pressable>
              </View>
            </View>

            {pathMode === 'arenas' ? (
              <>
                <View style={styles.futurePath}>
                  {collapsedFutureArenas.slice().reverse().map((arena, index) => (
                    <ArenaTrailNode key={arena.id} arena={arena} profileXp={profile.xp} compact={index === 0 && collapsedFutureArenas.length > 1} />
                  ))}
                </View>

                <View style={styles.connectorColumn}>
                  <View style={styles.connectorDot} />
                  <View style={[styles.connectorLine, isMobile && styles.connectorLineMobile]} />
                  <View style={styles.connectorDot} />
                </View>

                <View style={styles.currentBraceletButton}>
                  <Float amplitude={5} duration={2400}>
                    <Image source={arenaImageFor(currentArena.level)} style={{ width: braceletSize, height: braceletSize }} contentFit="contain" />
                  </Float>
                  <PulseGlow scaleTo={1.025}>
                    <View style={styles.currentBraceletLabel}>
                      <Text style={styles.currentBraceletKicker}>Aktuální aréna</Text>
                      <Text style={styles.currentBraceletTitle}>{currentArena.title}</Text>
                      <Text style={styles.currentBraceletSub}>Aréna {currentArena.level} z {arenaPath.length}</Text>
                    </View>
                  </PulseGlow>
                </View>
              </>
            ) : (
              <>
                <View style={styles.futurePath}>
                  {collapsedFutureLevels.slice().reverse().map((level, index) => (
                    <TrailNode key={level.id} profile={profile} level={level} requiredXp={levelRequiredXp.get(level.id) ?? 0} compact={index === 0 && collapsedFutureLevels.length > 1} />
                  ))}
                </View>

                <View style={styles.connectorColumn}>
                  <View style={styles.connectorDot} />
                  <View style={[styles.connectorLine, isMobile && styles.connectorLineMobile]} />
                  <View style={styles.connectorDot} />
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setExpanded(true)}
                  style={({ pressed }) => [styles.currentBraceletButton, pressed && styles.currentBraceletPressed]}>
                  <Float amplitude={5} duration={2400}>
                    <BraceletModel color={currentLevel.stage.color} dark={currentLevel.stage.id === 'black'} size={braceletSize} />
                  </Float>
                  <PulseGlow scaleTo={1.025}>
                    <View style={styles.currentBraceletLabel}>
                      <Text style={styles.currentBraceletKicker}>Aktuální náramek</Text>
                      <Text style={styles.currentBraceletTitle}>{currentLevel.stage.title}</Text>
                      <Text style={styles.currentBraceletSub}>{currentLevel.title} · level {profile.level}</Text>
                    </View>
                  </PulseGlow>
                  <View style={styles.expandBadge}>
                    <Text style={styles.expandBadgeText}>Cesta</Text>
                  </View>
                </Pressable>
              </>
            )}
          </View>
        </FadeInUp>

        {pathMode === 'arenas' ? (
          <FadeInUp delay={140}>
            <ArenaListPanel profileXp={profile.xp} nextArena={nextArena} arenaProgress={arenaProgress} arenaMissingXp={arenaMissingXp} />
          </FadeInUp>
        ) : (
        <FadeInUp delay={140}>
          <View style={styles.tricksPanel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelKicker}>Moje triky</Text>
                <Text style={styles.panelTitle}>{currentLevel.stage.title} náramek</Text>
              </View>
              <View style={styles.trickCountBadge}>
                <Text style={styles.trickCountText}>{completedCurrent.length}/{currentLevel.tricks.length}</Text>
              </View>
            </View>

            <View style={styles.trickGrid}>
              {currentLevel.tricks.map((trick, index) => (
                <TrickCard key={trick.id} trick={trick} index={index} completed={isUnlocked(trick.id, profile)} />
              ))}
            </View>

            <View style={styles.progressPanel}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>{completedCurrent.length}/{currentLevel.tricks.length} hotovo</Text>
                <Text style={styles.progressMeta}>{profile.xp} / {nextRequiredXp} XP</Text>
              </View>
              <AnimatedProgressBar progress={progress} fillColor={Brand.purple} trackColor="rgba(26,19,38,0.10)" height={12} />
              <Text style={styles.progressCopy}>{nextLevel ? `${missingCurrent.length} chybí · ${missingXp} XP do dalšího náramku` : 'Všechno je hotové.'}</Text>
            </View>
          </View>
        </FadeInUp>
        )}

        {pathMode === 'bracelets' && completedLevels.length > 0 ? (
          <FadeInUp delay={180}>
            <CompletedBraceletsPanel profile={profile} levels={completedLevels} isMobile={isMobile} braceletSize={braceletSize} />
          </FadeInUp>
        ) : null}
      </ScrollView>

      {expanded ? (
        <FocusedPathOverlay
          currentLevel={currentLevel}
          profile={profile}
          futureLevels={futureLevels}
          completedLevels={completedLevels}
          levelRequiredXp={levelRequiredXp}
          isMobile={isMobile}
          braceletSize={braceletSize}
          onClose={() => setExpanded(false)}
        />
      ) : null}
    </ImageBackground>
  );
}

function QrScanButton() {
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setScannerOpen(true)}
        style={({ pressed }) => [styles.qrScanBtn, pressed && { opacity: 0.80 }]}
      >
        <MaterialCommunityIcons name="qrcode-scan" size={18} color="#fff" />
        <Text style={styles.qrScanBtnText}>Naskenovat QR trik</Text>
      </Pressable>
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <QrScanner
          onScanned={(raw) => {
            setScannerOpen(false);
            const payload = parseQrPayload(raw);
            if (payload.workshop) {
              router.push({
                pathname: '/qr-claim',
                params: {
                  workshop: payload.workshop,
                  title: payload.title ?? '',
                  ts: payload.ts ?? '',
                  coach: payload.coach ?? '',
                },
              });
              return;
            }
            const code = (payload.event ?? '').trim();
            if (!code) return;
            router.push({ pathname: '/qr-claim', params: { event: code } });
          }}
          onClose={() => setScannerOpen(false)}
        />
      </Modal>
    </>
  );
}

function ProfileHud({ profile, currentLevel, nextLevel, progress, missingXp }: { profile: ParticipantProfile; currentLevel: SkillTreeLevel; nextLevel?: SkillTreeLevel; progress: number; missingXp: number }) {
  return (
    <View style={styles.profileHud}>
      <View style={styles.profileMainRow}>
        <View style={styles.profileLogoWrap}>
          <TeamVysLogo size={36} />
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileSub}>{currentLevel.stage.title} náramek · level {profile.level}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpValue}>{profile.xp}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>

      <View style={styles.hudProgressBlock}>
        <View style={styles.hudProgressTop}>
          <Text style={styles.hudProgressTitle}>{nextLevel?.stage.title ?? 'Master'}</Text>
          <Text style={styles.hudProgressMeta}>{missingXp} XP</Text>
        </View>
        <AnimatedProgressBar progress={progress} fillColor={Brand.cyan} trackColor="rgba(26,19,38,0.10)" height={10} />
      </View>

      <QrScanButton />
    </View>
  );
}

function TrailNode({ profile, level, requiredXp, completed, compact }: { profile: ParticipantProfile; level: SkillTreeLevel; requiredXp: number; completed?: boolean; compact?: boolean }) {
  const unlocked = profile.xp >= requiredXp;
  const completedTricks = level.tricks.filter((trick) => isUnlocked(trick.id, profile)).length;

  return (
    <View style={[styles.trailNode, compact && styles.trailNodeCompact, completed && styles.trailNodeCompleted]}>
      <MiniBracelet color={level.stage.color} dark={level.stage.id === 'black'} />
      <View style={styles.trailNodeCopy}>
        <Text style={styles.trailNodeTitle}>{level.stage.title}</Text>
        <Text style={styles.trailNodeSub}>{unlocked ? `${completedTricks}/${level.tricks.length} triků` : `${requiredXp} XP`}</Text>
      </View>
    </View>
  );
}

function ArenaTrailNode({ arena, profileXp, compact }: { arena: ArenaStage; profileXp: number; compact?: boolean }) {
  const unlocked = profileXp >= arena.requiredXp;
  return (
    <View style={[styles.trailNode, compact && styles.trailNodeCompact]}>
      <Image source={arenaImageFor(arena.level)} style={{ width: 56, height: 56 }} contentFit="contain" />
      <View style={styles.trailNodeCopy}>
        <Text style={styles.trailNodeTitle}>{arena.title}</Text>
        <Text style={styles.trailNodeSub}>{unlocked ? 'Odemčeno' : `${arena.requiredXp} XP`}</Text>
      </View>
    </View>
  );
}

function ArenaListPanel({ profileXp, nextArena, arenaProgress, arenaMissingXp }: { profileXp: number; nextArena?: ArenaStage; arenaProgress: number; arenaMissingXp: number }) {
  const unlockedCount = arenaPath.filter((arena) => profileXp >= arena.requiredXp).length;

  return (
    <View style={styles.tricksPanel}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelKicker}>Moje arény</Text>
          <Text style={styles.panelTitle}>Cesta arén</Text>
        </View>
        <View style={styles.trickCountBadge}>
          <Text style={styles.trickCountText}>{unlockedCount}/{arenaPath.length}</Text>
        </View>
      </View>

      <View style={styles.arenaList}>
        {arenaPath.map((arena) => {
          const unlocked = profileXp >= arena.requiredXp;
          const isNext = nextArena?.id === arena.id;
          return (
            <View key={arena.id} style={[styles.arenaRow, unlocked && styles.arenaRowUnlocked, isNext && styles.arenaRowNext]}>
              <Image source={arenaImageFor(arena.level)} style={{ width: 48, height: 48, opacity: unlocked ? 1 : 0.45 }} contentFit="contain" />
              <View style={styles.arenaRowCopy}>
                <Text style={styles.arenaRowTitle}>{arena.level}. {arena.title}</Text>
                <Text style={styles.arenaRowSub}>{arena.requiredXp} XP</Text>
              </View>
              {unlocked ? (
                <View style={[styles.trickStatusBadge, { backgroundColor: soften(Brand.cyan, 0.13), borderColor: soften(Brand.cyan, 0.32) }]}>
                  <Text style={[styles.trickStatusText, { color: darken(Brand.cyan, 70) }]}>Odemčeno</Text>
                </View>
              ) : (
                <MaterialCommunityIcons name="lock-outline" size={18} color={Palette.textMuted} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.progressPanel}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>{nextArena ? `Další: ${nextArena.title}` : 'Všechny arény odemčené'}</Text>
          <Text style={styles.progressMeta}>{profileXp} / {nextArena ? nextArena.requiredXp : profileXp} XP</Text>
        </View>
        <AnimatedProgressBar progress={arenaProgress} fillColor={Brand.purple} trackColor="rgba(26,19,38,0.10)" height={12} />
        <Text style={styles.progressCopy}>{nextArena ? `${arenaMissingXp} XP do další arény` : 'Dosáhl jsi vrcholu.'}</Text>
      </View>
    </View>
  );
}

function FocusedPathOverlay({
  currentLevel,
  profile,
  futureLevels,
  completedLevels,
  levelRequiredXp,
  isMobile,
  braceletSize,
  onClose,
}: {
  currentLevel: SkillTreeLevel;
  profile: ParticipantProfile;
  futureLevels: SkillTreeLevel[];
  completedLevels: SkillTreeLevel[];
  levelRequiredXp: Map<string, number>;
  isMobile: boolean;
  braceletSize: number;
  onClose: () => void;
}) {
  const futurePath = futureLevels;
  const scrollRef = useRef<ScrollView>(null);
  const currentOffsetRef = useRef(0);
  const insets = useSafeAreaInsets();

  const handleCurrentLayout = useCallback((e: { nativeEvent: { layout: { y: number } } }) => {
    currentOffsetRef.current = e.nativeEvent.layout.y;
    // Scroll to current bracelet immediately (no animation so it's instant on open)
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: currentOffsetRef.current, animated: false });
    }, 30);
  }, []);

  return (
    <FadeInUp offset={0} duration={260} style={styles.focusOverlay}>
      <ImageBackground source={POZADI_ARENY} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.focusOkButton, { top: insets.top + 8 }, pressed && styles.focusOkButtonPressed]}>
        <Text style={styles.focusOkText}>OK</Text>
      </Pressable>
      <ScrollView ref={scrollRef} style={styles.focusScroll} contentContainerStyle={[styles.focusContent, isMobile && styles.focusContentMobile]} showsVerticalScrollIndicator={false}>
        <View style={styles.focusHeader}>
          <Text style={styles.focusKicker}>Skill tree</Text>
          <Text style={styles.focusTitle}>Cesta náramků</Text>
        </View>

        {[...futurePath].reverse().map((level, index) => (
          <View key={level.id} style={styles.focusPathGroup}>
            <FocusedPathStage profile={profile} level={level} requiredXp={levelRequiredXp.get(level.id) ?? 0} kind="future" braceletSize={braceletSize} isMobile={isMobile} delay={index * 45} />
            {index < futurePath.length - 1 ? <PathConnector /> : null}
          </View>
        ))}

        {futurePath.length > 0 ? <PathConnector /> : null}

        <View onLayout={handleCurrentLayout}>
          <FocusedPathStage profile={profile} level={currentLevel} requiredXp={levelRequiredXp.get(currentLevel.id) ?? 0} kind="current" braceletSize={braceletSize} isMobile={isMobile} delay={futurePath.length * 45} />
        </View>

        {completedLevels.length > 0 ? <PathConnector /> : null}

        {completedLevels.map((level, index) => (
          <View key={level.id} style={styles.focusPathGroup}>
            <FocusedPathStage profile={profile} level={level} requiredXp={levelRequiredXp.get(level.id) ?? 0} kind="completed" braceletSize={braceletSize} isMobile={isMobile} delay={(futurePath.length + index + 1) * 45} />
            {index < completedLevels.length - 1 ? <PathConnector /> : null}
          </View>
        ))}
      </ScrollView>
    </FadeInUp>
  );
}

function FocusedPathStage({
  profile,
  level,
  requiredXp,
  kind,
  braceletSize,
  isMobile,
  delay,
  onPress,
}: {
  profile: ParticipantProfile;
  level: SkillTreeLevel;
  requiredXp: number;
  kind: 'future' | 'current' | 'completed';
  braceletSize: number;
  isMobile: boolean;
  delay: number;
  onPress?: () => void;
}) {
  const completedCount = level.tricks.filter((trick) => isUnlocked(trick.id, profile)).length;
  const label = kind === 'current' ? 'Aktuální náramek' : kind === 'completed' ? 'Hotový náramek' : 'Další náramek';
  const badgeText = kind === 'current' ? 'Aktuální' : kind === 'completed' ? 'Hotovo' : 'Čeká';
  const statusText = kind === 'future' ? `${requiredXp} XP` : `${completedCount}/${level.tricks.length} hotovo`;
  const stage = (
    <FadeInUp delay={delay} offset={18} duration={420}>
      <View style={[styles.focusStageCard, isMobile && styles.focusStageCardMobile, kind === 'current' && styles.focusStageCurrent, kind === 'completed' && styles.focusStageCompleted]}>
        <View style={[styles.focusBraceletColumn, isMobile && styles.focusBraceletColumnMobile]}>
          <Float amplitude={kind === 'current' ? 5 : 3} duration={2600}>
            <BraceletModel color={level.stage.color} dark={level.stage.id === 'black'} size={braceletSize} />
          </Float>
          <View style={[styles.focusStageBadge, kind === 'current' && styles.focusStageBadgeCurrent]}>
            <Text style={[styles.focusStageBadgeText, kind === 'current' && styles.focusStageBadgeTextCurrent]}>{badgeText}</Text>
          </View>
        </View>
        <View style={styles.focusStageCopy}>
          <Text style={styles.focusStageKicker}>{label}</Text>
          <Text style={[styles.focusStageTitle, isMobile && styles.focusStageTitleMobile]}>{level.stage.title}</Text>
          <Text style={styles.focusStageMeta}>{level.title} · {statusText}</Text>
          <View style={styles.focusTrickList}>
            {level.tricks.map((trick) => (
              <PathTrickPill key={trick.id} profile={profile} trick={trick} kind={kind} />
            ))}
          </View>
        </View>
      </View>
    </FadeInUp>
  );

  if (!onPress) return stage;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && styles.focusStagePressed]}>
      {stage}
    </Pressable>
  );
}

function PathConnector() {
  return (
    <View style={styles.focusConnector}>
      <View style={styles.focusConnectorDot} />
      <View style={styles.focusConnectorLine} />
      <View style={styles.focusConnectorDot} />
    </View>
  );
}

function PathTrickPill({ profile, trick, kind, onLight }: { profile: ParticipantProfile; trick: SkillTrick; kind: 'future' | 'current' | 'completed'; onLight?: boolean }) {
  const completed = kind === 'completed' || (kind === 'current' && isUnlocked(trick.id, profile));
  const waiting = kind === 'future';
  const color = completed ? Brand.cyan : waiting ? Brand.purple : Brand.pink;
  const text = completed ? 'Hotovo' : waiting ? null : 'Chybí';

  return (
    <View style={[styles.pathTrickPill, { borderColor: soften(color, 0.30), backgroundColor: soften(color, completed ? 0.11 : 0.08) }]}>
      <Text style={[styles.pathTrickTitle, onLight && styles.pathTrickTitleOnLight]}>{trick.title}</Text>
      <View style={styles.pathTrickMetaRow}>
        <Text style={styles.pathTrickXp}>{trick.xp} XP</Text>
        {waiting ? (
          <MaterialCommunityIcons name="lock-outline" size={14} color={darken(color, 36)} />
        ) : (
          <Text style={[styles.pathTrickState, { color: darken(color, completed ? 70 : 36) }]}>{text}</Text>
        )}
      </View>
    </View>
  );
}

function CompletedBraceletsPanel({ profile, levels, isMobile, braceletSize }: { profile: ParticipantProfile; levels: SkillTreeLevel[]; isMobile: boolean; braceletSize: number }) {
  const [open, setOpen] = useState(false);
  const completedTricksCount = levels.reduce((sum, level) => sum + level.tricks.length, 0);

  return (
    <View style={[styles.completedPanel, !open && styles.completedPanelCollapsed]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.completedPanelHeaderButton, pressed && styles.completedPanelHeaderPressed]}
      >
        <View>
          <Text style={styles.panelKicker}>Hotové náramky</Text>
          <Text style={styles.panelTitle}>Co už mám splněné</Text>
          <Text style={styles.completedSummary}>{levels.length} {completedBraceletLabel(levels.length)} · {completedTricksCount} triků hotovo</Text>
        </View>
        <View style={styles.completedToggleBadge}>
          <Text style={styles.completedToggleIcon}>{open ? '−' : '+'}</Text>
          <Text style={styles.completedToggleText}>{open ? 'Skrýt' : 'Rozbalit'}</Text>
        </View>
      </Pressable>
      {open ? (
        <FadeInUp offset={10} duration={260}>
          <View style={styles.completedList}>
            {levels.map((level) => (
              <CompletedBraceletCard key={level.id} profile={profile} level={level} isMobile={isMobile} braceletSize={braceletSize} />
            ))}
          </View>
        </FadeInUp>
      ) : null}
    </View>
  );
}

function completedBraceletLabel(count: number) {
  if (count === 1) return 'hotový náramek';
  if (count > 1 && count < 5) return 'hotové náramky';
  return 'hotových náramků';
}

function CompletedBraceletCard({ profile, level, isMobile, braceletSize }: { profile: ParticipantProfile; level: SkillTreeLevel; isMobile: boolean; braceletSize: number }) {
  return (
    <View style={[styles.completedCard, isMobile && styles.completedCardMobile]}>
      <View style={styles.completedBraceletWrap}>
        <BraceletModel color={level.stage.color} dark={level.stage.id === 'black'} size={braceletSize} />
      </View>
      <View style={styles.completedCopy}>
        <Text style={styles.completedTitle}>{level.stage.title} · {level.title}</Text>
        <Text style={styles.completedMeta}>{level.tricks.length}/{level.tricks.length} triků hotovo</Text>
        <View style={styles.completedTrickGrid}>
          {level.tricks.map((trick) => (
            <PathTrickPill key={trick.id} profile={profile} trick={trick} kind="completed" onLight />
          ))}
        </View>
      </View>
    </View>
  );
}

function TrickCard({ trick, index, completed }: { trick: SkillTrick; index: number; completed: boolean }) {
  const statusColor = completed ? Brand.cyan : Brand.pink;

  return (
    <View style={[styles.trickCard, completed && styles.trickCardDone]}>
      <View style={[styles.trickNumber, { backgroundColor: soften(statusColor, 0.16), borderColor: soften(statusColor, 0.42) }]}>
        <Text style={[styles.trickNumberText, { color: darken(statusColor, 46) }]}>{index + 1}</Text>
      </View>
      <View style={styles.trickCopy}>
        <Text style={styles.trickTitle}>{trick.title}</Text>
        <Text style={styles.trickDiscipline}>{trick.discipline}</Text>
        <Text style={styles.trickDescription}>{trick.description}</Text>
      </View>
      <View style={styles.trickFooter}>
        <Text style={styles.trickXp}>{trick.xp} XP</Text>
        <View style={[styles.trickStatusBadge, { backgroundColor: soften(statusColor, 0.13), borderColor: soften(statusColor, 0.32) }]}>
          <Text style={[styles.trickStatusText, { color: darken(statusColor, completed ? 70 : 36) }]}>{completed ? 'Hotovo' : 'Chybí'}</Text>
        </View>
      </View>
    </View>
  );
}

function MiniBracelet({ color, dark }: { color: string; dark: boolean }) {
  const idx = Math.max(0, STAGE_COLORS.indexOf(color));
  return (
    <Image source={ARENA_IMAGES[idx]} style={{ width: 56, height: 56 }} contentFit="contain" />
  );
}

function BraceletModel({ color, dark, size }: { color: string; dark: boolean; size: number }) {
  const idx = Math.max(0, STAGE_COLORS.indexOf(color));
  return (
    <Image source={ARENA_IMAGES[idx]} style={{ width: size, height: size }} contentFit="contain" />
  );
}

function findCurrentLevelIndex(levels: SkillTreeLevel[], profile: ParticipantProfile, levelRequiredXp: Map<string, number>) {
  const braceletIndex = levels.findIndex((level) => level.stage.id === profile.bracelet.id);
  if (braceletIndex >= 0) return braceletIndex;

  let currentIndex = 0;
  levels.forEach((level, index) => {
    const requiredXp = levelRequiredXp.get(level.id) ?? 0;
    if (profile.xp >= requiredXp) currentIndex = index;
  });
  return currentIndex;
}

function buildLevelRequiredXp(levels: SkillTreeLevel[]) {
  let cumulativeXp = 0;
  return new Map(
    levels.map((level) => {
      const requiredXp = cumulativeXp;
      cumulativeXp += level.tricks.reduce((sum, trick) => sum + trick.xp, 0);
      return [level.id, requiredXp] as const;
    }),
  );
}

function isUnlocked(trickId: string, profile: ParticipantProfile) {
  return profile.completedTrickIds.includes(trickId);
}

function progressBetween(fromXp: number, toXp: number, profile: ParticipantProfile) {
  const range = Math.max(toXp - fromXp, 1);
  return Math.min(Math.max((profile.xp - fromXp) / range, 0), 1);
}

function getTabBarStyle(width: number, isMobile: boolean) {
  const tabBarGap = isMobile ? 14 : 20;
  const tabBarWidth = Math.min(Math.max(width - tabBarGap * 2, 280), 430);
  const tabBarLeft = Math.max(tabBarGap, (width - tabBarWidth) / 2);

  return {
    position: 'absolute' as const,
    bottom: isMobile ? 14 : 20,
    left: tabBarLeft,
    width: tabBarWidth,
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    borderTopColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderRadius: 30,
    minHeight: isMobile ? 60 : 62,
    height: isMobile ? 60 : 62,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: isMobile ? 6 : 10,
    overflow: 'hidden' as const,
    shadowColor: Brand.purpleDeep,
    shadowOpacity: 0.13,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  };
}

function soften(hex: string, alpha: number) {
  const { red, green, blue } = hexToRgb(hex);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function darken(hex: string, amount = 52) {
  const { red, green, blue } = hexToRgb(hex);
  return `rgb(${Math.max(0, red - amount)},${Math.max(0, green - amount)},${Math.max(0, blue - amount)})`;
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const expanded = value.length === 3 ? value.split('').map((item) => item + item).join('') : value;
  return {
    red: parseInt(expanded.slice(0, 2), 16),
    green: parseInt(expanded.slice(2, 4), 16),
    blue: parseInt(expanded.slice(4, 6), 16),
  };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.paper },
  scroll: { flex: 1 },
  container: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 116,
    gap: Spacing.lg,
  },
  containerMobile: { width: '100%', maxWidth: '100%', alignSelf: 'stretch', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 124, gap: Spacing.md },
  ribbonOne: { position: 'absolute', top: 58, left: -80, width: 260, height: 34, borderRadius: 20, backgroundColor: 'rgba(46,231,214,0.20)', transform: [{ rotate: '-18deg' }] },
  ribbonTwo: { position: 'absolute', top: 270, right: -90, width: 310, height: 42, borderRadius: 22, backgroundColor: 'rgba(239,59,154,0.13)', transform: [{ rotate: '22deg' }] },
  ribbonThree: { position: 'absolute', bottom: 140, left: -70, width: 240, height: 28, borderRadius: 18, backgroundColor: 'rgba(255,178,26,0.15)', transform: [{ rotate: '15deg' }] },

  profileHud: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: Radius.xl, borderWidth: 1, borderColor: Palette.border, padding: Spacing.md, gap: Spacing.md, ...Shadow.card },
  profileMainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileLogoWrap: { width: 52, height: 52, borderRadius: Radius.lg, backgroundColor: Brand.paper, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Palette.border },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { color: Palette.text, fontSize: 20, lineHeight: 25, fontWeight: '900' },
  profileSub: { color: Palette.textMuted, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  xpBadge: { minWidth: 78, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,178,26,0.42)', backgroundColor: 'rgba(255,178,26,0.15)', paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  xpValue: { color: Brand.ink, fontSize: 18, lineHeight: 21, fontWeight: '900' },
  xpLabel: { color: Brand.orangeDeep, fontSize: 10, lineHeight: 13, fontWeight: '900' },
  hudProgressBlock: { gap: 6 },
  hudProgressTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  qrScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.purple, borderRadius: Radius.pill, paddingVertical: 12, paddingHorizontal: Spacing.lg },
  qrScanBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  hudProgressTitle: { color: Brand.purple, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  hudProgressMeta: { color: Palette.textMuted, fontSize: 13, lineHeight: 18, fontWeight: '900' },

  pathStage: { width: '100%', minHeight: 560, borderRadius: Radius.xxl, backgroundColor: 'transparent', alignItems: 'center', padding: Spacing.lg, position: 'relative', overflow: 'hidden' },
  pathStageBg: { borderRadius: Radius.xxl },
  pathStageMobile: { alignSelf: 'stretch', maxWidth: '100%', minHeight: 430, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 10 },
  stageHeader: { alignItems: 'center', gap: 1, marginBottom: 6 },
  stageKicker: { color: Brand.purple, fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  stageTitle: { color: Palette.text, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  pathToggle: { flexDirection: 'row', gap: 4, marginTop: 8, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: Palette.border, padding: 4, ...Shadow.soft },
  pathToggleBtn: { borderRadius: Radius.pill, paddingHorizontal: 18, paddingVertical: 8 },
  pathToggleBtnActive: { backgroundColor: Brand.purple },
  pathToggleText: { color: Palette.textMuted, fontSize: 13, lineHeight: 17, fontWeight: '900' },
  pathToggleTextActive: { color: '#FFFFFF' },
  futurePath: { width: '100%', alignItems: 'center', gap: 6, zIndex: 2 },
  futurePathExpanded: { alignItems: 'stretch', gap: 10 },
  connectorColumn: { alignItems: 'center', marginVertical: 2 },
  connectorDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Brand.pink },
  connectorLine: { width: 5, height: 36, borderRadius: 5, backgroundColor: 'rgba(239,59,154,0.35)' },
  connectorLineMobile: { height: 22 },
  currentBraceletButton: { alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 4 },
  currentBraceletPressed: { transform: [{ scale: 0.985 }] },
  currentBraceletLabel: { marginTop: -8, minWidth: 236, borderRadius: Radius.xl, backgroundColor: Brand.ink, paddingHorizontal: Spacing.lg, paddingVertical: 10, alignItems: 'center', ...Shadow.float },
  currentBraceletKicker: { color: Brand.cyan, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  currentBraceletTitle: { color: '#FFFFFF', fontSize: 28, lineHeight: 32, fontWeight: '900' },
  currentBraceletSub: { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  expandBadge: { position: 'absolute', right: -8, top: 38, borderRadius: Radius.pill, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Palette.border, paddingHorizontal: 10, paddingVertical: 6, ...Shadow.soft },
  expandBadgeText: { color: Brand.purple, fontSize: 11, lineHeight: 14, fontWeight: '900' },

  trailNode: { width: 230, minHeight: 52, borderRadius: Radius.lg, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Palette.border, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: 7, ...Shadow.soft },
  trailNodeCompact: { opacity: 0.72, transform: [{ scale: 0.94 }] },
  trailNodeCompleted: { backgroundColor: 'rgba(255,255,255,0.82)' },
  trailNodeCopy: { flex: 1, minWidth: 0 },
  trailNodeTitle: { color: Palette.text, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  trailNodeSub: { color: Palette.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '800' },

  focusOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 40, elevation: 40, backgroundColor: '#16051F' },
  focusAuraOne: { position: 'absolute', top: 28, left: -120, width: 310, height: 310, borderRadius: 155, backgroundColor: 'rgba(46,231,214,0.16)' },
  focusAuraTwo: { position: 'absolute', bottom: -90, right: -120, width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(239,59,154,0.20)' },
  focusRibbonOne: { position: 'absolute', top: 124, right: -70, width: 250, height: 26, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)', transform: [{ rotate: '24deg' }] },
  focusRibbonTwo: { position: 'absolute', bottom: 180, left: -54, width: 220, height: 22, borderRadius: 16, backgroundColor: 'rgba(255,178,26,0.14)', transform: [{ rotate: '-18deg' }] },
  focusOkButton: { position: 'absolute', top: 14, right: 14, zIndex: 60, minWidth: 70, height: 48, borderRadius: Radius.pill, backgroundColor: Brand.cyan, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, ...Shadow.float },
  focusOkButtonPressed: { transform: [{ scale: 0.96 }] },
  focusOkText: { color: Brand.ink, fontSize: 18, lineHeight: 22, fontWeight: '900' },
  focusScroll: { flex: 1 },
  focusContent: { width: '100%', maxWidth: 920, alignSelf: 'center', paddingHorizontal: Spacing.lg, paddingTop: 76, paddingBottom: 132, gap: Spacing.md },
  focusContentMobile: { maxWidth: '100%', alignSelf: 'stretch', paddingHorizontal: 12, paddingTop: 76, paddingBottom: 118 },
  focusHeader: { alignItems: 'center', gap: 3, paddingBottom: 2 },
  focusKicker: { color: Brand.cyan, fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  focusTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  focusPathGroup: { gap: Spacing.md, alignSelf: 'stretch' },
  focusStageCard: { alignSelf: 'stretch', borderRadius: Radius.xxl, borderWidth: 0, backgroundColor: 'transparent', padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  focusStageCardMobile: { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.md, paddingHorizontal: 12 },
  focusStageCurrent: { backgroundColor: 'transparent', borderWidth: 0 },
  focusStageCompleted: { backgroundColor: 'transparent' },
  focusStagePressed: { transform: [{ scale: 0.985 }] },
  focusBraceletColumn: { alignItems: 'center', justifyContent: 'center', minWidth: 246, gap: 8 },
  focusBraceletColumnMobile: { minWidth: 0, width: '100%' },
  focusStageBadge: { borderRadius: Radius.pill, backgroundColor: 'rgba(26,19,38,0.08)', borderWidth: 1, borderColor: 'rgba(26,19,38,0.08)', paddingHorizontal: 12, paddingVertical: 6 },
  focusStageBadgeCurrent: { backgroundColor: Brand.ink, borderColor: Brand.ink },
  focusStageBadgeText: { color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  focusStageBadgeTextCurrent: { color: Brand.cyan },
  focusStageCopy: { flex: 1, minWidth: 0, gap: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: Radius.xl, padding: Spacing.md },
  focusStageKicker: { color: Brand.pink, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  focusStageTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 35, fontWeight: '900' },
  focusStageTitleMobile: { textAlign: 'center' },
  focusStageMeta: { color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  focusTrickList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusConnector: { alignItems: 'center', alignSelf: 'stretch', marginVertical: -2 },
  focusConnectorDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: Brand.pink },
  focusConnectorLine: { width: 5, height: 34, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.36)' },
  pathTrickPill: { flexGrow: 1, flexBasis: 124, minWidth: 108, maxWidth: '100%', borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 8, gap: 3 },
  pathTrickTitle: { color: '#FFFFFF', fontSize: 12, lineHeight: 16, fontWeight: '900' },
  pathTrickTitleOnLight: { color: Palette.text },
  pathTrickMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pathTrickXp: { color: Brand.orangeDeep, fontSize: 10, lineHeight: 13, fontWeight: '900' },
  pathTrickState: { fontSize: 10, lineHeight: 13, fontWeight: '900' },

  braceletModel: { alignItems: 'center', justifyContent: 'center' },
  braceletDepth: { position: 'absolute', opacity: 0.46, transform: [{ scaleX: 1.06 }] },
  braceletOuter: { alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: 'rgba(255,255,255,0.62)', ...Shadow.hero },
  braceletCutoutShadow: { position: 'absolute', opacity: 0.22 },
  braceletInnerHole: { backgroundColor: '#F8FBFF', borderWidth: 5, borderColor: 'rgba(26,19,38,0.08)' },
  braceletGloss: { position: 'absolute', top: '17%', left: '26%', backgroundColor: 'rgba(255,255,255,0.46)', transform: [{ rotate: '-24deg' }] },
  miniBracelet: { width: 38, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 0 },
  miniBraceletFace: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.68)' },
  miniBraceletHole: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', opacity: 0.82 },

  tricksPanel: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: Radius.xl, borderWidth: 1, borderColor: Palette.border, padding: Spacing.lg, gap: Spacing.md, ...Shadow.card },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  panelKicker: { color: Brand.pink, fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  panelTitle: { color: Palette.text, fontSize: 23, lineHeight: 29, fontWeight: '900' },
  trickCountBadge: { minWidth: 56, height: 44, borderRadius: 16, backgroundColor: Brand.purple, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  trickCountText: { color: '#FFFFFF', fontSize: 17, lineHeight: 21, fontWeight: '900' },
  trickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  trickCard: { flexGrow: 1, flexBasis: 150, minWidth: 150, borderRadius: Radius.lg, backgroundColor: Brand.paper, borderWidth: 1, borderColor: Palette.border, padding: Spacing.md, gap: Spacing.sm },
  trickCardDone: { backgroundColor: 'rgba(46,231,214,0.08)', borderColor: 'rgba(46,231,214,0.28)' },
  trickNumber: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  trickNumberText: { fontSize: 14, fontWeight: '900' },
  trickCopy: { gap: 2 },
  trickTitle: { color: Palette.text, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  trickDiscipline: { color: Brand.purple, fontSize: 10, lineHeight: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  trickDescription: { color: Palette.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  trickFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  trickXp: { color: Brand.orangeDeep, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  trickStatusBadge: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  trickStatusText: { fontSize: 10, lineHeight: 13, fontWeight: '900' },
  progressPanel: { borderRadius: Radius.lg, backgroundColor: Brand.paper, padding: Spacing.md, gap: Spacing.sm },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, flexWrap: 'wrap' },
  progressLabel: { color: Palette.text, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  progressMeta: { color: Palette.textMuted, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  progressCopy: { color: Palette.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '800' },

  arenaList: { gap: Spacing.sm },
  arenaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg, backgroundColor: Brand.paper, borderWidth: 1, borderColor: Palette.border, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  arenaRowUnlocked: { backgroundColor: 'rgba(46,231,214,0.08)', borderColor: 'rgba(46,231,214,0.28)' },
  arenaRowNext: { borderColor: 'rgba(139,29,255,0.40)', borderWidth: 1.5 },
  arenaRowCopy: { flex: 1, minWidth: 0 },
  arenaRowTitle: { color: Palette.text, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  arenaRowSub: { color: Palette.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '800' },

  completedPanel: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: Radius.xl, borderWidth: 1, borderColor: Palette.border, padding: Spacing.lg, gap: Spacing.md, ...Shadow.card },
  completedPanelCollapsed: { paddingBottom: Spacing.lg },
  completedPanelHeaderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, borderRadius: Radius.lg },
  completedPanelHeaderPressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
  completedSummary: { color: Palette.textMuted, fontSize: 13, lineHeight: 18, fontWeight: '900', marginTop: 3 },
  completedToggleBadge: { minWidth: 96, height: 46, borderRadius: Radius.pill, backgroundColor: Brand.ink, borderWidth: 1, borderColor: 'rgba(26,19,38,0.10)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12 },
  completedToggleIcon: { color: Brand.cyan, fontSize: 20, lineHeight: 22, fontWeight: '900' },
  completedToggleText: { color: '#FFFFFF', fontSize: 12, lineHeight: 15, fontWeight: '900' },
  completedList: { gap: Spacing.md },
  completedCard: { borderRadius: Radius.xl, borderWidth: 1.5, borderColor: 'rgba(216,194,163,0.52)', backgroundColor: 'rgba(216,194,163,0.10)', padding: Spacing.md, flexDirection: 'row', gap: Spacing.lg, alignItems: 'center' },
  completedCardMobile: { flexDirection: 'column', alignItems: 'stretch' },
  completedBraceletWrap: { alignItems: 'center', justifyContent: 'center' },
  completedCopy: { flex: 1, minWidth: 0, gap: 7 },
  completedTitle: { color: Palette.text, fontSize: 18, lineHeight: 23, fontWeight: '900' },
  completedMeta: { color: Palette.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '900' },
  completedTrickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

});