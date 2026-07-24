// src/components/ui/ChannelBadge.tsx
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CHANNEL_COLORS, CHANNEL_LABELS } from '@/constants/config';
import { Txt } from './Text';
import type { InboxChannel } from '@/types';

const CHANNEL_ICON: Record<InboxChannel, { lib: 'io' | 'mci'; name: string }> = {
  whatsapp: { lib: 'io', name: 'logo-whatsapp' },
  facebook_dm: { lib: 'mci', name: 'facebook-messenger' },
  facebook_wall: { lib: 'io', name: 'logo-facebook' },
  instagram_dm: { lib: 'io', name: 'logo-instagram' },
  instagram_wall: { lib: 'io', name: 'logo-instagram' },
  linkedin_wall: { lib: 'io', name: 'logo-linkedin' },
  email: { lib: 'io', name: 'mail' },
  voice_call: { lib: 'io', name: 'call' },
  sms: { lib: 'io', name: 'chatbox' },
};

const isWall = (c: string) => c.endsWith('_wall');

export function ChannelBadge({ channel, size = 22, showLabel = false }: { channel: InboxChannel; size?: number; showLabel?: boolean }) {
  const color = CHANNEL_COLORS[channel] ?? '#64748B';
  const cfg = CHANNEL_ICON[channel];
  const label = CHANNEL_LABELS[channel] ?? channel;

  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: size + 4, height: size + 4 }} className="items-center justify-center relative">
        {cfg?.lib === 'io' ? (
          <Ionicons name={cfg.name as never} size={size} color={color} />
        ) : (
          <MaterialCommunityIcons name={cfg.name as never} size={size} color={color} />
        )}
        {isWall(channel) ? (
          <View
            style={{ right: -2, bottom: -2 }}
            className="absolute w-3.5 h-3.5 rounded-full bg-brand-dark items-center justify-center"
          >
            <Ionicons name="chatbubble-ellipses" size={8} color="#fff" />
          </View>
        ) : null}
      </View>
      {showLabel ? <Txt variant="caption" tone="muted">{label}</Txt> : null}
    </View>
  );
}
