// src/api/mockData.ts — Datos mock para preview de la app sin backend
// Solo se usan cuando EXPO_PUBLIC_MOCK_MODE=true.
// Dataset "ambientado": ~10 meses de histórico generado de forma DETERMINISTA
// (semilla fija → siempre la misma data) con nombres/teléfonos/correos realistas MX.
// La app se ve y navega como en producción sin llamar al SaaS real.

import type {
  Appointment, Conversation, Deal, InboxMessage, Lead, Task, AuthUser,
  AgendaService, AgendaResource, AvailabilitySlot, AvailabilityResponse, CreateAppointmentPayload,
  LeadStatus, DealStatus, AppointmentStatus, InboxChannel, VirtualCard,
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

const OWNER = 'user-owner-001';
const OWNER_NAME = 'Andrea Ríos';
const VENDOR = 'user-vendor-002';
const VENDOR_NAME = 'Carlos Méndez';
const TENANT = 'tenant-demo-001';

// ---------------- RNG determinista (mulberry32) ----------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260724);
const rand = () => rng();
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;

// ---------------- Helpers de fecha ----------------

const NOW = new Date();
function atTime(base: Date, h: number, m = 0): Date {
  const d = new Date(base); d.setHours(h, m, 0, 0); return d;
}
function daysFromNow(days: number): Date {
  const d = new Date(NOW); d.setDate(d.getDate() + days); return d;
}
function isoDaysAgo(days: number, h = 10, m = 0): string {
  const d = daysFromNow(-days); d.setHours(h, m, 0, 0); return d.toISOString();
}

// ---------------- Pools de datos realistas MX ----------------

const FIRST = [
  'María Fernanda', 'Luis Enrique', 'Ana Sofía', 'Roberto', 'Fernanda', 'Diego', 'Isabella',
  'Valentina', 'Sofía', 'Miguel Ángel', 'Regina', 'Alejandro', 'Camila', 'José Luis', 'Daniela',
  'Ricardo', 'Paola', 'Emiliano', 'Ximena', 'Andrés', 'Renata', 'Gabriel', 'Mariana', 'Héctor',
  'Lucía', 'Rodrigo', 'Ángela', 'Sebastián', 'Natalia', 'Patricio', 'Montserrat', 'Iván',
] as const;
const LAST = [
  'Torres', 'Ramírez', 'Pérez', 'Cárdenas', 'Ochoa', 'García', 'Lugo', 'Hernández', 'Vázquez',
  'Flores', 'Castillo', 'Romero', 'Domínguez', 'Reyes', 'Aguilar', 'Mendoza', 'Guerrero',
  'Rosales', 'Ibarra', 'Navarro', 'Salazar', 'Cortés', 'Delgado', 'Fuentes', 'Peña', 'Rivas',
  'Campos', 'Zamora', 'Vega', 'Bautista', 'Solís', 'Cabrera',
] as const;
const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com.mx', 'icloud.com'] as const;

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.').toLowerCase();
}
function makePhone(i: number): string {
  const a = String(1000 + ((i * 3797) % 9000));
  const b = String(1000 + ((i * 6421) % 9000));
  return `+52 55 ${a} ${b}`;
}

interface Person {
  idx: number;
  name: string;
  phone: string;
  email: string | null;
  contact_id: string;
}

const PEOPLE: Person[] = Array.from({ length: 32 }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`;
  const hasEmail = chance(0.82);
  const email = hasEmail
    ? `${stripAccents(name)}${chance(0.3) ? randInt(1, 99) : ''}@${pick(EMAIL_DOMAINS)}`
    : null;
  return { idx: i, name, phone: makePhone(i + 1), email, contact_id: `contact-${String(i + 1).padStart(3, '0')}` };
});

const SOURCES = [
  { source_type: 'whatsapp_ad', source_name: 'Meta Ads · Corte y color', channel: 'whatsapp', medium: 'paid_social', campaign: 'Verano 2026' },
  { source_type: 'instagram_dm', source_name: 'DM directo', channel: 'instagram_dm', medium: 'organic', campaign: null },
  { source_type: 'facebook_ad', source_name: 'Meta Ads · Tratamiento capilar', channel: 'facebook_dm', medium: 'paid_social', campaign: 'Reactivación Otoño' },
  { source_type: 'referral', source_name: 'Recomendación de cliente', channel: 'whatsapp', medium: 'referral', campaign: null },
  { source_type: 'google_ad', source_name: 'Google Ads · Salón cerca de mí', channel: 'whatsapp', medium: 'paid_search', campaign: 'Search Marca' },
  { source_type: 'tiktok_ad', source_name: 'TikTok Ads · Antes y después', channel: 'instagram_dm', medium: 'paid_social', campaign: 'UGC Enero' },
  { source_type: 'organic_web', source_name: 'Formulario del sitio', channel: 'email', medium: 'organic', campaign: null },
] as const;

const STAGES_BY_STATUS: Record<string, string> = {
  new: 'nuevo', active: 'contactado', won: 'ganado', lost: 'perdido', archived: 'archivado',
};
const LOSS_REASONS = ['Precio', 'Eligió competencia', 'Sin respuesta', 'No era el momento', 'Fuera de zona'];

// ---------------- CRM: Leads (26, histórico ~10 meses) ----------------

const LEAD_STATUSES: LeadStatus[] = ['won', 'won', 'lost', 'active', 'active', 'new', 'archived'];

export const MOCK_LEADS: Lead[] = Array.from({ length: 26 }, (_, i) => {
  const p = PEOPLE[i];
  const src = SOURCES[i % SOURCES.length];
  const status: LeadStatus = i < 4 ? (['active', 'new', 'active', 'active'] as LeadStatus[])[i] : pick(LEAD_STATUSES);
  // Repartir asignación: ~50% Carlos, ~35% Andrea, ~15% sin asignar
  const roll = rand();
  const assigned = status === 'new' && chance(0.5)
    ? { id: null as string | null, name: null as string | null }
    : roll < 0.5 ? { id: VENDOR, name: VENDOR_NAME }
    : roll < 0.85 ? { id: OWNER, name: OWNER_NAME }
    : { id: null, name: null };

  const createdAgo = randInt(3, 300); // hasta ~10 meses
  const lastActAgo = Math.max(0, createdAgo - randInt(0, Math.min(createdAgo, 40)));

  return {
    id: `lead-${String(i + 1).padStart(3, '0')}`,
    tenant_id: TENANT,
    display_name: p.name,
    primary_phone: p.phone,
    primary_email: p.email,
    status,
    stage: STAGES_BY_STATUS[status],
    source_type: src.source_type,
    source_name: src.source_name,
    campaign_name: src.campaign,
    channel: src.channel,
    medium: src.medium,
    assigned_to_user_id: assigned.id,
    assigned_to_name: assigned.name,
    pool_id: null,
    branch_id: null,
    contact_id: p.contact_id,
    created_at: isoDaysAgo(createdAgo, randInt(9, 19), pick([0, 15, 30, 45])),
    updated_at: isoDaysAgo(lastActAgo, randInt(9, 19)),
    last_activity_at: isoDaysAgo(lastActAgo, randInt(9, 19)),
    next_action_at: status === 'active' || status === 'new'
      ? daysFromNow(randInt(-2, 6)).toISOString()
      : null,
    notes: pick([
      'Interesada en paquete de novia. Prefiere sábados.',
      'Pidió cotización por WhatsApp, dar seguimiento.',
      'Cliente frecuente, trato preferente.',
      'Alergia a productos con amoniaco.',
      'Recomendado por otra clienta.',
      null, null,
    ]),
    score: randInt(35, 98),
  };
});

const activeLeads = MOCK_LEADS.filter((l) => l.assigned_to_user_id);

// ---------------- CRM: Deals / Pipeline (histórico de ingresos) ----------------

const OPEN_STAGES = [
  { key: 'quote', name: 'Cotización' },
  { key: 'negotiation', name: 'Negociación' },
  { key: 'contacted', name: 'Contactado' },
] as const;

export const MOCK_DEALS: Deal[] = Array.from({ length: 24 }, (_, i) => {
  const lead = MOCK_LEADS[(i * 5 + 2) % MOCK_LEADS.length];
  const r = rand();
  const status: DealStatus = r < 0.45 ? 'won' : r < 0.7 ? 'lost' : 'open';
  const amount = pick([350, 450, 600, 850, 1200, 1800, 2200, 3200, 4500, 6000]);
  const createdAgo = randInt(10, 300);
  const closedAgo = Math.max(1, createdAgo - randInt(3, 30));
  const stage = status === 'won'
    ? { key: 'won', name: 'Ganado' }
    : status === 'lost'
    ? { key: 'lost', name: 'Perdido' }
    : pick(OPEN_STAGES);

  return {
    id: `deal-${String(i + 1).padStart(3, '0')}`,
    lead_id: lead.id,
    contact_id: lead.contact_id ?? `contact-${i + 1}`,
    pipeline_id: 'pipe-default',
    stage_id: `stage-${stage.key}`,
    stage_key: stage.key,
    stage_name: stage.name,
    status,
    amount,
    currency: 'MXN',
    probability: status === 'won' ? 100 : status === 'lost' ? 0 : pick([30, 50, 60, 75]),
    expected_close_date: status === 'open' ? daysFromNow(randInt(1, 20)).toISOString() : null,
    assigned_to_user_id: lead.assigned_to_user_id ?? VENDOR,
    assigned_to_name: lead.assigned_to_name ?? VENDOR_NAME,
    title: `${pick(['Paquete', 'Servicio', 'Tratamiento', 'Cotización'])} — ${lead.display_name}`,
    created_at: isoDaysAgo(createdAgo),
    updated_at: isoDaysAgo(status === 'open' ? randInt(0, 5) : closedAgo),
    won_at: status === 'won' ? isoDaysAgo(closedAgo) : null,
    lost_at: status === 'lost' ? isoDaysAgo(closedAgo) : null,
    loss_reason: status === 'lost' ? pick(LOSS_REASONS) : null,
  };
});

// ---------------- CRM: Tareas ----------------

const TASK_TITLES = [
  'Llamar para confirmar cotización', 'Enviar catálogo por WhatsApp', 'Preparar propuesta VIP',
  'Dar seguimiento post-servicio', 'Recordar cita de mañana', 'Cobrar anticipo pendiente',
  'Reagendar cita cancelada', 'Pedir reseña en Google', 'Confirmar disponibilidad de producto',
];

export const MOCK_TASKS: Task[] = Array.from({ length: 16 }, (_, i) => {
  const lead = activeLeads[i % activeLeads.length];
  const r = rand();
  const status: Task['status'] = r < 0.4 ? 'done' : r < 0.55 ? 'in_progress' : 'pending';
  const dueOffset = status === 'done' ? randInt(-40, -1) : randInt(-2, 10);
  return {
    id: `task-${String(i + 1).padStart(3, '0')}`,
    tenant_id: TENANT,
    title: pick(TASK_TITLES),
    description: chance(0.5) ? 'Detalle de la tarea para dar seguimiento al cliente.' : null,
    status,
    priority: pick(['low', 'medium', 'high', 'high'] as const),
    due_at: daysFromNow(dueOffset).toISOString(),
    assigned_to_user_id: lead.assigned_to_user_id,
    assigned_to_name: lead.assigned_to_name,
    lead_id: lead.id,
    deal_id: chance(0.4) ? pick(MOCK_DEALS).id : null,
    contact_id: lead.contact_id,
    created_at: isoDaysAgo(randInt(1, 60)),
    completed_at: status === 'done' ? daysFromNow(dueOffset).toISOString() : null,
  };
});

// ---------------- Inbox: Conversaciones + Mensajes ----------------

const CHANNELS: InboxChannel[] = ['whatsapp', 'whatsapp', 'instagram_dm', 'facebook_dm', 'whatsapp', 'sms', 'email'];
const INBOUND_SNIPPETS = [
  'Hola! Vi su anuncio, ¿tienen disponibilidad esta semana?',
  '¿Cuánto cuesta el paquete completo?',
  'Quiero agendar para el sábado por la mañana 🙌',
  '¿Manejan pago con tarjeta?',
  'Gracias! ¿A qué hora abren?',
  '¿Puedo mover mi cita a otro día?',
  'Me encantó el resultado, muchas gracias 💕',
];
const OUTBOUND_SNIPPETS = [
  '¡Hola! Claro, con gusto te ayudo 😊 ¿Para qué fecha buscas?',
  'El paquete completo son $2,200 MXN e incluye prueba previa.',
  'Perfecto, te agendo. ¿Te queda bien a las 11:00?',
  'Sí, aceptamos tarjeta y transferencia.',
  '¡Con gusto! Te esperamos 💫',
];

export const MOCK_CONVERSATIONS: Conversation[] = Array.from({ length: 12 }, (_, i) => {
  const p = PEOPLE[i + 4];
  const channel = CHANNELS[i % CHANNELS.length];
  const inbound = chance(0.55);
  const lastAgoHours = i < 4 ? [0.4, 1, 2, 6][i] : randInt(8, 24 * 20);
  const assigned = chance(0.6) ? { id: VENDOR, name: VENDOR_NAME } : { id: OWNER, name: OWNER_NAME };
  const unread = inbound ? randInt(0, 3) : 0;
  return {
    id: `conv-${String(i + 1).padStart(3, '0')}`,
    tenant_id: TENANT,
    channel,
    contact_id: p.contact_id,
    contact_name: p.name,
    contact_avatar: null,
    status: 'open',
    ai_mode: pick(['auto', 'suggest', 'disabled'] as const),
    assigned_to_user_id: assigned.id,
    assigned_to_name: assigned.name,
    last_message_at: new Date(NOW.getTime() - lastAgoHours * 3600_000).toISOString(),
    last_message_preview: inbound ? pick(INBOUND_SNIPPETS) : pick(OUTBOUND_SNIPPETS),
    last_message_direction: inbound ? 'inbound' : 'outbound',
    unread_count: unread,
    root_comment_id: null,
    metadata: null,
  };
});

export const MOCK_MESSAGES: Record<string, InboxMessage[]> = {};
MOCK_CONVERSATIONS.forEach((conv) => {
  const count = randInt(3, 7);
  const msgs: InboxMessage[] = [];
  const startAgo = new Date(conv.last_message_at).getTime() - count * randInt(20, 90) * 60_000;
  for (let j = 0; j < count; j++) {
    const inbound = j % 2 === 0;
    const t = new Date(startAgo + j * randInt(20, 90) * 60_000).toISOString();
    msgs.push({
      id: `${conv.id}-m${j + 1}`,
      conversation_id: conv.id,
      direction: inbound ? 'inbound' : 'outbound',
      content: inbound ? pick(INBOUND_SNIPPETS) : pick(OUTBOUND_SNIPPETS),
      content_html: null, media_url: null, media_kind: null,
      sender_kind: inbound ? 'contact' : (chance(0.3) ? 'agent_ai' : 'agent_human'),
      sender_user_id: inbound ? null : conv.assigned_to_user_id,
      sender_name: inbound ? null : (conv.assigned_to_name ?? 'IA'),
      created_at: t,
      delivered_at: t,
      read_at: inbound ? t : (chance(0.7) ? t : null),
      error_message: null,
    });
  }
  MOCK_MESSAGES[conv.id] = msgs;
});

// ---------------- Agenda: Servicios & Recursos ----------------

export const MOCK_SERVICES: AgendaService[] = [
  { id: 'srv-haircut', name: 'Corte de cabello', duration_minutes: 45, price: 350, currency: 'MXN', color: '#FF5637', active: true },
  { id: 'srv-color', name: 'Corte y color', duration_minutes: 120, price: 1800, currency: 'MXN', color: '#FF45A1', active: true },
  { id: 'srv-treatment', name: 'Tratamiento capilar', duration_minutes: 90, price: 2200, currency: 'MXN', color: '#FFBA20', active: true },
  { id: 'srv-manicure', name: 'Manicure gel', duration_minutes: 60, price: 450, currency: 'MXN', color: '#22C55E', active: true },
  { id: 'srv-bridal', name: 'Paquete de novia', duration_minutes: 180, price: 4500, currency: 'MXN', color: '#8B5CF6', active: true },
];

export const MOCK_RESOURCES: AgendaResource[] = [
  { id: 'res-carlos', name: 'Carlos Méndez', user_id: VENDOR, location_id: null, active: true },
  { id: 'res-andrea', name: 'Andrea Ríos', user_id: OWNER, location_id: null, active: true },
  { id: 'res-sofia', name: 'Sofía Lugo', user_id: null, location_id: null, active: true },
];

// ---------------- Agenda: Citas (histórico ~10 meses + próximas) ----------------

function buildAppointments(): Appointment[] {
  const out: Appointment[] = [];
  let seq = 1;
  // De 300 días atrás hasta 14 días adelante
  for (let offset = -300; offset <= 14; offset++) {
    const day = daysFromNow(offset);
    const dow = day.getDay();
    if (dow === 0) continue; // domingo cerrado
    // densidad: pasado ~50% de tener citas, futuro un poco más
    const nAppts = chance(offset < -14 ? 0.42 : 0.6) ? randInt(1, 3) : 0;
    const usedHours: number[] = [];
    for (let k = 0; k < nAppts; k++) {
      const svc = pick(MOCK_SERVICES);
      let hour = randInt(9, 17);
      let guard = 0;
      while (usedHours.includes(hour) && guard++ < 5) hour = randInt(9, 17);
      usedHours.push(hour);
      const start = atTime(day, hour, pick([0, 30]));
      const end = new Date(start.getTime() + svc.duration_minutes * 60_000);
      const res = pick(MOCK_RESOURCES);
      const person = PEOPLE[randInt(0, PEOPLE.length - 1)];
      const assignedId = res.user_id ?? (chance(0.6) ? VENDOR : OWNER);
      const assignedName = assignedId === VENDOR ? VENDOR_NAME : OWNER_NAME;

      let status: AppointmentStatus;
      if (offset < -1) {
        const r = rand();
        status = r < 0.74 ? 'completed' : r < 0.87 ? 'cancelled' : 'no_show';
      } else if (offset <= 1) {
        status = chance(0.5) ? 'confirmed' : 'in_progress';
      } else {
        status = chance(0.55) ? 'confirmed' : 'scheduled';
      }

      const linkedLead = chance(0.5) ? pick(MOCK_LEADS) : null;

      out.push({
        id: `appt-${String(seq++).padStart(4, '0')}`,
        tenant_id: TENANT,
        crm_lead_id: linkedLead?.id ?? null,
        contact_id: linkedLead?.contact_id ?? person.contact_id,
        contact_name: linkedLead?.display_name ?? person.name,
        service_id: svc.id,
        service_name: svc.name,
        resource_id: res.id,
        resource_name: res.name,
        location_id: null,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status,
        assigned_to_user_id: assignedId,
        assigned_to_name: assignedName,
        notes: chance(0.35) ? pick(['Trae referencia de color', 'Segunda visita del mes', 'Alergia a amoniaco', 'Prueba previa']) : null,
        price: svc.price,
        currency: svc.currency,
        deposit_paid: chance(0.55),
        created_at: new Date(start.getTime() - randInt(1, 20) * 86400_000).toISOString(),
      });
    }
  }

  // Bloque garantizado para HOY — que la vista Día (default) y "Citas hoy"
  // siempre luzcan pobladas al abrir la app.
  const today = daysFromNow(0);
  const guaranteed: Array<{ h: number; svc: string; res: string; person: number; status: AppointmentStatus }> = [
    { h: 10, svc: 'srv-color', res: 'res-carlos', person: 0, status: 'confirmed' },
    { h: 12, svc: 'srv-manicure', res: 'res-andrea', person: 5, status: 'confirmed' },
    { h: 13, svc: 'srv-haircut', res: 'res-carlos', person: 8, status: 'scheduled' },
    { h: 16, svc: 'srv-treatment', res: 'res-carlos', person: 11, status: 'scheduled' },
    { h: 18, svc: 'srv-manicure', res: 'res-andrea', person: 14, status: 'confirmed' },
  ];
  guaranteed.forEach((g) => {
    const svc = MOCK_SERVICES.find((s) => s.id === g.svc)!;
    const res = MOCK_RESOURCES.find((r) => r.id === g.res)!;
    const person = PEOPLE[g.person];
    const start = atTime(today, g.h, 0);
    const end = new Date(start.getTime() + svc.duration_minutes * 60_000);
    const assignedId = res.user_id ?? VENDOR;
    out.push({
      id: `appt-${String(seq++).padStart(4, '0')}`,
      tenant_id: TENANT,
      crm_lead_id: null,
      contact_id: person.contact_id,
      contact_name: person.name,
      service_id: svc.id,
      service_name: svc.name,
      resource_id: res.id,
      resource_name: res.name,
      location_id: null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: g.status,
      assigned_to_user_id: assignedId,
      assigned_to_name: assignedId === VENDOR ? VENDOR_NAME : OWNER_NAME,
      notes: null,
      price: svc.price,
      currency: svc.currency,
      deposit_paid: g.status === 'confirmed',
      created_at: isoDaysAgo(randInt(2, 10)),
    });
  });

  return out;
}

export const MOCK_APPOINTMENTS: Appointment[] = buildAppointments();

// ---------------- Stats (computados desde la data para consistencia) ----------------

const isSameDayLocal = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const withinDays = (iso: string, days: number) => {
  const t = new Date(iso).getTime();
  return t >= NOW.getTime() - days * 86400_000 && t <= NOW.getTime();
};
const thisMonth = (iso: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === NOW.getFullYear() && d.getMonth() === NOW.getMonth();
};

const wonThisMonth = MOCK_DEALS.filter((d) => d.status === 'won' && thisMonth(d.won_at));
const lostThisMonth = MOCK_DEALS.filter((d) => d.status === 'lost' && thisMonth(d.lost_at));
const wonThisWeek = MOCK_DEALS.filter((d) => d.status === 'won' && d.won_at && withinDays(d.won_at, 7));
const revenueThisWeek = wonThisWeek.reduce((s, d) => s + (d.amount ?? 0), 0);

// Serie de ingresos por mes (últimos 6 meses) — para la mini-gráfica del Dashboard.
const MONTH_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const revenueSeries = Array.from({ length: 6 }, (_, k) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - (5 - k), 1);
  const total = MOCK_DEALS
    .filter((dl) => {
      if (dl.status !== 'won' || !dl.won_at) return false;
      const w = new Date(dl.won_at);
      return w.getFullYear() === d.getFullYear() && w.getMonth() === d.getMonth();
    })
    .reduce((s, dl) => s + (dl.amount ?? 0), 0);
  return { month: MONTH_ABBR[d.getMonth()], total };
});

const todayAppts = MOCK_APPOINTMENTS.filter((a) => isSameDayLocal(new Date(a.starts_at), NOW));
const upcomingAppts = MOCK_APPOINTMENTS.filter((a) => {
  const t = new Date(a.starts_at).getTime();
  return t >= NOW.getTime() && t <= NOW.getTime() + 7 * 86400_000;
});
const completedThisWeek = MOCK_APPOINTMENTS.filter((a) => a.status === 'completed' && withinDays(a.starts_at, 7));
const noShowsThisMonth = MOCK_APPOINTMENTS.filter((a) => a.status === 'no_show' && thisMonth(a.starts_at));

const newLeadsToday = MOCK_LEADS.filter((l) => isSameDayLocal(new Date(l.created_at), NOW));
const leadsThisWeek = MOCK_LEADS.filter((l) => withinDays(l.created_at, 7));
const unassignedLeads = MOCK_LEADS.filter((l) => !l.assigned_to_user_id && l.status !== 'archived');
const overdueTasks = MOCK_TASKS.filter((t) => t.status !== 'done' && t.due_at && new Date(t.due_at).getTime() < NOW.getTime());
const tasksDueToday = MOCK_TASKS.filter((t) => t.status !== 'done' && t.due_at && isSameDayLocal(new Date(t.due_at), NOW));
const unreadConvs = MOCK_CONVERSATIONS.filter((c) => c.unread_count > 0);
const staleConvs = MOCK_CONVERSATIONS.filter((c) => c.last_message_direction === 'inbound' && !withinDays(c.last_message_at, 0.1));

// ---------------- Dashboard ----------------

export const MOCK_DASHBOARD: DashboardSummary = {
  business_name: 'Salón Bella Época',
  vertical: 'beauty',
  timezone: 'America/Mexico_City',
  today: {
    new_leads: newLeadsToday.length,
    unread_conversations: unreadConvs.reduce((s, c) => s + c.unread_count, 0),
    upcoming_appointments: todayAppts.filter((a) => new Date(a.starts_at).getTime() >= NOW.getTime()).length,
    tasks_due_today: tasksDueToday.length,
  },
  week: {
    leads: leadsThisWeek.length,
    conversions: wonThisWeek.length,
    revenue: revenueThisWeek,
    currency: 'MXN',
  },
  revenue_series: revenueSeries,
  attention_needed: ([
    { kind: 'unassigned_lead', count: unassignedLeads.length, label: 'Leads sin asignar' },
    { kind: 'stale_conversation', count: staleConvs.length, label: 'Conversaciones sin responder' },
    { kind: 'overdue_task', count: overdueTasks.length, label: 'Tareas vencidas del equipo' },
    { kind: 'no_show_appointment', count: noShowsThisMonth.length, label: 'No-shows este mes' },
  ] as DashboardSummary['attention_needed']).filter((a) => a.count > 0),
};

// ---------------- Stats mock ----------------

const channelCounts: Record<string, number> = {};
MOCK_CONVERSATIONS.forEach((c) => { channelCounts[c.channel] = (channelCounts[c.channel] ?? 0) + 1; });

export const MOCK_INBOX_STATS = {
  unread_total: unreadConvs.reduce((s, c) => s + c.unread_count, 0),
  open_total: MOCK_CONVERSATIONS.filter((c) => c.status === 'open').length,
  assigned_to_me: MOCK_CONVERSATIONS.filter((c) => c.assigned_to_user_id === VENDOR).length,
  unassigned: MOCK_CONVERSATIONS.filter((c) => !c.assigned_to_user_id).length,
  by_channel: channelCounts,
};

export const MOCK_CRM_STATUS = {
  active_leads: MOCK_LEADS.filter((l) => l.status === 'active' || l.status === 'new').length,
  unassigned: unassignedLeads.length,
  won_this_month: wonThisMonth.length,
  lost_this_month: lostThisMonth.length,
  open_deals: MOCK_DEALS.filter((d) => d.status === 'open').length,
  tasks_due_today: tasksDueToday.length,
};

export const MOCK_AGENDA_STATUS = {
  today_count: todayAppts.length,
  upcoming_count: upcomingAppts.length,
  completed_this_week: completedThisWeek.length,
  no_shows_this_month: noShowsThisMonth.length,
};

// ---------------- Availability & creación (usados por la hoja "Nueva Cita") ----------------

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
    id: `appt-new-${Date.now().toString(36)}`,
    tenant_id: TENANT,
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

// ---------------- Tarjeta Virtual (mock por usuario) ----------------

export const MOCK_VIRTUAL_CARDS: Record<string, VirtualCard> = {
  'user-owner-001': {
    user_id: 'user-owner-001',
    name: 'Andrea Ríos',
    position: 'Directora & Estilista Master',
    company: 'Salón Bella Época',
    bio: 'Más de 15 años transformando la imagen de mis clientas. Especialista en colorimetría, tratamientos capilares premium y paquetes de novia. Tu confianza es mi mejor carta de presentación.',
    phone: '+52 55 1234 5678',
    email: 'andrea.rios@bellaepoca.mx',
    whatsapp: '+52 55 1234 5678',
    slug: 'andrea-rios',
    socials: [
      { platform: 'instagram', enabled: true, url: 'https://instagram.com/andrea.bellaepoca' },
      { platform: 'facebook', enabled: true, url: 'https://facebook.com/bellaepocasalon' },
      { platform: 'tiktok', enabled: true, url: 'https://tiktok.com/@bellaepoca' },
      { platform: 'linkedin', enabled: false, url: '' },
      { platform: 'threads', enabled: false, url: '' },
    ],
    links: [
      { id: 'lnk-catalog', label: 'Catálogo de servicios', sublabel: 'Precios y paquetes 2026', url: 'https://bellaepoca.mx/servicios', enabled: true, icon: 'pricetags-outline' },
      { id: 'lnk-booking', label: 'Reserva en línea', sublabel: 'Agenda tu cita 24/7', url: 'https://bellaepoca.mx/reservar', enabled: true, icon: 'calendar-outline' },
      { id: 'lnk-portfolio', label: 'Portafolio de trabajos', sublabel: 'Antes y después', url: 'https://instagram.com/andrea.bellaepoca', enabled: true, icon: 'images-outline' },
    ],
    credentials: [
      { id: 'cr-1', title: 'Certificación L\'Oréal Professionnel', year: '2019' },
      { id: 'cr-2', title: 'Colorimetría Avanzada · Wella', year: '2021' },
      { id: 'cr-3', title: 'Diplomado en Imagen de Novia', year: '2023' },
    ],
  },
  'user-vendor-002': {
    user_id: 'user-vendor-002',
    name: 'Carlos Méndez',
    position: 'Estilista Senior',
    company: 'Salón Bella Época',
    bio: 'Apasionado por los cortes de tendencia y el cuidado masculino. Agenda conmigo y platiquemos el look que buscas.',
    phone: '+52 55 8765 4321',
    email: 'carlos.mendez@bellaepoca.mx',
    whatsapp: '+52 55 8765 4321',
    slug: 'carlos-mendez',
    socials: [
      { platform: 'instagram', enabled: true, url: 'https://instagram.com/carlos.stylist' },
      { platform: 'tiktok', enabled: true, url: 'https://tiktok.com/@carloscortes' },
      { platform: 'facebook', enabled: false, url: '' },
      { platform: 'linkedin', enabled: false, url: '' },
      { platform: 'threads', enabled: false, url: '' },
    ],
    links: [
      { id: 'lnk-booking', label: 'Reserva en línea', sublabel: 'Agenda tu cita', url: 'https://bellaepoca.mx/reservar', enabled: true, icon: 'calendar-outline' },
      { id: 'lnk-portfolio', label: 'Mis trabajos', sublabel: 'Galería de cortes', url: 'https://instagram.com/carlos.stylist', enabled: true, icon: 'images-outline' },
    ],
    credentials: [
      { id: 'cr-1', title: 'Barbería Clásica · American Crew', year: '2022' },
    ],
  },
};
