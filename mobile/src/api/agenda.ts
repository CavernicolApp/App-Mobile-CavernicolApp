// src/api/agenda.ts — Agenda / Appointments endpoints
import { API, MOCK_MODE } from '@/constants/config';
import { makeQueryString, requestGet, requestPatch, requestPost } from './client';
import type { AgendaResource, AgendaService, Appointment, AppointmentStatus } from '@/types';
import { MOCK_APPOINTMENTS, MOCK_AGENDA_STATUS } from './mockData';

export interface AppointmentFilters {
  from?: string;                  // ISO date
  to?: string;                    // ISO date
  status?: AppointmentStatus;
  assigned_to_user_id?: string;
  resource_id?: string;
  service_id?: string;
  limit?: number;
  offset?: number;
}

interface Paginated<T> { items: T[]; total: number; }

export async function listAppointments(filters: AppointmentFilters = {}): Promise<Paginated<Appointment>> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    let items = MOCK_APPOINTMENTS.slice();
    if (filters.assigned_to_user_id) items = items.filter((a) => a.assigned_to_user_id === filters.assigned_to_user_id);
    if (filters.from) items = items.filter((a) => a.starts_at >= filters.from!);
    if (filters.to) items = items.filter((a) => a.starts_at < filters.to!);
    if (filters.status) items = items.filter((a) => a.status === filters.status);
    return { items, total: items.length };
  }
  const qs = makeQueryString(filters);
  return requestGet<Paginated<Appointment>>(API.agenda.appointments + qs);
}

export async function getAppointment(id: string): Promise<Appointment> {
  if (MOCK_MODE) {
    const a = MOCK_APPOINTMENTS.find((x) => x.id === id);
    if (!a) throw new Error('Appointment not found');
    return a;
  }
  return requestGet<Appointment>(API.agenda.appointment(id));
}

export async function updateAppointment(id: string, patch: Partial<Appointment>): Promise<Appointment> {
  if (MOCK_MODE) {
    const a = MOCK_APPOINTMENTS.find((x) => x.id === id);
    if (!a) throw new Error('Appointment not found');
    Object.assign(a, patch);
    return a;
  }
  return requestPatch<Appointment>(API.agenda.appointment(id), patch);
}

export async function listServices(): Promise<{ items: AgendaService[] }> {
  if (MOCK_MODE) return { items: [] };
  return requestGet(API.agenda.services);
}

export async function listResources(): Promise<{ items: AgendaResource[] }> {
  if (MOCK_MODE) return { items: [] };
  return requestGet(API.agenda.resources);
}

export async function getAgendaStatus() {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_AGENDA_STATUS;
  }
  return requestGet<{
    today_count: number;
    upcoming_count: number;
    completed_this_week: number;
    no_shows_this_month: number;
  }>(API.dashboard.agendaStatus);
}
