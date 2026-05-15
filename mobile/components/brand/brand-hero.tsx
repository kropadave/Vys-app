import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { FadeInUp } from '@/components/animated/motion';
import { Brand, BrandGradient } from '@/lib/brand';
import { Radius, Shadow, Spacing } from '@/lib/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

const mascotBeigeSit = require('@/assets/images/maskoti/maskot-beige-sit.png');

type Props = {
  kicker: string;
  title: string;
  highlight?: string;
  body?: string;
  mascot?: boolean;
  equippedMascotColor?: string;
  variant?: 'hero' | 'compact';
  children?: React.ReactNode;
  style?: ViewStyle;
  avatarUri?: string;
  avatarInitials?: string;
  onAvatarPress?: () => void;
};

export function BrandHero({ kicker, title, highlight, body, mascot = false, equippedMascotColor, variant = 'hero', children, style, avatarUri, avatarInitials, onAvatarPress }: Props) {
  const { isMobile, isTablet } = useBreakpoint();
  const showMascot = mascot && variant === 'hero';
  const isCompact = variant === 'compact';
  const showAvatar = showMascot && !!(avatarUri || avatarInitials);

  return (
    <View style={[styles.outerWrap, style]}>
    <View style={[styles.shell, isCompact && styles.shellCompact]}>
      <LinearGradient
        colors={isCompact ? ['#FFFFFF', '#FFF6E6', '#FFEEE3'] : BrandGradient.game}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {!isCompact ? (
        <LinearGradient
          colors={['rgba(241,43,179,0.0)', 'rgba(255,178,26,0.35)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View style={[styles.row, styles.rowCompact, (isMobile || isTablet) && styles.rowMobile]}>
        <View style={[styles.copyColumn, showMascot && !isMobile && styles.copyColumnWithMascot]}>
          <FadeInUp>
            <View style={[styles.kickerPill, !isCompact && styles.kickerPillDark]}>
              <Text style={[styles.kickerText, !isCompact && styles.kickerTextDark]}>{kicker}</Text>
            </View>
          </FadeInUp>
          <FadeInUp delay={60}>
            <Text style={[styles.title, !isCompact && styles.titleDark, isMobile && styles.titleMobile, isTablet && styles.titleTablet]}>
              {title}
              {highlight ? <Text style={styles.titleAccent}>{` ${highlight}`}</Text> : null}
            </Text>
          </FadeInUp>
          {body ? (
            <FadeInUp delay={120}>
              <Text style={[styles.body, !isCompact && styles.bodyDark]}>{body}</Text>
            </FadeInUp>
          ) : null}
          {children ? (
            <FadeInUp delay={180} style={styles.childrenWrap}>
              {children}
            </FadeInUp>
          ) : null}
        </View>
      </View>

    </View>

      {showMascot && !showAvatar ? (

        <Image
          source={mascotBeigeSit}
          style={[styles.mascotAbsolute, isMobile && styles.mascotAbsoluteMobile]}
          contentFit="contain"
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    minHeight: 260,
    ...Shadow.hero,
  },
  shellCompact: {
    minHeight: 0,
    borderRadius: Radius.xxl,
    ...Shadow.soft,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    position: 'relative',
    zIndex: 1,
  },
  rowCompact: { gap: Spacing.md },
  rowMobile: { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.md },

  copyColumn: { flex: 1, minWidth: 0, gap: Spacing.sm },
  copyColumnWithMascot: { paddingRight: 190 },

  kickerPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,29,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  kickerPillDark: { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.30)', borderWidth: 1 },
  kickerText: { color: Brand.purpleDeep, fontSize: 11, lineHeight: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  kickerTextDark: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(12,7,20,0.26)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  title: { color: Brand.ink, fontSize: 44, lineHeight: 50, fontWeight: '900', letterSpacing: -0.5 },
  titleDark: {
    color: '#FFFFFF',
    letterSpacing: 0,
    textShadowColor: 'rgba(12,7,20,0.34)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  titleTablet: { fontSize: 38, lineHeight: 44 },
  titleMobile: { fontSize: 30, lineHeight: 35 },
  titleAccent: { color: Brand.cream },

  body: { color: Brand.inkSoft, fontSize: 15, lineHeight: 22, fontWeight: '700', maxWidth: 560 },
  bodyDark: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    textShadowColor: 'rgba(12,7,20,0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 7,
  },

  childrenWrap: { marginTop: Spacing.sm },

  outerWrap: {
    position: 'relative',
  },
  mascotAbsolute: {
    position: 'absolute',
    right: 0,
    bottom: -16,
    width: 210,
    height: 260,
    zIndex: 10,
    pointerEvents: 'none',
  },
  mascotAbsoluteMobile: {
    width: 130,
    height: 160,
    right: 0,
    bottom: -8,
  },
  avatarImg: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: 'rgba(255,255,255,0.95)' },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Brand.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  avatarInitialsText: { color: Brand.purpleDeep, fontSize: 40, fontWeight: '900' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Brand.purple,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
