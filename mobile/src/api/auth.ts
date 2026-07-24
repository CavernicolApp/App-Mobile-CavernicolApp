// src/api/auth.ts
// Auth API — login / logout / me / refresh
// Nota: dual mode:
//   - MOCK_MODE: usa datos locales de demo, no llama al backend
//   - DEV_MODE: usa /api/auth/login sin turnstile (funciona solo si el SaaS en dev
//     deja pasar sin token, o si se agrega un flag TURNSTILE_DEV_BYPASS).
//   - PROD: espera que Grok/Claude expongan /api/mobile/auth/login que:
//     1) devuelve Bearer token + refresh en JSON
//     2) usa App Attest / Play Integrity en lugar de Turnstile
//     3) omite el requisito de CSRF header

import { API, DEV_MODE, MOCK_MODE } from '@/constants/config';
import type { AuthUser, LoginResponse, MfaRequiredResponse } from '@/types';
import { api, requestGet, requestPost, setAccessToken, setRefreshToken, clearAuthTokens } from './client';
import { MOCK_USERS, MOCK_PASSWORD } from './mockData';

export interface LoginPayload {
  email: string;
  password: string;
  /** Presente solo si el usuario resolvió MFA en un paso previo */
  mfa_token?: string;
  /** Turnstile (solo endpoint web). En móvil se omite si el backend expone el path mobile. */
  turnstile_token?: string;
}

export type LoginResult =
  | { kind: 'ok'; user: AuthUser }
  | { kind: 'mfa_required'; challenge_token: string };

/** Mock login: valida contra MOCK_USERS + MOCK_PASSWORD y guarda un token falso. */
async function mockLogin(payload: LoginPayload): Promise<LoginResult> {
  await new Promise((r) => setTimeout(r, 500)); // simula latencia
  const key = payload.email.trim().toLowerCase();
  const user = MOCK_USERS[key];
  if (!user || payload.password !== MOCK_PASSWORD) {
    throw new Error('Credenciales inválidas. Prueba con owner@demo.mx / demo123 o vendedor@demo.mx / demo123.');
  }
  await setAccessToken(`mock-token-${user.id}`);
  await setRefreshToken(`mock-refresh-${user.id}`);
  return { kind: 'ok', user };
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  if (MOCK_MODE) return mockLogin(payload);

  const path = DEV_MODE ? API.auth.login : API.auth.loginMobile;

  const resp = await api.post<LoginResponse | MfaRequiredResponse>(path, {
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    turnstile_token: payload.turnstile_token,
    mfa_token: payload.mfa_token,
    // Hint al backend de que el request viene de un cliente móvil (para que devuelva token en JSON)
    client: 'mobile',
  });

  const data = resp.data;

  if ('mfa_required' in data && data.mfa_required) {
    return { kind: 'mfa_required', challenge_token: data.challenge_token };
  }

  const loginData = data as LoginResponse;

  // Guardar tokens si el backend los envía (endpoint móvil dedicado o modo dev).
  if (loginData.access_token) {
    await setAccessToken(loginData.access_token);
  }
  // Refresh token — si el backend lo envía en body (contract futuro)
  const refresh = (data as { refresh_token?: string }).refresh_token;
  if (refresh) await setRefreshToken(refresh);

  return { kind: 'ok', user: loginData.user };
}

export async function fetchMe(): Promise<AuthUser> {
  if (MOCK_MODE) {
    // Devolver el user asociado al token guardado (extraer del prefijo)
    const { getAccessToken } = await import('./client');
    const t = await getAccessToken();
    const userId = t?.replace('mock-token-', '') ?? '';
    const user = Object.values(MOCK_USERS).find((u) => u.id === userId);
    if (!user) throw new Error('mock session expired');
    return user;
  }
  return requestGet<AuthUser>(API.auth.me);
}

export async function logout(): Promise<void> {
  if (!MOCK_MODE) {
    try {
      await requestPost(API.auth.logout);
    } catch {
      /* aunque falle el server, limpiamos local */
    }
  }
  await clearAuthTokens();
}

export async function pingActivity(): Promise<void> {
  if (MOCK_MODE) return;
  try {
    await requestPost(API.auth.activity);
  } catch {
    /* silent — solo mantiene sesión */
  }
}
