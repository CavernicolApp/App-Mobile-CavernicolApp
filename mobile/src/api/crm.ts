// src/api/crm.ts — CRM endpoints
import { API, MOCK_MODE } from '@/constants/config';
import { makeQueryString, requestGet, requestPatch, requestPost } from './client';
import type { Deal, Lead, Task, Contact } from '@/types';
import { MOCK_LEADS, MOCK_DEALS, MOCK_TASKS, MOCK_CRM_STATUS } from './mockData';

export interface LeadFilters {
  status?: string;
  source_type?: string;
  assigned_to?: string;   // user_id o 'me' — backend traduce 'me' NO, hay que enviar el id real
  campaign_name?: string;
  pool_id?: string;
  branch_id?: string;
  q?: string;             // search
  limit?: number;
  offset?: number;
}

interface Paginated<T> { items: T[]; total: number; }

function applyLeadMockFilters(list: Lead[], f: LeadFilters): Lead[] {
  let items = list.slice();
  if (f.assigned_to) items = items.filter((l) => l.assigned_to_user_id === f.assigned_to);
  if (f.status && f.status !== 'all') items = items.filter((l) => l.status === f.status);
  if (f.q) {
    const q = f.q.toLowerCase();
    items = items.filter((l) =>
      (l.display_name ?? '').toLowerCase().includes(q) ||
      (l.primary_phone ?? '').includes(q) ||
      (l.primary_email ?? '').toLowerCase().includes(q),
    );
  }
  return items;
}

export async function listLeads(filters: LeadFilters = {}): Promise<Paginated<Lead>> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 250));
    const items = applyLeadMockFilters(MOCK_LEADS, filters);
    return { items, total: items.length };
  }
  const qs = makeQueryString(filters);
  return requestGet<Paginated<Lead>>(API.crm.leads + qs);
}

export async function getLead(id: string): Promise<Lead> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    const l = MOCK_LEADS.find((x) => x.id === id);
    if (!l) throw new Error('Lead not found');
    return l;
  }
  return requestGet<Lead>(API.crm.lead(id));
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
  if (MOCK_MODE) {
    const l = MOCK_LEADS.find((x) => x.id === id);
    if (!l) throw new Error('Lead not found');
    Object.assign(l, patch);
    return l;
  }
  return requestPatch<Lead>(API.crm.lead(id), patch);
}

// Deals / Pipeline
export interface DealFilters {
  status?: 'open' | 'won' | 'lost';
  stage_id?: string;
  pipeline_id?: string;
  assigned_to?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function listDeals(filters: DealFilters = {}): Promise<Paginated<Deal>> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 250));
    let items = MOCK_DEALS.slice();
    if (filters.assigned_to) items = items.filter((d) => d.assigned_to_user_id === filters.assigned_to);
    if (filters.status) items = items.filter((d) => d.status === filters.status);
    return { items, total: items.length };
  }
  const qs = makeQueryString(filters);
  return requestGet<Paginated<Deal>>(API.crm.deals + qs);
}

export async function advanceDealStage(id: string, stage_id: string): Promise<Deal> {
  if (MOCK_MODE) {
    const d = MOCK_DEALS.find((x) => x.id === id);
    if (!d) throw new Error('Deal not found');
    d.stage_id = stage_id;
    return d;
  }
  return requestPatch<Deal>(API.crm.dealStage(id), { stage_id });
}

export async function getDefaultPipeline() {
  if (MOCK_MODE) return { id: 'pipe-default', stages: [] };
  return requestGet(API.crm.defaultPipeline);
}

// Tasks
export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'done' | 'cancelled';
  assigned_to?: string;
  due_before?: string;
  limit?: number;
  offset?: number;
}

export async function listTasks(filters: TaskFilters = {}): Promise<Paginated<Task>> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    let items = MOCK_TASKS.slice();
    if (filters.assigned_to) items = items.filter((t) => t.assigned_to_user_id === filters.assigned_to);
    if (filters.status) items = items.filter((t) => t.status === filters.status);
    return { items, total: items.length };
  }
  const qs = makeQueryString(filters);
  return requestGet<Paginated<Task>>(API.crm.tasks + qs);
}

export async function completeTask(id: string): Promise<Task> {
  if (MOCK_MODE) {
    const t = MOCK_TASKS.find((x) => x.id === id);
    if (!t) throw new Error('Task not found');
    t.status = 'done';
    t.completed_at = new Date().toISOString();
    return t;
  }
  return requestPatch<Task>(`${API.crm.tasks}/${id}`, { status: 'done' });
}

// Contacts
export async function listContacts(q?: string, limit = 30) {
  if (MOCK_MODE) return { items: [], total: 0 };
  const qs = makeQueryString({ q, limit });
  return requestGet<Paginated<Contact>>(API.crm.contacts + qs);
}

export async function getContactTimeline(id: string) {
  if (MOCK_MODE) return { items: [] };
  return requestGet(API.crm.contactTimeline(id));
}

// Status del CRM
export async function getCrmStatus() {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_CRM_STATUS;
  }
  return requestGet<{
    active_leads: number;
    unassigned: number;
    won_this_month: number;
    lost_this_month: number;
    open_deals: number;
    tasks_due_today: number;
  }>(API.dashboard.crmStatus);
}
