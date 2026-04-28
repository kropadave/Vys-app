/**
 * CatMascot — ikonická kočka pro Vys-app.
 * Inspirováno logem: silueta hlavy s ušima + ocas, fialovo-růžovo-oranžový gradient.
 *
 * - <CatMascot size={120} />            statická SVG verze
 * - <AnimatedCatMascot size={120} />    s lehkým kýváním, mrskáním ocasu a mrkáním
 * - <CatLogo size={48} />               kompaktní verze do avataru / hlavičky
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

const GRAD_ID = 'vys-cat-grad';

/* --------- shared shape helpers --------- */

function HeadAndPendant() {
  return (
    <>
      {/* uši + hlava jako jeden svazek - vykreslíme je samostatně,
          aby tělo mělo plynulou siluetu jako v logu */}
      <Path
        // levé ucho
        d="M82 30 L96 60 L120 70 Z"
        fill={`url(#${GRAD_ID})`}
      />
      <Path
        // pravé ucho
        d="M178 30 L164 60 L140 70 Z"
        fill={`url(#${GRAD_ID})`}
      />
      {/* hlava */}
      <Ellipse cx="130" cy="120" rx="60" ry="60" fill={`url(#${GRAD_ID})`} />
      {/* "krk" / spodní napojení k pendantu */}
      <Path
        d="M118 168 L142 168 L138 184 L122 184 Z"
        fill={`url(#${GRAD_ID})`}
      />
      {/* pendant (trojúhelník dolů) */}
      <Path
        d="M110 184 L150 184 L130 224 Z"
        fill={`url(#${GRAD_ID})`}
      />
    </>
  );
}

function CatFace({ blink = 0 }: { blink?: number }) {
  // blink 0..1 — 1 = zavřená oka. Zmenšujeme výšku elips.
  const ry = 5 * (1 - blink) + 0.5;
  return (
    <>
      {/* oči */}
      <Ellipse cx="112" cy="118" rx="5" ry={ry} fill="#241B3A" />
      <Ellipse cx="148" cy="118" rx="5" ry={ry} fill="#241B3A" />
      {/* drobounký highlight pro 3D pocit */}
      <Ellipse cx="113" cy="116" rx="1.6" ry={Math.max(0.3, ry - 2)} fill="#FFFFFF" opacity={0.9} />
      <Ellipse cx="149" cy="116" rx="1.6" ry={Math.max(0.3, ry - 2)} fill="#FFFFFF" opacity={0.9} />
      {/* nosík */}
      <Path d="M126 132 L134 132 L130 138 Z" fill="#3B0A2F" opacity={0.55} />
      {/* tvářičky */}
      <Ellipse cx="100" cy="138" rx="6" ry="4" fill="#FFE0B0" opacity={0.55} />
      <Ellipse cx="160" cy="138" rx="6" ry="4" fill="#FFE0B0" opacity={0.55} />
    </>
  );
}

function TailShape() {
  // ocas vykreslený jako vyplněná křivka, vychází z pravé spodní strany hlavy
  return (
    <Path
      d="M186 150
         C 220 150 230 175 220 198
         C 212 218 188 222 184 244
         C 200 252 222 246 232 232
         C 250 208 246 174 226 152
         C 218 144 204 140 192 142 Z"
      fill={`url(#${GRAD_ID})`}
    />
  );
}

function GradientDefs() {
  return (
    <Defs>
      <LinearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#A732FF" />
        <Stop offset="0.45" stopColor="#FF3DA1" />
        <Stop offset="0.85" stopColor="#FF8A2A" />
        <Stop offset="1" stopColor="#FFD24A" />
      </LinearGradient>
    </Defs>
  );
}

/* --------- statická verze (logo) --------- */

export function CatMascot({ size = 140, withFace = true }: { size?: number; withFace?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 260 260">
      <GradientDefs />
      {/* drobný spodní stín */}
      <Ellipse cx="150" cy="246" rx="60" ry="6" fill="#241B3A" opacity={0.18} />
      <TailShape />
      <HeadAndPendant />
      {withFace && <CatFace />}
    </Svg>
  );
}

/** Verze přesně podle loga – bez očí, čistá silueta. */
export function CatLogo({ size = 64 }: { size?: number }) {
  return <CatMascot size={size} withFace={false} />;
}

/* --------- animovaná verze --------- */

const AView = Animated.createAnimatedComponent(View);

export function AnimatedCatMascot({ size = 160 }: { size?: number }) {
  // sway = jemné kývání hlavy doleva/doprava
  const sway = useSharedValue(0);
  // breathe = nadechnutí (scale 1 → 1.03)
  const breathe = useSharedValue(0);
  // tail = mrskání ocasu (vlastní rotace překryvného layeru s ocasem)
  const tail = useSharedValue(0);
  // blink = 0 normální, 1 zavřené oči (pro budoucí použití pokud rozdělíme)
  const blink = useSharedValue(0);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    tail.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    // mrknutí každých ~3.5s
    blink.value = withRepeat(
      withDelay(
        2500,
        withSequence(
          withTiming(1, { duration: 90, easing: Easing.linear }),
          withTiming(0, { duration: 120, easing: Easing.linear }),
          withTiming(0, { duration: 1200, easing: Easing.linear }),
        ),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(sway);
      cancelAnimation(breathe);
      cancelAnimation(tail);
      cancelAnimation(blink);
    };
  }, [sway, breathe, tail, blink]);

  const bodyStyle = useAnimatedStyle(() => {
    const rotate = interpolate(sway.value, [-1, 1], [-4, 4]);
    const scale = interpolate(breathe.value, [0, 1], [1, 1.035]);
    return {
      transform: [{ rotate: `${rotate}deg` }, { scale }],
    };
  });

  const tailStyle = useAnimatedStyle(() => {
    const rotate = interpolate(tail.value, [-1, 1], [-12, 16]);
    return {
      transform: [
        // pivot na napojení ocasu k hlavě
        { translateX: -size * 0.05 },
        { translateY: size * 0.05 },
        { rotate: `${rotate}deg` },
        { translateX: size * 0.05 },
        { translateY: -size * 0.05 },
      ],
    };
  });

  const blinkStyle = useAnimatedStyle(() => {
    return { opacity: 1, transform: [{ scaleY: 1 - blink.value * 0.95 }] };
  });

  return (
    <AView style={[styles.wrap, { width: size, height: size }, bodyStyle]}>
      {/* statický stín pod kočkou */}
      <View style={[StyleSheet.absoluteFill]}>
        <Svg width={size} height={size} viewBox="0 0 260 260">
          <Ellipse cx="150" cy="246" rx="60" ry="6" fill="#241B3A" opacity={0.18} />
        </Svg>
      </View>

      {/* tělo + hlava */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={size} height={size} viewBox="0 0 260 260">
          <GradientDefs />
          <HeadAndPendant />
        </Svg>
      </View>

      {/* ocas s vlastní rotací */}
      <AView style={[StyleSheet.absoluteFill, tailStyle]}>
        <Svg width={size} height={size} viewBox="0 0 260 260">
          <GradientDefs />
          <TailShape />
        </Svg>
      </AView>

      {/* obličej (mrká) */}
      <AView style={[StyleSheet.absoluteFill, blinkStyle]}>
        <Svg width={size} height={size} viewBox="0 0 260 260">
          <CatFace />
        </Svg>
      </AView>
    </AView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
