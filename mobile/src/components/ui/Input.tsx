// src/components/ui/Input.tsx — Dark input con focus gradient
import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Txt } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, leftIcon, rightIcon, testID, className, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? 'border-flame'
    : focused
      ? 'border-magenta'
      : 'border-obsidian-hi';

  return (
    <View className="w-full">
      {label ? (
        <Txt variant="label" weight="medium" tone="muted" className="mb-2">
          {label}
        </Txt>
      ) : null}
      <View
        className={`flex-row items-center bg-obsidian-surface border rounded-lg px-3 ${borderColor}`}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          testID={testID}
          placeholderTextColor="#666666"
          selectionColor="#FF45A1"
          className={`flex-1 py-3 text-white text-base ${className ?? ''}`}
          style={{ fontFamily: 'Inter_400Regular' }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...rest}
        />
        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>
      {error ? (
        <Txt variant="caption" tone="flame" className="mt-1">{error}</Txt>
      ) : hint ? (
        <Txt variant="caption" tone="muted" className="mt-1">{hint}</Txt>
      ) : null}
    </View>
  );
});
