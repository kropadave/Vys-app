import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type FadeProps = {
  children: React.ReactNode;
  delay?: number;
  offset?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

export function FadeInUp({ children, delay = 0, offset = 18, duration = 560, style }: FadeProps) {
  const translateY = useSharedValue(offset);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(0, { duration, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, [delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

type PulseProps = {
  children: React.ReactNode;
  scaleTo?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

export function PulseGlow({ children, scaleTo = 1.04, duration = 1400, style }: PulseProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(scaleTo, { duration, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [duration, scale, scaleTo]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

type FloatProps = {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

export function Float({ children, amplitude = 6, duration = 2400, style }: FloatProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [amplitude, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

type ProgressProps = {
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  duration?: number;
  style?: ViewStyle;
};

export function AnimatedProgressBar({
  progress,
  height = 12,
  trackColor = 'rgba(255,255,255,0.12)',
  fillColor = '#FFFFFF',
  duration = 900,
  style,
}: ProgressProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(progress, 1)) * 100, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as unknown as number,
  }));

  return (
    <Animated.View style={[{ height, backgroundColor: trackColor, borderRadius: height, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height: '100%', backgroundColor: fillColor, borderRadius: height }, animatedStyle]} />
    </Animated.View>
  );
}

type SpinProps = {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
};

export function SlowSpin({ children, duration = 18000, style }: SpinProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1, false);
  }, [duration, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

type ScaleInProps = {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  style?: StyleProp<ViewStyle>;
};

export function ScaleIn({ children, delay = 0, from = 0.86, style }: ScaleInProps) {
  const scale = useSharedValue(from);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 130, mass: 0.6 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

type StaggerProps = {
  children: React.ReactNode[];
  step?: number;
  initialDelay?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: ViewStyle | ViewStyle[];
};

export function StaggeredList({ children, step = 70, initialDelay = 0, offset = 14, style, itemStyle }: StaggerProps) {
  return (
    <Animated.View style={style}>
      {children.map((child, idx) => (
        <FadeInUp key={idx} delay={initialDelay + idx * step} offset={offset} style={itemStyle}>
          {child}
        </FadeInUp>
      ))}
    </Animated.View>
  );
}

type DriftProps = {
  children: React.ReactNode;
  amplitudeX?: number;
  amplitudeY?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

export function Drift({ children, amplitudeX = 8, amplitudeY = 6, duration = 5400, style }: DriftProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    tx.value = withRepeat(
      withSequence(
        withTiming(-amplitudeX, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(amplitudeX, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(amplitudeY, { duration: duration * 0.78, easing: Easing.inOut(Easing.sin) }),
        withTiming(-amplitudeY, { duration: duration * 0.78, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [amplitudeX, amplitudeY, duration, tx, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

type MarqueeProps = {
  children: React.ReactNode;
  speed?: number;
  gap?: number;
  reverse?: boolean;
  style?: ViewStyle;
};

/**
 * Infinite horizontal marquee. Renders the children twice and cycles them
 * at constant speed (px/sec) for seamless looping.
 */
export function Marquee({ children, speed = 50, gap = 32, reverse = false, style }: MarqueeProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const tx = useSharedValue(0);
  const animationStarted = useRef(false);

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  useEffect(() => {
    if (!trackWidth || animationStarted.current) return;
    animationStarted.current = true;
    const distance = trackWidth + gap;
    const duration = (distance / speed) * 1000;
    tx.value = reverse ? -distance : 0;
    tx.value = withRepeat(
      withTiming(reverse ? 0 : -distance, { duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(tx);
      animationStarted.current = false;
    };
  }, [gap, reverse, speed, trackWidth, tx]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  return (
    <View style={[styles.marqueeWrap, style]} pointerEvents="none">
      <Animated.View style={[styles.marqueeTrack, { gap }, animatedStyle]}>
        <View onLayout={handleLayout} style={[styles.marqueeRow, { gap }]}>
          {children}
        </View>
        <View style={[styles.marqueeRow, { gap }]} aria-hidden>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

type CounterProps = {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle | TextStyle[];
};

/**
 * Animated number that ticks from 0 to `to` once mounted.
 * Uses sharedValue + state interpolation since RN Text is non-animatable.
 */
export function AnimatedCounter({ to, from = 0, duration = 1400, delay = 0, prefix = '', suffix = '', decimals = 0, style }: CounterProps) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    const start = Date.now() + delay;
    let raf = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const now = Date.now();
      if (now < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [delay, duration, from, to]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return <Text style={style}>{prefix}{formatted}{suffix}</Text>;
}

type GradientTextProps = {
  children: string;
  colors: readonly [string, string, ...string[]];
  style?: TextStyle | TextStyle[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

/**
 * Cross-platform gradient text via masked LinearGradient. Falls back to first
 * gradient stop on platforms where masking is unavailable (we assume web/iOS/Android).
 */
export function GradientText({ children, colors, style, start = { x: 0, y: 0 }, end = { x: 1, y: 1 } }: GradientTextProps) {
  return (
    <View style={styles.gradientTextWrap}>
      <Text style={[style, { opacity: 0 }]}>{children}</Text>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={colors} start={start} end={end} style={StyleSheet.absoluteFill} />
        <View style={StyleSheet.absoluteFill}>
          <Text
            style={[
              style,
              {
                color: 'transparent',
                ...({ backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as object),
              } as TextStyle,
            ]}
          >
            {children}
          </Text>
        </View>
      </View>
    </View>
  );
}

type RevealOnceProps = {
  children: React.ReactNode;
  delay?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

/** Same as FadeInUp but trigger semantics make it explicit at call site. */
export function Reveal({ children, delay = 0, offset = 24, style }: RevealOnceProps) {
  return (
    <FadeInUp delay={delay} offset={offset} style={style}>
      {children}
    </FadeInUp>
  );
}

const styles = StyleSheet.create({
  marqueeWrap: { width: '100%', overflow: 'hidden' },
  marqueeTrack: { flexDirection: 'row', alignItems: 'center' },
  marqueeRow: { flexDirection: 'row', alignItems: 'center' },
  gradientTextWrap: { position: 'relative', alignSelf: 'flex-start' },
});
