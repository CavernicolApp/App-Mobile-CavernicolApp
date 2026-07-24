// src/api/mockData.ts — Datos mock para preview de la app sin backend
// Solo se usan cuando EXPO_PUBLIC_MOCK_MODE=true.
// La app se ve y navega igual que en producción, sin llamar al SaaS real.

import type {
  Appointment, Conversation, Deal, InboxMessage, Lead, Task, AuthUser,
  AgendaService, AgendaResource, AvailabilitySlot, AvailabilityResponse, CreateAppointmentPayload,
} from '@/types';
import type { DashboardSummary } from './dashboard';

// ---------------- Usuarios mock (por rol) ----------------

export const MOCK_USERS: Record<string, AuthUser> = {
  'owner@demo.mx': {
    id: 'user-owner-001',
    email: 'owner@demo.mx',
    name: 'Andrea Ríos',
    user_type: 'tenant',
    platform_role: null,
    tenant_id: 'tenant-demo-001',
    tenant_role: 'tenant_owner',
    is_active: true,
    timezone: 'America/Mexico_City',
    locale: 'es-MX',
    last_login_at: new Date().toISOString(),
    created_at: '2025-06-01T00:00:00Z',
  },
  'vendedor@demo.mx': {
    id: 'user-vendor-002',
    email: 'vendedor@demo.mx',
    name: 'Carlos Méndez',
    user_type: 'tenant',
    platform_role: null,
    tenant_id: 'tenant-demo-001',
    tenant_role: 'tenant_user',
    is_active: true,
    timezone: 'America/Mexico_City',
    locale: 'es-MX',
    last_login_at: new Date().toISOString(),
    created_at: '2025-08-15T00:00:00Z',
  },
};

export const MOCK_PASSWORD = 'demo123';

// ---------------- Dashboard ----------------

export const MOCK_DASHBOARD: DashboardSummary = {
  business_name: 'Salón Bella Época',
  vertical: 'beauty',
  timezone: 'America/Mexico_City',
  today: {
    new_leads: 7,
    unread_conversations: 3,
    upcoming_appointments: 5,
    tasks_due_today: 4,
  },
  week: {
    leads: 42,
    conversions: 11,
    revenue: 18450,
    currency: 'MXN',
  },
  attention_needed: [
    { kind: 'unassigned_lead', count: 2, label: 'Leads sin asignar de WhatsApp Ads' },
    { kind: 'stale_conversation', count: 1, label: 'Conversación sin respuesta hace 2 horas' },
    { kind: 'overdue_task', count: 3, label: 'Tareas vencidas del equipo' },
  ],
};

// ---------------- CRM ----------------

const now = new Date();
const iso = (offsetHours: number) => new Date(now.getTime() + offsetHours * 3600_000).toISOString();

export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-001', tenant_id: 'tenant-demo-001',
    display_name: 'María Fernanda Torres', primary_phone: '+525512345678', primary_email: 'maria.torres@gmail.com',
    status: 'active', stage: 'contactado', source_type: 'whatsapp_ad', source_name: 'Meta Ads · Corte y color',
    campaign_name: 'Verano 2026', channel: 'whatsapp', medium: 'paid_social',
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    pool_id: null, branch_id: null, contact_id: 'contact-001',
    created_at: iso(-3), updated_at: iso(-1), last_activity_at: iso(-0.5), next_action_at: iso(24),
    notes: 'Interesada en paquete de novia. Prefiere sábados.', score: 78,
  },
  {
    id: 'lead-002', tenant_id: 'tenant-demo-001',
    display_name: 'Luis Enrique Ramírez', primary_phone: '+525587654321', primary_email: null,
    status: 'active', stage: 'nuevo', source_type: 'instagram_dm', source_name: 'DM directo',
    campaign_name: null, channel: 'instagram_dm', medium: 'organic',
    assigned_to_user_id: null, assigned_to_name: null,
    pool_id: null, branch_id: null, contact_id: 'contact-002',
    created_at: iso(-1), updated_at: iso(-1), last_activity_at: iso(-1), next_action_at: null,
    notes: null, score: 45,
  },
  {
    id: 'lead-003', tenant_id: 'tenant-demo-001',
    display_name: 'Ana Sofía Pérez', primary_phone: '+525599887766', primary_email: 'ana.perez@outlook.com',
    status: 'active', stage: 'agendado', source_type: 'facebook_ad', source_name: 'Meta Ads · Tratamiento capilar',
    campaign_name: 'Verano 2026', channel: 'facebook_dm', medium: 'paid_social',
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    pool_id: null, branch_id: null, contact_id: 'contact-003',
    created_at: iso(-24), updated_at: iso(-2), last_activity_at: iso(-2), next_action_at: iso(48),
    notes: 'Confirmó cita para el viernes 5pm.', score: 92,
  },
  {
    id: 'lead-004', tenant_id: 'tenant-demo-001',
    display_name: 'Roberto Cárdenas', primary_phone: '+525533445566', primary_email: null,
    status: 'active', stage: 'contactado', source_type: 'referral', source_name: 'Recomendación de cliente',
    campaign_name: null, channel: 'whatsapp', medium: 'referral',
    assigned_to_user_id: 'user-owner-001', assigned_to_name: 'Andrea Ríos',
    pool_id: null, branch_id: null, contact_id: 'contact-004',
    created_at: iso(-48), updated_at: iso(-6), last_activity_at: iso(-6), next_action_at: iso(12),
    notes: 'Recomendado por María Torres.', score: 65,
  },
];

export const MOCK_DEALS: Deal[] = [
  {
    id: 'deal-001', lead_id: 'lead-001', contact_id: 'contact-001',
    pipeline_id: 'pipe-default', stage_id: 'stage-quote', stage_key: 'quote', stage_name: 'Cotización',
    status: 'open', amount: 4500, currency: 'MXN', probability: 60,
    expected_close_date: iso(72),
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    title: 'Paquete de novia — María Torres',
    created_at: iso(-3), updated_at: iso(-1), won_at: null, lost_at: null, loss_reason: null,
  },
  {
    id: 'deal-002', lead_id: 'lead-003', contact_id: 'contact-003',
    pipeline_id: 'pipe-default', stage_id: 'stage-negotiation', stage_key: 'negotiation', stage_name: 'Negociación',
    status: 'open', amount: 2200, currency: 'MXN', probability: 80,
    expected_close_date: iso(48),
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    title: 'Tratamiento capilar — Ana Sofía',
    created_at: iso(-24), updated_at: iso(-2), won_at: null, lost_at: null, loss_reason: null,
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-001', tenant_id: 'tenant-demo-001',
    title: 'Llamar a María para confirmar paquete', description: 'Cerrar la cotización del paquete de novia',
    status: 'pending', priority: 'high', due_at: iso(4),
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    lead_id: 'lead-001', deal_id: 'deal-001', contact_id: 'contact-001',
    created_at: iso(-3), completed_at: null,
  },
  {
    id: 'task-002', tenant_id: 'tenant-demo-001',
    title: 'Enviar catálogo a Luis Enrique', description: null,
    status: 'pending', priority: 'medium', due_at: iso(24),
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    lead_id: 'lead-002', deal_id: null, contact_id: 'contact-002',
    created_at: iso(-1), completed_at: null,
  },
  {
    id: 'task-003', tenant_id: 'tenant-demo-001',
    title: 'Preparar propuesta VIP para Roberto', description: 'Cliente referido — trato especial',
    status: 'pending', priority: 'high', due_at: iso(12),
    assigned_to_user_id: 'user-owner-001', assigned_to_name: 'Andrea Ríos',
    lead_id: 'lead-004', deal_id: null, contact_id: 'contact-004',
    created_at: iso(-48), completed_at: null,
  },
];

// ---------------- Inbox ----------------

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-001', tenant_id: 'tenant-demo-001', channel: 'whatsapp',
    contact_id: 'contact-001', contact_name: 'María Fernanda Torres', contact_avatar: null,
    status: 'open', ai_mode: 'suggest',
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    last_message_at: iso(-0.5), last_message_preview: 'Perfecto, entonces te espero el sábado a las 11am 💕',
    last_message_direction: 'outbound',
    unread_count: 0, root_comment_id: null, metadata: null,
  },
  {
    id: 'conv-002', tenant_id: 'tenant-demo-001', channel: 'instagram_dm',
    contact_id: 'contact-002', contact_name: 'Luis Enrique Ramírez', contact_avatar: null,
    status: 'open', ai_mode: 'auto',
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    last_message_at: iso(-1), last_message_preview: 'Hola! Quería preguntar por sus servicios de barbería',
    last_message_direction: 'inbound',
    unread_count: 2, root_comment_id: null, metadata: null,
  },
  {
    id: 'conv-003', tenant_id: 'tenant-demo-001', channel: 'facebook_dm',
    contact_id: 'contact-003', contact_name: 'Ana Sofía Pérez', contact_avatar: null,
    status: 'open', ai_mode: 'disabled',
    assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    last_message_at: iso(-2), last_message_preview: 'Confirmado! Viernes a las 5pm te veo.',
    last_message_direction: 'inbound',
    unread_count: 1, root_comment_id: null, metadata: null,
  },
  {
    id: 'conv-004', tenant_id: 'tenant-demo-001', channel: 'whatsapp',
    contact_id: 'contact-004', contact_name: 'Roberto Cárdenas', contact_avatar: null,
    status: 'open', ai_mode: 'disabled',
    assigned_to_user_id: 'user-owner-001', assigned_to_name: 'Andrea Ríos',
    last_message_at: iso(-6), last_message_preview: 'Gracias! ¿Tienes disponibilidad esta semana?',
    last_message_direction: 'inbound',
    unread_count: 0, root_comment_id: null, metadata: null,
  },
];

export const MOCK_MESSAGES: Record<string, InboxMessage[]> = {
  'conv-001': [
    { id: 'm1-1', conversation_id: 'conv-001', direction: 'inbound', content: 'Hola! Vi su anuncio en Instagram, ¿tienen paquete completo para novia?', content_html: null, media_url: null, media_kind: null, sender_kind: 'contact', sender_user_id: null, sender_name: null, created_at: iso(-3), delivered_at: iso(-3), read_at: iso(-3), error_message: null },
    { id: 'm1-2', conversation_id: 'conv-001', direction: 'outbound', content: '¡Hola María! 😊 Sí, tenemos varios paquetes. El más completo incluye maquillaje, peinado, mani/pedi y prueba previa. ¿Para qué fecha sería?', content_html: null, media_url: null, media_kind: null, sender_kind: 'agent_ai', sender_user_id: null, sender_name: 'IA', created_at: iso(-2.9), delivered_at: iso(-2.9), read_at: iso(-2.5), error_message: null },
    { id: 'm1-3', conversation_id: 'conv-001', direction: 'inbound', content: 'Para el 15 de marzo. Cuánto sale?', content_html: null, media_url: null, media_kind: null, sender_kind: 'contact', sender_user_id: null, sender_name: null, created_at: iso(-2), delivered_at: iso(-2), read_at: iso(-2), error_message: null },
    { id: 'm1-4', conversation_id: 'conv-001', direction: 'outbound', content: 'El paquete completo son $4,500 MXN. Incluye prueba antes del evento. ¿Te agendo para venir a conocernos?', content_html: null, media_url: null, media_kind: null, sender_kind: 'agent_human', sender_user_id: 'user-vendor-002', sender_name: 'Carlos', created_at: iso(-1), delivered_at: iso(-1), read_at: iso(-0.9), error_message: null },
    { id: 'm1-5', conversation_id: 'conv-001', direction: 'inbound', content: 'Sí, ¿puedo el sábado?', content_html: null, media_url: null, media_kind: null, sender_kind: 'contact', sender_user_id: null, sender_name: null, created_at: iso(-0.7), delivered_at: iso(-0.7), read_at: iso(-0.7), error_message: null },
    { id: 'm1-6', conversation_id: 'conv-001', direction: 'outbound', content: 'Perfecto, entonces te espero el sábado a las 11am 💕', content_html: null, media_url: null, media_kind: null, sender_kind: 'agent_human', sender_user_id: 'user-vendor-002', sender_name: 'Carlos', created_at: iso(-0.5), delivered_at: iso(-0.5), read_at: null, error_message: null },
  ],
  'conv-002': [
    { id: 'm2-1', conversation_id: 'conv-002', direction: 'inbound', content: 'Hola! Quería preguntar por sus servicios de barbería', content_html: null, media_url: null, media_kind: null, sender_kind: 'contact', sender_user_id: null, sender_name: null, created_at: iso(-1), delivered_at: iso(-1), read_at: null, error_message: null },
  ],
};

// ---------------- Agenda ----------------

const today9 = new Date(); today9.setHours(9, 0, 0, 0);
const today10 = new Date(today9); today10.setHours(10, 30);
const today11 = new Date(today9); today11.setHours(11, 0);
const today17 = new Date(today9); today17.setHours(17, 0);
const tomorrow11 = new Date(today9); tomorrow11.setDate(tomorrow11.getDate() + 1); tomorrow11.setHours(11);
const tomorrow16 = new Date(tomorrow11); tomorrow16.setHours(16);

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-001', tenant_id: 'tenant-demo-001', crm_lead_id: 'lead-003', contact_id: 'contact-003',
    contact_name: 'Ana Sofía Pérez', service_id: 'srv-treatment', service_name: 'Tratamiento capilar',
    resource_id: 'res-carlos', resource_name: 'Carlos Méndez', location_id: null,
    starts_at: today9.toISOString(), ends_at: today10.toISOString(),
    status: 'confirmed', assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    notes: 'Alergia a productos con amoniaco', price: 2200, currency: 'MXN',
    deposit_paid: true, created_at: iso(-24),
  },
  {
    id: 'appt-002', tenant_id: 'tenant-demo-001', crm_lead_id: null, contact_id: 'contact-005',
    contact_name: 'Isabella García', service_id: 'srv-manicure', service_name: 'Manicure gel',
    resource_id: 'res-carlos', resource_name: 'Carlos Méndez', location_id: null,
    starts_at: today11.toISOString(), ends_at: new Date(today11.getTime() + 60 * 60_000).toISOString(),
    status: 'scheduled', assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    notes: null, price: 450, currency: 'MXN',
    deposit_paid: false, created_at: iso(-48),
  },
  {
    id: 'appt-003', tenant_id: 'tenant-demo-001', crm_lead_id: null, contact_id: 'contact-006',
    contact_name: 'Fernanda Ochoa', service_id: 'srv-color', service_name: 'Corte y color',
    resource_id: 'res-carlos', resource_name: 'Carlos Méndez', location_id: null,
    starts_at: today17.toISOString(), ends_at: new Date(today17.getTime() + 120 * 60_000).toISOString(),
    status: 'confirmed', assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    notes: 'Segunda visita del mes', price: 1800, currency: 'MXN',
    deposit_paid: true, created_at: iso(-72),
  },
  {
    id: 'appt-004', tenant_id: 'tenant-demo-001', crm_lead_id: 'lead-001', contact_id: 'contact-001',
    contact_name: 'María Fernanda Torres', service_id: 'srv-bridal', service_name: 'Paquete de novia',
    resource_id: 'res-carlos', resource_name: 'Carlos Méndez', location_id: null,
    starts_at: tomorrow11.toISOString(), ends_at: new Date(tomorrow11.getTime() + 180 * 60_000).toISOString(),
    status: 'scheduled', assigned_to_user_id: 'user-vendor-002', assigned_to_name: 'Carlos Méndez',
    notes: 'Prueba previa. Trae velo.', price: 4500, currency: 'MXN',
    deposit_paid: false, created_at: iso(-2),
  },
  {
    id: 'appt-005', tenant_id: 'tenant-demo-001', crm_lead_id: null, contact_id: 'contact-007',
    contact_name: 'Diana Ramos', service_id: 'srv-manicure', service_name: 'Manicure gel',
    resource_id: 'res-andrea', resource_name: 'Andrea Ríos', location_id: null,
    starts_at: tomorrow16.toISOString(), ends_at: new Date(tomorrow16.getTime() + 60 * 60_000).toISOString(),
    status: 'scheduled', assigned_to_user_id: 'user-owner-001', assigned_to_name: 'Andrea Ríos',
    notes: null, price: 450, currency: 'MXN',
    deposit_paid: false, created_at: iso(-6),
  },
];

// ---------------- Stats mock ----------------

export const MOCK_INBOX_STATS = {
  unread_total: 3,
  open_total: 4,
  assigned_to_me: 3,
  unassigned: 1,
  by_channel: { whatsapp: 2, instagram_dm: 1, facebook_dm: 1 },
};

export const MOCK_CRM_STATUS = {
  active_leads: 4,
  unassigned: 1,
  won_this_month: 11,
  lost_this_month: 3,
  open_deals: 2,
  tasks_due_today: 4,
};

export const MOCK_AGENDA_STATUS = {
  today_count: 3,
  upcoming_count: 5,
  completed_this_week: 12,
  no_shows_this_month: 1,
};

// ---------------- Agenda: Servicios & Recursos ----------------

export const MOCK_SERVICES: AgendaService[] = [
  { id: 'srv-haircut', name: 'Corte de cabello', duration_minutes: 45, price: 350, currency: 'MXN', color: '#FF5637', active: true },
  { id: 'srv-color', name: 'Corte y color', duration_minutes: 120, price: 1800, currency: 'MXN', color: '#FF45A1', active: true },
  { id: 'srv-treatment', name: 'Tratamiento capilar', duration_minutes: 90, price: 2200, currency: 'MXN', color: '#FFBA20', active: true },
  { id: 'srv-manicure', name: 'Manicure gel', duration_minutes: 60, price: 450, currency: 'MXN', color: '#22C55E', active: true },
  { id: 'srv-bridal', name: 'Paquete de novia', duration_minutes: 180, price: 4500, currency: 'MXN', color: '#8B5CF6', active: true },
];

export const MOCK_RESOURCES: AgendaResource[] = [
  { id: 'res-carlos', name: 'Carlos Méndez', user_id: 'user-vendor-002', location_id: null, active: true },
  { id: 'res-andrea', name: 'Andrea Ríos', user_id: 'user-owner-001', location_id: null, active: true },
  { id: 'res-sofia', name: 'Sofía Lugo', user_id: null, location_id: null, active: true },
];

/**
 * Genera slots de disponibilidad de 09:00 a 19:00 en pasos de 30 min.
 * Marca no disponibles: los que se solapan con citas existentes del recurso
 * y la hora de comida (14:00). Contrato idéntico al GET /availability real.
 */
export function buildMockAvailability(params: { date: string; service_id?: string; resource_id?: string }): AvailabilityResponse {
  const service = MOCK_SERVICES.find((s) => s.id === params.service_id) ?? null;
  const duration = service?.duration_minutes ?? 60;
  const base = new Date(`${params.date}T00:00:00`);

  const dayAppointments = MOCK_APPOINTMENTS.filter((a) => {
    const d = new Date(a.starts_at);
    return d.getFullYear() === base.getFullYear()
      && d.getMonth() === base.getMonth()
      && d.getDate() === base.getDate()
      && (!params.resource_id || a.resource_id === params.resource_id)
      && a.status !== 'cancelled';
  });

  const slots: AvailabilitySlot[] = [];
  for (let h = 9; h < 19; h++) {
    for (const m of [0, 30]) {
      const start = new Date(base); start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + duration * 60_000);
      // Excluir si termina después de las 19:30
      if (end.getHours() > 19 || (end.getHours() === 19 && end.getMinutes() > 30)) continue;

      const overlaps = dayAppointments.some((a) => {
        const as = new Date(a.starts_at).getTime();
        const ae = new Date(a.ends_at).getTime();
        return start.getTime() < ae && end.getTime() > as;
      });
      const isLunch = h === 14; // comida

      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        available: !overlaps && !isLunch,
        resource_id: params.resource_id ?? null,
      });
    }
  }

  return {
    date: params.date,
    service_id: params.service_id ?? null,
    resource_id: params.resource_id ?? null,
    slots,
  };
}

/** Crea una cita mock, la agrega a MOCK_APPOINTMENTS y la devuelve resuelta. */
export function createMockAppointment(payload: CreateAppointmentPayload): Appointment {
  const service = MOCK_SERVICES.find((s) => s.id === payload.service_id) ?? null;
  const resource = MOCK_RESOURCES.find((r) => r.id === payload.resource_id) ?? null;
  const user = Object.values(MOCK_USERS).find((u) => u.id === payload.assigned_to_user_id) ?? null;

  const appt: Appointment = {
    id: `appt-${Date.now().toString(36)}`,
    tenant_id: 'tenant-demo-001',
    crm_lead_id: payload.crm_lead_id ?? null,
    contact_id: payload.contact_id ?? null,
    contact_name: payload.contact_name ?? null,
    service_id: payload.service_id,
    service_name: service?.name ?? null,
    resource_id: payload.resource_id ?? null,
    resource_name: resource?.name ?? null,
    location_id: null,
    starts_at: payload.starts_at,
    ends_at: payload.ends_at,
    status: 'scheduled',
    assigned_to_user_id: payload.assigned_to_user_id ?? null,
    assigned_to_name: user?.name ?? null,
    notes: payload.notes ?? null,
    price: service?.price ?? null,
    currency: service?.currency ?? 'MXN',
    deposit_paid: false,
    created_at: new Date().toISOString(),
  };
  MOCK_APPOINTMENTS.push(appt);
  return appt;
}
