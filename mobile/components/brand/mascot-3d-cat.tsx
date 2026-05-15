import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

const logoSource = require('@/assets/images/vys-logo-mark.png');

type Mood = 'idle' | 'wave' | 'cheer' | 'wink';
type Stage = 'hero' | 'chip' | 'sticker' | 'inline';

type Props = {
  size?: number;
  mood?: Mood;
  stage?: Stage;
  glow?: boolean;
  shadow?: boolean;
  intro?: boolean;
  /** @deprecated use stage="chip" instead */
  compact?: boolean;
  style?: ViewStyle;
};

/**
 * Brand mascot — animated cat silhouette built around the TeamVYS logo.
 * Adds depth via stacked highlight + shadow layers, halo glow, ground shadow,
 * and pseudo-3D bob/turn/breath animations.
 */
export function Mascot3DCat({
  size = 280,
  mood = 'idle',
  stage,
  glow = true,
  shadow = true,
  intro = true,
  compact,
  style,
}: Props) {
  const resolvedStage: Stage = stage ?? (compact ? 'chip' : 'hero');
  const bob = useSharedValue(0);
  const turnY = useSharedValue(0);
  const turnZ = useSharedValue(0);
  const breath = useSharedValue(1);
  const wave = useSharedValue(0);
  const haloPulse = useSharedValue(0.7);
  const introScale = useSharedValue(intro ? 0.7 : 1);
  const introOpacity = useSharedValue(intro ? 0 : 1);

  useEffect(() => {
    if (intro) {
      introScale.value = withSpring(1, { damping: 12, stiffness: 110, mass: 0.7 });
      introOpacity.value = withTiming(1, { duration: 520 });
    }

    bob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    turnY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(7, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      true,
    );

    turnZ.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(1.5, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      true,
    );

    breath.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.985, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    haloPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.55, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    if (mood === 'wave' || mood === 'cheer') {
      wave.value = withDelay(
        intro ? 600 : 0,
        withRepeat(
          withSequence(
            withTiming(-12, { duration: 520, easing: Easing.inOut(Easing.cubic) }),
            withTiming(12, { duration: 520, easing: Easing.inOut(Easing.cubic) }),
          ),
          -1,
          true,
        ),
      );
    } else {
      wave.value = withTiming(0, { duration: 280 });
    }
  }, [bob, breath, haloPulse, intro, introOpacity, introScale, mood, turnY, turnZ, wave]);

  const catStyle = useAnimatedStyle(() => ({
    opacity: introOpacity.value,
    transform: [
      { perspective: 900 },
      { translateY: bob.value },
      { rotateY: `${turnY.value}deg` },
      { rotateZ: `${turnZ.value}deg` },
      { scale: introScale.value * breath.value },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloPulse.value,
    transform: [{ scale: 0.9 + haloPulse.value * 0.18 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - bob.value * 0.012 }],
    opacity: 0.55 - bob.value * 0.018,
  }));

  const bobBgStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value * 0.45 },
      { rotateZ: `${turnZ.value * 0.6}deg` },
    ],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${wave.value}deg` },
      { translateY: mood === 'cheer' ? bob.value * 0.4 : 0 },
    ],
  }));

  // sizing per stage
  const haloMultiplier = resolvedStage === 'hero' ? 1.32 : resolvedStage === 'sticker' ? 1.0 : 1.15;
  const groundWidth = size * (resolvedStage === 'hero' ? 0.8 : 0.62);
  const groundHeight = size * (resolvedStage === 'hero' ? 0.11 : 0.08);
  const stageHeight = size * (resolvedStage === 'inline' ? 0.96 : 1.05);
  const showGlow = glow && resolvedStage !== 'inline';
  const showShadow = shadow && resolvedStage !== 'inline';

  return (
    <View style={[styles.stage, { width: size, height: stageHeight }, style]} pointerEvents="none">
      {showGlow ? (
        <Animated.View
          style={[
            styles.haloWrap,
            { width: size * haloMultiplier, height: size * haloMultiplier },
            haloStyle,
          ]}
          pointerEvents="none"
        >
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="mascotHalo" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#EF3B9A" stopOpacity="0.42" />
                <Stop offset="0.45" stopColor="#9B2CFF" stopOpacity="0.32" />
                <Stop offset="1" stopColor="#9B2CFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill="url(#mascotHalo)" />
          </Svg>
        </Animated.View>
      ) : null}

      {showShadow ? (
        <Animated.View
          style={[
            styles.groundShadow,
            { width: groundWidth, height: groundHeight, bottom: resolvedStage === 'hero' ? size * 0.04 : size * 0.02 },
            shadowStyle,
          ]}
          pointerEvents="none"
        >
          <Svg width="100%" height="100%" viewBox="0 0 100 22">
            <Defs>
              <RadialGradient id="mascotGround" cx="50" cy="11" rx="50" ry="11" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#1A1326" stopOpacity="0.32" />
                <Stop offset="1" stopColor="#1A1326" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx="50" cy="11" rx="50" ry="11" fill="url(#mascotGround)" />
          </Svg>
        </Animated.View>
      ) : null}

      {/* depth/back glow that mirrors the cat slightly behind for parallax */}
      <Animated.View
        style={[
          styles.depthLayer,
          { width: size, height: size },
          bobBgStyle,
        ]}
        pointerEvents="none"
      >
        <Image
          source={logoSource}
          style={[styles.depthImage, { width: size * 0.96, height: size * 0.96 }]}
          contentFit="contain"
          tintColor="#9B2CFF"
        />
      </Animated.View>

      <Animated.View style={[styles.cat, { width: size, height: size }, catStyle]}>
        {/* main cat silhouette */}
        <Image
          source={logoSource}
          style={{ width: size, height: size }}
          contentFit="contain"
          accessibilityLabel="TeamVYS maskot"
        />

        {/* rim/highlight pass */}
        <Image
          source={logoSource}
          style={[
            StyleSheet.absoluteFillObject,
            {
              width: size,
              height: size,
              opacity: 0.32,
              transform: [{ translateX: -size * 0.012 }, { translateY: -size * 0.012 }],
            },
          ]}
          contentFit="contain"
          tintColor="#FFFFFF"
        />

        {/* eyes overlay (pointer-events none, scaled to silhouette head) */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.eyesLayer]}>
          <CatEyes size={size} mood={mood} />
        </View>

        {/* waving paw */}
        {(mood === 'wave' || mood === 'cheer') ? (
          <Animated.View
            style={[
              styles.paw,
              {
                width: size * 0.18,
                height: size * 0.18,
                right: size * 0.04,
                top: size * 0.36,
              },
              waveStyle,
            ]}
            pointerEvents="none"
          >
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="pawGlow" cx="40" cy="35" r="60" gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor="#FFB21A" />
                  <Stop offset="0.55" stopColor="#EF3B9A" />
                  <Stop offset="1" stopColor="#9B2CFF" />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="55" r="34" fill="url(#pawGlow)" />
              <Circle cx="36" cy="44" r="9" fill="url(#pawGlow)" />
              <Circle cx="52" cy="36" r="9" fill="url(#pawGlow)" />
              <Circle cx="68" cy="44" r="9" fill="url(#pawGlow)" />
              <Circle cx="46" cy="56" r="4" fill="#FFFFFF" opacity="0.6" />
              <Circle cx="58" cy="50" r="3" fill="#FFFFFF" opacity="0.6" />
            </Svg>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

function CatEyes({ size, mood }: { size: number; mood: Mood }) {
  const blink = useSharedValue(1);
  const wink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withDelay(2400, withTiming(0.06, { duration: 90 })),
        withTiming(1, { duration: 110 }),
        withDelay(900, withTiming(0.06, { duration: 90 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
      false,
    );

    if (mood === 'wink') {
      wink.value = withRepeat(
        withSequence(
          withDelay(1500, withTiming(0.08, { duration: 120 })),
          withTiming(1, { duration: 200 }),
        ),
        -1,
        false,
      );
    }
  }, [blink, mood, wink]);

  const leftStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: mood === 'wink' ? wink.value : blink.value }] }));
  const rightStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  // eyes positioned over the head of the silhouette
  // logo head is roughly centered horizontally, eyes around y ≈ 41-46% of canvas
  const eyeY = size * 0.405;
  const eyeOffsetX = size * 0.12;
  const eyeW = size * 0.058;
  const eyeH = size * 0.088;
  const center = size / 2;

  return (
    <>
      <Animated.View
        style={[
          styles.eye,
          {
            left: center - eyeOffsetX - eyeW / 2,
            top: eyeY - eyeH / 2,
            width: eyeW,
            height: eyeH,
          },
          leftStyle,
        ]}
      >
        <View style={styles.eyeBall} />
        <View style={styles.eyeShine} />
      </Animated.View>
      <Animated.View
        style={[
          styles.eye,
          {
            left: center + eyeOffsetX - eyeW / 2,
            top: eyeY - eyeH / 2,
            width: eyeW,
            height: eyeH,
          },
          rightStyle,
        ]}
      >
        <View style={styles.eyeBall} />
        <View style={styles.eyeShine} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundShadow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  depthLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.22,
  },
  depthImage: {
    transform: [{ translateY: 8 }, { translateX: 6 }],
  },
  cat: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  eyesLayer: { alignItems: 'center', justifyContent: 'center' },
  eye: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  eyeBall: {
    width: '78%',
    height: '78%',
    borderRadius: 999,
    backgroundColor: '#0B0612',
  },
  eyeShine: {
    position: 'absolute',
    top: '14%',
    left: '20%',
    width: '32%',
    height: '32%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
  },
  paw: {
    position: 'absolute',
    zIndex: 4,
    transformOrigin: '30% 70%',
  },
});
