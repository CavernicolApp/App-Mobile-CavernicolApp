// src/components/ui/LoadingScreen.tsx
import { ActivityIndicator, View } from 'react-native';
import { Txt } from './Text';

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-obsidian-void">
      <ActivityIndicator size="large" color="#FF45A1" />
      {message ? <Txt variant="small" tone="muted" className="mt-4">{message}</Txt> : null}
    </View>
  );
}

export function LoadingInline() {
  return (
    <View className="py-8 items-center">
      <ActivityIndicator size="small" color="#FF45A1" />
    </View>
  );
}
