// src/components/ui/Avatar.tsx
import { View, Image } from 'react-native';
import { Txt } from './Text';
import { initials } from '@/lib/format';

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
  tone?: 'brand' | 'dark';
}

export function Avatar({ name, imageUrl, size = 40, tone = 'dark' }: AvatarProps) {
  const bg = tone === 'brand' ? 'bg-brand-primary' : 'bg-brand-dark';
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`items-center justify-center overflow-hidden ${imageUrl ? '' : bg}`}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: size, height: size }} />
      ) : (
        <Txt tone="inverse" weight="bold" style={{ fontSize: size * 0.4 }}>
          {initials(name)}
        </Txt>
      )}
    </View>
  );
}
