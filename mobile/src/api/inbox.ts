// src/api/inbox.ts — Inbox / Conversations endpoints
import { API, MOCK_MODE } from '@/constants/config';
import { makeQueryString, requestGet, requestPost } from './client';
import type { AiMode, Conversation, InboxMessage } from '@/types';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_INBOX_STATS } from './mockData';

export interface ConversationFilters {
  status?: 'open' | 'closed' | 'archived';
  assigned_to?: string;     // user_id
  channel?: string;
  unread_only?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}

interface Paginated<T> { items: T[]; total: number; }

export async function listConversations(filters: ConversationFilters = {}): Promise<Paginated<Conversation>> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 250));
    let items = MOCK_CONVERSATIONS.slice();
    if (filters.assigned_to) items = items.filter((c) => c.assigned_to_user_id === filters.assigned_to);
    if (filters.unread_only) items = items.filter((c) => c.unread_count > 0);
    if (filters.channel) items = items.filter((c) => c.channel === filters.channel);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((c) => (c.contact_name ?? '').toLowerCase().includes(q) || c.last_message_preview.toLowerCase().includes(q));
    }
    return { items, total: items.length };
  }
  const qs = makeQueryString(filters);
  return requestGet<Paginated<Conversation>>(API.inbox.conversations + qs);
}

export async function getConversation(id: string): Promise<Conversation> {
  if (MOCK_MODE) {
    const c = MOCK_CONVERSATIONS.find((x) => x.id === id);
    if (!c) throw new Error('Conversation not found');
    return c;
  }
  return requestGet<Conversation>(API.inbox.conversation(id));
}

export async function listMessages(conversationId: string, before?: string, limit = 50): Promise<Paginated<InboxMessage>> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    const items = MOCK_MESSAGES[conversationId] ?? [];
    return { items, total: items.length };
  }
  const qs = makeQueryString({ before, limit });
  return requestGet<Paginated<InboxMessage>>(API.inbox.messages(conversationId) + qs);
}

export interface ReplyPayload {
  conversation_id: string;
  content: string;
  media_url?: string;
}

export async function sendReply(payload: ReplyPayload): Promise<{ ok: true; message: InboxMessage }> {
  if (MOCK_MODE) {
    const msg: InboxMessage = {
      id: `m-${Date.now()}`, conversation_id: payload.conversation_id,
      direction: 'outbound', content: payload.content, content_html: null,
      media_url: payload.media_url ?? null, media_kind: null,
      sender_kind: 'agent_human', sender_user_id: 'mock-user', sender_name: 'Tú',
      created_at: new Date().toISOString(), delivered_at: new Date().toISOString(),
      read_at: null, error_message: null,
    };
    (MOCK_MESSAGES[payload.conversation_id] ??= []).push(msg);
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === payload.conversation_id);
    if (conv) {
      conv.last_message_at = msg.created_at;
      conv.last_message_preview = payload.content;
      conv.last_message_direction = 'outbound';
      conv.unread_count = 0;
    }
    return { ok: true, message: msg };
  }
  return requestPost(API.inbox.reply, payload);
}

export async function takeoverConversation(id: string): Promise<Conversation> {
  if (MOCK_MODE) {
    const c = MOCK_CONVERSATIONS.find((x) => x.id === id);
    if (!c) throw new Error('Conversation not found');
    c.ai_mode = 'disabled';
    return c;
  }
  return requestPost(API.inbox.takeover(id));
}

export async function setAiMode(id: string, mode: AiMode): Promise<Conversation> {
  if (MOCK_MODE) {
    const c = MOCK_CONVERSATIONS.find((x) => x.id === id);
    if (!c) throw new Error('Conversation not found');
    c.ai_mode = mode;
    return c;
  }
  return requestPost(API.inbox.aiMode(id), { mode });
}

export async function requestSummary(id: string): Promise<{ summary: string }> {
  if (MOCK_MODE) return { summary: 'Resumen de la conversación (mock).' };
  return requestPost(API.inbox.summary(id));
}

export async function transferConversation(id: string, to_user_id: string, note?: string) {
  if (MOCK_MODE) return { ok: true };
  return requestPost(API.inbox.transfer(id), { to_user_id, note });
}

export async function getInboxStats() {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_INBOX_STATS;
  }
  return requestGet<{
    unread_total: number;
    open_total: number;
    assigned_to_me: number;
    unassigned: number;
    by_channel: Record<string, number>;
  }>(API.inbox.stats);
}
