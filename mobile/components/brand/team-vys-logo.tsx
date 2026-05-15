import { Image } from 'expo-image';
import { View, type ViewStyle } from 'react-native';

const source = require('@/assets/images/vys-logo-mark.png');

type Props = {
  size?: number;
  style?: ViewStyle;
};

export function TeamVysLogo({ size = 56, style }: Props) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="TeamVYS logo"
      />
    </View>
  );
}
