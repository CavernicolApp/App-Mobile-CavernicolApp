// src/components/ui/ErrorView.tsx
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Txt } from './Text';

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-obsidian-void p-8">
      <View className="w-20 h-20 rounded-full bg-flame/10 border border-flame/30 items-center justify-center mb-5">
        <Ionicons name="alert-circle-outline" size={32} color="#FF5637" />
      </View>
      <Txt variant="heading" weight="bold" font="heading" className="text-center mb-2">
        Algo salió mal
      </Txt>
      <Txt variant="small" tone="muted" className="text-center mb-4">
        {message ?? 'No pudimos cargar la información. Verifica tu conexión e intenta de nuevo.'}
      </Txt>
      {onRetry ? <Button label="Reintentar" variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}
