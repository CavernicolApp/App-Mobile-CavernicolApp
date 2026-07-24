// src/api/client.ts
// Cliente HTTP unificado — axios con interceptores de auth + refresh + error handling.
// Estrategia dual: Bearer token en Authorization header (móvil) + fallback a cookies.

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL, DEBUG } from '@/constants/config';

const TOKEN_KEY = 'ca_mobile_access_token';
const REFRESH_KEY = 'ca_mobile_refresh_token';
const DEVICE_ID_KEY = 'ca_mobile_device_id';

// ---------------- token storage ----------------
// SecureStore solo existe en iOS/Android. En web usamos localStorage como fallback
// (solo relevante para preview / desarrollo — la app real corre en móvil).

const IS_WEB = Platform.OS === 'web';

async function storageGet(key: string): Promise<string | null> {
  if (IS_WEB) {
    try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; } catch { return null; }
  }
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}

async function storageSet(key: string, value: string): Promise<void> {
  if (IS_WEB) {
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (IS_WEB) {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getAccessToken(): Promise<string | null> {
  return storageGet(TOKEN_KEY);
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (token) await storageSet(TOKEN_KEY, token);
  else await storageDelete(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return storageGet(REFRESH_KEY);
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (token) await storageSet(REFRESH_KEY, token);
  else await storageDelete(REFRESH_KEY);
}

export async function getDeviceId(): Promise<string> {
  let id = await storageGet(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await storageSet(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function clearAuthTokens(): Promise<void> {
  await setAccessToken(null);
  await setRefreshToken(null);
}

// ---------------- axios instance ----------------

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client': 'cavernicolapp-mobile/0.1.0',
  },
  withCredentials: false, // Bearer mode — no cookies auto en RN
});

// ---------- request interceptor: inyecta Authorization header ----------
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token && !config.headers?.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const deviceId = await getDeviceId();
  config.headers['X-Device-Id'] = deviceId;

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(`[API →] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// ---------- response interceptor: 401 → refresh o logout ----------
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function subscribeToRefresh(cb: (token: string | null) => void) {
  refreshQueue.push(cb);
}

function notifyRefreshed(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log(`[API ✗] ${error.response?.status ?? 'NET'} ${original?.url}`, error.response?.data);
    }

    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;

      if (isRefreshing) {
        // Espera al refresh en curso
        return new Promise((resolve, reject) => {
          subscribeToRefresh((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const refresh = await getRefreshToken();
        if (!refresh) throw new Error('no_refresh_token');

        // Endpoint /api/auth/refresh actualmente usa cookies. En cliente móvil,
        // reenviamos refresh como body (a coordinar con Grok/Claude para exponer
        // este contrato en el endpoint móvil dedicado).
        const resp = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refresh_token: refresh },
          { headers: { 'Content-Type': 'application/json', 'X-Client': 'cavernicolapp-mobile/0.1.0' } }
        );
        const newAccess: string | undefined = resp.data?.access_token;
        const newRefresh: string | undefined = resp.data?.refresh_token;
        if (!newAccess) throw new Error('no_new_access');

        await setAccessToken(newAccess);
        if (newRefresh) await setRefreshToken(newRefresh);

        notifyRefreshed(newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        notifyRefreshed(null);
        await clearAuthTokens();
        // Emit event para que el AuthStore haga logout global
        authEventBus.emit('logout');
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  }
);

// ---------------- Event bus para auth events (logout global) ----------------

type AuthEvent = 'logout' | 'token_refreshed';
const listeners: Partial<Record<AuthEvent, Array<() => void>>> = {};

export const authEventBus = {
  on(event: AuthEvent, cb: () => void) {
    (listeners[event] ??= []).push(cb);
    return () => {
      listeners[event] = listeners[event]?.filter((l) => l !== cb);
    };
  },
  emit(event: AuthEvent) {
    listeners[event]?.forEach((l) => l());
  },
};

// ---------------- helper ----------------
export function makeQueryString(params: Record<string, string | number | boolean | undefined | null> | object): string {
  const usp = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export async function requestGet<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const r = await api.get<T>(url, config);
  return r.data;
}
export async function requestPost<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const r = await api.post<T>(url, body, config);
  return r.data;
}
export async function requestPatch<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const r = await api.patch<T>(url, body, config);
  return r.data;
}
export async function requestPut<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const r = await api.put<T>(url, body, config);
  return r.data;
}
export async function requestDelete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const r = await api.delete<T>(url, config);
  return r.data;
}
