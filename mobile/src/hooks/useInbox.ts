// src/hooks/useInbox.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getConversation, getInboxStats, listConversations, listMessages, requestSummary, sendReply, setAiMode, takeoverConversation, transferConversation, type ConversationFilters, type ReplyPayload } from '@/api/inbox';
import { useAuthStore } from '@/stores/auth';
import type { AiMode } from '@/types';

export function useConversations(baseFilters: ConversationFilters = {}) {
  const assignedTo = useAuthStore((s) => s.assignedToFilter());
  const filters: ConversationFilters = { ...baseFilters, assigned_to: baseFilters.assigned_to ?? assignedTo };

  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: () => listConversations(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversation(id as string),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => listMessages(conversationId as string),
    enabled: !!conversationId,
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}

export function useSendReply(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ReplyPayload, 'conversation_id'>) =>
      sendReply({ conversation_id: conversationId, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['inbox-stats'] });
    },
  });
}

export function useTakeover(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => takeoverConversation(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
  });
}

export function useSetAiMode(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: AiMode) => setAiMode(conversationId, mode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
  });
}

export function useRequestSummary(conversationId: string) {
  return useMutation({
    mutationFn: () => requestSummary(conversationId),
  });
}

export function useTransfer(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ to_user_id, note }: { to_user_id: string; note?: string }) =>
      transferConversation(conversationId, to_user_id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
  });
}

export function useInboxStats() {
  return useQuery({
    queryKey: ['inbox-stats'],
    queryFn: getInboxStats,
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}
