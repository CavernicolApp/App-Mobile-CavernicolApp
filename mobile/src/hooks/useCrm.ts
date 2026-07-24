// src/hooks/useCrm.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { advanceDealStage, completeTask, getCrmStatus, getLead, listDeals, listLeads, listTasks, updateLead, type DealFilters, type LeadFilters, type TaskFilters } from '@/api/crm';
import { useAuthStore } from '@/stores/auth';
import type { Lead } from '@/types';

export function useLeads(baseFilters: LeadFilters = {}) {
  const assignedTo = useAuthStore((s) => s.assignedToFilter());
  const filters: LeadFilters = { ...baseFilters, assigned_to: baseFilters.assigned_to ?? assignedTo };

  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => listLeads(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLead(id as string),
    enabled: !!id,
  });
}

export function useDeals(baseFilters: DealFilters = {}) {
  const assignedTo = useAuthStore((s) => s.assignedToFilter());
  const filters: DealFilters = { ...baseFilters, assigned_to: baseFilters.assigned_to ?? assignedTo };

  return useQuery({
    queryKey: ['deals', filters],
    queryFn: () => listDeals(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useTasks(baseFilters: TaskFilters = {}) {
  const assignedTo = useAuthStore((s) => s.assignedToFilter());
  const filters: TaskFilters = { ...baseFilters, assigned_to: baseFilters.assigned_to ?? assignedTo };

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => listTasks(filters),
    staleTime: 30_000,
  });
}

export function useCrmStatus() {
  return useQuery({
    queryKey: ['crm-status'],
    queryFn: getCrmStatus,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useAdvanceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage_id }: { id: string; stage_id: string }) => advanceDealStage(id, stage_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['crm-status'] });
    },
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['crm-status'] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Lead> }) => updateLead(id, patch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.setQueryData(['lead', data.id], data);
    },
  });
}
