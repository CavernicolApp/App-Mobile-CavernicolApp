// src/components/ui/Button.tsx — Cyberpunk buttons con gradient
import { Pressable, ActivityIndicator, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Txt } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  testID?: string;
}

const sizePad: Record<Size, string> = {
  sm: 'px-4 py-2 rounded-lg',
  md: 'px-5 py-3 rounded-lg',
  lg: 'px-6 py-4 rounded-lg',
};

const sizeText = { sm: 'small', md: 'small', lg: 'body' } as const;

export function Button({
  label, variant = 'primary', size = 'md', loading, fullWidth,
  icon, iconRight, disabled, testID, onPress, ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const Content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : '#FF45A1'} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Txt
            weight="bold"
            variant="label"
            tone={
              variant === 'primary' ? 'inverse'
              : variant === 'danger' ? 'inverse'
              : variant === 'secondary' ? 'inverse'
              : 'flame'
            }
          >
            {label}
          </Txt>
          {iconRight ? <View>{iconRight}</View> : null}
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        {...rest}
        testID={testID}
        disabled={isDisabled}
        onPress={(e) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress?.(e); }}
        className={`${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''}`}
      >
        <LinearGradient
          colors={['#FF5637', '#FF45A1']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          className={`flex-row items-center justify-center gap-2 ${sizePad[size]}`}
        >
          {Content}
        </LinearGradient>
      </Pressable>
    );
  }

  const bgClass =
    variant === 'secondary' ? 'bg-obsidian-surface border border-obsidian-hi'
    : variant === 'ghost' ? 'bg-transparent'
    : variant === 'danger' ? 'bg-flame'
    : /* outline */ 'bg-transparent border border-flame';

  return (
    <Pressable
      {...rest}
      testID={testID}
      disabled={isDisabled}
      onPress={(e) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress?.(e); }}
      className={`flex-row items-center justify-center gap-2 ${bgClass} ${sizePad[size]} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''}`}
    >
      {Content}
    </Pressable>
  );
}
