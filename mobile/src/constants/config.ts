// src/constants/config.ts
// Configuración central de la app — leída de EXPO_PUBLIC_* env vars

export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? 'https://app.cavernicolapp.com';
export const DEV_MODE: boolean = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
export const DEBUG: boolean = process.env.EXPO_PUBLIC_DEBUG === 'true';
export const MOCK_MODE: boolean = process.env.EXPO_PUBLIC_MOCK_MODE === 'true';

// API endpoints — mismos que expone el SaaS actual
export const API = {
  auth: {
    login: '/api/auth/login',
    // Endpoint móvil dedicado (a construir en el SaaS por Claude/Grok).
    // Devuelve Bearer token en JSON en vez de solo cookies, y skipea Turnstile
    // validando App Attest (iOS) / Play Integrity (Android).
    loginMobile: '/api/mobile/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
    activity: '/api/auth/session/activity',
  },
  mfa: {
    verify: '/api/mfa/verify',
  },
  dashboard: {
    businessHub: '/api/tenant/business-hub/summary',
    observability: '/api/tenant/observability/dashboard',
    crmStatus: '/api/tenant/crm/status',
    agendaStatus: '/api/tenant/agenda/status',
    inboxStats: '/api/tenant/inbox/stats',
  },
  crm: {
    leads: '/api/tenant/crm/leads',
    lead: (id: string) => `/api/tenant/crm/leads/${id}`,
    deals: '/api/tenant/crm/deals',
    deal: (id: string) => `/api/tenant/crm/deals/${id}`,
    dealStage: (id: string) => `/api/tenant/crm/deals/${id}/stage`,
    tasks: '/api/tenant/crm/tasks',
    contacts: '/api/tenant/contacts',
    contactTimeline: (id: string) => `/api/tenant/contacts/${id}/timeline`,
    pipelines: '/api/tenant/crm/pipelines',
    defaultPipeline: '/api/tenant/crm/pipelines/default',
    lossReasons: '/api/tenant/crm/deals/loss-reasons',
  },
  inbox: {
    conversations: '/api/tenant/inbox/conversations',
    conversationsGrouped: '/api/tenant/inbox/conversations/grouped',
    conversation: (id: string) => `/api/tenant/inbox/conversations/${id}`,
    messages: (id: string) => `/api/tenant/inbox/conversations/${id}/messages`,
    reply: '/api/tenant/inbox/reply',
    takeover: (id: string) => `/api/tenant/inbox/conversations/${id}/takeover`,
    aiMode: (id: string) => `/api/tenant/inbox/conversations/${id}/ai-mode`,
    summary: (id: string) => `/api/tenant/inbox/conversations/${id}/summary`,
    transfer: (id: string) => `/api/tenant/inbox/conversations/${id}/transfer`,
    assign: (id: string) => `/api/tenant/inbox/conversations/${id}/assign`,
    stats: '/api/tenant/inbox/stats',
  },
  agenda: {
    appointments: '/api/tenant/agenda/appointments',
    appointment: (id: string) => `/api/tenant/agenda/appointments/${id}`,
    services: '/api/tenant/agenda/services',
    resources: '/api/tenant/agenda/resources',
    availability: '/api/tenant/agenda/availability',
  },
  mobile: {
    // MOCKED — a implementar por Claude/Grok en el SaaS
    registerDevice: '/api/tenant/mobile/register-device',
  },
} as const;

// Roles de tenant con visibilidad completa (owner+admin ven todos los leads/citas/convs del tenant).
// Los demás roles solo ven lo asignado a su user_id.
export const FULL_ACCESS_ROLES = ['tenant_owner', 'tenant_admin'] as const;
export const CAJERO_ROLE = 'tenant_cajero';

// Colores por canal de mensajería (para íconos de Inbox)
export const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  facebook_dm: '#0084FF',
  facebook_wall: '#1877F2',
  instagram_dm: '#E4405F',
  instagram_wall: '#C13584',
  linkedin_wall: '#0A66C2',
  email: '#64748B',
  voice_call: '#8B5CF6',
  sms: '#22C55E',
};

export const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook_dm: 'Messenger',
  facebook_wall: 'Facebook (muro)',
  instagram_dm: 'Instagram',
  instagram_wall: 'Instagram (muro)',
  linkedin_wall: 'LinkedIn',
  email: 'Email',
  voice_call: 'Llamada',
  sms: 'SMS',
};
