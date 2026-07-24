// src/hooks/useAgenda.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAppointment, getAgendaStatus, getAppointment, getAvailability, listAppointments, listResources, listServices, updateAppointment, type AppointmentFilters } from '@/api/agenda';
import { useAuthStore } from '@/stores/auth';
import type { Appointment, CreateAppointmentPayload } from '@/types';

export function useAppointments(baseFilters: AppointmentFilters = {}) {
  const assignedTo = useAuthStore((s) => s.assignedToFilter());
  const filters: AppointmentFilters = {
    ...baseFilters,
    assigned_to_user_id: baseFilters.assigned_to_user_id ?? assignedTo,
  };

  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => listAppointments(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(id as string),
    enabled: !!id,
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Appointment> }) => updateAppointment(id, patch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.setQueryData(['appointment', data.id], data);
      qc.invalidateQueries({ queryKey: ['agenda-status'] });
    },
  });
}

export function useAgendaServices() {
  return useQuery({
    queryKey: ['agenda-services'],
    queryFn: listServices,
    staleTime: 5 * 60_000,
  });
}

export function useAgendaResources() {
  return useQuery({
    queryKey: ['agenda-resources'],
    queryFn: listResources,
    staleTime: 5 * 60_000,
  });
}

export function useAgendaStatus() {
  return useQuery({
    queryKey: ['agenda-status'],
    queryFn: getAgendaStatus,
    staleTime: 60_000,
  });
}

export function useAvailability(
  params: { date: string; service_id?: string; resource_id?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ['availability', params],
    queryFn: () => getAvailability(params),
    enabled: enabled && !!params.date && !!params.service_id,
    staleTime: 30_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['agenda-status'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
