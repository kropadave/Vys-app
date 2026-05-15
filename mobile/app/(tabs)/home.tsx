import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedCounter, AnimatedProgressBar, FadeInUp, PulseGlow } from '@/components/animated/motion';
import { ParticipantActivePurchases } from '@/components/participant-active-purchases';
import { ParticipantCard } from '@/components/participant-card';
import { useAuth } from '@/hooks/use-auth';
import { passesForParticipant, useDigitalPasses } from '@/hooks/use-digital-passes';
import { useParticipantProfile } from '@/hooks/use-participant-profile';
import { activityColors } from '@/lib/activity-theme';
import { ALL_MASCOTS, demoOwnedMascots, rarityColor, rarityLabel, type MascotRarity, type OwnedMascot } from '@/lib/attendance-coins';
import { Brand, BrandGradient } from '@/lib/brand';
import { digitalPassProgress, remainingEntries, type DigitalPass } from '@/lib/digital-pass-content';
import { rewardPathForXp, type ParticipantProfile } from '@/lib/participant-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

export default function ParticipantOverview() {
  const { isMobile } = useBreakpoint();
  const { profile, profileReady, loading: profileLoading, authLoading } = useParticipantProfile();
  const router = useRouter();
  const liveRewardPath = useMemo(() => rewardPathForXp(profile.xp), [profile.xp]);
  const progress = Math.min(profile.xp / profile.nextBraceletXp, 1);
  const courseColors = activityColors('Kroužek');
  const { digitalPasses } = useDigitalPasses();
  const participantPasses = passesForParticipant(digitalPasses, profile.id);
  const activePass = participantPasses[0] ?? null;
  const passProgress = activePass ? digitalPassProgress(activePass) : 0;
  const passProgressPercent = Math.round(passProgress * 100);
  const entriesLeft = activePass ? remainingEntries(activePass) : 0;
  const nextReward = liveRewardPath.find((item) => !item.unlocked);
  const nextRewardDistance = Math.max(0, (nextReward?.xp ?? profile.xp) - profile.xp);

  // Show spinner only while auth or profile is actively loading.
  if (authLoading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F3FF' }}>
        <ActivityIndicator color="#8B1DFF" />
      </View>
    );
  }

  // Auth resolved but no profile — _layout.tsx redirects to /sign-in.
  if (!profileReady) {
    return null;
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.container, styles.liveContainer]}>
      <LiveHeroPodium profile={profile} progress={progress} />

      <View style={styles.liveStatsGrid}>
        <LiveStat icon="bolt" label="XP" value={profile.xp} color={Brand.purple} />
        <LiveStat icon="ticket-alt" label="Vstupy" value={entriesLeft} color={Brand.cyanDeep} />
        <LiveStat icon="gift" label="Do cíle" value={nextRewardDistance} color={Brand.orangeDeep} />
      </View>

      {activePass ? (
        <DigitalPassCard
          activePass={activePass}
          passProgress={passProgress}
          passProgressPercent={passProgressPercent}
          entriesLeft={entriesLeft}
          courseColors={courseColors}
          isMobile={isMobile}
        />
      ) : (
        <ParticipantCard accent={Brand.cyan} style={styles.passCard}>
          <Text style={styles.sectionKicker}>Digitální permanentka</Text>
          <Text style={styles.passTitle}>Žádná aktivní permanentka</Text>
          <Text style={styles.muted}>Po nákupu nebo přiřazení v administraci se tady objeví živá data z databáze.</Text>
        </ParticipantCard>
      )}

      <ParticipantActivePurchases title="Zakoupeno" participantId={profile.id} participantName={profile.name} />

      <BirthNumberBanner profile={profile} />

      {nextReward ? (
        <ParticipantCard variant="gradient" gradient={BrandGradient.warm} pattern title="Další odměna">
          <Text style={styles.rewardTitle}>{nextReward.title}</Text>
          <Text style={styles.rewardBody}>{nextRewardDistance} XP zbývá</Text>
        </ParticipantCard>
      ) : null}

      {/* Tutorials shortcut */}
      <Pressable
        onPress={() => router.push('/tutorials' as never)}
        style={({ pressed }) => [styles.tutorialsCard, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Tutoriály triků"
      >
        <LinearGradient
          colors={['#8B1DFF', '#F12BB3'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tutorialsGradient}
        >
          <View style={styles.tutorialsIconWrap}>
            <FontAwesome5 name="play-circle" size={28} color="rgba(255,255,255,0.92)" />
          </View>
          <View style={styles.tutorialsText}>
            <Text style={styles.tutorialsTitle}>Tutoriály triků</Text>
            <Text style={styles.tutorialsSub}>46 triků · postup, chyby, bezpečnostní tipy</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={13} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </Pressable>

    </ScrollView>
  );
}

const mascotBeigeSit = require('@/assets/images/maskoti/maskot-beige-sit.png');

function LiveHeroPodium({ profile, progress }: { profile: ParticipantProfile; progress: number }) {
  const percent = Math.round(progress * 100);
  const { bracelet } = profile;
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <FadeInUp>
      <View style={styles.podiumWrap}>
        <View style={styles.podiumStage}>
          <View style={styles.podiumStageShadow} />
          <LinearGradient colors={['#B77814', '#8E5A10'] as [string, string]} style={styles.podiumStageBase} />
          <LinearGradient colors={['#D7A22F', '#B77A18'] as [string, string]} style={styles.podiumStageFront} />
          <LinearGradient colors={['#FFE278', '#D1A33A', '#B57C19'] as [string, string, string]} style={styles.podiumStageTop} />
          <View style={styles.podiumStageShine} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zobrazit maskoty"
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.podiumMascotSlot, pressed && { opacity: 0.75 }]}
        >
          <FontAwesome5 name="question" size={48} color="rgba(139,29,255,0.18)" />
          <View style={[styles.mascotTapBadge, { borderColor: 'rgba(139,29,255,0.22)', backgroundColor: 'rgba(139,29,255,0.09)' }]}>
            <FontAwesome5 name="search" size={11} color={Brand.purple} />
          </View>
        </Pressable>
        <View style={styles.podiumCard}>
          <Text style={styles.podiumName}>{profile.name.split(' ')[0] || 'Účastník'}</Text>
          <AnimatedProgressBar
            progress={progress}
            fillColor={Brand.purple}
            trackColor="rgba(139,29,255,0.13)"
            height={8}
            style={{ alignSelf: 'stretch' }}
          />
          <Text style={styles.podiumXpHint}>
            {profile.xp} / {profile.nextBraceletXp} XP · {percent} % do dalšího náramku
          </Text>
          <View style={styles.podiumTiles}>
            <View style={styles.levelTile}>
              <Text style={styles.tileLabel}>Level</Text>
              <Text style={styles.levelValue}>{profile.level}</Text>
            </View>
            <View style={[styles.braceletTile, { backgroundColor: bracelet.color + '28', borderColor: bracelet.color + '60' }]}>
              <View style={[styles.braceletDot, { backgroundColor: bracelet.color }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.braceletText, { color: Brand.ink }]}>{bracelet.title}</Text>
                <Text style={[styles.braceletSub, { color: bracelet.color }]}>aktuální náramek</Text>
              </View>
            </View>
          </View>
        </View>
        <MascotPickerModal
          visible={pickerOpen}
          selectedMascotId=""
          ownedMascots={[]}
          onClose={() => setPickerOpen(false)}
          onSelect={() => setPickerOpen(false)}
        />
      </View>
    </FadeInUp>
  );
}

function MascotPedestalCard({ mascot }: { mascot: OwnedMascot | null }) {
  return (
    <View style={styles.mascotPedestalCard}>
      <Text style={styles.mascotPedestalKicker}>Maskot</Text>
      <View style={styles.mascotPedestalStage}>
        {/* podstavec - zlatý pruh */}
        <LinearGradient
          colors={['#FFE278', '#D1A33A', '#B57C19'] as [string, string, string]}
          style={styles.mascotPedestalBase}
        />
        {mascot ? (
          <Image
            source={mascotAssetById[mascot.id] ?? mascotBeigeSit}
            style={styles.mascotPedestalImage}
            contentFit="contain"
          />
        ) : (
          <View style={styles.mascotPedestalEmpty}>
            <FontAwesome5 name="question" size={32} color="rgba(155,44,255,0.22)" />
          </View>
        )}
      </View>
      <Text style={styles.mascotPedestalHint}>
        {mascot ? mascot.name : 'Maskot se odemkne z bedny v Docházce'}
      </Text>
    </View>
  );
}

const mascotAssetById: Partial<Record<string, typeof mascotBeigeSit>> = {
  'beige-sit': mascotBeigeSit,
};

const mascotRarityOrder: MascotRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function mascotImageSource(mascot: OwnedMascot) {
  return mascotAssetById[mascot.id] ?? mascotBeigeSit;
}

function hasMascotImage(mascot: OwnedMascot) {
  return Boolean(mascotAssetById[mascot.id]);
}

function ParticipantHeroCard({ profile, progress }: { profile: ParticipantProfile; progress: number }) {
  const defaultMascot = demoOwnedMascots.find((mascot) => mascot.equippedOnProfile) ?? demoOwnedMascots[0];
  const [selectedMascotId, setSelectedMascotId] = useState(defaultMascot.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const percent = Math.round(progress * 100);
  const bracelet = profile.bracelet;
  const selectedMascot = demoOwnedMascots.find((mascot) => mascot.id === selectedMascotId) ?? defaultMascot;
  const mascotAccent = selectedMascot.colorHex;
  return (
    <FadeInUp>
      <View style={styles.podiumWrap}>
        <View style={styles.podiumStage}>
          <View style={styles.podiumStageShadow} />
          <LinearGradient colors={['#B77814', '#8E5A10'] as [string, string]} style={styles.podiumStageBase} />
          <LinearGradient colors={['#D7A22F', '#B77A18'] as [string, string]} style={styles.podiumStageFront} />
          <LinearGradient colors={['#FFE278', '#D1A33A', '#B57C19'] as [string, string, string]} style={[styles.podiumStageTop, { shadowColor: mascotAccent }]} />
          <View style={styles.podiumStageShine} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Vybrat maskota"
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.podiumMascotButton, pressed && styles.podiumMascotButtonPressed]}
        >
          <Image source={mascotImageSource(selectedMascot)} style={styles.podiumMascot} contentFit="contain" />
          <View style={[styles.mascotTapBadge, { borderColor: hexToSoft(mascotAccent, 0.35), backgroundColor: hexToSoft(mascotAccent, 0.14) }]}> 
            <FontAwesome5 name="exchange-alt" size={11} color={mascotAccent} />
          </View>
        </Pressable>
        <View style={styles.podiumCard}>
          <Text style={styles.podiumName}>{profile.name.split(' ')[0]}</Text>
          <AnimatedProgressBar
            progress={progress}
            fillColor={Brand.purple}
            trackColor="rgba(139,29,255,0.13)"
            height={8}
            style={{ alignSelf: 'stretch' }}
          />
          <Text style={styles.podiumXpHint}>{profile.xp} / {profile.nextBraceletXp} XP · {percent} % do dalšího náramku</Text>
          <View style={styles.podiumTiles}>
            <View style={styles.levelTile}>
              <Text style={styles.tileLabel}>Level</Text>
              <Text style={styles.levelValue}>{profile.level}</Text>
            </View>
            <View style={[styles.braceletTile, { backgroundColor: bracelet.color + '28', borderColor: bracelet.color + '60' }]}>
              <View style={[styles.braceletDot, { backgroundColor: bracelet.color }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.braceletText, { color: Brand.ink }]}>{bracelet.title}</Text>
                <Text style={[styles.braceletSub, { color: bracelet.color }]}>aktuální náramek</Text>
              </View>
            </View>
          </View>
        </View>
        <MascotPickerModal
          visible={pickerOpen}
          selectedMascotId={selectedMascot.id}
          onClose={() => setPickerOpen(false)}
          onSelect={(mascotId) => {
            setSelectedMascotId(mascotId);
            setPickerOpen(false);
          }}
        />
      </View>
    </FadeInUp>
  );
}

function MascotPickerModal({ visible, selectedMascotId, ownedMascots, onClose, onSelect }: { visible: boolean; selectedMascotId: string; ownedMascots?: OwnedMascot[]; onClose: () => void; onSelect: (mascotId: string) => void }) {
  if (!visible) return null;

  const resolvedOwned = ownedMascots ?? demoOwnedMascots;
  const ownedMascotIds = new Set(resolvedOwned.map((mascot) => mascot.id));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.mascotModalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.mascotSheet}>
          <View style={styles.mascotSheetHeader}>
            <View>
              <Text style={styles.mascotSheetTitle}>Maskoti</Text>
              <Text style={styles.mascotSheetSub}>Odemčeno z beden</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Zavřít" onPress={onClose} style={styles.mascotCloseButton}>
              <FontAwesome5 name="times" size={14} color={Palette.textMuted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.mascotGroups} showsVerticalScrollIndicator={false}>
            {mascotRarityOrder.map((rarity) => {
              const mascots = ALL_MASCOTS.filter((mascot) => mascot.rarity === rarity);
              const selectableCount = mascots.filter((mascot) => ownedMascotIds.has(mascot.id) && hasMascotImage(mascot)).length;
              return (
                <View key={rarity} style={styles.mascotGroup}>
                  <View style={styles.mascotGroupHeader}>
                    <Text style={[styles.mascotGroupTitle, { color: rarityColor[rarity] }]}>{rarityLabel[rarity]}</Text>
                    <Text style={styles.mascotGroupCount}>{selectableCount}/{mascots.length}</Text>
                  </View>
                  <View style={styles.mascotSlots}>
                    {mascots.map((mascot, index) => {
                      const selectable = ownedMascotIds.has(mascot.id) && hasMascotImage(mascot);
                      const selected = mascot.id === selectedMascotId;
                      return (
                        <Pressable
                          key={mascot.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${rarityLabel[rarity]} maskot ${index + 1}`}
                          disabled={!selectable}
                          onPress={() => onSelect(mascot.id)}
                          style={({ pressed }) => [
                            styles.mascotSlot,
                            { borderColor: selectable ? hexToSoft(mascot.colorHex, 0.34) : Palette.border, backgroundColor: hexToSoft(mascot.colorHex, selectable ? 0.10 : 0.05) },
                            selected && { borderColor: mascot.colorHex },
                            pressed && styles.mascotOptionPressed,
                            !selectable && styles.mascotOptionLocked,
                          ]}
                        >
                          {selectable ? (
                            <Image source={mascotImageSource(mascot)} style={styles.mascotOptionImage} contentFit="contain" />
                          ) : (
                            <>
                              <Image source={mascotAssetById[mascot.id] ?? mascotBeigeSit} style={[styles.mascotOptionImage, { opacity: 0.22 }]} contentFit="contain" />
                              <View style={styles.mascotLockBadge}>
                                <FontAwesome5 name="lock" size={12} color="#FFFFFF" />
                              </View>
                            </>
                          )}
                          {selected ? <View style={[styles.mascotSelectedMark, { backgroundColor: mascot.colorHex }]}><FontAwesome5 name="check" size={9} color="#FFFFFF" /></View> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProfileStrip({ profile, compact = false }: { profile: ParticipantProfile; compact?: boolean }) {
  return (
    <View style={[styles.profileStrip, compact && styles.profileStripCompact]}>
      <View style={[styles.levelTile, compact && styles.levelTileCompact]}>
        <Text style={styles.tileLabel}>Level</Text>
        <Text style={[styles.levelValue, compact && styles.levelValueCompact]}>{profile.level}</Text>
      </View>
      <View style={[styles.braceletTile, compact && styles.braceletTileCompact]}>
        <View style={[styles.braceletDot, { backgroundColor: profile.bracelet.color }]} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.braceletText, compact && styles.braceletTextCompact]}>{profile.bracelet.title}</Text>
          <Text style={styles.braceletSub}>aktuální náramek</Text>
        </View>
      </View>
    </View>
  );
}

function LiveStat({ icon, label, value, color }: { icon: ComponentProps<typeof FontAwesome5>['name']; label: string; value: number; color: string }) {
  return (
    <View style={styles.liveStatCard}>
      <View style={[styles.liveStatIcon, { backgroundColor: hexToSoft(color, 0.12) }]}>
        <FontAwesome5 name={icon} size={12} color={color} />
      </View>
      <Text style={[styles.liveStatValue, { color }]}>{value}</Text>
      <Text style={styles.liveStatLabel}>{label}</Text>
    </View>
  );
}

function SummaryStat({ icon, label, value, color, soft, compact = false }: { icon: ComponentProps<typeof FontAwesome5>['name']; label: string; value: number; color: string; soft: string; compact?: boolean }) {
  return (
    <View style={[styles.statCard, compact && styles.statCardCompact, { borderColor: soft, backgroundColor: '#FFFFFF' }]}> 
      <View style={[styles.statIcon, compact && styles.statIconCompact, { backgroundColor: soft }]}>
        <FontAwesome5 name={icon} size={compact ? 11 : 13} color={color} />
      </View>
      <AnimatedCounter
        to={value}
        duration={1100}
        style={compact ? [styles.statValue, styles.statValueCompact, { color }] : [styles.statValue, { color }]}
      />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DigitalPassCard({
  activePass,
  passProgress,
  passProgressPercent,
  entriesLeft,
  courseColors,
  isMobile,
}: {
  activePass: DigitalPass;
  passProgress: number;
  passProgressPercent: number;
  entriesLeft: number;
  courseColors: { soft: string; border: string };
  isMobile: boolean;
}) {
  return (
    <ParticipantCard accent={Brand.cyan} style={styles.passCard}>
      <View style={[styles.cardTitleRow, isMobile && styles.cardTitleRowMobile]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.sectionKicker}>Digitální permanentka</Text>
          <Text style={styles.passTitle}>{activePass.title}</Text>
          <Text style={styles.muted}>{activePass.location}</Text>
        </View>
        <PulseGlow scaleTo={1.04}>
          <View style={[styles.nfcPill, { backgroundColor: courseColors.soft, borderColor: courseColors.border }]}> 
            <Text style={styles.nfcPillText}>NFC</Text>
          </View>
        </PulseGlow>
      </View>

      <View style={styles.passMeterBox}>
        <View style={styles.passMeterHeader}>
          <Text style={styles.passMeterValue}>{activePass.usedEntries} z {activePass.totalEntries} vstupů</Text>
          <Text style={styles.passMeterPercent}>{passProgressPercent} %</Text>
        </View>
        <AnimatedProgressBar
          progress={passProgress}
          fillColor={Brand.cyanDeep}
          trackColor="rgba(46,231,214,0.17)"
          height={12}
        />
      </View>

      <View style={[styles.passStats, isMobile && styles.passStatsMobile]}>
        <PassStat label="Využito" value={`${activePass.usedEntries}x`} />
        <PassStat label="Zbývá" value={`${entriesLeft}x`} highlight />
        <PassStat label="Celkem" value={`${activePass.totalEntries}x`} />
      </View>

      <View style={styles.scanInfo}>
        <Text style={styles.scanLabel}>Poslední načtení</Text>
        <Text style={styles.scanValue}>{activePass.lastScanAt}</Text>
        <Text style={styles.scanLabel}>Čip</Text>
        <Text style={styles.scanValue}>{activePass.nfcChipId}</Text>
      </View>
    </ParticipantCard>
  );
}

function PassStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.passStatCard, highlight && styles.passStatCardHighlight]}>
      <Text style={[styles.passStatValue, highlight && styles.passStatValueHighlight]}>{value}</Text>
      <Text style={styles.passStatLabel}>{label}</Text>
    </View>
  );
}

function hexToSoft(hex: string, alpha: number) {
  const v = hex.replace('#', '');
  const expand = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  const r = parseInt(expand.slice(0, 2), 16);
  const g = parseInt(expand.slice(2, 4), 16);
  const b = parseInt(expand.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── BirthNumberBanner ───────────────────────────────────────────────────────

function BirthNumberBanner({ profile }: { profile: ParticipantProfile }) {
  const { session } = useAuth();
  const userId = profile.id || session?.userId || '';
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 4) {
      Alert.alert('Zadej rodné číslo', 'Musí mít aspoň 4 číslice.');
      return;
    }
    const formatted = digits.length >= 7 ? `${digits.slice(0, 6)}/${digits.slice(6)}` : digits;
    if (!hasSupabaseConfig || !supabase || !userId) return;
    setSaving(true);
    // Try update first; if no row exists, upsert with minimal required fields
    const { error: updateError } = await supabase
      .from('participants')
      .update({ birth_number_masked: formatted })
      .eq('id', userId);
    if (updateError && updateError.code !== 'PGRST116') {
      setSaving(false);
      Alert.alert('Chyba', updateError.message);
      return;
    }
    // Check if row actually exists
    const { data: existingRow } = await supabase.from('participants').select('id').eq('id', userId).maybeSingle();
    if (!existingRow) {
      // Row doesn't exist — fetch name from app_profiles first
      const { data: ap } = await supabase.from('app_profiles').select('name').eq('id', userId).maybeSingle();
      const nameParts = (ap?.name || '').trim().split(/\s+/);
      const { error: upsertError } = await supabase.from('participants').upsert(
        { id: userId, first_name: nameParts[0] || 'Účastník', last_name: nameParts.slice(1).join(' ') || 'TeamVYS',
          birth_number_masked: formatted, paid_status: 'due', active_purchases: [], without_phone: true },
        { onConflict: 'id' }
      );
      if (upsertError) {
        setSaving(false);
        Alert.alert('Chyba', upsertError.message);
        return;
      }
    }
    setSaving(false);
    setSaved(true);
    setOpen(false);
    setValue('');
  }, [value, userId]);

  if (saved || profile.birthNumberMasked) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={bnStyles.banner}
      >
        <FontAwesome5 name="id-card" size={15} color={Brand.purple} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={bnStyles.title}>Doplň rodné číslo</Text>
          <Text style={bnStyles.sub}>Potřebuješ ho pro propojení s rodičovským portálem.</Text>
        </View>
        <FontAwesome5 name="chevron-right" size={12} color={Brand.purple} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={bnStyles.overlay}>
          <View style={bnStyles.sheet}>
            <Text style={bnStyles.sheetTitle}>Rodné číslo</Text>
            <Text style={bnStyles.sheetSub}>Zadej 6 číslic, lomítko se přidá automaticky.</Text>
            <TextInput
              style={bnStyles.input}
              placeholder="045212/1234"
              placeholderTextColor="#bbb"
              value={value}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '');
                if (digits.length <= 6) setValue(digits);
                else setValue(`${digits.slice(0, 6)}/${digits.slice(6, 10)}`);
              }}
              keyboardType="number-pad"
              maxLength={11}
              autoFocus
            />
            <View style={bnStyles.row}>
              <Pressable style={bnStyles.btnSecondary} onPress={() => setOpen(false)}>
                <Text style={bnStyles.btnSecondaryText}>Zrušit</Text>
              </Pressable>
              <Pressable style={[bnStyles.btnPrimary, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
                <Text style={bnStyles.btnPrimaryText}>{saving ? 'Ukládám…' : 'Uložit'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const bnStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EAFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,29,255,0.18)',
  },
  title: { fontSize: 14, fontWeight: '700', color: Brand.purple },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  sheet: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%', maxWidth: 380 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  sheetSub: { fontSize: 13, color: '#666', marginBottom: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(139,29,255,0.3)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1a1a2e',
    marginBottom: 18,
  },
  row: { flexDirection: 'row', gap: 10 },
  btnSecondary: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center' },
  btnSecondaryText: { fontSize: 14, fontWeight: '600', color: '#555' },
  btnPrimary: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: Brand.purple, alignItems: 'center' },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: {
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: 94,
  },
  containerMobile: { padding: 14, gap: 14, paddingBottom: 104 },
  liveContainer: { paddingTop: 14, gap: 14 },
  liveHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(23,18,32,0.10)',
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.soft,
  },
  liveKicker: { color: Brand.purpleDeep, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  liveName: { color: Brand.ink, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  liveSub: { color: Palette.textMuted, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  liveTiles: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'stretch' },
  liveLevelTile: {
    width: 82,
    borderRadius: Radius.lg,
    backgroundColor: Brand.ink,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTileLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 10, lineHeight: 13, fontWeight: '900', textTransform: 'uppercase' },
  liveLevelValue: { color: '#FFFFFF', fontSize: 28, lineHeight: 32, fontWeight: '900' },
  liveBraceletTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  liveBraceletDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#FFFFFF' },
  liveBraceletTitle: { color: Brand.ink, fontSize: 17, lineHeight: 22, fontWeight: '900' },
  liveBraceletSub: { color: Palette.textMuted, fontSize: 10, lineHeight: 14, fontWeight: '900', textTransform: 'uppercase' },
  liveStatsGrid: { flexDirection: 'row', gap: Spacing.sm },
  liveStatCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 88,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(23,18,32,0.08)',
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Shadow.soft,
  },
  liveStatIcon: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  liveStatValue: { fontSize: 23, lineHeight: 27, fontWeight: '900' },
  liveStatLabel: { color: Palette.textMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textAlign: 'center' },

  // podium hero
  podiumWrap: {
    alignItems: 'center',
    position: 'relative',
    paddingTop: 108,
    marginTop: 80,
  },
  podiumStage: {
    position: 'absolute',
    top: 104,
    width: 176,
    height: 58,
    alignItems: 'center',
    zIndex: 2,
  },
  podiumStageShadow: {
    position: 'absolute',
    bottom: 1,
    width: 180,
    height: 18,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(82,50,8,0.24)',
  },
  podiumStageBase: {
    position: 'absolute',
    bottom: 0,
    width: 168,
    height: 16,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  podiumStageFront: {
    position: 'absolute',
    top: 22,
    width: 138,
    height: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  podiumStageTop: {
    position: 'absolute',
    top: 0,
    width: 156,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.52)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 7,
  },
  podiumStageShine: {
    position: 'absolute',
    top: 5,
    width: 112,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  podiumMascotSlot: {
    width: 182,
    height: 210,
    position: 'absolute',
    top: -74,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    borderWidth: 2,
    borderColor: 'rgba(139,29,255,0.14)',
    borderRadius: Radius.xl,
  },
  podiumMascotButton: {
    width: 182,
    height: 210,
    position: 'absolute',
    top: -74,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  podiumMascotButtonPressed: { transform: [{ scale: 0.98 }] },
  podiumMascot: { width: 182, height: 210 },
  mascotTapBadge: {
    position: 'absolute',
    right: 13,
    bottom: 42,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  podiumCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xxl,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.10)',
    paddingTop: 72,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
    ...Shadow.hero,
  },
  podiumName: {
    color: Brand.ink,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    textAlign: 'center',
  },
  podiumXpHint: {
    color: Palette.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  podiumTiles: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.xs,
  },
  mascotModalOverlay: { flex: 1, backgroundColor: 'rgba(12,7,20,0.46)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  mascotSheet: { width: '100%', maxWidth: 520, maxHeight: '82%', borderRadius: Radius.xxl, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(23,18,32,0.08)', padding: Spacing.lg, gap: Spacing.md, ...Shadow.float },
  mascotSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  mascotSheetTitle: { color: Palette.text, fontSize: 22, lineHeight: 27, fontWeight: '900' },
  mascotSheetSub: { color: Palette.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '800', marginTop: 1 },
  mascotCloseButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  mascotGroups: { gap: Spacing.lg, paddingBottom: Spacing.xs },
  mascotGroup: { gap: Spacing.sm },
  mascotGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  mascotGroupTitle: { fontSize: 14, lineHeight: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  mascotGroupCount: { color: Palette.textSubtle, fontSize: 11, lineHeight: 15, fontWeight: '900' },
  mascotSlots: { flexDirection: 'row', gap: Spacing.sm },
  mascotSlot: { flex: 1, minHeight: 92, borderRadius: Radius.xl, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  mascotOptionPressed: { opacity: 0.86 },
  mascotOptionLocked: { opacity: 0.54, backgroundColor: Palette.surfaceAlt },
  mascotOptionImage: { width: 74, height: 84 },
  mascotSelectedMark: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mascotLockBadge: { position: 'absolute', bottom: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(23,18,32,0.62)', alignItems: 'center', justifyContent: 'center' },

  heroOrbTop: { position: 'absolute', top: -110, right: -70 },
  heroOrbBottom: { position: 'absolute', bottom: -96, left: -70 },
  heroSparkle: { position: 'absolute', top: 34, right: 52 },
  heroLayout: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, position: 'relative', zIndex: 1 },
  heroLayoutMobile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  heroCopy: { flex: 1, minWidth: 0, gap: Spacing.md },
  heroKickerPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroKicker: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: 42, lineHeight: 48, fontWeight: '900' },
  heroTitleMobile: { fontSize: 29, lineHeight: 34 },
  heroBody: { color: 'rgba(255,255,255,0.88)', fontSize: 15, lineHeight: 22, maxWidth: 560, fontWeight: '700' },
  heroBodyMobile: { fontSize: 13, lineHeight: 19 },
  // Hero progress block uvnitř BrandHero
  heroProgress: { gap: Spacing.md, marginTop: Spacing.sm },
  heroProgressHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroProgressValue: { color: '#FFFFFF', fontSize: 17, lineHeight: 22, fontWeight: '900', textShadowColor: 'rgba(12,7,20,0.28)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 7 },
  heroProgressLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2, textShadowColor: 'rgba(12,7,20,0.22)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  heroProgressBadge: { backgroundColor: 'rgba(255,255,255,0.90)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md },
  heroProgressBadgeText: { color: Brand.purpleDeep, fontSize: 13, fontWeight: '900' },

  profileStrip: { flexDirection: 'row', gap: Spacing.md, alignItems: 'stretch', marginTop: Spacing.xs, flexWrap: 'wrap' },
  profileStripCompact: { gap: Spacing.sm, marginTop: Spacing.sm },
  levelTile: {
    width: 84,
    borderRadius: Radius.lg,
    backgroundColor: Brand.ink,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTileCompact: { width: 70, borderRadius: Radius.md, padding: Spacing.sm },
  tileLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  levelValue: { color: '#FFFFFF', fontSize: 30, lineHeight: 34, fontWeight: '900' },
  levelValueCompact: { fontSize: 24, lineHeight: 28 },
  braceletTile: {
    flex: 1,
    minWidth: 180,
    borderRadius: Radius.lg,
    backgroundColor: Brand.purpleLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  braceletTileCompact: { minWidth: 0, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md },
  braceletDot: { width: 22, height: 22, borderRadius: 22, borderWidth: 3, borderColor: '#FFFFFF' },
  braceletText: { color: Brand.ink, fontSize: 17, fontWeight: '900' },
  braceletTextCompact: { fontSize: 15 },
  braceletSub: { color: Brand.purpleDeep, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  heroMascotFrame: {
    width: 226,
    minHeight: 198,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMascotFrameMobile: { alignSelf: 'center', width: 126, minHeight: 108, borderRadius: Radius.lg, marginTop: 0 },
  progressCard: {
    position: 'relative',
    zIndex: 1,
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(26,19,38,0.28)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  progressCardMobile: { marginTop: Spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'center' },
  progressValue: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, fontWeight: '900' },
  progressLabel: { color: 'rgba(255,255,255,0.76)', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  progressPercent: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },

  statsGrid: { flexDirection: 'row', gap: Spacing.md },
  statsGridMobile: { gap: Spacing.sm },
  statWrap: { flex: 1, minWidth: 0 },
  statCard: {
    minHeight: 112,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    position: 'relative',
    ...Shadow.soft,
  },
  statCardCompact: { minHeight: 90, borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm },
  statIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statIconCompact: { width: 24, height: 24, borderRadius: 12 },
  statValue: { fontSize: 26, lineHeight: 30, fontWeight: '900' },
  statValueCompact: { fontSize: 22, lineHeight: 26 },
  statLabel: { color: Palette.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '800', textAlign: 'center' },

  contentGrid: { gap: Spacing.lg },
  mainColumn: { gap: Spacing.lg, minWidth: 0 },
  sideColumn: { gap: Spacing.lg, minWidth: 0 },

  passCard: { borderColor: 'rgba(46,231,214,0.22)' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardTitleRowMobile: { alignItems: 'flex-start' },
  sectionKicker: { color: Brand.cyanDeep, fontSize: 12, lineHeight: 17, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  passTitle: { color: Palette.text, fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 2 },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  nfcPill: { borderWidth: 1.5, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  nfcPillText: { color: Brand.cyanDeep, fontSize: 12, fontWeight: '900' },
  passMeterBox: { gap: Spacing.sm, borderRadius: Radius.lg, backgroundColor: 'rgba(46,231,214,0.08)', padding: Spacing.md },
  passMeterHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'center' },
  passMeterValue: { color: Palette.text, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  passMeterPercent: { color: Brand.cyanDeep, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  passStats: { flexDirection: 'row', gap: Spacing.md },
  passStatsMobile: { gap: Spacing.sm },
  passStatCard: { flex: 1, minWidth: 0, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.lg, padding: Spacing.md },
  passStatCardHighlight: { backgroundColor: 'rgba(46,231,214,0.13)' },
  passStatValue: { color: Palette.text, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  passStatValueHighlight: { color: Brand.cyanDeep },
  passStatLabel: { color: Palette.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  scanInfo: { borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: Spacing.md, gap: 3 },
  scanLabel: { color: Palette.textSubtle, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  scanValue: { color: Palette.text, fontSize: 13, lineHeight: 19, fontWeight: '800', marginBottom: 6 },

  text: { flex: 1, color: Palette.text, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  notificationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  notificationMark: { width: 24, height: 24, borderRadius: 12, backgroundColor: Palette.pinkSoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  notificationNumber: { color: Brand.pink, fontSize: 12, fontWeight: '900' },
  rewardTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '900' },
  rewardBody: { color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 20, fontWeight: '700' },

  mascotPedestalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(23,18,32,0.08)',
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.soft,
  },
  mascotPedestalKicker: {
    color: Brand.purpleDeep,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
  },
  mascotPedestalStage: {
    alignItems: 'center',
    paddingTop: 16,
    width: '100%',
  },
  mascotPedestalBase: {
    width: 140,
    height: 20,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  mascotPedestalImage: {
    width: 160,
    height: 180,
    marginBottom: -4,
  },
  mascotPedestalEmpty: {
    width: 140,
    height: 160,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(155,44,255,0.18)',
    backgroundColor: 'rgba(155,44,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -4,
  },
  mascotPedestalHint: {
    color: Palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  tutorialsCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: 4,
  },
  tutorialsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: Radius.lg,
  },
  tutorialsIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialsText: {
    flex: 1,
  },
  tutorialsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.3,
  },
  tutorialsSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
});
