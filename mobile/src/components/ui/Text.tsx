// src/components/ui/Text.tsx — Typography primitives cyberpunk
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

interface TextProps extends RNTextProps {
  variant?: 'display' | 'title' | 'heading' | 'body' | 'small' | 'caption' | 'label';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  tone?: 'default' | 'muted' | 'brand' | 'flame' | 'magenta' | 'amber' | 'success' | 'warning' | 'danger' | 'inverse';
  font?: 'sans' | 'heading' | 'label';
}

const variantClass: Record<NonNullable<TextProps['variant']>, string> = {
  display: 'text-3xl leading-9 tracking-tight',    // Sora
  title: 'text-2xl leading-8 tracking-tight',      // Sora
  heading: 'text-lg leading-6',                     // Sora
  body: 'text-base leading-6',                      // Inter
  small: 'text-sm leading-5',                       // Inter
  caption: 'text-xs leading-4',                     // Inter
  label: 'text-xs leading-4 uppercase tracking-widest', // Geist
};

const weightClass: Record<NonNullable<TextProps['weight']>, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const toneClass: Record<NonNullable<TextProps['tone']>, string> = {
  default: 'text-white',
  muted: 'text-[#A0A0A0]',
  brand: 'text-magenta',
  flame: 'text-flame',
  magenta: 'text-magenta',
  amber: 'text-amber',
  success: 'text-state-success',
  warning: 'text-amber',
  danger: 'text-flame',
  inverse: 'text-white',
};

// Font family via style prop (nativewind no soporta font-family con strings dinámicos siempre)
const fontFamily: Record<NonNullable<TextProps['font']>, Record<string, string>> = {
  sans:    { regular: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold' },
  heading: { regular: 'Sora_600SemiBold', medium: 'Sora_600SemiBold', semibold: 'Sora_600SemiBold', bold: 'Sora_700Bold' },
  label:   { regular: 'Geist_500Medium', medium: 'Geist_500Medium', semibold: 'Geist_500Medium', bold: 'Geist_500Medium' },
};

export function Txt({ variant = 'body', weight = 'regular', tone = 'default', font, className, style, ...props }: TextProps & { className?: string }) {
  // Selección automática de fuente por variant si no se pasa font
  const autoFont: NonNullable<TextProps['font']> =
    font ?? (variant === 'display' || variant === 'title' || variant === 'heading' ? 'heading'
      : variant === 'label' ? 'label'
      : 'sans');

  const family = fontFamily[autoFont][weight];

  return (
    <RNText
      {...props}
      style={[{ fontFamily: family }, style]}
      className={`${variantClass[variant]} ${weightClass[weight]} ${toneClass[tone]} ${className ?? ''}`}
    />
  );
}
