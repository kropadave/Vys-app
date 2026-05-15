import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

type BlobProps = {
  size?: number;
  color?: string;
  secondColor?: string;
  opacity?: number;
  style?: ViewStyle | ViewStyle[];
};

const BLOB_PATHS = [
  'M50 5C72 5 95 22 95 50C95 78 78 95 50 95C25 95 5 78 5 52C5 27 25 5 50 5Z',
  'M52 8C78 12 95 28 95 52C95 78 70 96 48 94C24 92 4 74 4 50C4 26 28 5 52 8Z',
  'M50 6C76 6 94 28 94 52C94 76 75 94 52 94C26 94 6 75 6 50C6 25 25 6 50 6Z',
  'M48 8C74 4 96 28 92 52C88 78 64 94 42 92C18 90 6 70 8 46C10 24 26 12 48 8Z',
];

export function BlobShape({ size = 220, color = '#9B2CFF', secondColor, opacity = 0.18, style }: BlobProps) {
  const idx = Math.abs(Math.round(size)) % BLOB_PATHS.length;
  const gradientId = `blob-${color.replace(/[^a-z0-9]/gi, '')}-${idx}`;

  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={gradientId} cx="38" cy="35" r="60" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={secondColor ?? color} stopOpacity={opacity * 1.4} />
            <Stop offset="1" stopColor={color} stopOpacity={opacity * 0.6} />
          </RadialGradient>
        </Defs>
        <Path d={BLOB_PATHS[idx]} fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

type SparkleProps = {
  size?: number;
  color?: string;
  style?: ViewStyle | ViewStyle[];
};

export function Sparkle({ size = 40, color = '#FFB21A', style }: SparkleProps) {
  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Path
          d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

type DottedRingProps = {
  size?: number;
  color?: string;
  opacity?: number;
  style?: ViewStyle | ViewStyle[];
};

export function DottedRing({ size = 160, color = '#9B2CFF', opacity = 0.6, style }: DottedRingProps) {
  const dots = 22;
  const radius = (size - 12) / 2;
  const center = size / 2;
  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size}>
        <G>
          {Array.from({ length: dots }).map((_, i) => {
            const angle = (i / dots) * Math.PI * 2;
            const cx = center + Math.cos(angle) * radius;
            const cy = center + Math.sin(angle) * radius;
            return <Circle key={i} cx={cx} cy={cy} r={3} fill={color} fillOpacity={opacity} />;
          })}
        </G>
      </Svg>
    </View>
  );
}

type SquiggleProps = {
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle | ViewStyle[];
};

export function Squiggle({ width = 200, height = 30, color = '#EF3B9A', strokeWidth = 5, style }: SquiggleProps) {
  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={`M5 ${height / 2} Q${width * 0.2} 0, ${width * 0.4} ${height / 2} T${width * 0.8} ${height / 2} T${width - 5} ${height / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

type RibbonProps = {
  width?: number;
  height?: number;
  color?: string;
  style?: ViewStyle | ViewStyle[];
};

export function Ribbon({ width = 220, height = 80, color = '#9B2CFF', style }: RibbonProps) {
  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={`M0 ${height * 0.5} Q${width * 0.25} ${height * 0.05}, ${width * 0.5} ${height * 0.5} T${width} ${height * 0.5}`}
          fill="none"
          stroke={color}
          strokeWidth={Math.max(height * 0.55, 14)}
          strokeLinecap="round"
          opacity={0.18}
        />
      </Svg>
    </View>
  );
}

type FloatingShapeProps = {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  delay?: number;
  rotate?: number;
  style?: ViewStyle | ViewStyle[];
};

export function FloatingShape({ children, amplitude = 10, duration = 3200, delay = 0, rotate = 0, style }: FloatingShapeProps) {
  const translate = useSharedValue(0);
  useEffect(() => {
    translate.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    if (delay) {
      translate.value = withTiming(0, { duration: delay });
    }
  }, [amplitude, delay, duration, translate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }, { rotate: `${rotate}deg` }],
  }));

  return <Animated.View style={[StyleSheet.flatten(style), animatedStyle]}>{children}</Animated.View>;
}

type SpotlightProps = {
  color?: string;
  size?: number;
  opacity?: number;
  style?: ViewStyle | ViewStyle[];
};

export function Spotlight({ color = '#9B2CFF', size = 320, opacity = 0.22, style }: SpotlightProps) {
  const id = `spot-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={id} cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
