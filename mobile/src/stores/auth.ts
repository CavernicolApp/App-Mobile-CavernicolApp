// src/stores/auth.ts — Zustand store con lógica de permisos por rol
import { create } from 'zustand';
import type { AuthUser, TenantRole } from '@/types';
import { FULL_ACCESS_ROLES } from '@/constants/config';
import { fetchMe, login as apiLogin, logout as apiLogout, type LoginPayload } from '@/api/auth';
import { authEventBus, clearAuthTokens, getAccessToken } from '@/api/client';

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'checking' | 'unauthenticated' | 'authenticated' | 'mfa_required';
  challengeToken: string | null;
  error: string | null;

  // actions
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;

  // derived helpers (usados por UI para gating de features)
  hasFullTenantAccess: () => boolean;
  canSeeAllLeads: () => boolean;
  canSeeAllConversations: () => boolean;
  canSeeAllAppointments: () => boolean;
  canImpersonate: () => boolean;
  isCajero: () => boolean;
  assignedToFilter: () => string | undefined; // devuelve user_id si NO es owner/admin
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',
  challengeToken: null,
  error: null,

  bootstrap: async () => {
    set({ status: 'checking', error: null });
    const token = await getAccessToken();
    if (!token) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const user = await fetchMe();
      // Verificar que sea un usuario de tenant — nunca dejamos entrar a la
      // app móvil a un usuario de plataforma (super_admin, etc.)
      if (user.user_type !== 'tenant' || !user.tenant_id) {
        await clearAuthTokens();
        set({ status: 'unauthenticated', user: null, error: 'Esta app es solo para usuarios de negocio.' });
        return;
      }
      set({ user, status: 'authenticated' });
    } catch {
      await clearAuthTokens();
      set({ status: 'unauthenticated', user: null });
    }
  },

  login: async (payload) => {
    set({ status: 'checking', error: null });
    try {
      const res = await apiLogin(payload);
      if (res.kind === 'mfa_required') {
        set({ status: 'mfa_required', challengeToken: res.challenge_token });
        return;
      }
      const user = res.user;
      if (user.user_type !== 'tenant' || !user.tenant_id) {
        await clearAuthTokens();
        set({ status: 'unauthenticated', error: 'Esta app es solo para usuarios de negocio.' });
        return;
      }
      set({ user, status: 'authenticated', challengeToken: null, error: null });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      set({
        status: 'unauthenticated',
        error: err?.response?.data?.detail ?? err?.message ?? 'Error al iniciar sesión',
      });
    }
  },

  logout: async () => {
    await apiLogout();
    set({ user: null, status: 'unauthenticated', error: null, challengeToken: null });
  },

  refreshMe: async () => {
    try {
      const user = await fetchMe();
      set({ user });
    } catch {
      /* silent */
    }
  },

  // ---------------- helpers de permisos ----------------

  hasFullTenantAccess: () => {
    const role = get().user?.tenant_role as TenantRole | null | undefined;
    return !!role && (FULL_ACCESS_ROLES as readonly string[]).includes(role);
  },

  canSeeAllLeads: () => get().hasFullTenantAccess(),
  canSeeAllConversations: () => get().hasFullTenantAccess(),
  canSeeAllAppointments: () => get().hasFullTenantAccess(),
  canImpersonate: () => false, // nunca desde móvil

  isCajero: () => get().user?.tenant_role === 'tenant_cajero',

  /**
   * Devuelve el user_id para filtrar peticiones cuando el usuario NO es owner/admin.
   * Retorna undefined cuando debe ver todo del tenant.
   */
  assignedToFilter: () => {
    const s = get();
    if (s.hasFullTenantAccess()) return undefined;
    return s.user?.id;
  },
}));

// Global logout listener — cuando axios detecta 401 y no puede refresh, cierra sesión
authEventBus.on('logout', () => {
  useAuthStore.setState({ user: null, status: 'unauthenticated' });
});
