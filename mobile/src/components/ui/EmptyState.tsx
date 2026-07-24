// src/components/ui/EmptyState.tsx
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from './Text';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'sparkles-outline', title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="w-20 h-20 rounded-full bg-obsidian-surface border border-obsidian-border items-center justify-center mb-5">
        <Ionicons name={icon} size={32} color="#FF45A1" />
      </View>
      <Txt variant="heading" weight="bold" font="heading" className="text-center mb-2">{title}</Txt>
      {subtitle ? (
        <Txt variant="small" tone="muted" className="text-center mb-4">
          {subtitle}
        </Txt>
      ) : null}
      {action}
    </View>
  );
}
