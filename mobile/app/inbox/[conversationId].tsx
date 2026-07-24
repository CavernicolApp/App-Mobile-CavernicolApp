// app/inbox/[conversationId].tsx — Chat view
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useConversation, useMessages, useSendReply, useTakeover, useSetAiMode } from '@/hooks/useInbox';
import { formatTime, timeAgo } from '@/lib/format';
import type { InboxChannel, InboxMessage } from '@/types';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<InboxMessage>>(null);

  const conv = useConversation(conversationId);
  const messages = useMessages(conversationId);
  const send = useSendReply(conversationId ?? '');
  const takeover = useTakeover(conversationId ?? '');
  const setAiMode = useSetAiMode(conversationId ?? '');

  useEffect(() => {
    // Auto-scroll al último mensaje
    if (messages.data?.items?.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.data?.items?.length]);

  if (conv.isLoading) return <LoadingScreen />;
  if (conv.isError || !conv.data) return <ErrorView onRetry={() => conv.refetch()} />;

  const data = conv.data;
  const items = messages.data?.items ?? [];

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft('');
    await send.mutateAsync({ content: trimmed });
  }

  const isAiAuto = data.ai_mode === 'auto';

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-3 py-2 bg-white border-b border-obsidian-border">
        <Pressable testID="conv-back" onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <ChannelBadge channel={data.channel as InboxChannel} size={22} />
        <Avatar name={data.contact_name} size={36} />
        <View className="flex-1 min-w-0">
          <Txt variant="body" weight="semibold" numberOfLines={1}>{data.contact_name ?? 'Sin nombre'}</Txt>
          <View className="flex-row items-center gap-1.5">
            {isAiAuto ? <Badge label="IA respondiendo" tone="brand" /> : null}
            <Txt variant="caption" tone="muted">activo {timeAgo(data.last_message_at)}</Txt>
          </View>
        </View>
      </View>

      {/* AI banner / takeover */}
      {isAiAuto ? (
        <View className="bg-magenta/10 border-b border-brand-primary/20 px-4 py-2 flex-row items-center gap-2">
          <Ionicons name="sparkles" size={16} color="#FF45A1" />
          <Txt variant="caption" weight="medium" tone="brand" className="flex-1">
            La IA está respondiendo. Toma control para responder tú.
          </Txt>
          <Pressable
            testID="conv-takeover"
            onPress={() => takeover.mutate()}
            className="bg-magenta rounded-full px-3 py-1"
          >
            <Txt variant="caption" weight="bold" tone="inverse">Tomar</Txt>
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          testID="conv-messages"
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Composer */}
        <View className="border-t border-obsidian-border bg-white p-3">
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <Input
                testID="conv-composer-input"
                value={draft}
                onChangeText={setDraft}
                placeholder={isAiAuto ? 'Toma control para responder…' : 'Escribe un mensaje…'}
                multiline
                editable={!isAiAuto}
              />
            </View>
            <Button
              testID="conv-send-button"
              label=""
              icon={<Ionicons name="send" size={18} color="#fff" />}
              onPress={handleSend}
              disabled={!draft.trim() || isAiAuto}
              loading={send.isPending}
            />
          </View>
          {!isAiAuto ? (
            <Pressable
              onPress={() => setAiMode.mutate('auto')}
              className="items-center py-2"
              testID="conv-enable-ai"
            >
              <Txt variant="caption" tone="brand" weight="semibold">Activar respuesta IA</Txt>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ msg }: { msg: InboxMessage }) {
  const isOutbound = msg.direction === 'outbound';
  const bg = isOutbound ? 'bg-magenta' : 'bg-white';
  const align = isOutbound ? 'self-end' : 'self-start';
  const tone = isOutbound ? 'inverse' : 'default';
  const border = isOutbound ? '' : 'border border-obsidian-border';
  const senderNote =
    msg.sender_kind === 'agent_ai' ? 'IA' :
    msg.sender_kind === 'agent_human' ? msg.sender_name ?? 'Agente' :
    null;

  return (
    <View className={`${align} max-w-[80%]`}>
      {senderNote ? (
        <Txt variant="caption" tone="muted" className="mb-0.5 ml-1">{senderNote}</Txt>
      ) : null}
      <View className={`${bg} ${border} rounded-2xl px-3.5 py-2`}>
        <Txt variant="body" tone={tone as 'inverse' | 'default'}>{msg.content}</Txt>
        <Txt
          variant="caption"
          tone={tone as 'inverse' | 'default'}
          className={`mt-1 ${isOutbound ? 'opacity-80' : ''} self-end`}
        >
          {formatTime(msg.created_at)}
        </Txt>
      </View>
    </View>
  );
}
