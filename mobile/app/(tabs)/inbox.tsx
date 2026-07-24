// app/(tabs)/inbox.tsx — Conversaciones cyberpunk
import { useState } from 'react';
import { FlatList, RefreshControl, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingInline } from '@/components/ui/LoadingScreen';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';
import { useConversations } from '@/hooks/useInbox';
import { useAuthStore } from '@/stores/auth';
import { timeAgo, truncate, initials } from '@/lib/format';
import type { Conversation, InboxChannel } from '@/types';

type Filter = 'all' | 'unread' | 'assigned_to_me';

export default function InboxScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const hasFullAccess = useAuthStore((s) => s.hasFullTenantAccess());
  const currentUserId = useAuthStore((s) => s.user?.id);

  const filters = {
    q: q || undefined,
    unread_only: filter === 'unread' || undefined,
    assigned_to: filter === 'assigned_to_me' ? currentUserId : undefined,
    status: 'open' as const,
    limit: 50,
  };

  const query = useConversations(filters);

  async function onRefresh() {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  }

  const items = query.data?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void" edges={['top']}>
      {/* Top brand */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-obsidian-border">
        <Logo size="sm" />
      </View>

      {/* Header title + search */}
      <View className="px-5 pt-6 pb-4">
        <Txt variant="display" weight="bold" font="heading">Conversaciones</Txt>

        <View className="flex-row items-center bg-obsidian-surface border border-obsidian-hi rounded-lg px-4 mt-4">
          <Ionicons name="search" size={18} color="#A0A0A0" />
          <TextInput
            testID="inbox-search-input"
            value={q}
            onChangeText={setQ}
            placeholder="Buscar mensajes o contactos..."
            placeholderTextColor="#666"
            selectionColor="#FF45A1"
            className="flex-1 py-3 pl-3 text-white"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}
          />
        </View>

        {/* Filter chips */}
        <View className="flex-row gap-3 mt-4">
          <FilterChip label="TODAS" active={filter === 'all'} onPress={() => setFilter('all')} testID="inbox-filter-all" />
          <FilterChip label="SIN LEER" active={filter === 'unread'} onPress={() => setFilter('unread')} testID="inbox-filter-unread" />
          {hasFullAccess ? (
            <FilterChip label="MÍAS" active={filter === 'assigned_to_me'} onPress={() => setFilter('assigned_to_me')} testID="inbox-filter-mine" />
          ) : null}
        </View>
      </View>

      {query.isLoading ? (
        <LoadingInline />
      ) : items.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Sin conversaciones"
          subtitle={hasFullAccess ? 'Aparecerán aquí cuando llegue un mensaje nuevo.' : 'Aparecerán aquí cuando te asignen una conversación.'}
        />
      ) : (
        <FlatList
          testID="inbox-list"
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF45A1" />}
          renderItem={({ item }) => (
            <ConversationRow
              conv={item}
              onPress={() => router.push({ pathname: '/inbox/[conversationId]', params: { conversationId: item.id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className={`px-4 py-2 rounded-pill border-2 ${active ? 'border-flame bg-flame/5' : 'border-obsidian-hi bg-obsidian-surface'}`}
    >
      <Txt variant="label" weight="medium" tone={active ? 'flame' : 'muted'}>{label}</Txt>
    </Pressable>
  );
}

const CHANNEL_ICON: Record<InboxChannel, { name: string; color: string; lib: 'io' | 'mci' }> = {
  whatsapp:      { name: 'logo-whatsapp',       color: '#25D366', lib: 'io' },
  facebook_dm:   { name: 'facebook-messenger',  color: '#0084FF', lib: 'mci' },
  facebook_wall: { name: 'logo-facebook',       color: '#1877F2', lib: 'io' },
  instagram_dm:  { name: 'logo-instagram',      color: '#E4405F', lib: 'io' },
  instagram_wall:{ name: 'logo-instagram',      color: '#E4405F', lib: 'io' },
  linkedin_wall: { name: 'logo-linkedin',       color: '#0A66C2', lib: 'io' },
  email:         { name: 'mail',                color: '#A0A0A0', lib: 'io' },
  voice_call:    { name: 'call',                color: '#8B5CF6', lib: 'io' },
  sms:           { name: 'chatbox',             color: '#22C55E', lib: 'io' },
};

function ConversationRow({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const isUnread = conv.unread_count > 0;
  const channelCfg = CHANNEL_ICON[conv.channel as InboxChannel];

  return (
    <Pressable testID={`conversation-row-${conv.id}`} onPress={onPress} className="relative">
      <View className="bg-obsidian-surface border border-obsidian-border rounded-xl p-3 flex-row items-start gap-3 overflow-hidden">
        {isUnread ? <View className="absolute left-0 top-0 bottom-0 w-1 bg-magenta" /> : null}

        {/* Avatar con badge de canal */}
        <View className="relative">
          <View className="w-12 h-12 rounded-full bg-obsidian-elevated border border-obsidian-hi items-center justify-center">
            <Txt variant="body" weight="bold">{initials(conv.contact_name)}</Txt>
          </View>
          <View className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full items-center justify-center bg-obsidian-void" style={{ padding: 1 }}>
            <View className="w-full h-full rounded-full items-center justify-center" style={{ backgroundColor: channelCfg?.color ?? '#666' }}>
              {channelCfg?.lib === 'io' ? (
                <Ionicons name={channelCfg.name as never} size={11} color="#fff" />
              ) : (
                <MaterialCommunityIcons name={channelCfg?.name as never ?? 'chat'} size={11} color="#fff" />
              )}
            </View>
          </View>
        </View>

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2">
            <Txt variant="body" weight="bold" numberOfLines={1} className="flex-1">
              {conv.contact_name ?? 'Sin nombre'}
            </Txt>
            <Txt variant="caption" tone={isUnread ? 'flame' : 'muted'} weight={isUnread ? 'semibold' : 'regular'}>
              {timeAgo(conv.last_message_at)}
            </Txt>
            {isUnread ? <View className="w-2 h-2 rounded-full bg-flame ml-0.5" /> : null}
          </View>
          <Txt
            variant="small"
            tone={isUnread ? 'default' : 'muted'}
            numberOfLines={1}
            className="mt-0.5"
          >
            {truncate(conv.last_message_preview, 60)}
          </Txt>
          <View className="flex-row items-center gap-2 mt-2">
            {conv.ai_mode === 'auto' ? <Badge label="IA" tone="magenta" /> : null}
            <Badge label={conv.channel === 'whatsapp' || conv.channel === 'sms' ? 'VENTAS' : conv.channel.startsWith('instagram') ? 'FEEDBACK' : 'SOPORTE'} tone="muted" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
