// src/api/dashboard.ts — KPIs consolidados
import { API, MOCK_MODE } from '@/constants/config';
import { requestGet } from './client';
import { MOCK_DASHBOARD } from './mockData';

export interface DashboardSummary {
  business_name: string;
  vertical: string;
  timezone: string;
  today: {
    new_leads: number;
    unread_conversations: number;
    upcoming_appointments: number;
    tasks_due_today: number;
  };
  week: {
    leads: number;
    conversions: number;
    revenue: number | null;
    currency: string;
  };
  attention_needed: Array<{
    kind: 'unassigned_lead' | 'stale_conversation' | 'overdue_task' | 'no_show_appointment';
    count: number;
    label: string;
  }>;
  revenue_series: Array<{ month: string; total: number }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_DASHBOARD;
  }
  return requestGet<DashboardSummary>(API.dashboard.businessHub);
}
