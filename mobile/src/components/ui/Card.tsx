// src/components/ui/Card.tsx — Cyberpunk cards con tonal layering
import { View, Pressable, type PressableProps, type ViewProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;   // usa surface-container-high para modales/popovers
}

export function Card({ padded = true, elevated, className, ...rest }: CardProps & { className?: string }) {
  const bg = elevated ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-obsidian-surface border-obsidian-border';
  return (
    <View
      {...rest}
      className={`${bg} rounded-card border ${padded ? 'p-4' : ''} ${className ?? ''}`}
    />
  );
}

interface PressableCardProps extends PressableProps {
  padded?: boolean;
  className?: string;
  accentBar?: boolean;   // barra izquierda con gradient (para conversaciones activas)
}

export function PressableCard({ padded = true, accentBar, className, onPress, ...rest }: PressableCardProps) {
  return (
    <Pressable
      {...rest}
      onPress={(e) => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      className={`bg-obsidian-surface rounded-card border border-obsidian-border ${padded ? 'p-4' : ''} active:opacity-70 relative overflow-hidden ${className ?? ''}`}
    >
      {accentBar ? (
        <View className="absolute left-0 top-0 bottom-0 w-1 bg-magenta" />
      ) : null}
      {rest.children as React.ReactNode}
    </Pressable>
  );
}
