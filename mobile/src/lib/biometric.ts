// src/lib/biometric.ts
// Helpers para autenticación biométrica (Face ID / Touch ID / Huella).
// Guarda credenciales en SecureStore (Keychain iOS / Keystore Android) y las libera
// solo tras validar biometría — el usuario evita el slide-to-confirm.
//
// Web fallback: no-op. Mobile: usa expo-local-authentication + expo-secure-store.

import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'ca_biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'ca_biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'ca_biometric_password';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'generic' | 'none';

export interface BiometricAvailability {
  available: boolean;
  type: BiometricType;
  /** Etiqueta amigable localizada: "Face ID", "Touch ID", "Huella digital", "Reconocimiento facial". */
  label: string;
  /** Nombre del ícono Ionicons a mostrar. */
  iconName: 'scan-outline' | 'finger-print-outline' | 'eye-outline' | 'lock-closed-outline';
}

const NONE: BiometricAvailability = {
  available: false,
  type: 'none',
  label: '',
  iconName: 'lock-closed-outline',
};

/**
 * Detecta si el dispositivo tiene hardware biométrico + hay al menos una huella/rostro
 * enrolado por el usuario a nivel sistema operativo.
 */
export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  if (Platform.OS === 'web') return NONE;
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) return NONE;

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return {
        available: true,
        type: 'face',
        label: Platform.OS === 'ios' ? 'Face ID' : 'Reconocimiento facial',
        iconName: 'scan-outline',
      };
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return {
        available: true,
        type: 'fingerprint',
        label: Platform.OS === 'ios' ? 'Touch ID' : 'Huella digital',
        iconName: 'finger-print-outline',
      };
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return { available: true, type: 'iris', label: 'Iris', iconName: 'eye-outline' };
    }
    return { available: true, type: 'generic', label: 'Biometría', iconName: 'lock-closed-outline' };
  } catch {
    return NONE;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const v = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function enableBiometric(email: string, password: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
    await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

export async function disableBiometric(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  } catch {
    /* silent */
  }
}

export interface BiometricAuthResult {
  success: boolean;
  email?: string;
  password?: string;
  /** Solo presente en caso de fallo. Ej: 'user_cancel', 'lockout', 'unknown'. */
  error?: string;
  /** True cuando el usuario canceló explícitamente (para no mostrarle un error). */
  cancelled?: boolean;
}

/**
 * Solicita autenticación biométrica al usuario. Si es exitosa, recupera las
 * credenciales guardadas y las devuelve para que el store las use en login().
 */
export async function authenticateWithBiometric(
  promptMessage = 'Inicia sesión con biometría',
): Promise<BiometricAuthResult> {
  if (Platform.OS === 'web') return { success: false, error: 'No disponible en web' };
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      const err = 'error' in result ? result.error : 'unknown';
      return { success: false, error: err, cancelled: err === 'user_cancel' || err === 'system_cancel' };
    }

    const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
    if (!email || !password) {
      // Estado inconsistente: la flag está activa pero las creds se borraron.
      await disableBiometric();
      return { success: false, error: 'no_credentials' };
    }
    return { success: true, email, password };
  } catch {
    return { success: false, error: 'unknown' };
  }
}
