// src/types/index.ts
// Tipos compartidos que reflejan los schemas del SaaS (backend/app/schemas.py)

export type PlatformRole =
  | 'platform_owner_root'
  | 'super_admin_platform'
  | 'platform_admin'
  | 'platform_support'
  | 'billing_admin'
  | 'integration_admin'
  | 'security_admin'
  | 'qa_support_auditor';

export type TenantRole =
  | 'tenant_owner'
  | 'tenant_admin'
  | 'tenant_manager'
  | 'tenant_user'
  | 'tenant_cajero';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  user_type: 'tenant' | 'platform';
  platform_role: PlatformRole | null;
  tenant_id: string | null;
  tenant_role: TenantRole | null;
  is_active: boolean;
  timezone: string;   // e.g. "America/Mexico_City"
  locale: string;     // e.g. "es-MX"
  last_login_at: string | null;
  created_at: string;
}

export interface LoginResponse {
  user: AuthUser;
  session_expires_in_seconds?: number;
  inactivity_timeout_seconds?: number;
  // Solo presente si el backend expone endpoint móvil o modo dev:
  access_token?: string;
}

export interface MfaRequiredResponse {
  mfa_required: true;
  challenge_token: string;
}

// CRM
export type LeadStatus = 'new' | 'active' | 'won' | 'lost' | 'archived';

export interface Lead {
  id: string;
  tenant_id: string;
  display_name: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  status: LeadStatus;
  stage: string | null;
  source_type: string | null;
  source_name: string | null;
  campaign_name: string | null;
  channel: string | null;
  medium: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  pool_id: string | null;
  branch_id: string | null;
  contact_id: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  next_action_at: string | null;
  notes: string | null;
  score: number | null;
  vertical_data?: Record<string, unknown>;
}

export type DealStatus = 'open' | 'won' | 'lost';

export interface Deal {
  id: string;
  lead_id: string | null;
  contact_id: string;
  pipeline_id: string;
  stage_id: string;
  stage_key: string;
  stage_name: string;
  status: DealStatus;
  amount: number | null;
  currency: string;
  probability: number | null;
  expected_close_date: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  won_at: string | null;
  lost_at: string | null;
  loss_reason: string | null;
}

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_at: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  lead_id: string | null;
  deal_id: string | null;
  contact_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Contact {
  id: string;
  display_name: string;
  primary_phone: string | null;
  primary_email: string | null;
  primary_channel: string | null;
  created_at: string;
  last_seen_at: string | null;
  consent_status: 'opted_in' | 'opted_out' | 'unknown';
  tags: string[];
}

// Inbox
export type InboxChannel =
  | 'whatsapp'
  | 'facebook_dm'
  | 'facebook_wall'
  | 'instagram_dm'
  | 'instagram_wall'
  | 'linkedin_wall'
  | 'email'
  | 'voice_call'
  | 'sms';

export type AiMode = 'auto' | 'suggest' | 'disabled';
export type ConversationStatus = 'open' | 'closed' | 'archived';

export interface Conversation {
  id: string;
  tenant_id: string;
  channel: InboxChannel;
  contact_id: string;
  contact_name: string | null;
  contact_avatar: string | null;
  status: ConversationStatus;
  ai_mode: AiMode;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  last_message_at: string;
  last_message_preview: string;
  last_message_direction: 'inbound' | 'outbound';
  unread_count: number;
  root_comment_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface InboxMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  content_html: string | null;
  media_url: string | null;
  media_kind: 'image' | 'video' | 'audio' | 'document' | null;
  sender_kind: 'contact' | 'agent_human' | 'agent_ai' | 'system';
  sender_user_id: string | null;
  sender_name: string | null;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  error_message: string | null;
}

// Agenda
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  tenant_id: string;
  crm_lead_id: string | null;
  contact_id: string | null;
  contact_name: string | null;
  service_id: string | null;
  service_name: string | null;
  resource_id: string | null;
  resource_name: string | null;
  location_id: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  notes: string | null;
  price: number | null;
  currency: string | null;
  deposit_paid: boolean;
  created_at: string;
}

export interface AgendaService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  currency: string;
  color: string | null;
  active: boolean;
}

export interface AgendaResource {
  id: string;
  name: string;
  user_id: string | null;
  location_id: string | null;
  active: boolean;
}

// Disponibilidad de slots (GET /api/tenant/agenda/availability)
export interface AvailabilitySlot {
  start: string;              // ISO
  end: string;                // ISO
  available: boolean;
  resource_id: string | null;
}

export interface AvailabilityResponse {
  date: string;              // YYYY-MM-DD
  service_id: string | null;
  resource_id: string | null;
  slots: AvailabilitySlot[];
}

// Payload de creación (POST /api/tenant/agenda/appointments)
export interface CreateAppointmentPayload {
  crm_lead_id?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  service_id: string;
  resource_id?: string | null;
  starts_at: string;         // ISO
  ends_at: string;           // ISO
  notes?: string | null;
  assigned_to_user_id?: string | null;
}

// ---------------- Tarjeta Virtual (vCard compartible por QR / NFC) ----------------
export type CardSocialPlatform = 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'threads';

export interface CardSocial {
  platform: CardSocialPlatform;
  enabled: boolean;
  url: string;
}

export interface CardLink {
  id: string;
  label: string;
  sublabel: string;
  url: string;
  enabled: boolean;
  icon: string;              // nombre de ícono Ionicons
}

export interface CardCredential {
  id: string;
  title: string;
  year: string;
}

export interface VirtualCard {
  user_id: string;
  name: string;
  position: string;
  company: string;
  bio: string;
  phone: string;
  email: string;
  whatsapp: string;
  slug: string;
  socials: CardSocial[];
  links: CardLink[];
  credentials: CardCredential[];
}
