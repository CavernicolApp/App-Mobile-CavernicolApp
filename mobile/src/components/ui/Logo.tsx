// src/components/ui/Logo.tsx — Logotipo CavernicolApp con "C" gradient + "CavernicolApp"
import { View, Image } from 'react-native';
import { Txt } from './Text';

// PNG del isotipo real (extraído del design Stitch)
const LOGO_MARK = require('../../../assets/logo-hero.png');

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onlyMark?: boolean;   // solo el símbolo "C"
  hideText?: boolean;
}

const markSize: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 24, md: 32, lg: 48, xl: 96,
};

const textVariant: Record<NonNullable<LogoProps['size']>, 'small' | 'body' | 'heading' | 'title'> = {
  sm: 'small', md: 'body', lg: 'heading', xl: 'title',
};

export function Logo({ size = 'md', onlyMark, hideText }: LogoProps) {
  const s = markSize[size];
  return (
    <View className="flex-row items-center gap-2">
      <Image source={LOGO_MARK} style={{ width: s, height: s }} resizeMode="contain" />
      {!onlyMark && !hideText ? (
        <View className="flex-row">
          <Txt variant={textVariant[size]} weight="bold" tone="inverse" font="heading">
            Cavernicol
          </Txt>
          <Txt variant={textVariant[size]} weight="bold" tone="magenta" font="heading">
            App
          </Txt>
        </View>
      ) : null}
    </View>
  );
}
