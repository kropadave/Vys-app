/**
 * 3D-styled SVG icon set for Vys-app.
 * Style: rounded shapes, soft purple/yellow gradients, light highlight on top,
 * subtle drop shadow created via offset darker shape — vibe podobný kreslené 3D ikonky.
 *
 * Použití:
 *   <BoltIcon size={28} />
 *   <BellIcon size={24} />
 */
import React from 'react';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    LinearGradient,
    Path,
    RadialGradient,
    Rect,
    Stop
} from 'react-native-svg';
import { CatMascot as _Cat } from './CatMascot';

export type IconProps = {
  size?: number;
  /** Hlavní tón. Pokud není, použije se vlastní paleta ikony. */
  tint?: string;
};

/* ------------ helpers ------------ */

const id = (name: string) => `vys-${name}`;

/* ============ ICONS ============ */

/** Blesk = XP */
export function BoltIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('bolt')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="0.55" stopColor="#FFC857" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      {/* spodní stín */}
      <Path
        d="M36 4 L14 36 H28 L24 60 L50 26 H36 Z"
        translateY={2}
        fill="#B8860B"
        opacity={0.35}
      />
      <Path
        d="M36 4 L14 36 H28 L24 60 L50 26 H36 Z"
        fill={`url(#${id('bolt')})`}
        stroke="#7C5800"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {/* highlight */}
      <Path d="M30 12 L20 32 H26" stroke="#FFF7DD" strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** Zvonek = notifikace */
export function BellIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('bell')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="32" cy="54" rx="9" ry="4" fill="#7C5800" opacity={0.25} />
      <Path
        d="M32 8 C20 8 16 18 16 28 C16 36 12 42 12 46 H52 C52 42 48 36 48 28 C48 18 44 8 32 8 Z"
        fill={`url(#${id('bell')})`}
        stroke="#7C5800"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M22 18 C24 14 28 12 31 12" stroke="#FFF7DD" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Circle cx="32" cy="54" r="4.5" fill="#7C5800" />
      <Circle cx="32" cy="6" r="3" fill="#7C5800" />
    </Svg>
  );
}

/** Terč */
export function TargetIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={id('tg')} cx="0.4" cy="0.35" r="0.7">
          <Stop offset="0" stopColor="#FFB6E1" />
          <Stop offset="1" stopColor="#7C5CFF" />
        </RadialGradient>
      </Defs>
      <Circle cx="32" cy="34" r="26" fill="#241B3A" opacity={0.2} />
      <Circle cx="32" cy="32" r="26" fill={`url(#${id('tg')})`} stroke="#3F2A99" strokeWidth={1.6} />
      <Circle cx="32" cy="32" r="18" fill="#FFFFFF" stroke="#3F2A99" strokeWidth={1.4} />
      <Circle cx="32" cy="32" r="11" fill="#FFC857" stroke="#3F2A99" strokeWidth={1.2} />
      <Circle cx="32" cy="32" r="5" fill="#E11D48" />
      <Circle cx="26" cy="24" r="3" fill="#FFFFFF" opacity={0.6} />
    </Svg>
  );
}

/** Přesýpací hodiny = rozpracováno */
export function HourglassIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('hg')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Rect x="14" y="6" width="36" height="6" rx="3" fill="#7C5CFF" />
      <Rect x="14" y="52" width="36" height="6" rx="3" fill="#7C5CFF" />
      <Path
        d="M18 12 H46 L34 30 L46 52 H18 L30 30 Z"
        fill={`url(#${id('hg')})`}
        stroke="#7C5800"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M22 16 H42 L33 28 H31 Z" fill="#FFF7DD" opacity={0.7} />
      <Circle cx="32" cy="34" r="2" fill="#7C5800" />
    </Svg>
  );
}

/** Fajfka v kruhu = zvládnuto */
export function CheckIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('chk')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9EE6C9" />
          <Stop offset="1" stopColor="#16A34A" />
        </LinearGradient>
      </Defs>
      <Circle cx="32" cy="34" r="26" fill="#0E5B2C" opacity={0.25} />
      <Circle cx="32" cy="32" r="26" fill={`url(#${id('chk')})`} stroke="#0E5B2C" strokeWidth={1.6} />
      <Path
        d="M20 33 L29 42 L46 24"
        stroke="#FFFFFF"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M14 22 C20 14 30 10 36 10" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.4} />
    </Svg>
  );
}

/** Visací zámek = zamčeno */
export function LockIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('lk')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CFC6E0" />
          <Stop offset="1" stopColor="#7B7290" />
        </LinearGradient>
        <LinearGradient id={id('lkb')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Path
        d="M22 28 V20 C22 12 26 8 32 8 C38 8 42 12 42 20 V28"
        stroke={`url(#${id('lk')})`}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="12" y="28" width="40" height="30" rx="8" fill="#5A4A2C" opacity={0.3} translateY={2} />
      <Rect x="12" y="28" width="40" height="30" rx="8" fill={`url(#${id('lkb')})`} stroke="#7C5800" strokeWidth={1.6} />
      <Circle cx="32" cy="42" r="4" fill="#7C5800" />
      <Path d="M32 42 V49" stroke="#7C5800" strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Dárek = odměna */
export function GiftIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('gf')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB6E1" />
          <Stop offset="1" stopColor="#E11D48" />
        </LinearGradient>
        <LinearGradient id={id('gfL')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Rect x="8" y="22" width="48" height="14" rx="3" fill={`url(#${id('gfL')})`} stroke="#7C5800" strokeWidth={1.4} />
      <Rect x="12" y="36" width="40" height="22" rx="3" fill={`url(#${id('gf')})`} stroke="#7A1531" strokeWidth={1.4} />
      <Rect x="28" y="22" width="8" height="36" fill={`url(#${id('gfL')})`} stroke="#7C5800" strokeWidth={1.4} />
      <Path
        d="M32 22 C24 22 18 18 18 12 C18 8 22 6 26 8 C30 10 32 18 32 22 Z"
        fill={`url(#${id('gf')})`}
        stroke="#7A1531"
        strokeWidth={1.4}
      />
      <Path
        d="M32 22 C40 22 46 18 46 12 C46 8 42 6 38 8 C34 10 32 18 32 22 Z"
        fill={`url(#${id('gf')})`}
        stroke="#7A1531"
        strokeWidth={1.4}
      />
    </Svg>
  );
}

/** Nákupní košík */
export function CartIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('ct')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B79BFF" />
          <Stop offset="1" stopColor="#6741E6" />
        </LinearGradient>
      </Defs>
      <Path d="M6 10 H14 L20 40 H50 L56 18 H18" stroke="#3F2A99" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 18 L52 18 L48 38 H22 Z" fill={`url(#${id('ct')})`} stroke="#3F2A99" strokeWidth={1.4} />
      <Circle cx="24" cy="52" r="5" fill="#241B3A" />
      <Circle cx="46" cy="52" r="5" fill="#241B3A" />
      <Circle cx="24" cy="52" r="2" fill="#CFB9FF" />
      <Circle cx="46" cy="52" r="2" fill="#CFB9FF" />
    </Svg>
  );
}

/** Stan = tábor */
export function TentIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('tn')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9EE6C9" />
          <Stop offset="1" stopColor="#16A34A" />
        </LinearGradient>
      </Defs>
      <Path d="M6 54 L32 8 L58 54 Z" fill="#0E5B2C" opacity={0.3} translateY={2} />
      <Path d="M6 54 L32 8 L58 54 Z" fill={`url(#${id('tn')})`} stroke="#0E5B2C" strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M32 8 L24 54 L40 54 Z" fill="#241B3A" />
      <Path d="M32 14 L28 54" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.4} />
    </Svg>
  );
}

/** Parkour postavička / kroužek */
export function ParkourIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('pk')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B79BFF" />
          <Stop offset="1" stopColor="#6741E6" />
        </LinearGradient>
      </Defs>
      {/* hlava */}
      <Circle cx="22" cy="14" r="7" fill="#FFD9B5" stroke="#3F2A99" strokeWidth={1.4} />
      {/* tělo */}
      <Path
        d="M16 24 C24 22 32 22 36 28 L46 22 L48 28 L38 36 L40 44 L48 50 L44 54 L34 48 L26 54 L18 50 L22 42 L14 36 Z"
        fill={`url(#${id('pk')})`}
        stroke="#3F2A99"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx="20" cy="13" r="1.5" fill="#241B3A" />
    </Svg>
  );
}

/** Trofej */
export function TrophyIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('tr')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Path d="M14 6 H50 V20 C50 30 42 38 32 38 C22 38 14 30 14 20 Z" fill={`url(#${id('tr')})`} stroke="#7C5800" strokeWidth={1.6} />
      <Path d="M14 10 C8 10 4 14 6 22 C8 28 14 30 16 28" stroke="#7C5800" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M50 10 C56 10 60 14 58 22 C56 28 50 30 48 28" stroke="#7C5800" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Rect x="26" y="38" width="12" height="8" fill={`url(#${id('tr')})`} stroke="#7C5800" strokeWidth={1.4} />
      <Rect x="18" y="46" width="28" height="8" rx="2" fill="#7C5800" />
      <Path d="M22 12 H30 L26 22 Z" fill="#FFF7DD" opacity={0.5} />
    </Svg>
  );
}

/** Náramek = kulatý prstenec */
export function BraceletIcon({ size = 28, tint = '#7C5CFF' }: IconProps) {
  const grad = id(`br-${tint.replace('#', '')}`);
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={grad} cx="0.35" cy="0.35" r="0.7">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <Stop offset="0.4" stopColor={tint} />
          <Stop offset="1" stopColor="#241B3A" />
        </RadialGradient>
      </Defs>
      <Circle cx="32" cy="34" r="24" fill="#241B3A" opacity={0.25} />
      <Circle cx="32" cy="32" r="24" fill={`url(#${grad})`} />
      <Circle cx="32" cy="32" r="14" fill={Palette_BG} />
      <Ellipse cx="26" cy="22" rx="8" ry="4" fill="#FFFFFF" opacity={0.4} />
    </Svg>
  );
}

/** Hvězda */
export function StarIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('st')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Path
        d="M32 6 L40 24 L60 26 L45 40 L49 60 L32 50 L15 60 L19 40 L4 26 L24 24 Z"
        fill={`url(#${id('st')})`}
        stroke="#7C5800"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M28 14 L32 22 L40 23" stroke="#FFF7DD" strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** Maskot — ikonická kočka Vys (re-export z CatMascot, kvůli zpětné kompatibilitě). */
export { AnimatedCatMascot, CatLogo, CatMascot as MascotIcon } from './CatMascot';

/** Avatar tlačítko – malá verze maskota (kočky). */
export function AvatarIcon({ size = 36 }: { size?: number }) {
  return <_Cat size={size} withFace={false} />;
}

/** Plamen = streak */
export function FlameIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('fl')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="0.5" stopColor="#F59E0B" />
          <Stop offset="1" stopColor="#E11D48" />
        </LinearGradient>
      </Defs>
      <Path
        d="M32 4 C28 14 18 18 18 32 C18 46 26 58 32 58 C38 58 46 46 46 32 C46 24 40 22 38 26 C36 16 36 10 32 4 Z"
        fill={`url(#${id('fl')})`}
        stroke="#7A1531"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M32 30 C30 36 26 38 26 46 C26 52 30 56 32 56 C34 56 38 52 38 46 C38 40 34 38 32 30 Z"
        fill="#FFE08A"
      />
    </Svg>
  );
}

/** Medaile = odznak */
export function MedalIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={id('md')} cx="0.4" cy="0.4" r="0.7">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </RadialGradient>
      </Defs>
      <Path d="M22 4 L18 32 H46 L42 4 Z" fill="#7C5CFF" stroke="#3F2A99" strokeWidth={1.4} />
      <Path d="M22 4 L26 28 H38 L42 4 Z" fill="#B79BFF" />
      <Circle cx="32" cy="42" r="20" fill="#7C5800" opacity={0.3} translateY={2} />
      <Circle cx="32" cy="42" r="20" fill={`url(#${id('md')})`} stroke="#7C5800" strokeWidth={1.6} />
      <Circle cx="32" cy="42" r="13" fill="#FFF7DD" opacity={0.4} />
      <Path d="M32 34 L34 41 L41 41 L36 45 L38 52 L32 48 L26 52 L28 45 L23 41 L30 41 Z" fill="#7C5800" />
    </Svg>
  );
}

/** Špendlík mapy */
export function PinIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id('pin')} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB6E1" />
          <Stop offset="1" stopColor="#E11D48" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="32" cy="58" rx="8" ry="3" fill="#241B3A" opacity={0.3} />
      <Path d="M32 4 C20 4 12 12 12 24 C12 36 32 56 32 56 C32 56 52 36 52 24 C52 12 44 4 32 4 Z"
        fill={`url(#${id('pin')})`}
        stroke="#7A1531"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx="32" cy="22" r="7" fill="#FFFFFF" />
      <Circle cx="32" cy="22" r="3.5" fill="#7A1531" />
    </Svg>
  );
}

/** Mince = peníze */
export function CoinIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={id('co')} cx="0.4" cy="0.4" r="0.7">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="32" cy="36" rx="24" ry="22" fill="#7C5800" opacity={0.3} />
      <Circle cx="32" cy="32" r="24" fill={`url(#${id('co')})`} stroke="#7C5800" strokeWidth={1.6} />
      <Circle cx="32" cy="32" r="17" fill="none" stroke="#7C5800" strokeWidth={1.4} />
      <Path d="M28 22 V42 M36 22 V42 M24 28 H40 M24 36 H40" stroke="#7C5800" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Postavička dítě */
export function ChildIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="14" r="9" fill="#FFD9B5" stroke="#3F2A99" strokeWidth={1.4} />
      <Path d="M14 56 C14 40 22 32 32 32 C42 32 50 40 50 56 Z" fill="#7C5CFF" stroke="#3F2A99" strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx="29" cy="13" r="1.5" fill="#241B3A" />
      <Circle cx="35" cy="13" r="1.5" fill="#241B3A" />
    </Svg>
  );
}

/** Šipka vpravo (pro section akci) */
export function ArrowRightIcon({ size = 14, tint = '#6741E6' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12 H17 M12 7 L17 12 L12 17" stroke={tint} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/* ============ TAB ICONS ============ */

export function HomeTabIcon({ size = 26, tint = '#7C5CFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M8 30 L32 8 L56 30 V54 H40 V40 H24 V54 H8 Z" fill={tint} stroke="#241B3A" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M14 30 L32 14 L50 30" stroke="#FFFFFF" strokeWidth={1.6} fill="none" opacity={0.5} />
    </Svg>
  );
}
export function TricksTabIcon({ size = 26, tint = '#7C5CFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="14" r="7" fill={tint} stroke="#241B3A" strokeWidth={1.4} />
      <Path d="M22 50 L18 60 M42 50 L46 60 M32 24 L32 38 M32 38 L20 50 M32 38 L44 50 M22 30 L42 30" stroke={tint} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}
export function BraceletTabIcon({ size = 26, tint = '#7C5CFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="22" stroke={tint} strokeWidth={6} fill="none" />
      <Circle cx="14" cy="32" r="3" fill={tint} />
      <Circle cx="50" cy="32" r="3" fill={tint} />
      <Circle cx="32" cy="14" r="3" fill={tint} />
      <Circle cx="32" cy="50" r="3" fill={tint} />
    </Svg>
  );
}
export function MedalTabIcon({ size = 26, tint = '#7C5CFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M22 4 L26 22 H38 L42 4" stroke={tint} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Circle cx="32" cy="40" r="18" fill={tint} stroke="#241B3A" strokeWidth={1.4} />
      <Path d="M32 32 L34 38 L40 38 L35 42 L37 48 L32 45 L27 48 L29 42 L24 38 L30 38 Z" fill="#FFFFFF" />
    </Svg>
  );
}
export function ProfileTabIcon({ size = 26, tint = '#7C5CFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="22" r="11" fill={tint} stroke="#241B3A" strokeWidth={1.4} />
      <Path d="M10 56 C10 42 20 36 32 36 C44 36 54 42 54 56 Z" fill={tint} stroke="#241B3A" strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  );
}

/* ============ ICON KEY REGISTRY ============ */

export type IconKey =
  | 'bolt'
  | 'bell'
  | 'target'
  | 'hourglass'
  | 'check'
  | 'lock'
  | 'gift'
  | 'cart'
  | 'tent'
  | 'parkour'
  | 'trophy'
  | 'star'
  | 'flame'
  | 'medal'
  | 'pin'
  | 'coin'
  | 'child';

export function Icon({ name, size = 28, tint }: IconProps & { name: IconKey }) {
  switch (name) {
    case 'bolt': return <BoltIcon size={size} />;
    case 'bell': return <BellIcon size={size} />;
    case 'target': return <TargetIcon size={size} />;
    case 'hourglass': return <HourglassIcon size={size} />;
    case 'check': return <CheckIcon size={size} />;
    case 'lock': return <LockIcon size={size} />;
    case 'gift': return <GiftIcon size={size} />;
    case 'cart': return <CartIcon size={size} />;
    case 'tent': return <TentIcon size={size} />;
    case 'parkour': return <ParkourIcon size={size} />;
    case 'trophy': return <TrophyIcon size={size} />;
    case 'star': return <StarIcon size={size} />;
    case 'flame': return <FlameIcon size={size} />;
    case 'medal': return <MedalIcon size={size} />;
    case 'pin': return <PinIcon size={size} tint={tint} />;
    case 'coin': return <CoinIcon size={size} />;
    case 'child': return <ChildIcon size={size} />;
  }
}

const Palette_BG = '#F3EFFF';
