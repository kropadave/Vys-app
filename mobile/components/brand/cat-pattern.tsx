import Svg, { Defs, G, Path, Pattern, Rect } from 'react-native-svg';

type Props = {
  width?: number | string;
  height?: number | string;
  color?: string;
  opacity?: number;
};

const PATTERN_ID = 'teamvys-cat-pattern';

// Repeating decorative cat silhouette tile.
export function CatPattern({ width = '100%', height = '100%', color = '#FFFFFF', opacity = 0.06 }: Props) {
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <Pattern id={PATTERN_ID} patternUnits="userSpaceOnUse" width={140} height={140}>
          <G fill={color} fillOpacity={opacity}>
            <Path d="M20 30 L34 50 Q44 46 54 50 L68 30 L65 60 Q74 65 73 78 Q72 95 44 96 Q16 95 15 78 Q14 65 23 60 Z" />
            <Path d="M70 60 Q86 54 86 74 Q86 90 72 90 Q82 82 76 76 Q68 74 68 68 Z" />
            <Path d="M84 110 L104 110 Q120 110 120 90 Q120 78 110 76 L100 76" stroke={color} strokeOpacity={opacity * 1.2} strokeWidth={2} fill="none" />
          </G>
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${PATTERN_ID})`} />
    </Svg>
  );
}
